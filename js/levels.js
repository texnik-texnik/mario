// Super Mario Web - Level Designs & Tilemap Engine

class Level {
    constructor(data, game) {
        this.game = game;
        this.worldName = data.name || '1-1';
        this.width = data.width || 210;
        this.height = data.height || 14;
        this.theme = data.theme || 'overworld'; // overworld, underground, castle
        this.bgColor = data.bgColor || '#5c94fc';
        this.bgmTheme = data.bgmTheme || 'overworld';
        this.timeLimit = data.timeLimit || 400;

        // 2D tile grid [y][x]
        this.tiles = [];
        this.initGrid(data.tiles);

        // Entities & Interactive elements
        this.enemies = [];
        this.items = [];
        this.particles = [];
        this.floatingTexts = [];
        this.projectiles = [];

        // Scenery (clouds, bushes, hills)
        this.scenery = data.scenery || [];

        // Special positions
        this.startX = data.startX || 40;
        this.startY = data.startY || (this.height - 3) * 16;
        this.flagX = data.flagX || (this.width - 20) * 16;
        this.castleX = data.castleX || (this.width - 12) * 16;
        this.axeX = data.axeX || 0;
        this.bridgeStartX = data.bridgeStartX || 0;
        this.bridgeEndX = data.bridgeEndX || 0;

        // Block bump animations { x, y, origTile, offset, timer }
        this.bumpingBlocks = [];

        // Spawn enemies
        this.spawnEntities(data.entities || []);
    }

