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
    speedMultiplier: 2.2,
    shape: 'triangle',
    points: 15
  },
  zigzag: {
    name: 'zigzag',
    color: '#ff2ecf',
    glowColor: 'rgba(255, 46, 207, 0.4)',
    speedMultiplier: 1.2,
    shape: 'hexagon',
    points: 20
  },
  orbit: {
    name: 'orbit',
    color: '#ffd700',
    glowColor: 'rgba(255, 215, 0, 0.4)',
    speedMultiplier: 0.8,
    shape: 'circle',
    points: 25
  },
  burst: {
    name: 'burst',
    color: '#00ff41',
    glowColor: 'rgba(0, 255, 65, 0.4)',
    speedMultiplier: 0.6,
    shape: 'square',
    points: 30
  },
  accelerator: {
    name: 'accelerator',
    color: '#ff0055',
    glowColor: 'rgba(255, 0, 85, 0.4)',
    speedMultiplier: 0.5,
    shape: 'triangle',
    points: 25
  }
};

// ── Enemy Factory ───────────────────────────────────────────

/**
 * Create a new enemy.
 */
export function createEnemy(canvasW, canvasH, corePos, difficulty, activeWords, overrideProps = {}) {
  const type = overrideProps.type || pickEnemyType(difficulty);
  const typeDef = ENEMY_TYPES[type];
  const word = overrideProps.word || getUniqueWord(difficulty, activeWords);
  const spawn = overrideProps.x !== undefined ? { x: overrideProps.x, y: overrideProps.y } : getSpawnPosition(canvasW, canvasH);
  
  const baseSpeed = 40 + difficulty * 40;
  const speed = baseSpeed * typeDef.speedMultiplier;

  const dx = corePos.x - spawn.x;
  const dy = corePos.y - spawn.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const dirX = dx / dist;
  const dirY = dy / dist;

  const enemy = {
    id: Math.random().toString(36).substr(2, 9),
    word,
    typedIndex: 0,
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
    glitchOffset: { x: 0, y: 0 },
    
    // Custom behaviors
    didSplit: false,
    acceleration: type === 'accelerator' ? 1.05 : 1,

    // For zigzag
    travelDist: 0,
    
    // For orbit
    angle: Math.atan2(spawn.y - corePos.y, spawn.x - corePos.x),
    radius: dist,
    angularSpeed: (0.4 + Math.random() * 0.4) * (Math.random() > 0.5 ? 1 : -1),
    spiralRate: 20 + Math.random() * 15,

    size: 10 + word.length * 2,
    alpha: 0
  };

  return enemy;
}

function pickEnemyType(difficulty) {
  const r = Math.random();
  if (difficulty < 0.15) return 'normal';
  if (difficulty < 0.3) return r < 0.6 ? 'normal' : 'fast';
  if (difficulty < 0.5) {
    if (r < 0.4) return 'normal';
    if (r < 0.7) return 'fast';
    return 'zigzag';
  }
  if (difficulty < 0.7) {
    if (r < 0.3) return 'normal';
    if (r < 0.5) return 'fast';
    if (r < 0.75) return 'zigzag';
    return 'orbit';
  }
  // Late game
  if (r < 0.2) return 'fast';
  if (r < 0.4) return 'zigzag';
  if (r < 0.6) return 'orbit';
  if (r < 0.8) return 'burst';
  return 'accelerator';
}

function getSpawnPosition(canvasW, canvasH) {
  const margin = 80;
  const side = Math.floor(Math.random() * 4);
  switch (side) {
    case 0: return { x: margin + Math.random() * (canvasW - margin * 2), y: -margin };
    case 1: return { x: canvasW + margin, y: margin + Math.random() * (canvasH - margin * 2) };
    case 2: return { x: margin + Math.random() * (canvasW - margin * 2), y: canvasH + margin };
    case 3: return { x: -margin, y: margin + Math.random() * (canvasH - margin * 2) };
    default: return { x: -margin, y: canvasH / 2 };
  }
}

// ── Movement Update ─────────────────────────────────────────

export function updateEnemy(enemy, corePos, dt) {
  if (enemy.alpha < 1) enemy.alpha = Math.min(1, enemy.alpha + dt * 4);

  // Add subtle glitch jitter
  if (Math.random() > 0.95) {
    enemy.glitchOffset.x = (Math.random() - 0.5) * 6;
    enemy.glitchOffset.y = (Math.random() - 0.5) * 6;
  } else {
    enemy.glitchOffset.x *= 0.8;
    enemy.glitchOffset.y *= 0.8;
  }

  switch (enemy.type) {
    case 'normal':
    case 'fast':
      enemy.x += enemy.vx * dt;
      enemy.y += enemy.vy * dt;
      break;
    case 'accelerator':
      enemy.speed *= 1 + (0.5 * dt); // Gradually speed up
      const dx = corePos.x - enemy.x;
      const dy = corePos.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      enemy.vx = (dx / dist) * enemy.speed;
      enemy.vy = (dy / dist) * enemy.speed;
      enemy.x += enemy.vx * dt;
      enemy.y += enemy.vy * dt;
      break;
    case 'zigzag':
      enemy.travelDist += enemy.speed * dt;
      const zdx = corePos.x - enemy.x;
      const zdy = corePos.y - enemy.y;
      const zdist = Math.sqrt(zdx * zdx + zdy * zdy);
      const zdirX = zdx / zdist;
      const zdirY = zdy / zdist;
      const offset = Math.sin(enemy.travelDist * 0.05) * 120;
      enemy.x += (zdirX * enemy.speed - zdirY * offset * 0.5) * dt;
      enemy.y += (zdirY * enemy.speed + zdirX * offset * 0.5) * dt;
      break;
    case 'orbit':
      enemy.radius -= enemy.spiralRate * dt;
      enemy.angle += enemy.angularSpeed * dt;
      enemy.x = corePos.x + Math.cos(enemy.angle) * enemy.radius;
      enemy.y = corePos.y + Math.sin(enemy.angle) * enemy.radius;
      break;
    case 'burst':
      enemy.x += enemy.vx * dt;
      enemy.y += enemy.vy * dt;
      break;
  }
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
