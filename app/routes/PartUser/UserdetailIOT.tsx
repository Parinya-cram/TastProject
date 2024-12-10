import { useState, useEffect } from 'react';
import axios from 'axios';
import IOTGPY2024 from './IOTGPY2024';

export default function UserDetailIOT() {
  const [iotData, setIotData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:3005/api/getIoTData');
        const filteredData = response.data.filter(
          (data: any) => data.pmId !== null && data.pmId !== undefined && data.status !== 'inactive'
        );
        setIotData(filteredData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching IoT data:', err);
        setError('ไม่สามารถดึงข้อมูล IoT ได้');
        setLoading(false);
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 1000);

    return () => clearInterval(intervalId);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
        <h2 className="text-2xl font-semibold text-indigo-600">กำลังโหลดข้อมูล...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
        <h2 className="text-2xl font-semibold text-red-600">{error}</h2>
      </div>
    );
  }

  // ฟังก์ชันสำหรับเลือกสีพื้นหลัง, สีฟอนต์ และสีไอคอนตามค่า PM2.5
  const getColors = (pmValue: number) => {
    if (pmValue < 1) {
      return {
        backgroundColor: 'bg-green-200', // ดี
        fontColor: 'text-green-800',
        iconColor: 'text-green-500'
      };
    } else if (pmValue >= 5 && pmValue < 15) {
      return {
        backgroundColor: 'bg-yellow-200', // ปานกลาง
        fontColor: 'text-yellow-800',
        iconColor: 'text-yellow-500'
      };
    } else {
      return {
        backgroundColor: 'bg-red-200', // ไม่ดี
        fontColor: 'text-red-800',
        iconColor: 'text-red-500'
      };
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-semibold text-indigo-600 text-center mb-8">
        คุณภาพอากาศ RMUTTO
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {iotData.map((data, index) => {
          const pm2_5 = data.PM2_5 || 0; // ใช้ค่า PM2.5 หรือ 0 ถ้าไม่มีค่า
          const { backgroundColor, fontColor, iconColor } = getColors(pm2_5);

          return (
            <div
              key={index}
              className={`rounded-lg shadow-lg p-6 space-y-4 text-gray-800 ${backgroundColor}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={`text-xl font-bold ${fontColor}`}>สถานที่: {data.address}</h2>
                  <p className="text-sm text-gray-500">
                    สถานะ: <span className={`font-medium ${iconColor}`}>{data.status || 'ปานกลาง'}</span>
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md ${iconColor}`}>
                  <span role="img" aria-label="profile" className="text-2xl">
                    👤
                  </span>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-gray-700 text-sm font-medium">สารมลพิษหลัก:</p>
                {/* แสดงข้อมูล PM2.5 ถ้ามีค่า */}
                {data.PM2_5 && (
                  <p className={`font-bold text-lg ${iconColor}`}>PM2.5: {data.PM2_5} µg/m³</p>
                )}
                {/* แสดงข้อมูล PM10 ถ้ามีค่า */}
                {data.PM10 && (
                  <p className={`text-sm ${iconColor}`}>PM10: {data.PM10} µg/m³</p>
                )}
                {/* แสดงข้อมูล PM1 ถ้ามีค่า */}
                {data.PM1 && (
                  <p className={`text-sm ${iconColor}`}>PM1: {data.PM1} µg/m³</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <IOTGPY2024/>
    </div>
  );
}
