import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaInfoCircle } from 'react-icons/fa';

export default function UserDetailIOT() {
  const [iotData, setIotData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true); // สำหรับแสดงสถานะการโหลด
  const [error, setError] = useState<string | null>(null); // สำหรับจัดการข้อผิดพลาด
  const navigate = useNavigate();

  // ดึงข้อมูล IoT จาก API เมื่อโหลดหน้า และรีเฟรชทุก 1 วินาที
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:3005/api/getIoTData');
        // กรองข้อมูลที่ pmId ไม่เป็น null หรือ undefined และที่สถานะไม่เป็น 'inactive' หรือ 'deactivate'
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

    // เรียกใช้ฟังก์ชัน fetchData ทันทีเมื่อโหลดหน้า และทุกๆ 1 วินาที
    fetchData();
    const intervalId = setInterval(fetchData, 1000); // รีเฟรชข้อมูลทุก 1 วินาที

    // ล้าง interval เมื่อคอมโพเนนต์ถูก unmount
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

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-semibold text-indigo-600 text-center mb-8">Dashboard</h1>
      
      {/* Render IoT Data in Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {iotData.map((data, index) => (
          <div key={index} className="bg-white rounded-lg shadow-lg p-6 space-y-4">
            <h4 className="text-xl font-medium text-indigo-600">ชื่ออุปกรณ์: {data.pmId}</h4>
            <h3 className="text-xl font-medium text-indigo-600">สถานที่: {data.address}</h3>
            <div className="text-gray-500">
              <h4 className="font-semibold text-lg text-indigo-600">IoT Data</h4>
              <ul className="space-y-2">
                {data.PM1 && (
                  <li className="flex justify-between">
                    <span className="text-sm">PM1</span>
                    <span className="font-medium text-indigo-700">{data.PM1}</span>
                  </li>
                )}
                {data.PM10 && (
                  <li className="flex justify-between">
                    <span className="text-sm">PM10</span>
                    <span className="font-medium text-indigo-700">{data.PM10}</span>
                  </li>
                )}
                {data.PM2_5 && (
                  <li className="flex justify-between">
                    <span className="text-sm">PM2_5</span>
                    <span className="font-medium text-indigo-700">{data.PM2_5}</span>
                  </li>
                )}
              </ul>
            </div>

            {/* Detail Button with Animated Icon */}
            <button
              onClick={() => navigate(`/cpc/user/dashboardiot/${data.pmId}`)} // Navigate to the IoT detail page with pmId
              className="flex items-center justify-center bg-indigo-600 text-white p-3 rounded-full hover:bg-indigo-700 transform transition-transform duration-300 hover:scale-105 shadow-lg hover:shadow-xl mt-4"
            >
              <FaInfoCircle size={20} className="mr-2 animate-pulse" />
              <span className="text-sm font-medium">View Detail</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
