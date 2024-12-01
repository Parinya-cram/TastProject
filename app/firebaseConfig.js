// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyAsPB4J8jwrhZC1pY38IDscSdWUemovr28",
    authDomain: "cpc-pm-742f8.firebaseapp.com",
    projectId: "cpc-pm-742f8",
    storageBucket: "cpc-pm-742f8.firebasestorage.app",
    messagingSenderId: "49604411079",
    appId: "1:49604411079:web:28e6da744cfe877f3ec8e2",
    measurementId: "G-JDBM8FWTYN"
  };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
