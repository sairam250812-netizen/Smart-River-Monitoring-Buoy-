require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'RiverGuard AI Assistant' });
});

app.post('/api/chat', async (req, res) => {
  const { message, history = [] } = req.body || {};

  if (!message || !String(message).trim()) {
    return res.status(400).json({ error: 'A message is required.' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'OPENAI_API_KEY is not configured. Add it to your .env file before starting the app.'
    });
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const systemPrompt = `You are RiverGuard AI Assistant, a friendly and intelligent helper for the RiverGuard AI project.

You explain the project clearly to students, teachers, visitors, and judges.
Focus on these areas:
- Smart river monitoring and floating waste collection
- Pollution problems in rivers
- How the buoy moves and monitors water
- Sensor and hardware components like Arduino UNO, ESP32, GPS, pH, turbidity, temperature, GSM, BLDC motors, and waste collection net
- AI-based waste detection and classification
- Environmental impact and pollution awareness
- Advantages, limitations, and future improvements
- Real-world importance of clean rivers and sustainability

Give simple, informative, and confident explanations. Keep answers practical, clear, and not overly technical unless asked.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-8).map((entry) => ({
      role: entry.role === 'assistant' ? 'assistant' : 'user',
      content: String(entry.content || '').trim()
    })),
    { role: 'user', content: String(message).trim() }
  ];

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 500
      })
    });

    const rawText = await response.text();

    if (!response.ok) {
      let errorDetails = 'The AI service returned an error.';
      try {
        const parsed = JSON.parse(rawText);
        errorDetails = parsed?.error?.message || errorDetails;
      } catch (err) {
        errorDetails = rawText || errorDetails;
      }

      return res.status(502).json({
        error: `AI API failed: ${errorDetails}`
      });
    }

    const data = JSON.parse(rawText);
    const reply = data?.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return res.status(500).json({ error: 'No response returned by the AI model.' });
    }

    return res.json({ reply });
  } catch (error) {
    return res.status(500).json({
      error: 'Unable to contact the AI API. Please check your internet connection and API key.'
    });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`RiverGuard AI website running on http://localhost:${PORT}`);
});
