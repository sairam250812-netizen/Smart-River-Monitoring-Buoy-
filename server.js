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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'The AI assistant is not configured yet. Add GEMINI_API_KEY to the server environment.'
    });
  }

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const systemPrompt = `You are RiverGuard AI Assistant, a friendly and intelligent helper for the RiverGuard AI project.

Explain the project clearly to students, teachers, visitors, and judges. Cover smart river monitoring and floating waste collection; river pollution; buoy operation; Arduino UNO, ESP32, GPS, pH, turbidity, water-temperature and GSM sensors/modules, BLDC motors, and the collection net; AI-based waste detection; environmental impact; advantages, limitations, and future improvements.

Use easy-to-understand language, practical explanations, and a warm, encouraging tone. Avoid claiming the project has live sensors, completed deployments, or measured environmental results unless the user provides evidence. Be honest about limitations and distinguish planned features from demonstrated capabilities.`;

  const validHistory = Array.isArray(history)
    ? history
        .slice(-10)
        .filter((entry) => entry && ['user', 'assistant', 'model'].includes(entry.role))
        .map((entry) => ({
          role: entry.role === 'assistant' ? 'model' : entry.role,
          parts: [{ text: String(entry.content || '').trim().slice(0, 4000) }]
        }))
        .filter((entry) => entry.parts[0].text)
    : [];

  const contents = [
    ...validHistory,
    { role: 'user', parts: [{ text: String(message).trim().slice(0, 4000) }] }
  ];

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: { temperature: 0.7, maxOutputTokens: 600 }
        })
      }
    );

    const data = await response.json();
    if (!response.ok) {
      const message = data?.error?.message || 'The Gemini API returned an error.';
      return res.status(502).json({ error: `Gemini API error: ${message}` });
    }

    const reply = data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || '')
      .join('')
      .trim();

    if (!reply) {
      return res.status(502).json({
        error: 'Gemini could not provide a response to that message. Please try asking another way.'
      });
    }

    return res.json({ reply });
  } catch (error) {
    console.error('Gemini request failed:', error.message);
    return res.status(502).json({
      error: 'Unable to contact Gemini right now. Please try again in a moment.'
    });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`RiverGuard AI website running on port ${PORT}`);
});
