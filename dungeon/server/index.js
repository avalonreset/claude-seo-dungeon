const { WebSocketServer } = require('ws');
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const server = http.createServer();
const wss = new WebSocketServer({
  server,
  // Keep connections alive during long audits
  perMessageDeflate: false
});

const PORT = 3001;

// Project root: server/ -> dungeon/ -> claude-seo-dungeon/
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

// Catch crashes so server stays alive
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception (server stays alive):', err.message);
});
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection (server stays alive):', err.message || err);
});

console.log('Claude SEO Dungeon — Bridge Server');
console.log('─'.repeat(40));

wss.on('connection', (ws) => {
  console.log('Game client connected');

  // Keepalive ping every 15s so the connection doesn't drop during long audits
  const pingInterval = setInterval(() => {
    if (ws.readyState === ws.OPEN) {
      ws.ping();
    }
  }, 15000);

  const safeSend = (data) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(typeof data === 'string' ? data : JSON.stringify(data));
    }
  };

  ws.on('message', async (raw) => {
    const msg = JSON.parse(raw.toString());
    const { id, command, type } = msg;

    console.log(`Command #${id} [${type}]: ${command.substring(0, 80)}`);

    try {
      if (type === 'audit') {
        const result = await runAudit(command, (chunk) => {
          safeSend(JSON.stringify({ id, type: 'stream', content: chunk }));
        });
        safeSend(JSON.stringify({ id, type: 'result', data: result }));
        console.log(`Audit done: ${result.issues.length} issues, score ${result.score}`);

      } else if (type === 'fix') {
        const result = await runFix(command, (chunk) => {
          safeSend(JSON.stringify({ id, type: 'stream', content: chunk }));
        });
        safeSend(JSON.stringify({ id, type: 'result', data: result }));
        console.log(`Fix done: ${command.substring(0, 50)}`);

      } else {
        const result = await runClaude(command, (chunk) => {
          safeSend(JSON.stringify({ id, type: 'stream', content: chunk }));
        });
        safeSend(JSON.stringify({ id, type: 'result', data: result }));
      }
    } catch (err) {
      console.error(`Error on #${id}:`, err.message);
      safeSend(JSON.stringify({ id, type: 'error', message: err.message }));
    }
  });

  ws.on('close', () => {
    clearInterval(pingInterval);
    console.log('Game client disconnected');
  });
});

/**
 * Run an SEO audit via Claude CLI.
 */
async function runAudit(domain, onStream) {
  const prompt = `Analyze the website "${domain}" for SEO issues. Return ONLY valid JSON (no markdown fences, no explanation, no preamble): {"domain":"${domain}","score":<0-100>,"totalIssues":<n>,"issues":[{"id":<n>,"severity":"<critical|high|medium|low|info>","title":"<title>","description":"<desc>","category":"<category>","hp":<10-100>}]}. Check HTTPS, meta tags, schema, performance, crawlability, heading structure, images, sitemap. Be thorough with real findings.`;

  const raw = await runClaude(prompt, onStream);

  try {
    if (raw.issues) return raw;

    const text = typeof raw === 'string' ? raw : (raw.raw || JSON.stringify(raw));

    // Extract JSON — handle markdown fences and preamble text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.issues && Array.isArray(parsed.issues)) {
        parsed.issues = parsed.issues.map((issue, i) => ({
          id: issue.id || i + 1,
          severity: issue.severity || 'medium',
          title: issue.title || 'Unknown Issue',
          description: issue.description || 'No description',
          category: issue.category || 'General',
          hp: issue.hp || 50
        }));
        parsed.domain = parsed.domain || domain;
        parsed.score = parsed.score || 50;
        parsed.totalIssues = parsed.issues.length;
        return parsed;
      }
    }
    throw new Error('No valid JSON found');
  } catch (parseErr) {
    console.error('Parse error:', parseErr.message);
    return {
      domain,
      score: 50,
      totalIssues: 1,
      issues: [{
        id: 1, severity: 'medium', title: 'Audit Parsing Error',
        description: 'Claude returned data but it could not be parsed.',
        category: 'General', hp: 50
      }]
    };
  }
}

/**
 * Fix a specific SEO issue via Claude CLI.
 */
async function runFix(issueDescription, onStream) {
  const prompt = `Fix this SEO issue: ${issueDescription}. Return ONLY valid JSON (no markdown): {"fixed":true,"summary":"<what to do>","details":"<step by step>"}`;

  const raw = await runClaude(prompt, onStream);

  try {
    const text = typeof raw === 'string' ? raw : (raw.raw || JSON.stringify(raw));
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch (e) {}

  return { fixed: true, summary: 'Issue addressed by Claude', details: '' };
}

/**
 * Run claude -p. Uses the user's existing login, not API.
 */
function runClaude(prompt, onStream) {
  return new Promise((resolve, reject) => {
    // Call Claude's cli.js directly via Node — no shell needed
    const cliJs = path.join(process.env.APPDATA, 'npm', 'node_modules', '@anthropic-ai', 'claude-code', 'cli.js');
    console.log(`  Running: node ${cliJs}`);
    console.log(`  CWD: ${PROJECT_ROOT}`);
    const proc = spawn(process.execPath, [cliJs, '-p', prompt], {
      cwd: PROJECT_ROOT,
      env: { ...process.env }
    });

    // Send heartbeat messages so the game knows we're alive
    const heartbeat = setInterval(() => {
      onStream('[working...]');
    }, 5000);

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      const chunk = data.toString();
      stdout += chunk;
      onStream(chunk);
      // Log progress so we know it's alive
      process.stdout.write('.');
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      clearInterval(heartbeat);
      console.log(`  Claude finished (exit ${code}), ${stdout.length} bytes`);
      if (code !== 0) {
        reject(new Error(`Claude exited with code ${code}: ${stderr}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout));
      } catch {
        resolve({ raw: stdout });
      }
    });

    proc.on('error', (err) => {
      reject(new Error(`Failed to spawn claude: ${err.message}`));
    });

    setTimeout(() => {
      proc.kill();
      reject(new Error('Claude command timed out (5 min)'));
    }, 300000);
  });
}

server.listen(PORT, () => {
  console.log(`Bridge listening on ws://localhost:${PORT}`);
  console.log(`Claude runs from: ${PROJECT_ROOT}`);
  console.log('─'.repeat(40));
});
