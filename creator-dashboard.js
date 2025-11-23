// creator-dashboard.js — Firestore-powered Creator Dashboard (Option A: daily docs).
// Usage: include in a page that has Chart.js loaded and elements with IDs:
// reachVal, followersVal, projectsVal, goalsVal, visitorsVal, visitorsChart, range

// -----------------------------
// Firebase config (you provided)
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
  where,
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
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

// -----------------------------
// Utilities
// -----------------------------
function toISODateStringFromAny(value) {
  // Handles: "YYYY-MM-DD" strings, Firestore Timestamp, Date object
  if (!value && value !== 0) return null;
  if (typeof value === 'string') {
    // Accept "YYYY-MM-DD" or ISO string
    const s = value.trim();
    // quick date sanity check
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const d = new Date(s);
    if (!isNaN(d)) return d.toISOString().slice(0,10);
    return null;
  }
  if (value instanceof Timestamp && typeof value.toDate === 'function') {
    return value.toDate().toISOString().slice(0,10);
  }
  if (value instanceof Date) {
    return value.toISOString().slice(0,10);
  }
  // numeric epoch (seconds or ms)
  if (typeof value === 'number') {
    const d = new Date(value > 1e12 ? value : value * 1000);
    if (!isNaN(d)) return d.toISOString().slice(0,10);
  }
  return null;
}

function safeText(elementId, text) {
  const el = document.getElementById(elementId);
  if (el) el.innerText = (text === undefined || text === null) ? '—' : String(text);
}

// -----------------------------
// Firestore loader (Option A: daily docs)
// Strategy:
// 1. Try reading docs from 'public_stats/daily' (common pattern).
// 2. If none or fails, read from 'public_stats' (top-level).
// 3. Normalize each doc to { date: 'YYYY-MM-DD', visitors, reach, followers, projects, goals }.
// 4. Produce chronological arrays for the last N days (rangeDays) and fill missing dates with 0 visitors.
// -----------------------------
async function fetchDocsFlexible(rangeDays = 30) {
  // Helper to fetch docs from a collection path (no ordering assumptions)
  async function fetchFromCollectionPath(path, limitCount = rangeDays * 5) {
    try {
      const col = collection(db, path);
      // attempt a query ordering by 'date' (if field exists); if it errors, fallback below
      try {
        const q = query(col, orderBy('date', 'desc'), limit(limitCount));
        const snaps = await getDocs(q);
        return snaps.docs.map(d => ({ id: d.id, data: d.data() }));
      } catch (err) {
        // fallback: just get docs (no order)
        const q2 = query(col, limit(limitCount));
        const snaps2 = await getDocs(q2);
        return snaps2.docs.map(d => ({ id: d.id, data: d.data() }));
      }
    } catch (err) {
      console.warn(`fetchFromCollectionPath failed for ${path}:`, err);
      return [];
    }
  }

  // Try 'public_stats/daily' first (common structure)
  let raw = await fetchFromCollectionPath('public_stats/daily', rangeDays * 3);
  if (!raw || raw.length === 0) {
    // fallback: top-level 'public_stats'
    raw = await fetchFromCollectionPath('public_stats', rangeDays * 3);
  }

  // Normalize documents
  const normalized = raw.map(doc => {
    const d = doc.data || doc.data; // safety
    const obj = typeof d === 'function' ? d() : doc.data;
    const picked = {
      _id: doc.id,
      dateStr: null,
      visitors: obj && obj.visitors != null ? Number(obj.visitors) : (obj && obj.visitorCount != null ? Number(obj.visitorCount) : 0),
      reach: obj && obj.reach != null ? Number(obj.reach) : (obj && obj.monthlyReach != null ? Number(obj.monthlyReach) : null),
      followers: obj && obj.followers != null ? Number(obj.followers) : (obj && obj.followerCount != null ? Number(obj.followerCount) : null),
      projects: obj && obj.projects != null ? Number(obj.projects) : (obj && obj.projectsCompleted != null ? Number(obj.projectsCompleted) : null),
      goals: obj && obj.goals != null ? Number(obj.goals) : (obj && obj.goalsAchieved != null ? Number(obj.goalsAchieved) : null),
      raw: obj
    };

    // Try common places for date: field 'date', field 'day', field 'timestamp', doc id
    if (obj && obj.date) picked.dateStr = toISODateStringFromAny(obj.date);
    if (!picked.dateStr && obj && obj.day) picked.dateStr = toISODateStringFromAny(obj.day);
    if (!picked.dateStr && obj && obj.timestamp) picked.dateStr = toISODateStringFromAny(obj.timestamp);
    if (!picked.dateStr) {
      // try doc id if it looks like YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(doc.id)) picked.dateStr = doc.id;
      else {
        // try parse id as date-ish
        const parsed = toISODateStringFromAny(doc.id);
        if (parsed) picked.dateStr = parsed;
      }
    }
    // final fallback: use server today (should be rare)
    if (!picked.dateStr) picked.dateStr = new Date().toISOString().slice(0,10);
    return picked;
  });

  // Build a map by date (choose last entry per date if multiple)
  const byDate = new Map();
  normalized.forEach(item => {
    // if multiple docs for same date, pick one with more info (prefer non-zero visitors)
    const existing = byDate.get(item.dateStr);
    if (!existing) byDate.set(item.dateStr, item);
    else {
      // pick the one with higher visitors (heuristic) or newer fields
      if ((item.visitors || 0) >= (existing.visitors || 0)) byDate.set(item.dateStr, item);
    }
  });

  // Convert map to sorted array by date ascending
  const sorted = Array.from(byDate.values()).sort((a,b) => a.dateStr.localeCompare(b.dateStr));
  return sorted;
}

