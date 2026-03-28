/**
 * Animated Activity Log — typewriter effect, animated ellipsis,
 * glow on new lines, smooth auto-scroll.
 */

const CHAR_DELAY = 18;       // ms per character for typewriter
const GLOW_DURATION = 1500;  // ms for the new-line glow to fade

let logEl = null;
let queue = [];
let isTyping = false;
let loadingIndicator = null;
let loadingFrame = 0;
let loadingInterval = null;

// ── Color classes ──
function getClass(text) {
  if (text.startsWith('ERROR')) return 'error';
  if (text.startsWith('[')) return 'tool';
  if (/^(Audit|Fix|Score|Found)/.test(text)) return 'status';
  if (/^(System|Waiting|Connected|Bridge)/.test(text)) return 'system';
  if (text.includes('omplete')) return 'complete';
  return 'text';
}

// ── Typewriter effect ──
function typewriterLine(text, cls) {
  return new Promise((resolve) => {
    const line = document.createElement('div');
    line.className = `log-line ${cls} typing glow`;
    line.textContent = '';
    logEl.appendChild(line);
    scrollToBottom();

    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        line.textContent += text[i];
        i++;
        scrollToBottom();
      } else {
        clearInterval(interval);
        line.classList.remove('typing');
        // Fade out the glow
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

// ── Loading indicator (animated dots) ──
function showLoading() {
  if (loadingIndicator) return;

  loadingIndicator = document.createElement('div');
  loadingIndicator.className = 'log-line log-loading';
  logEl.appendChild(loadingIndicator);
  scrollToBottom();

  const dots = ['', '.', '..', '...'];
  loadingFrame = 0;
  loadingInterval = setInterval(() => {
    loadingFrame = (loadingFrame + 1) % dots.length;
    if (loadingIndicator) {
      loadingIndicator.innerHTML = `<span class="loading-text">processing${dots[loadingFrame]}</span>`;
    }
    scrollToBottom();
  }, 400);
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

  // Inject CSS for animations
  const style = document.createElement('style');
  style.textContent = `
    .log-line {
      opacity: 0;
      animation: fadeInLine 0.3s ease forwards;
    }

    @keyframes fadeInLine {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .log-line.typing {
      opacity: 1;
    }

    .log-line.glow {
      text-shadow: 0 0 8px currentColor;
      transition: text-shadow 1.5s ease;
    }

    .log-line.glow.tool {
      text-shadow: 0 0 12px rgba(125, 216, 232, 0.5);
    }

    .log-line.glow.status {
      text-shadow: 0 0 12px rgba(232, 200, 72, 0.5);
    }

    .log-line.glow.error {
      text-shadow: 0 0 12px rgba(240, 96, 96, 0.5);
    }

    .log-line.glow.complete {
      text-shadow: 0 0 12px rgba(96, 208, 96, 0.5);
    }

    .log-line:not(.glow) {
      text-shadow: none;
    }

    .log-loading {
      opacity: 1;
      color: #606880;
    }

    .loading-text {
      display: inline-block;
      min-width: 120px;
      animation: loadingPulse 2s ease-in-out infinite;
    }

    @keyframes loadingPulse {
      0%, 100% { opacity: 0.4; }
      50% { opacity: 0.8; }
    }

    /* Cursor blink on the line being typed */
    .log-line.typing::after {
      content: '|';
      animation: cursorBlink 0.6s step-end infinite;
      color: #d4af37;
      font-weight: 300;
    }

    @keyframes cursorBlink {
      0%, 50% { opacity: 1; }
      51%, 100% { opacity: 0; }
    }
  `;
  document.head.appendChild(style);

  // Clear default content
  logEl.innerHTML = '';
}

export function addLog(msg) {
  if (!msg || !logEl) return;

  let clean = msg.replace(/[\n\r]+/g, ' ').trim();
  if (!clean || clean.length < 3) return;
  if (clean === '[working...]') return;
  if (clean.startsWith('{') || clean.startsWith('"')) return;
  if (clean.includes('":"') && clean.includes('","')) return;

  const cls = getClass(clean);
  queue.push({ text: clean, cls });

  // Limit total lines
  while (logEl.children.length > 200) {
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
