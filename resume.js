document.getElementById('download-btn').addEventListener('click', () => {
  const element = document.querySelector('.resume-container');

  // Clone the container to avoid altering the live page
  const clone = element.cloneNode(true);

  // Off-screen so it doesn't mess with layout
  clone.style.position = "absolute";
  clone.style.left = "-9999px";
  clone.style.width = "210mm"; // A4 width
  clone.style.display = "block";
  clone.style.background = "#FFFFFF"; // white page
  clone.style.color = "#000000"; // black text
  clone.style.padding = "0";
  clone.style.margin = "0";
  clone.style.boxShadow = "none";

  // Remove all Liquid Glass effects
  clone.querySelectorAll("*").forEach(el => {
    el.style.background = "transparent";
    el.style.color = "#000000";
    el.style.borderColor = "#000000";
    el.style.boxShadow = "none";
    el.style.textShadow = "none";
    el.style.filter = "none";
    el.style.backdropFilter = "none";
    el.style.borderRadius = "0"; // keep it clean and simple
  });

  // Add subtle separation lines for sections
  clone.querySelectorAll("section, .site-header").forEach(section => {
    section.style.borderBottom = "1px solid #000000";
    section.style.padding = "12px 0";
  });

  // Append off-screen
  document.body.appendChild(clone);

  // Generate PDF
  html2pdf().from(clone).set({
    margin: [10, 15, 10, 15], // top, left, bottom, right
    filename: 'Caleb_Kritzar_Resume.pdf',
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
  }).save().finally(() => {
    document.body.removeChild(clone); // clean up
  });
});
