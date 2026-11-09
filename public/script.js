const chatMessages = document.getElementById('chatMessages');
const chatForm = document.getElementById('chatForm');
const userInput = document.getElementById('userInput');
const suggestions = document.querySelectorAll('.suggestion');

const history = [];

function addMessage(text, sender) {
  const message = document.createElement('div');
  message.className = `message ${sender}`;
  message.textContent = text;
  chatMessages.appendChild(message);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function setLoadingState(isLoading) {
  userInput.disabled = isLoading;
  const button = chatForm.querySelector('button');
  if (button) {
    button.disabled = isLoading;
    button.textContent = isLoading ? 'Thinking...' : 'Send';
  }
}

async function sendMessage(messageText) {
  const text = messageText.trim();
  if (!text) return;

  addMessage(text, 'user');
  history.push({ role: 'user', content: text });
  userInput.value = '';
  setLoadingState(true);

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: text,
        history: history.slice(-10)
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Unable to reach the AI service.');
    }

    const reply = data.reply || 'I am here to help with RiverGuard AI.';
    history.push({ role: 'assistant', content: reply });
    addMessage(reply, 'assistant');
  } catch (error) {
    addMessage(
      error.message || 'Sorry, I could not respond right now. Please check your OpenAI API key and server configuration.',
      'assistant'
    );
  } finally {
    setLoadingState(false);
    userInput.focus();
  }
}

chatForm.addEventListener('submit', (event) => {
  event.preventDefault();
  sendMessage(userInput.value);
});

suggestions.forEach((button) => {
  button.addEventListener('click', () => {
    const question = button.textContent.trim();
    userInput.value = question;
    userInput.focus();
    sendMessage(question);
  });
});
