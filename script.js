/**
 * CYBER DASH // Synthwave Retro Platformer
 * Powered by Phaser 3 & Procedural WebAudio Synthesizer
 */

// --- Global State ---
let gameState = {
    score: 0,
    lives: 3,
    currentLevel: 1,
    highscore: parseInt(localStorage.getItem('cyber_highscore') || '0', 10)
};

// --- WebAudio Synthesizer (Crash-Free SFX) ---
class SoundFX {
    constructor() {
        this.ctx = null;
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playJump() {
        this.init();
        if (!this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(160, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(650, this.ctx.currentTime + 0.12);
            
            gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.12);
        } catch (e) { console.error(e); }
    }

    playCoin() {
        this.init();
        if (!this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(987.77, now); // B5
            osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6
            
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.22);
        } catch (e) { console.error(e); }
    }

    playStomp() {
        this.init();
        if (!this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(240, now);
            osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);
            
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.15);
        } catch (e) { console.error(e); }
    }

    playDie() {
        this.init();
        if (!this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(450, now);
            osc.frequency.linearRampToValueAtTime(70, now + 0.4);
            
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.4);
        } catch (e) { console.error(e); }
    }

    playWin() {
        this.init();
        if (!this.ctx) return;
        try {
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
            notes.forEach((freq, idx) => {
                const now = this.ctx.currentTime + idx * 0.1;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(freq, now);
                
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
                
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.18);
            });
        } catch (e) { console.error(e); }
    }
}

const sfx = new SoundFX();

// --- BootScene ---
class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });

        // 1. Player (Cyan Cyber Runner with glowing visor & core)
        graphics.fillStyle(0x00f3ff, 1);
        graphics.fillRoundedRect(0, 0, 32, 32, 6);
        graphics.fillStyle(0xffffff, 1);
        graphics.fillRect(18, 6, 10, 6); // Visor
        graphics.fillStyle(0xff00aa, 1);
        graphics.fillCircle(10, 18, 4); // Core
        graphics.generateTexture('player', 32, 32);
        graphics.clear();

        // 2. Ground Tile (Dark synth tile with glowing cyan top border)
        graphics.fillStyle(0x130b24, 1);
        graphics.fillRect(0, 0, 40, 40);
        graphics.fillStyle(0x00f3ff, 1);
        graphics.fillRect(0, 0, 40, 4); // Neon Cyan Edge
        graphics.fillStyle(0x28124d, 1);
        graphics.fillRect(2, 6, 36, 32);
        graphics.generateTexture('ground', 40, 40);
        graphics.clear();

        // 3. Tech Brick (Magenta glowing grid block)
        graphics.fillStyle(0x260021, 1);
        graphics.fillRect(0, 0, 40, 40);
        graphics.lineStyle(2, 0xff00aa, 1);
        graphics.strokeRect(2, 2, 36, 36);
        graphics.fillStyle(0xff00aa, 0.6);
        graphics.fillRect(10, 10, 20, 20);
        graphics.generateTexture('brick', 40, 40);
        graphics.clear();

        // 4. Data Coin (Golden glowing sphere with inner core)
        graphics.fillStyle(0xffb700, 1);
        graphics.fillCircle(10, 10, 10);
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(10, 10, 5);
        graphics.generateTexture('coin', 20, 20);
        graphics.clear();

        // 5. Cyber Enemy (Crimson Glitch Bug with yellow eyes)
        graphics.fillStyle(0xff0055, 1);
        graphics.fillRoundedRect(0, 0, 32, 32, 4);
        graphics.fillStyle(0xffff00, 1);
        graphics.fillRect(6, 6, 6, 6);
        graphics.fillRect(20, 6, 6, 6);
        graphics.fillStyle(0x000000, 1);
        graphics.fillRect(8, 8, 2, 2);
        graphics.fillRect(22, 8, 2, 2);
        graphics.generateTexture('enemy', 32, 32);
        graphics.clear();

        // 6. Finish Portal (Beacon with glowing cyan/pink light bar)
        graphics.fillStyle(0x00f3ff, 0.3);
        graphics.fillRect(0, 0, 40, 100);
        graphics.fillStyle(0xff00aa, 1);
        graphics.fillRect(0, 0, 40, 10);
        graphics.fillStyle(0x00f3ff, 1);
        graphics.fillRect(16, 10, 8, 90);
        graphics.generateTexture('finish', 40, 100);
        graphics.clear();

        // 7. Particle Spark Texture
        graphics.fillStyle(0x00f3ff, 1);
        graphics.fillCircle(4, 4, 4);
        graphics.generateTexture('spark', 8, 8);
        graphics.clear();

        // 8. Gold Particle Spark Texture
        graphics.fillStyle(0xffd700, 1);
        graphics.fillCircle(4, 4, 4);
        graphics.generateTexture('gold-spark', 8, 8);
        graphics.clear();
    }

    create() {
        this.scene.start('MenuScene');
    }
}

