const chatMessages = document.getElementById('ai-chat-messages');
const chatInput = document.getElementById('ai-chat-input');
const chatSend = document.getElementById('ai-chat-send');

const conversationMemory = [
    { role: 'system', content: 'You are a helpful AI assistant for the website. Answer clearly and politely.' }
];

function appendMessage(sender, text) {
    const message = document.createElement('div');
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    message.classList.add(sender === 'user' ? 'user-message' : 'ai-message');
    message.innerHTML = `<span>${text}</span><div style="font-size:10px; color:var(--secondary-text); text-align:right;">${time}</div>`;
    chatMessages.appendChild(message);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTypingIndicator() {
    const typing = document.createElement('div');
    typing.classList.add('ai-typing');
    typing.innerHTML = `<span></span><span></span><span></span>`;
    chatMessages.appendChild(typing);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return typing;
}

async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    appendMessage('user', text);
    chatInput.value = '';
    conversationMemory.push({ role: 'user', content: text });

    const typing = showTypingIndicator();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conversation: conversationMemory })
        });

        const data = await response.json();
        typing.remove();
        appendMessage('ai', data.reply);
        conversationMemory.push({ role: 'assistant', content: data.reply });

    } catch (err) {
        typing.remove();
        appendMessage('ai', '⚠️ Error connecting to AI.');
        console.error(err);
    }
}

chatSend.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', e => { if(e.key === 'Enter') sendMessage(); });
