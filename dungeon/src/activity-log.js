/**
 * Guild Ledger — Animated activity log with rich color coding,
 * typewriter effects, glowing text, pulse animations, and
 * contextual icons for different event types.
 */

const CHAR_DELAY = 14;       // ms per character for typewriter
const GLOW_DURATION = 2000;  // ms for the new-line glow to fade

let logEl = null;
let queue = [];
let isTyping = false;
let loadingIndicator = null;
let loadingFrame = 0;
let loadingInterval = null;
let lineCount = 0;

// ── Icons per category ──
const ICONS = {
  tool: '\u2692',       // ⚒ hammer and pick
  agent: '\u2726',      // ✦ star
  fetch: '\u21E3',      // ⇣ downward arrow
  search: '\u2318',     // ⌘ command
  read: '\u25A4',       // ▤ document
  write: '\u270E',      // ✎ pencil
  bash: '\u25B6',       // ▶ play
  skill: '\u2605',      // ★ star
  error: '\u2716',      // ✖ cross
  complete: '\u2714',   // ✔ check
  status: '\u25C8',     // ◈ diamond
  system: '\u25CB',     // ○ circle
  domain: '\u2302',     // ⌂ house
  score: '\u2620',      // ☠ skull
  demon: '\u2620',      // ☠ skull
  fix: '\u2694',        // ⚔ swords
  text: '\u25AA',       // ▪ small square
};

// ── Classify log text into categories with sub-types ──
function classify(text) {
  // Errors
  if (text.startsWith('ERROR') || text.startsWith('Fix error') || text.startsWith('Fix failed'))
    return 'error';

  // Tool calls — sub-classify by tool type
  if (text.startsWith('[Agent]')) return 'agent';
  if (text.startsWith('[WebFetch]') || text.startsWith('[WebSearch]')) return 'fetch';
  if (text.startsWith('[Grep]') || text.startsWith('[Glob]') || text.startsWith('[ToolSearch]')) return 'search';
  if (text.startsWith('[Read]')) return 'read';
  if (text.startsWith('[Write]') || text.startsWith('[Edit]') || text.startsWith('[NotebookEdit]')) return 'write';
  if (text.startsWith('[Bash]')) return 'bash';
  if (text.startsWith('[Skill]')) return 'skill';
  if (text.startsWith('[TodoWrite]') || text.startsWith('[TaskCreate]')) return 'status';
  if (text.startsWith('[')) return 'tool';

  // Completion signals
  if (text.includes('[Complete]') || text.includes('omplete')) return 'complete';

  // Status / progress
  if (/^(Audit|Fix|Score|Found|Scanning|Initializing|Subagent)/i.test(text)) return 'status';
  if (/demons?\s*(remain|found|slain|await)/i.test(text)) return 'demon';
  if (/score/i.test(text)) return 'score';

  // Hunting / domain
  if (text.startsWith('Hunting:') || text.startsWith('Source:')) return 'domain';

  // System messages
  if (/^(System|Waiting|Connected|Bridge|Ready|Recalled)/i.test(text)) return 'system';

  // Fix results
  if (/vanquish|strikes|damage|fixed/i.test(text)) return 'fix';

  return 'text';
}

// ── Get icon for class ──
function getIcon(cls) {
  return ICONS[cls] || ICONS.text;
}

// ── Typewriter effect with icon prefix ──
function typewriterLine(text, cls) {
  return new Promise((resolve) => {
    const line = document.createElement('div');
    line.className = `log-line ${cls} typing glow`;

    // Icon prefix
    const icon = document.createElement('span');
    icon.className = 'log-icon';
    icon.textContent = getIcon(cls) + ' ';
    line.appendChild(icon);

    // Text content typed out
    const content = document.createElement('span');
    content.className = 'log-text';
    content.textContent = '';
    line.appendChild(content);

    logEl.appendChild(line);
    scrollToBottom();

    lineCount++;

    // Insert subtle separator every 10 lines
    if (lineCount % 12 === 0) {
      const sep = document.createElement('div');
      sep.className = 'log-separator';
      sep.innerHTML = '<span class="sep-dot">·</span><span class="sep-dot">·</span><span class="sep-dot">·</span>';
      logEl.appendChild(sep);
    }

    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        content.textContent += text[i];
        i++;
        scrollToBottom();
      } else {
        clearInterval(interval);
        line.classList.remove('typing');
        setTimeout(() => line.classList.remove('glow'), GLOW_DURATION);
        resolve();
      }
    }, CHAR_DELAY);
  });
}

