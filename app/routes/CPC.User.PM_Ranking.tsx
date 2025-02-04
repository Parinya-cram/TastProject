import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import HeaderUser from './PartUser/headerUser';
import UserDetailIOT from './PartUser/UserdetailIOT';

const PM_Ranking = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({
    userName: '',
    useremail: '',
    userId: '',
    userphone: '',
    date: '',
  });
  const navigate = useNavigate();
  const db = getFirestore();

  const checkUserInFirestore = async (userId: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        console.log("User data:", docSnap.data());
      } else {
        console.log("No such user!");
        // Handle unregistered user here
      }
    } catch (error) {
      console.error("Error checking user:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setLoading(true);
      if (currentUser) {
        console.log('User logged in:', currentUser.email);
        const emailDomain = currentUser.email.split('@')[1];
        if (emailDomain === 'rmutto.ac.th') {
          setUser(currentUser);
          setUserData((prevState) => ({
            ...prevState,
            useremail: currentUser.email,
            userName: currentUser.displayName || '',
          }));
          const userRegistered = localStorage.getItem('userRegistered');
          if (!userRegistered) {
            checkUserInFirestore(currentUser.uid);
          }
        } else {
          navigate('/cpc/login');
        }
      } else {
        navigate('/cpc/login');
      }
      setLoading(false); // Ensure loading is set to false after all checks
    });

    return () => unsubscribe();
  }, [navigate]);

  if (loading) {
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

  return (
    <div className="bg-gray-100 min-h-screen">
      <HeaderUser />
      <div className="container mx-auto p-6">
        <UserDetailIOT />
      </div>
    </div>
  );
};

export default PM_Ranking;
