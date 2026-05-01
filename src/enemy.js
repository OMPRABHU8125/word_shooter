// ============================================================
// enemy.js — Enemy factory, types, and movement systems
// ============================================================

import { getUniqueWord } from './words.js';

// ── Enemy Type Definitions ──────────────────────────────────
export const ENEMY_TYPES = {
  normal: {
    name: 'normal',
    color: '#00f5ff',
    glowColor: 'rgba(0, 245, 255, 0.4)',
    speedMultiplier: 1,
    shape: 'diamond',
    points: 10
  },
  fast: {
    name: 'fast',
    color: '#ff6b35',
    glowColor: 'rgba(255, 107, 53, 0.4)',
    speedMultiplier: 1.8,
    shape: 'triangle',
    points: 15
  },
  zigzag: {
    name: 'zigzag',
    color: '#ff2ecf',
    glowColor: 'rgba(255, 46, 207, 0.4)',
    speedMultiplier: 1.1,
    shape: 'hexagon',
    points: 20
  },
  orbit: {
    name: 'orbit',
    color: '#ffd700',
    glowColor: 'rgba(255, 215, 0, 0.4)',
    speedMultiplier: 0.7,
    shape: 'circle',
    points: 25
  }
};

// ── Enemy Factory ───────────────────────────────────────────

/**
 * Create a new enemy.
 * @param {number} canvasW
 * @param {number} canvasH
 * @param {{ x: number, y: number }} corePos — center of the core
 * @param {number} difficulty — 0 to 1
 * @param {string[]} activeWords
 * @returns {object} enemy
 */
export function createEnemy(canvasW, canvasH, corePos, difficulty, activeWords) {
  const type = pickEnemyType(difficulty);
  const typeDef = ENEMY_TYPES[type];
  const word = getUniqueWord(difficulty, activeWords);
  const spawn = getSpawnPosition(canvasW, canvasH);
  
  const baseSpeed = 30 + difficulty * 25; // pixels per second
  const speed = baseSpeed * typeDef.speedMultiplier;

  // Direction toward core
  const dx = corePos.x - spawn.x;
  const dy = corePos.y - spawn.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const dirX = dx / dist;
  const dirY = dy / dist;

  const enemy = {
    id: Math.random().toString(36).substr(2, 9),
    word,
    typedIndex: 0,       // how many chars have been typed
    x: spawn.x,
    y: spawn.y,
    vx: dirX * speed,
    vy: dirY * speed,
    speed,
    type,
    typeDef,
    isTargeted: false,
    alive: true,
    spawnTime: performance.now(),

    // For zigzag
    baseX: spawn.x,
    baseY: spawn.y,
    travelDist: 0,
    perpX: -dirY,       // perpendicular direction
    perpY: dirX,

    // For orbit
    angle: Math.atan2(spawn.y - corePos.y, spawn.x - corePos.x),
    radius: dist,
    angularSpeed: 0.4 + Math.random() * 0.3,
    spiralRate: 15 + Math.random() * 10,

    // Visual
    size: 8 + word.length * 1.5,
    alpha: 0,            // fade in
    pulsePhase: Math.random() * Math.PI * 2
  };

  return enemy;
}

/**
 * Pick an enemy type based on difficulty.
 */
function pickEnemyType(difficulty) {
  const r = Math.random();
  
  if (difficulty < 0.2) {
    return 'normal';
  } else if (difficulty < 0.4) {
    return r < 0.7 ? 'normal' : 'fast';
  } else if (difficulty < 0.6) {
    if (r < 0.4) return 'normal';
    if (r < 0.7) return 'fast';
    return 'zigzag';
  } else {
    if (r < 0.25) return 'normal';
    if (r < 0.50) return 'fast';
    if (r < 0.75) return 'zigzag';
    return 'orbit';
  }
}

/**
 * Get a random spawn position along the canvas edge with margin.
 */
function getSpawnPosition(canvasW, canvasH) {
  const margin = 60;
  const side = Math.floor(Math.random() * 4);
  
  switch (side) {
    case 0: // top
      return { x: margin + Math.random() * (canvasW - margin * 2), y: -margin };
    case 1: // right
      return { x: canvasW + margin, y: margin + Math.random() * (canvasH - margin * 2) };
    case 2: // bottom
      return { x: margin + Math.random() * (canvasW - margin * 2), y: canvasH + margin };
    case 3: // left
      return { x: -margin, y: margin + Math.random() * (canvasH - margin * 2) };
    default:
      return { x: -margin, y: canvasH / 2 };
  }
}

// ── Movement Update ─────────────────────────────────────────

/**
 * Update enemy position based on its type.
 * @param {object} enemy
 * @param {{ x: number, y: number }} corePos
 * @param {number} dt — delta time in seconds
 */
export function updateEnemy(enemy, corePos, dt) {
  // Fade in
  if (enemy.alpha < 1) {
    enemy.alpha = Math.min(1, enemy.alpha + dt * 3);
  }

  // Pulse phase
  enemy.pulsePhase += dt * 3;

  switch (enemy.type) {
    case 'normal':
    case 'fast':
      updateNormal(enemy, dt);
      break;
    case 'zigzag':
      updateZigzag(enemy, corePos, dt);
      break;
    case 'orbit':
      updateOrbit(enemy, corePos, dt);
      break;
  }
}

function updateNormal(enemy, dt) {
  enemy.x += enemy.vx * dt;
  enemy.y += enemy.vy * dt;
}

function updateZigzag(enemy, corePos, dt) {
  // Move toward core
  enemy.travelDist += enemy.speed * dt;
  
  // Recalculate direction to core for more accurate homing
  const dx = corePos.x - enemy.x;
  const dy = corePos.y - enemy.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const dirX = dx / dist;
  const dirY = dy / dist;
  
  // Zigzag offset
  const zigzagAmplitude = 80;
  const zigzagFrequency = 2.5;
  const offset = Math.sin(enemy.travelDist * zigzagFrequency * 0.01) * zigzagAmplitude;
  
  // Perpendicular direction
  const perpX = -dirY;
  const perpY = dirX;
  
  enemy.vx = dirX * enemy.speed + perpX * offset * 0.5;
  enemy.vy = dirY * enemy.speed + perpY * offset * 0.5;
  
  enemy.x += enemy.vx * dt;
  enemy.y += enemy.vy * dt;
}

function updateOrbit(enemy, corePos, dt) {
  // Spiral inward
  enemy.radius -= enemy.spiralRate * dt;
  enemy.angle += enemy.angularSpeed * dt;
  
  if (enemy.radius < 0) enemy.radius = 0;
  
  enemy.x = corePos.x + Math.cos(enemy.angle) * enemy.radius;
  enemy.y = corePos.y + Math.sin(enemy.angle) * enemy.radius;
}

// ── Collision Check ─────────────────────────────────────────

/**
 * Check if enemy has reached the core.
 * @param {object} enemy
 * @param {{ x: number, y: number, radius: number }} core
 * @returns {boolean}
 */
export function hasReachedCore(enemy, core) {
  const dx = enemy.x - core.x;
  const dy = enemy.y - core.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return dist < core.radius + enemy.size;
}

/**
 * Check if enemy is off-screen (cleanup).
 */
export function isOffScreen(enemy, canvasW, canvasH) {
  const margin = 200;
  return (
    enemy.x < -margin ||
    enemy.x > canvasW + margin ||
    enemy.y < -margin ||
    enemy.y > canvasH + margin
  );
}
