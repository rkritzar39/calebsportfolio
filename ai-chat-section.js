// =========================
// iMessage-Style Offline AI Chat
// =========================

const chatMessages = document.getElementById('ai-chat-messages');
const chatInput = document.getElementById('ai-chat-input');
const chatSend = document.getElementById('ai-chat-send');

// =========================
// Manual Q&A with Variants
// =========================
const qaPairs = [
  // Personal Info
  { variants: ["what is your name", "who are you", "your name"], answer: "My name is Caleb Kritzar." },
  { variants: ["how old are you", "your age", "age"], answer: "I am 20 years old." },
  { variants: ["are you autistic", "do you have autism"], answer: "Yes, I am autistic and interested in technology and coding." },
  { variants: ["where are you from", "your location", "from where"], answer: "I am from [Your Location]." },

  // Tech & Coding
  { variants: ["what do you do", "what is your job", "your work"], answer: "I create websites and explore technology." },
  { variants: ["programming languages", "what do you code in", "coding languages"], answer: "I mainly use HTML, CSS, JavaScript, and Python." },
  { variants: ["do you like ai", "ai", "artificial intelligence"], answer: "Yes, I find AI fascinating and use it in projects." },

  // Website Info
  { variants: ["what is this site about", "website purpose", "what is this site"], answer: "This is my personal link-in-bio page with merch, settings, and info." },
  { variants: ["can i follow you", "follow links", "social links"], answer: "Yes! You can follow me on my social links listed here." },

  // Fun / Friendly
  { variants: ["tell me a joke", "joke", "make me laugh"], answer: "Why did the programmer quit his job? Because he didn't get arrays." },
  { variants: ["favorite color", "color do you like", "your color"], answer: "I like shades of blue." },
  { variants: ["do you like music", "music"], answer: "Yes! I enjoy all kinds of music." },
  { variants: ["do you like games", "games"], answer: "Yes! I enjoy video games in my free time." },
  { variants: ["do you like movies", "movies"], answer: "I like sci-fi and technology-themed movies." },

  // Greetings
  { variants: ["hello", "hi", "hey"], answer: "Hi there! How can I help you today?" },
  { variants: ["good morning"], answer: "Good morning! Hope you have a great day." },
  { variants: ["good afternoon"], answer: "Good afternoon! How's it going?" },
  { variants: ["good evening"], answer: "Good evening! How was your day?" },

  // Farewells
  { variants: ["goodbye", "bye", "see you"], answer: "Bye! Have a great day." },
  { variants: ["talk to you later"], answer: "Sure! Talk soon." },
  { variants: ["see you tomorrow"], answer: "Looking forward to it!" },

  // Random / Misc
  { variants: ["favorite website", "website you like"], answer: "I enjoy exploring coding and tech blogs." },
  { variants: ["favorite programming tool"], answer: "I like VS Code for building projects." },
  { variants: ["favorite quote"], answer: "I like 'Code is like humor. When you have to explain it, it’s bad.'" },
  { variants: ["motivation", "what motivates you"], answer: "Learning new technologies and building projects motivates me." },
  { variants: ["learning new things", "do you like learning"], answer: "Absolutely! I love exploring tech, coding, and AI." },

  // Default response
  { variants: ["default"], answer: "I don't know the answer to that yet." }
];

// =========================
// Append message to chat
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
// Typing indicator bubble
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
// Find answer from variants
// =========================
function getAnswer(input) {
  const text = input.toLowerCase();
  for (const qa of qaPairs) {
    if (qa.variants.some(v => text.includes(v))) {
      return qa.answer;
    }
  }
  return qaPairs.find(q => q.variants[0] === "default").answer;
}

// =========================
// Send message function
// =========================
function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;

  appendMessage('user', text);
  chatInput.value = '';

  const typing = showTypingIndicator();

  setTimeout(() => {
    typing.remove();
    const answer = getAnswer(text);
    appendMessage('ai', answer);
  }, 700 + Math.random() * 500); // random delay for realism
}

// =========================
// Event listeners
// =========================
chatSend.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', e => { if (e.key === 'Enter') sendMessage(); });
