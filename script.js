/**
 * Retro Platformer - Mario Clone
 * Powered by Phaser 3
 */

// --- Level Configuration ---
const LEVELS = [
    { // Level 1
        width: 2400,
        ground: [[0, 2400]],
        platforms: [[400, 450, 150], [700, 350, 200], [1200, 450, 300]],
        bricks: [[500, 300], [540, 300], [580, 300], [1500, 350], [1540, 350]],
        coins: [[420, 420], [720, 320], [1250, 420], [540, 270], [1520, 320]],
        enemies: [[800, 500], [1600, 500]],
        finish: 2300
    },
    { // Level 2
        width: 2800,
        ground: [[0, 1000], [1200, 1600]], // Gap between 1000 and 1200
        platforms: [[1050, 400, 100]],
        bricks: [[300, 400], [340, 400], [1800, 300], [1840, 300], [1880, 300]],
        coins: [[320, 370], [1050, 350], [1840, 270]],
        enemies: [[600, 500], [2000, 500]],
        finish: 2700
    },
    { // Level 3
        width: 3200,
        ground: [[0, 800], [1000, 1800], [2000, 1200]],
        platforms: [[850, 450, 100], [1850, 400, 100]],
        bricks: [[400, 350], [1200, 300], [1240, 300], [2400, 350]],
        coins: [[400, 320], [1220, 270], [2400, 320]],
        enemies: [[500, 500], [1300, 500], [2200, 500]],
        finish: 3100
    },
    { // Level 4
        width: 3000,
        ground: [[0, 600], [800, 600], [1600, 600], [2400, 600]],
        platforms: [[650, 450, 100], [1450, 400, 100], [2250, 450, 100]],
        bricks: [[1000, 300], [1100, 300], [1200, 300]],
        coins: [[1100, 270], [1450, 350]],
        enemies: [[900, 500], [1700, 500], [2500, 500]],
        finish: 2900
    },
    { // Level 5
        width: 3500,
        ground: [[0, 3500]],
        platforms: [[200, 500, 100], [400, 400, 100], [600, 300, 100], [800, 200, 100]],
        bricks: [[1500, 400], [1540, 400], [1580, 400], [1620, 400]],
        coins: [[800, 150], [1560, 350]],
        enemies: [[1000, 500], [1100, 500], [1200, 500]],
        finish: 3400
    },
    { // Level 6 - Increased difficulty
        width: 4000,
        ground: [[0, 500], [800, 400], [1500, 400], [2200, 400], [3000, 1000]],
        platforms: [[600, 400, 150], [1300, 350, 150], [2000, 300, 150]],
        bricks: [[3200, 300], [3240, 300], [3280, 300], [3320, 300]],
        coins: [[3240, 250], [600, 350]],
        enemies: [[900, 500], [1600, 500], [2300, 500], [3100, 500], [3500, 500]],
        finish: 3900
    },
    { // Level 7
        width: 4000,
        ground: [[0, 4000]],
        platforms: [[500, 450, 100], [700, 350, 100], [900, 250, 100], [1100, 350, 100], [1300, 450, 100]],
        bricks: [[2000, 300], [2040, 300], [2080, 300], [2120, 300], [2160, 300], [2200, 300]],
        coins: [[900, 200], [2080, 250], [2120, 250]],
        enemies: [[1000, 500], [1500, 500], [2000, 500], [2500, 500], [3000, 500]],
        finish: 3900
    },
    { // Level 8
        width: 4500,
        ground: [[0, 400], [600, 400], [1200, 400], [1800, 400], [2400, 400], [3000, 1500]],
        platforms: [[500, 450, 50], [1100, 400, 50], [1700, 450, 50], [2300, 400, 50]],
        bricks: [[3500, 300], [3540, 300], [3600, 200], [3640, 200], [3700, 300]],
        coins: [[3620, 150]],
        enemies: [[800, 500], [1400, 500], [2000, 500], [3200, 500], [3400, 500], [3600, 500]],
        finish: 4400
    },
    { // Level 9
        width: 5000,
        ground: [[0, 5000]],
        platforms: [[1000, 450, 200], [1500, 350, 200], [2000, 250, 200], [2500, 350, 200], [3000, 450, 200]],
        bricks: [[500, 400], [540, 400], [4000, 400], [4040, 400], [4080, 400], [4120, 400]],
        coins: [[2000, 200], [4060, 350]],
        enemies: [[700, 500], [1200, 500], [1700, 500], [2200, 500], [2700, 500], [3200, 500], [3700, 500], [4200, 500]],
        finish: 4900
    },
    { // Level 10 - Final
        width: 6000,
        ground: [[0, 1000], [1500, 1000], [3000, 1000], [4500, 1500]],
        platforms: [[1200, 450, 100], [2700, 450, 100], [4200, 450, 100]],
        bricks: [[500, 300], [540, 300], [5000, 300], [5040, 300], [5080, 300]],
        coins: [[540, 250], [1250, 400], [2750, 400], [4250, 400], [5040, 250]],
        enemies: [[800, 500], [1800, 500], [2200, 500], [3200, 500], [3800, 500], [4800, 500], [5200, 500], [5500, 500]],
        finish: 5900
    }
];

