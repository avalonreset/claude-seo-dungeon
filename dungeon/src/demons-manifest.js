// =====================================================================
// DEMON MANIFEST — ranked pool per severity tier.
//
// POLICY: Only single-frame individual-character sprites. No sprite
// sheets. No parsing. If an asset was a multi-frame spritesheet or grid
// of variants (Calciumtrice, Ars Notoria, Cethiel, OGA strips, Harlequin
// 3-forms), it was filtered out rather than risk broken rendering.
//
// Every demon below is a single detailed character sprite. Idle
// animation is a Phaser tween (breath pulse + subtle bob) applied at
// render time so the demons feel alive without fighting the source art.
//
// Ranking within each pool: INDEX 0 = most glorious / most powerful.
// Lower-indexed demons show up first for lower-numbered issues.
// =====================================================================

const s = (key, path, name, credit) => ({ key, path, name, frames: 1, credit });

// ── TIER 5: CRITICAL / BOSS — the most powerful horrors ───────────────
export const CRITICAL_POOL = [
  s('boss_cerebov',         'assets/demons-new/boss/cerebov.png',         'Cerebov, Tyrant of Flame',  'DCSS CC0'),
  s('boss_asmodeus',        'assets/demons-new/boss/asmodeus.png',        'Asmodeus, Prince of Hell',  'DCSS CC0'),
  s('boss_dispater',        'assets/demons-new/boss/dispater.png',        'Dispater, the Iron King',   'DCSS CC0'),
  s('boss_ereshkigal',      'assets/demons-new/boss/ereshkigal.png',      'Ereshkigal, Queen Below',   'DCSS CC0'),
  s('boss_fire_dragon',     'assets/demons-new/boss/fire_dragon.png',     'Ancient Fire Dragon',       'DCSS CC0'),
  s('boss_shadow_dragon',   'assets/demons-new/boss/shadow_dragon.png',   'Shadow Dragon',             'DCSS CC0'),
  s('boss_brimstone_fiend', 'assets/demons-new/boss/brimstone_fiend.png', 'Brimstone Fiend',           'DCSS CC0'),
  s('boss_balrug',          'assets/demons-new/boss/balrug.png',          'Balrug',                    'DCSS CC0'),
  s('boss_ancient_lich',    'assets/demons-new/boss/ancient_lich.png',    'Ancient Lich',              'DCSS CC0'),
  // Legacy 0x72 kept — has real 4-frame idle animation
  { key: 'demon_critical', path: '0x72', name: 'Big Demon', frames: 4, credit: '0x72 CC0' },
];

// ── TIER 4: HIGH — major threats ──────────────────────────────────────
export const HIGH_POOL = [
  s('high_reaper',        'assets/demons-new/high/reaper.png',         'Reaper',         'DCSS CC0'),
  s('high_lich',          'assets/demons-new/high/lich.png',           'Lich',           'DCSS CC0'),
  s('high_hell_sentinel', 'assets/demons-new/high/hell_sentinel.png',  'Hell Sentinel',  'DCSS CC0'),
  s('high_ice_fiend',     'assets/demons-new/high/ice_fiend.png',      'Ice Fiend',      'DCSS CC0'),
  { key: 'demon_high', path: '0x72', name: 'Orc Warrior', frames: 4, credit: '0x72 CC0' },
];

// ── TIER 3: MEDIUM — mid-tier threats ─────────────────────────────────
export const MEDIUM_POOL = [
  s('mid_executioner',  'assets/demons-new/mid/executioner.png',   'Demon Executioner', 'DCSS CC0'),
  s('mid_shadow_demon', 'assets/demons-new/mid/shadow_demon.png',  'Shadow Demon',      'DCSS CC0'),
  s('mid_bone_dragon',  'assets/demons-new/mid/bone_dragon.png',   'Bone Dragon',       'DCSS CC0'),
  { key: 'demon_medium', path: '0x72', name: 'Chort', frames: 4, credit: '0x72 CC0' },
];

// ── TIER 2: LOW — lesser threats ──────────────────────────────────────
export const LOW_POOL = [
  s('low_red_devil',   'assets/demons-new/low/red_devil.png',    'Red Devil',   'DCSS CC0'),
  s('low_wyvern',      'assets/demons-new/low/wyvern.png',       'Wyvern',      'DCSS CC0'),
  s('low_ghoul',       'assets/demons-new/low/ghoul.png',        'Ghoul',       'DCSS CC0'),
  s('low_curse_skull', 'assets/demons-new/low/curse_skull.png',  'Curse Skull', 'DCSS CC0'),
  s('low_curse_toe',   'assets/demons-new/low/curse_toe.png',    'Curse Toe',   'DCSS CC0'),
  { key: 'demon_low', path: '0x72', name: 'Orc Shaman', frames: 4, credit: '0x72 CC0' },
];

