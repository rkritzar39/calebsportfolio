const chatMessages = document.getElementById('ai-chat-messages');
const chatInput = document.getElementById('ai-chat-input');
const chatSend = document.getElementById('ai-chat-send');

// Manual Q&A
const qaPairs = {
    "What is your name?": "My name is Caleb Kritzar.",
    "How old are you?": "I am 20 years old.",
    "Are you autistic?": "Yes, I am autistic and interested in technology and coding.",
    "Where are you from?": "I am from [Your Location].",
    "What do you do?": "I create websites and explore technology.",
    "What programming languages do you use?": "I mainly use HTML, CSS, JavaScript, and Python.",
    "Do you like AI?": "Yes, I find AI fascinating and use it in projects.",
    "What is this site about?": "This is my personal link-in-bio page with merch, settings, and info.",
    "Can I follow you?": "Yes! Follow me on my social links listed here.",
    "Tell me a joke": "Why did the programmer quit his job? Because he didn't get arrays.",
    "What is your favorite color?": "I like shades of blue.",
    "Do you like music?": "Yes! I enjoy all kinds of music.",
    "What is your favorite website?": "I enjoy exploring coding and tech blogs.",
    "Hello": "Hi there! How can I help you today?",
    "Hi": "Hello! Ask me anything you like.",
    "Hey": "Hey! What’s up?",
    "Goodbye": "Bye! Have a great day.",
    "See you": "See you later!",
    "Bye": "Goodbye! Take care.",
    // Add more questions as needed
    "default": "I don't know the answer to that yet."
};

// Append message
function appendMessage(sender, text) {
    const message = document.createElement('div');
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    message.classList.add(sender === 'user' ? 'user-message' : 'ai-message');
    message.innerHTML = `<span>${text}</span><div style="font-size:10px; color:var(--secondary-text); text-align:right;">${time}</div>`;
    chatMessages.appendChild(message);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Typing indicator bubble
function showTypingIndicator() {
    const typing = document.createElement('div');
    typing.classList.add('ai-typing');
    typing.innerHTML = `<span></span><span></span><span></span>`;
    chatMessages.appendChild(typing);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return typing;
}

// Send message function
function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    appendMessage('user', text);
    chatInput.value = '';

    const typing = showTypingIndicator();

    setTimeout(() => {
        typing.remove();
        const answer = qaPairs[text] || qaPairs["default"];
        appendMessage('ai', answer);
    }, 700 + Math.random()*500); // random delay for realism
}

// Event listeners
chatSend.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', e => { if(e.key === 'Enter') sendMessage(); });
