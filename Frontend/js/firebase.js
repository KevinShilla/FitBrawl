import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";  // Firebase Realtime Database
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

// Your web app's Firebase configuration
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
const realtimeDb = getDatabase(app);

document.addEventListener("DOMContentLoaded", () => {
  // Signup
  const signupForm = document.getElementById("signup-form");
  if (signupForm) {
    signupForm.addEventListener("submit", function (event) {
      event.preventDefault();

      const email = document.getElementById("signup-email").value;
      const password = document.getElementById("signup-password").value;
      const username = document.getElementById("signup-username").value;

      // Create user with Firebase Authentication
      createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          const user = userCredential.user;

          // Store user data in Firestore
          return setDoc(doc(db, "users", user.uid), {
            username: username,
            email: email,
            totalReps: 0,  // Default value for total reps
            maxReps: 0     // Default value for max reps
          })
          .then(() => {
            // Optionally, store the data in Firebase Realtime Database for real-time updates
            const userRef = ref(realtimeDb, 'users/' + user.uid);
            return set(userRef, {
              username: username,
              email: email,
              totalReps: 0,  // Default value for total reps
              maxReps: 0     // Default value for max reps
            });
          })
        })
        .then(() => {
          // Redirect to profile after successful signup
          window.location.href = "profile.html";
        })
        .catch((error) => {
          alert(error.message);
        });
    });
  }

  // Login
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", function (event) {
      event.preventDefault();

      const email = document.getElementById("login-email").value;
      const password = document.getElementById("login-password").value;

      signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          // Login successful
          window.location.href = "Home.html";
        })
        .catch((error) => {
          alert("Login failed: " + error.message);
        });
    });
  }
});
