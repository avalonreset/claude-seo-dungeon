// =====================================================================
// DEMON MANIFEST - 13 animated characters from 0x72 DungeonTileset II.
//
// POLICY: Every demon in this roster has a real 4-frame idle animation
// (sourced from 0x72's CC0 tileset). No static sprites. No fake breath
// tweens pretending to be animation. If a character doesn't have a
// proper idle loop, it doesn't appear in the dungeon.
//
// Native facing: all 0x72 characters face RIGHT. Battle/Hall scenes
// apply setFlipX(true) to face the player on the left.
//
// Hierarchy: tier = severity bucket. Within a tier, index 0 is the
// most glorious/dangerous, index N is the weakest mook. The rank-0
// demon of a tier is reserved for the worst issue in that tier.
// =====================================================================

const d = (name, label) => ({
  name,                                // 0x72 asset name, e.g. 'big_demon'
  key: `demon_${name}`,                // base texture key (frame 0 reused)
  animKey: `demon_${name}_idle`,       // idle animation key
  frame0Key: `demon_${name}_f0`,       // first-frame texture key
  framePrefix: `demon_${name}_f`,      // frame key prefix (append 0..3)
  label,                               // display name
  frames: 4,                           // all 0x72 idle anims are 4 frames
});

// ── TIER 5: CRITICAL - the archdemons ────────────────────────────────
// Biggest sprites, most glorious. Rank-0 gets the worst issue.
// Proper names + epithets. These are bosses in every sense; they earn
// their own identity the way Dark-Souls bosses do: a short strange
// name you will remember, then a title that communicates station.
export const CRITICAL_POOL = [
  d('big_demon', 'Gorreth, the Archdemon'),
  d('ogre',      'Vrokk the Mountainborn'),
];

// ── TIER 4: HIGH - major threats ─────────────────────────────────────
// Named warriors and a titled revenant. The Risen Colossus keeps its
// pure-title form because some horrors are too old to have a name.
export const HIGH_POOL = [
  d('orc_warrior', 'Kharnos, Warborn'),
  d('big_zombie',  'The Risen Colossus'),
  d('skelet',      'Oskaryn the Ivory-Armed'),
];

// ── TIER 3: MEDIUM - mid-tier ────────────────────────────────────────
// Proper names with gothic epithets. Each is a distinct presence
// rather than a category.
export const MEDIUM_POOL = [
  d('chort',        'Chirot the Laughing'),
  d('masked_orc',   'The Thrice-Masked'),
  d('pumpkin_dude', 'Halgrim the Rot-Crowned'),
];

// ── TIER 2: LOW - lesser threats ─────────────────────────────────────
// A mix of one proper name and two "type-as-identity" forms. Lesser
// enemies in gothic fantasy are often known by what they do, not by
// who they are.
export const LOW_POOL = [
  d('orc_shaman', 'Ashkarn the Entrail-Reader'),
  d('imp',        'Skittering Imp'),
  d('wogol',      'Wogol of the Deep-Damp'),
];

