import { useEffect, useState } from "react";
import { IoMdNotificationsOutline } from "react-icons/io";
import axios from "axios";

interface IoTDevice {
  pmId: string;
  location: string;
  timestamp: string;
  status: string;
}

interface User {
  userId: string;
  userName: string;
  useremail: string;
}

export default function PMMonitorPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [pmData, setPmData] = useState([]);
  const [pmId, setPmId] = useState("");
  const [loading, setLoading] = useState(false);
  const [iotData, setIotData] = useState<IoTDevice[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState("");

  // ดึงข้อมูล IoT
  useEffect(() => {
    const fetchIoTData = async () => {
      try {
        const response = await axios.get("http://localhost:3005/api/getIoTData");
        setIotData(response.data);
      } catch (error) {
        console.error("Error fetching IoT data:", error.message);
      }
    };
    fetchIoTData();
  }, []);

  // ดึงข้อมูลผู้ใช้
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("http://localhost:3005/api/getUser");
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, []);

  // ดึงข้อมูล PM2.5 ตาม pmId
  useEffect(() => {
    if (!pmId) return;
    const fetchPMData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:3005/api/getHistorys/${pmId}`);
        const data = await response.json();
        setPmData(data);
      } catch (error) {
        console.error("Error fetching PM data:", error);
      }
      setLoading(false);
    };
    fetchPMData();
  }, [pmId, selectedUser]);

  // ฟังก์ชันส่งอีเมลแจ้งเตือน
  const sendEmail = async () => {
    if (selectedUser.length === 0 || pmData.length === 0) {
      alert("กรุณาเลือกผู้ใช้และดึงข้อมูล PM2.5 ก่อน!");
      return;
    }
  
    // แปลง timestamp เป็นโซนเวลาไทย และเลือกค่าล่าสุด
    const latestPM = pmData
      .map(item => ({
        ...item,
        timestamp: new Date(item.timestamp).toLocaleString("th-TH", {
          timeZone: "Asia/Bangkok",
        }),
      }))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]; // ค่าล่าสุด
  
    if (!latestPM) {
      alert("❌ ไม่พบข้อมูล PM2.5 ล่าสุด!");
      return;
    }
  
    // 🔹 ข้อความที่ต้องส่ง
    const pmDataText = `📅 วันที่: ${latestPM.timestamp}, 🕒 เวลา: ${latestPM.hour}, ค่าเฉลี่ย: ${latestPM.avgPM}`;
  
    setLoading(true);
    try {
      await fetch("http://localhost:3005/api/sendemail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          useremail: selectedUser,
          pmId,
          pmData: pmDataText, // 🔹 ส่งแค่ค่าล่าสุด
        }),
      });
      alert("✅ ส่งอีเมลสำเร็จ!");
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการส่งอีเมล:", error);
    }
    setLoading(false);
  };

  return (
    <>
      {/* 🔔 ปุ่มแจ้งเตือน */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-5 z-50 bg-purple-600 text-white p-4 rounded-full shadow-lg hover:bg-purple-700 transition-all duration-300"
      >
        <IoMdNotificationsOutline size={30} />
      </button>

      {/* 📌 ป๊อปอัพแจ้งเตือน */}
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm z-50">
          <div className="bg-white shadow-2xl rounded-2xl p-5 w-80 transform transition-all duration-300 scale-100 opacity-100">
            <h1 className="text-2xl font-bold text-purple-800 text-center mb-5">📡 PM2.5 Monitoring</h1>

            {/* 🔻 เลือกเซ็นเซอร์ PM2.5 */}
            <select
              className="w-full mb-4 p-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={pmId}
              onChange={(e) => setPmId(e.target.value)}
            >
              <option value="">เลือก PM2.5 Sensor</option>
              {iotData.map((sensor) => (
                <option key={sensor.pmId} value={sensor.pmId}>
                  {sensor.pmId} ({sensor.location})
                </option>
              ))}
            </select>

            {/* 📊 ปุ่มดึงข้อมูล PM2.5 */}
            <button
              onClick={() => {}}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-xl transition duration-300"
            >
              {loading ? "⏳ กำลังโหลด..." : "📊 ดึงข้อมูล PM2.5"}
            </button>

            {/* 📈 แสดงข้อมูล PM2.5 */}
            {pmData.length > 0 && (
              <div className="mt-4 p-4 bg-purple-100 border border-purple-300 rounded-lg">
                <p className="text-xl font-semibold text-purple-700 text-center">ค่าเฉลี่ย PM2.5 รายชั่วโมง</p>
                {pmData.map((item, index) => (
                  <p key={index} className="text-lg font-medium text-red-600">
                    🕒 {item.hour} - {item.avgPM}
                  </p>
                ))}
              </div>
            )}

            {/* 👤 Dropdown เลือกผู้ใช้ */}
            <h2 className="text-lg font-semibold text-gray-700 mt-6">👤 เลือกผู้ใช้</h2>

            <button
              onClick={() => setSelectedUser(users.map((user) => user.useremail))}
              className="w-full mb-2 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-xl transition duration-300"
            >
              ✅ เลือกทั้งหมด
            </button>

            <button
              onClick={() => setSelectedUser([])}
              className="w-full mb-2 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-xl transition duration-300"
            >
              ❌ ล้างการเลือก
            </button>

            <select
              multiple
              className="w-full mt-2 p-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              onChange={(e) =>
                setSelectedUser(Array.from(e.target.selectedOptions, (option) => option.value))
              }
            >
              {users.map((user) => (
                <option key={user.userId} value={user.useremail}>
                  {user.userName} ({user.useremail})
                </option>
              ))}
            </select>
            {/* 📧 ปุ่มส่งอีเมล */}
            <button
              onClick={sendEmail}
              className="w-full mt-4 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-xl transition duration-300"
            >
              {loading ? "⏳ กำลังส่ง..." : "📧 ส่งอีเมลแจ้งเตือน"}
            </button>

            {/* ❌ ปุ่มปิดป๊อปอัพ */}
            <button
              onClick={() => setIsOpen(false)}
              className="w-full mt-4 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-xl transition duration-300"
            >
              ❌ ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}
    </>
  );
}
