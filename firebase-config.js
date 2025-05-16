// firebase-config.js

// Import functions from the Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
// Do not import getFirestore if not using Firestore

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBwKsOD0s6JYzXNyE1xwcaF155MYDGsc8E", // Your actual API key
    authDomain: "innovators--compass-login.firebaseapp.com",
    projectId: "innovators--compass-login",
    storageBucket: "innovators--compass-login.appspot.com",
    messagingSenderId: "1060094757345",
    appId: "1:1060094757345:web:30a91613703a56a09eeaa0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

// Do not initialize Firestore if not using it
// const db = getFirestore(app);

// Export only the auth service
export { auth };