    initGrid(rawTiles) {
        for (let y = 0; y < this.height; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.tiles[y][x] = rawTiles[y] ? (rawTiles[y][x] || 0) : 0;
            }
        }
    }

    spawnEntities(entityDefs) {
        for (const e of entityDefs) {
            if (e.type === 'goomba') {
                this.enemies.push(new Goomba(e.x * 16, e.y * 16));
            } else if (e.type === 'koopa') {
                this.enemies.push(new Koopa(e.x * 16, e.y * 16 - 8));
            } else if (e.type === 'piranha') {
                this.enemies.push(new PiranhaPlant(e.x * 16 + 8, e.y * 16));
            } else if (e.type === 'bowser') {
                this.enemies.push(new Bowser(e.x * 16, e.y * 16 - 16));
            }
        }
    }

    isSolid(tile) {
        // Solid tiles: 1 (Ground), 2 (Brick), 3-5 (Q-Block), 6 (Empty Block), 7-10 (Pipe), 11 (Castle Wall), 18 (Bridge)
        return (tile >= 1 && tile <= 11) || tile === 18;
    }

    getTile(tx, ty) {
        if (ty < 0 || ty >= this.height || tx < 0 || tx >= this.width) return 0;
        return this.tiles[ty][tx];
    }

    setTile(tx, ty, val) {
        if (ty >= 0 && ty < this.height && tx >= 0 && tx < this.width) {
            this.tiles[ty][tx] = val;
        }
    }

    // Horizontal collision
    collideTilesX(entity) {
        const left = Math.floor(entity.x / 16);
        const right = Math.floor((entity.x + entity.width - 0.01) / 16);
        const top = Math.floor(entity.y / 16);
        const bottom = Math.floor((entity.y + entity.height - 0.01) / 16);

        for (let ty = top; ty <= bottom; ty++) {
            for (let tx = left; tx <= right; tx++) {
                const tile = this.getTile(tx, ty);
                if (this.isSolid(tile)) {
                    if (entity.vx > 0) {
                        entity.x = tx * 16 - entity.width;
                        entity.vx = 0;
                        return true;
                    } else if (entity.vx < 0) {
                        entity.x = (tx + 1) * 16;
                        entity.vx = 0;
                        return true;
                    }
                }
            }
        }
        return false;
    }

    // Vertical collision
    collideTilesY(entity) {
        const left = Math.floor(entity.x / 16);
        const right = Math.floor((entity.x + entity.width - 0.01) / 16);
        const top = Math.floor(entity.y / 16);
        const bottom = Math.floor((entity.y + entity.height - 0.01) / 16);

        entity.grounded = false;

        for (let ty = top; ty <= bottom; ty++) {
            for (let tx = left; tx <= right; tx++) {
                const tile = this.getTile(tx, ty);
                if (this.isSolid(tile)) {
                    if (entity.vy > 0) {
                        // Landing on top of tile
                        entity.y = ty * 16 - entity.height;
                        entity.vy = 0;
                        entity.grounded = true;
                        if (entity.isGrounded !== undefined) entity.isGrounded = true;
                        return true;
                    } else if (entity.vy < 0) {
                        // Hitting tile from below
                        entity.y = (ty + 1) * 16;
                        entity.vy = 0;
                        if (entity instanceof Player) {
                            this.hitBlockFromBelow(tx, ty, entity);
                        }
                        return true;
                    }
                }
            }
        }
        return false;
    }

    hitBlockFromBelow(tx, ty, player) {
        const tile = this.getTile(tx, ty);

        // Question block with Coin (3)
        if (tile === 3) {
            this.setTile(tx, ty, 6); // turn into empty block
            this.bumpBlock(tx, ty);
            this.items.push(new BouncingCoin(tx * 16 + 1, ty * 16 - 16));
            this.game.addScore(200, tx * 16, ty * 16 - 16);
            this.game.addCoin();
        }
        // Question block with Powerup (4)
        else if (tile === 4) {
            this.setTile(tx, ty, 6);
            this.bumpBlock(tx, ty);
            window.audio.powerupSpawn();
            if (player.state === 'small') {
                this.items.push(new Mushroom(tx * 16, ty * 16, 'mushroom'));
            } else {
                this.items.push(new FireFlower(tx * 16, ty * 16));
            }
        }
        // Question block with Star (5)
        else if (tile === 5) {
            this.setTile(tx, ty, 6);
            this.bumpBlock(tx, ty);
            window.audio.powerupSpawn();
            this.items.push(new Starman(tx * 16, ty * 16));
        }
        // Breakable Brick Block (2)
        else if (tile === 2) {
            if (player.state !== 'small') {
                // Break brick into 4 fragments!
                this.setTile(tx, ty, 0);
                window.audio.brick();
                this.game.addScore(50, tx * 16, ty * 16);
                const bx = tx * 16;
                const by = ty * 16;
                this.particles.push(new BrickDebris(bx, by, -1.8, -5.0));
                this.particles.push(new BrickDebris(bx + 8, by, 1.8, -5.0));
                this.particles.push(new BrickDebris(bx, by + 8, -1.5, -3.2));
                this.particles.push(new BrickDebris(bx + 8, by + 8, 1.5, -3.2));
            } else {
                // Small Mario bumps brick
                this.bumpBlock(tx, ty);
                window.audio.bump();
            }
        } else if (tile === 6) {
            // Already hit empty block
            window.audio.bump();
        }
    }

    bumpBlock(tx, ty) {
        this.bumpingBlocks.push({
            tx,
            ty,
            offset: -6,
            timer: 8
        });
    }

    collapseBridge() {
        if (this.bridgeStartX && this.bridgeEndX) {
            window.audio.bossFall();
            for (let x = this.bridgeStartX; x <= this.bridgeEndX; x++) {
                setTimeout(() => {
                    this.setTile(x, 11, 0);
                    this.particles.push(new BrickDebris(x * 16, 11 * 16, 0, 1.5));
                }, (this.bridgeEndX - x) * 120);
            }
        }
    }

    update() {
        // Update bumping blocks
        for (let i = this.bumpingBlocks.length - 1; i >= 0; i--) {
            const b = this.bumpingBlocks[i];
            b.timer--;
            if (b.timer <= 0) {
                this.bumpingBlocks.splice(i, 1);
            } else {
                b.offset = Math.sin((b.timer / 8) * Math.PI) * -6;
            }
        }

        // Update items
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            item.update(this);
            if (item.dead) this.items.splice(i, 1);
        }

        // Update enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            if (enemy instanceof PiranhaPlant) {
                enemy.update(this.game.player);
            } else if (enemy instanceof Bowser) {
                enemy.update(this, this.game.player, this.projectiles);
            } else {
                enemy.update(this);
            }
            if (enemy.dead) this.enemies.splice(i, 1);
        }

        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.update(this);
            if (p.dead) this.projectiles.splice(i, 1);
        }

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const part = this.particles[i];
            part.update();
            if (part.dead) this.particles.splice(i, 1);
        }

        // Update floating score numbers
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.update();
            if (ft.life <= 0) this.floatingTexts.splice(i, 1);
        }
    }

    draw(ctx, cameraX, viewWidth, viewHeight) {
        // 1. Sky / Background
        ctx.fillStyle = this.bgColor;
        ctx.fillRect(0, 0, viewWidth, viewHeight);

        // 2. Background Scenery (Clouds, hills, bushes)
        this.drawScenery(ctx, cameraX);

        // 3. Tilemap
        const startCol = Math.max(0, Math.floor(cameraX / 16) - 1);
        const endCol = Math.min(this.width, Math.ceil((cameraX + viewWidth) / 16) + 1);

        for (let y = 0; y < this.height; y++) {
            for (let x = startCol; x < endCol; x++) {
                const tile = this.tiles[y][x];
                if (tile === 0) continue;

                let drawY = y * 16;
                // Check if block is currently bumping
                const bump = this.bumpingBlocks.find(b => b.tx === x && b.ty === y);
                if (bump) {
                    drawY += bump.offset;
                }

                const drawX = x * 16 - cameraX;
                this.drawTile(ctx, tile, drawX, drawY);
            }
        }

        // 4. Flagpole & Castle details if in view
        this.drawGoal(ctx, cameraX);

        // 5. Items
        for (const item of this.items) {
            item.draw(ctx, cameraX);
        }

        // 6. Enemies
        for (const enemy of this.enemies) {
            if (enemy.x > cameraX - 32 && enemy.x < cameraX + viewWidth + 32) {
                enemy.draw(ctx, cameraX);
            }
        }

        // 7. Projectiles
        for (const p of this.projectiles) {
            p.draw(ctx, cameraX);
        }

        // 8. Particles & Scores
        for (const part of this.particles) {
            part.draw(ctx, cameraX);
        }
        for (const ft of this.floatingTexts) {
            ft.draw(ctx, cameraX);
        }
    }

    drawTile(ctx, tile, x, y) {
        const theme = this.theme;
        switch (tile) {
            case 1: // Ground
                window.sprites.draw(ctx, `ground_${theme}`, x, y, 16, 16);
                break;
            case 2: // Brick
                window.sprites.draw(ctx, `brick_${theme}`, x, y, 16, 16);
                break;
            case 3: // Question block (coin)
            case 4: // Question block (powerup)
            case 5: // Question block (star)
                const animFrame = Math.floor(Date.now() / 250) % 2;
                window.sprites.draw(ctx, `qblock_${animFrame}`, x, y, 16, 16);
                break;
            case 6: // Empty block
                window.sprites.draw(ctx, 'qblock_empty', x, y, 16, 16);
                break;
            case 7: // Pipe top
                window.sprites.draw(ctx, 'pipe_top', x, y, 32, 16);
                break;
            case 9: // Pipe body
                window.sprites.draw(ctx, 'pipe_body', x, y, 32, 16);
                break;
            case 11: // Castle Wall Brick
                window.sprites.draw(ctx, 'castle_brick', x, y, 16, 16);
                break;
            case 12: // Castle Door
                window.sprites.draw(ctx, 'castle_door', x, y, 16, 16);
                break;
            case 18: // Castle Bridge
                ctx.fillStyle = '#b84418';
                ctx.fillRect(x, y, 16, 16);
                ctx.fillStyle = '#fc9838';
                ctx.fillRect(x + 2, y + 2, 12, 12);
                break;
        }
    }

    drawScenery(ctx, cameraX) {
        if (this.theme === 'underground') return;

        if (this.theme === 'overworld') {
            // Clouds
            for (let i = 0; i < this.width * 16; i += 320) {
                const cx = i - cameraX * 0.5;
                this.drawCloud(ctx, cx + 50, 40);
                this.drawCloud(ctx, cx + 220, 25);
            }

            // Hills and Bushes
            for (let i = 0; i < this.width * 16; i += 360) {
                const hx = i - cameraX * 0.8;
                this.drawHill(ctx, hx + 30, (this.height - 2) * 16);
                this.drawBush(ctx, hx + 160, (this.height - 2) * 16);
            }
        }
    }

    drawCloud(ctx, x, y) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x + 12, y + 8, 8, 0, Math.PI * 2);
        ctx.arc(x + 22, y + 5, 10, 0, Math.PI * 2);
        ctx.arc(x + 32, y + 8, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(x + 10, y + 8, 24, 8);
    }

    drawHill(ctx, x, groundY) {
        ctx.fillStyle = '#00a800';
        ctx.beginPath();
        ctx.arc(x + 32, groundY, 32, Math.PI, 0);
        ctx.fill();
        ctx.strokeStyle = '#005000';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    drawBush(ctx, x, groundY) {
        ctx.fillStyle = '#80d010';
        ctx.beginPath();
        ctx.arc(x + 10, groundY, 10, Math.PI, 0);
        ctx.arc(x + 20, groundY, 12, Math.PI, 0);
        ctx.arc(x + 30, groundY, 10, Math.PI, 0);
        ctx.fill();
    }

    drawGoal(ctx, cameraX) {
        // Flagpole
        if (this.flagX) {
            const fx = this.flagX - cameraX;
            const topY = 3 * 16;
            const bottomY = (this.height - 2) * 16;

            // Pole shaft
            for (let py = topY + 16; py < bottomY; py += 16) {
                window.sprites.draw(ctx, 'flag_pole', fx, py, 16, 16);
            }
            // Pole top ball
            window.sprites.draw(ctx, 'flag_top', fx, topY, 16, 16);

            // Flag cloth
            const flagY = this.game.player.flagSliding ? this.game.player.y : topY + 10;
            window.sprites.draw(ctx, 'flag', fx - 16, flagY, 16, 16);
        }

        // Castle
        if (this.castleX) {
            const cx = this.castleX - cameraX;
            const cy = (this.height - 7) * 16;
            // Draw 5x5 castle structure
            for (let r = 0; r < 5; r++) {
                for (let c = 0; c < 5; c++) {
                    const bx = cx + c * 16;
                    const by = cy + r * 16;
                    if (r === 0 && (c === 1 || c === 3)) continue; // battlements gap
                    if (r === 4 && c === 2) {
                        window.sprites.draw(ctx, 'castle_door', bx, by, 16, 16);
                    } else {
                        window.sprites.draw(ctx, 'castle_brick', bx, by, 16, 16);
                    }
                }
            }
        }

        // Bowser Axe Trigger
        if (this.axeX) {
            const ax = this.axeX - cameraX;
            const ay = 10 * 16;
            ctx.fillStyle = '#fcd828';
            ctx.fillRect(ax + 4, ay + 2, 8, 8);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(ax + 10, ay + 4, 4, 4);
        }
    }
}

