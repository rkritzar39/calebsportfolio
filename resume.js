document.addEventListener("DOMContentLoaded", () => {

  const btn = document.getElementById("download-btn");
  if (!btn) return;

  btn.addEventListener("click", async () => {

    const original = document.querySelector(".resume-container");
    if (!original) return;

    const clone = original.cloneNode(true);

    /* ========================= */
    /* PAGE CONTAINER SETUP     */
    /* ========================= */

    clone.style.width = "210mm";
    clone.style.minHeight = "297mm";
    clone.style.background = "#ffffff";
    clone.style.color = "#000000";
    clone.style.padding = "12mm";
    clone.style.margin = "0";
    clone.style.boxShadow = "none";
    clone.style.position = "absolute";
    clone.style.left = "-9999px";

    /* ========================= */
    /* SAFE RESET (DO NOT BREAK LAYOUT) */
    /* ========================= */

    clone.querySelectorAll("*").forEach(el => {
      el.style.boxShadow = "none";
      el.style.textShadow = "none";
      el.style.filter = "none";
      el.style.backdropFilter = "none";
      el.style.transition = "none";
      el.style.animation = "none";

      // IMPORTANT FIX:
      // Do NOT force display:block or width:100%
      // This was breaking flex layouts in your version
    });

    /* ========================= */
    /* SECTION STRUCTURE FIX     */
    /* ========================= */

    clone.querySelectorAll("section, .site-header").forEach(section => {
      section.style.borderBottom = "1px solid #000";
      section.style.padding = "10px 0";
      section.style.pageBreakInside = "avoid";
    });

    /* ========================= */
    /* AVOID BREAKING JOB BLOCKS */
    /* ========================= */

    clone.querySelectorAll(".job, .education-item").forEach(el => {
      el.style.pageBreakInside = "avoid";
    });

    clone.querySelectorAll("ul, li").forEach(el => {
      el.style.pageBreakInside = "avoid";
    });

    /* ========================= */
    /* RENDER OFFSCREEN         */
    /* ========================= */

    document.body.appendChild(clone);

    try {
      await html2pdf().from(clone).set({
        margin: [10, 10, 10, 10],
        filename: "Caleb_Kritzar_Resume.pdf",
        html2canvas: {
          scale: 2,
          useCORS: true,
          scrollY: 0
        },
        jsPDF: {
          unit: "mm",
          format: "a4",
          orientation: "portrait"
        }
      }).save();
    } finally {
      document.body.removeChild(clone);
    }

  });

});
