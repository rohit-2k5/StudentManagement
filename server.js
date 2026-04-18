const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const JPDB_BASE = 'http://api.login2explore.com:5577';

// Health check
app.get('/health', (req, res) => res.json({ ok: true }));

// Proxy POST to /api/iml
app.post('/api/iml', async (req, res) => {
  try {
    console.log('Proxy /api/iml ->', req.body && req.body.cmd);
    const r = await fetch(JPDB_BASE + '/api/iml', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const text = await r.text();
    res.status(r.status).send(text);
  } catch (err) {
    console.error('Proxy /api/iml error:', err);
    res.status(500).send(err.toString());
  }
});

// Proxy POST to /api/irl
app.post('/api/irl', async (req, res) => {
  try {
    console.log('Proxy /api/irl ->', req.body && req.body.cmd);
    const r = await fetch(JPDB_BASE + '/api/irl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const text = await r.text();
    res.status(r.status).send(text);
  } catch (err) {
    console.error('Proxy /api/irl error:', err);
    res.status(500).send(err.toString());
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy running on http://localhost:${PORT}`));