// ================= LEVEL DEFINITIONS ================= //

function buildWorld11() {
    const W = 210;
    const H = 14;
    const grid = Array.from({ length: H }, () => Array(W).fill(0));

    // Ground line
    for (let x = 0; x < W; x++) {
        // Pit gaps at x=69..71, 86..88, 153..155
        if ((x >= 69 && x <= 71) || (x >= 86 && x <= 88) || (x >= 153 && x <= 155)) {
            continue;
        }
        grid[12][x] = 1;
        grid[13][x] = 1;
    }

    // Helper: Add Pipe
    const addPipe = (px, heightTiles) => {
        const topY = 12 - heightTiles;
        grid[topY][px] = 7; // Pipe top
        grid[topY][px + 1] = 8;
        for (let y = topY + 1; y < 12; y++) {
            grid[y][px] = 9; // Pipe body
            grid[y][px + 1] = 10;
        }
    };

    // Helper: Staircase
    const addStairs = (startX, height, dir = 1) => {
        for (let step = 0; step < height; step++) {
            const x = dir === 1 ? startX + step : startX + (height - 1 - step);
            for (let y = 11; y >= 12 - (step + 1); y--) {
                grid[y][x] = 1;
            }
        }
    };

    // Mystery and Brick formations
    // Early question blocks
    grid[9][16] = 3; // Coin
    grid[9][20] = 2; // Brick
    grid[9][21] = 4; // Mushroom/Flower
    grid[9][22] = 2; // Brick
    grid[9][23] = 3; // Coin
    grid[9][24] = 2; // Brick
    grid[5][22] = 3; // High coin block

    // Pipes
    addPipe(28, 2);
    addPipe(38, 3);
    addPipe(46, 4);
    addPipe(57, 4);

    // Mid section blocks
    grid[9][64] = 2;
    grid[9][65] = 4; // Super mushroom
    grid[9][66] = 2;
    grid[5][77] = 2;
    grid[5][78] = 2;
    grid[5][79] = 2;
    grid[5][80] = 3;
    grid[5][81] = 2;

    grid[9][94] = 2;
    grid[9][95] = 2;
    grid[9][96] = 5; // Starman!
    grid[5][100] = 2;
    grid[5][101] = 3;
    grid[5][102] = 2;

    grid[9][106] = 3;
    grid[9][109] = 3;
    grid[9][112] = 3;

    // Second pipe
    addPipe(163, 2);
    addPipe(179, 2);

    // End stairs
    addStairs(134, 4, 1);
    addStairs(140, 4, -1);
    addStairs(148, 4, 1);
    addStairs(152, 4, -1);
    addStairs(181, 8, 1);

    // Flagpole base
    grid[11][198] = 1;

    // Entities
    const entities = [
        { type: 'goomba', x: 22, y: 11 },
        { type: 'goomba', x: 41, y: 11 },
        { type: 'goomba', x: 51, y: 11 },
        { type: 'goomba', x: 53, y: 11 },
        { type: 'koopa', x: 75, y: 11 },
        { type: 'goomba', x: 97, y: 11 },
        { type: 'goomba', x: 99, y: 11 },
        { type: 'koopa', x: 107, y: 11 },
        { type: 'goomba', x: 124, y: 11 },
        { type: 'goomba', x: 126, y: 11 },
        { type: 'piranha', x: 38, y: 9 },
        { type: 'piranha', x: 46, y: 8 }
    ];

    return {
        name: '1-1',
        theme: 'overworld',
        bgmTheme: 'overworld',
        bgColor: '#5c94fc',
        width: W,
        height: H,
        tiles: grid,
        entities,
        flagX: 198 * 16,
        castleX: 202 * 16,
        timeLimit: 400
    };
}

