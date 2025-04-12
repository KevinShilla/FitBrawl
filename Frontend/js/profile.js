window.addEventListener("load", () => {
    const finalCount = parseInt(sessionStorage.getItem("finalCount"));
  
    if (!isNaN(finalCount)) {
      // Get current totals from localStorage
      const totalReps = parseInt(localStorage.getItem("totalReps") || "0");
      const maxReps = parseInt(localStorage.getItem("maxReps") || "0");
  
      // Update values
      const newTotal = totalReps + finalCount;
      const newMax = Math.max(maxReps, finalCount);
  
      // Save back to localStorage
      localStorage.setItem("totalReps", newTotal);
      localStorage.setItem("maxReps", newMax);
    }
  });
  