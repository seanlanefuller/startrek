class SoundManager {
    constructor() {
        this.ctx = null;
        this.alertInterval = null;
        this.isRedAlert = false;
        // Initialize on first interaction
        window.addEventListener('click', () => this.init(), { once: true });
        window.addEventListener('keydown', () => this.init(), { once: true });
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // Generic oscillator helper
    playTone(freq, type, duration, vol = 0.1) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.frequency.value = freq;
        osc.type = type;

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    beep() {
        // High pitched UI beep
        this.playTone(440, 'sine', 0.1, 0.05);
    }

    phaser() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'sawtooth';
        // Phaser sweep effect
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 1.5);

        // Tremolo/Modulation
        const lfo = this.ctx.createOscillator();
        lfo.frequency.value = 20;
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 500;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start();

        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1.5);

        osc.start();
        osc.stop(this.ctx.currentTime + 1.5);
        lfo.stop(this.ctx.currentTime + 1.5);
    }

    torpedo() {
        if (!this.ctx) return;
        // White noise burst
        const bufferSize = this.ctx.sampleRate * 2; // 2 seconds
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, this.ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 1.0);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 1.0);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start();
    }

    warp() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(50, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 2.0);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 2.0);

        osc.start();
        osc.stop(this.ctx.currentTime + 2.0);
    }

    // Red Alert Siren logic
    toggleRedAlert(enabled) {
        if (!this.ctx) return;

        if (enabled) {
            // Start if not already running
            if (!this.isRedAlert) {
                this.isRedAlert = true;
                this.playAlertTone();
                this.alertInterval = setInterval(() => this.playAlertTone(), 1500);

                // Auto-stop after 3 seconds
                if (this.alertTimeout) clearTimeout(this.alertTimeout);
                this.alertTimeout = setTimeout(() => {
                    this.toggleRedAlert(false);
                }, 3000);
            }
        } else {
            // Stop logic
            if (this.isRedAlert) {
                this.isRedAlert = false;
                clearInterval(this.alertInterval);
                this.alertInterval = null;

                if (this.alertTimeout) {
                    clearTimeout(this.alertTimeout);
                    this.alertTimeout = null;
                }

                // Stop currently playing tone immediately
                if (this.currentAlertOsc) {
                    try {
                        this.currentAlertOsc.stop();
                        this.currentAlertOsc.disconnect();
                    } catch (e) { /* ignore */ }
                    this.currentAlertOsc = null;
                }
            }
        }
    }

    playAlertTone() {
        if (!this.ctx || !this.isRedAlert || this.ctx.state !== 'running') return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'square';
        osc.frequency.setValueAtTime(600, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(800, this.ctx.currentTime + 0.5);
        osc.frequency.linearRampToValueAtTime(600, this.ctx.currentTime + 1.0);

        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.1, this.ctx.currentTime + 1.0);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1.1);

        osc.start();
        osc.stop(this.ctx.currentTime + 1.1);

        this.currentAlertOsc = osc;
    }

    stopAll() {
        // Stop Red Alert Forcefully
        this.isRedAlert = false;

        if (this.alertInterval) {
            clearInterval(this.alertInterval);
            this.alertInterval = null;
        }

        if (this.alertTimeout) {
            clearTimeout(this.alertTimeout);
            this.alertTimeout = null;
        }

        if (this.currentAlertOsc) {
            try {
                this.currentAlertOsc.stop();
                this.currentAlertOsc.disconnect();
            } catch (e) { /* ignore */ }
            this.currentAlertOsc = null;
        }
    }
}