function buildWorld12() {
    const W = 190;
    const H = 14;
    const grid = Array.from({ length: H }, () => Array(W).fill(0));

    // Underground: Ground + Ceiling!
    for (let x = 0; x < W; x++) {
        // Ceiling
        grid[0][x] = 1;
        grid[1][x] = 1;
        // Ground
        if (x < 170) {
            grid[12][x] = 1;
            grid[13][x] = 1;
        }
    }

    // Brick platforms and coin formations
    for (let x = 10; x < 25; x++) {
        grid[8][x] = 2;
    }
    grid[5][15] = 3;
    grid[5][16] = 4;
    grid[5][17] = 3;

    // Underground pipes
    const addUgPipe = (px, heightTiles) => {
        const topY = 12 - heightTiles;
        grid[topY][px] = 7;
        grid[topY][px + 1] = 8;
        for (let y = topY + 1; y < 12; y++) {
            grid[y][px] = 9;
            grid[y][px + 1] = 10;
        }
    };

    addUgPipe(35, 3);
    addUgPipe(48, 4);
    addUgPipe(62, 2);

    for (let x = 70; x < 85; x++) {
        grid[9][x] = 2;
        if (x % 2 === 0) grid[5][x] = 3;
    }

    addUgPipe(105, 3);
    addUgPipe(120, 4);

    // Warp zone stairs at end
    for (let s = 0; s < 6; s++) {
        for (let y = 11; y >= 12 - (s + 1); y--) {
            grid[y][150 + s] = 1;
        }
    }

    // Flagpole outside exit
    for (let x = 170; x < W; x++) {
        grid[12][x] = 1;
        grid[13][x] = 1;
        grid[0][x] = 0;
        grid[1][x] = 0;
    }
    grid[11][178] = 1;

    const entities = [
        { type: 'goomba', x: 18, y: 11 },
        { type: 'koopa', x: 26, y: 11 },
        { type: 'goomba', x: 55, y: 11 },
        { type: 'koopa', x: 74, y: 8 },
        { type: 'goomba', x: 92, y: 11 },
        { type: 'goomba', x: 94, y: 11 },
        { type: 'piranha', x: 48, y: 8 },
        { type: 'piranha', x: 120, y: 8 }
    ];

    return {
        name: '1-2',
        theme: 'underground',
        bgmTheme: 'underground',
        bgColor: '#000000',
        width: W,
        height: H,
        tiles: grid,
        entities,
        flagX: 178 * 16,
        castleX: 182 * 16,
        timeLimit: 400
    };
}

