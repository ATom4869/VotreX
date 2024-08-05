// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { collection, addDoc } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDrM_ATGLfMDkBFLujJYjRLIvjIyVtNlcs",
    authDomain: "votrex-40f16.firebaseapp.com",
    projectId: "votrex-40f16",
    storageBucket: "votrex-40f16.appspot.com",
    messagingSenderId: "566978215684",
    appId: "1:566978215684:web:08843254306c5e7861da51",
    measurementId: "G-73TKE9G5ZD"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage, analytics };