// ── TIER 1: INFO — the weakest pests ──────────────────────────────────
export const INFO_POOL = [
  s('tiny_crimson_imp', 'assets/demons-new/tiny/crimson_imp.png', 'Crimson Imp', 'DCSS CC0'),
  s('tiny_shadow_imp',  'assets/demons-new/tiny/shadow_imp.png',  'Shadow Imp',  'DCSS CC0'),
  s('tiny_lemure',      'assets/demons-new/tiny/lemure.png',      'Lemure',      'DCSS CC0'),
  { key: 'demon_info', path: '0x72', name: 'Goblin', frames: 4, credit: '0x72 CC0' },
];

export const POOLS = {
  critical: CRITICAL_POOL,
  high:     HIGH_POOL,
  medium:   MEDIUM_POOL,
  low:      LOW_POOL,
  info:     INFO_POOL,
};

// ═══════════════════════════════════════════════════════════════════════
//  DEMON ASSIGNMENT ENGINE
// ═══════════════════════════════════════════════════════════════════════
//
// Three-pass algorithm that combines:
//
//   1) THEMATIC MATCHING
//      SEO issues have categories and content patterns. Schema problems
//      get "lords of order" (Dispater, Cerebov). Performance problems get
//      elementals (Fire Dragon, Ice Fiend). Broken links get lost souls
//      (Curse Skull, Ghoul). Stale content gets undead (Lich, Ancient
//      Lich). Every hint is a real hand-written mapping from SEO concept
//      to demon archetype. This makes the catalog feel authored, not
//      randomized.
//
//   2) TIER-RANK HIERARCHY
//      Within a severity tier, the WORST issue always gets the tier's
//      top demon. Rank 0 in the Critical tier = Cerebov. Rank 0 in High =
//      Reaper. This creates a boss moment — the most severe issue in your
//      audit faces the most glorious demon available.
//
//   3) DETERMINISTIC FALLBACK
//      When the same demon would be chosen twice in a row, or a tier has
//      more issues than demons, we cycle through the pool so the hall
//      never shows the same face twice consecutively.
//
// ═══════════════════════════════════════════════════════════════════════

