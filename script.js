/**
 * Retro Platformer - Mario Clone
 * Powered by Phaser 3
 */


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
        // Load game sprites
        this.load.image('ground', 'assets/ground.svg');
        this.load.image('brick', 'assets/brick.svg');
        this.load.image('coin', 'assets/coin.svg');
        this.load.image('enemy', 'assets/enemy.svg');
        this.load.image('finish', 'assets/finish.svg');
        this.load.image('player', 'assets/player.svg');
        
        // Load sound effects
        this.load.audio('jump', 'assets/sounds/jump.mp3');
        this.load.audio('coin', 'assets/sounds/coin.mp3');
        this.load.audio('die', 'assets/sounds/die.mp3');
        this.load.audio('win', 'assets/sounds/win.mp3');

        // Backgrounds
        this.load.image('menu-background', 'assets/menu-background.svg');
        this.load.image('gameover-background', 'assets/gameover-background.svg');
        this.load.image('victory-background', 'assets/victory-background.svg');
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
        this.add.image(0, 0, 'menu-background').setOrigin(0).setDisplaySize(width, height);
        
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
            this.cameras.main.fadeOut(500);
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
            this.player.setVelocityY(-550);
            this.sound.play('jump');
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
        this.sound.play('coin');
    }

    hitEnemy(player, enemy) {
        if (player.body.velocity.y > 0 && player.y < enemy.y - 16) {
            // Stomp
            enemy.disableBody(true, true);
            player.setVelocityY(-300);
            gameState.score += 50;
            this.scoreText.setText(`SCORE: ${gameState.score}`);
            this.sound.play('jump');
        } else {
            this.die();
        }
    }

    die() {
        this.sound.play('die');
        gameState.lives--;
        if (gameState.lives > 0) {
            this.cameras.main.shake(200, 0.01);
            this.cameras.main.once('camerashakecomplete', () => this.scene.restart());
        } else {
            this.cameras.main.fadeOut(500);
            this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('GameOverScene'));
        }
    }

    reachFinish() {
        this.sound.play('win');
        if (gameState.currentLevel < 10) {
            gameState.currentLevel++;
            this.cameras.main.fade(500);
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
        
        // Update highscore
        if (gameState.score > gameState.highscore) {
            gameState.highscore = gameState.score;
            localStorage.setItem('retro_highscore', gameState.highscore);
        }

        this.add.image(0, 0, 'gameover-background').setOrigin(0).setDisplaySize(width, height);
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

        this.add.image(0, 0, 'victory-background').setOrigin(0).setDisplaySize(width, height);
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
