import React, { useEffect, useState } from 'react';
import { useParams } from '@remix-run/react';

interface DataRow {
  timestamp: string;
  PM2_5: number;
  PM1: number;
  PM10: number;
  sensorStatus: string;
}

interface HourlyGroup {
  label: string;     // a formatted hour (e.g. "15-8 14:00")
  averagePM25: number;
  count: number;
}

const Ranking: React.FC = () => {
  const { pmId } = useParams();
  const [data, setData] = useState<DataRow[]>([]);
  const [hourlyData, setHourlyData] = useState<HourlyGroup[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Log pmId for debugging
  useEffect(() => {
    console.log("pmId:", pmId);  // This should log the pmId to the console
  }, [pmId]);

  // Fetch data from the API (using your Google Script URL)
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const url = pmId
        ? `http://localhost:3005/api/getHistory/${pmId}` // Fetch data for specific pmId
        : 'https://script.google.com/macros/s/AKfycbzedteL-n4Yd_Vi2lb3GvqNVyi6aTb1finwVMSgy6GjJT_suRMqLe6ZHTfXJVES0JdsJQ/exec'; // Fetch data for all sensors
      const response = await fetch(url);
      const json = await response.json();
  
      const formattedData: DataRow[] = json.map((row: any) => ({
        timestamp: row[0],
        PM2_5: Number(row[2]),
        PM1: Number(row[1]),
        PM10: Number(row[3]),
        sensorStatus: row[4] || 'Unknown'
      }));
  
      setData(formattedData);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error fetching data.');
      setIsLoading(false);
    }
  };

  // Group the data by hour and compute the average PM2.5 for each hour.
  const groupDataByHour = (data: DataRow[]): HourlyGroup[] => {
    const groups: { [key: string]: { sum: number; count: number } } = {};
  
    data.forEach((row) => {
      const date = new Date(row.timestamp);
      
      if (isNaN(date.getTime())) {
        console.error('Invalid timestamp:', row.timestamp);
        return;
      }
      
      date.setMinutes(0, 0, 0);
      const groupKey = date.toISOString();
  
      if (!groups[groupKey]) {
        groups[groupKey] = { sum: 0, count: 0 };
      }
      groups[groupKey].sum += row.PM2_5;
      groups[groupKey].count += 1;
    });
  
    return Object.keys(groups).map((key) => {
      const { sum, count } = groups[key];
      const label = new Date(key).toLocaleString();
      return { label, averagePM25: sum / count, count };
    });
  };

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, [pmId]);

  // Update hourly data when raw data changes
  useEffect(() => {
    if (data.length > 0) {
      const hourlyGroups = groupDataByHour(data);
      hourlyGroups.sort((a, b) => b.averagePM25 - a.averagePM25);
      setHourlyData(hourlyGroups);
    }
  }, [data]);

  // Only display the most recent hour
  const latestHourlyData = hourlyData.length > 0 ? [hourlyData[0]] : [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-black">Loading ranking...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-4xl font-bold text-center mb-8 text-black">
        {pmId ? `PM2.5 Ranking for Sensor ${pmId}` : 'Hourly PM2.5 Ranking (Latest)'}
      </h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded-lg">
          <thead>
            <tr>
              <th className="py-3 px-6 bg-gray-200 font-bold uppercase text-sm text-gray-800">Rank</th>
              <th className="py-3 px-6 bg-gray-200 font-bold uppercase text-sm text-gray-800">Hour</th>
              <th className="py-3 px-6 bg-gray-200 font-bold uppercase text-sm text-gray-800">Average PM2.5</th>
              <th className="py-3 px-6 bg-gray-200 font-bold uppercase text-sm text-gray-800">Data Points</th>
            </tr>
          </thead>
          <tbody>
            {latestHourlyData.map((group, index) => (
                <tr key={group.label} className="border-b hover:bg-gray-100">
                <td className="py-4 px-6 text-center">{index + 1}</td> {/* Rank column */}
                <td className="py-4 px-6">{group.label}</td> {/* Hour column */}
                <td className="py-4 px-6 text-center">{group.averagePM25.toFixed(2)} µg/m³</td> {/* Average PM2.5 column */}
                <td className="py-4 px-6 text-center">{group.count}</td> {/* Data Points column */}
                <td className="py-4 px-6 text-center">{pmId}</td>
                </tr>
            ))}
            </tbody>
        </table>
      </div>
    </div>
  );
};

export default Ranking;