// SEO-category → demon-archetype mappings. First match wins.
// Each theme lists preferred demon NAME FRAGMENTS (matched against
// demon.name.includes()). Order inside `prefer` is the theme's own
// ranking — most-appropriate demon first.
const THEME_HINTS = [
  // Schema / structured data → ORDER demons (lords who enforce rules)
  { keywords: ['schema', 'structured data', 'json-ld', 'microdata', 'rich result', 'rich snippet', 'markup'],
    prefer: ['Dispater', 'Hell Sentinel', 'Cerebov', 'Bone Dragon', 'Curse Skull'] },

  // Performance / CWV → ELEMENTAL demons (fire, ice, speed)
  { keywords: ['performance', 'core web vitals', 'cwv', 'speed', 'pagespeed', 'page speed', 'lcp', 'inp', 'cls', 'render-blocking', 'loading', 'slow'],
    prefer: ['Fire Dragon', 'Ice Fiend', 'Brimstone Fiend', 'Reaper', 'Crimson Imp', 'Wyvern'] },

  // Security / HTTPS → GUARDIAN demons (armored, enforcers)
  { keywords: ['security', 'https', 'ssl', 'tls', 'certificate', 'xss', 'mixed content', 'hsts'],
    prefer: ['Hell Sentinel', 'Balrug', 'Executioner', 'Red Devil'] },

  // Mobile / responsive → SHADOW demons (forms that shift)
  { keywords: ['mobile', 'responsive', 'viewport', 'touch target', 'text too small', 'tap target'],
    prefer: ['Shadow Dragon', 'Shadow Demon', 'Shadow Imp'] },

  // Broken links / 404s / redirects → LOST-SOUL demons
  { keywords: ['404', 'broken link', 'broken', 'redirect chain', 'dead link', 'soft 404', 'orphan page'],
    prefer: ['Curse Skull', 'Curse Toe', 'Ghoul', 'Lemure'] },

  // Stale / outdated content → UNDEAD demons
  { keywords: ['stale', 'outdated', 'freshness', 'last updated', 'decay', 'old content', 'freshness signal'],
    prefer: ['Ancient Lich', 'Lich', 'Bone Dragon', 'Ghoul'] },

  // Duplicates / canonicals → SHADOW demons (twins, doubles)
  { keywords: ['duplicate', 'canonical', 'cannibalization', 'near-duplicate', 'thin page', 'redundant'],
    prefer: ['Shadow Demon', 'Shadow Dragon', 'Shadow Imp'] },

  // Content quality / E-E-A-T → MANIPULATOR demons (tempters, corrupters)
  { keywords: ['e-e-a-t', 'eeat', 'thin content', 'low quality', 'content quality', 'author', 'expertise', 'authoritativeness', 'trustworthiness', 'trust signal'],
    prefer: ['Asmodeus', 'Ereshkigal', 'Lich', 'Shadow Demon'] },

  // Images / alt text → WATCHER demons (seen / seeing)
  { keywords: ['image', 'alt text', 'alt attribute', 'image seo', 'webp', 'lazy load', 'compression'],
    prefer: ['Wyvern', 'Fire Dragon', 'Crimson Imp'] },

  // Meta / titles / descriptions → NAMED SPEAKER demons (they have names, they speak)
  { keywords: ['meta tag', 'title tag', 'meta description', 'og:', 'opengraph', 'twitter card', 'headings', 'h1'],
    prefer: ['Cerebov', 'Asmodeus', 'Executioner', 'Dispater'] },

  // Sitemap / crawlability / indexation → ORDER-KEEPER demons
  { keywords: ['sitemap', 'robots.txt', 'crawl', 'indexation', 'indexing', 'noindex', 'disallow'],
    prefer: ['Dispater', 'Hell Sentinel', 'Cerebov'] },

  // Internal linking → CONNECTION demons (clingers, tethers)
  { keywords: ['internal link', 'anchor text', 'link structure', 'link graph', 'navigation'],
    prefer: ['Shadow Demon', 'Lemure', 'Ghoul'] },

  // Local SEO / GBP → PLACE-BOUND demons
  { keywords: ['local seo', 'local', 'gbp', 'google business', 'nap', 'citation', 'map pack', 'gmb', 'google maps'],
    prefer: ['Ereshkigal', 'Shadow Demon', 'Ghoul', 'Ice Fiend'] },

  // Backlinks / authority → INFLUENCER demons
  { keywords: ['backlink', 'toxic link', 'link profile', 'anchor', 'link velocity', 'domain authority'],
    prefer: ['Asmodeus', 'Brimstone Fiend', 'Lich'] },

  // AI / GEO / generative search → NEW-AGE demons
  { keywords: ['ai overview', 'chatgpt', 'perplexity', 'geo', 'llm', 'ai search', 'generative', 'llms.txt'],
    prefer: ['Ereshkigal', 'Ancient Lich', 'Shadow Dragon'] },
];

/**
 * Given a demon pool and an issue, return the subset of demons whose
 * names match any of the preferred archetypes for the issue's theme.
 * Returns an empty array when no theme matches.
 */
function findThematicDemons(pool, issue) {
  if (!issue) return [];
  const text = [
    issue.title || '',
    issue.description || '',
    issue.category || '',
  ].join(' ').toLowerCase();

  for (const theme of THEME_HINTS) {
    const hit = theme.keywords.some((kw) => text.includes(kw));
    if (!hit) continue;

    const matches = [];
    for (const preferName of theme.prefer) {
      const found = pool.find((d) => d.name.includes(preferName));
      if (found && !matches.includes(found)) matches.push(found);
    }
    if (matches.length > 0) return matches;
  }
  return [];
}

/**
 * Walk every issue and stamp a `_tierRank` property so the assignment
 * engine knows which issue is the worst in its severity bucket. Rank 0 =
 * most severe (sorted by HP, higher = worse), tiebreak by id for
 * deterministic ordering across renders.
 */
export function assignTierRanks(issues) {
  if (!Array.isArray(issues)) return;
  const buckets = {};
  for (const issue of issues) {
    const sev = issue.severity || 'medium';
    (buckets[sev] ||= []).push(issue);
  }
  for (const sev of Object.keys(buckets)) {
    buckets[sev].sort((a, b) => {
      const hpA = Number(a.hp) || 0;
      const hpB = Number(b.hp) || 0;
      if (hpB !== hpA) return hpB - hpA;
      return Number(a.id || 0) - Number(b.id || 0);
    });
    buckets[sev].forEach((issue, rank) => { issue._tierRank = rank; });
  }
}

