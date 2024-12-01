import React, { useEffect, useState, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import DatePicker from 'react-datepicker';  // Import DatePicker
import "react-datepicker/dist/react-datepicker.css"; // Import CSS for DatePicker
import HeaderUser from './PartUser/headerUser';

Chart.register(...registerables); // Register core Chart.js modules

const UserDashboardIOT = () => {
  const [data, setData] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(null); // Start date for comparison
  const [endDate, setEndDate] = useState(null); // End date for comparison
  const [averagePM25, setAveragePM25] = useState(null); // Real-time average PM2.5
  const chartRef = useRef(null);  // Create a reference for the chart

  // Fetch data from API
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        'https://script.google.com/macros/s/AKfycbzedteL-n4Yd_Vi2lb3GvqNVyi6aTb1finwVMSgy6GjJT_suRMqLe6ZHTfXJVES0JdsJQ/exec'
      );
      const json = await response.json();
      const formattedData = json.map((row) => ({
        timestamp: row[0], // timestamp is the first field
        pm2_5: row[2],     // pm2_5 is the third field
      }));
      setData(formattedData);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error fetching data.');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Dynamic import for `chartjs-plugin-zoom`
    if (typeof window !== 'undefined') {
      import('chartjs-plugin-zoom').then((zoomPlugin) => {
        Chart.register(zoomPlugin.default); // Register zoom plugin
      }).catch((err) => console.error('Error loading chartjs-plugin-zoom:', err));
    }
    fetchData();  // Fetch data when component mounts
  }, []);

  useEffect(() => {
    if (data.length > 0) {
      // If date range is selected, filter data
      const filteredData = data.filter((row) => {
        const rowDate = new Date(row.timestamp);
        
        // Check if date is within the selected range
        const isDateInRange = (!startDate || rowDate >= new Date(startDate)) && 
                              (!endDate || rowDate <= new Date(endDate));

        return isDateInRange;
      });

      const labels = filteredData.map((row) => row.timestamp);
      const pm2_5Data = filteredData.map((row) => row.pm2_5);

      // Calculate the real-time average of PM2.5
      const avgPM25 = pm2_5Data.reduce((acc, value) => acc + value, 0) / pm2_5Data.length;
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
        ],
      });
    }
  }, [data, startDate, endDate]); // Recalculate chart data when filters change

  const handleRestart = () => {
    setStartDate(null);
    setEndDate(null);
    fetchData(); // Refetch data when restart is clicked
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
      <HeaderUser/>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
      
      <h2 className="text-4xl font-semibold text-center mb-6 text-gray-800">PM2.5 Graph</h2>

      {/* Date Range Picker with Time */}
      <div className="mb-8 flex justify-center space-x-4">
        <DatePicker
          selected={startDate}
          onChange={(date) => setStartDate(date)}  // Set start date for comparison
          dateFormat="yyyy/MM/dd HH:mm"
          showTimeSelect
          timeFormat="HH:mm"
          className="border p-3 rounded-lg text-lg text-gray-700 shadow-md focus:ring-2 focus:ring-indigo-500"
          placeholderText="Select Start Date and Time"
        />
        <DatePicker
          selected={endDate}
          onChange={(date) => setEndDate(date)}  // Set end date for comparison
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
      </div>

      {/* Chart display */}
      {chartData && (
        <div className="bg-white shadow-xl rounded-lg p-8">
          <Line
            ref={chartRef}  // Set the chart reference
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                zoom: {
                  pan: {
                    enabled: true,
                    mode: 'xy',  // Enable panning in both x and y directions
                  },
                  zoom: {
                    wheel: {
                      enabled: true, // Enable zooming with mouse wheel
                    },
                    pinch: {
                      enabled: true, // Enable pinch to zoom on touch devices
                    },
                    mode: 'xy',  // Enable zooming in both x and y directions
                  },
                },
              },
            }}
            height={400}  // Set height of chart for better visibility
          />
        </div>
      )}
    </div>
    </>
  );
};
export default UserDashboardIOT;
