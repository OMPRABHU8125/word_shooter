// ============================================================
// game.js — Main game engine and orchestrator
// ============================================================

import { createEnemy, updateEnemy, hasReachedCore, isOffScreen } from './enemy.js';
import { createTypingState, processKeyPress, updateHeat, calculateWPM, handleEscape } from './typing.js';
import { UIManager } from './ui.js';

class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.ui = new UIManager(this.canvas, this.ctx);
    
    this.gameState = {
      score: 0,
      health: 100,
      state: 'MENU', // MENU, PLAYING, GAMEOVER
      enemies: [],
      lastSpawnTime: 0,
      spawnInterval: 2500, // starting spawn interval in ms
      startTime: 0,
      elapsedTime: 0,
      difficulty: 0,
      core: { x: 0, y: 0, radius: 40 }
    };

    this.typing = createTypingState();
    
    this.boundHandleKeydown = this.handleKeydown.bind(this);
    this.resize();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('keydown', this.boundHandleKeydown);
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.gameState.core.x = this.canvas.width / 2;
    this.gameState.core.y = this.canvas.height / 2;
  }

  start() {
    this.gameState.score = 0;
    this.gameState.health = 100;
    this.gameState.enemies = [];
    this.gameState.state = 'PLAYING';
    this.gameState.startTime = performance.now();
    this.gameState.lastSpawnTime = this.gameState.startTime;
    this.gameState.difficulty = 0;
    this.gameState.spawnInterval = 2500;
    
    this.typing = createTypingState();
    
    document.getElementById('menu-screen').style.display = 'none';
    document.getElementById('game-over-screen').style.display = 'none';
    document.getElementById('hud').style.display = 'flex';
    
    requestAnimationFrame((t) => this.loop(t));
  }

  handleKeydown(e) {
    if (this.gameState.state !== 'PLAYING') return;

    if (e.key === 'Escape') {
      handleEscape(this.typing);
      return;
    }

    const result = processKeyPress(e.key, this.typing, this.gameState.enemies, this.gameState.core);
    
    if (result.action === 'correct' || result.action === 'destroyed') {
      this.gameState.score += result.score;
      this.ui.createLaser(this.gameState.core, result.enemy, result.enemy.typeDef.color);
      
      if (result.action === 'destroyed') {
        this.ui.createExplosion(result.enemy.x, result.enemy.y, result.enemy.typeDef.color);
        this.ui.screenShake(5, 100);
      }
    } else if (result.action === 'wrong') {
      this.gameState.score = Math.max(0, this.gameState.score + result.score);
      this.ui.screenShake(3, 100);
      this.ui.triggerGlitch(150); // Trigger visual glitch on error
    }
  }

  loop(timestamp) {
    if (this.gameState.state !== 'PLAYING') return;

    const dt = (timestamp - (this.lastFrameTime || timestamp)) / 1000;
    this.lastFrameTime = timestamp;
    this.gameState.elapsedTime = (timestamp - this.gameState.startTime) / 1000;

    this.update(dt, timestamp);
    this.render();

    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt, timestamp) {
    // Scaling difficulty
    this.gameState.difficulty = Math.min(1, this.gameState.elapsedTime / 300);
    this.gameState.spawnInterval = Math.max(600, 2500 * Math.pow(0.97, this.gameState.elapsedTime / 10));

    // Spawning
    if (timestamp - this.gameState.lastSpawnTime > this.gameState.spawnInterval) {
      const activeWords = this.gameState.enemies.map(e => e.word);
      const enemy = createEnemy(this.canvas.width, this.canvas.height, this.gameState.core, this.gameState.difficulty, activeWords);
      this.gameState.enemies.push(enemy);
      this.gameState.lastSpawnTime = timestamp;
    }

    // Update Typing State
    updateHeat(this.typing, dt);
    this.gameState.wpm = calculateWPM(this.typing, this.gameState.startTime);

    // Update Enemies
    for (let i = this.gameState.enemies.length - 1; i >= 0; i--) {
      const enemy = this.gameState.enemies[i];
      updateEnemy(enemy, this.gameState.core, dt);

      // Handle Burst Splitting
      if (enemy.type === 'burst' && !enemy.didSplit && enemy.typedIndex >= Math.ceil(enemy.word.length / 2)) {
        enemy.didSplit = true;
        enemy.alive = false;
        
        // Spawn two fragments
        for (let j = 0; j < 2; j++) {
          const fragment = createEnemy(this.canvas.width, this.canvas.height, this.gameState.core, this.gameState.difficulty, [], {
            type: 'fast', // fragments are fast
            x: enemy.x + (j === 0 ? -20 : 20),
            y: enemy.y + (j === 0 ? -20 : 20)
          });
          this.gameState.enemies.push(fragment);
        }
        
        if (this.typing.currentTarget === enemy) {
          this.typing.currentTarget = null;
          this.typing.typedChars = '';
        }
      }

      if (hasReachedCore(enemy, this.gameState.core)) {
        this.gameState.health -= 10;
        this.ui.screenShake(15, 200);
        this.ui.triggerGlitch(300);
        this.gameState.enemies.splice(i, 1);
        if (this.typing.currentTarget === enemy) {
          this.typing.currentTarget = null;
          this.typing.typedChars = '';
        }
        
        if (this.gameState.health <= 0) {
          this.gameOver();
        }
      } else if (isOffScreen(enemy, this.canvas.width, this.canvas.height)) {
        this.gameState.enemies.splice(i, 1);
      } else if (!enemy.alive) {
        this.gameState.enemies.splice(i, 1);
      }
    }

    this.ui.update(dt);
  }

  render() {
    const combinedState = {
      ...this.gameState,
      ...this.typing
    };
    this.ui.render(combinedState, this.gameState.core);
    this.ui.updateDOMHUD(combinedState);
  }

  gameOver() {
    this.gameState.state = 'GAMEOVER';
    document.getElementById('hud').style.display = 'none';
    document.getElementById('game-over-screen').style.display = 'flex';
    document.getElementById('final-score').textContent = this.gameState.score;
    document.getElementById('final-wpm').textContent = this.gameState.wpm;
    document.getElementById('final-combo').textContent = this.typing.maxCombo;
  }
}

// Initialize game
window.addEventListener('load', () => {
  const game = new Game();
  
  document.getElementById('start-btn').addEventListener('click', () => game.start());
  document.getElementById('restart-btn').addEventListener('click', () => game.start());
  document.getElementById('share-btn').addEventListener('click', () => {
    const text = `I scored ${game.gameState.score} in Word Shooter 🔥 Can you beat me?`;
    if (navigator.share) {
      navigator.share({
        title: 'Word Shooter',
        text: text,
        url: window.location.href
      });
    } else {
      alert('Copied to clipboard: ' + text);
      navigator.clipboard.writeText(text);
    }
  });
});
