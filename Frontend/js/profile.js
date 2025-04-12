import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

const auth = getAuth();
const db = getDatabase();

document.addEventListener("DOMContentLoaded", () => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // User is signed in
      const userRef = ref(db, 'users/' + user.uid);

      get(userRef)
        .then((snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            // Ensure that username and stats are being correctly displayed
            const username = data.username || user.email || "Unknown";
            const totalReps = data.totalReps || 0;
            const maxReps = data.maxReps || 0;
            
            // Update the profile HTML
            document.getElementById("username").innerText = `Username: ${username}`;
            document.getElementById("totalReps").innerText = `Total Push-Ups: ${totalReps}`;
            document.getElementById("maxReps").innerText = `Max in One Match: ${maxReps}`;
          } else {
            // Handle case where no data is available
            console.log("No data available for this user.");
            document.getElementById("username").innerText = "No data available";
            document.getElementById("totalReps").innerText = "Total Push-Ups: N/A";
            document.getElementById("maxReps").innerText = "Max in One Match: N/A";
          }
        })
        .catch((error) => {
          console.error("Error fetching data: ", error);
          document.getElementById("username").innerText = "Error fetching data";
          document.getElementById("totalReps").innerText = "Error fetching data";
          document.getElementById("maxReps").innerText = "Error fetching data";
        });

    } else {
      // No user is signed in, redirect to login page
      window.location.href = "login.html";
    }
  });
});