// --- MenuScene ---
class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        const { width, height } = this.scale;
        sfx.init();

        const touchContainer = document.getElementById('touch-controls');
        if (touchContainer) touchContainer.style.display = 'none';

        // Background Cyber Gradient
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x080010, 0x080010, 0x2a0845, 0x2a0845, 1);
        bg.fillRect(0, 0, width, height);

        // Synthwave Starfield / Grid decoration
        for (let i = 0; i < 60; i++) {
            let x = Phaser.Math.Between(0, width);
            let y = Phaser.Math.Between(0, height);
            let size = Phaser.Math.Between(1, 3);
            let alpha = Phaser.Math.FloatBetween(0.3, 0.9);
            this.add.circle(x, y, size, 0x00f3ff, alpha);
        }

        // Title text with Cyber Glow
        const titleSize = width < 480 ? '36px' : '64px';
        const title = this.add.text(width / 2, height / 3.5, 'CYBER DASH', {
            fontFamily: "'Orbitron', sans-serif",
            fontSize: titleSize,
            fontStyle: '900',
            fill: '#00f3ff',
            stroke: '#ff00aa',
            strokeThickness: width < 480 ? 4 : 8,
            shadow: { offsetX: 0, offsetY: 0, color: '#00f3ff', blur: 25, stroke: true, fill: true }
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 3.5 + (width < 480 ? 42 : 65), '// SYNTHWAVE PLATFORMER //', {
            fontFamily: "'Orbitron', sans-serif",
            fontSize: width < 480 ? '12px' : '18px',
            fill: '#ff00aa',
            letterSpacing: 2
        }).setOrigin(0.5);

        // Highscore
        this.add.text(width / 2, height / 2.1, `TOP SCORE: ${gameState.highscore}`, {
            fontFamily: "'Orbitron', sans-serif",
            fontSize: width < 480 ? '17px' : '22px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // Start Button
        const startBtn = this.add.text(width / 2, height / 1.5, '▶ ENTER GRID', {
            fontFamily: "'Orbitron', sans-serif",
            fontSize: width < 480 ? '22px' : '32px',
            fontStyle: '700',
            fill: '#000000',
            backgroundColor: '#00f3ff',
            padding: { x: width < 480 ? 20 : 30, y: width < 480 ? 10 : 15 }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

        // Pulsing Tween
        this.tweens.add({
            targets: startBtn,
            scale: 1.08,
            duration: 700,
            yoyo: true,
            repeat: -1
        });

        startBtn.on('pointerover', () => startBtn.setStyle({ fill: '#ffffff', backgroundColor: '#ff00aa' }));
        startBtn.on('pointerout', () => startBtn.setStyle({ fill: '#000000', backgroundColor: '#00f3ff' }));

        startBtn.on('pointerdown', () => {
            sfx.playJump();
            gameState.score = 0;
            gameState.lives = 3;
            gameState.currentLevel = 1;
            this.cameras.main.fadeOut(400);
            this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('PlayScene'));
        });
    }
}

// --- PlayScene ---
class PlayScene extends Phaser.Scene {
    constructor() {
        super('PlayScene');
    }

    init() {
        this.levelData = LEVELS[gameState.currentLevel - 1];
    }

    create() {
        const { width, height } = this.scale;

        // World & Camera Bounds
        this.physics.world.setBounds(0, 0, this.levelData.width, height + 150);
        this.cameras.main.setBounds(0, 0, this.levelData.width, height);

        // Background Cyber Sky
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x0a0014, 0x0a0014, 0x1d0536, 0x1d0536, 1);
        bg.fillRect(0, 0, this.levelData.width, height);
        bg.setScrollFactor(0);

        // Parallax Stars
        for (let i = 0; i < 80; i++) {
            let x = Phaser.Math.Between(0, this.levelData.width);
            let y = Phaser.Math.Between(0, height);
            let circle = this.add.circle(x, y, Phaser.Math.Between(1, 2), 0x00f3ff, Phaser.Math.FloatBetween(0.2, 0.7));
            circle.setScrollFactor(0.3);
        }

        // Groups
        this.platforms = this.physics.add.staticGroup();
        this.bricks = this.physics.add.staticGroup();
        this.coins = this.physics.add.group();
        this.enemies = this.physics.add.group();

        // Ground
        this.levelData.ground.forEach(g => {
            let x = g[0];
            let w = g[1];
            let count = Math.ceil(w / 40);
            for (let i = 0; i < count; i++) {
                this.platforms.create(x + i * 40 + 20, height - 20, 'ground');
            }
        });

        // Floating Platforms
        this.levelData.platforms.forEach(p => {
            let x = p[0];
            let y = p[1];
            let w = p[2];
            let count = Math.ceil(w / 40);
            for (let i = 0; i < count; i++) {
                this.platforms.create(x + i * 40 + 20, y, 'ground');
            }
        });

        // Bricks
        this.levelData.bricks.forEach(b => {
            this.bricks.create(b[0], b[1], 'brick');
        });

        // Coins
        this.levelData.coins.forEach(c => {
            const coin = this.coins.create(c[0], c[1], 'coin');
            coin.setBounceY(0.3);
            this.tweens.add({
                targets: coin,
                y: c[1] - 6,
                duration: 900,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });

        // Enemies
        this.levelData.enemies.forEach(e => {
            const enemy = this.enemies.create(e[0], e[1], 'enemy');
            enemy.setBounce(1, 0);
            enemy.setCollideWorldBounds(true);
            enemy.setVelocityX(-120);
        });

        // Finish Line
        this.finishLine = this.physics.add.staticSprite(this.levelData.finish, height - 90, 'finish');

        // Player
        this.player = this.physics.add.sprite(100, height - 100, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.setBounce(0.05);

        // Collisions
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.player, this.bricks);
        this.physics.add.collider(this.enemies, this.platforms);
        this.physics.add.collider(this.enemies, this.bricks);
        this.physics.add.collider(this.coins, this.platforms);
        this.physics.add.collider(this.coins, this.bricks);

        this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.hitEnemy, null, this);
        this.physics.add.overlap(this.player, this.finishLine, this.reachFinish, null, this);

        // Camera Follow
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        // Controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,A,S,D');

        // HUD & Mobile Controls
        this.createHUD();
        this.createTouchControls();
    }

    createHUD() {
        const width = this.scale.width;
        const isMobile = width < 500;
        const hudWidth = Math.min(width - 30, 420);
        const hudBox = this.add.graphics().setScrollFactor(0);
        hudBox.fillStyle(0x000000, 0.6);
        hudBox.fillRoundedRect(15, 12, hudWidth, 42, 8);
        hudBox.lineStyle(2, 0x00f3ff, 0.8);
        hudBox.strokeRoundedRect(15, 12, hudWidth, 42, 8);

        const fontSize = isMobile ? '12px' : '15px';
        const colWidth = hudWidth / 3;

        this.scoreText = this.add.text(15 + colWidth * 0.1, 23, `SCORE: ${gameState.score}`, {
            fontFamily: "'Orbitron', sans-serif",
            fontSize: fontSize,
            fontStyle: '700',
            fill: '#00f3ff'
        }).setScrollFactor(0);

        this.livesText = this.add.text(15 + colWidth * 1.1, 23, `LIVES: ${gameState.lives}`, {
            fontFamily: "'Orbitron', sans-serif",
            fontSize: fontSize,
            fontStyle: '700',
            fill: '#ff00aa'
        }).setScrollFactor(0);

        this.levelText = this.add.text(15 + colWidth * 2.1, 23, `LVL: ${gameState.currentLevel}/10`, {
            fontFamily: "'Orbitron', sans-serif",
            fontSize: fontSize,
            fontStyle: '700',
            fill: '#ffd700'
        }).setScrollFactor(0);
    }

    createTouchControls() {
        this.touchStates = { left: false, right: false, jump: false };

        const touchContainer = document.getElementById('touch-controls');
        if (touchContainer) {
            touchContainer.style.display = 'flex';
        }

        const btnLeft = document.getElementById('btn-left');
        const btnRight = document.getElementById('btn-right');
        const btnJump = document.getElementById('btn-jump');

        const setupBtn = (btn, stateKey, isJump = false) => {
            if (!btn) return;

            const handleDown = (e) => {
                if (e && e.cancelable) e.preventDefault();
                this.touchStates[stateKey] = true;
                btn.classList.add('active');
                if (isJump) this.handleJump();
            };

            const handleUp = (e) => {
                if (e && e.cancelable) e.preventDefault();
                this.touchStates[stateKey] = false;
                btn.classList.remove('active');
            };

            btn.onpointerdown = handleDown;
            btn.onpointerup = handleUp;
            btn.onpointercancel = handleUp;
            btn.onmouseleave = handleUp;
            btn.ontouchstart = handleDown;
            btn.ontouchend = handleUp;
            btn.ontouchcancel = handleUp;
        };

        setupBtn(btnLeft, 'left');
        setupBtn(btnRight, 'right');
        setupBtn(btnJump, 'jump', true);
    }

    handleJump() {
        const canJump = this.player.body.blocked.down || this.player.body.touching.down;
        if (canJump) {
            this.player.setVelocityY(-560);
            sfx.playJump();
            this.createJumpParticles(this.player.x, this.player.y + 16);
        }
    }

    createJumpParticles(x, y) {
        for (let i = 0; i < 8; i++) {
            let spark = this.add.image(x + Phaser.Math.Between(-10, 10), y, 'spark');
            this.tweens.add({
                targets: spark,
                y: y + Phaser.Math.Between(10, 25),
                x: spark.x + Phaser.Math.Between(-15, 15),
                alpha: 0,
                scale: 0.2,
                duration: 300,
                onComplete: () => spark.destroy()
            });
        }
    }

    update() {
        // Fall Death Check
        if (this.player.y > this.scale.height + 80) {
            this.die();
        }

        // Horizontal Movement
        if (this.cursors.left.isDown || this.wasd.A.isDown || this.touchStates.left) {
            this.player.setVelocityX(-220);
        } else if (this.cursors.right.isDown || this.wasd.D.isDown || this.touchStates.right) {
            this.player.setVelocityX(220);
        } else {
            this.player.setVelocityX(0);
        }

        // Jump Controls
        if (Phaser.Input.Keyboard.JustDown(this.cursors.up) || 
            Phaser.Input.Keyboard.JustDown(this.cursors.space) || 
            Phaser.Input.Keyboard.JustDown(this.wasd.W)) {
            this.handleJump();
        }

        // Enemy Patrol
        this.enemies.getChildren().forEach(enemy => {
            if (enemy.body.blocked.left) enemy.setVelocityX(120);
            if (enemy.body.blocked.right) enemy.setVelocityX(-120);
        });
    }

    collectCoin(player, coin) {
        // Gold burst particle effect
        for (let i = 0; i < 6; i++) {
            let p = this.add.image(coin.x, coin.y, 'gold-spark');
            this.tweens.add({
                targets: p,
                x: p.x + Phaser.Math.Between(-20, 20),
                y: p.y + Phaser.Math.Between(-20, 20),
                alpha: 0,
                scale: 0.1,
                duration: 400,
                onComplete: () => p.destroy()
            });
        }

        coin.disableBody(true, true);
        sfx.playCoin();
        gameState.score += 10;
        this.scoreText.setText(`SCORE: ${gameState.score}`);
    }

    hitEnemy(player, enemy) {
        if (player.body.velocity.y > 0 && player.y < enemy.y - 14) {
            // Stomp enemy
            enemy.disableBody(true, true);
            player.setVelocityY(-320);
            sfx.playStomp();
            gameState.score += 50;
            this.scoreText.setText(`SCORE: ${gameState.score}`);
        } else {
            this.die();
        }
    }

    die() {
        sfx.playDie();
        gameState.lives--;
        if (gameState.lives > 0) {
            this.cameras.main.shake(250, 0.015);
            this.cameras.main.once('camerashakecomplete', () => this.scene.restart());
        } else {
            this.cameras.main.fadeOut(500);
            this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('GameOverScene'));
        }
    }

    reachFinish() {
        sfx.playWin();
        if (gameState.currentLevel < 10) {
            gameState.currentLevel++;
            this.cameras.main.fadeOut(400);
            this.cameras.main.once('camerafadeoutcomplete', () => this.scene.restart());
        } else {
            this.cameras.main.fadeOut(500);
            this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('VictoryScene'));
        }
    }
}

