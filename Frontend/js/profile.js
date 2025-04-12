window.addEventListener("load", () => {
    // Optional: Save final count to totals if coming from a game
    const finalCount = parseInt(sessionStorage.getItem("finalCount"));
  
    if (!isNaN(finalCount)) {
      const totalReps = parseInt(localStorage.getItem("totalReps") || "0");
      const maxReps = parseInt(localStorage.getItem("maxReps") || "0");
  
      const newTotal = totalReps + finalCount;
      const newMax = Math.max(maxReps, finalCount);
  
      localStorage.setItem("totalReps", newTotal);
      localStorage.setItem("maxReps", newMax);
  
      sessionStorage.removeItem("finalCount"); // Clear after saving
    }
  
    // Display the stats
    const savedTotal = localStorage.getItem("totalReps") || "0";
    const savedMax = localStorage.getItem("maxReps") || "0";
  
    document.getElementById("totalReps").innerText = `Total Push-Ups: ${savedTotal}`;
    document.getElementById("maxReps").innerText = `Max in One Match: ${savedMax}`;
  });
  