// --- Global State ---
let gameState = {
    score: 0,
    lives: 3,
    currentLevel: 1,
    highscore: localStorage.getItem('retro_highscore') || 0
};

// --- BootScene ---
class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        // Create programmatic textures
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });

        // Player (Red Square with eyes)
        graphics.fillStyle(0xff0000);
        graphics.fillRect(0, 0, 32, 32);
        graphics.fillStyle(0xffffff);
        graphics.fillRect(20, 5, 8, 8); // Eye
        graphics.generateTexture('player', 32, 32);
        graphics.clear();

        // Ground/Platforms (Green)
        graphics.fillStyle(0x00aa00);
        graphics.fillRect(0, 0, 40, 40);
        graphics.generateTexture('ground', 40, 40);
        graphics.clear();

        // Bricks (Brown)
        graphics.fillStyle(0x8b4513);
        graphics.fillRect(2, 2, 36, 36);
        graphics.lineStyle(2, 0x000000);
        graphics.strokeRect(0, 0, 40, 40);
        graphics.generateTexture('brick', 40, 40);
        graphics.clear();

        // Coin (Yellow Circle)
        graphics.fillStyle(0xffff00);
        graphics.fillCircle(10, 10, 8);
        graphics.generateTexture('coin', 20, 20);
        graphics.clear();

        // Enemy (Purple Square)
        graphics.fillStyle(0x800080);
        graphics.fillRect(0, 0, 32, 32);
        graphics.fillStyle(0xffffff);
        graphics.fillRect(5, 5, 8, 8);
        graphics.fillRect(20, 5, 8, 8);
        graphics.generateTexture('enemy', 32, 32);
        graphics.clear();

        // Flag (White/Red)
        graphics.fillStyle(0xffffff);
        graphics.fillRect(0, 0, 10, 100);
        graphics.fillStyle(0xff0000);
        graphics.fillRect(10, 0, 40, 30);
        graphics.generateTexture('finish', 50, 100);
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

        // Background
        this.add.rectangle(0, 0, width, height, 0x87CEEB).setOrigin(0);
        
        // Title
        this.add.text(width / 2, height / 3, 'RETRO CLONE', {
            fontSize: '64px',
            fill: '#fff',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Highscore
        this.add.text(width / 2, height / 2.2, `HIGHSCORE: ${gameState.highscore}`, {
            fontSize: '24px',
            fill: '#fff'
        }).setOrigin(0.5);

        // Start Button
        const startBtn = this.add.text(width / 2, height / 1.5, 'START GAME', {
            fontSize: '48px',
            fill: '#0f0',
            backgroundColor: '#000',
            padding: { x: 20, y: 10 }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

        // Pulsing effect
        this.tweens.add({
            targets: startBtn,
            scale: 1.1,
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        startBtn.on('pointerdown', () => {
            gameState.score = 0;
            gameState.lives = 3;
            gameState.currentLevel = 1;
            this.scene.start('PlayScene');
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

        // World Bounds
        this.physics.world.setBounds(0, 0, this.levelData.width, height + 100);
        this.cameras.main.setBounds(0, 0, this.levelData.width, height);

        // Background
        this.add.rectangle(0, 0, this.levelData.width, height, 0x87CEEB).setOrigin(0).setScrollFactor(1);

        // Groups
        this.platforms = this.physics.add.staticGroup();
        this.bricks = this.physics.add.staticGroup();
        this.coins = this.physics.add.group();
        this.enemies = this.physics.add.group();

        // Create Level Geometry
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
            coin.setBounceY(0.4);
        });

        // Enemies
        this.levelData.enemies.forEach(e => {
            const enemy = this.enemies.create(e[0], e[1], 'enemy');
            enemy.setBounce(1, 0);
            enemy.setCollideWorldBounds(true);
            enemy.setVelocityX(-100);
        });

        // Finish Line
        this.finishLine = this.physics.add.staticSprite(this.levelData.finish, height - 120, 'finish');

        // Player
        this.player = this.physics.add.sprite(100, height - 100, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.setBounce(0.1);

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

        // Camera follow
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        // Controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,A,S,D');

        // UI HUD
        this.createHUD();
        this.createTouchControls();
    }

    createHUD() {
        const { height } = this.scale;
        this.scoreText = this.add.text(20, 20, `SCORE: ${gameState.score}`, { fontSize: '24px', fill: '#000' }).setScrollFactor(0);
        this.livesText = this.add.text(20, 50, `LIVES: ${gameState.lives}`, { fontSize: '24px', fill: '#000' }).setScrollFactor(0);
        this.levelText = this.add.text(20, 80, `LEVEL: ${gameState.currentLevel}`, { fontSize: '24px', fill: '#000' }).setScrollFactor(0);
    }

    createTouchControls() {
        const { width, height } = this.scale;
        const btnSize = 80;
        
        // Left
        this.leftBtn = this.add.rectangle(btnSize/2 + 20, height - btnSize/2 - 20, btnSize, btnSize, 0xffffff, 0.3)
            .setScrollFactor(0).setInteractive();
        this.add.text(btnSize/2 + 20, height - btnSize/2 - 20, '<', { fontSize: '40px' }).setOrigin(0.5).setScrollFactor(0);

        // Right
        this.rightBtn = this.add.rectangle(btnSize*1.5 + 40, height - btnSize/2 - 20, btnSize, btnSize, 0xffffff, 0.3)
            .setScrollFactor(0).setInteractive();
        this.add.text(btnSize*1.5 + 40, height - btnSize/2 - 20, '>', { fontSize: '40px' }).setOrigin(0.5).setScrollFactor(0);

        // Jump
        this.jumpBtn = this.add.rectangle(width - btnSize/2 - 20, height - btnSize/2 - 20, btnSize, btnSize, 0xffffff, 0.3)
            .setScrollFactor(0).setInteractive();
        this.add.text(width - btnSize/2 - 20, height - btnSize/2 - 20, '^', { fontSize: '40px' }).setOrigin(0.5).setScrollFactor(0);

        this.touchStates = { left: false, right: false, jump: false };

        this.leftBtn.on('pointerdown', () => this.touchStates.left = true);
        this.leftBtn.on('pointerup', () => this.touchStates.left = false);
        this.leftBtn.on('pointerout', () => this.touchStates.left = false);

        this.rightBtn.on('pointerdown', () => this.touchStates.right = true);
        this.rightBtn.on('pointerup', () => this.touchStates.right = false);
        this.rightBtn.on('pointerout', () => this.touchStates.right = false);

        this.jumpBtn.on('pointerdown', () => this.touchStates.jump = true);
        this.jumpBtn.on('pointerup', () => this.touchStates.jump = false);
        this.jumpBtn.on('pointerout', () => this.touchStates.jump = false);
    }

    update() {
        if (this.player.y > this.scale.height + 50) {
            this.die();
        }

        // Horizontal Movement
        if (this.cursors.left.isDown || this.wasd.A.isDown || this.touchStates.left) {
            this.player.setVelocityX(-200);
        } else if (this.cursors.right.isDown || this.wasd.D.isDown || this.touchStates.right) {
            this.player.setVelocityX(200);
        } else {
            this.player.setVelocityX(0);
        }

        // Jumping
        const canJump = this.player.body.blocked.down || this.player.body.touching.down;
        if ((this.cursors.up.isDown || this.cursors.space.isDown || this.wasd.W.isDown || this.touchStates.jump) && canJump) {
            this.player.setVelocityY(-450);
        }

        // Enemy patrol behavior
        this.enemies.getChildren().forEach(enemy => {
            if (enemy.body.blocked.left) enemy.setVelocityX(100);
            if (enemy.body.blocked.right) enemy.setVelocityX(-100);
        });
    }

    collectCoin(player, coin) {
        coin.disableBody(true, true);
        gameState.score += 10;
        this.scoreText.setText(`SCORE: ${gameState.score}`);
    }

    hitEnemy(player, enemy) {
        if (player.body.velocity.y > 0 && player.y < enemy.y - 16) {
            // Stomp
            enemy.disableBody(true, true);
            player.setVelocityY(-300);
            gameState.score += 50;
            this.scoreText.setText(`SCORE: ${gameState.score}`);
        } else {
            this.die();
        }
    }

    die() {
        gameState.lives--;
        if (gameState.lives > 0) {
            this.scene.restart();
        } else {
            this.scene.start('GameOverScene');
        }
    }

    reachFinish() {
        if (gameState.currentLevel < 10) {
            gameState.currentLevel++;
            this.scene.restart();
        } else {
            this.scene.start('VictoryScene');
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
        
        // Update highscore
        if (gameState.score > gameState.highscore) {
            gameState.highscore = gameState.score;
            localStorage.setItem('retro_highscore', gameState.highscore);
        }

        this.add.rectangle(0, 0, width, height, 0x000).setOrigin(0);
        this.add.text(width / 2, height / 2.5, 'GAME OVER', { fontSize: '64px', fill: '#f00' }).setOrigin(0.5);
        this.add.text(width / 2, height / 2, `FINAL SCORE: ${gameState.score}`, { fontSize: '24px', fill: '#fff' }).setOrigin(0.5);
        
        const restartBtn = this.add.text(width / 2, height / 1.5, 'BACK TO MENU', { fontSize: '32px', fill: '#fff' })
            .setOrigin(0.5).setInteractive();
        
        restartBtn.on('pointerdown', () => this.scene.start('MenuScene'));
    }
}

// --- VictoryScene ---
class VictoryScene extends Phaser.Scene {
    constructor() {
        super('VictoryScene');
    }

    create() {
        const { width, height } = this.scale;

        // Update highscore
        if (gameState.score > gameState.highscore) {
            gameState.highscore = gameState.score;
            localStorage.setItem('retro_highscore', gameState.highscore);
        }

        this.add.rectangle(0, 0, width, height, 0x00aa00).setOrigin(0);
        this.add.text(width / 2, height / 3, 'VICTORY!', { fontSize: '72px', fill: '#fff', stroke: '#000', strokeThickness: 5 }).setOrigin(0.5);
        this.add.text(width / 2, height / 2, `CONGRATULATIONS! YOU BEAT ALL 10 LEVELS!`, { fontSize: '24px', fill: '#fff' }).setOrigin(0.5);
        this.add.text(width / 2, height / 1.8, `FINAL SCORE: ${gameState.score}`, { fontSize: '24px', fill: '#fff' }).setOrigin(0.5);

        const menuBtn = this.add.text(width / 2, height / 1.4, 'PLAY AGAIN', { fontSize: '32px', fill: '#fff', backgroundColor: '#000', padding: 10 })
            .setOrigin(0.5).setInteractive();

        menuBtn.on('pointerdown', () => this.scene.start('MenuScene'));
    }
}

// --- Game Configuration ---
const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 800,
    height: 600,
    scale: {
        mode: Phaser.Scale.FIT,
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
