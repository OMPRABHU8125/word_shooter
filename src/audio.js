// ============================================================
// audio.js — High-Intensity Cyber Defense Audio Engine
// ============================================================

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isInitialized = false;

    // Persistent Nodes
    this.nodes = {
      hum: null,
      humGain: null,
      heartbeat: null,
      heartbeatGain: null,
      comboLayer: null,
      comboGain: null,
      noiseFilter: null,
      cracklyGain: null
    };

    this.lastProximityTick = 0;
  }

  /**
   * Initialize AudioContext on first user interaction.
   */
  init() {
    if (this.ctx) return;
    
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);
    
    this.isInitialized = true;
    console.log('Cyber Audio Core Online');
  }

  /**
   * Start or restart persistent audio layers.
   */
  startPersistentAudio() {
    this.init(); // Ensure context exists
    this.stopPersistentAudio(); // Clean up if any exist
    
    const now = this.ctx.currentTime;

    // 1. Background Hum (Threat Level)
    this.nodes.hum = this.ctx.createOscillator();
    this.nodes.hum.type = 'sawtooth';
    this.nodes.hum.frequency.setValueAtTime(60, now);
    this.nodes.humGain = this.ctx.createGain();
    this.nodes.humGain.gain.setValueAtTime(0, now);
    
    const humFilter = this.ctx.createBiquadFilter();
    humFilter.type = 'lowpass';
    humFilter.frequency.setValueAtTime(200, now);

    this.nodes.hum.connect(humFilter);
    humFilter.connect(this.nodes.humGain);
    this.nodes.humGain.connect(this.masterGain);
    this.nodes.hum.start();

    // 2. Heartbeat (Near-Death)
    this.nodes.heartbeat = this.ctx.createOscillator();
    this.nodes.heartbeat.type = 'sine';
    this.nodes.heartbeat.frequency.setValueAtTime(70, now);
    this.nodes.heartbeatGain = this.ctx.createGain();
    this.nodes.heartbeatGain.gain.setValueAtTime(0, now);
    this.nodes.heartbeat.connect(this.nodes.heartbeatGain);
    this.nodes.heartbeatGain.connect(this.masterGain);
    this.nodes.heartbeat.start();

    // 3. Combo Energy Layer
    this.nodes.comboLayer = this.ctx.createOscillator();
    this.nodes.comboLayer.type = 'triangle';
    this.nodes.comboLayer.frequency.setValueAtTime(440, now);
    this.nodes.comboGain = this.ctx.createGain();
    this.nodes.comboGain.gain.setValueAtTime(0, now);
    this.nodes.comboLayer.connect(this.nodes.comboGain);
    this.nodes.comboGain.connect(this.masterGain);
    this.nodes.comboLayer.start();

    // 4. Noise/Crackly Layer (Heat)
    const noiseBuffer = this.createNoiseBuffer();
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;
    
    this.nodes.noiseFilter = this.ctx.createBiquadFilter();
    this.nodes.noiseFilter.type = 'bandpass';
    this.nodes.noiseFilter.frequency.setValueAtTime(2000, now);
    this.nodes.noiseFilter.Q.setValueAtTime(5, now);
    
    this.nodes.cracklyGain = this.ctx.createGain();
    this.nodes.cracklyGain.gain.setValueAtTime(0, now);
    
    noiseSource.connect(this.nodes.noiseFilter);
    this.nodes.noiseFilter.connect(this.nodes.cracklyGain);
    this.nodes.cracklyGain.connect(this.masterGain);
    noiseSource.start();
    
    // Store noise source to stop it later
    this.nodes.noiseSource = noiseSource;
  }

  /**
   * Update dynamic audio based on game state.
   */
  updateDynamicAudio(gameState, typingState) {
    if (!this.isInitialized) return;
    const now = this.ctx.currentTime;

    // 1. Modulate Hum based on threat
    const enemyCount = gameState.enemies.length;
    let minCoreDist = 1000;
    gameState.enemies.forEach(e => {
      const dist = Math.sqrt((e.x - gameState.core.x)**2 + (e.y - gameState.core.y)**2);
      if (dist < minCoreDist) minCoreDist = dist;
    });

    const humIntensity = Math.min(1, enemyCount / 10);
    const proximityIntensity = Math.max(0, 1 - (minCoreDist / 400));
    
    this.nodes.humGain.gain.linearRampToValueAtTime(0.02 + (humIntensity * 0.05), now + 0.1);
    this.nodes.hum.frequency.linearRampToValueAtTime(60 + (proximityIntensity * 40), now + 0.1);

    // 2. Heartbeat (Health < 30)
    if (gameState.health < 30) {
      const beatRate = 0.8;
      const t = now % beatRate;
      const beatGain = t < 0.1 ? 0.4 : (t < 0.25 ? 0.1 : 0);
      this.nodes.heartbeatGain.gain.setTargetAtTime(beatGain, now, 0.05);
      
      // Audio Ducking
      this.masterGain.gain.setTargetAtTime(0.2, now, 0.1);
    } else {
      this.nodes.heartbeatGain.gain.setTargetAtTime(0, now, 0.1);
      this.masterGain.gain.setTargetAtTime(0.35, now, 0.1);
    }

    // 3. Proximity Ticking
    if (minCoreDist < 250) {
      const tickRate = Math.max(0.1, (minCoreDist / 250) * 0.5);
      if (now - this.lastProximityTick > tickRate) {
        this.playProximityTick(1 - (minCoreDist / 250));
        this.lastProximityTick = now;
      }
    }

    // 4. Combo Layer
    const comboLevel = Math.min(1, typingState.combo / 20);
    this.nodes.comboGain.gain.setTargetAtTime(comboLevel * 0.1, now, 0.2);
    this.nodes.comboLayer.frequency.setTargetAtTime(220 + (comboLevel * 440), now, 0.2);

    // 5. Heat / Crackle
    const heatLevel = Math.max(0, (typingState.heat - 50) / 50);
    this.nodes.cracklyGain.gain.setTargetAtTime(heatLevel * 0.1, now, 0.1);
  }

  /**
   * Sharp digital impulse for correct keys.
   */
  playKey() {
    if (!this.isInitialized) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1000 + Math.random() * 200, now);
    osc.detune.setValueAtTime(Math.random() * 50, now);

    filter.type = 'highpass';
    filter.frequency.setValueAtTime(800, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.002);
    gain.gain.linearRampToValueAtTime(0, now + 0.02);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.025);
  }

  /**
   * Glitch corruption for wrong key.
   */
  playError() {
    if (!this.isInitialized) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer();
    
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, now);
    osc.detune.setValueAtTime(100, now);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.exponentialRampToValueAtTime(2000, now + 0.1);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.4, now + 0.01);
    gain.gain.setValueAtTime(0.4, now + 0.05);
    gain.gain.linearRampToValueAtTime(0, now + 0.15);

    osc.connect(filter);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    noise.start(now);
    osc.stop(now + 0.15);
  }

  /**
   * Electric discharge for letter hit.
   */
  playHit() {
    if (!this.isInitialized) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(2000, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);

    osc.connect(gain);
    noise.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    noise.start(now);
    osc.stop(now + 0.06);
  }

  /**
   * Controlled system purge for destruction.
   */
  playDestroy(xRatio = 0.5) {
    if (!this.isInitialized) return;
    const now = this.ctx.currentTime;
    
    const oscH = this.ctx.createOscillator();
    oscH.type = 'sawtooth';
    oscH.frequency.setValueAtTime(2000, now);
    oscH.frequency.exponentialRampToValueAtTime(40, now + 0.3);
    
    const gainH = this.ctx.createGain();
    gainH.gain.setValueAtTime(0.15, now);
    gainH.gain.linearRampToValueAtTime(0, now + 0.3);

    const oscSub = this.ctx.createOscillator();
    oscSub.type = 'sine';
    oscSub.frequency.setValueAtTime(60, now);
    
    const gainSub = this.ctx.createGain();
    gainSub.gain.setValueAtTime(0.4, now);
    gainSub.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    const panner = this.ctx.createStereoPanner();
    panner.pan.setValueAtTime((xRatio - 0.5) * 2, now);

    oscH.connect(gainH);
    oscSub.connect(gainSub);
    gainH.connect(panner);
    gainSub.connect(panner);
    panner.connect(this.masterGain);

    oscH.start(now);
    oscSub.start(now);
    oscH.stop(now + 0.3);
    oscSub.stop(now + 0.3);
  }

  /**
   * Alarm warning for core damage.
   */
  playDamage() {
    if (!this.isInitialized) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(400, now);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
    gain.gain.setValueAtTime(0, now + 0.1);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.15);
    gain.gain.setValueAtTime(0, now + 0.2);
    
    // Pitch shift for tension
    osc.frequency.setValueAtTime(520, now + 0.1);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  playProximityTick(intensity) {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(100 + (intensity * 200), now);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.02);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.02);
  }

  playGameOver() {
    if (!this.isInitialized) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + 1.5);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.linearRampToValueAtTime(0, now + 1.5);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 1.5);
    
    this.stopPersistentAudio();
  }

  stopPersistentAudio() {
    Object.keys(this.nodes).forEach(key => {
      const node = this.nodes[key];
      if (node && typeof node.stop === 'function') {
        try { node.stop(); } catch(e) {}
      }
      this.nodes[key] = null;
    });
  }

  createNoiseBuffer() {
    const bufferSize = this.ctx.sampleRate * 0.2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }
}

export const audio = new AudioManager();