// ── Process queue one line at a time ──
async function processQueue() {
  if (isTyping) return;
  isTyping = true;

  while (queue.length > 0) {
    const { text, cls } = queue.shift();
    hideLoading();
    await typewriterLine(text, cls);
  }

  isTyping = false;
}

// ── Loading indicator (animated rune spinner) ──
function showLoading() {
  if (loadingIndicator) return;

  loadingIndicator = document.createElement('div');
  loadingIndicator.className = 'log-line log-loading';
  logEl.appendChild(loadingIndicator);
  scrollToBottom();

  const runes = ['\u25C7', '\u25C6', '\u25C8', '\u25C6']; // ◇ ◆ ◈ ◆
  loadingFrame = 0;
  loadingInterval = setInterval(() => {
    loadingFrame = (loadingFrame + 1) % runes.length;
    if (loadingIndicator) {
      loadingIndicator.innerHTML = `<span class="loading-rune">${runes[loadingFrame]}</span><span class="loading-text"> channeling</span>`;
    }
    scrollToBottom();
  }, 500);
}

function hideLoading() {
  if (loadingIndicator) {
    loadingIndicator.remove();
    loadingIndicator = null;
  }
  if (loadingInterval) {
    clearInterval(loadingInterval);
    loadingInterval = null;
  }
}

function scrollToBottom() {
  if (logEl) logEl.scrollTop = logEl.scrollHeight;
}

