// Super Mario Web - Game Entities & Physics

class Entity {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.width = width;
        this.height = height;
        this.dead = false;
        this.grounded = false;
    }

    getBounds() {
        return {
            left: this.x,
            right: this.x + this.width,
            top: this.y,
            bottom: this.y + this.height
        };
    }

    collidesWith(other) {
        const a = this.getBounds();
        const b = other.getBounds();
        return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    }
}

// ================= MARIO (PLAYER) ================= //
class Player extends Entity {
    constructor(x, y) {
        super(x, y, 14, 16);
        this.state = 'small'; // 'small', 'big', 'fire'
        this.facing = 1; // 1 = right, -1 = left
        this.isGrounded = false;
        this.isJumping = false;
        this.isCrouching = false;
        this.isSkidding = false;
        this.isDead = false;

        // Kinematics
        this.accel = 0.18;
        this.friction = 0.88;
        this.walkMax = 2.4;
        this.runMax = 4.0;
        this.gravity = 0.42;
        this.jumpImpulse = -6.8;
        this.jumpHoldTimer = 0;
        this.maxJumpHold = 14;

        // Animations & Timers
        this.animTimer = 0;
        this.animFrame = 0;
        this.invulnerableTimer = 0;
        this.starTimer = 0;
        this.transformTimer = 0;
        this.deathTimer = 0;
        this.flagSliding = false;
        this.flagWaitTimer = 0;
        this.castleWalking = false;
    }

    upgrade(type) {
        if (type === 'mushroom') {
            if (this.state === 'small') {
                this.state = 'big';
                this.height = 28;
                this.y -= 12;
                this.transformTimer = 40;
                window.audio.powerup();
            } else {
                window.audio.powerup();
            }
        } else if (type === 'flower') {
            this.state = 'fire';
            this.height = 28;
            this.transformTimer = 40;
            window.audio.powerup();
        } else if (type === 'star') {
            this.starTimer = 600; // ~10 seconds
            window.audio.playBGM('starman');
        }
    }

    takeDamage() {
        if (this.invulnerableTimer > 0 || this.starTimer > 0 || this.isDead) return;

        if (this.state === 'fire' || this.state === 'big') {
            this.state = 'small';
            this.height = 16;
            this.invulnerableTimer = 120; // 2 seconds flashing
            this.transformTimer = 30;
            window.audio.shrink();
        } else {
            this.die();
        }
    }

    die() {
        if (this.isDead) return;
        this.isDead = true;
        this.deathTimer = 150;
        this.vy = -7.5;
        this.vx = 0;
        window.audio.die();
    }

