// Super Mario 3D - Main Game Engine, Physics, Camera & Touch Controls
// Optimized for mobile smartphones and desktop browsers with 60 FPS performance.

class Game3D {
    constructor() {
        this.container = document.getElementById('viewport');
        this.state = 'MENU'; // 'MENU', 'PLAYING', 'LEVEL_CLEAR', 'GAME_OVER', 'VICTORY', 'PAUSED'
        this.currentWorld = 0;
        this.score = 0;
        this.coins = 0;
        this.lives = 3;
        this.timeLeft = 400;
        this.highScore = parseInt(localStorage.getItem('mario_highscore') || '0', 10);

        // Physics Constants
        this.GRAVITY = 32.0;
        this.MOVE_SPEED = 7.0;
        this.RUN_SPEED = 12.0;
        this.JUMP_FORCE = 13.5;
        this.GROUND_POUND_SPEED = -28.0;

        // Player physics state
        this.playerPos = new THREE.Vector3(0, 2, 0);
        this.playerVel = new THREE.Vector3(0, 0, 0);
        this.isGrounded = false;
        this.jumpHeld = false;
        this.jumpTimer = 0;
        this.isGroundPounding = false;
        this.groundPoundPause = 0;
        this.playerRotation = 0;
        this.standingPlatform = null;

        // Camera control
        this.camDistance = 14.0;
        this.camYaw = 0;
        this.camPitch = 0.42; // ~24 degrees elevation
        this.camTarget = new THREE.Vector3();

        // Input state
        this.input = {
            forward: 0,
            turn: 0,
            jump: false,
            run: false,
            crouch: false
        };

        // Fireball timer
        this.fireCooldown = 0;

        // Touch Joystick & Gestures
        this.touchJoystick = {
            active: false,
            touchId: null,
            startX: 0,
            startY: 0,
            curX: 0,
            curY: 0,
            vectorX: 0,
            vectorY: 0
        };

        this.touchCamera = {
            active: false,
            touchId: null,
            startX: 0,
            startY: 0,
            lastX: 0,
            lastY: 0
        };

        // Init Three.js
        this.initThree();

        // Init Particles
        this.particles = new ParticleSystem3D(this.scene);

        // Bind events
        this.bindEvents();
        this.bindTouchControls();

        // UI setup
        this.updateHUD();
        this.showScreen('menuScreen');

        // Loop
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    }

    initThree() {
        // Scene
        this.scene = new THREE.Scene();

        // Camera
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 800);
        this.camera.position.set(0, 8, 16);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputEncoding = THREE.sRGBEncoding;

        // Replace 2D canvas with WebGL canvas
        const oldCanvas = document.getElementById('gameCanvas');
        if (oldCanvas) oldCanvas.style.display = 'none';

        this.renderer.domElement.id = 'webglCanvas';
        this.container.prepend(this.renderer.domElement);

        // Lights
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
        this.scene.add(this.ambientLight);

        this.hemiLight = new THREE.HemisphereLight(0xb1e1ff, 0x385522, 0.4);
        this.scene.add(this.hemiLight);

        this.sunLight = new THREE.DirectionalLight(0xfffaed, 0.85);
        this.sunLight.position.set(25, 45, 20);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 1024;
        this.sunLight.shadow.mapSize.height = 1024;
        this.sunLight.shadow.camera.near = 10;
        this.sunLight.shadow.camera.far = 120;
        const d = 25;
        this.sunLight.shadow.camera.left = -d;
        this.sunLight.shadow.camera.right = d;
        this.sunLight.shadow.camera.top = d;
        this.sunLight.shadow.camera.bottom = -d;
        this.scene.add(this.sunLight);

        // Fog
        this.scene.fog = new THREE.FogExp2(0xb5d4fc, 0.0075);

        // Player Model
        this.mario = new Mario3D();
        this.scene.add(this.mario.group);
        this.scene.add(this.mario.dropShadow);

