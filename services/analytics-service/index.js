const express = require('express');
const app = express();
app.use(express.json());

// Simple predict endpoint that echoes input with a fake score
app.post('/predict', (req, res) => {
  const input = req.body || {};
  // Simple fake prediction logic
  const score = Math.random();
  res.json({ input, score, label: score > 0.5 ? 'high' : 'low', ts: new Date().toISOString() });
});

app.get('/health', (_req, res) => res.json({ status: 'ok', svc: 'analytics' }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Analytics service listening on ${PORT}`));