    update(input, level) {
        // Transformation freeze
        if (this.transformTimer > 0) {
            this.transformTimer--;
            return;
        }

        // Death animation
        if (this.isDead) {
            this.deathTimer--;
            this.y += this.vy;
            this.vy += 0.35;
            return;
        }

        // Starman countdown
        if (this.starTimer > 0) {
            this.starTimer--;
            if (this.starTimer === 0) {
                window.audio.playBGM(level.bgmTheme);
            }
        }

        // Invulnerability timer
        if (this.invulnerableTimer > 0) {
            this.invulnerableTimer--;
        }

        // Flagpole sequence
        if (this.flagSliding) {
            this.vx = 0;
            if (this.y < (level.height - 3) * 16) {
                this.y += 2.5;
            } else {
                this.flagSliding = false;
                this.castleWalking = true;
                this.facing = 1;
            }
            return;
        }

        if (this.castleWalking) {
            this.vx = 1.6;
            this.x += this.vx;
            this.animTimer++;
            if (this.animTimer % 8 === 0) {
                this.animFrame = (this.animFrame + 1) % 3;
            }
            return;
        }

        // Normal Player Controls
        const maxSpeed = input.run ? this.runMax : this.walkMax;

        // Horizontal Movement
        if (input.left) {
            if (this.vx > 0.5) {
                this.isSkidding = true;
                this.vx -= this.accel * 2.2;
            } else {
                this.isSkidding = false;
                this.vx -= this.accel;
                this.facing = -1;
            }
        } else if (input.right) {
            if (this.vx < -0.5) {
                this.isSkidding = true;
                this.vx += this.accel * 2.2;
            } else {
                this.isSkidding = false;
                this.vx += this.accel;
                this.facing = 1;
            }
        } else {
            this.isSkidding = false;
            this.vx *= this.friction;
            if (Math.abs(this.vx) < 0.05) this.vx = 0;
        }

        // Clamp horizontal speed
        if (this.vx > maxSpeed) this.vx = maxSpeed;
        if (this.vx < -maxSpeed) this.vx = -maxSpeed;

        // Crouching (Big/Fire Mario only)
        if (input.down && this.isGrounded && this.state !== 'small') {
            this.isCrouching = true;
            this.vx *= 0.6;
            this.height = 18;
        } else {
            this.isCrouching = false;
            this.height = (this.state === 'small') ? 16 : 28;
        }

        // Jumping
        if (input.jump) {
            if (this.isGrounded && !this.isJumping) {
                this.vy = this.jumpImpulse;
                this.isJumping = true;
                this.isGrounded = false;
                this.jumpHoldTimer = this.maxJumpHold;
                window.audio.jump(this.state !== 'small');
            } else if (this.isJumping && this.jumpHoldTimer > 0) {
                this.vy -= 0.18;
                this.jumpHoldTimer--;
            }
        } else {
            this.isJumping = false;
            this.jumpHoldTimer = 0;
        }

        // Apply Gravity
        this.vy += this.gravity;
        if (this.vy > 8) this.vy = 8;

        // Horizontal tile collision
        this.x += this.vx;
        level.collideTilesX(this);

        // Vertical tile collision
        this.y += this.vy;
        level.collideTilesY(this);

        // Falling below world
        if (this.y > level.height * 16 + 32) {
            this.die();
        }

        // Running animation frames
        if (Math.abs(this.vx) > 0.2) {
            this.animTimer += Math.abs(this.vx);
            if (this.animTimer >= 10) {
                this.animTimer = 0;
                this.animFrame = (this.animFrame + 1) % 3;
            }
        } else {
            this.animFrame = 0;
        }
    }

    draw(ctx, cameraX) {
        if (this.isDead) {
            window.sprites.draw(ctx, 'mario_small_dead', this.x - cameraX, this.y, 16, 16);
            return;
        }

        // Flashing when invulnerable
        if (this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer / 4) % 2 === 0) {
            return;
        }

        let spriteName = 'mario_small_idle';
        const isFlipped = this.facing === -1;
        const prefix = this.state === 'fire' ? 'mario_fire_' : (this.state === 'big' ? 'mario_big_' : 'mario_small_');

        if (!this.isGrounded) {
            spriteName = prefix + 'jump';
        } else if (this.isSkidding) {
            spriteName = prefix + 'run_1';
        } else if (Math.abs(this.vx) > 0.2) {
            spriteName = (prefix === 'mario_small_') ? `mario_small_run_${this.animFrame}` : prefix + 'idle';
        } else {
            spriteName = prefix + 'idle';
        }

        // Star rainbow filter effect
        if (this.starTimer > 0 && Math.floor(this.starTimer / 3) % 2 === 0) {
            ctx.filter = 'hue-rotate(180deg) brightness(1.2)';
        }

        const renderH = this.state === 'small' ? 16 : 32;
        const renderY = this.state === 'small' ? this.y : this.y - (32 - this.height);
        window.sprites.draw(ctx, spriteName, this.x - cameraX - 1, renderY, 16, renderH, isFlipped);

        ctx.filter = 'none';
    }
}

// ================= ENEMIES ================= //

// Goomba
class Goomba extends Entity {
    constructor(x, y) {
        super(x, y, 16, 16);
        this.vx = -0.75;
        this.isFlattened = false;
        this.flatTimer = 0;
        this.animTimer = 0;
        this.animFrame = 0;
    }