function buildWorld13() {
    const W = 180;
    const H = 14;
    const grid = Array.from({ length: H }, () => Array(W).fill(0));

    // Athletic Treetop World - Floating platforms over void
    const addPlatform = (startX, length, y) => {
        for (let x = startX; x < startX + length; x++) {
            grid[y][x] = 2;
        }
    };

    // Starting ground
    for (let x = 0; x < 15; x++) {
        grid[12][x] = 1;
        grid[13][x] = 1;
    }

    addPlatform(18, 6, 10);
    grid[6][21] = 4; // Powerup

    addPlatform(28, 8, 8);
    grid[5][31] = 3;
    grid[5][33] = 3;

    addPlatform(40, 5, 10);
    addPlatform(48, 6, 6);
    grid[3][50] = 5; // Starman!

    addPlatform(58, 10, 8);
    addPlatform(72, 5, 11);
    addPlatform(81, 7, 7);
    addPlatform(92, 6, 9);
    addPlatform(102, 8, 6);
    addPlatform(114, 5, 9);
    addPlatform(123, 7, 7);

    // End platform + Flagpole
    for (let x = 135; x < W; x++) {
        grid[12][x] = 1;
        grid[13][x] = 1;
    }
    grid[11][165] = 1;

    const entities = [
        { type: 'koopa', x: 32, y: 7 },
        { type: 'goomba', x: 62, y: 7 },
        { type: 'koopa', x: 84, y: 6 },
        { type: 'goomba', x: 105, y: 5 },
        { type: 'koopa', x: 125, y: 6 }
    ];

    return {
        name: '1-3',
        theme: 'overworld',
        bgmTheme: 'overworld',
        bgColor: '#5c94fc',
        width: W,
        height: H,
        tiles: grid,
        entities,
        flagX: 165 * 16,
        castleX: 170 * 16,
        timeLimit: 300
    };
}