// ── TIER 1: INFO - the weakest pests ─────────────────────────────────
// Type-named. These are not individuals; they are manifestations.
export const INFO_POOL = [
  d('goblin',      'Step-Skulker'),
  d('tiny_zombie', 'Lesser Risen'),
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
// Three-pass algorithm that preserves hierarchy AND adds thematic flavor:
//
//   1) THEMATIC MATCHING
//      Map SEO category/keywords to demon archetype. Schema & security
//      draw the enforcer types (Archdemon, Orc Warrior, Ogre). Broken
//      links and stale content draw the undead (Skeleton, Zombie).
//      Performance bugs draw the fast little nuisances (Imp, Chort).
//
//   2) TIER-RANK HIERARCHY
//      Within a severity tier, the issue with the most HP (worst) gets
//      the tier's rank-0 demon. So the nastiest critical issue always
//      faces the Archdemon, and the weakest info issue gets a Tiny
//      Zombie.
//
//   3) DETERMINISTIC FALLBACK
//      When a tier has more issues than demons, cycle through the mook
//      portion of the pool by issue id so the hall never shows the same
//      face twice in a row unless we genuinely run out.
//
// ═══════════════════════════════════════════════════════════════════════

// SEO-category → demon-archetype mappings. First match wins.
// Each theme lists preferred demons by ASSET NAME (the stable 0x72
// sprite key like 'big_demon', 'orc_warrior'). Asset names never
// change; display labels can, so matching by name here means future
// label upgrades do not silently break thematic assignment.
// Order inside `prefer` is the theme's own ranking - most-appropriate first.
const THEME_HINTS = [
  // Schema / structured data → lawful enforcers
  { keywords: ['schema', 'structured data', 'json-ld', 'microdata', 'rich result', 'rich snippet', 'markup'],
    prefer: ['big_demon', 'orc_warrior', 'masked_orc'] },

  // Security / HTTPS → heavy armored threats
  { keywords: ['security', 'https', 'ssl', 'tls', 'certificate', 'xss', 'mixed content', 'hsts'],
    prefer: ['ogre', 'orc_warrior', 'masked_orc', 'imp'] },

  // Broken / 404 / redirects → skeletal remnants
  { keywords: ['404', 'broken link', 'broken', 'redirect chain', 'dead link', 'soft 404', 'orphan page'],
    prefer: ['skelet', 'tiny_zombie', 'big_zombie'] },

  // Stale / outdated → undead
  { keywords: ['stale', 'outdated', 'freshness', 'last updated', 'decay', 'old content', 'freshness signal'],
    prefer: ['big_zombie', 'skelet', 'tiny_zombie'] },

  // Duplicate / canonical / thin → tricksters that mirror
  { keywords: ['duplicate', 'canonical', 'cannibalization', 'near-duplicate', 'thin page', 'redundant'],
    prefer: ['chort', 'imp', 'wogol'] },

  // Performance / CWV → fast little nuisances
  { keywords: ['performance', 'core web vitals', 'cwv', 'speed', 'pagespeed', 'page speed', 'lcp', 'inp', 'cls', 'render-blocking', 'loading', 'slow'],
    prefer: ['imp', 'chort', 'goblin', 'wogol'] },

  // Mobile / responsive → small shifters
  { keywords: ['mobile', 'responsive', 'viewport', 'touch target', 'text too small', 'tap target'],
    prefer: ['wogol', 'imp', 'chort'] },

  // Images / alt text → simple pests
  { keywords: ['image', 'alt text', 'alt attribute', 'image seo', 'webp', 'lazy load', 'compression'],
    prefer: ['goblin', 'imp', 'tiny_zombie'] },

  // Meta / titles / descriptions → named speakers (they have presence)
  { keywords: ['meta tag', 'title tag', 'meta description', 'og:', 'opengraph', 'twitter card', 'headings', 'h1'],
    prefer: ['big_demon', 'ogre', 'orc_warrior'] },

  // Sitemap / crawlability / indexation → order-keepers
  { keywords: ['sitemap', 'robots.txt', 'crawl', 'indexation', 'indexing', 'noindex', 'disallow'],
    prefer: ['ogre', 'orc_warrior', 'big_demon'] },

  // Internal linking → connectors / small scouts
  { keywords: ['internal link', 'anchor text', 'link structure', 'link graph', 'navigation'],
    prefer: ['goblin', 'wogol', 'imp'] },

  // Content quality / E-E-A-T → the most intimidating of the roster
  { keywords: ['e-e-a-t', 'eeat', 'thin content', 'low quality', 'content quality', 'author', 'expertise', 'authoritativeness', 'trustworthiness', 'trust signal'],
    prefer: ['big_demon', 'ogre', 'pumpkin_dude'] },

  // Local SEO / GBP → place-bound oddities
  { keywords: ['local seo', 'local', 'gbp', 'google business', 'nap', 'citation', 'map pack', 'gmb', 'google maps'],
    prefer: ['pumpkin_dude', 'masked_orc', 'goblin'] },

  // Backlinks / authority → major bosses
  { keywords: ['backlink', 'toxic link', 'link profile', 'anchor', 'link velocity', 'domain authority'],
    prefer: ['big_demon', 'ogre', 'orc_warrior'] },

  // AI / GEO / generative search → strange new horrors
  { keywords: ['ai overview', 'chatgpt', 'perplexity', 'geo', 'llm', 'ai search', 'generative', 'llms.txt'],
    prefer: ['pumpkin_dude', 'big_demon', 'skelet'] },
];

/**
 * Given a demon pool and an issue, return the subset of demons whose
 * asset names match any of the preferred archetypes for the issue's
 * theme. Returns an empty array when no theme matches.
 * Uses demon.name (the stable 0x72 asset key) so that display-label
 * changes never break theme matching.
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
      const found = pool.find((dd) => dd.name === preferName);
      if (found && !matches.includes(found)) matches.push(found);
    }
    if (matches.length > 0) return matches;
  }
  return [];
}

/**
 * Walk every issue and stamp `_tierRank` so the assignment engine knows
 * which issue is the worst in its severity bucket. Rank 0 = most severe
 * (sorted by HP, higher = worse), tiebreak by id for deterministic
 * ordering across renders.
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
 * Batch-assign demons to every issue in one audit, tracking which
 * demons are taken per tier so the hall doesn't show the same face
 * twice unless we genuinely run out.
 *
 * Strategy:
 *   - Process worst-to-best (critical rank 0 picks first, last).
 *   - For each issue, try themed demons in theme order. Take the first
 *     unused one.
 *   - If no themed match, walk the tier pool starting at the issue's
 *     rank and take the first unused demon. This keeps hierarchy
 *     intact (rank 0 gets pool[0]) while avoiding collisions.
 *   - Overflow fallback: if every demon in the tier is taken, cycle
 *     through the mook portion (skip rank-0 to keep the boss unique)
 *     deterministically by issue id.
 */
export function assignAllDemons(issues) {
  if (!Array.isArray(issues) || issues.length === 0) return;
  assignTierRanks(issues);

  const used = {
    critical: new Set(),
    high:     new Set(),
    medium:   new Set(),
    low:      new Set(),
    info:     new Set(),
  };

  const TIER_ORDER = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
  const processingOrder = issues.slice().sort((a, b) => {
    const ta = TIER_ORDER[a.severity] ?? 2;
    const tb = TIER_ORDER[b.severity] ?? 2;
    if (ta !== tb) return ta - tb;
    return (a._tierRank || 0) - (b._tierRank || 0);
  });

  for (const issue of processingOrder) {
    const sev = issue.severity || 'medium';
    const pool = POOLS[sev] || POOLS.medium;
    const usedSet = used[sev] || used.medium;
    const rank = issue._tierRank || 0;

    let picked = null;

    // 1. Thematic: first unused demon from the issue's theme, if any
    const themed = findThematicDemons(pool, issue);
    for (const demon of themed) {
      if (!usedSet.has(demon.key)) { picked = demon; break; }
    }

    // 2. Rank walk: start at rank position, find first unused demon
    if (!picked) {
      for (let offset = 0; offset < pool.length; offset++) {
        const idx = (rank + offset) % pool.length;
        if (!usedSet.has(pool[idx].key)) { picked = pool[idx]; break; }
      }
    }

    // 3. Overflow: cycle through non-boss portion by issue id
    if (!picked) {
      const id = Number(issue.id) || rank;
      const mookStart = Math.min(1, pool.length - 1);
      const mookCount = pool.length - mookStart;
      picked = pool[mookStart + (Math.abs(id * 2654435761) % mookCount)];
    }

    issue._demonKey = picked.key;
    issue._demonName = picked.label;
    issue._demonAnimKey = picked.animKey;
    issue._demonFrame0Key = picked.frame0Key;
    usedSet.add(picked.key);
  }
}

/**
 * Look up the demon assigned to an issue. Call assignAllDemons(issues)
 * FIRST to stamp assignments, then this returns the stored pick.
 * Falls back to a single-issue pick if called without prior batch
 * assignment.
 */
export function pickDemonForIssue(severity, issueId, issue) {
  const pool = POOLS[severity] || POOLS.medium;

  if (issue && issue._demonKey) {
    const found = pool.find((d) => d.key === issue._demonKey);
    if (found) return found;
  }

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
 * Flatten every pool into one array for BootScene preloading. Every
 * demon is a 4-frame idle from 0x72/frames/.
 */
export function getAllDemons() {
  const out = [];
  for (const tier of Object.values(POOLS)) out.push(...tier);
  return out;
}
