// live-status.js — Lanyard ALL FEATURES (safe for your existing HTML)
// Uses your elements: live-activity, status-icon, status-line-text,
// spotify-card, live-activity-cover, live-song-title, live-song-artist,
// music-progress-bar, elapsed-time, remaining-time, total-time,
// live-activity-updated, toast-container.

(() => {
  // ====== CONFIG ======
  const DISCORD_USER_ID = "850815059093356594"; // ← your Discord ID
  const WS_URL = "wss://api.lanyard.rest/socket";
  const REST_URL = `https://api.lanyard.rest/v1/users/${DISCORD_USER_ID}`;

  // ====== DOM UTIL ======
  const $ = (id) => document.getElementById(id);
  const set = (el, txt) => { if (el) el.textContent = txt ?? ""; };
  const show = (el, yes = true) => { if (el) el.classList.toggle("hidden", !yes); };
  const setImg = (el, src) => { if (el && src) el.src = src; };
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const fmt = (ms) => {
    if (!ms || ms < 0) return "0:00";
    const s = Math.floor(ms/1000);
    return `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;
  };

  const PRESENCE = {
    online:  { name: "Online",  color: "#23a55a" },
    idle:    { name: "Idle",    color: "#f0b232" },
    dnd:     { name: "Do Not Disturb", color: "#f23f43" },
    offline: { name: "Offline", color: "#6b6f76" },
  };

  // ====== ELEMENTS ======
  const el = {
    root: $("live-activity"),
    statusIcon: $("status-icon"),
    statusText: $("status-line-text"),
    spotifyCard: $("spotify-card"),
    spCover: $("live-activity-cover"),
    spTitle: $("live-song-title"),
    spArtist: $("live-song-artist"),
    spBar: $("music-progress-bar"),
    spElapsed: $("elapsed-time"),
    spRemain: $("remaining-time"),
    spTotal: $("total-time"),
    updated: $("live-activity-updated"),
    toasts: $("toast-container"),
  };

  // We’ll inject a rich activity card right under the Status Line:
  function ensureActivityCard() {
    let card = document.getElementById("rich-activity-card");
    if (card) return card;
    card = document.createElement("div");
    card.id = "rich-activity-card";
    card.className = "rich-activity-card hidden";
    card.innerHTML = `
      <div class="ra-art"><img id="ra-icon" alt="" /></div>
      <div class="ra-info">
        <div class="ra-line"><span id="ra-type">Activity</span> · <strong id="ra-name">—</strong></div>
        <div class="ra-details" id="ra-details"></div>
        <div class="ra-state" id="ra-state"></div>
        <div class="ra-timer" id="ra-timer"></div>
      </div>
    `;
    // insert after status line
    const statusLine = document.getElementById("status-line");
    if (statusLine && statusLine.parentNode) {
      statusLine.parentNode.insertBefore(card, el.spotifyCard);
    } else {
      el.root?.appendChild(card);
    }
    return card;
  }
  const ra = (() => {
    const c = ensureActivityCard();
    return {
      card: c,
      icon: c.querySelector("#ra-icon"),
      type: c.querySelector("#ra-type"),
      name: c.querySelector("#ra-name"),
      details: c.querySelector("#ra-details"),
      state: c.querySelector("#ra-state"),
      timer: c.querySelector("#ra-timer"),
    };
  })();

  // ====== TOASTS ======
  function toast(msg) {
    if (!el.toasts) return;
    const t = document.createElement("div");
    t.className = "toast";
    t.textContent = msg;
    el.toasts.appendChild(t);
    requestAnimationFrame(() => t.classList.add("show"));
    setTimeout(() => {
      t.classList.remove("show");
      setTimeout(() => t.remove(), 300);
    }, 2600);
  }

  // ====== STATE ======
  let ws = null, heartbeat = null, reconnectTimer = null;
  let progressTimer = null, activityTimer = null;
  let payload = null;
  let lastPresence = null, lastSpotifyId = null, lastActivityKey = null, lastVoice = null;
  let spStart = 0, spEnd = 0, lastPaintAt = 0;

  // ====== LANYARD SOCKET ======
  function connect() {
    clearTimeout(reconnectTimer);
    ws = new WebSocket(WS_URL);
    ws.onmessage = onMessage;
    ws.onclose = scheduleReconnect;
    ws.onerror = scheduleReconnect;
  }

  function scheduleReconnect() {
    clearInterval(heartbeat); heartbeat = null;
    if (reconnectTimer) return;
    reconnectTimer = setTimeout(connect, 1500);
  }

  async function firstPaint() {
    try {
      const r = await fetch(REST_URL);
      const j = await r.json();
      if (j?.success && j.data) {
        payload = j.data;
        render(payload);
      }
    } catch {}
  }

  function onMessage(ev) {
    const m = JSON.parse(ev.data);
    switch (m.op) {
      case 1: { // HELLO
        const interval = m.d.heartbeat_interval;
        clearInterval(heartbeat);
        heartbeat = setInterval(() => {
          try { ws?.readyState === 1 && ws.send(JSON.stringify({ op: 3 })); } catch {}
        }, interval);
        // Subscribe
        ws?.send(JSON.stringify({ op: 2, d: { subscribe_to_id: DISCORD_USER_ID } }));
        firstPaint();
        break;
      }
      case 0: { // DISPATCH
        if (m.t === "INIT_STATE" || m.t === "PRESENCE_UPDATE") {
          payload = m.d;
          render(payload);
        }
        break;
      }
    }
  }

  // ====== RENDER ======
  function render(d) {
    if (!d || !el.root) return;

    // Show the root when we have something
    el.root.classList.remove("hidden");

    // Presence & devices & voice & custom status
    paintPresenceLine(d);

    // Spotify
    if (d.spotify) {
      paintSpotify(d.spotify);
    } else {
      show(el.spotifyCard, false);
      stopProgress();
      if (lastSpotifyId) {
        toast("⏹️ Stopped listening on Spotify");
        lastSpotifyId = null;
      }
    }

    // Rich activity (games/apps/editors)
    paintRichActivity(d.activities || []);

    // Last updated ticker
    lastPaintAt = Date.now();
    set(el.updated, "Updated just now");
  }

  function paintPresenceLine(d) {
    const statusKey = d.discord_status || "offline";
    const status = PRESENCE[statusKey] || PRESENCE.offline;

    // Status summary pieces
    const devices = [
      d.active_on_discord_desktop ? "Desktop" : null,
      d.active_on_discord_mobile ? "Mobile" : null
    ].filter(Boolean);

    const inVoice = !!(d.in_voice_channel || d.kv?.in_voice_channel);
    const custom = (d.activities || []).find(a => a.type === 4);

    // Build line
    let line = `${status.name}`;
    if (devices.length) line += ` · ${devices.join(", ")}`;
    if (inVoice) line += ` · In Voice`;
    if (custom) {
      const e = custom.emoji?.name ? `${custom.emoji.name} ` : "";
      if (custom.state) line += ` · ${e}${custom.state}`;
    }

    set(el.statusText, line);

    // Icon tint via style filter ring (safe fallback)
    if (el.statusIcon) {
      el.statusIcon.style.filter = colorToFilter(status.color);
      el.statusIcon.style.opacity = "1";
    }

    // Toasts on changes
    if (lastPresence && lastPresence !== statusKey) {
      const emoji = statusKey === "online" ? "🟢" :
                    statusKey === "idle" ? "🌙" :
                    statusKey === "dnd" ? "⛔" : "⚫";
      toast(`${emoji} ${status.name}`);
    }
    if (lastVoice !== null && lastVoice !== inVoice) {
      toast(inVoice ? "🎙️ Joined voice" : "🔇 Left voice");
    }
    lastPresence = statusKey;
    lastVoice = inVoice;
  }

  // ====== SPOTIFY ======
  function paintSpotify(sp) {
    show(el.spotifyCard, true);

    set(el.spTitle, sp.song || "—");
    set(el.spArtist, sp.artist || "—");
    setImg(el.spCover, sp.album_art_url || "");
    const duration = (sp.timestamps?.end || 0) - (sp.timestamps?.start || 0);
    set(el.spTotal, fmt(duration));
    spStart = sp.timestamps?.start ?? 0;
    spEnd   = sp.timestamps?.end ?? 0;

    // Update progress immediately and on interval
    tickProgress();
    startProgress();

    // Click to open Spotify
    if (el.spotifyCard && sp.track_id) {
      el.spotifyCard.onclick = () => {
        window.open(`https://open.spotify.com/track/${sp.track_id}`, "_blank", "noopener");
      };
    }

    if (lastSpotifyId !== sp.track_id) {
      if (lastSpotifyId) toast("⏭️ Switched track");
      else toast("▶️ Now playing on Spotify");
      lastSpotifyId = sp.track_id || null;
    }
  }

  function tickProgress() {
    if (!spStart || !spEnd) return;
    const now = Date.now();
    const duration = spEnd - spStart;
    const elapsed = clamp(now - spStart, 0, duration);
    const remaining = duration - elapsed;

    if (el.spElapsed) set(el.spElapsed, fmt(elapsed));
    if (el.spTotal) set(el.spTotal, fmt(duration));
    if (el.spRemain) set(el.spRemain, `-${fmt(remaining)}`);

    if (el.spBar) {
      const pct = duration ? (elapsed / duration) * 100 : 0;
      el.spBar.style.width = `${pct}%`;
    }
  }

  function startProgress() {
    stopProgress();
    progressTimer = setInterval(() => {
      tickProgress();
      if (Date.now() >= spEnd) stopProgress();
    }, 250);
  }
  function stopProgress() { clearInterval(progressTimer); progressTimer = null; }

  // ====== RICH ACTIVITY (games/apps) ======
  function paintRichActivity(activities) {
    // Ignore custom status and Spotify (Spotify has its own card)
    const list = (activities || [])
      .filter(a => a && a.type !== 4 && a.name !== "Spotify");

    if (!list.length) {
      show(ra.card, false);
      stopActivityTimer();
      updateActivityKey(null);
      return;
    }

    // Prefer "Playing" (0) or Competing (5)
    list.sort((a, b) => (a.type === 0 ? -1 : 0) - (b.type === 0 ? -1 : 0));
    const a = list[0];

    // Fill
    show(ra.card, true);
    set(ra.type, typeToLabel(a.type, a.name));
    set(ra.name, a.name || "—");
    set(ra.details, a.details || "");
    set(ra.state, a.state || "");

    // Icon from assets
    const asset = a.assets?.large_image || a.assets?.small_image || "";
    const icon = assetToUrl(asset, a.application_id);
    setImg(ra.icon, icon);

    // Elapsed timer
    const start = a.timestamps?.start || null;
    if (start) {
      startActivityTimer(start);
    } else {
      stopActivityTimer();
      set(ra.timer, "");
    }

    const keyNow = `${a.application_id || a.name || "act"}:${start || "0"}`;
    if (keyNow !== lastActivityKey) {
      if (lastActivityKey) toast("🕹️ Activity changed");
      else toast("🎮 Activity started");
      updateActivityKey(keyNow);
    }
  }

  function updateActivityKey(k) { lastActivityKey = k; }

  function typeToLabel(t, name) {
    switch (t) {
      case 0: return "Playing";
      case 1: return "Streaming";
      case 2: return name === "Spotify" ? "Listening" : "Listening";
      case 3: return "Watching";
      case 5: return "Competing";
      default: return "Activity";
    }
  }

  function assetToUrl(asset, appId) {
    if (!asset) return "";
    if (asset.startsWith("mp:") || asset.startsWith("spotify:")) {
      return `https://media.discordapp.net/${asset.replace(/^mp:\//, "")}`;
    }
    return appId ? `https://cdn.discordapp.com/app-assets/${appId}/${asset}.png` : "";
  }

  function startActivityTimer(startMs) {
    stopActivityTimer();
    activityTimer = setInterval(() => {
      const elapsed = Date.now() - startMs;
      set(ra.timer, `Elapsed ${fmt(elapsed)}`);
    }, 1000);
  }
  function stopActivityTimer(){ clearInterval(activityTimer); activityTimer = null; }

  // ====== “Updated just now” ticker ======
  setInterval(() => {
    if (!el.updated || !lastPaintAt) return;
    const secs = Math.floor((Date.now() - lastPaintAt)/1000);
    set(el.updated, secs < 5 ? "Updated just now" : `Updated ${secs}s ago`);
  }, 3000);

  // ====== BOOT ======
  connect();
  function connect() {
    ws = new WebSocket(WS_URL);
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.op === 1) {
        // HELLO
        const hi = msg.d.heartbeat_interval;
        clearInterval(heartbeat);
        heartbeat = setInterval(() => {
          try { ws?.readyState === 1 && ws.send(JSON.stringify({ op: 3 })); } catch {}
        }, hi);
        // Subscribe
        ws?.send(JSON.stringify({ op: 2, d: { subscribe_to_id: DISCORD_USER_ID } }));
        firstPaint();
      } else if (msg.op === 0 && (msg.t === "INIT_STATE" || msg.t === "PRESENCE_UPDATE")) {
        payload = msg.d;
        render(payload);
      }
    };
    ws.onclose = () => scheduleReconnect();
    ws.onerror = () => scheduleReconnect();
  }
  function scheduleReconnect() {
    clearInterval(heartbeat); heartbeat = null;
    if (reconnectTimer) return;
    reconnectTimer = setTimeout(connect, 1500);
  }

  // ====== UTIL: color → CSS filter (approx) ======
  function colorToFilter(hex) {
    // simple hue rotate fallback: green/orange/red/grey presets
    if (!hex) return "";
    const m = hex.toLowerCase();
    if (m === "#23a55a") return "drop-shadow(0 0 0 #23a55a) saturate(2)";
    if (m === "#f0b232") return "drop-shadow(0 0 0 #f0b232) saturate(2)";
    if (m === "#f23f43") return "drop-shadow(0 0 0 #f23f43) saturate(2)";
    if (m === "#6b6f76") return "drop-shadow(0 0 0 #6b6f76) saturate(1.2)";
    return "none";
  }
})();
