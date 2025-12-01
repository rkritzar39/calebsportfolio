document.addEventListener("DOMContentLoaded", () => {
  const button = document.getElementById("download-pdf");
  const element = document.getElementById("resume-content");

  if(button && element){
    button.addEventListener("click", () => {
      const opt = {
        margin:       0.5,
        filename:     'Caleb_Kritzar_Resume.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
      };
      html2pdf().set(opt).from(element).save();
    });
  }
});