    stomp() {
        this.isFlattened = true;
        this.flatTimer = 30;
        this.vx = 0;
        this.vy = 0;
        window.audio.stomp();
    }

    killFlip() {
        this.dead = true;
        window.audio.kick();
    }

    update(level) {
        if (this.isFlattened) {
            this.flatTimer--;
            if (this.flatTimer <= 0) this.dead = true;
            return;
        }

        this.animTimer++;
        if (this.animTimer >= 14) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 2;
        }

        this.vy += 0.38;
        if (this.vy > 7) this.vy = 7;

        this.x += this.vx;
        if (level.collideTilesX(this)) {
            this.vx = -this.vx;
        }

        this.y += this.vy;
        level.collideTilesY(this);

        if (this.y > level.height * 16 + 32) this.dead = true;
    }

    draw(ctx, cameraX) {
        if (this.isFlattened) {
            window.sprites.draw(ctx, 'goomba_flat', this.x - cameraX, this.y, 16, 16);
        } else {
            window.sprites.draw(ctx, `goomba_${this.animFrame}`, this.x - cameraX, this.y, 16, 16);
        }
    }
}

// Koopa Troopa (Walking & Shell)
class Koopa extends Entity {
    constructor(x, y) {
        super(x, y, 16, 24);
        this.vx = -0.8;
        this.isShell = false;
        this.isMovingShell = false;
        this.animTimer = 0;
        this.animFrame = 0;
    }

    stomp(marioX) {
        if (!this.isShell) {
            this.isShell = true;
            this.height = 16;
            this.y += 8;
            this.vx = 0;
            window.audio.stomp();
        } else if (this.isMovingShell) {
            this.isMovingShell = false;
            this.vx = 0;
            window.audio.stomp();
        } else {
            // Kick shell
            this.kick(marioX < this.x ? 1 : -1);
        }
    }

    kick(dir) {
        this.isMovingShell = true;
        this.vx = dir * 4.2;
        window.audio.kick();
    }

    killFlip() {
        this.dead = true;
        window.audio.kick();
    }

    update(level) {
        this.vy += 0.4;
        if (this.vy > 7) this.vy = 7;

        if (!this.isShell) {
            this.animTimer++;
            if (this.animTimer >= 14) {
                this.animTimer = 0;
                this.animFrame = (this.animFrame + 1) % 2;
            }
        }

        this.x += this.vx;
        if (level.collideTilesX(this)) {
            this.vx = -this.vx;
            if (this.isMovingShell) window.audio.bump();
        }

        this.y += this.vy;
        level.collideTilesY(this);

        if (this.y > level.height * 16 + 32) this.dead = true;
    }

    draw(ctx, cameraX) {
        if (this.isShell) {
            window.sprites.draw(ctx, 'koopa_shell', this.x - cameraX, this.y, 16, 16);
        } else {
            const flip = this.vx > 0;
            window.sprites.draw(ctx, `koopa_${this.animFrame}`, this.x - cameraX, this.y, 16, 24, flip);
        }
    }
}

// Piranha Plant
class PiranhaPlant extends Entity {
    constructor(x, y) {
        super(x, y, 16, 24);
        this.baseY = y;
        this.offsetY = 0;
        this.state = 'rising'; // rising, holding, lowering, waiting
        this.timer = 0;
    }

    update(player) {
        // Distance check: don't rise if Mario is standing on the pipe
        const dist = Math.abs((player.x + 8) - (this.x + 8));

        switch (this.state) {
            case 'waiting':
                this.timer++;
                if (this.timer > 80 && dist > 24) {
                    this.state = 'rising';
                    this.timer = 0;
                }
                break;
            case 'rising':
                this.offsetY -= 0.8;
                if (this.offsetY <= -24) {
                    this.offsetY = -24;
                    this.state = 'holding';
                    this.timer = 0;
                }
                break;
            case 'holding':
                this.timer++;
                if (this.timer > 60) {
                    this.state = 'lowering';
                    this.timer = 0;
                }
                break;
            case 'lowering':
                this.offsetY += 0.8;
                if (this.offsetY >= 0) {
                    this.offsetY = 0;
                    this.state = 'waiting';
                    this.timer = 0;
                }
                break;
        }

        this.y = this.baseY + this.offsetY;
    }

