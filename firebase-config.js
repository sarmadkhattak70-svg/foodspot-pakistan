// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA_UtSjGmcyyW0UV_npms2y1KSWKD7aX6k",
  authDomain: "foodspot-pakistan.firebaseapp.com",
  projectId: "foodspot-pakistan",
  storageBucket: "foodspot-pakistan.firebasestorage.app",
  messagingSenderId: "730784491956",
  appId: "1:730784491956:web:1a856fc28ef74a5154eae1",
  measurementId: "G-JT68JNNT93"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);