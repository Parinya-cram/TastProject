import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "@remix-run/react";
import HeaderAdmin from "./PartAdmin/headerAdmin";
import SendEmail from "./PartAdmin/sendEmail";

const DetailUser = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usersData, setUsersData] = useState([]); // Array for multiple users
  const [openUserId, setOpenUserId] = useState(null); // For handling accordion state
  const [searchQuery, setSearchQuery] = useState(""); // For controlling the search input
  const navigate = useNavigate();
  const [adminId, setAdminId] = useState<string | null>(null);
  const [adminName, setAdminName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

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
            setAdminId(response.data.adminId);
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

  // Fetch user data from the API
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get("http://localhost:3005/api/getUser");
        if (response.status === 200) {
          const filteredUsers = response.data.filter(user => user.role === 'user');
          setUsersData(filteredUsers); // Store users with role = 'user'
          setIsLoading(false);
        } else {
          setError("Unable to fetch user data");
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Error fetching user data");
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Toggle accordion
  const toggleAccordion = (userId) => {
    setOpenUserId(openUserId === userId ? null : userId);
  };

  // Handle Delete action
  const handleDelete = (userId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this user?");
    if (confirmDelete) {
      const updatedUsersData = usersData.filter(user => user.id !== userId);
      setUsersData(updatedUsersData); // Optimistically remove user from state

      axios.delete(`http://localhost:3005/api/deleteUser/${userId}`)
        .then((response) => {
          if (response.status !== 200) {
            alert("Unable to delete user");
            setUsersData(usersData); // Revert optimistic update if necessary
          }
        })
        .catch((err) => {
          console.error("Error deleting user:", err);
          alert("Error deleting user");
          setUsersData(usersData); // Revert optimistic update if necessary
        });
    }
  };

  // Handle search input change
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  // Filter users based on the search query
  const filteredUsers = usersData.filter(user =>
    user.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.useremail.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.userId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Loading and error states
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

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderAdmin/>  {/* Admin header display */}
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
              
              {menuOpen && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white shadow-lg p-6 rounded-lg">
                    <h3 className="text-xl font-semibold text-indigo-700 mb-4">
                      Admin Information
                    </h3>
                    <div className="space-y-2">
                      <p className="text-gray-700">
                        <strong>ID:</strong> {adminId || "Loading..."}
                      </p>
                      <p className="text-gray-700">
                        <strong>Name:</strong> {adminName || "Loading..."}
                      </p>
                      <p className="text-gray-700">
                        <strong>Email:</strong> {email || "Loading..."}
                      </p>
                      <p className="text-gray-700">
                        <strong>Phone:</strong> {phone || "Loading..."}
                      </p>
                      <p className="text-gray-700">
                        <strong>Date:</strong> {date || "Loading..."}
                      </p>
                    </div>
                    <a
                      href={`/cpc/admin/editprofile/${adminId}`}
                      className="block mt-4 text-center text-indigo-500 font-semibold"
                    >
                      Edit Profile
                    </a>
                  </div>
                </div>
              )}
              <SendEmail/>
            </div>
            <h1 className="text-3xl font-semibold text-indigo-600 text-center mb-8">ข้อมูล Users ที่รับการแจ้งเตือน</h1>
      <div className="container mx-auto px-6 py-10">
        {/* Search input */}
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="กรอกข้อมูลเพื่อค้นหา"
          className="p-2 border border-gray-300 rounded-md mb-6"
        />

        {/* User data display */}
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <div key={user.id} className="bg-white shadow-lg p-6 rounded-lg mb-6">
              <h3
                className="text-xl font-semibold text-indigo-800 mb-4 cursor-pointer"
                onClick={() => toggleAccordion(user.id)} // Toggle accordion for user details
              >
                {user.userId} {openUserId === user.id ? "▲" : "▼"}
              </h3>
              {openUserId === user.id && (
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-800">Name:</span>
                    <span className="text-gray-700">{user.userName || "No name"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-800">Email:</span>
                    <span className="text-gray-700">{user.useremail || "No email"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-800">Phone:</span>
                    <span className="text-gray-700">{user.userphone || "No phone"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-800">Date:</span>
                    <span className="text-gray-700">{user.date || "No date"}</span>
                  </div>
                  <div className="mt-4 flex justify-between">
                    <button
                      onClick={() => handleEdit(user.id)}
                      className="bg-yellow-500 text-white px-4 py-2 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="bg-red-500 text-white px-4 py-2 rounded"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-center text-gray-600">ไม่มีข้อมูลผู้ใช้งาน</p>
        )}
      </div>
    </div>
  );
};

export default DetailUser;
