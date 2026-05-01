// ============================================================
// ui.js — Canvas rendering, effects, and HUD management
// ============================================================

// ── Particle System ─────────────────────────────────────────

class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.size = Math.random() * 4 + 2;
    this.vx = (Math.random() - 0.5) * 10;
    this.vy = (Math.random() - 0.5) * 10;
    this.alpha = 1;
    this.decay = Math.random() * 0.02 + 0.01;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= this.decay;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// ── Laser Effect ────────────────────────────────────────────

class Laser {
  constructor(from, to, color) {
    this.from = from;
    this.to = to;
    this.color = color;
    this.alpha = 1;
    this.decay = 0.15;
    this.width = 3;
  }

  update() {
    this.alpha -= this.decay;
  }

  draw(ctx) {
    if (this.alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.width;
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    ctx.beginPath();
    ctx.moveTo(this.from.x, this.from.y);
    ctx.lineTo(this.to.x, this.to.y);
    ctx.stroke();
    ctx.restore();
  }
}

// ── UI Manager ──────────────────────────────────────────────

export class UIManager {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.particles = [];
    this.lasers = [];
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
  }

  createExplosion(x, y, color) {
    for (let i = 0; i < 20; i++) {
      this.particles.push(new Particle(x, y, color));
    }
  }

  createLaser(from, to, color) {
    this.lasers.push(new Laser(from, to, color));
  }

  screenShake(intensity, duration) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
  }

  update(dt) {
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update();
      if (this.particles[i].alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update lasers
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      this.lasers[i].update();
      if (this.lasers[i].alpha <= 0) {
        this.lasers.splice(i, 1);
      }
    }

    // Update screen shake
    if (this.shakeDuration > 0) {
      this.shakeDuration -= dt * 1000;
    } else {
      this.shakeIntensity = 0;
    }
  }

  render(gameState, core) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Apply screen shake
    if (this.shakeDuration > 0) {
      const offsetX = (Math.random() - 0.5) * this.shakeIntensity;
      const offsetY = (Math.random() - 0.5) * this.shakeIntensity;
      this.ctx.translate(offsetX, offsetY);
    }

    // Draw grid/background effect
    this.drawBackground();

    // Draw Core
    this.drawCore(core, gameState.health);

    // Draw Enemies
    gameState.enemies.forEach(enemy => this.drawEnemy(enemy));

    // Draw Lasers
    this.lasers.forEach(laser => laser.draw(this.ctx));

    // Draw Particles
    this.particles.forEach(p => p.draw(this.ctx));

    // Draw HUD (DOM-based normally, but some canvas elements)
    this.drawCanvasHUD(gameState);

    // Reset translation if shaken
    if (this.shakeDuration > 0) {
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }

  drawBackground() {
    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.05)';
    this.ctx.lineWidth = 1;
    const step = 50;
    for (let x = 0; x < this.canvas.width; x += step) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }
    for (let y = 0; y < this.canvas.height; y += step) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  drawCore(core, health) {
    const pulse = Math.sin(Date.now() * 0.005) * 5;
    const radius = core.radius + pulse;

    this.ctx.save();
    // Outer glow
    this.ctx.shadowBlur = 20;
    this.ctx.shadowColor = 'rgba(0, 255, 255, 0.5)';
    
    // Core body
    const gradient = this.ctx.createRadialGradient(core.x, core.y, 0, core.x, core.y, radius);
    gradient.addColorStop(0, '#00ffff');
    gradient.addColorStop(0.8, '#008888');
    gradient.addColorStop(1, 'transparent');
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(core.x, core.y, radius, 0, Math.PI * 2);
    this.ctx.fill();

    // Health ring
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();
    this.ctx.arc(core.x, core.y, core.radius + 15, 0, Math.PI * 2);
    this.ctx.stroke();

    this.ctx.strokeStyle = '#ff0055';
    this.ctx.beginPath();
    this.ctx.arc(core.x, core.y, core.radius + 15, -Math.PI / 2, (Math.PI * 2 * (health / 100)) - Math.PI / 2);
    this.ctx.stroke();

    this.ctx.restore();
  }

  drawEnemy(enemy) {
    this.ctx.save();
    this.ctx.globalAlpha = enemy.alpha;
    this.ctx.translate(enemy.x, enemy.y);

    // Draw shape
    this.ctx.fillStyle = enemy.typeDef.color;
    this.ctx.shadowBlur = 15;
    this.ctx.shadowColor = enemy.typeDef.glowColor;
    
    const size = enemy.size;
    this.drawShape(enemy.typeDef.shape, size);

    // Draw Word
    this.ctx.font = 'bold 18px "JetBrains Mono", monospace';
    this.ctx.textAlign = 'center';
    
    // Shadow for text readability
    this.ctx.shadowBlur = 5;
    this.ctx.shadowColor = 'black';

    const word = enemy.word;
    const typed = word.substring(0, enemy.typedIndex);
    const untyped = word.substring(enemy.typedIndex);

    const textY = -size - 10;
    const typedWidth = this.ctx.measureText(typed).width;
    const fullWidth = this.ctx.measureText(word).width;
    const startX = -fullWidth / 2;

    // Typed part
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText(typed, startX + typedWidth / 2, textY);
    
    // Untyped part
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    this.ctx.fillText(untyped, startX + typedWidth + this.ctx.measureText(untyped).width / 2, textY);

    // Targeted indicator
    if (enemy.isTargeted) {
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, size + 10, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  drawShape(shape, size) {
    this.ctx.beginPath();
    switch (shape) {
      case 'diamond':
        this.ctx.moveTo(0, -size);
        this.ctx.lineTo(size, 0);
        this.ctx.lineTo(0, size);
        this.ctx.lineTo(-size, 0);
        break;
      case 'triangle':
        this.ctx.moveTo(0, -size);
        this.ctx.lineTo(size, size);
        this.ctx.lineTo(-size, size);
        break;
      case 'hexagon':
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI * 2 / 6) * i;
          const x = Math.cos(angle) * size;
          const y = Math.sin(angle) * size;
          if (i === 0) this.ctx.moveTo(x, y);
          else this.ctx.lineTo(x, y);
        }
        break;
      case 'circle':
        this.ctx.arc(0, 0, size, 0, Math.PI * 2);
        break;
    }
    this.ctx.closePath();
    this.ctx.fill();
  }

  drawCanvasHUD(gameState) {
    // Heat warning
    if (gameState.overheating) {
      this.ctx.save();
      this.ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
      this.ctx.font = 'bold 40px "Orbitron", sans-serif';
      this.ctx.fillStyle = '#ff0000';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('SYSTEM OVERHEAT', this.canvas.width / 2, this.canvas.height / 2 - 100);
      this.ctx.restore();
    }
  }

  updateDOMHUD(gameState) {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('wpm').textContent = gameState.wpm;
    document.getElementById('combo').textContent = gameState.combo;
    document.getElementById('health-text').textContent = Math.ceil(gameState.health) + '%';
    
    const heatFill = document.getElementById('heat-fill');
    if (heatFill) {
      heatFill.style.height = gameState.heat + '%';
      if (gameState.overheating) heatFill.classList.add('overheating');
      else heatFill.classList.remove('overheating');
    }

    const typedDisplay = document.getElementById('typed-display');
    if (typedDisplay) {
      typedDisplay.textContent = gameState.typedChars || '_';
    }
  }
}
