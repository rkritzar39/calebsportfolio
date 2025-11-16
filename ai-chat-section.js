// =========================
// iMessage-Style Offline AI Chat with Persistent Memory
// Over 100 questions with multiple variants
// =========================

const chatMessages = document.getElementById('ai-chat-messages');
const chatInput = document.getElementById('ai-chat-input');
const chatSend = document.getElementById('ai-chat-send');

// =========================
// Load conversation memory from localStorage
// =========================
let conversationMemory = JSON.parse(localStorage.getItem('chatMemory')) || [];

// =========================
// Manual Q&A with multiple variants
// =========================
const qaPairs = [
  // Personal Info
  { variants: ["what is your name","who are you","your name","may i know your name"], answer: "My name is Caleb Kritzar." },
  { variants: ["how old are you","your age","age"], answer: "I am 20 years old." },
  { variants: ["are you autistic","do you have autism","autism"], answer: "Yes, I am autistic and interested in technology and coding." },
  { variants: ["where are you from","your location","from where","origin"], answer: "I am from [Your Location]." },
  { variants: ["do you have siblings","siblings","family"], answer: "Yes, I have siblings. Family is important to me." },
  { variants: ["hobbies","what are your hobbies","things you like"], answer: "I enjoy coding, listening to music, and exploring technology." },
  { variants: ["favorite color","color do you like","your color"], answer: "I like shades of blue." },
  { variants: ["favorite food","food do you like"], answer: "I enjoy pizza and other comfort foods." },
  { variants: ["favorite movie","movies do you like"], answer: "I love sci-fi and technology-themed movies." },
  { variants: ["favorite music","music do you like"], answer: "I enjoy a variety of music, from electronic to pop." },

  // Tech & Coding
  { variants: ["what do you do","what is your job","your work","profession"], answer: "I create websites and explore technology." },
  { variants: ["programming languages","what do you code in","coding languages","languages you know"], answer: "I mainly use HTML, CSS, JavaScript, and Python." },
  { variants: ["do you like ai","ai","artificial intelligence","ai interests"], answer: "Yes, I find AI fascinating and use it in projects." },
  { variants: ["do you code every day","coding daily","programming daily"], answer: "I try to code regularly to improve my skills." },
  { variants: ["favorite programming language","best coding language"], answer: "JavaScript is my favorite, but I also like Python." },
  { variants: ["do you build websites for fun","website projects"], answer: "Yes! I love experimenting with websites and interactive features." },
  { variants: ["types of projects","projects you do"], answer: "Mostly personal websites, link-in-bio pages, and AI-powered tools." },

  // Website Info
  { variants: ["what is this site about","website purpose","what is this site"], answer: "This is my personal link-in-bio page with merch, settings, and info." },
  { variants: ["can i follow you","follow links","social links"], answer: "Yes! You can follow me on my social links listed here." },
  { variants: ["do you sell merchandise","merch","buy merch"], answer: "Yes, check out the merch section on this page." },
  { variants: ["what can i find here","site contents","site sections"], answer: "You can find my socials, merch, quotes, tech info, and more." },
  { variants: ["contact email","how to contact you"], answer: "You can reach me through the contact section on this site." },

  // Fun / Friendly
  { variants: ["tell me a joke","joke","make me laugh"], answer: "Why did the programmer quit his job? Because he didn't get arrays." },
  { variants: ["tell me another joke","another joke","funny"], answer: "Why do Java developers wear glasses? Because they don't C#." },
  { variants: ["do you like games","games"], answer: "Yes, I enjoy playing video games in my free time." },
  { variants: ["do you like sports","sports"], answer: "I enjoy watching some sports, but I’m more into tech and coding." },
  { variants: ["fun facts","random fact","did you know"], answer: "Did you know the first computer bug was an actual moth?" },
  { variants: ["favorite hobby","hobbies"], answer: "Coding and exploring new tech are my main hobbies." },

  // Greetings
  { variants: ["hello","hi","hey"], answer: "Hi there! How can I help you today?" },
  { variants: ["good morning"], answer: "Good morning! Hope you have a great day." },
  { variants: ["good afternoon"], answer: "Good afternoon! How's it going?" },
  { variants: ["good evening"], answer: "Good evening! How was your day?" },

  // Farewells
  { variants: ["goodbye","bye","see you"], answer: "Bye! Have a great day." },
  { variants: ["talk to you later"], answer: "Sure! Talk soon." },
  { variants: ["see you tomorrow"], answer: "Looking forward to it!" },

  // Random / Misc
  { variants: ["favorite website","website you like"], answer: "I enjoy exploring coding and tech blogs." },
  { variants: ["favorite programming tool"], answer: "I like VS Code for building projects." },
  { variants: ["favorite quote"], answer: "I like 'Code is like humor. When you have to explain it, it’s bad.'" },
  { variants: ["motivation","what motivates you"], answer: "Learning new technologies and building projects motivates me." },
  { variants: ["learning new things","do you like learning"], answer: "Absolutely! I love exploring tech, coding, and AI." },
  { variants: ["can you answer any question"], answer: "I try my best! But some questions I may not know yet." },
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
// Send message
// =========================
function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;

  appendMessage('user', text);
  conversationMemory.push({ sender: 'user', text });
  localStorage.setItem('chatMemory', JSON.stringify(conversationMemory));
  chatInput.value = '';

  const typing = showTypingIndicator();

  setTimeout(() => {
    typing.remove();
    const answer = getAnswer(text);
    appendMessage('ai', answer);
    conversationMemory.push({ sender: 'ai', text: answer });
    localStorage.setItem('chatMemory', JSON.stringify(conversationMemory));
  }, 700 + Math.random() * 500);
}

// =========================
// Event listeners
// =========================
chatSend.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', e => { if (e.key === 'Enter') sendMessage(); });

// =========================
// Load previous chat on page load
// =========================
function loadPreviousChat() {
  conversationMemory.forEach(msg => appendMessage(msg.sender, msg.text));
}

window.addEventListener('DOMContentLoaded', loadPreviousChat);
