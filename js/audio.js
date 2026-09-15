// Super Mario Web - Web Audio API Synthesizer
// Provides 100% offline, zero-asset, authentic 8-bit sound effects and chiptune music.

class SoundManager {
    constructor() {
        this.ctx = null;
        this.isMuted = localStorage.getItem('mario_muted') === 'true';
        this.bgmPlaying = false;
        this.bgmTrack = null;
        this.currentBgmType = null;
        this.noteTimer = null;
        this.initContext();
    }

    initContext() {
        if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();
        }
    }

    resume() {
        this.initContext();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        localStorage.setItem('mario_muted', this.isMuted);
        if (this.isMuted) {
            this.stopBGM();
        } else if (this.currentBgmType) {
            this.playBGM(this.currentBgmType);
        }
        return this.isMuted;
    }

    // Helper: Play a tone with envelope
    playTone(freq, type = 'square', duration = 0.1, startGain = 0.25, endGain = 0.001, detune = 0) {
        if (this.isMuted || !this.ctx) return;
        this.resume();

        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            if (detune) osc.detune.setValueAtTime(detune, this.ctx.currentTime);

            gain.gain.setValueAtTime(startGain, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(Math.max(endGain, 0.0001), this.ctx.currentTime + duration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {
            console.warn('Audio error:', e);
        }
    }

    // Sound FX
    jump(isBig = false) {
        if (this.isMuted || !this.ctx) return;
        this.resume();
        const startFreq = isBig ? 150 : 220;
        const endFreq = isBig ? 450 : 600;
        const duration = isBig ? 0.22 : 0.18;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + duration);

        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    coin() {
        if (this.isMuted || !this.ctx) return;
        this.resume();
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(987.77, t); // B5
        osc.frequency.setValueAtTime(1318.51, t + 0.08); // E6

        gain.gain.setValueAtTime(0.25, t);
        gain.gain.setValueAtTime(0.25, t + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.35);
    }

    stomp() {
        if (this.isMuted || !this.ctx) return;
        this.resume();
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);

        gain.gain.setValueAtTime(0.3, t);
        gain.gain.linearRampToValueAtTime(0.01, t + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.12);
    }

    powerupSpawn() {
        if (this.isMuted || !this.ctx) return;
        this.resume();
        const notes = [330, 392, 659, 523, 587, 784];
        const step = 0.05;
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this.playTone(freq, 'triangle', 0.07, 0.2);
            }, i * step * 1000);
        });
    }

    powerup() {
        if (this.isMuted || !this.ctx) return;
        this.resume();
        const notes = [330, 392, 659, 523, 587, 784, 880, 1046];
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this.playTone(freq, 'square', 0.08, 0.25);
            }, i * 45);
        });
    }

    fireball() {
        if (this.isMuted || !this.ctx) return;
        this.resume();
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(900, t);
        osc.frequency.exponentialRampToValueAtTime(200, t + 0.1);

        gain.gain.setValueAtTime(0.25, t);
        gain.gain.linearRampToValueAtTime(0.01, t + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.1);
    }

    kick() {
        if (this.isMuted || !this.ctx) return;
        this.resume();
        this.playTone(160, 'sawtooth', 0.1, 0.3, 0.01);
    }

    brick() {
        if (this.isMuted || !this.ctx) return;
        this.resume();
        // Noise like sound for brick shatter
        try {
            const bufferSize = this.ctx.sampleRate * 0.15;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
            }
            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 800;

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);
            noise.start();
        } catch (e) {
            this.playTone(120, 'triangle', 0.15, 0.3);
        }
    }

    bump() {
        if (this.isMuted || !this.ctx) return;
        this.resume();
        this.playTone(120, 'triangle', 0.08, 0.3, 0.01);
    }

    pipe() {
        if (this.isMuted || !this.ctx) return;
        this.resume();
        const freqs = [180, 140, 100];
        freqs.forEach((f, i) => {
            setTimeout(() => this.playTone(f, 'triangle', 0.09, 0.25), i * 70);
        });
    }

    shrink() {
        if (this.isMuted || !this.ctx) return;
        this.resume();
        const freqs = [600, 520, 440, 370, 300, 240];
        freqs.forEach((f, i) => {
            setTimeout(() => this.playTone(f, 'square', 0.06, 0.2), i * 50);
        });
    }

    die() {
        if (this.isMuted || !this.ctx) return;
        this.stopBGM();
        this.resume();
        const notes = [
            { f: 500, d: 0.15 }, { f: 450, d: 0.15 }, { f: 400, d: 0.15 },
            { f: 350, d: 0.25 }, { f: 300, d: 0.2 }, { f: 250, d: 0.2 },
            { f: 200, d: 0.35 }
        ];
        let delay = 0;
        notes.forEach(n => {
            setTimeout(() => this.playTone(n.f, 'triangle', n.d, 0.3), delay);
            delay += n.d * 1000 * 0.9;
        });
    }

    stageClear() {
        if (this.isMuted || !this.ctx) return;
        this.stopBGM();
        this.resume();
        const notes = [
            392, 523, 659, 784, 1046, 1318, 1568, 1318,
            415, 523, 659, 830, 1046, 1318, 1661, 1318,
            466, 587, 698, 932, 1174, 1396, 1864, 1864, 1864, 2093
        ];
        notes.forEach((f, i) => {
            setTimeout(() => this.playTone(f, 'square', 0.1, 0.25), i * 75);
        });
    }

    gameOver() {
        if (this.isMuted || !this.ctx) return;
        this.stopBGM();
        this.resume();
        const notes = [
            { f: 523, d: 0.2 }, { f: 392, d: 0.2 }, { f: 330, d: 0.2 },
            { f: 440, d: 0.25 }, { f: 494, d: 0.25 }, { f: 440, d: 0.2 },
            { f: 415, d: 0.25 }, { f: 466, d: 0.25 }, { f: 415, d: 0.2 },
            { f: 392, d: 0.4 }, { f: 330, d: 0.4 }, { f: 261, d: 0.6 }
        ];
        let delay = 0;
        notes.forEach(n => {
            setTimeout(() => this.playTone(n.f, 'triangle', n.d, 0.25), delay);
            delay += n.d * 1000 * 0.9;
        });
    }

    bossHurt() {
        if (this.isMuted || !this.ctx) return;
        this.playTone(90, 'sawtooth', 0.2, 0.35);
    }

    bossFall() {
        if (this.isMuted || !this.ctx) return;
        const notes = [200, 180, 160, 140, 120, 100, 80, 60];
        notes.forEach((f, i) => {
            setTimeout(() => this.playTone(f, 'sawtooth', 0.15, 0.35), i * 80);
        });
    }

    // ================= MUSIC SYNTHESIZER ================= //
    playBGM(type = 'overworld') {
        this.currentBgmType = type;
        if (this.isMuted) return;
        this.stopBGM();
        this.resume();

        const melodies = {
            overworld: {
                tempo: 160,
                notes: [
                    // Intro
                    { f: 659.25, d: 0.5 }, { f: 659.25, d: 0.5 }, { f: 0, d: 0.5 }, { f: 659.25, d: 0.5 },
                    { f: 0, d: 0.5 }, { f: 523.25, d: 0.5 }, { f: 659.25, d: 1.0 }, { f: 783.99, d: 1.0 },
                    { f: 0, d: 1.0 }, { f: 392.00, d: 1.0 }, { f: 0, d: 1.0 },

                    // Section A
                    { f: 523.25, d: 0.75 }, { f: 0, d: 0.5 }, { f: 392.00, d: 0.75 }, { f: 0, d: 0.5 },
                    { f: 329.63, d: 0.75 }, { f: 0, d: 0.5 }, { f: 440.00, d: 0.6 }, { f: 493.88, d: 0.6 },
                    { f: 466.16, d: 0.5 }, { f: 440.00, d: 0.75 }, { f: 392.00, d: 0.5 }, { f: 659.25, d: 0.5 },
                    { f: 783.99, d: 0.5 }, { f: 880.00, d: 0.75 }, { f: 698.46, d: 0.5 }, { f: 783.99, d: 0.5 },
                    { f: 0, d: 0.25 }, { f: 659.25, d: 0.75 }, { f: 523.25, d: 0.5 }, { f: 587.33, d: 0.5 },
                    { f: 493.88, d: 0.75 }, { f: 0, d: 0.5 },

                    // Section B
                    { f: 523.25, d: 0.75 }, { f: 0, d: 0.5 }, { f: 392.00, d: 0.75 }, { f: 0, d: 0.5 },
                    { f: 329.63, d: 0.75 }, { f: 0, d: 0.5 }, { f: 440.00, d: 0.6 }, { f: 493.88, d: 0.6 },
                    { f: 466.16, d: 0.5 }, { f: 440.00, d: 0.75 }, { f: 392.00, d: 0.5 }, { f: 659.25, d: 0.5 },
                    { f: 783.99, d: 0.5 }, { f: 880.00, d: 0.75 }, { f: 698.46, d: 0.5 }, { f: 783.99, d: 0.5 },
                    { f: 0, d: 0.25 }, { f: 659.25, d: 0.75 }, { f: 523.25, d: 0.5 }, { f: 587.33, d: 0.5 },
                    { f: 493.88, d: 0.75 }, { f: 0, d: 0.75 }
                ]
            },
            underground: {
                tempo: 135,
                notes: [
                    { f: 261.63, d: 0.35 }, { f: 523.25, d: 0.35 }, { f: 220.00, d: 0.35 }, { f: 440.00, d: 0.35 },
                    { f: 233.08, d: 0.35 }, { f: 466.16, d: 0.35 }, { f: 0, d: 0.5 },
                    { f: 261.63, d: 0.35 }, { f: 523.25, d: 0.35 }, { f: 220.00, d: 0.35 }, { f: 440.00, d: 0.35 },
                    { f: 233.08, d: 0.35 }, { f: 466.16, d: 0.35 }, { f: 0, d: 0.5 },
                    { f: 196.00, d: 0.35 }, { f: 392.00, d: 0.35 }, { f: 174.61, d: 0.35 }, { f: 349.23, d: 0.35 },
                    { f: 185.00, d: 0.35 }, { f: 369.99, d: 0.35 }, { f: 0, d: 0.5 }
                ]
            },
            castle: {
                tempo: 140,
                notes: [
                    { f: 196.00, d: 0.3 }, { f: 207.65, d: 0.3 }, { f: 196.00, d: 0.3 }, { f: 185.00, d: 0.3 },
                    { f: 196.00, d: 0.4 }, { f: 0, d: 0.2 },
                    { f: 164.81, d: 0.3 }, { f: 174.61, d: 0.3 }, { f: 164.81, d: 0.3 }, { f: 155.56, d: 0.3 },
                    { f: 164.81, d: 0.4 }, { f: 0, d: 0.2 },
                    { f: 220.00, d: 0.3 }, { f: 207.65, d: 0.3 }, { f: 196.00, d: 0.3 }, { f: 185.00, d: 0.3 },
                    { f: 196.00, d: 0.5 }, { f: 0, d: 0.3 }
                ]
            },
            starman: {
                tempo: 220,
                notes: [
                    { f: 659.25, d: 0.25 }, { f: 659.25, d: 0.25 }, { f: 0, d: 0.15 }, { f: 659.25, d: 0.25 },
                    { f: 587.33, d: 0.25 }, { f: 659.25, d: 0.25 }, { f: 698.46, d: 0.4 }, { f: 659.25, d: 0.25 },
                    { f: 587.33, d: 0.25 }, { f: 523.25, d: 0.4 }, { f: 587.33, d: 0.25 }, { f: 493.88, d: 0.4 }
                ]
            }
        };

        const track = melodies[type] || melodies.overworld;
        let noteIndex = 0;
        this.bgmPlaying = true;

        const playNextNote = () => {
            if (!this.bgmPlaying || this.isMuted) return;

            const n = track.notes[noteIndex];
            const beatMs = (60 / track.tempo) * 1000;
            const durMs = n.d * beatMs;

            if (n.f > 0) {
                this.playTone(n.f, type === 'castle' ? 'sawtooth' : 'square', durMs / 1000 * 0.85, 0.12, 0.01);
                // Subtle bass harmony
                if (type === 'overworld' && noteIndex % 2 === 0) {
                    this.playTone(n.f / 2, 'triangle', durMs / 1000 * 0.8, 0.08, 0.01);
                }
            }

            noteIndex = (noteIndex + 1) % track.notes.length;
            this.noteTimer = setTimeout(playNextNote, durMs);
        };

        playNextNote();
    }

    stopBGM() {
        this.bgmPlaying = false;
        if (this.noteTimer) {
            clearTimeout(this.noteTimer);
            this.noteTimer = null;
        }
    }
}

// Global audio singleton
window.audio = new SoundManager();
