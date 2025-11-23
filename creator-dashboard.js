// creator-dashboard.js — Firestore-powered Creator Dashboard
// Includes loading indicator and Firestore fetch timing

// -----------------------------
// Firebase config
// -----------------------------
const firebaseConfig = {
  apiKey: "AIzaSyCIZ0fri5V1E2si1xXpBPQQJqj1F_KuuG0",
  authDomain: "busarmydudewebsite.firebaseapp.com",
  projectId: "busarmydudewebsite",
  storageBucket: "busarmydudewebsite.firebasestorage.app",
  messagingSenderId: "42980404680",
  appId: "1:42980404680:web:f4f1e54789902a4295e4fd",
  measurementId: "G-DQPH8YL789"
};

// -----------------------------
// Imports (ES module - client side)
// -----------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.6.1/firebase-firestore.js";

// -----------------------------
// Firebase init
// -----------------------------
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// -----------------------------
// Chart helper (Chart.js must be loaded globally)
// -----------------------------
let visitorsChart = null;
function initChart(labels = [], data = []) {
  const canvas = document.getElementById('visitorsChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (visitorsChart) visitorsChart.destroy();
  visitorsChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Site Visitors',
        data,
        fill: true,
        tension: 0.25,
        pointRadius: 2
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

// -----------------------------
// Utilities
// -----------------------------
function toISODateStringFromAny(value) {
  if (!value && value !== 0) return null;
  if (typeof value === 'string') {
    const s = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const d = new Date(s);
    if (!isNaN(d)) return d.toISOString().slice(0,10);
    return null;
  }
  if (value instanceof Timestamp && typeof value.toDate === 'function') return value.toDate().toISOString().slice(0,10);
  if (value instanceof Date) return value.toISOString().slice(0,10);
  if (typeof value === 'number') {
    const d = new Date(value > 1e12 ? value : value*1000);
    if (!isNaN(d)) return d.toISOString().slice(0,10);
  }
  return null;
}

function safeText(elementId, text) {
  const el = document.getElementById(elementId);
  if (el) el.innerText = (text === undefined || text === null) ? '—' : String(text);
}

// -----------------------------
// Loading indicator
// -----------------------------
function showLoading(show = true) {
  const main = document.querySelector('.site-main');
  if (!main) return;
  let loader = document.getElementById('dashboard-loader');
  if (!loader) {
    loader = document.createElement('div');
    loader.id = 'dashboard-loader';
    loader.style.padding = '16px';
    loader.style.textAlign = 'center';
    loader.style.fontWeight = 'bold';
    loader.innerText = 'Loading dashboard...';
    main.prepend(loader);
  }
  loader.style.display = show ? 'block' : 'none';
}

// -----------------------------
// Firestore loader
// -----------------------------
async function fetchDocsFlexible(rangeDays = 30) {
  async function fetchFromCollectionPath(path, limitCount = rangeDays*5) {
    try {
      const col = collection(db, path);
      const q = query(col, orderBy('date','desc'), limit(limitCount));
      const snaps = await getDocs(q);
      console.log(`Fetched ${snaps.size} docs from ${path}`);
      return snaps.docs.map(d => ({ id: d.id, data: d.data() }));
    } catch(err) {
      console.warn(`Failed fetching ${path}:`, err);
      return [];
    }
  }

  let raw = await fetchFromCollectionPath('public_stats/daily', rangeDays*3);
  if (!raw || raw.length===0) raw = await fetchFromCollectionPath('public_stats', rangeDays*3);

  const normalized = raw.map(doc => {
    const obj = doc.data || doc.data;
    const picked = {
      _id: doc.id,
      dateStr: toISODateStringFromAny(obj?.date ?? obj?.day ?? obj?.timestamp ?? doc.id),
      visitors: Number(obj?.visitors ?? obj?.visitorCount ?? 0),
      reach: Number(obj?.reach ?? obj?.monthlyReach ?? 0),
      followers: Number(obj?.followers ?? obj?.followerCount ?? 0),
      projects: Number(obj?.projects ?? obj?.projectsCompleted ?? 0),
      goals: Number(obj?.goals ?? obj?.goalsAchieved ?? 0),
      raw: obj
    };
    if (!picked.dateStr) picked.dateStr = new Date().toISOString().slice(0,10);
    return picked;
  });

  const byDate = new Map();
  normalized.forEach(item => {
    const existing = byDate.get(item.dateStr);
    if (!existing || item.visitors >= existing.visitors) byDate.set(item.dateStr,item);
  });

  return Array.from(byDate.values()).sort((a,b) => a.dateStr.localeCompare(b.dateStr));
}

// -----------------------------
// Build series for chart
// -----------------------------
function buildSeriesForRange(docsByDateSortedAsc, rangeDays=30) {
  const map = new Map(docsByDateSortedAsc.map(d => [d.dateStr,d]));
  const labels = [];
  const visitors = [];
  const today = new Date();

  for (let i=rangeDays-1;i>=0;i--) {
    const d = new Date(); d.setDate(today.getDate()-i);
    const ds = d.toISOString().slice(0,10);
    labels.push(ds);
    const doc = map.get(ds);
    visitors.push(doc ? Number(doc.visitors) : 0);
  }

  const latestDoc = docsByDateSortedAsc.length ? docsByDateSortedAsc[docsByDateSortedAsc.length-1] : null;
  return { labels, visitors, latest: latestDoc };
}

// -----------------------------
// Load dashboard
// -----------------------------
async function loadFromFirestore(rangeDays = 30) {
  if (!Number.isInteger(rangeDays)||rangeDays<=0) rangeDays = 30;
  showLoading(true);
  console.time('Firestore load');

  try {
    const rawSorted = await fetchDocsFlexible(rangeDays);
    console.timeEnd('Firestore load');

    if (!rawSorted || rawSorted.length === 0) {
      console.warn('No docs found in Firestore.');
      showLoading(false);
      return;
    }

    const series = buildSeriesForRange(rawSorted, rangeDays);
    safeText('visitorsVal', series.visitors.reduce((a,b)=>a+b,0).toLocaleString());

    if (series.latest) {
      safeText('reachVal', series.latest.reach);
      safeText('followersVal', series.latest.followers);
      safeText('projectsVal', series.latest.projects);
      safeText('goalsVal', series.latest.goals);
    }

    initChart(series.labels, series.visitors);
  } catch(err) {
    console.error('Error loading Firestore data:', err);
  } finally {
    showLoading(false);
  }
}

// -----------------------------
// DOM wiring
// -----------------------------
document.addEventListener('DOMContentLoaded', ()=>{
  const sel = document.getElementById('range');
  const days = Number(sel?.value || 30);
  loadFromFirestore(days);
  sel?.addEventListener('change', ()=>{
    loadFromFirestore(Number(sel.value)||30);
  });
});
