// profile.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";  // Firebase Realtime Database
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

// Firebase config (use your real config here)
const firebaseConfig = {
    apiKey: "AIzaSyAJI39HjB8F7irBAkRI5MPNn2AILIufTiU",
    authDomain: "fitbrawl.firebaseapp.com",
    projectId: "fitbrawl",
    storageBucket: "fitbrawl.firebasestorage.app",
    messagingSenderId: "584708689415",
    appId: "1:584708689415:web:8ec4a241fee962df5ae4a2"
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