    draw(ctx, cameraX) {
        if (this.offsetY < 0) {
            window.sprites.draw(ctx, 'piranha_0', this.x - cameraX, this.y, 16, 24);
        }
    }
}

// Bowser (World 1-4 Boss)
class Bowser extends Entity {
    constructor(x, y) {
        super(x, y, 32, 32);
        this.hp = 5;
        this.vx = -0.5;
        this.jumpTimer = 0;
        this.fireTimer = 0;
        this.isFallingLava = false;
        this.origX = x;
    }

    takeHit() {
        this.hp--;
        window.audio.bossHurt();
        if (this.hp <= 0) {
            this.fallLava();
        }
    }

    fallLava() {
        this.isFallingLava = true;
        this.vy = 2.0;
        this.vx = 0;
        window.audio.bossFall();
    }

    update(level, player, projectiles) {
        if (this.isFallingLava) {
            this.y += this.vy;
            if (this.y > level.height * 16 + 64) this.dead = true;
            return;
        }

        // Patrol back and forth on bridge
        this.x += this.vx;
        if (this.x < this.origX - 80) {
            this.vx = 0.5;
        } else if (this.x > this.origX) {
            this.vx = -0.5;
        }

        // Periodic Jump
        this.jumpTimer++;
        if (this.jumpTimer > 160 && this.grounded) {
            this.vy = -4.5;
            this.grounded = false;
            this.jumpTimer = 0;
        }

        // Gravity
        this.vy += 0.35;
        if (this.vy > 7) this.vy = 7;

        this.y += this.vy;
        level.collideTilesY(this);

        // Periodic Fire breath
        this.fireTimer++;
        if (this.fireTimer > 120) {
            this.fireTimer = 0;
            projectiles.push(new BowserFire(this.x - 6, this.y + 8, -2.8));
        }
    }

    draw(ctx, cameraX) {
        window.sprites.draw(ctx, 'bowser_0', this.x - cameraX, this.y, 32, 32, this.vx > 0);
    }
}

// ================= PROJECTILES & ITEMS ================= //

// Fireball (Mario)
class Fireball extends Entity {
    constructor(x, y, dir) {
        super(x, y, 8, 8);
        this.vx = dir * 5.0;
        this.vy = 2.0;
    }

    update(level) {
        this.vy += 0.38;
        if (this.vy > 6) this.vy = 6;

        this.x += this.vx;
        if (level.collideTilesX(this)) {
            this.dead = true;
            return;
        }

        this.y += this.vy;
        const collidedY = level.collideTilesY(this);
        if (collidedY && this.grounded) {
            this.vy = -3.8; // Bounce!
        }

        if (this.y > level.height * 16) this.dead = true;
    }

    draw(ctx, cameraX) {
        window.sprites.draw(ctx, 'fireball', this.x - cameraX, this.y, 8, 8);
    }
}

// Bowser's Fire
class BowserFire extends Entity {
    constructor(x, y, vx) {
        super(x, y, 16, 8);
        this.vx = vx;
        this.vy = 0;
        this.timer = 0;
    }

    update(level) {
        this.x += this.vx;
        this.timer++;
        this.y += Math.sin(this.timer * 0.1) * 0.5;
        if (this.x < 0) this.dead = true;
    }

    draw(ctx, cameraX) {
        window.sprites.draw(ctx, 'fireball', this.x - cameraX, this.y, 16, 8);
    }
}

// Powerup Mushroom
class Mushroom extends Entity {
    constructor(x, y, type = 'mushroom') {
        super(x, y, 16, 16);
        this.type = type;
        this.vx = 1.2;
        this.spawning = true;
        this.spawnY = y - 16;
    }

