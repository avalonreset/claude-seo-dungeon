const { WebSocketServer } = require('ws');
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const server = http.createServer();
const wss = new WebSocketServer({ server });

const PORT = 3001;

// Project root is two levels up: server/ -> dungeon/ -> claude-seo-dungeon/
// That's where CLAUDE.md and skills/ live
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

console.log('⚔ Claude SEO Dungeon — Bridge Server');
console.log('─'.repeat(40));

wss.on('connection', (ws) => {
  console.log('🛡 Game client connected');

  ws.on('message', async (raw) => {
    const msg = JSON.parse(raw.toString());
    const { id, command, type } = msg;

    console.log(`⚔ Command #${id} [${type || 'unknown'}]: ${command.substring(0, 80)}`);

    try {
      if (type === 'audit') {
        const result = await runAudit(command, (chunk) => {
          ws.send(JSON.stringify({ id, type: 'stream', content: chunk }));
          console.log(`  ↳ stream: ${chunk.substring(0, 60).replace(/\n/g, ' ')}`);
        });
        ws.send(JSON.stringify({ id, type: 'result', data: result }));
        console.log(`✓ Audit complete: ${result.issues.length} issues found, score: ${result.score}`);

      } else if (type === 'fix') {
        const result = await runFix(command, (chunk) => {
          ws.send(JSON.stringify({ id, type: 'stream', content: chunk }));
          console.log(`  ↳ stream: ${chunk.substring(0, 60).replace(/\n/g, ' ')}`);
        });
        ws.send(JSON.stringify({ id, type: 'result', data: result }));
        console.log(`✓ Fix complete for: ${command.substring(0, 50)}`);

      } else {
        // Generic command
        const result = await runClaude(command, (chunk) => {
          ws.send(JSON.stringify({ id, type: 'stream', content: chunk }));
        });
        ws.send(JSON.stringify({ id, type: 'result', data: result }));
      }
    } catch (err) {
      console.error(`✗ Error on #${id}:`, err.message);
      ws.send(JSON.stringify({ id, type: 'error', message: err.message }));
    }
  });

  ws.on('close', () => {
    console.log('🏃 Game client disconnected');
  });
});

/**
 * Run an SEO audit via Claude CLI.
 * Asks Claude to return structured JSON we can parse into demons.
 */
async function runAudit(domain, onStream) {
  const prompt = `Run a comprehensive SEO audit on the website "${domain}". Analyze it thoroughly for all SEO issues including technical SEO, on-page optimization, content quality, schema markup, performance, accessibility, and crawlability.

After your analysis, return ONLY a JSON object (no markdown, no code fences, no explanation before or after) with this exact structure:

{
  "domain": "${domain}",
  "score": <number 0-100>,
  "totalIssues": <number>,
  "issues": [
    {
      "id": <number>,
      "severity": "<critical|high|medium|low|info>",
      "title": "<short issue title>",
      "description": "<one sentence description>",
      "category": "<Security|Crawlability|On-Page|Links|Schema|Performance|Accessibility|Social|Content>",
      "hp": <number 10-100 based on severity and effort to fix>
    }
  ]
}

Be thorough. Check for: HTTPS/SSL, robots.txt issues, meta descriptions, title tags, broken links, schema markup, page speed, alt text, Open Graph tags, canonical tags, sitemap, mobile-friendliness, heading hierarchy, content quality signals. Return real findings based on what you can determine about this domain. Return ONLY the JSON.`;

  const raw = await runClaude(prompt, onStream);

  // Parse the JSON from Claude's response
  try {
    // Handle if raw is already parsed
    if (raw.issues) return raw;

    // Extract JSON from the response text
    const text = typeof raw === 'string' ? raw : (raw.raw || JSON.stringify(raw));

    // Try to find JSON in the response (strip any markdown fences)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      // Validate structure
      if (parsed.issues && Array.isArray(parsed.issues)) {
        // Ensure all issues have required fields
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

    throw new Error('Could not parse audit results');
  } catch (parseErr) {
    console.error('⚠ Parse error, using raw text to generate issues:', parseErr.message);
    // Last resort: return a basic structure
    return {
      domain,
      score: 50,
      totalIssues: 1,
      issues: [{
        id: 1,
        severity: 'medium',
        title: 'Audit Parsing Error',
        description: 'Claude returned results but they could not be parsed. Raw response logged to server.',
        category: 'General',
        hp: 50
      }]
    };
  }
}

/**
 * Fix a specific SEO issue via Claude CLI.
 */
async function runFix(issueDescription, onStream) {
  const prompt = `You are an SEO expert. Fix this specific SEO issue: ${issueDescription}

Provide a clear, actionable fix. Be concise. Return a JSON object with:
{
  "fixed": true,
  "summary": "<what was done>",
  "details": "<step by step explanation>"
}

Return ONLY the JSON, no markdown fences.`;

  const raw = await runClaude(prompt, onStream);

  try {
    const text = typeof raw === 'string' ? raw : (raw.raw || JSON.stringify(raw));
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    // Fine, return basic success
  }

  return { fixed: true, summary: 'Issue addressed by Claude', details: typeof raw === 'string' ? raw : raw.raw || 'Fix applied' };
}

/**
 * Run a prompt through Claude CLI.
 * Uses `claude -p` for non-interactive prompt mode (uses user's login, not API).
 */
function runClaude(prompt, onStream) {
  return new Promise((resolve, reject) => {
    const args = ['-p', prompt];
    console.log(`  ↳ Running claude from: ${PROJECT_ROOT}`);
    const proc = spawn('claude', args, {
      shell: true,
      cwd: PROJECT_ROOT,
      env: { ...process.env }
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      const chunk = data.toString();
      stdout += chunk;
      onStream(chunk);
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Claude exited with code ${code}: ${stderr}`));
        return;
      }

      try {
        const parsed = JSON.parse(stdout);
        resolve(parsed);
      } catch {
        resolve({ raw: stdout });
      }
    });

    proc.on('error', (err) => {
      reject(new Error(`Failed to spawn claude: ${err.message}`));
    });

    // Timeout after 5 minutes
    setTimeout(() => {
      proc.kill();
      reject(new Error('Claude command timed out (5 min)'));
    }, 300000);
  });
}

server.listen(PORT, () => {
  console.log(`⚔ Bridge server listening on ws://localhost:${PORT}`);
  console.log('🎮 Start the game with: npm run game');
  console.log('─'.repeat(40));
});
