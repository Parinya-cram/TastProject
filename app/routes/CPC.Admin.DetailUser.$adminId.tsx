import { useEffect, useState } from "react";
import { useNavigate } from "@remix-run/react";
import axios from "axios";
import HeaderAdmin from "./PartAdmin/headerAdmin";

const DetailUser = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [adminId, setAdminId] = useState<string | null>(null);
  const [adminName, setAdminName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // User data state
  const [userData, setUserData] = useState({
    userName: '',
    userEmail: '',
    userId: '',
    userPhone: '',
    userNotificationsEnabled: false,
    date: '',
  });

  useEffect(() => {
    const storedAdminId = localStorage.getItem("adminId");
    if (!storedAdminId) {
      navigate("/cpc/login");
    } else {
      setAdminId(storedAdminId);
    }
  }, [navigate]);

  useEffect(() => {
    if (!adminId) return;

    const checkAdminAccess = async () => {
      try {
        const response = await axios.get(`http://localhost:3005/api/getAdmin/${adminId}`);
        if (response.status === 200) {
          setAdminName(response.data.adminName);
          setEmail(response.data.email);
          setPhone(response.data.phone);
          setDate(response.data.date);
          setIsLoading(false);
        } else {
          setError("ไม่สามารถดึงข้อมูลผู้ดูแลระบบ");
        }
      } catch (err) {
        console.error("Error fetching admin:", err);
        setError("Error fetching admin data.");
        navigate("/cpc/login");
      }
    };

    checkAdminAccess();
  }, [adminId, navigate]);

  useEffect(() => {
    if (!userData.userId) return;

    const fetchUserData = async () => {
      try {
        const response = await axios.get(`http://localhost:3005/api/getUser/${userData.userId}`);
        console.log(response); // Log response to verify the data

        if (response.status === 200) {
          setUserData({
            ...userData,
            userName: response.data.userName,
            userEmail: response.data.userEmail,
            userPhone: response.data.userPhone,
            date: response.data.date,
            userNotificationsEnabled: response.data.userNotificationsEnabled,
          });
        } else {
          setError("ไม่สามารถดึงข้อมูลผู้ใช้");
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Error fetching user data.");
      }
    };

    fetchUserData();
  }, [userData.userId]);

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-100">
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
          <span className="text-indigo-600 text-xl font-medium">
            กรุณารอซักครู่ กำลังโหลดเนื้อหา...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  const handleLogout = () => {
    localStorage.removeItem("adminId");
    setTimeout(() => {
      navigate('/cpc/login');
    }, 1000);
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const handleNotificationToggle = async () => {
    try {
      const updatedUser = {
        ...userData,
        userNotificationsEnabled: !userData.userNotificationsEnabled,
      };

      const response = await axios.put(
        `http://localhost:3005/api/updateUser/${userData.userId}`,
        updatedUser
      );

      if (response.status === 200) {
        setUserData(updatedUser);
      }
    } catch (err) {
      console.error("Error updating user notifications:", err);
      setError("Failed to update notification settings.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <HeaderAdmin adminId={adminId} />
      <div className="container mx-auto px-6 py-10">
        <div className="flex items-center justify-between bg-white shadow-md p-6 rounded-lg">
          <div className="flex items-center space-x-4">
            <h1
              className="text-2xl font-bold text-indigo-600 cursor-pointer flex items-center"
              onClick={toggleMenu}
            >
              {adminName || "Loading..."}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#4F46E5"
                className="ml-2"
              >
                <path d="M480-360 280-560h400L480-360Z" />
              </svg>
            </h1>
            <span className="bg-indigo-100 text-indigo-800 px-4 py-2 rounded-full text-sm">
              Admin
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition duration-200"
            title="Logout"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 24 24"
              className="w-6 h-6"
            >
              <path
                d="M16 13v-2H7V9h9V7l5 4-5 4zm-2 7H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8V2H6C4.346 2 3 3.346 3 5v14c0 1.654 1.346 3 3 3h8v-2z"
              />
            </svg>
          </button>
        </div>

        {/* User Information Row */}
        <div className="bg-white shadow-lg p-6 rounded-lg mt-6">
          <h3 className="text-xl font-semibold text-indigo-700 mb-4">User Information</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="font-semibold text-gray-700">Name:</span>
              <span>{userData.userName || "Loading..."}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-gray-700">Email:</span>
              <span>{userData.userEmail || "Loading..."}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-gray-700">Phone:</span>
              <span>{userData.userPhone || "Loading..."}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-gray-700">Date:</span>
              <span>{userData.date || "Loading..."}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-700">Notifications:</span>
              <button
                onClick={handleNotificationToggle}
                className={`px-4 py-2 rounded-full ${
                  userData.userNotificationsEnabled
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-300 text-gray-700"
                }`}
              >
                {userData.userNotificationsEnabled
                  ? "Disable Notifications"
                  : "Enable Notifications"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailUser;
