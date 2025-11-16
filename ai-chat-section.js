// =========================
// Offline AI Chat with Dynamic Date, Time, and Location
// =========================

const chatMessages = document.getElementById('ai-chat-messages');
const chatInput = document.getElementById('ai-chat-input');
const chatSend = document.getElementById('ai-chat-send');

let conversationMemory = JSON.parse(localStorage.getItem('chatMemory')) || [];

// =========================
// Predefined Q&A with variants
// =========================
const qaPairs = [
  // Static info
  { variants: ["what is your name","who are you","your name"], answer: "My name is Caleb Kritzar." },
  { variants: ["how old are you","your age","age"], answer: "I am 20 years old." },
  { variants: ["are you autistic","do you have autism"], answer: "Yes, I am autistic and interested in technology and coding." },
  { variants: ["where are you from","your location","from where"], answer: "I am from [Your Location]." },
  { variants: ["do you like ai","ai","artificial intelligence"], answer: "Yes, I find AI fascinating and use it in projects." },
  { variants: ["tell me a joke","joke","make me laugh"], answer: "Why did the programmer quit his job? Because he didn't get arrays." },
  { variants: ["hello","hi","hey"], answer: "Hi there! How can I help you today?" },
  { variants: ["goodbye","bye","see you"], answer: "Bye! Have a great day." },

  // Dynamic questions handled in JS
  { variants: ["what is the current date","today's date","date today","current date"], answer: "dynamic-date" },
  { variants: ["what day is it","day today","what day"], answer: "dynamic-day" },
  { variants: ["what time is it","current time","time now"], answer: "dynamic-time" },
  { variants: ["what is the weather","weather","current weather"], answer: "dynamic-weather" },

  // Default fallback
  { variants: ["default"], answer: "I don't know the answer to that yet." }
];

// =========================
// Append message
// =========================
function appendMessage(sender, text) {
  const message = document.createElement('div');
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  message.classList.add(sender === 'user' ? 'user-message' : 'ai-message');
  message.innerHTML = `<span>${text}</span><div style="font-size:10px; color:var(--secondary-text); text-align:right;">${time}</div>`;
  chatMessages.appendChild(message);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// =========================
// Typing bubble
// =========================
function showTypingIndicator() {
  const typing = document.createElement('div');
  typing.classList.add('ai-typing');
  typing.innerHTML = `<span></span><span></span><span></span>`;
  chatMessages.appendChild(typing);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return typing;
}

// =========================
// Format date MM/DD/YYYY
// =========================
function getCurrentDate() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

// =========================
// Format day of week
// =========================
function getCurrentDay() {
  const d = new Date();
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  return days[d.getDay()];
}

// =========================
// Format time HH:MM AM/PM
// =========================
function getCurrentTime() {
  const d = new Date();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2,"0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours}:${minutes} ${ampm}`;
}

// =========================
// Get approximate location (city/country) using Geolocation API
// Note: actual weather requires API access
// =========================
function getLocation(callback) {
  if (!navigator.geolocation) {
    callback("Location unavailable");
    return;
  }
  navigator.geolocation.getCurrentPosition(
    pos => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      // Here you could integrate a weather API if desired
      callback(`Latitude: ${lat.toFixed(2)}, Longitude: ${lon.toFixed(2)}`);
    },
    err => {
      callback("Location access denied");
    }
  );
}

// =========================
// Find answer (dynamic handling)
function getAnswer(input, callback) {
  const text = input.toLowerCase();
  for (const qa of qaPairs) {
    if (qa.variants.some(v => text.includes(v))) {
      if (qa.answer === "dynamic-date") return callback(getCurrentDate());
      if (qa.answer === "dynamic-day") return callback(getCurrentDay());
      if (qa.answer === "dynamic-time") return callback(getCurrentTime());
      if (qa.answer === "dynamic-weather") return getLocation(loc => callback(`Current location: ${loc}`));
      return callback(qa.answer);
    }
  }
  callback(qaPairs.find(q => q.variants[0]==="default").answer);
}

// =========================
// Send message
// =========================
function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;

  appendMessage('user', text);
  conversationMemory.push({ sender:'user', text });
  localStorage.setItem('chatMemory', JSON.stringify(conversationMemory));
  chatInput.value = '';

  const typing = showTypingIndicator();

  setTimeout(() => {
    typing.remove();
    getAnswer(text, answer => {
      appendMessage('ai', answer);
      conversationMemory.push({ sender:'ai', text:answer });
      localStorage.setItem('chatMemory', JSON.stringify(conversationMemory));
    });
  }, 700 + Math.random()*500);
}

// =========================
// Event listeners
// =========================
chatSend.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', e => { if(e.key === 'Enter') sendMessage(); });

// =========================
// Load previous chat
// =========================
function loadPreviousChat() {
  conversationMemory.forEach(msg => appendMessage(msg.sender, msg.text));
}
window.addEventListener('DOMContentLoaded', loadPreviousChat);