// -----------------------------
// Build series for the last N calendar days.
// Fills missing days with visitors=0 to keep charts continuous.
// -----------------------------
function buildSeriesForRange(docsByDateSortedAsc, rangeDays = 30) {
  // Create a map for fast lookup
  const map = new Map(docsByDateSortedAsc.map(d => [d.dateStr, d]));
  const labels = [];
  const visitors = [];

  // Build from oldest to newest for rangeDays ending today
  const today = new Date();
  // produce last N days array in chronological order
  for (let i = rangeDays - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const ds = d.toISOString().slice(0,10);
    labels.push(ds);
    const doc = map.get(ds);
    visitors.push(doc ? (Number(doc.visitors) || 0) : 0);
  }

  // For KPIs, we will derive the "latest" doc from docsByDateSortedAsc (last element)
  const latestDoc = docsByDateSortedAsc.length ? docsByDateSortedAsc[docsByDateSortedAsc.length - 1] : null;

  return {
    labels,
    visitors,
    latest: latestDoc
  };
}

// -----------------------------
// Top-level loader used by the page
// -----------------------------
async function loadFromFirestore(rangeDays = 30) {
  // sanity
  if (!Number.isInteger(rangeDays) || rangeDays <= 0) rangeDays = 30;

  try {
    const rawSorted = await fetchDocsFlexible(rangeDays);
    if (!rawSorted || rawSorted.length === 0) {
      console.warn('No Firestore docs found for public_stats; falling back to mock.');
      loadMock(rangeDays);
      return;
    }

    // rawSorted is sorted ascending by date already in fetchDocsFlexible
    const series = buildSeriesForRange(rawSorted, rangeDays);

    // fill KPIs
    const visitorsTotal = series.visitors.reduce((a,b)=>a+b,0);
    safeText('visitorsVal', visitorsTotal.toLocaleString());
    if (series.latest) {
      safeText('reachVal', (series.latest.reach ?? '—'));
      safeText('followersVal', (series.latest.followers ?? '—'));
      safeText('projectsVal', (series.latest.projects ?? '—'));
      safeText('goalsVal', (series.latest.goals ?? '—'));
    } else {
      safeText('reachVal', '—');
      safeText('followersVal', '—');
      safeText('projectsVal', '—');
      safeText('goalsVal', '—');
    }

    initChart(series.labels, series.visitors);
  } catch (err) {
    console.error('Error loading data from Firestore:', err);
    // fallback
    loadMock(rangeDays);
  }
}

// -----------------------------
// Mock fallback (keeps UI functional if Firestore unavailable)
// -----------------------------
function loadMock(rangeDays = 30) {
  const labels = [];
  const data = [];
  for (let i = rangeDays - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    labels.push(d.toISOString().slice(0,10));
    data.push(Math.floor(500 + Math.random() * 1500));
  }
  initChart(labels, data);
  safeText('visitorsVal', data.reduce((a,b)=>a+b,0).toLocaleString());
  safeText('reachVal', (Math.floor(Math.random()*7000)+1200).toLocaleString());
  safeText('followersVal', (Math.floor(Math.random()*400)+10).toLocaleString());
  safeText('projectsVal', Math.floor(Math.random()*12));
  safeText('goalsVal', Math.floor(Math.random()*6));
}

// -----------------------------
// DOM wiring
// -----------------------------
document.addEventListener('DOMContentLoaded', () => {
  const sel = document.getElementById('range');
  if (!sel) {
    // if the select doesn't exist, default to 30
    loadFromFirestore(30);
    return;
  }

  // when range changes, load that many days
  sel.addEventListener('change', (e) => {
    const days = Number(sel.value) || 30;
    // try Firestore loader; if it fails, it falls back internal
    loadFromFirestore(days);
  });

  // initial load
  loadFromFirestore(Number(sel.value) || 30);
});
