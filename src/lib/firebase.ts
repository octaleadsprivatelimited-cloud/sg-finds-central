import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TODO: Replace with your Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyAAK5BjjneJNK0dgixsLfeR0x4NjBg818Y",
  authDomain: "findlocalsg-d1587.firebaseapp.com",
  projectId: "findlocalsg-d1587",
  storageBucket: "findlocalsg-d1587.firebasestorage.app",
  messagingSenderId: "823101085428",
  appId: "1:823101085428:web:3d911bfcf266387e8a30a1",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
