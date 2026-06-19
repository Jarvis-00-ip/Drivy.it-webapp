import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCYwczJCuIQMla0Yfoq2lcoIb8JXkfTvmc",
  authDomain: "scuolaguida-9a263.firebaseapp.com",
  projectId: "scuolaguida-9a263",
  storageBucket: "scuolaguida-9a263.firebasestorage.app",
  messagingSenderId: "492319405162",
  appId: "1:492319405162:web:08ffbc17916cd223cd4613",
  measurementId: "G-YRG1MWRXEP"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
