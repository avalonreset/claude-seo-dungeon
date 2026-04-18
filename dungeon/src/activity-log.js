/**
 * Guild Ledger - Animated activity log with rich color coding,
 * typewriter effects, per-category icons with unique animations,
 * flowing glow effects, pulse animations, and a living "latest line"
 * that makes it obvious work is still happening.
 */

const CHAR_DELAY_BASE = 12;
const GLOW_DURATION = 2000;

let logEl = null;
let queue = [];
let isTyping = false;
let loadingIndicator = null;
let loadingFrame = 0;
let loadingInterval = null;
let lineCount = 0;

// ── Track the current "latest" line ──
let latestLine = null;
let latestDots = null;

// ── Thematic icons per category ──
// Each gets a unique Unicode symbol that matches its role in the dungeon
const ICONS = {
  tool:     '\u2692\uFE0E',   // ⚒ hammer & pick - generic tool work
  agent:    '\u273F',          // ✿ rosette - summoned agent
  fetch:    '\u21AF',          // ↯ lightning zigzag - fetching from the web
  search:   '\u2609',          // ☉ sun/eye - searching/scanning
  read:     '\u2234',          // ∴ therefore dots - reading/analyzing
  write:    '\u2741',          // ❁ flower - inscribing/writing
  bash:     '\u2623',          // ☣ biohazard - executing commands
  skill:    '\u269D',          // ⚝ outlined star - skill invocation
  user:     '\u276F',          // ❯ chevron - user prompt
  error:    '\u2620',          // ☠ skull - something died
  complete: '\u2726',          // ✦ four-pointed star - victory
  status:   '\u25C8',          // ◈ diamond - status/progress
  system:   '\u2042',          // ⁂ asterism - system message
  domain:   '\u2302',          // ⌂ house - domain/site
  score:    '\u2694\uFE0E',   // ⚔ crossed swords - scoring
  demon:    '\u2666',          // ♦ diamond suit - demon
  fix:      '\u2726',          // ✦ star - vanquished
  text:     '\u203A',          // › single angle quote - generic text
};

// ── Classify log text into categories ──
function classify(text) {
  if (text.startsWith('ERROR') || text.startsWith('Fix error') || text.startsWith('Fix failed'))
    return 'error';

  if (text.startsWith('[Agent]')) return 'agent';
  if (text.startsWith('[WebFetch]') || text.startsWith('[WebSearch]')) return 'fetch';
  if (text.startsWith('[Grep]') || text.startsWith('[Glob]') || text.startsWith('[ToolSearch]')) return 'search';
  if (text.startsWith('[Read]')) return 'read';
  if (text.startsWith('[Write]') || text.startsWith('[Edit]') || text.startsWith('[NotebookEdit]')) return 'write';
  if (text.startsWith('[Bash]')) return 'bash';
  if (text.startsWith('[Skill]')) return 'skill';
  if (text.startsWith('[TodoWrite]') || text.startsWith('[TaskCreate]')) return 'status';
  if (text.startsWith('[')) return 'tool';

  if (text.startsWith('> ')) return 'user';
  if (text.includes('[Complete]') || text.includes('omplete')) return 'complete';

  if (/^(Audit|Fix|Score|Found|Scanning|Initializing|Subagent)/i.test(text)) return 'status';
  if (/demons?\s*(remain|found|slain|await)/i.test(text)) return 'demon';
  if (/score/i.test(text)) return 'score';

  if (text.startsWith('Hunting:') || text.startsWith('Source:')) return 'domain';

  if (/^(System|Waiting|Connected|Bridge|Ready|Recalled)/i.test(text)) return 'system';

  if (/vanquish|strikes|damage|fixed/i.test(text)) return 'fix';

  return 'text';
}

function getIcon(cls) {
  return ICONS[cls] || ICONS.text;
}