        // Resize handling
        window.addEventListener('resize', () => this.onResize());
        window.addEventListener('orientationchange', () => setTimeout(() => this.onResize(), 150));
    }

    onResize() {
        if (!this.container) return;
        const width = this.container.clientWidth || window.innerWidth;
        const height = this.container.clientHeight || window.innerHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    // ==============================================================
    // GAME LIFECYCLE & LEVEL LOADING
    // ==============================================================
    startNewGame() {
        this.currentWorld = 0;
        this.score = 0;
        this.coins = 0;
        this.lives = 3;
        this.mario.applyForm('small');
        this.loadLevel(0);
        this.state = 'PLAYING';
        this.hideAllScreens();
        this.updateHUD();
    }

    restartLevel() {
        this.loadLevel(this.currentWorld);
        this.state = 'PLAYING';
        this.hideAllScreens();
        this.updateHUD();
    }

    loadLevel(worldIndex) {
        this.currentWorld = worldIndex;

        // Clean previous level objects
        if (this.level) {
            this.scene.remove(this.level.castleMesh);
            this.level.platforms.forEach(p => this.scene.remove(p.mesh));
            this.level.blocks.forEach(b => this.scene.remove(b.group));
            this.level.coins.forEach(c => this.scene.remove(c.group));
            this.level.items.forEach(it => this.scene.remove(it.group));
            this.level.enemies.forEach(e => this.scene.remove(e.group));
            this.level.fireballs.forEach(f => this.scene.remove(f.group));
            this.level.movingPlatforms.forEach(m => this.scene.remove(m.group));
            this.level.firebars.forEach(fb => this.scene.remove(fb.group));
            this.level.clouds.forEach(c => this.scene.remove(c));
            if (this.level.flagpole) this.scene.remove(this.level.flagpole.group);
            if (this.level.axeSwitch) this.scene.remove(this.level.axeSwitch.group);
            if (this.level.princessMesh) this.scene.remove(this.level.princessMesh);
        }

        // Build new level
        this.level = new Level3D(worldIndex, this.scene, this.particles);

        // Set Scene atmosphere
        this.scene.background = new THREE.Color(this.level.skyColor);
        this.scene.fog.color = new THREE.Color(this.level.fogColor);

        // Reset player
        this.playerPos.copy(this.level.spawnPoint);
        this.playerVel.set(0, 0, 0);
        this.playerRotation = 0;
        this.camYaw = 0;
        this.camPitch = 0.38;
        this.isGroundPounding = false;
        this.mario.animState = 'idle';

        this.timeLeft = this.level.timeLimit;

        // Play BGM
        window.audio.playBGM(this.level.bgmTheme);

        // Boss Bar
        const bossBar = document.getElementById('bossHealthContainer');
        if (bossBar) {
            bossBar.style.display = (worldIndex === 2) ? 'flex' : 'none';
        }

        this.updateHUD();
    }

    // ==============================================================
    // PHYSICS & PLAYER CONTROLS
    // ==============================================================
    updatePlayerPhysics(dt) {
        if (this.state !== 'PLAYING') return;

        // Ground pound state
        if (this.isGroundPounding) {
            if (this.groundPoundPause > 0) {
                this.groundPoundPause -= dt;
                this.playerVel.set(0, 0, 0);
                return;
            }
            this.playerVel.y = this.GROUND_POUND_SPEED;
            this.playerVel.x = 0;
            this.playerVel.z = 0;
        } else {
            // Apply Gravity
            this.playerVel.y -= this.GRAVITY * dt;
            if (this.playerVel.y < -35) this.playerVel.y = -35; // Terminal velocity
        }

        // Movement Direction calculated relative to current camera yaw angle!
        let moveX = 0;
        let moveZ = 0;

        // Combine Keyboard + Touch Joystick
        const inputX = this.input.turn + this.touchJoystick.vectorX;
        const inputZ = this.input.forward + this.touchJoystick.vectorY;

        if (Math.abs(inputX) > 0.1 || Math.abs(inputZ) > 0.1) {
            // Convert to camera space
            const angle = Math.atan2(inputX, inputZ) + this.camYaw;
            const inputMagnitude = Math.min(1.0, Math.sqrt(inputX * inputX + inputZ * inputZ));
            const speed = (this.input.run ? this.RUN_SPEED : this.MOVE_SPEED) * inputMagnitude;

            const targetVx = Math.sin(angle) * speed;
            const targetVz = Math.cos(angle) * speed;

            // Smooth acceleration
            this.playerVel.x += (targetVx - this.playerVel.x) * Math.min(1.0, 15 * dt);
            this.playerVel.z += (targetVz - this.playerVel.z) * Math.min(1.0, 15 * dt);

            // Turn player toward direction of movement
            this.playerRotation = angle;

            // Running dust
            if (this.isGrounded && speed > 5.0 && Math.random() < 0.25) {
                this.particles.createDust(this.playerPos.x, this.playerPos.y, this.playerPos.z, 1);
            }
        } else {
            // Friction damping
            const friction = this.isGrounded ? 18.0 : 6.0;
            this.playerVel.x -= this.playerVel.x * Math.min(1.0, friction * dt);
            this.playerVel.z -= this.playerVel.z * Math.min(1.0, friction * dt);
        }

        // Jumping
        if (this.input.jump) {
            if (this.isGrounded && !this.jumpHeld) {
                this.jumpHeld = true;
                this.isGrounded = false;
                this.playerVel.y = this.JUMP_FORCE;
                this.jumpTimer = 0.25;
                this.mario.animState = 'jump';
                window.audio.jump(this.mario.form !== 'small');
                this.particles.createDust(this.playerPos.x, this.playerPos.y, this.playerPos.z, 3);
                if (navigator.vibrate) navigator.vibrate(12);
            } else if (this.jumpHeld && this.jumpTimer > 0) {
                // Variable jump height
                this.jumpTimer -= dt;
                this.playerVel.y += 12 * dt;
            }
        } else {
            this.jumpHeld = false;
            this.jumpTimer = 0;
        }

        // Ground Pound Trigger: crouch pressed while airborne
        if (this.input.crouch && !this.isGrounded && !this.isGroundPounding && this.playerVel.y < 3) {
            this.isGroundPounding = true;
            this.groundPoundPause = 0.16;
            this.mario.animState = 'groundPound';
            window.audio.bump();
            if (navigator.vibrate) navigator.vibrate(20);
        }

        // Moving platform carry
        if (this.isGrounded && this.standingPlatform && this.standingPlatform.vel) {
            this.playerPos.add(this.standingPlatform.vel);
        }

        // Update positions with sub-stepping for precision collisions
        const substeps = 2;
        const subDt = dt / substeps;
        for (let s = 0; s < substeps; s++) {
            this.playerPos.x += this.playerVel.x * subDt;
            this.checkHorizontalCollisions('x');
            this.playerPos.z += this.playerVel.z * subDt;
            this.checkHorizontalCollisions('z');
            this.playerPos.y += this.playerVel.y * subDt;
            this.checkVerticalCollisions();
        }

        // Sync 3D Mario Mesh
        this.mario.group.position.copy(this.playerPos);
        this.mario.group.rotation.y = this.playerRotation;

        // Sync Drop Shadow beneath Mario
        this.updateDropShadow();

        // Check Items, Enemies & Level Interactions
        this.checkInteractions();

        // Pit Fall Check (Below Y = -10)
        if (this.playerPos.y < -10) {
            this.playerDie();
        }
    }

    // Horizontal Wall Collisions
    checkHorizontalCollisions(axis) {
        const marioBox = this.getMarioBox();
        for (const col of this.level.colliders) {
            if (col.box && marioBox.intersectsBox(col.box)) {
                if (axis === 'x') {
                    if (this.playerVel.x > 0) {
                        this.playerPos.x = col.box.min.x - 0.45;
                    } else if (this.playerVel.x < 0) {
                        this.playerPos.x = col.box.max.x + 0.45;
                    }
                    this.playerVel.x = 0;
                } else if (axis === 'z') {
                    if (this.playerVel.z > 0) {
                        this.playerPos.z = col.box.min.z - 0.45;
                    } else if (this.playerVel.z < 0) {
                        this.playerPos.z = col.box.max.z + 0.45;
                    }
                    this.playerVel.z = 0;
                }
                marioBox.setFromCenterAndSize(this.playerPos, new THREE.Vector3(0.9, 1.4, 0.9));
            }
        }
    }

    // Vertical Collisions (Landing & Block Hitting)
    checkVerticalCollisions() {
        const marioBox = this.getMarioBox();
        this.isGrounded = false;
        this.standingPlatform = null;

        for (const col of this.level.colliders) {
            if (!col.box || !marioBox.intersectsBox(col.box)) continue;

            // Falling onto top of platform/block
            if (this.playerVel.y <= 0 && this.playerPos.y >= col.box.max.y - 0.5) {
                this.playerPos.y = col.box.max.y;
                this.playerVel.y = 0;
                this.isGrounded = true;
                this.standingPlatform = col;

                // Land from Ground Pound!
                if (this.isGroundPounding) {
                    this.isGroundPounding = false;
                    this.mario.animState = 'idle';
                    this.particles.createDust(this.playerPos.x, this.playerPos.y, this.playerPos.z, 8);
                    window.audio.stomp();
                    if (navigator.vibrate) navigator.vibrate([30, 20, 30]);

                    // If landed on brick or question block from above, hit it!
                    if (col instanceof QuestionBlock3D || col instanceof BrickBlock3D) {
                        this.triggerBlockHit(col, true);
                    }
                }
                marioBox.setFromCenterAndSize(this.playerPos, new THREE.Vector3(0.9, 1.4, 0.9));
                break;
            }
            // Hitting block from beneath with Mario's head!
            else if (this.playerVel.y > 0 && this.playerPos.y < col.box.min.y) {
                this.playerPos.y = col.box.min.y - (this.mario.form === 'small' ? 1.4 : 1.8);
                this.playerVel.y = 0;

                // Hit block from below!
                if (col instanceof QuestionBlock3D || col instanceof BrickBlock3D) {
                    this.triggerBlockHit(col, false);
                }
                marioBox.setFromCenterAndSize(this.playerPos, new THREE.Vector3(0.9, 1.4, 0.9));
                break;
            }
        }
    }

    triggerBlockHit(block, fromAbove = false) {
        const isBig = this.mario.form !== 'small';
        const result = block.hit(isBig, fromAbove);

        if (result === 'coin') {
            this.addScore(200);
            this.addCoin();
            this.particles.createCoinSparkles(block.group.position.x, block.group.position.y + 1, block.group.position.z);
        } else if (result === 'mushroom') {
            const shroom = new Mushroom3D(block.group.position.x, block.group.position.y + 1.2, block.group.position.z, 'super');
            this.level.items.push(shroom);
            this.scene.add(shroom.group);
        } else if (result === 'flower') {
            const flower = new FireFlower3D(block.group.position.x, block.group.position.y + 1.2, block.group.position.z);
            this.level.items.push(flower);
            this.scene.add(flower.group);
        } else if (result === 'star') {
            const star = new Star3D(block.group.position.x, block.group.position.y + 1.2, block.group.position.z);
            this.level.items.push(star);
            this.scene.add(star.group);
        } else if (result === 'shatter') {
            this.particles.createBrickShatter(block.group.position.x, block.group.position.y, block.group.position.z);
            const idx = this.level.colliders.indexOf(block);
            if (idx >= 0) this.level.colliders.splice(idx, 1);
        }
    }

    getMarioBox() {
        const height = (this.mario.form === 'small') ? 1.3 : 1.8;
        return new THREE.Box3().setFromCenterAndSize(
            new THREE.Vector3(this.playerPos.x, this.playerPos.y + height * 0.5, this.playerPos.z),
            new THREE.Vector3(0.85, height, 0.85)
        );
    }

    updateDropShadow() {
        // Cast ray straight down from Mario to find ground level
        let groundY = -999;
        for (const col of this.level.colliders) {
            if (!col.box) continue;
            if (this.playerPos.x >= col.box.min.x && this.playerPos.x <= col.box.max.x &&
                this.playerPos.z >= col.box.min.z && this.playerPos.z <= col.box.max.z &&
                col.box.max.y <= this.playerPos.y + 0.1) {
                if (col.box.max.y > groundY) {
                    groundY = col.box.max.y;
                }
            }
        }

        if (groundY > -900) {
            this.mario.dropShadow.visible = true;
            this.mario.dropShadow.position.set(this.playerPos.x, groundY + 0.03, this.playerPos.z);
            const dist = Math.max(0, this.playerPos.y - groundY);
            const scale = Math.max(0.4, 1.0 - dist * 0.06);
            this.mario.dropShadow.scale.set(scale, scale, scale);
            this.mario.dropShadow.material.opacity = Math.max(0.15, 0.5 - dist * 0.04);
        } else {
            this.mario.dropShadow.visible = false;
        }
    }

    // ==============================================================
    // COINS, ITEMS & ENEMY INTERACTIONS
    // ==============================================================
    checkInteractions() {
        const marioBox = this.getMarioBox();

        // 1. Coins Collection
        for (let i = this.level.coins.length - 1; i >= 0; i--) {
            const coin = this.level.coins[i];
            if (!coin.collected && marioBox.intersectsBox(coin.box)) {
                coin.collected = true;
                this.scene.remove(coin.group);
                this.level.coins.splice(i, 1);
                this.addCoin();
                this.addScore(100);
                window.audio.coin();
                this.particles.createCoinSparkles(coin.group.position.x, coin.group.position.y, coin.group.position.z);
                if (navigator.vibrate) navigator.vibrate(10);
            }
        }

        // 2. Power-up Items Collection
        for (let i = this.level.items.length - 1; i >= 0; i--) {
            const item = this.level.items[i];
            if (!item.collected && marioBox.intersectsBox(item.box)) {
                item.collected = true;
                this.scene.remove(item.group);
                this.level.items.splice(i, 1);
                this.addScore(1000);

                if (item instanceof Mushroom3D) {
                    window.audio.powerup();
                    if (this.mario.form === 'small') {
                        this.mario.growAnimation(() => this.mario.applyForm('super'));
                    }
                } else if (item instanceof FireFlower3D) {
                    window.audio.powerup();
                    this.mario.applyForm('fire');
                } else if (item instanceof Star3D) {
                    this.mario.setStarPower(12.0);
                }
                if (navigator.vibrate) navigator.vibrate([20, 40, 20]);
            }
        }

        // 3. Enemies Collision
        for (const enemy of this.level.enemies) {
            if (!enemy.isAlive) continue;
            if (!marioBox.intersectsBox(enemy.box)) continue;

            // Star Mario destroys everything on contact!
            if (this.mario.starTimer > 0) {
                if (enemy instanceof Bowser3D) {
                    enemy.takeDamage();
                } else {
                    enemy.defeatByShellOrFire();
                    this.addScore(200);
                }
                continue;
            }

            // Stomp check: Mario is falling or ground pounding and above enemy center
            const isAbove = (this.playerVel.y <= 0 && this.playerPos.y > enemy.box.min.y + 0.35);

            if (isAbove) {
                if (enemy instanceof Goomba3D) {
                    enemy.stomp();
                    this.playerVel.y = 10.5; // Bounce Mario up!
                    this.addScore(200);
                    this.particles.createDust(enemy.group.position.x, enemy.group.position.y, enemy.group.position.z, 4);
                    if (navigator.vibrate) navigator.vibrate(25);
                } else if (enemy instanceof Koopa3D) {
                    enemy.stomp(this.playerPos.x);
                    this.playerVel.y = 10.5;
                    this.addScore(200);
                    if (navigator.vibrate) navigator.vibrate(25);
                } else if (enemy instanceof Bowser3D) {
                    enemy.takeDamage();
                    this.playerVel.y = 12.0;
                    this.addScore(1000);
                    if (navigator.vibrate) navigator.vibrate(40);
                }
            } else {
                // Mario gets hit!
                if (enemy instanceof Koopa3D && enemy.state === 'shell') {
                    // Kick stationary shell
                    enemy.kick(this.playerPos.x < enemy.group.position.x ? 1 : -1);
                } else {
                    this.marioTakeDamage();
                }
            }
        }

        // 4. Fireball collisions against enemies
        for (const fb of this.level.fireballs) {
            if (!fb.alive) continue;
            if (fb.isEnemy) {
                // Bowser's fireball hitting Mario
                if (marioBox.intersectsBox(fb.box)) {
                    fb.alive = false;
                    this.marioTakeDamage();
                }
            } else {
                // Mario's fireball hitting enemies
                for (const en of this.level.enemies) {
                    if (en.isAlive && en.box.intersectsBox(fb.box)) {
                        fb.alive = false;
                        if (en instanceof Bowser3D) {
                            en.takeDamage();
                        } else {
                            en.defeatByShellOrFire();
                            this.addScore(200);
                        }
                        this.particles.createDust(fb.group.position.x, fb.group.position.y, fb.group.position.z, 3);
                        break;
                    }
                }
            }
        }

        // 5. Firebars (World 1-3)
        for (const fb of this.level.firebars) {
            for (const ball of fb.balls) {
                const worldPos = ball.getWorldPosition(new THREE.Vector3());
                if (worldPos.distanceTo(this.playerPos) < 1.1) {
                    this.marioTakeDamage();
                    break;
                }
            }
        }

        // 6. Axe Switch in Bowser Arena
        if (this.level.axeSwitch && !this.level.axeSwitch.activated) {
            if (marioBox.intersectsBox(this.level.axeSwitch.box)) {
                this.level.axeSwitch.activated = true;
                this.level.axeSwitch.group.rotation.z = 1.2; // Cut axe
                window.audio.kick();
                this.level.collapseBridge();
                if (this.level.bowser && this.level.bowser.isAlive) {
                    setTimeout(() => {
                        this.level.bowser.isAlive = false;
                        window.audio.bossFall();
                    }, 800);
                }
                // Trigger Victory after short delay
                setTimeout(() => this.triggerVictory(), 2800);
            }
        }

        // 7. Flagpole Finish (Worlds 1-1 & 1-2)
        if (this.level.flagpole && !this.level.flagpole.isSliding) {
            if (marioBox.intersectsBox(this.level.flagpole.box)) {
                this.triggerLevelClear();
            }
        }
    }

    marioTakeDamage() {
        if (this.mario.isInvulnerable || this.mario.starTimer > 0) return;

        if (this.mario.form === 'fire') {
            window.audio.shrink();
            this.mario.applyForm('super');
            this.mario.setInvulnerable(2.2);
            if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
        } else if (this.mario.form === 'super') {
            window.audio.shrink();
            this.mario.shrinkAnimation(() => this.mario.applyForm('small'));
            this.mario.setInvulnerable(2.2);
            if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
        } else {
            // Small Mario dies
            this.playerDie();
        }
    }

    playerDie() {
        if (this.state === 'DEAD') return;
        this.state = 'DEAD';
        window.audio.die();
        this.lives--;
        this.updateHUD();
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

        // Mario death leap animation
        let deathTimer = 0;
        let deathVy = 12;
        const animateDeath = () => {
            deathTimer += 0.02;
            deathVy -= 26 * 0.02;
            this.playerPos.y += deathVy * 0.02;
            this.mario.group.position.copy(this.playerPos);
            this.mario.group.rotation.x += 0.1;

            if (deathTimer < 2.5) {
                requestAnimationFrame(animateDeath);
            } else {
                if (this.lives > 0) {
                    this.restartLevel();
                } else {
                    this.triggerGameOver();
                }
            }
        };
        animateDeath();
    }

    triggerLevelClear() {
        this.state = 'LEVEL_CLEAR';
        window.audio.stageClear();
        this.level.flagpole.isSliding = true;

        // Slide Mario down pole
        let slideTime = 0;
        const poleX = this.level.flagpole.group.position.x;
        const poleZ = this.level.flagpole.group.position.z;
        this.playerPos.set(poleX + 0.4, 8.5, poleZ);

        const slideLoop = () => {
            slideTime += 0.03;
            if (this.playerPos.y > 2.0) {
                this.playerPos.y -= 0.18;
                this.mario.group.position.copy(this.playerPos);
                this.level.flagpole.slideFlag(0.03);
                requestAnimationFrame(slideLoop);
            } else {
                // Mario walks into castle
                this.walkIntoCastle();
            }
        };
        slideLoop();
    }

    walkIntoCastle() {
        let walkTimer = 0;
        const walk = () => {
            walkTimer += 0.03;
            this.playerPos.x += 0.12;
            this.mario.group.position.copy(this.playerPos);
            this.mario.update(0.03, 6.0, true, true);

            // Castle fireworks
            if (Math.random() < 0.12 && this.level.castleMesh) {
                const cPos = this.level.castleMesh.position;
                this.particles.createFireworks(
                    cPos.x + (Math.random() - 0.5) * 6,
                    cPos.y + 8 + Math.random() * 4,
                    cPos.z + (Math.random() - 0.5) * 6
                );
            }

            if (walkTimer < 3.2) {
                requestAnimationFrame(walk);
            } else {
                // Next level or Victory
                if (this.currentWorld < 2) {
                    this.loadLevel(this.currentWorld + 1);
                    this.state = 'PLAYING';
                } else {
                    this.triggerVictory();
                }
            }
        };
        walk();
    }

    triggerVictory() {
        this.state = 'VICTORY';
        window.audio.stageClear();
        this.showScreen('victoryScreen');
        const vScore = document.getElementById('victoryScore');
        if (vScore) vScore.innerText = String(this.score).padStart(6, '0');
        this.saveHighScore();
    }

    triggerGameOver() {
        this.state = 'GAME_OVER';
        window.audio.gameOver();
        this.showScreen('gameOverScreen');
        const goScore = document.getElementById('gameOverScore');
        if (goScore) goScore.innerText = String(this.score).padStart(6, '0');
        this.saveHighScore();
    }

    // Shoot fireball (when Fire Mario)
    shootFireball() {
        if (this.mario.form !== 'fire' || this.fireCooldown > 0) return;
        this.fireCooldown = 0.35;
        window.audio.fireball();

        const dir = new THREE.Vector3(Math.sin(this.playerRotation), 0, Math.cos(this.playerRotation)).normalize();
        const fb = new Fireball3D(
            this.playerPos.x + dir.x * 0.8,
            this.playerPos.y + 0.8,
            this.playerPos.z + dir.z * 0.8,
            dir.x * 12.0,
            2.0,
            dir.z * 12.0,
            false
        );
        this.level.fireballs.push(fb);
        this.scene.add(fb.group);
        if (navigator.vibrate) navigator.vibrate(15);
    }

    // ==============================================================
    // CAMERA TRACKING & ORBIT
    // ==============================================================
    updateCamera(dt) {
        // Center camera target on Mario with soft smoothing
        const targetPos = this.playerPos.clone().add(new THREE.Vector3(0, 1.2, 0));
        this.camTarget.lerp(targetPos, Math.min(1.0, 10 * dt));

        // Calculate spherical orbit position
        const cosPitch = Math.cos(this.camPitch);
        const sinPitch = Math.sin(this.camPitch);
        const camX = this.camTarget.x - Math.sin(this.camYaw) * (this.camDistance * cosPitch);
        const camZ = this.camTarget.z - Math.cos(this.camYaw) * (this.camDistance * cosPitch);
        const camY = this.camTarget.y + (this.camDistance * sinPitch);

        this.camera.position.set(camX, camY, camZ);
        this.camera.lookAt(this.camTarget);

        // Sunlight follows Mario
        this.sunLight.position.set(this.playerPos.x + 20, this.playerPos.y + 35, this.playerPos.z + 15);
        this.sunLight.target.position.copy(this.playerPos);
        this.sunLight.target.updateMatrixWorld();
    }

    // ==============================================================
    // HUD & SCORING
    // ==============================================================
    addScore(pts) {
        this.score += pts;
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

    saveHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('mario_highscore', this.highScore);
        }
    }

    updateHUD() {
        const hudScore = document.getElementById('hudScore');
        if (hudScore) hudScore.innerText = String(this.score).padStart(6, '0');

        const hudCoins = document.getElementById('hudCoins');
        if (hudCoins) hudCoins.innerText = 'x' + String(this.coins).padStart(2, '0');

        const hudWorld = document.getElementById('hudWorld');
        if (hudWorld) hudWorld.innerText = this.level ? this.level.name : '1-1';

        const hudTime = document.getElementById('hudTime');
        if (hudTime) hudTime.innerText = String(Math.max(0, Math.floor(this.timeLeft))).padStart(3, '0');

        const hudLives = document.getElementById('hudLives');
        if (hudLives) hudLives.innerText = 'x' + this.lives;

        // Boss health in World 3
        if (this.level && this.level.bowser) {
            const bossBarFill = document.getElementById('bossHealthFill');
            if (bossBarFill) {
                const pct = Math.max(0, (this.level.bowser.health / 5) * 100);
                bossBarFill.style.width = pct + '%';
            }
        }
    }

    showScreen(id) {
        this.hideAllScreens();
        const el = document.getElementById(id);
        if (el) el.classList.add('active');
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
            if (this.level) window.audio.playBGM(this.level.bgmTheme);
            this.hideAllScreens();
        }
    }

    // ==============================================================
    // MAIN GAME LOOP
    // ==============================================================
    loop(timestamp) {
        const dt = Math.min(0.05, (timestamp - this.lastTime) / 1000);
        this.lastTime = timestamp;

        if (this.state === 'PLAYING') {
            // Timer countdown
            this.timeLeft -= dt * 1.5;
            if (this.timeLeft <= 0) {
                this.playerDie();
            }

            // Cooldowns
            if (this.fireCooldown > 0) this.fireCooldown -= dt;

            // Update Physics & World
            this.updatePlayerPhysics(dt);
            if (this.level) this.level.update(dt);
            this.particles.update(dt);

            // Update Mario Animations
            const horizontalSpeed = Math.sqrt(this.playerVel.x * this.playerVel.x + this.playerVel.z * this.playerVel.z);
            const isMoving = Math.abs(this.input.turn) > 0.1 || Math.abs(this.input.forward) > 0.1 ||
                             Math.abs(this.touchJoystick.vectorX) > 0.1 || Math.abs(this.touchJoystick.vectorY) > 0.1;
            this.mario.update(dt, horizontalSpeed, this.isGrounded, isMoving);

            this.updateHUD();
        }

        // Camera always tracks smoothly
        this.updateCamera(dt);

        // Render 3D Scene
        this.renderer.render(this.scene, this.camera);

        requestAnimationFrame((t) => this.loop(t));
    }

    // ==============================================================
    // TOUCH & JOYSTICK CONTROLS (SMARTPHONE FIRST-CLASS SUPPORT)
    // ==============================================================
    bindTouchControls() {
        const joystickZone = document.getElementById('joystickZone');
        const joystickThumb = document.getElementById('joystickThumb');

        if (joystickZone && joystickThumb) {
            const handleTouchStart = (e) => {
                window.audio.resume();
                for (let i = 0; i < e.changedTouches.length; i++) {
                    const touch = e.changedTouches[i];
                    // Left half of screen controls joystick
                    if (touch.clientX < window.innerWidth * 0.5 && !this.touchJoystick.active) {
                        this.touchJoystick.active = true;
                        this.touchJoystick.touchId = touch.identifier;
                        this.touchJoystick.startX = touch.clientX;
                        this.touchJoystick.startY = touch.clientY;
                        this.touchJoystick.curX = touch.clientX;
                        this.touchJoystick.curY = touch.clientY;

                        // Position joystick base at touch point
                        joystickZone.style.display = 'block';
                        joystickZone.style.left = (touch.clientX - 60) + 'px';
                        joystickZone.style.top = (touch.clientY - 60) + 'px';
                        joystickThumb.style.transform = `translate(0px, 0px)`;
                        break;
                    }
                }
            };

            const handleTouchMove = (e) => {
                if (!this.touchJoystick.active) return;
                for (let i = 0; i < e.changedTouches.length; i++) {
                    const touch = e.changedTouches[i];
                    if (touch.identifier === this.touchJoystick.touchId) {
                        const dx = touch.clientX - this.touchJoystick.startX;
                        const dy = touch.clientY - this.touchJoystick.startY;
                        const maxRadius = 45;
                        const dist = Math.sqrt(dx * dx + dy * dy);

                        let clampedX = dx;
                        let clampedY = dy;
                        if (dist > maxRadius) {
                            clampedX = (dx / dist) * maxRadius;
                            clampedY = (dy / dist) * maxRadius;
                        }

                        joystickThumb.style.transform = `translate(${clampedX}px, ${clampedY}px)`;
                        this.touchJoystick.vectorX = clampedX / maxRadius;
                        this.touchJoystick.vectorY = -clampedY / maxRadius; // Up is forward
                        break;
                    }
                }
            };

            const handleTouchEnd = (e) => {
                if (!this.touchJoystick.active) return;
                for (let i = 0; i < e.changedTouches.length; i++) {
                    if (e.changedTouches[i].identifier === this.touchJoystick.touchId) {
                        this.touchJoystick.active = false;
                        this.touchJoystick.touchId = null;
                        this.touchJoystick.vectorX = 0;
                        this.touchJoystick.vectorY = 0;
                        joystickThumb.style.transform = `translate(0px, 0px)`;
                        joystickZone.style.display = 'none';
                        break;
                    }
                }
            };

            window.addEventListener('touchstart', handleTouchStart, { passive: false });
            window.addEventListener('touchmove', handleTouchMove, { passive: false });
            window.addEventListener('touchend', handleTouchEnd, { passive: false });
            window.addEventListener('touchcancel', handleTouchEnd, { passive: false });
        }

        // Camera Touch Drag (Right half of screen swipe to rotate camera 360)
        window.addEventListener('touchstart', (e) => {
            window.audio.resume();
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                // Upper right touch orbits camera
                if (touch.clientX >= window.innerWidth * 0.4 && !this.touchCamera.active) {
                    // Check if touching action buttons
                    const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
                    if (targetEl && (targetEl.closest('.act-btn') || targetEl.closest('.hud-controls') || targetEl.closest('.screen-overlay'))) {
                        continue;
                    }

                    this.touchCamera.active = true;
                    this.touchCamera.touchId = touch.identifier;
                    this.touchCamera.lastX = touch.clientX;
                    this.touchCamera.lastY = touch.clientY;
                    break;
                }
            }
        }, { passive: false });

        window.addEventListener('touchmove', (e) => {
            if (!this.touchCamera.active) return;
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                if (touch.identifier === this.touchCamera.touchId) {
                    const dx = touch.clientX - this.touchCamera.lastX;
                    const dy = touch.clientY - this.touchCamera.lastY;
                    this.camYaw -= dx * 0.008;
                    this.camPitch = Math.max(0.1, Math.min(1.2, this.camPitch + dy * 0.005));
                    this.touchCamera.lastX = touch.clientX;
                    this.touchCamera.lastY = touch.clientY;
                    break;
                }
            }
        }, { passive: false });

        const endCamTouch = (e) => {
            if (!this.touchCamera.active) return;
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === this.touchCamera.touchId) {
                    this.touchCamera.active = false;
                    this.touchCamera.touchId = null;
                    break;
                }
            }
        };
        window.addEventListener('touchend', endCamTouch, { passive: false });
        window.addEventListener('touchcancel', endCamTouch, { passive: false });

        // Action Buttons
        const bindButton = (id, onDown, onUp) => {
            const btn = document.getElementById(id);
            if (!btn) return;
            const start = (e) => {
                e.preventDefault();
                window.audio.resume();
                btn.classList.add('pressed');
                if (onDown) onDown();
            };
            const end = (e) => {
                e.preventDefault();
                btn.classList.remove('pressed');
                if (onUp) onUp();
            };
            btn.addEventListener('touchstart', start, { passive: false });
            btn.addEventListener('touchend', end, { passive: false });
            btn.addEventListener('touchcancel', end, { passive: false });
            btn.addEventListener('mousedown', start);
            btn.addEventListener('mouseup', end);
            btn.addEventListener('mouseleave', end);
        };

        // [A] Jump
        bindButton('btnJump',
            () => { this.input.jump = true; },
            () => { this.input.jump = false; }
        );

        // [B] Dash / Fireball
        bindButton('btnRun',
            () => {
                this.input.run = true;
                this.shootFireball();
            },
            () => { this.input.run = false; }
        );

        // [▼] Crouch / Ground Pound
        bindButton('btnCrouch',
            () => { this.input.crouch = true; },
            () => { this.input.crouch = false; }
        );

        // [🎥] Center Camera
        const btnCenterCam = document.getElementById('btnCenterCam');
        if (btnCenterCam) {
            btnCenterCam.addEventListener('click', (e) => {
                e.preventDefault();
                this.camYaw = this.playerRotation;
                this.camPitch = 0.38;
            });
            btnCenterCam.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.camYaw = this.playerRotation;
                this.camPitch = 0.38;
            }, { passive: false });
        }
    }

    // ==============================================================
    // KEYBOARD & MOUSE CONTROLS (DESKTOP FALLBACK)
    // ==============================================================
    bindEvents() {
        window.addEventListener('keydown', (e) => {
            window.audio.resume();
            switch (e.code) {
                case 'KeyW':
                case 'ArrowUp':
                    this.input.forward = 1.0;
                    break;
                case 'KeyS':
                case 'ArrowDown':
                    this.input.forward = -1.0;
                    break;
                case 'KeyA':
                case 'ArrowLeft':
                    this.input.turn = -1.0;
                    break;
                case 'KeyD':
                case 'ArrowRight':
                    this.input.turn = 1.0;
                    break;
                case 'Space':
                case 'KeyK':
                    this.input.jump = true;
                    break;
                case 'ShiftLeft':
                case 'ShiftRight':
                case 'KeyJ':
                    this.input.run = true;
                    this.shootFireball();
                    break;
                case 'KeyC':
                case 'ControlLeft':
                    this.input.crouch = true;
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
                case 'KeyW':
                case 'ArrowUp':
                    if (this.input.forward > 0) this.input.forward = 0;
                    break;
                case 'KeyS':
                case 'ArrowDown':
                    if (this.input.forward < 0) this.input.forward = 0;
                    break;
                case 'KeyA':
                case 'ArrowLeft':
                    if (this.input.turn < 0) this.input.turn = 0;
                    break;
                case 'KeyD':
                case 'ArrowRight':
                    if (this.input.turn > 0) this.input.turn = 0;
                    break;
                case 'Space':
                case 'KeyK':
                    this.input.jump = false;
                    break;
                case 'ShiftLeft':
                case 'ShiftRight':
                case 'KeyJ':
                    this.input.run = false;
                    break;
                case 'KeyC':
                case 'ControlLeft':
                    this.input.crouch = false;
                    break;
            }
        });

        // Desktop Mouse drag camera orbit
        let isMouseDown = false;
        let lastMouseX = 0;
        let lastMouseY = 0;

        this.renderer.domElement.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                isMouseDown = true;
                lastMouseX = e.clientX;
                lastMouseY = e.clientY;
            }
        });

        window.addEventListener('mousemove', (e) => {
            if (!isMouseDown) return;
            const dx = e.clientX - lastMouseX;
            const dy = e.clientY - lastMouseY;
            this.camYaw -= dx * 0.007;
            this.camPitch = Math.max(0.1, Math.min(1.2, this.camPitch + dy * 0.005));
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
        });

        window.addEventListener('mouseup', () => { isMouseDown = false; });

        // Mouse wheel zoom
        window.addEventListener('wheel', (e) => {
            this.camDistance = Math.max(8, Math.min(26, this.camDistance + e.deltaY * 0.015));
        }, { passive: true });

        // Top HUD buttons
        const btnMute = document.getElementById('btnMute');
        if (btnMute) btnMute.addEventListener('click', () => this.toggleMuteUI());

        const btnPause = document.getElementById('btnPause');
        if (btnPause) btnPause.addEventListener('click', () => this.togglePause());

        const btnFullscreen = document.getElementById('btnFullscreen');
        if (btnFullscreen) {
            btnFullscreen.addEventListener('click', () => {
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(() => {});
                } else {
                    document.exitFullscreen().catch(() => {});
                }
            });
        }

        // Overlay menu buttons
        const btnStart = document.getElementById('btnStart');
        if (btnStart) btnStart.addEventListener('click', () => this.startNewGame());

        const btnResume = document.getElementById('btnResume');
        if (btnResume) btnResume.addEventListener('click', () => this.togglePause());

        const btnRestart = document.getElementById('btnRestart');
        if (btnRestart) btnRestart.addEventListener('click', () => this.restartLevel());

        const btnPlayAgain = document.getElementById('btnPlayAgain');
        if (btnPlayAgain) btnPlayAgain.addEventListener('click', () => this.startNewGame());

        const btnRestartVictory = document.getElementById('btnRestartVictory');
        if (btnRestartVictory) btnRestartVictory.addEventListener('click', () => this.startNewGame());

        // Level Select shortcuts on Start Screen
        const levelBtns = document.querySelectorAll('.lvl-select-btn');
        levelBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const world = parseInt(e.target.dataset.world || '0', 10);
                this.currentWorld = world;
                this.score = 0;
                this.coins = 0;
                this.lives = 3;
                this.loadLevel(world);
                this.state = 'PLAYING';
                this.hideAllScreens();
                this.updateHUD();
            });
        });
    }

    toggleMuteUI() {
        const isMuted = window.audio.toggleMute();
        const btnMute = document.getElementById('btnMute');
        if (btnMute) btnMute.innerText = isMuted ? '🔇' : '🔊';
    }
}

// Instantiate 3D game once DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game3D();
});
