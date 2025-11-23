// creator-dashboard.js — Firestore-powered Creator Dashboard
// Usage: include in a page that has Chart.js loaded and elements with IDs:
// reachVal, followersVal, projectsVal, goalsVal, visitorsVal, visitorsChart, range

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

  // Create gradient
  let gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, 'rgba(75, 192, 192, 0.5)');
  gradient.addColorStop(1, 'rgba(75, 192, 192, 0.0)');

  visitorsChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Site Visitors',
        data,
        fill: true,
        backgroundColor: gradient,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.3,
        pointRadius: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { 
        x: { ticks: { maxTicksLimit: 6, color: '#888' }, grid: { display: false } },
        y: { beginAtZero: true, grid: { color: '#333' }, ticks: { color: '#888' } }
      }
    }
  });
}

// -----------------------------
// Utilities
// -----------------------------
function formatDate(val) {
  // Robust date parser
  if (!val) return new Date().toISOString().slice(0,10);
  if (val instanceof Timestamp) return val.toDate().toISOString().slice(0,10);
  if (val instanceof Date) return val.toISOString().slice(0,10);
  if (typeof val === 'string') return val.slice(0,10); // Assume ISO-like string
  return new Date().toISOString().slice(0,10);
}

function safeText(elementId, text) {
  const el = document.getElementById(elementId);
  // If text is 0, we want to show "0", but if null/undefined show "—"
  if (el) el.innerText = (text !== undefined && text !== null) ? String(text) : '—';
}

// -----------------------------
// Firestore loader
// -----------------------------
async function fetchDocsFlexible(rangeDays = 30) {
  
  // Helper to fetch data without "orderBy" (avoids Index errors)
  async function fetchSafe(path) {
    try {
      const col = collection(db, path);
      // We limit to 100 to keep it light, but fetch ANY order
      const q = query(col, limit(100)); 
      const snaps = await getDocs(q);
      console.log(`[Debug] Fetched ${snaps.size} docs from '${path}'`);
      return snaps.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch(err) {
      console.warn(`[Debug] Could not fetch '${path}':`, err.message);
      return [];
    }
  }

  // 1. Try 'public_stats' first (Most common structure)
  let rawData = await fetchSafe('public_stats');
  
  // 2. If empty, try the sub-path user mentioned
  if (rawData.length === 0) {
    // Note: 'public_stats/daily' implies Collection/Document. 
    // If 'daily' is a collection, we try to access it directly:
    rawData = await fetchSafe('public_stats/daily/stats'); 
    // Or try simply a named collection called daily_stats
    if(rawData.length === 0) rawData = await fetchSafe('daily_stats');
  }

  if (rawData.length === 0) {
    console.error("[Debug] No data found in 'public_stats' or 'daily_stats'. Check your Firestore Collection Name.");
    return [];
  }

  // 3. Normalize Data
  const normalized = rawData.map(obj => {
    // Handle various naming conventions
    const dateStr = formatDate(obj.date || obj.timestamp || obj.day || obj.created_at);
    
    return {
      dateStr: dateStr,
      // Convert all numbers safely
      visitors: Number(obj.visitors ?? obj.visitorCount ?? 0),
      reach: Number(obj.reach ?? obj.monthlyReach ?? 0),
      followers: Number(obj.followers ?? obj.followerCount ?? 0),
      projects: Number(obj.projects ?? obj.projectsCompleted ?? 0),
      goals: Number(obj.goals ?? obj.goalsAchieved ?? 0)
    };
  });

  // 4. Sort by Date Ascending (Client-side sort is safer for small datasets)
  normalized.sort((a, b) => a.dateStr.localeCompare(b.dateStr));

  return normalized;
}

// -----------------------------
// Build series for chart
// -----------------------------
function processDataForDashboard(allSortedDocs, rangeDays) {
  const labels = [];
  const visitorsData = [];
  
  // Map for quick lookup by date string
  const dataMap = new Map();
  allSortedDocs.forEach(d => dataMap.set(d.dateStr, d));

  // Generate dates for the last X days
  for (let i = rangeDays - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const isoDate = d.toISOString().slice(0,10);
    
    labels.push(isoDate.slice(5)); // Show "MM-DD"
    const entry = dataMap.get(isoDate);
    visitorsData.push(entry ? entry.visitors : 0);
  }

  // Get the absolute latest entry for the "Stats Cards"
  // (Even if it's not today, show the most recent available data)
  const latestDoc = allSortedDocs.length > 0 ? allSortedDocs[allSortedDocs.length - 1] : null;

  return {
    labels,
    visitorsData,
    latest: latestDoc,
    totalVisitors: visitorsData.reduce((a,b) => a+b, 0)
  };
}

// -----------------------------
// Load dashboard
// -----------------------------
async function loadFromFirestore(rangeDays = 30) {
  console.log("Loading dashboard...");
  
  const docs = await fetchDocsFlexible(rangeDays);
  
  if (!docs || docs.length === 0) {
    safeText('reachVal', 'No Data');
    return;
  }

  const processed = processDataForDashboard(docs, rangeDays);

  // Update Top Cards using the LATEST available data
  if (processed.latest) {
    safeText('reachVal', processed.latest.reach);
    safeText('followersVal', processed.latest.followers);
    safeText('projectsVal', processed.latest.projects);
    safeText('goalsVal', processed.latest.goals);
  }

  // Update Visitor Count (Total over range)
  safeText('visitorsVal', processed.totalVisitors.toLocaleString());

  // Render Chart
  initChart(processed.labels, processed.visitorsData);
}

// -----------------------------
// DOM wiring
// -----------------------------
document.addEventListener('DOMContentLoaded', () => {
  const sel = document.getElementById('range');
  
  // Initial Load
  loadFromFirestore(Number(sel?.value) || 30);

  // Listener
  sel?.addEventListener('change', (e) => {
    loadFromFirestore(Number(e.target.value) || 30);
  });
});
