// Super Mario 3D - Level Generator & World Layouts
// Creates complete 3D levels with platforms, blocks, enemies, items, pipes, and bosses.

class Level3D {
    constructor(worldIndex, scene, particleSystem) {
        this.worldIndex = worldIndex;
        this.scene = scene;
        this.particles = particleSystem;

        // Level collections
        this.platforms = [];
        this.colliders = [];
        this.blocks = [];
        this.coins = [];
        this.items = [];
        this.enemies = [];
        this.fireballs = [];
        this.movingPlatforms = [];
        this.firebars = [];
        this.flagpole = null;
        this.bowser = null;
        this.axeSwitch = null;
        this.bridgeMeshes = [];
        this.castleMesh = null;
        this.clouds = [];

        // Level theme properties
        this.name = "1-1";
        this.title = "Зеленые Холмы 3D";
        this.bgmTheme = 'overworld';
        this.skyColor = 0x5c94fc;
        this.fogColor = 0xb0d0ff;
        this.spawnPoint = new THREE.Vector3(0, 2, 0);
        this.timeLimit = 400;

        // Shared materials
        this.initMaterials();

        // Build specific world
        this.buildWorld(worldIndex);
    }

    initMaterials() {
        this.grassTopTex = World3DHelper.createGrassTopTexture();
        this.dirtSideTex = World3DHelper.createDirtSideTexture();

        this.grassMat = new THREE.MeshLambertMaterial({
            map: this.grassTopTex
        });

        this.platformMat = [
            new THREE.MeshLambertMaterial({ map: this.dirtSideTex }), // px
            new THREE.MeshLambertMaterial({ map: this.dirtSideTex }), // nx
            new THREE.MeshLambertMaterial({ map: this.grassTopTex }),  // py (top)
            new THREE.MeshLambertMaterial({ color: 0x5a2d0c }),       // ny (bottom)
            new THREE.MeshLambertMaterial({ map: this.dirtSideTex }), // pz
            new THREE.MeshLambertMaterial({ map: this.dirtSideTex })  // nz
        ];

        this.stoneMat = new THREE.MeshStandardMaterial({
            color: 0x484858,
            roughness: 0.7
        });

        this.lavaMat = new THREE.MeshBasicMaterial({
            color: 0xff3300
        });

        this.woodMat = new THREE.MeshLambertMaterial({
            color: 0x9b5a2b
        });
    }

    // Helper: add solid platform box
    addPlatform(x, y, z, w, h, d, material = this.platformMat) {
        const geo = new THREE.BoxGeometry(w, h, d);
        const mesh = new THREE.Mesh(geo, material);
        mesh.position.set(x, y + h * 0.5, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);

        const collider = {
            mesh,
            box: new THREE.Box3().setFromCenterAndSize(mesh.position, new THREE.Vector3(w, h, d)),
            isPlatform: true
        };
        this.colliders.push(collider);
        this.platforms.push(collider);
        return mesh;
    }

