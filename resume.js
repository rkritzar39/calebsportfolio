// Set current year
const yearEl = document.getElementById('current-year');
if(yearEl) yearEl.textContent = new Date().getFullYear();

// PDF Download
document.getElementById('download-pdf').addEventListener('click', () => {
  const element = document.getElementById('resume-content');
  const opt = {
    margin:       0.5,
    filename:     'Caleb_Kritzar_Resume.pdf',
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2 },
    jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
  };
  html2pdf().set(opt).from(element).save();
});