// ── Public API ──
export function initActivityLog() {
  logEl = document.getElementById('log-content');
  if (!logEl) return;

  const style = document.createElement('style');
  style.textContent = `
    /* ── Base line ── */
    .log-line {
      opacity: 0;
      animation: fadeInLine 0.35s ease forwards;
      position: relative;
    }

    @keyframes fadeInLine {
      from { opacity: 0; transform: translateX(-6px); }
      to { opacity: 1; transform: translateX(0); }
    }

    .log-line.typing { opacity: 1; }

    /* ── Icon styling ── */
    .log-icon {
      display: inline-block;
      width: 16px;
      text-align: center;
      margin-right: 4px;
      font-size: 10px;
      opacity: 0.6;
    }

    /* ── Glow effects per class ── */
    .log-line.glow {
      text-shadow: 0 0 8px currentColor;
      transition: text-shadow ${GLOW_DURATION}ms ease;
    }
    .log-line.glow.tool    { text-shadow: 0 0 14px rgba(125, 216, 232, 0.6); }
    .log-line.glow.agent   { text-shadow: 0 0 16px rgba(180, 140, 255, 0.6); }
    .log-line.glow.fetch   { text-shadow: 0 0 14px rgba(100, 180, 255, 0.5); }
    .log-line.glow.search  { text-shadow: 0 0 12px rgba(160, 200, 255, 0.4); }
    .log-line.glow.read    { text-shadow: 0 0 10px rgba(140, 180, 200, 0.4); }
    .log-line.glow.write   { text-shadow: 0 0 14px rgba(255, 180, 80, 0.5); }
    .log-line.glow.bash    { text-shadow: 0 0 12px rgba(120, 220, 120, 0.5); }
    .log-line.glow.skill   { text-shadow: 0 0 18px rgba(212, 175, 55, 0.6); }
    .log-line.glow.status  { text-shadow: 0 0 14px rgba(232, 200, 72, 0.5); }
    .log-line.glow.error   { text-shadow: 0 0 16px rgba(240, 96, 96, 0.6); }
    .log-line.glow.complete{ text-shadow: 0 0 18px rgba(96, 240, 96, 0.6); }
    .log-line.glow.fix     { text-shadow: 0 0 16px rgba(212, 175, 55, 0.6); }
    .log-line.glow.demon   { text-shadow: 0 0 14px rgba(240, 80, 80, 0.5); }
    .log-line.glow.domain  { text-shadow: 0 0 12px rgba(136, 187, 255, 0.4); }

    .log-line:not(.glow) { text-shadow: none; }

    /* ── Color per class ── */
    .log-line.tool    { color: #7dd8e8; }
    .log-line.agent   { color: #b48cff; }
    .log-line.fetch   { color: #64b4ff; }
    .log-line.search  { color: #a0c8ff; }
    .log-line.read    { color: #8cb4c8; }
    .log-line.write   { color: #ffb450; }
    .log-line.bash    { color: #78dc78; }
    .log-line.skill   { color: #d4af37; }
    .log-line.status  { color: #e8c848; }
    .log-line.system  { color: #808898; }
    .log-line.error   { color: #f06060; }
    .log-line.complete{ color: #60e060; }
    .log-line.fix     { color: #d4af37; }
    .log-line.demon   { color: #e05050; }
    .log-line.domain  { color: #88bbff; }
    .log-line.score   { color: #e8c848; }
    .log-line.text    { color: #b0b8c0; }

    /* ── Typing cursor ── */
    .log-line.typing::after {
      content: '\\2588';
      animation: cursorBlink 0.7s step-end infinite;
      color: #d4af37;
      font-weight: 300;
      font-size: 12px;
    }

    @keyframes cursorBlink {
      0%, 50% { opacity: 1; }
      51%, 100% { opacity: 0; }
    }

    /* ── Separator dots ── */
    .log-separator {
      text-align: center;
      padding: 4px 0;
      opacity: 0;
      animation: fadeInLine 0.5s ease forwards;
    }
    .sep-dot {
      display: inline-block;
      color: #303050;
      font-size: 14px;
      margin: 0 6px;
      animation: sepPulse 3s ease-in-out infinite;
    }
    .sep-dot:nth-child(2) { animation-delay: 0.3s; }
    .sep-dot:nth-child(3) { animation-delay: 0.6s; }

    @keyframes sepPulse {
      0%, 100% { opacity: 0.3; color: #303050; }
      50% { opacity: 0.7; color: #505078; }
    }

    /* ── Loading rune spinner ── */
    .log-loading { opacity: 1; color: #606880; }

    .loading-rune {
      display: inline-block;
      color: #d4af37;
      animation: runeGlow 1.5s ease-in-out infinite, runeSpin 2s linear infinite;
      font-size: 14px;
    }

    @keyframes runeGlow {
      0%, 100% { opacity: 0.4; text-shadow: 0 0 4px rgba(212, 175, 55, 0.2); }
      50% { opacity: 1; text-shadow: 0 0 12px rgba(212, 175, 55, 0.6); }
    }

    @keyframes runeSpin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .loading-text {
      display: inline-block;
      min-width: 100px;
      animation: loadingPulse 2s ease-in-out infinite;
      font-style: italic;
    }

    @keyframes loadingPulse {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 0.7; }
    }

    /* ── Agent lines get a left accent bar ── */
    .log-line.agent {
      border-left: 2px solid rgba(180, 140, 255, 0.3);
      padding-left: 8px;
      margin-left: -2px;
    }

    /* ── Error lines pulse ── */
    .log-line.error {
      animation: fadeInLine 0.35s ease forwards, errorPulse 2s ease-in-out 1;
    }

    @keyframes errorPulse {
      0%, 100% { background: transparent; }
      20% { background: rgba(240, 60, 60, 0.08); }
      80% { background: transparent; }
    }

    /* ── Complete lines flash ── */
    .log-line.complete {
      animation: fadeInLine 0.35s ease forwards, completePop 0.6s ease 1;
    }

    @keyframes completePop {
      0% { transform: scale(1); }
      30% { transform: scale(1.02); }
      100% { transform: scale(1); }
    }

    /* ── Skill lines shimmer ── */
    .log-line.skill {
      animation: fadeInLine 0.35s ease forwards, skillShimmer 3s ease-in-out 1;
    }

    @keyframes skillShimmer {
      0%, 100% { filter: brightness(1); }
      50% { filter: brightness(1.3); }
    }
  `;
  document.head.appendChild(style);

  logEl.innerHTML = '';
}

export function addLog(msg) {
  if (!msg || !logEl) return;

  let clean = msg.replace(/[\n\r]+/g, ' ').trim();
  if (!clean || clean.length < 3) return;
  if (clean === '[working...]') return;
  if (clean.startsWith('{') || clean.startsWith('"')) return;
  if (clean.includes('":"') && clean.includes('","')) return;

  const cls = classify(clean);
  queue.push({ text: clean, cls });

  // Limit total lines
  while (logEl.children.length > 300) {
    logEl.removeChild(logEl.firstChild);
  }

  processQueue();
}

export function showLoadingIndicator() {
  showLoading();
}

export function hideLoadingIndicator() {
  hideLoading();
}
