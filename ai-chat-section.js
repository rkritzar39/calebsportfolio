const chatMessages = document.getElementById('ai-chat-messages');
const chatInput = document.getElementById('ai-chat-input');
const chatSend = document.getElementById('ai-chat-send');

const conversationMemory = [
    { role: 'system', content: 'You are a helpful AI assistant for this website.' }
];

function appendMessage(sender, text) {
    const message = document.createElement('div');
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    message.classList.add(sender === 'user' ? 'user-message' : 'ai-message');
    message.innerHTML = `<span>${text}</span>
                         <div style="font-size:10px; color:var(--secondary-text); text-align:right;">${time}</div>`;
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
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer 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'
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: conversationMemory
            })
        });

        const data = await response.json();
        typing.remove();

        const reply = data.choices[0].message.content;
        appendMessage('ai', reply);
        conversationMemory.push({ role: 'assistant', content: reply });

    } catch (err) {
        typing.remove();
        appendMessage('ai', '⚠️ Error connecting to AI.');
        console.error(err);
    }
}

chatSend.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', e => { if(e.key === 'Enter') sendMessage(); });
