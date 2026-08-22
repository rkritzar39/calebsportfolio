// Minimal wiring for Live Activity example
(function () {
  const la = document.querySelector('.live-activity');
  const range = document.getElementById('progress-range');
  const accent = document.getElementById('accent-picker');
  const autoBtn = document.getElementById('auto-btn');
  const playToggle = document.getElementById('play-toggle');
  const artImg = document.getElementById('la-art-img');

  function progressPercent(val) { return Math.max(0, Math.min(100, Math.round(val))) + '%'; }

  function setLiveProgress(n) {
    la.style.setProperty('--la-progress-val', progressPercent(n));
    const pb = la.querySelector('[role="progressbar"]');
    if (pb) pb.setAttribute('aria-valuenow', Math.round(n));
    const knob = la.querySelector('.la-track .knob');
    if (knob) knob.style.left = `calc(${progressPercent(n)} - 6%)`;
    const prog = la.querySelector('.la-track .progress');
    if (prog) prog.style.width = progressPercent(n);
    const elapsed = la.querySelector('.la-time-elapsed');
    const remaining = la.querySelector('.la-time-remaining');
    if (elapsed) elapsed.textContent = formatTime(Math.round((n/100) * 180));
    if (remaining) remaining.textContent = '-' + formatTime(Math.max(0, 180 - Math.round((n/100) * 180)));
  }

  function setLiveAccent(color) {
    la.style.setProperty('--la-mode-accent', color);
  }

  function formatTime(sec) {
    const m = Math.floor(sec/60); const s = sec%60; return `${m}:${s.toString().padStart(2,'0')}`;
  }

  // slider hookup
  range.addEventListener('input', (e) => {
    setLiveProgress(e.target.value);
  });

  // color picker
  accent.addEventListener('input', (e) => {
    setLiveAccent(e.target.value);
  });

  // autoplay simulation
  let auto = false; let autoInterval = null;
  autoBtn.addEventListener('click', () => {
    auto = !auto;
    autoBtn.textContent = auto ? 'Stop' : 'Auto';
    if (auto) {
      autoInterval = setInterval(() => {
        const cur = parseInt(range.value, 10);
        const next = (cur + 1) % 101;
        range.value = next; range.dispatchEvent(new Event('input'));
      }, 800);
    } else {
      clearInterval(autoInterval); autoInterval = null;
    }
  });

  // simple play toggle (visual)
  let playing = true;
  playToggle.addEventListener('click', () => {
    playing = !playing;
    playToggle.textContent = playing ? '▶︎' : '▌▌';
  });

  // attempt to sample a dominant accent color from artwork (best-effort, may be blocked by CORS)
  function sampleAccentFromImg(imgEl) {
    try {
      const canvas = document.createElement('canvas');
      const w = canvas.width = 32; const h = canvas.height = 32;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(imgEl, 0, 0, w, h);
      const data = ctx.getImageData(0,0,w,h).data;
      let r=0,g=0,b=0,count=0;
      for (let i=0;i<data.length;i+=4) { const a = data[i+3]; if (a>64) { r+=data[i]; g+=data[i+1]; b+=data[i+2]; count++; } }
      if (count===0) return null; r=Math.round(r/count); g=Math.round(g/count); b=Math.round(b/count);
      return `rgb(${r},${g},${b})`;
    } catch (err) { return null; }
  }

  artImg.addEventListener('load', () => {
    const sample = sampleAccentFromImg(artImg);
    if (sample) { setLiveAccent(sample); accent.value = '#007aff'; /* keep picker stable */ }
  });

  // init
  setLiveProgress(parseInt(range.value,10));
  setLiveAccent(accent.value);
})();