    update(level) {
        if (this.spawning) {
            this.y -= 0.6;
            if (this.y <= this.spawnY) {
                this.y = this.spawnY;
                this.spawning = false;
            }
            return;
        }

        this.vy += 0.4;
        if (this.vy > 6) this.vy = 6;

        this.x += this.vx;
        if (level.collideTilesX(this)) {
            this.vx = -this.vx;
        }

        this.y += this.vy;
        level.collideTilesY(this);

        if (this.y > level.height * 16 + 32) this.dead = true;
    }

    draw(ctx, cameraX) {
        const sprite = this.type === '1up' ? 'mushroom_1up' : 'mushroom_super';
        window.sprites.draw(ctx, sprite, this.x - cameraX, this.y, 16, 16);
    }
}

// Fire Flower
class FireFlower extends Entity {
    constructor(x, y) {
        super(x, y, 16, 16);
        this.spawning = true;
        this.spawnY = y - 16;
    }

    update() {
        if (this.spawning) {
            this.y -= 0.6;
            if (this.y <= this.spawnY) {
                this.y = this.spawnY;
                this.spawning = false;
            }
        }
    }

    draw(ctx, cameraX) {
        window.sprites.draw(ctx, 'flower_0', this.x - cameraX, this.y, 16, 16);
    }
}

// Starman
class Starman extends Entity {
    constructor(x, y) {
        super(x, y, 16, 16);
        this.vx = 1.6;
        this.vy = -3.0;
        this.spawning = true;
        this.spawnY = y - 16;
    }

    update(level) {
        if (this.spawning) {
            this.y -= 0.6;
            if (this.y <= this.spawnY) {
                this.y = this.spawnY;
                this.spawning = false;
            }
            return;
        }

        this.vy += 0.38;
        if (this.vy > 6) this.vy = 6;

        this.x += this.vx;
        if (level.collideTilesX(this)) {
            this.vx = -this.vx;
        }

        this.y += this.vy;
        const collided = level.collideTilesY(this);
        if (collided && this.grounded) {
            this.vy = -4.5; // High bounce
        }

        if (this.y > level.height * 16 + 32) this.dead = true;
    }

    draw(ctx, cameraX) {
        window.sprites.draw(ctx, 'star', this.x - cameraX, this.y, 16, 16);
    }
}

// Bouncing Coin from Question Block
class BouncingCoin extends Entity {
    constructor(x, y) {
        super(x, y, 14, 14);
        this.vy = -5.5;
        this.gravity = 0.45;
        this.startY = y;
        this.frame = 0;
        window.audio.coin();
    }

    update() {
        this.vy += this.gravity;
        this.y += this.vy;
        this.frame = (this.frame + 1) % 12;
        if (this.y > this.startY && this.vy > 0) {
            this.dead = true;
        }
    }

    draw(ctx, cameraX) {
        const f = Math.floor(this.frame / 4);
        window.sprites.draw(ctx, `coin_${f}`, this.x - cameraX, this.y, 14, 14);
    }
}

// Brick Shatter Particle Debris
class BrickDebris extends Entity {
    constructor(x, y, vx, vy) {
        super(x, y, 8, 8);
        this.vx = vx;
        this.vy = vy;
    }

    update() {
        this.vy += 0.4;
        this.x += this.vx;
        this.y += this.vy;
        if (this.y > 400) this.dead = true;
    }

    draw(ctx, cameraX) {
        window.sprites.draw(ctx, 'brick_debris', this.x - cameraX, this.y, 8, 8);
    }
}

// Floating Score Numbers (e.g. "100", "200", "1000")
class FloatingText {
    constructor(text, x, y) {
        this.text = text;
        this.x = x;
        this.y = y;
        this.life = 45;
    }

    update() {
        this.y -= 0.7;
        this.life--;
    }

    draw(ctx, cameraX) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '8px "Press Start 2P", monospace, sans-serif';
        ctx.fillText(this.text, Math.floor(this.x - cameraX), Math.floor(this.y));
    }
}
