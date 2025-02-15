import React, { useEffect, useState, useRef } from 'react';
import { useParams } from '@remix-run/react';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css"; 
import HeaderAdmin from './PartAdmin/headerAdmin';

Chart.register(...registerables);

const AdminDashboardIOT = () => {
  const { pmId } = useParams(); // ดึง pmId จาก URL
  const [data, setData] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [averagePM25, setAveragePM25] = useState(null);
  const [hourlyAverages, setHourlyAverages] = useState(null);
  const [dailyAverages, setDailyAverages] = useState(null);
  const chartRef = useRef(null);

  // Fetch data from the API
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const url = pmId 
        ? `http://localhost:3005/api/getHistory/${pmId}` 
        : 'http://localhost:3005/api/getHistory';
      const response = await fetch(url);
      const json = await response.json();
      
      // ตรวจสอบข้อมูลที่ได้รับจาก API
      console.log(json);

      // Format and sort data by timestamp
      const formattedData = json.map((row) => ({
        timestamp: row.timestamp,   // timestamp
        pm2_5: row.PM2_5,          // PM2.5
        pm1: row.PM1,              // PM1
        pm10: row.PM10,            // PM10
        sensorStatus: row.sensorStatus, // sensor status
      }))
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      setData(formattedData);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error fetching data.');
      setIsLoading(false);
    }
  };

  // Helper function: Filter data by selected date range
  const getFilteredData = () => {
    return data.filter((row) => {
      const rowDate = new Date(row.timestamp);
      const isDateInRange = (!startDate || rowDate >= new Date(startDate)) && 
                            (!endDate || rowDate <= new Date(endDate));
      return isDateInRange;
    });
  };

  useEffect(() => {
    fetchData();  // เรียกข้อมูลเมื่อ component ถูก mount
  }, []);

  useEffect(() => {
    if (data.length > 0) {
      // Filter data based on selected date range
      const filteredData = getFilteredData();

      const labels = filteredData.map((row) => row.timestamp);
      const pm2_5Data = filteredData.map((row) => row.pm2_5);
      const pm1Data = filteredData.map((row) => row.pm1);
      const pm10Data = filteredData.map((row) => row.pm10);

      // Calculate real-time average PM2.5
      const avgPM25 = pm2_5Data.reduce((acc, value) => acc + value, 0) / (pm2_5Data.length || 1);
      setAveragePM25(avgPM25);

      setChartData({
        labels,
        datasets: [
          {
            label: 'PM2.5 Data',
            data: pm2_5Data,
            fill: false,
            borderColor: 'rgba(75, 192, 192, 1)',
            tension: 0.1,
          },
          {
            label: 'PM1 Data',
            data: pm1Data,
            fill: false,
            borderColor: 'rgba(153, 102, 255, 1)',
            tension: 0.1,
          },
          {
            label: 'PM10 Data',
            data: pm10Data,
            fill: false,
            borderColor: 'rgba(255, 159, 64, 1)',
            tension: 0.1,
          },
        ],
      });
      
      // Clear previously computed averages when filters change
      setHourlyAverages(null);
      setDailyAverages(null);
    }
  }, [data, startDate, endDate]);

  // Compute Hourly Averages
  const computeHourlyAverages = () => {
    const filteredData = getFilteredData();
    const groups = {};

    filteredData.forEach(row => {
      const dateObj = new Date(row.timestamp);
      const year = dateObj.getFullYear();
      const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
      const date = dateObj.getDate().toString().padStart(2, '0');
      const hour = dateObj.getHours().toString().padStart(2, '0');
      const key = `${year}-${month}-${date} ${hour}:00`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(row);
    });

    const hourlyAvg = Object.entries(groups).map(([key, rows]) => {
      const avgPM25 = rows.reduce((acc, r) => acc + r.pm2_5, 0) / rows.length;
      const avgPM1 = rows.reduce((acc, r) => acc + r.pm1, 0) / rows.length;
      const avgPM10 = rows.reduce((acc, r) => acc + r.pm10, 0) / rows.length;
      return { time: key, avgPM25, avgPM1, avgPM10, count: rows.length };
    });

    // Sort the averages by time
    hourlyAvg.sort((a, b) => new Date(a.time) - new Date(b.time));
    setHourlyAverages(hourlyAvg);
  };

  // Compute Daily Averages
  const computeDailyAverages = () => {
    const filteredData = getFilteredData();
    const groups = {};

    filteredData.forEach(row => {
      const dateObj = new Date(row.timestamp);
      const year = dateObj.getFullYear();
      const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
      const date = dateObj.getDate().toString().padStart(2, '0');
      const key = `${year}-${month}-${date}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(row);
    });

    const dailyAvg = Object.entries(groups).map(([key, rows]) => {
      const avgPM25 = rows.reduce((acc, r) => acc + r.pm2_5, 0) / rows.length;
      const avgPM1 = rows.reduce((acc, r) => acc + r.pm1, 0) / rows.length;
      const avgPM10 = rows.reduce((acc, r) => acc + r.pm10, 0) / rows.length;
      return { date: key, avgPM25, avgPM1, avgPM10, count: rows.length };
    });

    // Sort the averages by date
    dailyAvg.sort((a, b) => new Date(a.date) - new Date(b.date));
    setDailyAverages(dailyAvg);
  };

  const handleRestart = () => {
    setStartDate(null);
    setEndDate(null);
    // Clear computed averages when restarting
    setHourlyAverages(null);
    setDailyAverages(null);
    fetchData(); // Refresh data when Restart is clicked
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50">
        <div className="flex items-center space-x-4">
          <svg
            className="animate-spin h-12 w-12 text-indigo-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 100 8v4a8 8 0 01-8-8z"
            ></path>
          </svg>
          <span className="text-indigo-600 text-lg font-semibold">กำลังโหลด...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return <p className="text-center text-red-500 text-xl">{error}</p>;
  }

  return (
    <>
      <HeaderAdmin/>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <h2 className="text-4xl font-semibold text-center mb-6 text-gray-800">PM2.5 Graph</h2>

        {/* Date Range Picker */}
        <div className="mb-8 flex justify-center space-x-4">
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            dateFormat="yyyy/MM/dd HH:mm"
            showTimeSelect
            timeFormat="HH:mm"
            className="border p-3 rounded-lg text-lg text-gray-700 shadow-md focus:ring-2 focus:ring-indigo-500"
            placeholderText="Select Start Date and Time"
          />
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            dateFormat="yyyy/MM/dd HH:mm"
            showTimeSelect
            timeFormat="HH:mm"
            className="border p-3 rounded-lg text-lg text-gray-700 shadow-md focus:ring-2 focus:ring-indigo-500"
            placeholderText="Select End Date and Time"
          />
        </div>

        {/* Display Real-time Average PM2.5 */}
        {averagePM25 !== null && (
          <div className="mb-6 flex justify-center">
            <div className="bg-white p-6 shadow-md rounded-lg text-center text-xl font-semibold text-gray-800">
              <p>Real-time Average PM2.5:</p>
              <p className="text-2xl text-indigo-600">{averagePM25.toFixed(2)} µg/m³</p>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex justify-center mb-8 space-x-4">
          <button
            onClick={handleRestart}
            className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 focus:outline-none transition duration-300 transform hover:scale-105"
          >
            Restart
          </button>
          <button
            onClick={computeHourlyAverages}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 focus:outline-none transition duration-300 transform hover:scale-105"
          >
            Show Hourly Averages
          </button>
          <button
            onClick={computeDailyAverages}
            className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 focus:outline-none transition duration-300 transform hover:scale-105"
          >
            Show Daily Averages
          </button>
        </div>

        {/* Chart display */}
        {chartData && (
          <div className="bg-white shadow-xl rounded-lg p-8">
            <Line
              ref={chartRef}
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  zoom: {
                    pan: {
                      enabled: true,
                      mode: 'xy',
                    },
                    zoom: {
                      wheel: {
                        enabled: true,
                      },
                      pinch: {
                        enabled: true,
                      },
                      mode: 'xy',
                    },
                  },
                },
              }}
              height={400}
            />
          </div>
        )}

        {/* Display Hourly Averages if available */}
        {hourlyAverages && (
          <div className="mt-8 bg-white p-6 shadow-md rounded-lg">
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">Hourly Averages</h3>
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="px-4 py-2 border">Time</th>
                  <th className="px-4 py-2 border">Avg PM2.5 (µg/m³)</th>
                  <th className="px-4 py-2 border">Avg PM1 (µg/m³)</th>
                  <th className="px-4 py-2 border">Avg PM10 (µg/m³)</th>
                  <th className="px-4 py-2 border">Count</th>
                </tr>
              </thead>
              <tbody>
                {hourlyAverages.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 border">{item.time}</td>
                    <td className="px-4 py-2 border">{item.avgPM25.toFixed(2)}</td>
                    <td className="px-4 py-2 border">{item.avgPM1.toFixed(2)}</td>
                    <td className="px-4 py-2 border">{item.avgPM10.toFixed(2)}</td>
                    <td className="px-4 py-2 border">{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Display Daily Averages if available */}
        {dailyAverages && (
          <div className="mt-8 bg-white p-6 shadow-md rounded-lg">
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">Daily Averages</h3>
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="px-4 py-2 border">Date</th>
                  <th className="px-4 py-2 border">Avg PM2.5 (µg/m³)</th>
                  <th className="px-4 py-2 border">Avg PM1 (µg/m³)</th>
                  <th className="px-4 py-2 border">Avg PM10 (µg/m³)</th>
                  <th className="px-4 py-2 border">Count</th>
                </tr>
              </thead>
              <tbody>
                {dailyAverages.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 border">{item.date}</td>
                    <td className="px-4 py-2 border">{item.avgPM25.toFixed(2)}</td>
                    <td className="px-4 py-2 border">{item.avgPM1.toFixed(2)}</td>
                    <td className="px-4 py-2 border">{item.avgPM10.toFixed(2)}</td>
                    <td className="px-4 py-2 border">{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Display Raw Data */}
        <div className="mt-8 bg-white p-6 shadow-md rounded-lg">
          <h3 className="text-2xl font-semibold text-gray-800">Raw Data</h3>
          <table className="min-w-full mt-4">
            <thead>
              <tr>
                <th className="px-4 py-2 border">Timestamp</th>
                <th className="px-4 py-2 border">PM2.5</th>
                <th className="px-4 py-2 border">PM1</th>
                <th className="px-4 py-2 border">PM10</th>
                <th className="px-4 py-2 border">Sensor Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={index}>
                  <td className="px-4 py-2 border">{row.timestamp}</td>
                  <td className="px-4 py-2 border">{row.pm2_5} µg/m³</td>
                  <td className="px-4 py-2 border">{row.pm1} µg/m³</td>
                  <td className="px-4 py-2 border">{row.pm10} µg/m³</td>
                  <td className="px-4 py-2 border">{row.sensorStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default AdminDashboardIOT;