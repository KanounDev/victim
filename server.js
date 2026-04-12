const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Serve the frontend HTML
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>KubeSentinel Demo - Attack Simulator</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
        }
        .container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          padding: 40px;
          max-width: 700px;
          width: 100%;
        }
        h1 {
          color: #333;
          margin-bottom: 10px;
          text-align: center;
        }
        .subtitle {
          text-align: center;
          color: #666;
          margin-bottom: 30px;
          font-size: 14px;
        }
        .section {
          margin-bottom: 30px;
        }
        .section-title {
          font-size: 18px;
          font-weight: bold;
          color: #667eea;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 2px solid #667eea;
        }
        .attack-btn {
          display: block;
          width: 100%;
          padding: 15px 20px;
          margin-bottom: 12px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          color: white;
        }
        .attack-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
        }
        .attack-btn:active {
          transform: translateY(0);
        }
        .cmd-injection {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }
        .cmd-injection:hover {
          background: linear-gradient(135deg, #f093fb 0%, #e63946 100%);
        }
        .file-read {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }
        .file-read:hover {
          background: linear-gradient(135deg, #3f9dfe 0%, #00d9ff 100%);
        }
        .status {
          margin-top: 30px;
          padding: 20px;
          border-radius: 8px;
          background: #f5f5f5;
          border-left: 4px solid #ddd;
          display: none;
        }
        .status.show {
          display: block;
        }
        .status.success {
          background: #d4edda;
          border-left-color: #28a745;
          color: #155724;
        }
        .status.error {
          background: #f8d7da;
          border-left-color: #dc3545;
          color: #721c24;
        }
        .status-title {
          font-weight: bold;
          margin-bottom: 8px;
        }
        .status-content {
          font-size: 13px;
          font-family: 'Courier New', monospace;
          word-break: break-all;
          white-space: pre-wrap;
          max-height: 200px;
          overflow-y: auto;
        }
        .info-box {
          background: #e7f3ff;
          border-left: 4px solid #2196F3;
          padding: 15px;
          border-radius: 4px;
          margin-bottom: 20px;
          font-size: 14px;
          color: #1565c0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>KubeSentinel Demo</h1>
        <p class="subtitle">Attack Simulator - Press buttons to trigger exploits</p>
        <p class="subtitle" style="color: #999; font-size: 12px;">Watch Falco catch these in real-time</p>

        <div class="info-box">
          <strong>Lab Environment Only</strong> - These attacks are intentional for demonstration purposes.
        </div>

        <div class="section">
          <div class="section-title">Attack Vector 1: Command Injection</div>
          <button class="attack-btn cmd-injection" onclick="executeAttack('ping-simple')">
            Ping 8.8.8.8 (Safe Baseline)
          </button>
          <button class="attack-btn cmd-injection" onclick="executeAttack('ping-shadow')">
            Read /etc/shadow via Injection
          </button>
          <button class="attack-btn cmd-injection" onclick="executeAttack('ping-env')">
            Dump Environment Variables
          </button>
          <button class="attack-btn cmd-injection" onclick="executeAttack('ping-whoami')">
            Identity Check (whoami)
          </button>
        </div>

        <div class="section">
          <div class="section-title">Attack Vector 2: Local File Inclusion</div>
          <button class="attack-btn file-read" onclick="executeAttack('read-passwd')">
            Read /etc/passwd
          </button>
          <button class="attack-btn file-read" onclick="executeAttack('read-hostname')">
            Read /proc/self/hostname
          </button>
          <button class="attack-btn file-read" onclick="executeAttack('read-k8s-token')">
            Steal Kubernetes Service Account Token
          </button>
          <button class="attack-btn file-read" onclick="executeAttack('read-env')">
            Read /proc/self/environ
          </button>
        </div>

        <div id="status" class="status">
          <div class="status-title" id="statusTitle">Status</div>
          <div class="status-content" id="statusContent"></div>
        </div>
      </div>

      <script>
        async function executeAttack(attackType) {
          const statusDiv = document.getElementById('status');
          const statusTitle = document.getElementById('statusTitle');
          const statusContent = document.getElementById('statusContent');

          statusDiv.className = 'status show';
          statusTitle.innerHTML = 'Executing attack...';
          statusContent.textContent = 'Please wait...';

          try {
            const response = await fetch('/execute?attack=' + encodeURIComponent(attackType));
            const data = await response.json();

            if (data.success) {
              statusDiv.className = 'status show success';
              statusTitle.innerHTML = 'Attack executed successfully';
              statusContent.textContent = data.output || '(No output)';
            } else {
              statusDiv.className = 'status show error';
              statusTitle.innerHTML = 'Attack failed';
              statusContent.textContent = data.error || 'Unknown error';
            }
          } catch (err) {
            statusDiv.className = 'status show error';
            statusTitle.innerHTML = 'Error';
            statusContent.textContent = err.message;
          }
        }
      </script>
    </body>
    </html>
  `);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Attack execution endpoint
app.get('/execute', (req, res) => {
  const attack = req.query.attack;

  const attacks = {
    'ping-simple': { cmd: 'ping -c 2 8.8.8.8', desc: 'Simple ping' },
    'ping-shadow': { cmd: 'ping -c 1 8.8.8.8; cat /etc/shadow', desc: 'Read /etc/shadow' },
    'ping-env': { cmd: 'ping -c 1 8.8.8.8; env', desc: 'Dump environment' },
    'ping-whoami': { cmd: 'whoami', desc: 'Check identity' },
    'read-passwd': { file: '/etc/passwd', desc: 'Read /etc/passwd' },
    'read-hostname': { file: '/proc/self/hostname', desc: 'Read hostname' },
    'read-k8s-token': { file: '/run/secrets/kubernetes.io/serviceaccount/token', desc: 'Read K8s token' },
    'read-env': { file: '/proc/self/environ', desc: 'Read environment' }
  };

  const attackConfig = attacks[attack];
  if (!attackConfig) {
    return res.json({ success: false, error: 'Unknown attack type' });
  }

  try {
    if (attackConfig.cmd) {
      exec(attackConfig.cmd, (error, stdout, stderr) => {
        const output = stdout || stderr || (error ? error.message : '');
        res.json({
          success: true,
          output: output.substring(0, 1000)
        });
      });
    } else if (attackConfig.file) {
      try {
        const content = fs.readFileSync(attackConfig.file, 'utf8');
        res.json({
          success: true,
          output: content.substring(0, 1000)
        });
      } catch (err) {
        res.json({
          success: false,
          error: err.message
        });
      }
    }
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// Legacy endpoints (kept for compatibility)
app.get('/api/ping', (req, res) => {
  const target = req.query.target;
  if (!target) return res.status(400).json({ error: 'target parameter required' });
  exec(`ping -c 4 ${target}`, (error, stdout, stderr) => {
    res.json({ output: stdout || stderr || String(error) });
  });
});

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