// ── Mark a line as the "latest" (living/active) ──
// The latest line is the ledger's cursor - the quill currently writing.
// It gets a static gold left bar + soft trailing dots. No shimmer, no
// pulse, no flicker. When a line loses .latest, it just drops those
// affordances and becomes historical - ink already dried.
function markAsLatest(line) {
  if (latestLine && latestLine !== line) {
    latestLine.classList.remove('latest');
    if (latestDots && latestDots.parentNode) {
      latestDots.remove();
    }
  }

  latestLine = line;

  // If ledger is idle or line is a "complete" message, don't animate at all
  const isIdle = logEl && logEl.classList.contains('ledger-idle');
  const isComplete = line.classList.contains('complete');

  if (isIdle || isComplete) {
    // No "latest" class, no dots, no shimmer - completely static
    latestDots = null;
    return;
  }

  line.classList.add('latest');

  latestDots = document.createElement('span');
  latestDots.className = 'log-dots';
  latestDots.innerHTML = '<span class="dot">\u2022</span><span class="dot">\u2022</span><span class="dot">\u2022</span>';
  const textSpan = line.querySelector('.log-text');
  if (textSpan) {
    textSpan.after(latestDots);
  }
}

// ── Typewriter effect with icon prefix ──
function typewriterLine(text, cls) {
  return new Promise((resolve) => {
    const line = document.createElement('div');
    line.className = `log-line ${cls} typing glow`;

    // Icon with its own category-specific animation class
    const icon = document.createElement('span');
    icon.className = `log-icon icon-${cls}`;
    icon.textContent = getIcon(cls);
    line.appendChild(icon);

    // Text content typed out
    const content = document.createElement('span');
    content.className = 'log-text';
    content.textContent = '';
    line.appendChild(content);

    logEl.appendChild(line);
    scrollToBottom();

    lineCount++;

    // Separator every 12 lines
    if (lineCount % 12 === 0) {
      const sep = document.createElement('div');
      sep.className = 'log-separator';
      sep.innerHTML = '<span class="sep-dot">\u25C7</span><span class="sep-dot">\u25C6</span><span class="sep-dot">\u25C7</span>';
      logEl.appendChild(sep);
    }

    let i = 0;
    const speed = queue.length > 10 ? 1 : queue.length > 5 ? 4 : queue.length > 2 ? 8 : CHAR_DELAY_BASE;
    const interval = setInterval(() => {
      const charsPerTick = speed <= 2 ? 4 : speed <= 5 ? 2 : 1;
      for (let c = 0; c < charsPerTick && i < text.length; c++) {
        content.textContent += text[i];
        i++;
      }
      scrollToBottom();
      if (i >= text.length) {
        clearInterval(interval);
        line.classList.remove('typing');
        setTimeout(() => line.classList.remove('glow'), GLOW_DURATION);
        linkify(content);
        markAsLatest(line);
        resolve();
      }
    }, speed);
  });
}

// ═══════════════════════════════════════════════════════════════════════
//  LINKIFY - make URLs clickable and backticked content copy-to-clipboard
// ═══════════════════════════════════════════════════════════════════════
// After a line finishes typing, scan its text for URLs and backticked
// content, then replace them with styled, clickable elements.
//   - Bare URLs (http/https)       -> blue underlined, opens in new tab
//   - Backticked URL               -> blue underlined, opens in new tab
//   - Backticked path/command/code -> green highlight, copies to clipboard
// Uses tokenization + DOM nodes (not innerHTML) so content stays safe.

function linkify(contentSpan) {
  const raw = contentSpan.textContent;
  if (!raw) return;
  const segments = tokenize(raw);
  // Skip work if nothing linkable found
  if (!segments.some((s) => s.type !== 'text')) return;
  contentSpan.textContent = '';
  for (const seg of segments) {
    if (seg.type === 'text') {
      contentSpan.appendChild(document.createTextNode(seg.value));
    } else if (seg.type === 'url') {
      contentSpan.appendChild(makeUrlAnchor(seg.value, seg.display || seg.value));
    } else if (seg.type === 'code') {
      contentSpan.appendChild(makeCopyable(seg.value));
    }
  }
}

