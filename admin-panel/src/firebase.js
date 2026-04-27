import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; //
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCobYLjSIRK9ua0MQ2UxsNfOstYcBYugDk",
  authDomain: "class-management-system-1912.firebaseapp.com",
  projectId: "class-management-system-1912",
  storageBucket: "class-management-system-1912.firebasestorage.app",
  messagingSenderId: "317825896895",
  appId: "1:317825896895:web:692742f044bb941365910a"
};

const app = initializeApp(firebaseConfig);

// Ensure BOTH of these are exported
export const auth = getAuth(app); //
export const db = getFirestore(app);