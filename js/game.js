// Super Mario Web - Main Game Engine, Game Loop & Input System

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;

        // Virtual internal NES resolution
        this.VIEW_WIDTH = 256;
        this.VIEW_HEIGHT = 224;

        // Game State
        this.state = 'MENU'; // 'MENU', 'PLAYING', 'LEVEL_CLEAR', 'GAME_OVER', 'VICTORY', 'PAUSED'
        this.currentWorld = 0;
        this.score = 0;
        this.coins = 0;
        this.lives = 3;
        this.timeLeft = 400;
        this.timerCountdown = 0;

        // High Score
        this.highScore = parseInt(localStorage.getItem('mario_highscore') || '0', 10);

        // Entities
        this.player = null;
        this.level = null;
        this.cameraX = 0;

        // Input state
        this.input = {
            left: false,
            right: false,
            down: false,
            jump: false,
            run: false
        };

        // Fireball cooldown
        this.fireTimer = 0;

        // Level clear timer
        this.levelClearTimer = 0;

        this.initCanvasSize();
        this.bindEvents();
        this.showScreen('menuScreen');

        // Start requestAnimationFrame loop
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    }

    initCanvasSize() {
        this.canvas.width = this.VIEW_WIDTH;
        this.canvas.height = this.VIEW_HEIGHT;
    }

    startNewGame() {
        this.currentWorld = 0;
        this.score = 0;
        this.coins = 0;
        this.lives = 3;
        this.loadLevel(0);
        this.state = 'PLAYING';
        this.hideAllScreens();
        window.audio.playBGM(this.level.bgmTheme);
    }

    restartLevel() {
        this.loadLevel(this.currentWorld);
        this.state = 'PLAYING';
        this.hideAllScreens();
        window.audio.playBGM(this.level.bgmTheme);
    }

    loadLevel(worldIndex) {
        this.currentWorld = worldIndex;
        const levelData = window.LevelManager.getLevel(worldIndex);
        this.level = new Level(levelData, this);
        this.player = new Player(this.level.startX, this.level.startY);
        this.cameraX = 0;
        this.timeLeft = this.level.timeLimit;
        this.timerCountdown = 0;
        this.levelClearTimer = 0;
        this.updateHUD();
    }

    nextLevel() {
        this.currentWorld++;
        if (this.currentWorld >= 4) {
            this.triggerVictory();
        } else {
            this.loadLevel(this.currentWorld);
            this.state = 'PLAYING';
            window.audio.playBGM(this.level.bgmTheme);
        }
    }

    addScore(points, x, y) {
        this.score += points;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('mario_highscore', this.highScore);
        }
        if (x !== undefined && y !== undefined) {
            this.level.floatingTexts.push(new FloatingText(points.toString(), x, y));
        }
        this.updateHUD();
    }

    addCoin() {
        this.coins++;
        if (this.coins >= 100) {
            this.coins = 0;
            this.lives++;
            window.audio.powerup();
        }
        this.updateHUD();
    }

    updateHUD() {
        const hudScore = document.getElementById('hudScore');
        const hudCoins = document.getElementById('hudCoins');
        const hudWorld = document.getElementById('hudWorld');
        const hudTime = document.getElementById('hudTime');
        const hudLives = document.getElementById('hudLives');

        if (hudScore) hudScore.innerText = this.score.toString().padStart(6, '0');
        if (hudCoins) hudCoins.innerText = 'x' + this.coins.toString().padStart(2, '0');
        if (hudWorld) hudWorld.innerText = this.level ? this.level.worldName : '1-1';
        if (hudTime) hudTime.innerText = Math.max(0, Math.floor(this.timeLeft)).toString().padStart(3, '0');
        if (hudLives) hudLives.innerText = 'x' + this.lives;

        const highScoreDisplay = document.getElementById('menuHighScore');
        if (highScoreDisplay) highScoreDisplay.innerText = this.highScore.toString().padStart(6, '0');
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen-overlay').forEach(el => el.classList.remove('active'));
        const target = document.getElementById(screenId);
        if (target) target.classList.add('active');
    }

    hideAllScreens() {
        document.querySelectorAll('.screen-overlay').forEach(el => el.classList.remove('active'));
    }

    togglePause() {
        if (this.state === 'PLAYING') {
            this.state = 'PAUSED';
            window.audio.stopBGM();
            this.showScreen('pauseScreen');
        } else if (this.state === 'PAUSED') {
            this.state = 'PLAYING';
            this.hideAllScreens();
            window.audio.playBGM(this.level.bgmTheme);
        }
    }

    triggerGameOver() {
        this.state = 'GAME_OVER';
        window.audio.gameOver();
        setTimeout(() => {
            this.showScreen('gameOverScreen');
            const finalScore = document.getElementById('gameOverScore');
            if (finalScore) finalScore.innerText = this.score.toString().padStart(6, '0');
        }, 1200);
    }

    triggerVictory() {
        this.state = 'VICTORY';
        window.audio.stageClear();
        setTimeout(() => {
            this.showScreen('victoryScreen');
            const victScore = document.getElementById('victoryScore');
            if (victScore) victScore.innerText = this.score.toString().padStart(6, '0');
        }, 1200);
    }

    shootFireball() {
        if (this.player.state !== 'fire' || this.player.isDead) return;
        // Max 2 active fireballs on screen
        const myFireballs = this.level.projectiles.filter(p => p instanceof Fireball);
        if (myFireballs.length >= 2) return;

        const fx = this.player.facing === 1 ? this.player.x + 14 : this.player.x - 4;
        const fy = this.player.y + 8;
        this.level.projectiles.push(new Fireball(fx, fy, this.player.facing));
        window.audio.fireball();
    }

    checkCollisions() {
        const player = this.player;
        if (player.isDead) return;

        const pBounds = player.getBounds();

        // 1. Mario vs Goal Flagpole
        if (this.level.flagX && !player.flagSliding && !player.castleWalking) {
            if (player.x >= this.level.flagX - 6 && player.x <= this.level.flagX + 16) {
                // Touched flag!
                player.flagSliding = true;
                player.vx = 0;
                player.x = this.level.flagX - 8;
                window.audio.stopBGM();
                window.audio.stageClear();
                const heightFraction = 1 - (player.y / (12 * 16));
                const bonus = Math.max(100, Math.floor(heightFraction * 5000 / 100) * 100);
                this.addScore(bonus, player.x, player.y);
                this.state = 'LEVEL_CLEAR';
                this.levelClearTimer = 180;
                return;
            }
        }

        // 2. Mario vs Bowser Axe Trigger
        if (this.level.axeX && this.state === 'PLAYING') {
            if (player.x >= this.level.axeX - 8) {
                // Hit Axe! Bridge collapses!
                this.level.collapseBridge();
                this.state = 'LEVEL_CLEAR';
                this.levelClearTimer = 220;
                const bowser = this.level.enemies.find(e => e instanceof Bowser);
                if (bowser) bowser.fallLava();
                this.addScore(5000, player.x, player.y);
                return;
            }
        }

        // 3. Mario vs Items
        for (let i = this.level.items.length - 1; i >= 0; i--) {
            const item = this.level.items[i];
            if (item.spawning) continue;

            if (player.collidesWith(item)) {
                if (item instanceof Mushroom) {
                    player.upgrade(item.type);
                    this.addScore(1000, item.x, item.y);
                    this.level.items.splice(i, 1);
                } else if (item instanceof FireFlower) {
                    player.upgrade('flower');
                    this.addScore(1000, item.x, item.y);
                    this.level.items.splice(i, 1);
                } else if (item instanceof Starman) {
                    player.upgrade('star');
                    this.addScore(1000, item.x, item.y);
                    this.level.items.splice(i, 1);
                }
            }
        }

        // 4. Mario vs Enemies
        for (let i = this.level.enemies.length - 1; i >= 0; i--) {
            const enemy = this.level.enemies[i];
            if (enemy.dead || enemy.isFlattened) continue;

            if (player.collidesWith(enemy)) {
                // Starman invincible kill
                if (player.starTimer > 0) {
                    enemy.dead = true;
                    this.addScore(200, enemy.x, enemy.y);
                    window.audio.kick();
                    continue;
                }

                // Stomping check (Mario is falling down onto top of enemy)
                const isFalling = player.vy > 0;
                const marioBottom = pBounds.bottom;
                const enemyTop = enemy.y + (enemy instanceof Koopa ? 4 : 4);

                if (isFalling && marioBottom <= enemyTop + 10) {
                    // Stomp!
                    player.vy = -4.8; // Bounce upward
                    if (enemy instanceof Goomba) {
                        enemy.stomp();
                        this.addScore(100, enemy.x, enemy.y);
                    } else if (enemy instanceof Koopa) {
                        enemy.stomp(player.x);
                        this.addScore(100, enemy.x, enemy.y);
                    } else if (enemy instanceof Bowser) {
                        player.takeDamage();
                    }
                } else {
                    // Touched side or bottom
                    if (enemy instanceof Koopa && enemy.isShell && !enemy.isMovingShell) {
                        // Kick stationary shell
                        enemy.kick(player.x < enemy.x ? 1 : -1);
                    } else {
                        // Take damage!
                        player.takeDamage();
                    }
                }
            }
        }

        // 5. Moving Koopa Shell vs Other Enemies
        for (const shell of this.level.enemies) {
            if (shell instanceof Koopa && shell.isMovingShell) {
                for (const target of this.level.enemies) {
                    if (target !== shell && !target.dead && shell.collidesWith(target)) {
                        target.dead = true;
                        this.addScore(200, target.x, target.y);
                        window.audio.kick();
                    }
                }
            }
        }

        // 6. Fireballs vs Enemies & Boss
        for (let fi = this.level.projectiles.length - 1; fi >= 0; fi--) {
            const p = this.level.projectiles[fi];
            if (p instanceof Fireball) {
                for (const enemy of this.level.enemies) {
                    if (!enemy.dead && p.collidesWith(enemy)) {
                        p.dead = true;
                        if (enemy instanceof Bowser) {
                            enemy.takeHit();
                            this.addScore(500, enemy.x, enemy.y);
                        } else {
                            enemy.dead = true;
                            this.addScore(200, enemy.x, enemy.y);
                            window.audio.kick();
                        }
                        break;
                    }
                }
            } else if (p instanceof BowserFire) {
                if (player.collidesWith(p)) {
                    player.takeDamage();
                    p.dead = true;
                }
            }
        }
    }

    update() {
        if (this.state === 'PAUSED' || this.state === 'MENU') return;

        // Level Clear Sequence Countdown
        if (this.state === 'LEVEL_CLEAR') {
            this.level.update();
            this.player.update(this.input, this.level);

            // Convert remaining time to score
            if (this.timeLeft > 0) {
                this.timeLeft -= 2;
                this.score += 100;
                this.updateHUD();
            }

            this.levelClearTimer--;
            if (this.levelClearTimer <= 0) {
                this.nextLevel();
            }
            return;
        }

        if (this.state === 'PLAYING') {
            // Level timer countdown
            this.timerCountdown++;
            if (this.timerCountdown >= 60) {
                this.timerCountdown = 0;
                this.timeLeft--;
                this.updateHUD();
                if (this.timeLeft <= 0) {
                    this.player.die();
                }
            }

            // Fireball input trigger
            if (this.input.run && this.player.state === 'fire') {
                if (this.fireTimer <= 0) {
                    this.shootFireball();
                    this.fireTimer = 18;
                }
            }
            if (this.fireTimer > 0) this.fireTimer--;

            // Update level & entities
            this.level.update();
            this.player.update(this.input, this.level);

            // Player death sequence handling
            if (this.player.isDead) {
                if (this.player.deathTimer <= 0) {
                    this.lives--;
                    this.updateHUD();
                    if (this.lives <= 0) {
                        this.triggerGameOver();
                    } else {
                        this.restartLevel();
                    }
                }
                return;
            }

            // Check collisions
            this.checkCollisions();

            // Smooth horizontal camera tracking
            const targetCamX = this.player.x - this.VIEW_WIDTH * 0.38;
            if (targetCamX > this.cameraX) {
                this.cameraX += (targetCamX - this.cameraX) * 0.12;
            }
            // Clamp camera to level edges
            const maxCamX = Math.max(0, this.level.width * 16 - this.VIEW_WIDTH);
            if (this.cameraX > maxCamX) this.cameraX = maxCamX;
            if (this.cameraX < 0) this.cameraX = 0;
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.VIEW_WIDTH, this.VIEW_HEIGHT);

        if (this.level && (this.state === 'PLAYING' || this.state === 'LEVEL_CLEAR' || this.state === 'PAUSED')) {
            this.level.draw(this.ctx, this.cameraX, this.VIEW_WIDTH, this.VIEW_HEIGHT);
            this.player.draw(this.ctx, this.cameraX);
        }
    }

    loop(timestamp) {
        this.update();
        this.render();
        requestAnimationFrame((t) => this.loop(t));
    }

    bindEvents() {
        // Keyboard controls
        window.addEventListener('keydown', (e) => {
            window.audio.resume();

            switch (e.code) {
                case 'ArrowLeft':
                case 'KeyA':
                    this.input.left = true;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.input.right = true;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.input.down = true;
                    break;
                case 'ArrowUp':
                case 'KeyW':
                case 'Space':
                case 'KeyZ':
                case 'KeyK':
                    this.input.jump = true;
                    break;
                case 'ShiftLeft':
                case 'ShiftRight':
                case 'KeyX':
                case 'KeyJ':
                    this.input.run = true;
                    break;
                case 'KeyP':
                case 'Escape':
                    this.togglePause();
                    break;
                case 'KeyM':
                    this.toggleMuteUI();
                    break;
                case 'KeyR':
                    if (this.state === 'PLAYING') this.restartLevel();
                    break;
            }
        });

        window.addEventListener('keyup', (e) => {
            switch (e.code) {
                case 'ArrowLeft':
                case 'KeyA':
                    this.input.left = false;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.input.right = false;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.input.down = false;
                    break;
                case 'ArrowUp':
                case 'KeyW':
                case 'Space':
                case 'KeyZ':
                case 'KeyK':
                    this.input.jump = false;
                    break;
                case 'ShiftLeft':
                case 'ShiftRight':
                case 'KeyX':
                case 'KeyJ':
                    this.input.run = false;
                    break;
            }
        });

        // Virtual Touch Controls setup
        this.setupTouchControl('btnLeft', 'left');
        this.setupTouchControl('btnRight', 'right');
        this.setupTouchControl('btnDown', 'down');
        this.setupTouchControl('btnJump', 'jump');
        this.setupTouchControl('btnRun', 'run');

        // UI Buttons
        const startBtn = document.getElementById('btnStart');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                window.audio.resume();
                this.startNewGame();
            });
        }

        const resumeBtn = document.getElementById('btnResume');
        if (resumeBtn) {
            resumeBtn.addEventListener('click', () => this.togglePause());
        }

        const restartBtn = document.getElementById('btnRestart');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => this.startNewGame());
        }

        const playAgainBtn = document.getElementById('btnPlayAgain');
        if (playAgainBtn) {
            playAgainBtn.addEventListener('click', () => this.startNewGame());
        }

        const pauseBtn = document.getElementById('btnPause');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => this.togglePause());
        }

        const muteBtn = document.getElementById('btnMute');
        if (muteBtn) {
            muteBtn.addEventListener('click', () => this.toggleMuteUI());
        }

        const fullscreenBtn = document.getElementById('btnFullscreen');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        }
    }

    setupTouchControl(elementId, inputKey) {
        const btn = document.getElementById(elementId);
        if (!btn) return;

        const activate = (e) => {
            e.preventDefault();
            window.audio.resume();
            this.input[inputKey] = true;
            btn.classList.add('active');
        };

        const deactivate = (e) => {
            e.preventDefault();
            this.input[inputKey] = false;
            btn.classList.remove('active');
        };

        btn.addEventListener('touchstart', activate, { passive: false });
        btn.addEventListener('touchend', deactivate, { passive: false });
        btn.addEventListener('touchcancel', deactivate, { passive: false });
        btn.addEventListener('mousedown', activate);
        btn.addEventListener('mouseup', deactivate);
        btn.addEventListener('mouseleave', deactivate);
    }

    toggleMuteUI() {
        const isMuted = window.audio.toggleMute();
        const btn = document.getElementById('btnMute');
        if (btn) {
            btn.innerText = isMuted ? '🔇' : '🔊';
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen().catch(() => {});
        }
    }
}

// Boot game when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});
