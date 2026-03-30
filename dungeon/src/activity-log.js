/**
 * Guild Ledger — Animated activity log with rich color coding,
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
  tool:     '\u2692\uFE0E',   // ⚒ hammer & pick — generic tool work
  agent:    '\u273F',          // ✿ rosette — summoned agent
  fetch:    '\u21AF',          // ↯ lightning zigzag — fetching from the web
  search:   '\u2609',          // ☉ sun/eye — searching/scanning
  read:     '\u2234',          // ∴ therefore dots — reading/analyzing
  write:    '\u2741',          // ❁ flower — inscribing/writing
  bash:     '\u2623',          // ☣ biohazard — executing commands
  skill:    '\u269D',          // ⚝ outlined star — skill invocation
  error:    '\u2620',          // ☠ skull — something died
  complete: '\u2726',          // ✦ four-pointed star — victory
  status:   '\u25C8',          // ◈ diamond — status/progress
  system:   '\u2042',          // ⁂ asterism — system message
  domain:   '\u2302',          // ⌂ house — domain/site
  score:    '\u2694\uFE0E',   // ⚔ crossed swords — scoring
  demon:    '\u2666',          // ♦ diamond suit — demon
  fix:      '\u2726',          // ✦ star — vanquished
  text:     '\u203A',          // › single angle quote — generic text
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
function markAsLatest(line) {
  if (latestLine && latestLine !== line) {
    latestLine.classList.remove('latest');
    if (latestDots && latestDots.parentNode) {
      latestDots.remove();
    }
    // Reset text fill so old lines show normal color
    const oldText = latestLine.querySelector('.log-text');
    if (oldText) {
      oldText.style.background = 'none';
      oldText.style.webkitBackgroundClip = 'unset';
      oldText.style.backgroundClip = 'unset';
      oldText.style.webkitTextFillColor = 'unset';
    }
  }

  latestLine = line;

  // If ledger is idle or line is a "complete" message, don't animate at all
  const isIdle = logEl && logEl.classList.contains('ledger-idle');
  const isComplete = line.classList.contains('complete');

  if (isIdle || isComplete) {
    // No "latest" class, no dots, no shimmer — completely static
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
        markAsLatest(line);
        resolve();
      }
    }, speed);
  });
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

  // Start in idle state — no animations until something is actively loading
  logEl.classList.add('ledger-idle');

  // Track user scroll intent — distinguish user scrolls from programmatic ones
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
       BASE LINE
       ═══════════════════════════════════════════════ */
    .log-line {
      opacity: 0;
      animation: fadeInLine 0.35s ease forwards;
      position: relative;
      padding: 3px 0 3px 4px;
    }

    @keyframes fadeInLine {
      from { opacity: 0; transform: translateX(-8px); }
      to   { opacity: 1; transform: translateX(0); }
    }

    .log-line.typing { opacity: 1; }

    /* ═══════════════════════════════════════════════
       ICON BASE — bigger, bolder, colored to match category
       ═══════════════════════════════════════════════ */
    .log-icon {
      display: inline-block;
      width: 20px;
      text-align: center;
      margin-right: 6px;
      font-size: 13px;
      vertical-align: middle;
      /* Each category overrides color below */
    }

    /* ── Per-category icon colors (match line colors but slightly brighter) ── */
    .icon-tool    { color: #8ee0f0; }
    .icon-agent   { color: #c9a8ff; }
    .icon-fetch   { color: #78c4ff; }
    .icon-search  { color: #b0d4ff; }
    .icon-read    { color: #9ec8dd; }
    .icon-write   { color: #ffc468; }
    .icon-bash    { color: #88ee88; }
    .icon-skill   { color: #e8c040; }
    .icon-status  { color: #f0d860; }
    .icon-system  { color: #9098a8; }
    .icon-error   { color: #ff5050; }
    .icon-complete{ color: #50ff50; }
    .icon-fix     { color: #e8c040; }
    .icon-demon   { color: #ff4040; }
    .icon-domain  { color: #99ccff; }
    .icon-score   { color: #f0d860; }
    .icon-text    { color: #808898; }

    /* ═══════════════════════════════════════════════
       PER-CATEGORY ICON ANIMATIONS
       Each icon type gets its own characteristic motion
       ═══════════════════════════════════════════════ */

    /* Agent — slow orbit/breathing, it's a summoned entity */
    .icon-agent {
      animation: iconOrbit 3s ease-in-out infinite;
    }
    @keyframes iconOrbit {
      0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.7; }
      50%      { transform: scale(1.2) rotate(15deg); opacity: 1; text-shadow: 0 0 8px #c9a8ff; }
    }

    /* Fetch — quick downward bounce, grabbing data */
    .icon-fetch {
      animation: iconBounce 1.8s ease-in-out infinite;
    }
    @keyframes iconBounce {
      0%, 100% { transform: translateY(0); opacity: 0.7; }
      30%      { transform: translateY(3px); opacity: 1; text-shadow: 0 0 6px #78c4ff; }
      60%      { transform: translateY(-1px); opacity: 0.9; }
    }

    /* Search — slow rotation like a radar sweep */
    .icon-search {
      animation: iconRadar 4s linear infinite;
    }
    @keyframes iconRadar {
      0%   { transform: rotate(0deg); opacity: 0.6; }
      25%  { opacity: 1; text-shadow: 0 0 6px #b0d4ff; }
      50%  { transform: rotate(180deg); opacity: 0.6; }
      75%  { opacity: 1; text-shadow: 0 0 6px #b0d4ff; }
      100% { transform: rotate(360deg); opacity: 0.6; }
    }

    /* Read — gentle page-flip pulse */
    .icon-read {
      animation: iconFlip 2.5s ease-in-out infinite;
    }
    @keyframes iconFlip {
      0%, 100% { transform: scaleX(1); opacity: 0.6; }
      50%      { transform: scaleX(-1); opacity: 1; text-shadow: 0 0 4px #9ec8dd; }
    }

    /* Write — quill writing motion */
    .icon-write {
      animation: iconScribe 2s ease-in-out infinite;
    }
    @keyframes iconScribe {
      0%, 100% { transform: translate(0, 0) rotate(0deg); opacity: 0.7; }
      25%      { transform: translate(2px, 1px) rotate(8deg); opacity: 1; text-shadow: 0 0 6px #ffc468; }
      50%      { transform: translate(0, 0) rotate(0deg); opacity: 0.8; }
      75%      { transform: translate(-1px, 1px) rotate(-5deg); opacity: 1; }
    }

    /* Bash — rapid blink like a terminal cursor */
    .icon-bash {
      animation: iconTerminal 1.2s step-end infinite;
    }
    @keyframes iconTerminal {
      0%, 49%  { opacity: 1; text-shadow: 0 0 8px #88ee88; }
      50%, 100% { opacity: 0.3; text-shadow: none; }
    }

    /* Skill — golden shimmer/sparkle */
    .icon-skill {
      animation: iconSparkle 2s ease-in-out infinite;
    }
    @keyframes iconSparkle {
      0%, 100% { transform: scale(1); filter: brightness(1); opacity: 0.7; }
      30%      { transform: scale(1.3); filter: brightness(1.8); opacity: 1; text-shadow: 0 0 12px #e8c040, 0 0 20px #d4af37; }
      60%      { transform: scale(0.9); filter: brightness(0.8); opacity: 0.5; }
    }

    /* Error — alarming shake */
    .icon-error {
      animation: iconShake 0.6s ease-in-out infinite;
    }
    @keyframes iconShake {
      0%, 100% { transform: translateX(0); }
      20%      { transform: translateX(-2px) rotate(-5deg); }
      40%      { transform: translateX(2px) rotate(5deg); }
      60%      { transform: translateX(-1px) rotate(-3deg); }
      80%      { transform: translateX(1px) rotate(2deg); }
    }

    /* Complete — triumphant scale pop */
    .icon-complete {
      animation: iconTriumph 1.5s ease-in-out infinite;
    }
    @keyframes iconTriumph {
      0%, 100% { transform: scale(1); opacity: 0.8; }
      15%      { transform: scale(1.5); opacity: 1; text-shadow: 0 0 14px #50ff50, 0 0 24px #30cc30; }
      40%      { transform: scale(1); opacity: 0.9; }
    }

    /* Status — steady diamond pulse */
    .icon-status {
      animation: iconPulse 2s ease-in-out infinite;
    }
    @keyframes iconPulse {
      0%, 100% { opacity: 0.5; transform: scale(1); }
      50%      { opacity: 1; transform: scale(1.15); text-shadow: 0 0 6px #f0d860; }
    }

    /* System — slow fade breathing */
    .icon-system {
      animation: iconBreathe 3s ease-in-out infinite;
    }
    @keyframes iconBreathe {
      0%, 100% { opacity: 0.3; }
      50%      { opacity: 0.8; }
    }

    /* Domain — house glow */
    .icon-domain {
      animation: iconGlow 2.5s ease-in-out infinite;
    }
    @keyframes iconGlow {
      0%, 100% { opacity: 0.6; text-shadow: none; }
      50%      { opacity: 1; text-shadow: 0 0 8px #99ccff, 0 0 14px #6699cc; }
    }

    /* Demon — sinister red throb */
    .icon-demon {
      animation: iconThrob 1.5s ease-in-out infinite;
    }
    @keyframes iconThrob {
      0%, 100% { opacity: 0.6; transform: scale(1); }
      50%      { opacity: 1; transform: scale(1.2); text-shadow: 0 0 10px #ff4040, 0 0 18px #cc0000; }
    }

    /* Score — crossed swords clash */
    .icon-score {
      animation: iconClash 2s ease-in-out infinite;
    }
    @keyframes iconClash {
      0%, 100% { transform: rotate(0deg) scale(1); opacity: 0.7; }
      25%      { transform: rotate(-10deg) scale(1.1); opacity: 1; }
      50%      { transform: rotate(10deg) scale(1.2); opacity: 1; text-shadow: 0 0 8px #f0d860; }
      75%      { transform: rotate(-5deg) scale(1.05); opacity: 0.9; }
    }

    /* Fix — victorious star burst */
    .icon-fix {
      animation: iconBurst 2s ease-in-out infinite;
    }
    @keyframes iconBurst {
      0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.7; }
      50%      { transform: scale(1.3) rotate(30deg); opacity: 1; text-shadow: 0 0 10px #e8c040; }
    }

    /* Tool — generic hammer swing */
    .icon-tool {
      animation: iconSwing 2s ease-in-out infinite;
    }
    @keyframes iconSwing {
      0%, 100% { transform: rotate(0deg); opacity: 0.6; }
      30%      { transform: rotate(-15deg); opacity: 1; text-shadow: 0 0 4px #8ee0f0; }
      60%      { transform: rotate(5deg); opacity: 0.8; }
    }

    /* Text — subtle chevron pulse */
    .icon-text {
      animation: iconChevron 3s ease-in-out infinite;
    }
    @keyframes iconChevron {
      0%, 100% { opacity: 0.3; transform: translateX(0); }
      50%      { opacity: 0.6; transform: translateX(2px); }
    }

    /* ═══════════════════════════════════════════════
       GLOW EFFECTS PER CLASS
       ═══════════════════════════════════════════════ */
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

    /* ═══════════════════════════════════════════════
       LINE COLORS
       ═══════════════════════════════════════════════ */
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

    /* ═══════════════════════════════════════════════
       TYPING CURSOR
       ═══════════════════════════════════════════════ */
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

    /* ═══════════════════════════════════════════════
       LATEST LINE — the living/active indicator
       Shows the user that the system is still working
       ═══════════════════════════════════════════════ */
    .log-line.latest {
      position: relative;
      padding-left: 14px;
      animation: fadeInLine 0.35s ease forwards, latestPulse 2s ease-in-out infinite;
    }

    /* Flowing left-to-right shimmer across the text */
    .log-line.latest .log-text {
      position: relative;
      background: linear-gradient(
        90deg,
        currentColor 0%,
        currentColor 30%,
        rgba(255, 255, 255, 0.95) 50%,
        currentColor 70%,
        currentColor 100%
      );
      background-size: 250% 100%;
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: glowSweep 2.5s ease-in-out infinite;
    }

    @keyframes glowSweep {
      0%   { background-position: 250% center; }
      100% { background-position: -250% center; }
    }

    /* Whole-line breathing brightness */
    @keyframes latestPulse {
      0%, 100% {
        text-shadow: 0 0 6px currentColor;
        filter: brightness(1);
      }
      50% {
        text-shadow: 0 0 18px currentColor, 0 0 30px currentColor;
        filter: brightness(1.3);
      }
    }

    /* Animated trailing dots — bouncing wave */
    .log-dots {
      display: inline-block;
      margin-left: 6px;
      letter-spacing: 3px;
      font-size: 11px;
    }
    .log-dots .dot {
      display: inline-block;
      animation: dotWave 1.4s ease-in-out infinite;
      opacity: 0.2;
      color: currentColor;
    }
    .log-dots .dot:nth-child(1) { animation-delay: 0s; }
    .log-dots .dot:nth-child(2) { animation-delay: 0.2s; }
    .log-dots .dot:nth-child(3) { animation-delay: 0.4s; }

    @keyframes dotWave {
      0%, 100% { opacity: 0.15; transform: translateY(0) scale(0.8); }
      35%      { opacity: 1; transform: translateY(-3px) scale(1.3); text-shadow: 0 0 8px currentColor; }
      70%      { opacity: 0.3; transform: translateY(1px) scale(0.9); }
    }

    /* Left-border glow pulse */
    .log-line.latest::before {
      content: '';
      position: absolute;
      left: 0;
      top: 2px;
      bottom: 2px;
      width: 3px;
      border-radius: 2px;
      background: currentColor;
      animation: borderPulse 1.8s ease-in-out infinite;
    }

    @keyframes borderPulse {
      0%, 100% { opacity: 0.15; box-shadow: 0 0 4px currentColor; }
      50%      { opacity: 0.8; box-shadow: 0 0 10px currentColor, 0 0 18px currentColor; }
    }

    /* Icon on latest line overrides its category anim with a brighter pulse */
    .log-line.latest .log-icon {
      opacity: 1;
      filter: brightness(1.4);
      animation: iconLatestPulse 1.2s ease-in-out infinite;
    }

    @keyframes iconLatestPulse {
      0%, 100% { filter: brightness(1.2); transform: scale(1); }
      50%      { filter: brightness(2); transform: scale(1.3); text-shadow: 0 0 12px currentColor; }
    }

    /* ═══════════════════════════════════════════════
       SEPARATOR RUNES
       ═══════════════════════════════════════════════ */
    .log-separator {
      text-align: center;
      padding: 6px 0;
      opacity: 0;
      animation: fadeInLine 0.5s ease forwards;
    }
    .sep-dot {
      display: inline-block;
      color: #303050;
      font-size: 11px;
      margin: 0 8px;
      animation: sepPulse 3s ease-in-out infinite;
    }
    .sep-dot:nth-child(2) { animation-delay: 0.4s; color: #404060; }
    .sep-dot:nth-child(3) { animation-delay: 0.8s; }

    @keyframes sepPulse {
      0%, 100% { opacity: 0.25; transform: scale(1); }
      50%      { opacity: 0.7; transform: scale(1.2); color: #606088; text-shadow: 0 0 4px #404060; }
    }

    /* ═══════════════════════════════════════════════
       LOADING RUNE SPINNER
       ═══════════════════════════════════════════════ */
    .log-loading { opacity: 1; color: #606880; }

    .loading-rune {
      display: inline-block;
      color: #d4af37;
      animation: runeGlow 1.5s ease-in-out infinite, runeSpin 2s linear infinite;
      font-size: 14px;
    }

    @keyframes runeGlow {
      0%, 100% { opacity: 0.4; text-shadow: 0 0 4px rgba(212, 175, 55, 0.2); }
      50%      { opacity: 1; text-shadow: 0 0 12px rgba(212, 175, 55, 0.6); }
    }

    @keyframes runeSpin {
      0%   { transform: rotate(0deg); }
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
      50%      { opacity: 0.7; }
    }

    /* ═══════════════════════════════════════════════
       SPECIAL LINE TYPES
       ═══════════════════════════════════════════════ */

    /* Agent lines — left accent bar (when not latest) */
    .log-line.agent:not(.latest) {
      border-left: 2px solid rgba(180, 140, 255, 0.3);
      padding-left: 8px;
      margin-left: -2px;
    }

    /* Error lines — red background pulse */
    .log-line.error:not(.latest) {
      animation: fadeInLine 0.35s ease forwards, errorPulse 2s ease-in-out 1;
    }

    @keyframes errorPulse {
      0%, 100% { background: transparent; }
      20%      { background: rgba(240, 60, 60, 0.1); }
      80%      { background: transparent; }
    }

    /* Complete lines — pop scale */
    .log-line.complete:not(.latest) {
      animation: fadeInLine 0.35s ease forwards, completePop 0.6s ease 1;
    }

    @keyframes completePop {
      0%  { transform: scale(1); }
      30% { transform: scale(1.03); }
      100%{ transform: scale(1); }
    }

    /* Skill lines — golden shimmer */
    .log-line.skill:not(.latest) {
      animation: fadeInLine 0.35s ease forwards, skillShimmer 3s ease-in-out 1;
    }

    @keyframes skillShimmer {
      0%, 100% { filter: brightness(1); }
      50%      { filter: brightness(1.4); }
    }

    /* Fetch lines — subtle slide-in from left */
    .log-line.fetch:not(.latest) {
      animation: fetchSlide 0.5s ease forwards;
    }

    @keyframes fetchSlide {
      from { opacity: 0; transform: translateX(-12px); }
      to   { opacity: 1; transform: translateX(0); }
    }

    /* Bash lines — green left bar */
    .log-line.bash:not(.latest) {
      border-left: 2px solid rgba(120, 220, 120, 0.25);
      padding-left: 8px;
      margin-left: -2px;
    }

    /* ═══════════════════════════════════════════════
       IDLE STATE — kill all animations when nothing is running
       ═══════════════════════════════════════════════ */
    .ledger-idle .log-line.latest {
      animation: fadeInLine 0.35s ease forwards !important;
    }
    .ledger-idle .log-line.latest .log-text {
      background: none !important;
      -webkit-background-clip: unset !important;
      background-clip: unset !important;
      -webkit-text-fill-color: unset !important;
      animation: none !important;
    }
    .ledger-idle .log-line.latest::before {
      animation: none !important;
      opacity: 0.3 !important;
      box-shadow: none !important;
    }
    .ledger-idle .log-line.latest .log-icon {
      animation: none !important;
      filter: brightness(1) !important;
    }
    .ledger-idle .log-icon {
      animation: none !important;
      filter: none !important;
      opacity: 0.6 !important;
    }
    .ledger-idle .log-dots {
      display: none !important;
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