/**
 * Split a line into { type: 'text' | 'url' | 'code', value } segments.
 * Backtick-wrapped content is tokenized first (explicit intent). Bare
 * URLs outside backticks are picked up next. Everything else is text.
 */
function tokenize(text) {
  const out = [];
  let cursor = 0;
  const pushText = (s) => {
    if (!s) return;
    if (out.length > 0 && out[out.length - 1].type === 'text') {
      out[out.length - 1].value += s;
    } else {
      out.push({ type: 'text', value: s });
    }
  };

  while (cursor < text.length) {
    // Backtick code span
    if (text[cursor] === '`') {
      const end = text.indexOf('`', cursor + 1);
      if (end > cursor) {
        const inner = text.slice(cursor + 1, end);
        if (/^https?:\/\/\S+$/.test(inner)) {
          out.push({ type: 'url', value: inner.replace(/[.,;:!?)\]]+$/, ''), display: inner });
        } else {
          out.push({ type: 'code', value: inner });
        }
        cursor = end + 1;
        continue;
      }
    }

    // Bare URL
    const tail = text.slice(cursor);
    const m = tail.match(/^https?:\/\/[^\s`<>"']+/);
    if (m) {
      // Strip trailing punctuation that's probably sentence-terminal, not part of the URL
      let url = m[0];
      const trim = url.match(/[.,;:!?)\]]+$/);
      let trailing = '';
      if (trim) { trailing = trim[0]; url = url.slice(0, -trailing.length); }
      out.push({ type: 'url', value: url, display: url });
      cursor += url.length;
      pushText(trailing);
      continue;
    }

    pushText(text[cursor]);
    cursor += 1;
  }
  return out;
}

function makeUrlAnchor(url, display) {
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.className = 'log-link log-link-url';
  a.textContent = display;
  a.title = 'Open in new tab';
  return a;
}

function makeCopyable(text) {
  const s = document.createElement('span');
  s.className = 'log-link log-link-code';
  s.textContent = text;
  s.title = 'Click to copy';
  s.addEventListener('click', (e) => {
    e.stopPropagation();
    const doCopy = navigator.clipboard && navigator.clipboard.writeText
      ? navigator.clipboard.writeText(text)
      : Promise.reject(new Error('no clipboard api'));
    doCopy
      .then(() => showCopyToast('Copied'))
      .catch(() => {
        // Fallback: select the span so the user can Ctrl+C manually
        const range = document.createRange();
        range.selectNodeContents(s);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        showCopyToast('Selected, press Ctrl+C');
      });
  });
  return s;
}

let _toastTimer = null;
function showCopyToast(msg) {
  let t = document.getElementById('log-copy-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'log-copy-toast';
    t.className = 'log-copy-toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.remove('fade');
  // Force reflow so re-adding the class re-triggers the transition
  void t.offsetWidth;
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.add('fade'), 1100);
}

// ── Process queue ──
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

// ── Loading indicator ──
function showLoading() {
  if (loadingIndicator) return;
  loadingIndicator = document.createElement('div');
  loadingIndicator.className = 'log-line log-loading';
  logEl.appendChild(loadingIndicator);
  scrollToBottom();

  const runes = ['\u25C7', '\u25C6', '\u25C8', '\u25C6'];
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

let userScrolledUp = false;
let programmaticScroll = false;

function scrollToBottom() {
  if (!logEl || userScrolledUp) return;
  programmaticScroll = true;
  logEl.scrollTop = logEl.scrollHeight;
  requestAnimationFrame(() => { programmaticScroll = false; });
}

function isNearBottom() {
  if (!logEl) return true;
  return (logEl.scrollHeight - logEl.scrollTop - logEl.clientHeight) < 60;
}

// ══════════════════════════════════════════════════
// PUBLIC API
// ══════════════════════════════════════════════════

export function initActivityLog() {
  logEl = document.getElementById('log-content');
  if (!logEl) return;

  // Start in idle state - no animations until something is actively loading
  logEl.classList.add('ledger-idle');

  // Track user scroll intent - distinguish user scrolls from programmatic ones
  logEl.addEventListener('scroll', () => {
    if (programmaticScroll) return;
    userScrolledUp = !isNearBottom();
  });

  // Keyboard navigation for the ledger
  document.addEventListener('keydown', (e) => {
    // Only handle if ledger-related keys and not typing in an input
    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

    if (e.key === 'Home') {
      e.preventDefault();
      logEl.scrollTop = 0;
      userScrolledUp = true;
    } else if (e.key === 'End') {
      e.preventDefault();
      logEl.scrollTop = logEl.scrollHeight;
      userScrolledUp = false;
    } else if (e.key === 'PageUp') {
      e.preventDefault();
      logEl.scrollTop -= logEl.clientHeight * 0.8;
      userScrolledUp = !isNearBottom();
    } else if (e.key === 'PageDown') {
      e.preventDefault();
      logEl.scrollTop += logEl.clientHeight * 0.8;
      userScrolledUp = !isNearBottom();
    }
  });

  const style = document.createElement('style');
  style.textContent = `
    /* ═══════════════════════════════════════════════
       GUILD LEDGER v2 - Inscription, not animation

       Design philosophy:
       - Motion is signal, not decoration. Only the quill currently
         writing (the "latest" line) moves.
       - Color is a semantic category, not a costume.
         5 families: parchment (neutral), ink blue (system work),
         forge green (execution/success), hearth gold (significance),
         agent purple (summoned entities), blood red (alarm).
       - Links are affordances. Static color + underline, hover shift
         only. No glow, no shimmer, no flicker. Explicitly exempted
         from any parent gradient-clip trickery.
       - Respect prefers-reduced-motion. The typewriter + dot wave
         are the only movements that survive; everything else freezes.
       ═══════════════════════════════════════════════ */

    /* ── Base line ── */
    .log-line {
      opacity: 0;
      animation: fadeInLine 0.4s ease-out forwards;
      position: relative;
      padding: 4px 0 4px 6px;
      line-height: 1.55;
    }
    @keyframes fadeInLine {
      from { opacity: 0; transform: translateX(-10px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    .log-line.typing { opacity: 1; }

    /* Fresh-ink settle: new lines land slightly brighter, fade to normal
       over 1.4s. This is the only "glow" effect in the system and it's
       one-shot, not cyclic. Feels like wet ink drying into parchment. */
    .log-line.glow {
      animation: fadeInLine 0.4s ease-out forwards, inkWet 1.4s ease-out 1;
    }
    @keyframes inkWet {
      0%   { filter: brightness(1.22); }
      100% { filter: brightness(1); }
    }

    /* ── Icon base: single unified treatment. No per-category motion. ── */
    .log-icon {
      display: inline-block;
      width: 20px;
      text-align: center;
      margin-right: 7px;
      font-size: 13px;
      vertical-align: middle;
      opacity: 0.72;
    }

    /* ═══════════════════════════════════════════════
       COLOR FAMILIES
       Each category maps to one of six semantic roles.
       ═══════════════════════════════════════════════ */

    /* Parchment - default text, neutral chatter */
    .log-line.text    { color: #c8bfa8; }
    .log-line.system  { color: #8a8270; }

    /* Ink blue - cool system work (reading, searching, fetching) */
    .log-line.tool    { color: #8ab6d2; }
    .log-line.fetch   { color: #8ab6d2; }
    .log-line.search  { color: #8ab6d2; }
    .log-line.read    { color: #8ab6d2; }
    .log-line.domain  { color: #8ab6d2; }

    /* Forge green - execution and success */
    .log-line.bash    { color: #7fb890; }
    .log-line.complete{ color: #9fd4a8; }

    /* Hearth gold - significance (skills, user action, victories, writes) */
    .log-line.skill   { color: #d4af37; }
    .log-line.fix     { color: #d4af37; }
    .log-line.user    { color: #d4af37; font-weight: 600; }
    .log-line.score   { color: #d4af37; }
    .log-line.write   { color: #c89a40; }
    .log-line.status  { color: #b89230; }

    /* Agent purple - summoned entities, spawned subagents */
    .log-line.agent   { color: #a794d6; }

    /* Blood red - alarm */
    .log-line.error   { color: #c85050; font-weight: 500; }
    .log-line.demon   { color: #c85050; }

    /* Icon colors mirror line family (grouped, not 1:1 recopied) */
    .icon-tool, .icon-fetch, .icon-search, .icon-read, .icon-domain { color: #8ab6d2; }
    .icon-bash, .icon-complete { color: #7fb890; }
    .icon-skill, .icon-fix, .icon-user, .icon-score { color: #d4af37; }
    .icon-write, .icon-status { color: #c89a40; }
    .icon-agent { color: #a794d6; }
    .icon-error, .icon-demon { color: #c85050; }
    .icon-text { color: #8a8270; }
    .icon-system { color: #706a60; }

    /* ═══════════════════════════════════════════════
       STATIC LINE ACCENTS - thin left bars for meaningful types.
       These reinforce category without adding motion. Applied only to
       historical lines (the latest line has its own gold accent).
       ═══════════════════════════════════════════════ */
    .log-line.user {
      border-left: 2px solid rgba(212, 175, 55, 0.38);
      padding-left: 9px;
      margin-left: -2px;
    }
    .log-line.agent:not(.latest) {
      border-left: 2px solid rgba(167, 148, 214, 0.28);
      padding-left: 9px;
      margin-left: -2px;
    }
    .log-line.bash:not(.latest) {
      border-left: 2px solid rgba(127, 184, 144, 0.22);
      padding-left: 9px;
      margin-left: -2px;
    }

    /* ═══════════════════════════════════════════════
       TYPING CURSOR - the quill tip, visible only mid-stroke
       ═══════════════════════════════════════════════ */
    .log-line.typing::after {
      content: '\\2588';
      animation: cursorBlink 0.7s step-end infinite;
      color: #d4af37;
      font-weight: 300;
      font-size: 12px;
      margin-left: 2px;
      opacity: 0.85;
    }
    @keyframes cursorBlink {
      0%, 50%    { opacity: 0.85; }
      51%, 100%  { opacity: 0; }
    }

    /* ═══════════════════════════════════════════════
       LATEST LINE - the current reading position

       The current quill. Two motions only: a static gold left bar and
       a soft trailing dot wave. No text-shimmer, no brightness pulse,
       no border flare, no icon bounce. The left bar is gold regardless
       of category because it identifies "this is now," not "this is
       what kind of work."
       ═══════════════════════════════════════════════ */
    .log-line.latest {
      position: relative;
      padding-left: 14px;
    }
    .log-line.latest::before {
      content: '';
      position: absolute;
      left: 0;
      top: 3px;
      bottom: 3px;
      width: 3px;
      border-radius: 1px;
      background: #d4af37;
      opacity: 0.78;
    }
    .log-line.latest .log-icon {
      opacity: 1;
      filter: brightness(1.12);
    }

    /* Trailing dot wave - very soft, just enough to say "still writing" */
    .log-dots {
      display: inline-block;
      margin-left: 6px;
      letter-spacing: 3px;
      font-size: 11px;
    }
    .log-dots .dot {
      display: inline-block;
      animation: dotWave 2s ease-in-out infinite;
      opacity: 0.2;
      color: currentColor;
    }
    .log-dots .dot:nth-child(1) { animation-delay: 0s; }
    .log-dots .dot:nth-child(2) { animation-delay: 0.3s; }
    .log-dots .dot:nth-child(3) { animation-delay: 0.6s; }
    @keyframes dotWave {
      0%, 100% { opacity: 0.18; transform: translateY(0); }
      50%      { opacity: 0.55; transform: translateY(-2px); }
    }

    /* ═══════════════════════════════════════════════
       ONE-SHOT EFFECTS - tied to meaningful outcomes only.
       Fire when the line first appears, decay cleanly, never loop.
       ═══════════════════════════════════════════════ */

    /* Error: brief red-tinted background flush, decays to transparent */
    .log-line.error:not(.latest) {
      animation: fadeInLine 0.4s ease-out forwards, errorPulse 1.5s ease-out 1;
    }
    @keyframes errorPulse {
      0%, 100% { background: transparent; }
      20%      { background: rgba(200, 80, 80, 0.12); }
      80%      { background: transparent; }
    }

    /* Complete: subtle scale pop, like a stamp pressing onto paper */
    .log-line.complete:not(.latest) {
      animation: fadeInLine 0.4s ease-out forwards, completePop 0.7s ease-out 1;
    }
    @keyframes completePop {
      0%   { transform: scale(1); }
      30%  { transform: scale(1.025); }
      100% { transform: scale(1); }
    }

    /* ═══════════════════════════════════════════════
       SEPARATOR RUNES - static. A rhythmic pause, not an animation.
       ═══════════════════════════════════════════════ */
    .log-separator {
      text-align: center;
      padding: 8px 0;
      opacity: 0;
      animation: fadeInLine 0.5s ease forwards;
    }
    .sep-dot {
      display: inline-block;
      color: #4a4438;
      font-size: 10px;
      margin: 0 10px;
      opacity: 0.55;
    }
    .sep-dot:nth-child(2) { color: #5a5340; opacity: 0.78; }
    .sep-dot:nth-child(3) { color: #4a4438; opacity: 0.55; }

    /* ═══════════════════════════════════════════════
       LOADING RUNE - meditative spinner, not frantic
       ═══════════════════════════════════════════════ */
    .log-loading {
      opacity: 1;
      color: #8a8270;
      padding: 3px 0 3px 4px;
    }
    .loading-rune {
      display: inline-block;
      color: #b89230;
      animation: runeSpin 3s linear infinite;
      font-size: 14px;
      opacity: 0.78;
    }
    @keyframes runeSpin {
      0%   { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .loading-text {
      display: inline-block;
      min-width: 100px;
      animation: loadingPulse 2.4s ease-in-out infinite;
      font-style: italic;
      color: #8a8270;
    }
    @keyframes loadingPulse {
      0%, 100% { opacity: 0.35; }
      50%      { opacity: 0.7; }
    }

    /* ═══════════════════════════════════════════════
       IDLE STATE - total stillness when nothing is running
       ═══════════════════════════════════════════════ */
    .ledger-idle .log-line.latest::before {
      display: none;
    }
    .ledger-idle .log-line.latest .log-icon {
      filter: none;
      opacity: 0.72;
    }
    .ledger-idle .log-dots {
      display: none;
    }
    .ledger-idle .log-icon {
      opacity: 0.6;
    }

    /* ═══════════════════════════════════════════════
       CLICKABLE LINKS - clean affordances, no motion.

       Critical: links explicitly set -webkit-text-fill-color and
       background-clip to 'initial'/'currentColor' so that if any parent
       ever uses a gradient-clip trick, links stay solid and never
       flicker. This is the fix for the "link flashing" bug the user
       reported - the root cause was a shimmer on a parent span cascading
       into anchors. We burn the exemption in at the element level so no
       future regression can reintroduce it.
       ═══════════════════════════════════════════════ */
    .log-link {
      cursor: pointer;
      transition: color 160ms ease,
                  background-color 160ms ease,
                  border-color 160ms ease,
                  text-decoration-color 160ms ease;
      user-select: text;
      -webkit-user-select: text;
      -webkit-text-fill-color: currentColor;
      background-clip: initial;
      -webkit-background-clip: initial;
    }

    /* URL links - ink blue, subtle underline, clean hover */
    .log-link-url {
      color: #8ab6d2;
      text-decoration: underline;
      text-decoration-color: rgba(138, 182, 210, 0.42);
      text-underline-offset: 2px;
      font-weight: 500;
    }
    .log-link-url:hover {
      color: #b6d4ea;
      text-decoration-color: #b6d4ea;
    }

    /* Code links (backticked paths/commands) - warm parchment pill */
    .log-link-code {
      color: #b8ac8a;
      background: rgba(184, 172, 138, 0.08);
      border: 1px solid rgba(184, 172, 138, 0.22);
      border-radius: 3px;
      padding: 0 5px;
      margin: 0 1px;
      font-weight: 500;
    }
    .log-link-code:hover {
      color: #d8cca8;
      background: rgba(184, 172, 138, 0.16);
      border-color: rgba(184, 172, 138, 0.42);
    }
    .log-link-code:active {
      background: rgba(184, 172, 138, 0.26);
    }

    /* ═══════════════════════════════════════════════
       COPY TOAST - brief confirmation, gold on black
       ═══════════════════════════════════════════════ */
    .log-copy-toast {
      position: fixed;
      bottom: 28px;
      right: 28px;
      background: rgba(10, 12, 20, 0.95);
      color: #d4af37;
      font-family: "JetBrains Mono", monospace;
      font-size: 11px;
      letter-spacing: 2px;
      padding: 9px 16px;
      border: 1px solid rgba(212, 175, 55, 0.42);
      border-radius: 3px;
      box-shadow: 0 4px 18px rgba(0, 0, 0, 0.5);
      z-index: 999999;
      pointer-events: none;
      opacity: 1;
      transition: opacity 320ms ease;
    }
    .log-copy-toast.fade { opacity: 0; }

    /* ═══════════════════════════════════════════════
       REDUCED MOTION - respect the user's system preference.
       Keeps the typewriter (it carries content) and freezes everything
       decorative.
       ═══════════════════════════════════════════════ */
    @media (prefers-reduced-motion: reduce) {
      .log-line {
        animation: none !important;
        opacity: 1 !important;
        transform: none !important;
        filter: none !important;
      }
      .log-line.error:not(.latest),
      .log-line.complete:not(.latest) {
        animation: none !important;
      }
      .log-dots .dot {
        animation: none !important;
        opacity: 0.45 !important;
        transform: none !important;
      }
      .loading-rune {
        animation: none !important;
      }
      .loading-text {
        animation: none !important;
        opacity: 0.6 !important;
      }
    }
  `;
  document.head.appendChild(style);

  logEl.innerHTML = '';
}

export function addLog(msg) {
  if (!msg || !logEl) return;

  let clean = msg.replace(/[\n\r]+/g, ' ').trim();
  if (!clean || clean.length < 2) return;
  if (clean === '[working...]') return;
  if (clean.startsWith('{') && clean.endsWith('}') && clean.includes('":"')) return;
  if (clean.startsWith('[{') && clean.includes('":"')) return;
  if (/^`{3}\w*$/.test(clean)) return;  // markdown code fences (```json, ```)
  if (clean === '```') return;

  const cls = classify(clean);
  queue.push({ text: clean, cls });

  while (logEl.children.length > 300) {
    logEl.removeChild(logEl.firstChild);
  }

  processQueue();
}

export function showLoadingIndicator() {
  showLoading();
  if (logEl) logEl.classList.remove('ledger-idle');
}

export function hideLoadingIndicator() {
  hideLoading();
  if (logEl) logEl.classList.add('ledger-idle');
}
