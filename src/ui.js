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

// ── Electric Arc Effect ─────────────────────────────────────

class ElectricArc {
  constructor(from, to, color) {
    this.from = { x: from.x, y: from.y };
    this.to = { x: to.x, y: to.y };
    this.color = color;
    this.alpha = 1;
    this.decay = 0.15;
    this.points = this.generateArcPoints();
  }

  generateArcPoints() {
    const points = [];
    const segments = 8;
    const dx = this.to.x - this.from.x;
    const dy = this.to.y - this.from.y;
    
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = this.from.x + dx * t;
      const y = this.from.y + dy * t;
      
      if (i > 0 && i < segments) {
        const jitter = 15 * (1 - Math.abs(t - 0.5) * 2);
        points.push({
          x: x + (Math.random() - 0.5) * jitter,
          y: y + (Math.random() - 0.5) * jitter
        });
      } else {
        points.push({ x, y });
      }
    }
    return points;
  }

  update() {
    this.alpha -= this.decay;
  }

  draw(ctx) {
    if (this.alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 15;
    ctx.shadowColor = this.color;
    
    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }
    ctx.stroke();
    
    // Core glow at impact
    ctx.beginPath();
    ctx.arc(this.to.x, this.to.y, 8 * this.alpha, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    
    ctx.restore();
  }
}

// ── UI Manager ──────────────────────────────────────────────

