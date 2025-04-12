// profile.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {getAuth,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import {getFirestore,doc,getDoc} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// Firebase config (use your real config here)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Get references to HTML elements
const usernameSpan = document.getElementById("username");
const totalRepsSpan = document.getElementById("totalReps");
const maxRepsSpan = document.getElementById("maxReps");

// Check if user is logged in
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      usernameSpan.textContent = data.username || "No username";
      totalRepsSpan.textContent = data.totalReps ?? 0;
      maxRepsSpan.textContent = data.maxReps ?? 0;
    } else {
      usernameSpan.textContent = "User data not found";
    }
  } else {
    // Redirect to login if not logged in
    window.location.href = "login.html";
  }
});
