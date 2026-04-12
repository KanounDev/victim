const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Vulnerability 1: Command Injection
// The `target` query parameter is passed directly into exec() without sanitization.
// Example exploit: /api/ping?target=8.8.8.8;cat /etc/shadow
app.get('/api/ping', (req, res) => {
  const target = req.query.target;
  if (!target) return res.status(400).json({ error: 'target parameter required' });
  exec(`ping -c 4 ${target}`, (error, stdout, stderr) => {
    res.json({ output: stdout || stderr || String(error) });
  });
});

// Vulnerability 2: Local File Inclusion / Path Traversal
// The `file` query parameter is passed directly into readFileSync() without sanitization.
// Example exploit: /api/read?file=../../../../etc/passwd
app.get('/api/read', (req, res) => {
  const file = req.query.file;
  if (!file) return res.status(400).json({ error: 'file parameter required' });
  try {
    const content = fs.readFileSync(file, 'utf8');
    res.json({ content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Victim app listening on port ${PORT}`);
});