function buildWorld14() {
    const W = 160;
    const H = 14;
    const grid = Array.from({ length: H }, () => Array(W).fill(0));

    // Bowser's Castle - Dark theme, lava pits, bridge
    for (let x = 0; x < W; x++) {
        // Ceiling
        grid[0][x] = 11;
        grid[1][x] = 11;

        // Ground with Lava Gaps
        if ((x >= 35 && x <= 45) || (x >= 70 && x <= 80) || (x >= 110 && x <= 135)) {
            // Lava pit
            grid[13][x] = 16;
            continue;
        }
        grid[12][x] = 11;
        grid[13][x] = 11;
    }

    // Castle block obstacles & powerups
    grid[8][15] = 4; // Mushroom/Flower
    grid[8][16] = 11;
    grid[8][17] = 11;

    // Platforms over lava
    for (let x = 38; x <= 42; x++) grid[8][x] = 11;
    for (let x = 73; x <= 77; x++) grid[8][x] = 11;

    // Bowser Bridge (x=115..130)
    for (let x = 115; x <= 130; x++) {
        grid[11][x] = 18; // Castle Bridge tile
    }

    // Axe switch behind bridge
    grid[10][133] = 17; // Axe

    // Princess chamber
    for (let x = 136; x < W; x++) {
        grid[12][x] = 11;
        grid[13][x] = 11;
    }

    const entities = [
        { type: 'bowser', x: 126, y: 11 }
    ];

    return {
        name: '1-4',
        theme: 'castle',
        bgmTheme: 'castle',
        bgColor: '#000000',
        width: W,
        height: H,
        tiles: grid,
        entities,
        axeX: 133 * 16,
        bridgeStartX: 115,
        bridgeEndX: 130,
        flagX: 0,
        castleX: 0,
        timeLimit: 300
    };
}

window.LevelManager = {
    getLevel(worldIndex) {
        switch (worldIndex) {
            case 0: return buildWorld11();
            case 1: return buildWorld12();
            case 2: return buildWorld13();
            case 3: return buildWorld14();
            default: return buildWorld11();
        }
    }
};