// --- GameOverScene ---
class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    create() {
        const { width, height } = this.scale;
        
        const touchContainer = document.getElementById('touch-controls');
        if (touchContainer) touchContainer.style.display = 'none';

        if (gameState.score > gameState.highscore) {
            gameState.highscore = gameState.score;
            localStorage.setItem('cyber_highscore', gameState.highscore.toString());
        }

        const bg = this.add.graphics();
        bg.fillGradientStyle(0x1a0005, 0x1a0005, 0x05000a, 0x05000a, 1);
        bg.fillRect(0, 0, width, height);

        this.add.text(width / 2, height / 3, 'SYSTEM OVERLOAD', {
            fontFamily: "'Orbitron', sans-serif",
            fontSize: '48px',
            fontStyle: '900',
            fill: '#ff0055',
            shadow: { blur: 20, color: '#ff0055', fill: true }
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2.2, `FINAL SCORE: ${gameState.score}`, {
            fontFamily: "'Orbitron', sans-serif",
            fontSize: '24px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        const restartBtn = this.add.text(width / 2, height / 1.5, 'RETRY GRID', {
            fontFamily: "'Orbitron', sans-serif",
            fontSize: '28px',
            fontStyle: '700',
            fill: '#000000',
            backgroundColor: '#ff0055',
            padding: { x: 25, y: 12 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        restartBtn.on('pointerdown', () => {
            sfx.playJump();
            this.scene.start('MenuScene');
        });
    }
}

// --- VictoryScene ---
class VictoryScene extends Phaser.Scene {
    constructor() {
        super('VictoryScene');
    }

    create() {
        const { width, height } = this.scale;

        const touchContainer = document.getElementById('touch-controls');
        if (touchContainer) touchContainer.style.display = 'none';

        if (gameState.score > gameState.highscore) {
            gameState.highscore = gameState.score;
            localStorage.setItem('cyber_highscore', gameState.highscore.toString());
        }

        const bg = this.add.graphics();
        bg.fillGradientStyle(0x001a14, 0x001a14, 0x000a1a, 0x000a1a, 1);
        bg.fillRect(0, 0, width, height);

        this.add.text(width / 2, height / 3, 'SYSTEM CLEARED!', {
            fontFamily: "'Orbitron', sans-serif",
            fontSize: '52px',
            fontStyle: '900',
            fill: '#00f3ff',
            shadow: { blur: 25, color: '#00f3ff', fill: true }
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2.2, `ALL 10 SECTORS CONQUERED!`, {
            fontFamily: "'Orbitron', sans-serif",
            fontSize: '20px',
            fill: '#ff00aa'
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 1.8, `TOTAL SCORE: ${gameState.score}`, {
            fontFamily: "'Orbitron', sans-serif",
            fontSize: '24px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        const menuBtn = this.add.text(width / 2, height / 1.4, 'MAIN MENU', {
            fontFamily: "'Orbitron', sans-serif",
            fontSize: '28px',
            fontStyle: '700',
            fill: '#000000',
            backgroundColor: '#00f3ff',
            padding: { x: 25, y: 12 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        menuBtn.on('pointerdown', () => {
            sfx.playJump();
            this.scene.start('MenuScene');
        });
    }
}

// --- Game Configuration ---
const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 1000 },
            debug: false
        }
    },
    scene: [BootScene, MenuScene, PlayScene, GameOverScene, VictoryScene]
};

const game = new Phaser.Game(config);