/**
 * Batch-assign demons to every issue in one audit, tracking which demons
 * are taken per tier so the hall doesn't show the same face twice unless
 * we genuinely run out. This is the heart of the assignment engine.
 *
 * Strategy:
 *   - Process worst-to-best (critical tier rank 0 picks first, last).
 *   - For each issue, try themed demons in theme order. Take the first
 *     unused one.
 *   - If no themed match (or all themed demons taken), walk the tier
 *     pool starting at the issue's rank and take the first unused demon.
 *     This keeps the hierarchy intact (rank 0 usually gets pool[0])
 *     while avoiding collisions.
 *   - Overflow fallback: if literally every demon in the tier is taken,
 *     cycle through the mook portion (skip rank-0 demon to keep the boss
 *     unique) deterministically by issue id.
 *
 * Call this once per audit, before any render. Every issue gets
 * _demonKey and _demonName stamped on it.
 */
export function assignAllDemons(issues) {
  if (!Array.isArray(issues) || issues.length === 0) return;

  // Step 1 — compute _tierRank on every issue
  assignTierRanks(issues);

  // Step 2 — initialize per-tier "used" sets
  const used = {
    critical: new Set(),
    high: new Set(),
    medium: new Set(),
    low: new Set(),
    info: new Set(),
  };

  // Step 3 — sort so we assign worst-first (top-tier boss goes first,
  //          then mid-tier boss, etc., then down through sub-bosses).
  //          This means top-ranked demons get claimed by top-ranked
  //          issues before anyone else can grab them.
  const TIER_ORDER = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
  const processingOrder = issues.slice().sort((a, b) => {
    const ta = TIER_ORDER[a.severity] ?? 2;
    const tb = TIER_ORDER[b.severity] ?? 2;
    if (ta !== tb) return ta - tb;
    return (a._tierRank || 0) - (b._tierRank || 0);
  });

  // Step 4 — assign each issue
  for (const issue of processingOrder) {
    const sev = issue.severity || 'medium';
    const pool = POOLS[sev] || POOLS.medium;
    const usedSet = used[sev] || used.medium;
    const rank = issue._tierRank || 0;

    let picked = null;

    // 4a — thematic: first unused demon from the issue's theme, if any
    const themed = findThematicDemons(pool, issue);
    for (const demon of themed) {
      if (!usedSet.has(demon.key)) { picked = demon; break; }
    }

    // 4b — rank walk: start at rank position, find first unused demon
    //       (keeps hierarchy: rank-0 issue gets pool[0] if still free)
    if (!picked) {
      for (let offset = 0; offset < pool.length; offset++) {
        const idx = (rank + offset) % pool.length;
        if (!usedSet.has(pool[idx].key)) { picked = pool[idx]; break; }
      }
    }

    // 4c — total overflow: every demon in the tier is already taken.
    //       Cycle through the non-boss portion so the boss stays unique.
    if (!picked) {
      const id = Number(issue.id) || rank;
      const mookStart = Math.min(1, pool.length - 1);
      const mookCount = pool.length - mookStart;
      picked = pool[mookStart + (Math.abs(id * 2654435761) % mookCount)];
    }

    issue._demonKey = picked.key;
    issue._demonName = picked.name;
    usedSet.add(picked.key);
  }
}

/**
 * Look up the demon assigned to an issue. Call assignAllDemons(issues)
 * FIRST to stamp assignments, then this returns the stored pick.
 * Falls back to a single-issue best-effort pick if called without prior
 * batch assignment (legacy callers).
 */
export function pickDemonForIssue(severity, issueId, issue) {
  const pool = POOLS[severity] || POOLS.medium;

  // Fast path: batch assignment already ran, return the stored demon.
  if (issue && issue._demonKey) {
    const found = pool.find((d) => d.key === issue._demonKey);
    if (found) return found;
  }

  // Legacy fallback — single-issue pick with no cross-issue awareness.
  // Only hit if a caller picks without calling assignAllDemons() first.
  const rank = (issue && typeof issue._tierRank === 'number') ? issue._tierRank : 0;
  const id = Number(issueId) || rank;
  const themed = findThematicDemons(pool, issue);
  if (themed.length > 0) {
    const index = rank < themed.length ? rank : Math.abs(id * 2654435761) % themed.length;
    return themed[index];
  }
  if (rank < pool.length) return pool[rank];
  const mookStart = Math.min(1, pool.length - 1);
  const mookCount = pool.length - mookStart;
  return pool[mookStart + ((rank - mookStart) % mookCount)];
}

/**
 * Flatten pools into a single array for preloading in BootScene.
 * Legacy 0x72 entries are handled separately (they live in 0x72/frames/).
 */
export function getAllNewDemons() {
  const all = [];
  for (const tier of Object.values(POOLS)) {
    for (const demon of tier) {
      if (demon.path !== '0x72') all.push(demon);
    }
  }
  return all;
}

/** Legacy 0x72 demon = has real 4-frame idle spritesheet animation. */
export function isLegacyDemon(demon) {
  return demon && demon.path === '0x72';
}