export class UIManager {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.particles = [];
    this.lasers = []; // Now ElectricArcs
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.networkNodes = this.initNetworkNodes();
    this.glitchTimer = 0;
  }

  initNetworkNodes() {
    const nodes = [];
    for (let i = 0; i < 30; i++) {
      nodes.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 20,
        vy: (Math.random() - 0.5) * 20
      });
    }
    return nodes;
  }

  createExplosion(x, y, color) {
    for (let i = 0; i < 30; i++) {
      this.particles.push(new Particle(x, y, color));
    }
  }

  createLaser(from, to, color) {
    this.lasers.push(new ElectricArc(from, to, color));
  }

  screenShake(intensity, duration) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
  }

  triggerGlitch(duration = 200) {
    this.glitchTimer = duration;
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update();
      if (this.particles[i].alpha <= 0) this.particles.splice(i, 1);
    }

    for (let i = this.lasers.length - 1; i >= 0; i--) {
      this.lasers[i].update();
      if (this.lasers[i].alpha <= 0) this.lasers.splice(i, 1);
    }

    if (this.shakeDuration > 0) this.shakeDuration -= dt * 1000;
    if (this.glitchTimer > 0) this.glitchTimer -= dt * 1000;

    this.networkNodes.forEach(node => {
      node.x += node.vx * dt;
      node.y += node.vy * dt;
      if (node.x < 0 || node.x > this.canvas.width) node.vx *= -1;
      if (node.y < 0 || node.y > this.canvas.height) node.vy *= -1;
    });
  }

  render(gameState, core) {
    this.ctx.fillStyle = '#050a10';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.shakeDuration > 0) {
      this.ctx.save();
      this.ctx.translate((Math.random() - 0.5) * this.shakeIntensity, (Math.random() - 0.5) * this.shakeIntensity);
    }

    this.drawNetworkMap();
    this.drawThreatZones(core);
    this.drawCore(core, gameState.health);

    gameState.enemies.forEach(enemy => this.drawEnemy(enemy));
    this.lasers.forEach(laser => laser.draw(this.ctx));
    this.particles.forEach(p => p.draw(this.ctx));

    if (this.glitchTimer > 0) this.drawGlitchEffect();

    this.drawCanvasHUD(gameState);

    if (this.shakeDuration > 0) this.ctx.restore();
  }

  drawNetworkMap() {
    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(0, 245, 255, 0.05)';
    this.ctx.lineWidth = 1;
    for (let i = 0; i < this.networkNodes.length; i++) {
      for (let j = i + 1; j < this.networkNodes.length; j++) {
        const d2 = Math.pow(this.networkNodes[i].x - this.networkNodes[j].x, 2) + Math.pow(this.networkNodes[i].y - this.networkNodes[j].y, 2);
        if (d2 < 50000) {
          this.ctx.beginPath();
          this.ctx.moveTo(this.networkNodes[i].x, this.networkNodes[i].y);
          this.ctx.lineTo(this.networkNodes[j].x, this.networkNodes[j].y);
          this.ctx.stroke();
        }
      }
    }
    this.ctx.restore();
  }

  drawThreatZones(core) {
    this.ctx.save();
    this.ctx.setLineDash([5, 15]);
    this.ctx.strokeStyle = 'rgba(0, 245, 255, 0.1)';
    [300, 500, 700].forEach(r => {
      this.ctx.beginPath();
      this.ctx.arc(core.x, core.y, r, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.font = '10px Orbitron';
      this.ctx.fillStyle = 'rgba(0, 245, 255, 0.3)';
      this.ctx.fillText(`ZONE_${r / 100}`, core.x + r + 5, core.y);
    });
    this.ctx.restore();
  }

  drawCore(core, health) {
    const time = Date.now() * 0.001;
    this.ctx.save();
    this.ctx.translate(core.x, core.y);

    const pulse = 1 + Math.sin(time * 5) * 0.1;
    const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, core.radius * pulse);
    gradient.addColorStop(0, health > 30 ? '#00f5ff' : '#ff0055');
    gradient.addColorStop(1, 'transparent');
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, core.radius * pulse, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.lineWidth = 2;
    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = health > 30 ? '#00f5ff' : '#ff0055';
    
    const rings = [
      { r: core.radius + 10, s: 1.5, d: [30, 60] },
      { r: core.radius + 20, s: -1, d: [100, 20] },
      { r: core.radius + 30, s: 0.5, d: [200, 40] }
    ];

    rings.forEach(ring => {
      this.ctx.save();
      this.ctx.rotate(time * ring.s);
      this.ctx.setLineDash(ring.d);
      this.ctx.strokeStyle = health > 30 ? 'rgba(0, 245, 255, 0.6)' : 'rgba(255, 0, 85, 0.6)';
      this.ctx.beginPath();
      this.ctx.arc(0, 0, ring.r, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.restore();
    });
    this.ctx.restore();
  }

  drawEnemy(enemy) {
    this.ctx.save();
    this.ctx.globalAlpha = enemy.alpha;
    this.ctx.translate(enemy.x + (enemy.glitchOffset ? enemy.glitchOffset.x : 0), enemy.y + (enemy.glitchOffset ? enemy.glitchOffset.y : 0));

    this.ctx.fillStyle = enemy.typeDef.color;
    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = enemy.typeDef.glowColor;
    
    this.ctx.rotate(Date.now() * 0.002);
    this.drawShape(enemy.typeDef.shape, enemy.size * 0.8);
    
    this.ctx.rotate(-(Date.now() * 0.002));
    this.ctx.font = 'bold 16px "JetBrains Mono", monospace';
    this.ctx.textAlign = 'center';

    const word = enemy.word;
    const typed = word.substring(0, enemy.typedIndex);
    const untyped = word.substring(enemy.typedIndex);

    const fullWidth = this.ctx.measureText(word).width + 10;
    this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.ctx.fillRect(-fullWidth / 2, -enemy.size - 25, fullWidth, 20);

    this.ctx.fillStyle = '#fff';
    this.ctx.fillText(typed, -fullWidth / 2 + this.ctx.measureText(typed).width / 2 + 5, -enemy.size - 10);
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.fillText(untyped, -fullWidth / 2 + this.ctx.measureText(typed).width + this.ctx.measureText(untyped).width / 2 + 5, -enemy.size - 10);

    if (enemy.isTargeted) {
      this.ctx.strokeStyle = '#fff';
      this.ctx.setLineDash([2, 2]);
      this.ctx.strokeRect(-fullWidth / 2 - 5, -enemy.size - 30, fullWidth + 10, 30);
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
      case 'square':
        this.ctx.rect(-size/2, -size/2, size, size);
        break;
    }
    this.ctx.closePath();
    this.ctx.fill();
  }

  drawGlitchEffect() {
    const sliceCount = 10;
    for (let i = 0; i < sliceCount; i++) {
      const x = Math.random() * this.canvas.width;
      const y = Math.random() * this.canvas.height;
      const w = Math.random() * 200 + 50;
      const h = Math.random() * 15 + 2;
      this.ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255, 0, 85, 0.2)' : 'rgba(0, 245, 255, 0.2)';
      this.ctx.fillRect(x, y, w, h);
    }
  }

  drawCanvasHUD(gameState) {
    if (gameState.health < 30) {
      this.ctx.save();
      this.ctx.fillStyle = 'rgba(255, 0, 0, 0.05)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.font = '12px Orbitron';
      this.ctx.fillStyle = '#ff0055';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('CRITICAL INTEGRITY FAILURE IMMINENT', this.canvas.width / 2, 80);
      this.ctx.restore();
    }
    if (gameState.overheating) {
      this.ctx.save();
      this.ctx.font = 'bold 30px Orbitron';
      this.ctx.fillStyle = '#ff0000';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('SYSTEM OVERHEAT - INPUT LOCKED', this.canvas.width / 2, this.canvas.height / 2 - 100);
      this.ctx.restore();
    }
  }

  updateDOMHUD(gameState) {
    document.getElementById('score').textContent = gameState.score.toString().padStart(6, '0');
    document.getElementById('wpm').textContent = gameState.wpm;
    document.getElementById('combo').textContent = 'x' + gameState.combo;
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
