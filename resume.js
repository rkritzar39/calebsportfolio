document.getElementById('download-btn').addEventListener('click', () => {
  const original = document.querySelector('.resume-container');

  // Clone the container for printing
  const clone = original.cloneNode(true);

  // Basic page styling
  clone.style.width = "210mm";   // A4 width
  clone.style.minHeight = "297mm"; // A4 height
  clone.style.background = "#FFFFFF"; // white background
  clone.style.color = "#000000";     // black text
  clone.style.padding = "0";
  clone.style.margin = "0";
  clone.style.boxShadow = "none";
  clone.style.overflow = "visible";
  clone.style.position = "absolute";
  clone.style.left = "-9999px"; // offscreen

  // Remove Liquid Glass & colors from all child elements
  clone.querySelectorAll("*").forEach(el => {
    el.style.background = "transparent";
    el.style.color = "#000000";
    el.style.borderColor = "#000000";
    el.style.boxShadow = "none";
    el.style.textShadow = "none";
    el.style.filter = "none";
    el.style.backdropFilter = "none";
    el.style.borderRadius = "0";
    el.style.display = "block";
    el.style.width = "100%";
    el.style.padding = "0"; // reset padding for cleaner PDF
    el.style.margin = "0"; // reset margin
  });

  // Add clear separation lines for sections and header
  clone.querySelectorAll("section, .site-header").forEach(section => {
    section.style.borderBottom = "1px solid #000000";
    section.style.padding = "12px 0";
    section.style.pageBreakInside = "avoid"; // prevent section split
    section.style.pageBreakAfter = "auto";
  });

  // Prevent items from breaking mid-element
  clone.querySelectorAll(".job, .education-item, .skills-list span, .languages-list span, ul li").forEach(el => {
    el.style.pageBreakInside = "avoid";
  });

  // Append off-screen for html2pdf to render
  document.body.appendChild(clone);

  html2pdf().from(clone).set({
    margin: [10, 15, 10, 15], // top, left, bottom, right
    filename: 'Caleb_Kritzar_Resume.pdf',
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
  }).save().finally(() => {
    document.body.removeChild(clone);
  });
});
