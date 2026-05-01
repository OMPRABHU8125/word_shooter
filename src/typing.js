// ============================================================
// typing.js — Keyboard input, targeting, combo & heat systems
// ============================================================

// ── Typing State ────────────────────────────────────────────

export function createTypingState() {
  return {
    currentTarget: null,
    typedChars: '',
    combo: 0,
    maxCombo: 0,
    charsTyped: 0,
    wordsCompleted: 0,
    
    // Heat system
    heat: 0,
    overheating: false,
    cooldownTimer: 0,
    
    // WPM tracking
    keyTimestamps: [],
    
    // Last wrong key time (for visual feedback)
    lastWrongTime: 0
  };
}

// ── Heat System ─────────────────────────────────────────────

const HEAT_PER_KEY = 4;
const HEAT_DECAY_RATE = 18;     // per second
const OVERHEAT_THRESHOLD = 85;
const MAX_HEAT = 100;
const COOLDOWN_DURATION = 1.5;  // seconds

/**
 * Update heat meter (call every frame).
 * @param {object} state — typing state
 * @param {number} dt — delta time in seconds
 */
export function updateHeat(state, dt) {
  if (state.cooldownTimer > 0) {
    state.cooldownTimer -= dt;
    if (state.cooldownTimer <= 0) {
      state.cooldownTimer = 0;
      state.overheating = false;
      state.heat = 40;
    }
    return;
  }
  
  // Natural decay
  state.heat = Math.max(0, state.heat - HEAT_DECAY_RATE * dt);
  
  if (state.heat < OVERHEAT_THRESHOLD - 10) {
    state.overheating = false;
  }
}

/**
 * Add heat on keypress.
 * @returns {boolean} true if input is allowed
 */
function addHeat(state) {
  if (state.cooldownTimer > 0) return false;
  
  state.heat += HEAT_PER_KEY;
  
  if (state.heat >= MAX_HEAT) {
    state.overheating = true;
    state.cooldownTimer = COOLDOWN_DURATION;
    state.heat = MAX_HEAT;
    return false;
  }
  
  if (state.heat >= OVERHEAT_THRESHOLD) {
    state.overheating = true;
  }
  
  return true;
}

// ── Targeting & Input ───────────────────────────────────────

/**
 * Process a key press.
 * @param {string} key — the character pressed
 * @param {object} state — typing state
 * @param {object[]} enemies — array of alive enemies
 * @param {{ x: number, y: number }} corePos
 * @returns {{ action: string, enemy?: object, char?: string, score?: number }}
 */
export function processKeyPress(key, state, enemies, corePos) {
  // Ignore non-alpha keys
  if (!/^[a-zA-Z]$/.test(key)) return { action: 'ignored' };
  
  const char = key.toLowerCase();
  
  // Check heat
  if (!addHeat(state)) {
    return { action: 'overheated' };
  }
  
  // Track for WPM
  state.keyTimestamps.push(performance.now());
  // Keep only last 60 seconds of timestamps
  const cutoff = performance.now() - 60000;
  state.keyTimestamps = state.keyTimestamps.filter(t => t > cutoff);
  
  // If we have a target, continue typing it
  if (state.currentTarget && state.currentTarget.alive) {
    const enemy = state.currentTarget;
    const expectedChar = enemy.word[enemy.typedIndex];
    
    if (char === expectedChar) {
      return handleCorrectKey(state, enemy);
    } else {
      return handleWrongKey(state);
    }
  }
  
  // No current target — try to find one
  const candidates = enemies.filter(e => 
    e.alive && 
    !e.isTargeted && 
    e.word[0] === char
  );
  
  if (candidates.length === 0) {
    // Check if any enemy (even targeted by a future system) starts with this char
    const anyCandidates = enemies.filter(e => e.alive && e.word[e.typedIndex] === char);
    if (anyCandidates.length === 0) {
      return handleWrongKey(state);
    }
  }
  
  if (candidates.length > 0) {
    // Pick the closest to the core (highest threat)
    const target = candidates.reduce((closest, e) => {
      const distE = Math.sqrt((e.x - corePos.x) ** 2 + (e.y - corePos.y) ** 2);
      const distC = Math.sqrt((closest.x - corePos.x) ** 2 + (closest.y - corePos.y) ** 2);
      return distE < distC ? e : closest;
    });
    
    // Lock on
    state.currentTarget = target;
    target.isTargeted = true;
    state.typedChars = char;
    
    return handleCorrectKey(state, target);
  }
  
  return handleWrongKey(state);
}

function handleCorrectKey(state, enemy) {
  enemy.typedIndex++;
  state.typedChars = enemy.word.substring(0, enemy.typedIndex);
  state.charsTyped++;
  state.combo++;
  state.maxCombo = Math.max(state.maxCombo, state.combo);
  
  // Score: base * combo multiplier
  const score = Math.round(10 * (1 + state.combo * 0.1));
  
  // Check if word is complete
  if (enemy.typedIndex >= enemy.word.length) {
    enemy.alive = false;
    state.currentTarget = null;
    state.typedChars = '';
    state.wordsCompleted++;
    
    return {
      action: 'destroyed',
      enemy,
      char: enemy.word[enemy.typedIndex - 1],
      score: score + enemy.typeDef.points * (1 + state.combo * 0.05)
    };
  }
  
  return {
    action: 'correct',
    enemy,
    char: enemy.word[enemy.typedIndex - 1],
    score
  };
}

function handleWrongKey(state) {
  state.combo = 0;
  state.typedChars = '';
  state.lastWrongTime = performance.now();
  
  if (state.currentTarget) {
    state.currentTarget.isTargeted = false;
    state.currentTarget.typedIndex = 0;
    state.currentTarget = null;
  }
  
  return { action: 'wrong', score: -5 };
}

// ── WPM Calculation ─────────────────────────────────────────

/**
 * Calculate current WPM.
 * @param {object} state
 * @param {number} gameStartTime — timestamp when game started
 * @returns {number}
 */
export function calculateWPM(state, gameStartTime) {
  const elapsed = (performance.now() - gameStartTime) / 60000; // minutes
  if (elapsed < 0.05) return 0; // avoid division by near-zero
  
  // Standard WPM: (chars / 5) / minutes
  return Math.round((state.charsTyped / 5) / elapsed);
}

/**
 * Handle Escape key — deselect current target.
 * @param {object} state
 */
export function handleEscape(state) {
  if (state.currentTarget) {
    state.currentTarget.isTargeted = false;
    state.currentTarget.typedIndex = 0;
    state.currentTarget = null;
    state.typedChars = '';
  }
}