    // Helper: add cartoon 3D cloud
    addCloud(x, y, z, scale = 1.0) {
        const cloudGroup = new THREE.Group();
        cloudGroup.position.set(x, y, z);
        const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });

        const p1 = new THREE.Mesh(new THREE.SphereGeometry(1.2 * scale, 8, 6), mat);
        p1.scale.set(1.5, 0.8, 1.0);
        cloudGroup.add(p1);

        const p2 = new THREE.Mesh(new THREE.SphereGeometry(0.9 * scale, 8, 6), mat);
        p2.position.set(-1.0 * scale, 0.2 * scale, 0);
        cloudGroup.add(p2);

        const p3 = new THREE.Mesh(new THREE.SphereGeometry(0.9 * scale, 8, 6), mat);
        p3.position.set(1.0 * scale, 0.2 * scale, 0);
        cloudGroup.add(p3);

        this.scene.add(cloudGroup);
        this.clouds.push(cloudGroup);
    }

    // Helper: create Mushroom Kingdom Castle at level end
    addCastle(x, y, z) {
        const castleGroup = new THREE.Group();
        castleGroup.position.set(x, y, z);

        const brickTex = World3DHelper.createBrickTexture();
        const wallMat = new THREE.MeshLambertMaterial({ map: brickTex });
        const roofMat = new THREE.MeshLambertMaterial({ color: 0xd82800 });

        // Main Keep
        const keep = new THREE.Mesh(new THREE.BoxGeometry(6, 6, 6), wallMat);
        keep.position.y = 3;
        keep.castShadow = true;
        castleGroup.add(keep);

        // Entrance Gate Arch
        const gate = new THREE.Mesh(new THREE.BoxGeometry(2, 3, 0.4), new THREE.MeshBasicMaterial({ color: 0x000000 }));
        gate.position.set(0, 1.5, 3.01);
        castleGroup.add(gate);

        // 4 Corner Towers
        const towerGeo = new THREE.CylinderGeometry(0.8, 0.8, 8, 8);
        const roofGeo = new THREE.ConeGeometry(1.2, 2.0, 8);

        const offsets = [[-3, -3], [3, -3], [-3, 3], [3, 3]];
        offsets.forEach(([tx, tz]) => {
            const tower = new THREE.Mesh(towerGeo, wallMat);
            tower.position.set(tx, 4, tz);
            tower.castShadow = true;
            castleGroup.add(tower);

            const roof = new THREE.Mesh(roofGeo, roofMat);
            roof.position.set(tx, 9, tz);
            roof.castShadow = true;
            castleGroup.add(roof);
        });

        // Center High Tower
        const centerTower = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 10, 8), wallMat);
        centerTower.position.set(0, 5, 0);
        castleGroup.add(centerTower);

        const centerRoof = new THREE.Mesh(new THREE.ConeGeometry(1.8, 2.5, 8), roofMat);
        centerRoof.position.set(0, 11, 0);
        castleGroup.add(centerRoof);

        this.scene.add(castleGroup);
        this.castleMesh = castleGroup;
    }

    buildWorld(idx) {
        if (idx === 0) this.buildWorld1();
        else if (idx === 1) this.buildWorld2();
        else if (idx === 2) this.buildWorld3();
    }

    // ==============================================================
    // WORLD 1-1: 3D Mushroom Plains (Зеленые Холмы)
    // ==============================================================
    buildWorld1() {
        this.name = "1-1";
        this.title = "Зеленые Холмы 3D";
        this.bgmTheme = 'overworld';
        this.skyColor = 0x5c94fc;
        this.fogColor = 0xb5d4fc;
        this.spawnPoint.set(0, 1.5, 0);

        // Floating Clouds
        for (let i = 0; i < 15; i++) {
            this.addCloud(i * 14 - 10, 14 + Math.sin(i) * 3, (Math.random() - 0.5) * 20, 1.0 + Math.random() * 0.5);
        }

        // Section 1: Starting Area
        this.addPlatform(12, 0, 0, 30, 2, 8); // Start lawn [ -3 to 27 ]

        // Question block with Coin
        const q1 = new QuestionBlock3D(8, 4.5, 0, 'coin');
        this.blocks.push(q1);
        this.colliders.push(q1);
        this.scene.add(q1.group);

        // Question block with Super Mushroom!
        const q2 = new QuestionBlock3D(12, 4.5, 0, 'mushroom');
        this.blocks.push(q2);
        this.colliders.push(q2);
        this.scene.add(q2.group);

        // Brick blocks row
        const b1 = new BrickBlock3D(10, 4.5, 0);
        const b2 = new BrickBlock3D(14, 4.5, 0, 'coin');
        [b1, b2].forEach(b => {
            this.blocks.push(b);
            this.colliders.push(b);
            this.scene.add(b.group);
        });

        // Floating Coins arc
        for (let i = 0; i < 5; i++) {
            const coin = new Coin3D(4 + i * 1.5, 3.5 + Math.sin(i / 4 * Math.PI) * 1.5, 0);
            this.coins.push(coin);
            this.scene.add(coin.group);
        }

        // First Goomba
        const g1 = new Goomba3D(18, 2.0, 0, 4);
        this.enemies.push(g1);
        this.scene.add(g1.group);

        // Green Pipe 1
        const p1 = new WarpPipe3D(23, 2.0, 0, 2.2);
        this.colliders.push(p1);
        this.scene.add(p1.group);

        // Section 2: Small chasm with stepping platforms
        this.addPlatform(36, 0, 0, 10, 2, 8);

        // Question block with Fire Flower
        const q3 = new QuestionBlock3D(36, 5.0, 0, 'flower');
        this.blocks.push(q3);
        this.colliders.push(q3);
        this.scene.add(q3.group);

        // Koopa Troopa patrolling
        const k1 = new Koopa3D(37, 2.0, 0, 3.5);
        this.enemies.push(k1);
        this.scene.add(k1.group);

        // Section 3: High Elevated Island with stairs
        this.addPlatform(48, 1, 0, 8, 4, 8);
        this.addPlatform(56, 3, 0, 6, 8, 8);

        // Coins on elevated island
        for (let i = 0; i < 4; i++) {
            const coin = new Coin3D(46 + i * 2, 4.5, 0);
            this.coins.push(coin);
            this.scene.add(coin.group);
        }

        // Two Goombas on high island
        const g2 = new Goomba3D(55, 7.0, -1, 2);
        const g3 = new Goomba3D(56, 7.0, 1, 2);
        [g2, g3].forEach(g => {
            this.enemies.push(g);
            this.scene.add(g.group);
        });

        // Section 4: Chasm with Moving Platform
        const mp1 = new MovingPlatform3D(65, 5, 0, 3.5, 3.5, 'x', 4, 1.8);
        this.movingPlatforms.push(mp1);
        this.colliders.push(mp1);
        this.scene.add(mp1.group);

        // Star block on moving platform path
        const qStar = new QuestionBlock3D(65, 8.5, 0, 'star');
        this.blocks.push(qStar);
        this.colliders.push(qStar);
        this.scene.add(qStar.group);

        // Section 5: Goal Run & Castle Lawn
        this.addPlatform(88, 0, 0, 32, 2, 10);

        // Pyramid Stairs up to flagpole
        for (let step = 0; step < 5; step++) {
            this.addPlatform(78 + step * 1.5, 1 + step * 0.8, 0, 1.5, (step + 1) * 0.8, 6, this.platformMat);
        }

        // Goomba guarding the stairs
        const g4 = new Goomba3D(88, 2.0, 0, 3);
        this.enemies.push(g4);
        this.scene.add(g4.group);

        // Flagpole at X = 95
        this.flagpole = new FlagPole3D(95, 2.0, 0);
        this.colliders.push(this.flagpole);
        this.scene.add(this.flagpole.group);

        // End Castle at X = 108
        this.addCastle(108, 2.0, 0);
    }

    // ==============================================================
    // WORLD 1-2: 3D Sky Islands & Caverns (Парящие Острова)
    // ==============================================================
    buildWorld2() {
        this.name = "1-2";
        this.title = "Парящие Острова 3D";
        this.bgmTheme = 'underground';
        this.skyColor = 0x2e1a47; // Twilight purple
        this.fogColor = 0x482d6e;
        this.spawnPoint.set(0, 3, 0);

        // Fluffy clouds beneath islands
        for (let i = 0; i < 20; i++) {
            this.addCloud(i * 10 - 15, -4, (Math.random() - 0.5) * 25, 2.0);
        }

        // Island 1: Start Base
        this.addPlatform(6, 1, 0, 16, 3, 10);

        // Coins circle
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
            const coin = new Coin3D(6 + Math.cos(a) * 3, 3.5, Math.sin(a) * 3);
            this.coins.push(coin);
            this.scene.add(coin.group);
        }

        // Question block with Flower
        const q1 = new QuestionBlock3D(6, 6.0, 0, 'flower');
        this.blocks.push(q1);
        this.colliders.push(q1);
        this.scene.add(q1.group);

        // Island 2: Vertical Elevator
        const vElevator = new MovingPlatform3D(18, 4, 0, 4, 4, 'y', 3.5, 1.5);
        this.movingPlatforms.push(vElevator);
        this.colliders.push(vElevator);
        this.scene.add(vElevator.group);

        // Island 3: High Sky Island
        this.addPlatform(30, 6, 0, 14, 2, 8);

        // Pipe with Piranha Plant
        const p1 = new WarpPipe3D(28, 8.0, 0, 2.0);
        this.colliders.push(p1);
        this.scene.add(p1.group);

        const piranha = new PiranhaPlant3D(28, 9.8, 0);
        this.enemies.push(piranha);
        this.scene.add(piranha.group);

        // Koopa on High Island
        const k1 = new Koopa3D(33, 8.0, 0, 2.5);
        this.enemies.push(k1);
        this.scene.add(k1.group);

        // Question Block with 1-UP Mushroom!
        const q1Up = new QuestionBlock3D(34, 11.0, 0, 'mushroom');
        this.blocks.push(q1Up);
        this.colliders.push(q1Up);
        this.scene.add(q1Up.group);

        // Island 4: Moving Platform horizontal over abyss
        const hMove = new MovingPlatform3D(44, 6, 0, 3.5, 3.5, 'z', 4, 2.0);
        this.movingPlatforms.push(hMove);
        this.colliders.push(hMove);
        this.scene.add(hMove.group);

        // Island 5: Long Island with Star Power
        this.addPlatform(60, 6, 0, 20, 2, 8);

        const qStar = new QuestionBlock3D(54, 9.5, 0, 'star');
        this.blocks.push(qStar);
        this.colliders.push(qStar);
        this.scene.add(qStar.group);

        // Row of Goombas to smash with Star
        for (let i = 0; i < 4; i++) {
            const g = new Goomba3D(58 + i * 2.5, 8.0, 0, 1.5);
            this.enemies.push(g);
            this.scene.add(g.group);
        }

        // Island 6: Final Approach & Flagpole
        this.addPlatform(82, 6, 0, 18, 2, 10);

        this.flagpole = new FlagPole3D(84, 8.0, 0);
        this.colliders.push(this.flagpole);
        this.scene.add(this.flagpole.group);

        this.addCastle(96, 8.0, 0);
    }

    // ==============================================================
    // WORLD 1-3: 3D Bowser's Lava Citadel (Замок Боузера)
    // ==============================================================
    buildWorld3() {
        this.name = "1-3";
        this.title = "Замок Боузера 3D";
        this.bgmTheme = 'castle';
        this.skyColor = 0x1a0505; // Dark fiery crimson
        this.fogColor = 0x3d0c0c;
        this.spawnPoint.set(0, 2, 0);

        // Giant Lava Sea underneath
        const lavaGeo = new THREE.PlaneGeometry(300, 150);
        lavaGeo.rotateX(-Math.PI / 2);
        const lava = new THREE.Mesh(lavaGeo, this.lavaMat);
        lava.position.set(50, -4, 0);
        this.scene.add(lava);

        // Castle Stone Fortress Hall
        this.addPlatform(8, 0, 0, 20, 2, 10, this.stoneMat);

        // Question block with Fire Flower
        const q1 = new QuestionBlock3D(8, 4.5, 0, 'flower');
        this.blocks.push(q1);
        this.colliders.push(q1);
        this.scene.add(q1.group);

        // Rotating Firebar 1
        this.addFirebar(14, 2.5, 0, 4);

        // Platform 2: Stepping stones over lava
        this.addPlatform(24, 0, -2, 5, 2, 5, this.stoneMat);
        this.addPlatform(33, 1, 2, 5, 2, 5, this.stoneMat);
        this.addPlatform(42, 0, 0, 6, 2, 8, this.stoneMat);

        // Rotating Firebar 2
        this.addFirebar(42, 2.5, 0, 5);

        // Coins along jumping path
        for (let i = 0; i < 6; i++) {
            const coin = new Coin3D(22 + i * 3.5, 4.0, (i % 2 === 0 ? -2 : 2));
            this.coins.push(coin);
            this.scene.add(coin.group);
        }

        // ================= BOWSER DRAWBRIDGE ARENA =================
        // Drawbridge platforms (collapsible when axe is hit!)
        const bridgeX = 64;
        const bridgeLen = 24;
        for (let b = 0; b < 6; b++) {
            const bMesh = this.addPlatform(bridgeX - 10 + b * 4, 0, 0, 3.8, 1.2, 7, this.woodMat);
            this.bridgeMeshes.push(bMesh);
        }

        // Boss: Bowser!
        this.bowser = new Bowser3D(68, 1.2, 0);
        this.enemies.push(this.bowser);
        this.scene.add(this.bowser.group);

        // Far Side Throne Platform
        this.addPlatform(86, 0, 0, 14, 2, 10, this.stoneMat);

        // Golden Axe Switch at X = 81 (touching it cuts bridge!)
        this.addAxeSwitch(80, 2.0, 0);

        // Princess Peach Chamber at X = 90
        this.addPrincessChamber(90, 2.0, 0);
    }

    addFirebar(x, y, z, length = 4) {
        const firebarGroup = new THREE.Group();
        firebarGroup.position.set(x, y, z);

        // Central Mount
        const center = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), this.stoneMat);
        firebarGroup.add(center);

        const balls = [];
        const ballGeo = new THREE.SphereGeometry(0.24, 8, 8);
        const ballMat = new THREE.MeshBasicMaterial({ color: 0xff3300 });

        for (let i = 1; i <= length; i++) {
            const ball = new THREE.Mesh(ballGeo, ballMat);
            ball.position.set(i * 0.7, 0, 0);
            firebarGroup.add(ball);
            balls.push(ball);
        }

        this.scene.add(firebarGroup);
        this.firebars.push({ group: firebarGroup, length, balls, angle: 0 });
    }

    addAxeSwitch(x, y, z) {
        const axeGroup = new THREE.Group();
        axeGroup.position.set(x, y, z);

        // Stand
        const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 1.2, 8), this.woodMat);
        stand.position.y = 0.6;
        axeGroup.add(stand);

        // Golden Axe Blade
        const bladeGeo = new THREE.ConeGeometry(0.6, 0.8, 4);
        bladeGeo.rotateZ(Math.PI / 2);
        const bladeMat = new THREE.MeshStandardMaterial({ color: 0xfcd828, metalness: 0.9, roughness: 0.2 });
        const blade = new THREE.Mesh(bladeGeo, bladeMat);
        blade.position.set(0.2, 1.2, 0);
        axeGroup.add(blade);

        this.scene.add(axeGroup);
        this.axeSwitch = {
            group: axeGroup,
            box: new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(x, y + 0.8, z), new THREE.Vector3(1.4, 1.8, 1.4)),
            activated: false
        };
    }

    addPrincessChamber(x, y, z) {
        const chamber = new THREE.Group();
        chamber.position.set(x, y, z);

        // Pink/Gold Arch
        const archMat = new THREE.MeshLambertMaterial({ color: 0xff69b4 });
        const base = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 0.4, 16), archMat);
        base.position.y = 0.2;
        chamber.add(base);

        // Princess Peach Model
        const peachGroup = new THREE.Group();
        peachGroup.position.set(0, 0.4, 0);

        // Pink Dress
        const dressGeo = new THREE.ConeGeometry(0.8, 1.8, 12);
        const dressMat = new THREE.MeshLambertMaterial({ color: 0xff69b4 });
        const dress = new THREE.Mesh(dressGeo, dressMat);
        dress.position.y = 0.9;
        peachGroup.add(dress);

        // Blonde Hair & Head
        const headGeo = new THREE.SphereGeometry(0.32, 10, 8);
        const skinMat = new THREE.MeshLambertMaterial({ color: 0xffcca3 });
        const head = new THREE.Mesh(headGeo, skinMat);
        head.position.y = 1.9;
        peachGroup.add(head);

        const hairGeo = new THREE.SphereGeometry(0.38, 10, 8);
        const hairMat = new THREE.MeshLambertMaterial({ color: 0xffe066 });
        const hair = new THREE.Mesh(hairGeo, hairMat);
        hair.position.set(0, 1.9, -0.08);
        peachGroup.add(hair);

        // Gold Crown
        const crownGeo = new THREE.ConeGeometry(0.2, 0.3, 5);
        const crownMat = new THREE.MeshStandardMaterial({ color: 0xfcd828, metalness: 0.8 });
        const crown = new THREE.Mesh(crownGeo, crownMat);
        crown.position.set(0, 2.3, 0);
        peachGroup.add(crown);

        chamber.add(peachGroup);
        this.scene.add(chamber);
        this.princessMesh = chamber;
    }

    // Collapse the drawbridge when axe is cut
    collapseBridge() {
        if (!this.bridgeMeshes || this.bridgeCollapsed) return;
        this.bridgeCollapsed = true;

        this.bridgeMeshes.forEach((mesh, i) => {
            setTimeout(() => {
                const colIdx = this.colliders.findIndex(c => c.mesh === mesh);
                if (colIdx >= 0) this.colliders.splice(colIdx, 1);

                // Animate falling into lava
                let fallSpeed = 0;
                const fall = () => {
                    fallSpeed += 0.8;
                    mesh.position.y -= fallSpeed * 0.05;
                    mesh.rotation.z += 0.05;
                    if (mesh.position.y > -8) requestAnimationFrame(fall);
                    else mesh.visible = false;
                };
                fall();
            }, i * 180);
        });
    }

    update(dt) {
        // Update clouds drift
        this.clouds.forEach(c => {
            c.position.x += dt * 0.4;
            if (c.position.x > 140) c.position.x = -20;
        });

        // Update Moving Platforms
        this.movingPlatforms.forEach(p => p.update(dt));

        // Update Blocks
        this.blocks.forEach(b => b.update(dt));

        // Update Coins
        this.coins.forEach(c => c.update(dt));

        // Update Items
        this.items.forEach(it => it.update(dt, this.colliders));

        // Update Fireballs
        for (let i = this.fireballs.length - 1; i >= 0; i--) {
            const fb = this.fireballs[i];
            fb.update(dt, this.colliders);
            if (!fb.alive) {
                this.scene.remove(fb.group);
                this.fireballs.splice(i, 1);
            }
        }

        // Update Firebars
        this.firebars.forEach(fb => {
            fb.angle += dt * 2.2;
            fb.group.rotation.z = fb.angle;
        });

        // Update Enemies
        this.enemies.forEach(en => {
            if (en instanceof Bowser3D) {
                en.update(dt, window.game ? window.game.playerPos : null, (fx, fy, fz, fvx, fvy, fvz) => {
                    // Bowser fires fireball
                    const fb = new Fireball3D(fx, fy, fz, fvx, fvy, fvz, true);
                    this.fireballs.push(fb);
                    this.scene.add(fb.group);
                    window.audio.fireball();
                });
            } else {
                en.update(dt, this.colliders);
            }
        });
    }
}

window.Level3D = Level3D;
