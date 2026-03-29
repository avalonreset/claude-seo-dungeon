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

// Track active child processes so they can be cancelled
const activeProcesses = new Map(); // id -> ChildProcess

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
    const { id, command, type, projectPath, model } = msg;

    // Use project path for fixes, project root for audits
    const fixCwd = projectPath || PROJECT_ROOT;

    console.log(`Command #${id} [${type}]: ${command ? command.substring(0, 80) : '(no command)'}`);
    if (model) console.log(`  Model: ${model}`);
    if (projectPath) console.log(`  Project: ${projectPath}`);

    // Cancel — kill the child process for a given request
    if (type === 'cancel') {
      const proc = activeProcesses.get(id);
      if (proc) {
        console.log(`Cancelling process #${id}`);
        proc.kill('SIGTERM');
        activeProcesses.delete(id);
      }
      safeSend(JSON.stringify({ id, type: 'error', message: 'Cancelled by user' }));
      return;
    }

    try {
      if (type === 'audit') {
        const result = await runAudit(command, (chunk) => {
          safeSend(JSON.stringify({ id, type: 'stream', content: chunk }));
        }, undefined, id, model);
        activeProcesses.delete(id);
        safeSend(JSON.stringify({ id, type: 'result', data: result }));
        console.log(`Audit done: ${result.issues.length} issues, score ${result.score}`);

      } else if (type === 'fix') {
        const result = await runFix(command, fixCwd, (chunk) => {
          safeSend(JSON.stringify({ id, type: 'stream', content: chunk }));
        }, id, model);
        activeProcesses.delete(id);
        safeSend(JSON.stringify({ id, type: 'result', data: result }));
        console.log(`Fix done: ${command.substring(0, 50)}`);

      } else if (type === 'commit') {
        const result = await runCommit(command, fixCwd, (chunk) => {
          safeSend(JSON.stringify({ id, type: 'stream', content: chunk }));
        }, id, model);
        activeProcesses.delete(id);
        safeSend(JSON.stringify({ id, type: 'result', data: result }));
        console.log(`Commit done in ${fixCwd}`);

      } else {
        const result = await runClaude(command, (chunk) => {
          safeSend(JSON.stringify({ id, type: 'stream', content: chunk }));
        }, undefined, id, model);
        activeProcesses.delete(id);
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
async function runAudit(domain, onStream, cwd, requestId, model) {
  const prompt = `Run /seo audit on ${domain}. This will trigger the full SEO audit skill which spawns multiple subagents for technical SEO, content quality, schema markup, performance, crawlability, images, and more.

After the audit completes, CONSOLIDATE the findings into actionable groups. Do NOT list every granular finding as a separate issue. Instead, group related problems that would be fixed together into a single issue. For example, all mobile responsiveness problems (touch targets, font sizes, overflow) become one issue. All missing meta tags become one issue. Aim for 8-15 total issues maximum — each one should represent a meaningful, distinct area of work.

ORDER THE ISSUES BY SEO IMPACT — the issue that would make the single biggest difference to search rankings and user experience goes first (id:1). The last issue should be the least impactful nice-to-have. Use severity labels that reflect this: "critical" for top-priority ranking killers, "high" for significant problems, "medium" for meaningful improvements, "low" for minor optimizations, "info" for best-practice suggestions.

Format as a single JSON object. Return ONLY valid JSON at the very end (no markdown fences): {"domain":"${domain}","score":<overall 0-100>,"totalIssues":<n>,"issues":[{"id":<n>,"severity":"<critical|high|medium|low|info>","title":"<clear actionable title>","description":"<what specifically is wrong and what needs to be fixed — include key details so the fix agent knows what to do>","category":"<category>","hp":<10-100 based on combined effort to fix all items in this group>}]}

Quality over quantity. Each issue should be a real battle worth fighting, not busywork.`;

  const raw = await runClaude(prompt, onStream, undefined, requestId, model);

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
    throw new Error(`Audit completed but results could not be parsed: ${parseErr.message}`);
  }
}

/**
 * Fix a specific SEO issue via Claude CLI.
 * Runs inside the user's project directory so Claude can edit real files.
 */
async function runFix(issueDescription, projectCwd, onStream, requestId, model) {
  const prompt = `You are working in a website project directory. Fix this SEO issue by editing the actual source files: ${issueDescription}

This issue may represent a group of related problems. Fix ALL aspects described — not just one. Look at the project files, identify everything that needs to change, and make the edits. Be thorough but precise — fix what's described, nothing more. After making changes, return a JSON summary: {"fixed":true,"summary":"<what was changed>","filesChanged":["<list of files>"]}

Return the JSON summary at the very end after making all changes.`;

  const raw = await runClaude(prompt, onStream, projectCwd, requestId, model);

  try {
    const text = typeof raw === 'string' ? raw : (raw.raw || JSON.stringify(raw));
    const jsonMatch = text.match(/\{[\s\S]*"fixed"[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch (e) {}

  return { fixed: true, summary: 'Changes applied by Claude', filesChanged: [] };
}

/**
 * Commit current changes in the project.
 */
async function runCommit(message, projectCwd, onStream, requestId, model) {
  const prompt = `In this project directory, stage all changed files and create a git commit with this message: "${message}". Do NOT push. Return JSON: {"committed":true,"message":"<commit message>","hash":"<short hash>"}`;

  const raw = await runClaude(prompt, onStream, projectCwd, requestId, model);

  try {
    const text = typeof raw === 'string' ? raw : (raw.raw || JSON.stringify(raw));
    const jsonMatch = text.match(/\{[\s\S]*"committed"[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch (e) {}

  return { committed: true, message, hash: 'unknown' };
}

/**
 * Run claude -p. Uses the user's existing login, not API.
 * @param {string} prompt - The prompt to send
 * @param {function} onStream - Callback for streaming output
 * @param {string} [cwd] - Working directory (defaults to PROJECT_ROOT)
 */
function runClaude(prompt, onStream, cwd, requestId, model) {
  const workDir = cwd || PROJECT_ROOT;
  return new Promise((resolve, reject) => {
    const cliJs = path.join(process.env.APPDATA, 'npm', 'node_modules', '@anthropic-ai', 'claude-code', 'cli.js');
    const modelName = model || 'claude-sonnet-4-6';
    console.log(`  Running with stream-json (model: ${modelName})`);
    console.log(`  CWD: ${workDir}`);
    const proc = spawn(process.execPath, [cliJs, '-p', prompt, '--model', modelName, '--output-format', 'stream-json', '--verbose'], {
      cwd: workDir,
      env: { ...process.env }
    });

    // Register for cancellation
    if (requestId) activeProcesses.set(requestId, proc);

    let fullText = '';
    let buffer = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      buffer += data.toString();

      // Process complete JSON lines from the buffer
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Keep incomplete line in buffer

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const event = JSON.parse(line);

          // Extract info from all stream event types
          if (event.type === 'assistant' && event.message) {
            const content = event.message.content;
            if (Array.isArray(content)) {
              for (const block of content) {
                if (block.type === 'text' && block.text) {
                  fullText += block.text;
                  const lines = block.text.split('\n').filter(l => l.trim());
                  for (const line of lines) {
                    onStream(line.trim());
                  }
                }
                if (block.type === 'tool_use') {
                  const input = block.input || {};
                  let detail = '';
                  if (input.url) detail = input.url;
                  else if (input.query) detail = input.query;
                  else if (input.command) detail = input.command.substring(0, 80);
                  else if (input.pattern) detail = input.pattern;
                  else if (input.file_path) detail = input.file_path;
                  else if (input.prompt) detail = input.prompt.substring(0, 60);
                  else if (input.description) detail = input.description;

                  const toolMsg = detail
                    ? `[${block.name}] ${detail}`
                    : `[${block.name}]`;
                  onStream(toolMsg);
                  console.log(`  ${toolMsg}`);
                }
              }
            }
          } else if (event.type === 'tool_result' || event.type === 'tool_output') {
            // Stream tool results — show truncated output so user sees activity
            const content = event.content || event.output;
            if (typeof content === 'string' && content.trim()) {
              const preview = content.trim().split('\n')[0].substring(0, 80);
              if (preview.length > 5) onStream(preview);
            } else if (Array.isArray(content)) {
              for (const block of content) {
                if (block.type === 'text' && block.text) {
                  const preview = block.text.trim().split('\n')[0].substring(0, 80);
                  if (preview.length > 5) onStream(preview);
                }
              }
            }
          } else if (event.type === 'result') {
            if (event.result) {
              fullText = event.result;
              onStream('[Complete]');
            }
          } else if (event.type === 'system' && event.message) {
            onStream(event.message);
          }
        } catch (e) {
          // Not valid JSON, might be partial — skip
        }
      }
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      // Process any remaining buffer
      if (buffer.trim()) {
        try {
          const event = JSON.parse(buffer);
          if (event.type === 'result' && event.result) {
            fullText = event.result;
          }
        } catch (e) {}
      }

      console.log(`  Claude finished (exit ${code}), ${fullText.length} chars`);
      if (code !== 0) {
        reject(new Error(`Claude exited with code ${code}: ${stderr}`));
        return;
      }
      try {
        resolve(JSON.parse(fullText));
      } catch {
        resolve({ raw: fullText });
      }
    });

    proc.on('error', (err) => {
      reject(new Error(`Failed to spawn claude: ${err.message}`));
    });

    // No timeout — user can cancel manually via the abandon scroll
  });
}

server.listen(PORT, () => {
  console.log(`Bridge listening on ws://localhost:${PORT}`);
  console.log(`Claude runs from: ${PROJECT_ROOT}`);
  console.log('─'.repeat(40));
});
