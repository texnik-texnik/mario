// Super Mario 3D - World Objects, Procedural Textures, Enemies, Items & VFX
// 100% Procedural WebGL Assets - No external image downloads needed!

class World3DHelper {
    // Generate Procedural Canvas Textures
    static createQuestionTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        // Background Golden-Orange
        const grad = ctx.createLinearGradient(0, 0, 128, 128);
        grad.addColorStop(0, '#fcd828');
        grad.addColorStop(1, '#e07b00');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 128, 128);

        // Border bevel
        ctx.strokeStyle = '#fff59d';
        ctx.lineWidth = 8;
        ctx.strokeRect(4, 4, 120, 120);

        ctx.strokeStyle = '#8a4200';
        ctx.lineWidth = 6;
        ctx.strokeRect(10, 10, 108, 108);

        // Corner rivets
        ctx.fillStyle = '#613000';
        [[18, 18], [110, 18], [18, 110], [110, 110]].forEach(([x, y]) => {
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fill();
        });

        // Question mark '?'
        ctx.fillStyle = '#613000';
        ctx.font = 'bold 74px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', 66, 68);

        ctx.fillStyle = '#ffffff';
        ctx.fillText('?', 64, 64);

        const tex = new THREE.CanvasTexture(canvas);
        tex.minFilter = THREE.LinearFilter;
        return tex;
    }

    static createEmptyBlockTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#8b5a2b';
        ctx.fillRect(0, 0, 128, 128);

        ctx.strokeStyle = '#5a3814';
        ctx.lineWidth = 10;
        ctx.strokeRect(5, 5, 118, 118);

        // Corner bolts
        ctx.fillStyle = '#3a200a';
        [[20, 20], [108, 20], [20, 108], [108, 108]].forEach(([x, y]) => {
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, Math.PI * 2);
            ctx.fill();
        });

        const tex = new THREE.CanvasTexture(canvas);
        return tex;
    }

    static createBrickTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#b84418';
        ctx.fillRect(0, 0, 128, 128);

        // Mortar lines
        ctx.fillStyle = '#421406';
        ctx.fillRect(0, 62, 128, 6);
        ctx.fillRect(62, 0, 6, 62);
        ctx.fillRect(0, 0, 6, 62);
        ctx.fillRect(30, 68, 6, 60);
        ctx.fillRect(94, 68, 6, 60);

        // Highlights on brick tops
        ctx.fillStyle = '#e86a3c';
        ctx.fillRect(6, 4, 56, 4);
        ctx.fillRect(68, 4, 56, 4);
        ctx.fillRect(6, 68, 24, 4);
        ctx.fillRect(36, 68, 58, 4);
        ctx.fillRect(100, 68, 24, 4);

        const tex = new THREE.CanvasTexture(canvas);
        return tex;
    }

    static createGrassTopTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        // Checkerboard Mario 3D Land grass
        const c1 = '#5cc62e';
        const c2 = '#4bae24';
        const size = 32;
        for (let y = 0; y < 128; y += size) {
            for (let x = 0; x < 128; x += size) {
                ctx.fillStyle = ((x / size + y / size) % 2 === 0) ? c1 : c2;
                ctx.fillRect(x, y, size, size);
            }
        }
        // Subtle grass specks
        ctx.fillStyle = '#78db47';
        for (let i = 0; i < 40; i++) {
            ctx.fillRect(Math.random() * 124, Math.random() * 124, 3, 3);
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        return tex;
    }

    static createDirtSideTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#8a5229';
        ctx.fillRect(0, 0, 128, 128);

        // Top grass trim
        ctx.fillStyle = '#5cc62e';
        ctx.fillRect(0, 0, 128, 16);
        ctx.beginPath();
        for (let x = 0; x < 128; x += 16) {
            ctx.moveTo(x, 16);
            ctx.lineTo(x + 8, 26);
            ctx.lineTo(x + 16, 16);
        }
        ctx.fill();

        // Dirt stones
        ctx.fillStyle = '#653a1a';
        for (let i = 0; i < 15; i++) {
            ctx.beginPath();
            ctx.arc(Math.random() * 110 + 10, Math.random() * 80 + 35, Math.random() * 6 + 3, 0, Math.PI * 2);
            ctx.fill();
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        return tex;
    }
}

// -------------------------------------------------------------
// Interactive 3D Question Block [ ? ]
// -------------------------------------------------------------
class QuestionBlock3D {
    constructor(x, y, z, contents = 'coin') {
        this.baseY = y;
        this.contents = contents; // 'coin', 'mushroom', 'flower', 'star'
        this.isUsed = false;
        this.isBumping = false;
        this.bumpOffset = 0;
        this.bumpVel = 0;

        this.group = new THREE.Group();
        this.group.position.set(x, y, z);

        // Materials
        if (!QuestionBlock3D.qMat) {
            const qTex = World3DHelper.createQuestionTexture();
            QuestionBlock3D.qMat = new THREE.MeshLambertMaterial({ map: qTex });
            const emptyTex = World3DHelper.createEmptyBlockTexture();
            QuestionBlock3D.emptyMat = new THREE.MeshLambertMaterial({ map: emptyTex });
        }

        const geo = new THREE.BoxGeometry(1.0, 1.0, 1.0);
        this.mesh = new THREE.Mesh(geo, QuestionBlock3D.qMat);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.group.add(this.mesh);

        // Bounding box for collisions
        this.box = new THREE.Box3();
        this.updateBox();
    }

    updateBox() {
        this.box.setFromCenterAndSize(this.group.position, new THREE.Vector3(1.0, 1.0, 1.0));
    }

    hit(fromAbove = false) {
        if (this.isUsed) {
            window.audio.bump();
            return null;
        }

        this.isUsed = true;
        this.mesh.material = QuestionBlock3D.emptyMat;
        this.isBumping = true;
        this.bumpVel = fromAbove ? -6 : 8; // Bumps upward or downward slightly

        const result = this.contents;
        if (result === 'coin') {
            window.audio.coin();
        } else {
            window.audio.powerupSpawn();
        }

        return result;
    }

    update(dt) {
        if (this.isBumping) {
            this.bumpOffset += this.bumpVel * dt;
            this.bumpVel -= 40 * dt; // gravity return

            if (this.bumpOffset <= 0) {
                this.bumpOffset = 0;
                this.isBumping = false;
            }
            this.mesh.position.y = this.bumpOffset;
            this.updateBox();
        }
    }
}

// -------------------------------------------------------------
// Interactive 3D Brick Block
// -------------------------------------------------------------
class BrickBlock3D {
    constructor(x, y, z, contains = null) {
        this.baseY = y;
        this.contains = contains; // null or 'coin'
        this.isDestroyed = false;
        this.isBumping = false;
        this.bumpOffset = 0;
        this.bumpVel = 0;

        this.group = new THREE.Group();
        this.group.position.set(x, y, z);

        if (!BrickBlock3D.brickMat) {
            const brickTex = World3DHelper.createBrickTexture();
            BrickBlock3D.brickMat = new THREE.MeshLambertMaterial({ map: brickTex });
        }

        const geo = new THREE.BoxGeometry(1.0, 1.0, 1.0);
        this.mesh = new THREE.Mesh(geo, BrickBlock3D.brickMat);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.group.add(this.mesh);

        this.box = new THREE.Box3();
        this.updateBox();
    }

    updateBox() {
        this.box.setFromCenterAndSize(this.group.position, new THREE.Vector3(1.0, 1.0, 1.0));
    }

    hit(isBig = false, fromAbove = false) {
        if (this.isDestroyed) return null;

        if (this.contains === 'coin') {
            this.contains = null;
            window.audio.coin();
            this.bump();
            return 'coin';
        }

        if (isBig || fromAbove) {
            // Shatter brick into 4 fragments
            this.isDestroyed = true;
            this.group.visible = false;
            window.audio.brick();
            return 'shatter';
        } else {
            // Small Mario bumps
            this.bump();
            window.audio.bump();
            return null;
        }
    }

    bump() {
        this.isBumping = true;
        this.bumpVel = 7;
    }

    update(dt) {
        if (this.isBumping) {
            this.bumpOffset += this.bumpVel * dt;
            this.bumpVel -= 40 * dt;
            if (this.bumpOffset <= 0) {
                this.bumpOffset = 0;
                this.isBumping = false;
            }
            this.mesh.position.y = this.bumpOffset;
            this.updateBox();
        }
    }
}

// -------------------------------------------------------------
// 3D Spinning Gold Coin
// -------------------------------------------------------------
class Coin3D {
    constructor(x, y, z) {
        this.initialY = y;
        this.group = new THREE.Group();
        this.group.position.set(x, y, z);
        this.collected = false;

        const geo = new THREE.CylinderGeometry(0.35, 0.35, 0.1, 16);
        geo.rotateZ(Math.PI / 2);
        const mat = new THREE.MeshStandardMaterial({
            color: 0xfcd828,
            metalness: 0.8,
            roughness: 0.25,
            emissive: 0x553e00
        });

        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.castShadow = true;
        this.group.add(this.mesh);

        this.time = Math.random() * 10;
        this.box = new THREE.Box3();
        this.updateBox();
    }

    updateBox() {
        this.box.setFromCenterAndSize(this.group.position, new THREE.Vector3(0.7, 0.7, 0.7));
    }

    update(dt) {
        if (this.collected) return;
        this.time += dt;
        this.mesh.rotation.y += dt * 3.5;
        this.group.position.y = this.initialY + Math.sin(this.time * 4) * 0.15;
        this.updateBox();
    }
}

// -------------------------------------------------------------
// 3D Super Mushroom Power-Up
// -------------------------------------------------------------
class Mushroom3D {
    constructor(x, y, z, type = 'super') {
        this.type = type; // 'super' (red) or '1up' (green)
        this.group = new THREE.Group();
        this.group.position.set(x, y, z);
        this.vx = 2.0;
        this.vy = 4.0;
        this.vz = 0.0;
        this.collected = false;

        // Stem
        const stemGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.3, 10);
        const stemMat = new THREE.MeshLambertMaterial({ color: 0xffeedd });
        const stem = new THREE.Mesh(stemGeo, stemMat);
        stem.position.y = 0.15;
        this.group.add(stem);

        // Cap
        const capGeo = new THREE.SphereGeometry(0.42, 12, 10);
        capGeo.scale(1.15, 0.9, 1.15);
        const capColor = type === '1up' ? 0x22b14c : 0xd82800;
        const capMat = new THREE.MeshLambertMaterial({ color: capColor });
        const cap = new THREE.Mesh(capGeo, capMat);
        cap.position.y = 0.38;
        cap.castShadow = true;
        this.group.add(cap);

        // White spots on cap
        const spotGeo = new THREE.CircleGeometry(0.12, 8);
        const spotMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        [[0, 0.55, 0.44, 0], [0.44, 0.45, 0, Math.PI / 2], [-0.44, 0.45, 0, -Math.PI / 2]].forEach(([sx, sy, sz, ry]) => {
            const spot = new THREE.Mesh(spotGeo, spotMat);
            spot.position.set(sx, sy, sz);
            spot.rotation.y = ry;
            this.group.add(spot);
        });

        this.box = new THREE.Box3();
        this.updateBox();
    }

    updateBox() {
        this.box.setFromCenterAndSize(this.group.position, new THREE.Vector3(0.8, 0.8, 0.8));
    }

    update(dt, colliders) {
        if (this.collected) return;

        this.vy -= 25 * dt; // Gravity
        this.group.position.x += this.vx * dt;
        this.group.position.y += this.vy * dt;

        // Ground check
        this.updateBox();
        for (const col of colliders) {
            if (col.box && this.box.intersectsBox(col.box)) {
                // Landed on top
                if (this.vy < 0 && this.group.position.y > col.box.max.y - 0.4) {
                    this.group.position.y = col.box.max.y;
                    this.vy = 0;
                } else if (Math.abs(this.group.position.x - col.box.getCenter(new THREE.Vector3()).x) > 0.4) {
                    // Hit wall, turn around
                    this.vx = -this.vx;
                }
            }
        }
        this.updateBox();
    }
}

// -------------------------------------------------------------
// 3D Fire Flower Power-Up
// -------------------------------------------------------------
class FireFlower3D {
    constructor(x, y, z) {
        this.group = new THREE.Group();
        this.group.position.set(x, y, z);
        this.collected = false;

        // Stem & leaves
        const stemGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.35, 8);
        const stemMat = new THREE.MeshLambertMaterial({ color: 0x22b14c });
        const stem = new THREE.Mesh(stemGeo, stemMat);
        stem.position.y = 0.18;
        this.group.add(stem);

        // Flower Petals
        const petalGeo = new THREE.SphereGeometry(0.25, 10, 8);
        this.petalMat = new THREE.MeshLambertMaterial({ color: 0xff3300 });
        const petals = new THREE.Mesh(petalGeo, this.petalMat);
        petals.position.y = 0.42;
        this.group.add(petals);

        // Flower Center
        const centerGeo = new THREE.SphereGeometry(0.14, 8, 8);
        const centerMat = new THREE.MeshLambertMaterial({ color: 0xfcd828 });
        const center = new THREE.Mesh(centerGeo, centerMat);
        center.position.set(0, 0.42, 0.14);
        this.group.add(center);

        this.time = 0;
        this.box = new THREE.Box3();
        this.updateBox();
    }

    updateBox() {
        this.box.setFromCenterAndSize(this.group.position, new THREE.Vector3(0.8, 0.8, 0.8));
    }

    update(dt) {
        if (this.collected) return;
        this.time += dt * 8;
        this.group.rotation.y += dt * 1.5;
        // Glow pulse
        const c = Math.sin(this.time) > 0 ? 0xff4500 : 0xfcd828;
        this.petalMat.color.setHex(c);
        this.updateBox();
    }
}

// -------------------------------------------------------------
// 3D Super Star Power-Up
// -------------------------------------------------------------
class Star3D {
    constructor(x, y, z) {
        this.group = new THREE.Group();
        this.group.position.set(x, y, z);
        this.vx = 3.5;
        this.vy = 6.0;
        this.collected = false;

        // 3D Star shape
        const starShape = new THREE.Shape();
        const pts = 5;
        const outerR = 0.38;
        const innerR = 0.18;
        for (let i = 0; i < pts * 2; i++) {
            const r = (i % 2 === 0) ? outerR : innerR;
            const a = (i / (pts * 2)) * Math.PI * 2 - Math.PI / 2;
            const px = Math.cos(a) * r;
            const py = Math.sin(a) * r;
            if (i === 0) starShape.moveTo(px, py);
            else starShape.lineTo(px, py);
        }
        starShape.closePath();

        const extrudeSettings = { depth: 0.15, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.04, bevelThickness: 0.04 };
        const geo = new THREE.ExtrudeGeometry(starShape, extrudeSettings);
        geo.center();
        this.mat = new THREE.MeshStandardMaterial({ color: 0xfcd828, emissive: 0x665500, roughness: 0.2, metalness: 0.5 });
        this.mesh = new THREE.Mesh(geo, this.mat);
        this.mesh.castShadow = true;
        this.group.add(this.mesh);

        this.box = new THREE.Box3();
        this.updateBox();
    }

    updateBox() {
        this.box.setFromCenterAndSize(this.group.position, new THREE.Vector3(0.8, 0.8, 0.8));
    }

    update(dt, colliders) {
        if (this.collected) return;

        this.vy -= 24 * dt;
        this.group.position.x += this.vx * dt;
        this.group.position.y += this.vy * dt;
        this.mesh.rotation.y += dt * 6;

        this.updateBox();
        for (const col of colliders) {
            if (col.box && this.box.intersectsBox(col.box)) {
                if (this.vy < 0 && this.group.position.y > col.box.max.y - 0.3) {
                    this.group.position.y = col.box.max.y;
                    this.vy = 8.5; // High bounce!
                } else if (Math.abs(this.group.position.x - col.box.getCenter(new THREE.Vector3()).x) > 0.4) {
                    this.vx = -this.vx;
                }
            }
        }
        this.updateBox();
    }
}

// -------------------------------------------------------------
// 3D Fireball (Mario or Bowser)
// -------------------------------------------------------------
class Fireball3D {
    constructor(x, y, z, vx, vy, vz, isEnemy = false) {
        this.group = new THREE.Group();
        this.group.position.set(x, y, z);
        this.vx = vx;
        this.vy = vy;
        this.vz = vz;
        this.isEnemy = isEnemy;
        this.alive = true;
        this.lifeTimer = 3.5;

        const size = isEnemy ? 0.4 : 0.22;
        const geo = new THREE.SphereGeometry(size, 8, 8);
        const mat = new THREE.MeshBasicMaterial({ color: isEnemy ? 0xff2200 : 0xff7700 });
        this.mesh = new THREE.Mesh(geo, mat);
        this.group.add(this.mesh);

        // Core glow
        const coreGeo = new THREE.SphereGeometry(size * 0.6, 6, 6);
        const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        this.mesh.add(new THREE.Mesh(coreGeo, coreMat));

        this.box = new THREE.Box3();
        this.updateBox();
    }

    updateBox() {
        this.box.setFromCenterAndSize(this.group.position, new THREE.Vector3(0.5, 0.5, 0.5));
    }

    update(dt, colliders) {
        this.lifeTimer -= dt;
        if (this.lifeTimer <= 0) {
            this.alive = false;
            return;
        }

        this.vy -= 28 * dt; // Gravity
        this.group.position.x += this.vx * dt;
        this.group.position.y += this.vy * dt;
        this.group.position.z += this.vz * dt;

        this.updateBox();

        for (const col of colliders) {
            if (col.box && this.box.intersectsBox(col.box)) {
                if (this.vy < 0 && this.group.position.y > col.box.max.y - 0.3) {
                    this.group.position.y = col.box.max.y;
                    this.vy = 6.0; // Bounce on ground!
                } else {
                    // Hit wall
                    this.alive = false;
                }
            }
        }
        this.updateBox();
    }
}

// -------------------------------------------------------------
// 3D Goomba Enemy
// -------------------------------------------------------------
class Goomba3D {
    constructor(x, y, z, patrolDistance = 5) {
        this.startX = x;
        this.patrolDistance = patrolDistance;
        this.vx = -1.6;
        this.vy = 0;
        this.isAlive = true;
        this.isSquashed = false;
        this.squashTimer = 0;

        this.group = new THREE.Group();
        this.group.position.set(x, y, z);

        this.buildMesh();

        this.box = new THREE.Box3();
        this.updateBox();
    }

    buildMesh() {
        // Brown Cap
        const capGeo = new THREE.CylinderGeometry(0.2, 0.5, 0.55, 10);
        const capMat = new THREE.MeshLambertMaterial({ color: 0x8a4513 });
        this.cap = new THREE.Mesh(capGeo, capMat);
        this.cap.position.y = 0.52;
        this.cap.castShadow = true;
        this.group.add(this.cap);

        // Body / Stem
        const bodyGeo = new THREE.CylinderGeometry(0.3, 0.22, 0.35, 10);
        const bodyMat = new THREE.MeshLambertMaterial({ color: 0xffe4b5 });
        this.body = new THREE.Mesh(bodyGeo, bodyMat);
        this.body.position.y = 0.2;
        this.group.add(this.body);

        // Angry Eyebrows & Eyes
        const eyeGeo = new THREE.BoxGeometry(0.06, 0.16, 0.04);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
        const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        leftEye.position.set(-0.14, 0.38, 0.42);
        leftEye.rotation.z = -0.3;
        this.group.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
        rightEye.position.set(0.14, 0.38, 0.42);
        rightEye.rotation.z = 0.3;
        this.group.add(rightEye);

        // Two Fangs
        const fangGeo = new THREE.ConeGeometry(0.04, 0.1, 4);
        const fangMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const leftFang = new THREE.Mesh(fangGeo, fangMat);
        leftFang.position.set(-0.08, 0.16, 0.28);
        this.group.add(leftFang);
        const rightFang = new THREE.Mesh(fangGeo, fangMat);
        rightFang.position.set(0.08, 0.16, 0.28);
        this.group.add(rightFang);

        // Feet (two black rounded feet that waddle)
        const footGeo = new THREE.SphereGeometry(0.14, 8, 6);
        footGeo.scale(1.2, 0.6, 1.4);
        const footMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
        this.leftFoot = new THREE.Mesh(footGeo, footMat);
        this.leftFoot.position.set(-0.24, 0.08, 0);
        this.group.add(this.leftFoot);

        this.rightFoot = new THREE.Mesh(footGeo, footMat);
        this.rightFoot.position.set(0.24, 0.08, 0);
        this.group.add(this.rightFoot);
    }

    updateBox() {
        this.box.setFromCenterAndSize(
            new THREE.Vector3(this.group.position.x, this.group.position.y + 0.4, this.group.position.z),
            new THREE.Vector3(0.85, 0.8, 0.85)
        );
    }

    stomp() {
        this.isAlive = false;
        this.isSquashed = true;
        this.group.scale.set(1.3, 0.2, 1.3); // Flat pancake
        this.group.position.y += 0.05;
        window.audio.stomp();
    }

    defeatByShellOrFire() {
        this.isAlive = false;
        this.vy = 8.0;
        this.vx = (Math.random() - 0.5) * 4;
        window.audio.kick();
    }

    update(dt, colliders) {
        if (this.isSquashed) {
            this.squashTimer += dt;
            if (this.squashTimer > 0.8) {
                this.group.visible = false;
            }
            return;
        }

        if (!this.isAlive) {
            // Defeated by shell/fire: spin and fall off
            this.vy -= 26 * dt;
            this.group.position.x += this.vx * dt;
            this.group.position.y += this.vy * dt;
            this.group.rotation.x += dt * 10;
            return;
        }

        // Patrol logic
        this.group.position.x += this.vx * dt;
        if (Math.abs(this.group.position.x - this.startX) > this.patrolDistance) {
            this.vx = -this.vx;
        }

        // Feet waddle
        const waddle = Math.sin(Date.now() * 0.012) * 0.15;
        this.leftFoot.position.y = 0.08 + Math.max(0, waddle);
        this.rightFoot.position.y = 0.08 + Math.max(0, -waddle);
        this.group.rotation.y = this.vx > 0 ? Math.PI / 2 : -Math.PI / 2;

        this.updateBox();
    }
}

// -------------------------------------------------------------
// 3D Koopa Troopa Enemy
// -------------------------------------------------------------
class Koopa3D {
    constructor(x, y, z, patrolDistance = 6) {
        this.startX = x;
        this.patrolDistance = patrolDistance;
        this.vx = -1.8;
        this.vy = 0;
        this.state = 'walk'; // 'walk', 'shell', 'sliding'
        this.isAlive = true;

        this.group = new THREE.Group();
        this.group.position.set(x, y, z);

        this.buildMesh();

        this.box = new THREE.Box3();
        this.updateBox();
    }

    buildMesh() {
        // Green Shell
        const shellGeo = new THREE.SphereGeometry(0.44, 10, 8);
        shellGeo.scale(1.0, 1.25, 0.9);
        const shellMat = new THREE.MeshLambertMaterial({ color: 0x22b14c });
        this.shell = new THREE.Mesh(shellGeo, shellMat);
        this.shell.position.y = 0.52;
        this.shell.castShadow = true;
        this.group.add(this.shell);

        // White Shell Rim
        const rimGeo = new THREE.TorusGeometry(0.42, 0.08, 6, 12);
        rimGeo.rotateX(Math.PI / 2);
        const rimMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const rim = new THREE.Mesh(rimGeo, rimMat);
        rim.position.y = 0.35;
        this.group.add(rim);

        // Yellow Head & Neck
        this.headGroup = new THREE.Group();
        this.headGroup.position.set(0, 0.72, 0.35);
        this.group.add(this.headGroup);

        const headGeo = new THREE.SphereGeometry(0.24, 8, 8);
        headGeo.scale(1.0, 1.1, 1.3);
        const skinMat = new THREE.MeshLambertMaterial({ color: 0xffd700 });
        const headMesh = new THREE.Mesh(headGeo, skinMat);
        this.headGroup.add(headMesh);

        // Cartoon Eyes
        const eyeGeo = new THREE.SphereGeometry(0.06, 6, 6);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
        const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        leftEye.position.set(-0.12, 0.1, 0.2);
        this.headGroup.add(leftEye);
        const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
        rightEye.position.set(0.12, 0.1, 0.2);
        this.headGroup.add(rightEye);

        // Orange Boots
        const bootGeo = new THREE.BoxGeometry(0.2, 0.16, 0.32);
        const bootMat = new THREE.MeshLambertMaterial({ color: 0xff7700 });
        this.leftBoot = new THREE.Mesh(bootGeo, bootMat);
        this.leftBoot.position.set(-0.2, 0.08, 0);
        this.group.add(this.leftBoot);

        this.rightBoot = new THREE.Mesh(bootGeo, bootMat);
        this.rightBoot.position.set(0.2, 0.08, 0);
        this.group.add(this.rightBoot);
    }

    updateBox() {
        const height = this.state === 'walk' ? 1.0 : 0.6;
        this.box.setFromCenterAndSize(
            new THREE.Vector3(this.group.position.x, this.group.position.y + height * 0.5, this.group.position.z),
            new THREE.Vector3(0.9, height, 0.9)
        );
    }

    stomp(marioX) {
        if (this.state === 'walk') {
            this.state = 'shell';
            this.vx = 0;
            this.headGroup.visible = false;
            this.leftBoot.visible = false;
            this.rightBoot.visible = false;
            this.shell.position.y = 0.35;
            window.audio.stomp();
        } else if (this.state === 'shell') {
            // Kick shell
            this.kick(this.group.position.x > marioX ? 1 : -1);
        } else if (this.state === 'sliding') {
            // Stop shell
            this.state = 'shell';
            this.vx = 0;
            window.audio.stomp();
        }
    }

    kick(dir) {
        this.state = 'sliding';
        this.vx = dir * 11.0;
        window.audio.kick();
    }

    update(dt, colliders) {
        if (!this.isAlive) return;

        if (this.state === 'walk') {
            this.group.position.x += this.vx * dt;
            if (Math.abs(this.group.position.x - this.startX) > this.patrolDistance) {
                this.vx = -this.vx;
            }
            this.group.rotation.y = this.vx > 0 ? Math.PI / 2 : -Math.PI / 2;
        } else if (this.state === 'sliding') {
            this.group.position.x += this.vx * dt;
            this.shell.rotation.z += this.vx * dt * 3; // Spin while sliding

            // Wall bounce
            this.updateBox();
            for (const col of colliders) {
                if (col.box && this.box.intersectsBox(col.box)) {
                    if (Math.abs(this.group.position.x - col.box.getCenter(new THREE.Vector3()).x) > 0.5) {
                        this.vx = -this.vx;
                        window.audio.bump();
                        break;
                    }
                }
            }
        }

        this.updateBox();
    }
}

// -------------------------------------------------------------
// 3D Piranha Plant (Inside Green Pipe)
// -------------------------------------------------------------
class PiranhaPlant3D {
    constructor(x, y, z) {
        this.baseY = y;
        this.group = new THREE.Group();
        this.group.position.set(x, y, z);
        this.time = 0;

        // Head (Red sphere with open white jaws and spots)
        this.headGroup = new THREE.Group();
        this.headGroup.position.y = 0.3;
        this.group.add(this.headGroup);

        const headGeo = new THREE.SphereGeometry(0.42, 10, 8);
        const headMat = new THREE.MeshLambertMaterial({ color: 0xd82800 });
        const head = new THREE.Mesh(headGeo, headMat);
        head.castShadow = true;
        this.headGroup.add(head);

        // White lips & sharp teeth
        const lipsGeo = new THREE.TorusGeometry(0.38, 0.08, 6, 12);
        const lipsMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const lips = new THREE.Mesh(lipsGeo, lipsMat);
        lips.position.set(0, 0, 0.28);
        this.headGroup.add(lips);

        // Green Stem
        const stemGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.8, 8);
        const stemMat = new THREE.MeshLambertMaterial({ color: 0x22b14c });
        const stem = new THREE.Mesh(stemGeo, stemMat);
        stem.position.y = -0.2;
        this.headGroup.add(stem);

        this.box = new THREE.Box3();
        this.updateBox();
    }

    updateBox() {
        this.box.setFromCenterAndSize(
            new THREE.Vector3(this.group.position.x, this.group.position.y + this.headGroup.position.y, this.group.position.z),
            new THREE.Vector3(0.8, 0.8, 0.8)
        );
    }

    update(dt) {
        this.time += dt * 1.8;
        // Rhythmically pops up and lowers back down
        const offset = Math.sin(this.time);
        this.headGroup.position.y = offset > 0 ? (offset * 1.1) : -0.5;
        this.updateBox();
    }
}

// -------------------------------------------------------------
// 3D Bowser Final Boss
// -------------------------------------------------------------
class Bowser3D {
    constructor(x, y, z) {
        this.startX = x;
        this.group = new THREE.Group();
        this.group.position.set(x, y, z);
        this.health = 5;
        this.isAlive = true;
        this.fireTimer = 0;
        this.jumpTimer = 0;
        this.vy = 0;

        this.buildMesh();

        this.box = new THREE.Box3();
        this.updateBox();
    }

    buildMesh() {
        this.root = new THREE.Group();
        this.root.scale.set(1.9, 1.9, 1.9);
        this.group.add(this.root);

        // Body (Yellow-Orange)
        const bodyGeo = new THREE.SphereGeometry(0.65, 12, 10);
        bodyGeo.scale(1.1, 1.2, 1.0);
        const bodyMat = new THREE.MeshLambertMaterial({ color: 0xf5a623 });
        this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        this.bodyMesh.position.y = 0.8;
        this.bodyMesh.castShadow = true;
        this.root.add(this.bodyMesh);

        // Spiked Green Shell on Back
        const shellGeo = new THREE.SphereGeometry(0.7, 12, 10);
        shellGeo.scale(0.9, 1.15, 0.7);
        const shellMat = new THREE.MeshLambertMaterial({ color: 0x1b7e36 });
        const shell = new THREE.Mesh(shellGeo, shellMat);
        shell.position.set(0, 0.85, -0.4);
        shell.castShadow = true;
        this.root.add(shell);

        // White Shell Spikes
        const spikeGeo = new THREE.ConeGeometry(0.1, 0.28, 6);
        spikeGeo.rotateX(-Math.PI / 2);
        const spikeMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
        [[0, 1.1, -0.9], [-0.28, 0.85, -0.85], [0.28, 0.85, -0.85], [0, 0.6, -0.9]].forEach(([sx, sy, sz]) => {
            const spike = new THREE.Mesh(spikeGeo, spikeMat);
            spike.position.set(sx, sy, sz);
            this.root.add(spike);
        });

        // Snout & Head
        const headGeo = new THREE.SphereGeometry(0.42, 10, 8);
        const head = new THREE.Mesh(headGeo, bodyMat);
        head.position.set(0, 1.3, 0.35);
        this.root.add(head);

        // Fiery Red Mane / Hair
        const maneGeo = new THREE.ConeGeometry(0.3, 0.65, 6);
        const maneMat = new THREE.MeshLambertMaterial({ color: 0xd82800 });
        const mane = new THREE.Mesh(maneGeo, maneMat);
        mane.position.set(0, 1.7, 0.1);
        mane.rotation.x = -0.4;
        this.root.add(mane);

        // Horns
        const hornGeo = new THREE.ConeGeometry(0.09, 0.38, 6);
        const hornMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const leftHorn = new THREE.Mesh(hornGeo, hornMat);
        leftHorn.position.set(-0.3, 1.55, 0.15);
        leftHorn.rotation.z = 0.5;
        this.root.add(leftHorn);

        const rightHorn = new THREE.Mesh(hornGeo, hornMat);
        rightHorn.position.set(0.3, 1.55, 0.15);
        rightHorn.rotation.z = -0.5;
        this.root.add(rightHorn);

        // Glowing red eyes
        const eyeGeo = new THREE.SphereGeometry(0.08, 6, 6);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        leftEye.position.set(-0.16, 1.35, 0.68);
        this.root.add(leftEye);
        const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
        rightEye.position.set(0.16, 1.35, 0.68);
        this.root.add(rightEye);
    }

    updateBox() {
        this.box.setFromCenterAndSize(
            new THREE.Vector3(this.group.position.x, this.group.position.y + 1.4, this.group.position.z),
            new THREE.Vector3(2.2, 2.6, 2.2)
        );
    }

    takeDamage() {
        this.health--;
        window.audio.bossHurt();
        if (this.health <= 0) {
            this.isAlive = false;
            window.audio.bossFall();
        }
    }

    update(dt, marioPos, onShootFireball) {
        if (!this.isAlive) {
            // Falls into lava
            this.group.position.y -= 7 * dt;
            this.root.rotation.x += dt * 3;
            return;
        }

        // Face Mario
        if (marioPos) {
            this.group.rotation.y = marioPos.x > this.group.position.x ? Math.PI / 2 : -Math.PI / 2;
        }

        // Jump cycle
        this.jumpTimer += dt;
        if (this.jumpTimer > 3.2) {
            this.jumpTimer = 0;
            this.vy = 8.0;
        }

        this.vy -= 22 * dt;
        this.group.position.y += this.vy * dt;
        if (this.group.position.y <= 0) {
            this.group.position.y = 0;
            this.vy = 0;
        }

        // Fire breath cycle
        this.fireTimer += dt;
        if (this.fireTimer > 2.2) {
            this.fireTimer = 0;
            if (onShootFireball) {
                const dir = (this.group.rotation.y > 0) ? 1 : -1;
                onShootFireball(
                    this.group.position.x + dir * 1.5,
                    this.group.position.y + 1.8,
                    this.group.position.z,
                    dir * 7.0,
                    1.5,
                    0
                );
            }
        }

        this.updateBox();
    }
}

// -------------------------------------------------------------
// 3D Flagpole & End Castle
// -------------------------------------------------------------
class FlagPole3D {
    constructor(x, y, z) {
        this.group = new THREE.Group();
        this.group.position.set(x, y, z);
        this.flagY = 9.0;
        this.isSliding = false;

        // Base Block
        const baseGeo = new THREE.BoxGeometry(1.6, 1.0, 1.6);
        const baseMat = new THREE.MeshLambertMaterial({ color: 0x22b14c });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 0.5;
        base.castShadow = true;
        this.group.add(base);

        // Pole
        const poleGeo = new THREE.CylinderGeometry(0.1, 0.1, 9.5, 12);
        const poleMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.8 });
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.y = 5.5;
        this.group.add(pole);

        // Top Ball
        const ballGeo = new THREE.SphereGeometry(0.3, 10, 8);
        const ballMat = new THREE.MeshLambertMaterial({ color: 0xfcd828 });
        const ball = new THREE.Mesh(ballGeo, ballMat);
        ball.position.y = 10.3;
        this.group.add(ball);

        // Flag
        const flagGeo = new THREE.PlaneGeometry(1.4, 0.9);
        const flagMat = new THREE.MeshLambertMaterial({ color: 0x22b14c, side: THREE.DoubleSide });
        this.flag = new THREE.Mesh(flagGeo, flagMat);
        this.flag.position.set(0.75, this.flagY, 0);
        this.group.add(this.flag);

        this.box = new THREE.Box3();
        this.updateBox();
    }

    updateBox() {
        this.box.setFromCenterAndSize(
            new THREE.Vector3(this.group.position.x, this.group.position.y + 5.0, this.group.position.z),
            new THREE.Vector3(1.2, 10.0, 1.2)
        );
    }

    slideFlag(dt) {
        if (this.flagY > 1.8) {
            this.flagY -= dt * 6.5;
            this.flag.position.y = this.flagY;
        }
    }
}

// -------------------------------------------------------------
// 3D Warp Pipe (Green Pipe)
// -------------------------------------------------------------
class WarpPipe3D {
    constructor(x, y, z, height = 2.0, isWarp = false) {
        this.group = new THREE.Group();
        this.group.position.set(x, y, z);
        this.height = height;
        this.isWarp = isWarp;

        const pipeMat = new THREE.MeshStandardMaterial({
            color: 0x00a800,
            roughness: 0.35,
            metalness: 0.15
        });

        // Main Cylinder
        const bodyGeo = new THREE.CylinderGeometry(0.9, 0.9, height, 16);
        const body = new THREE.Mesh(bodyGeo, pipeMat);
        body.position.y = height * 0.5;
        body.castShadow = true;
        body.receiveShadow = true;
        this.group.add(body);

        // Top Rim
        const rimGeo = new THREE.CylinderGeometry(1.08, 1.08, 0.5, 16);
        const rim = new THREE.Mesh(rimGeo, pipeMat);
        rim.position.y = height - 0.25;
        rim.castShadow = true;
        this.group.add(rim);

        // Dark Interior Hole
        const holeGeo = new THREE.CircleGeometry(0.85, 16);
        holeGeo.rotateX(-Math.PI / 2);
        const holeMat = new THREE.MeshBasicMaterial({ color: 0x052005 });
        const hole = new THREE.Mesh(holeGeo, holeMat);
        hole.position.y = height + 0.01;
        this.group.add(hole);

        this.box = new THREE.Box3();
        this.updateBox();
    }

    updateBox() {
        this.box.setFromCenterAndSize(
            new THREE.Vector3(this.group.position.x, this.group.position.y + this.height * 0.5, this.group.position.z),
            new THREE.Vector3(2.1, this.height, 2.1)
        );
    }
}

// -------------------------------------------------------------
// 3D Moving Platform
// -------------------------------------------------------------
class MovingPlatform3D {
    constructor(x, y, z, width = 3, depth = 3, axis = 'x', distance = 6, speed = 2.0) {
        this.basePos = new THREE.Vector3(x, y, z);
        this.axis = axis; // 'x', 'y', 'z'
        this.distance = distance;
        this.speed = speed;
        this.time = 0;
        this.vel = new THREE.Vector3();

        this.group = new THREE.Group();
        this.group.position.set(x, y, z);

        const geo = new THREE.BoxGeometry(width, 0.6, depth);
        const mat = new THREE.MeshStandardMaterial({
            color: 0xf5a623,
            roughness: 0.4
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.group.add(mesh);

        this.box = new THREE.Box3();
        this.size = new THREE.Vector3(width, 0.6, depth);
        this.updateBox();
    }

    updateBox() {
        this.box.setFromCenterAndSize(this.group.position, this.size);
    }

    update(dt) {
        this.time += dt * this.speed;
        const offset = Math.sin(this.time) * this.distance;
        const prevPos = this.group.position.clone();

        if (this.axis === 'x') this.group.position.x = this.basePos.x + offset;
        else if (this.axis === 'y') this.group.position.y = this.basePos.y + offset;
        else if (this.axis === 'z') this.group.position.z = this.basePos.z + offset;

        this.vel.copy(this.group.position).sub(prevPos);
        this.updateBox();
    }
}

// -------------------------------------------------------------
// 3D Particle & VFX System
// -------------------------------------------------------------
class ParticleSystem3D {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];

        // Geometries
        this.puffGeo = new THREE.SphereGeometry(0.15, 6, 6);
        this.puffMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });

        this.sparkGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
        this.sparkMat = new THREE.MeshBasicMaterial({ color: 0xfcd828 });

        this.brickDebrisGeo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
        this.brickDebrisMat = new THREE.MeshLambertMaterial({ color: 0xb84418 });
    }

    // Run / Jump dust puff
    createDust(x, y, z, count = 3) {
        for (let i = 0; i < count; i++) {
            const mesh = new THREE.Mesh(this.puffGeo, this.puffMat.clone());
            mesh.position.set(x + (Math.random() - 0.5) * 0.4, y + 0.1, z + (Math.random() - 0.5) * 0.4);
            mesh.scale.setScalar(Math.random() * 0.8 + 0.5);
            this.scene.add(mesh);

            this.particles.push({
                mesh,
                vx: (Math.random() - 0.5) * 1.5,
                vy: Math.random() * 1.2 + 0.5,
                vz: (Math.random() - 0.5) * 1.5,
                life: 0.35,
                maxLife: 0.35
            });
        }
    }

    // Brick shatter explosion
    createBrickShatter(x, y, z) {
        const dirs = [
            [-2.5, 6, -1], [2.5, 6, -1],
            [-2.0, 4, 1], [2.0, 4, 1]
        ];
        dirs.forEach(([vx, vy, vz]) => {
            const mesh = new THREE.Mesh(this.brickDebrisGeo, this.brickDebrisMat);
            mesh.position.set(x, y, z);
            this.scene.add(mesh);
            this.particles.push({
                mesh,
                vx, vy, vz,
                rotSpeed: Math.random() * 10,
                life: 1.2,
                maxLife: 1.2,
                gravity: 28
            });
        });
    }

    // Coin collection sparkles
    createCoinSparkles(x, y, z) {
        for (let i = 0; i < 6; i++) {
            const mesh = new THREE.Mesh(this.sparkGeo, this.sparkMat);
            mesh.position.set(x, y, z);
            this.scene.add(mesh);
            this.particles.push({
                mesh,
                vx: (Math.random() - 0.5) * 4,
                vy: Math.random() * 3 + 1,
                vz: (Math.random() - 0.5) * 4,
                life: 0.5,
                maxLife: 0.5
            });
        }
    }

    // Fireworks over castle
    createFireworks(x, y, z, color = 0xfcd828) {
        const mat = new THREE.MeshBasicMaterial({ color });
        for (let i = 0; i < 20; i++) {
            const mesh = new THREE.Mesh(this.sparkGeo, mat);
            mesh.position.set(x, y, z);
            this.scene.add(mesh);

            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const spd = Math.random() * 5 + 3;

            this.particles.push({
                mesh,
                vx: Math.sin(phi) * Math.cos(theta) * spd,
                vy: Math.cos(phi) * spd,
                vz: Math.sin(phi) * Math.sin(theta) * spd,
                life: 1.0,
                maxLife: 1.0,
                gravity: 8
            });
        }
    }

    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= dt;

            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                this.particles.splice(i, 1);
                continue;
            }

            p.mesh.position.x += p.vx * dt;
            p.mesh.position.y += p.vy * dt;
            p.mesh.position.z += p.vz * dt;

            if (p.gravity) {
                p.vy -= p.gravity * dt;
            }

            if (p.rotSpeed) {
                p.mesh.rotation.x += p.rotSpeed * dt;
                p.mesh.rotation.y += p.rotSpeed * dt;
            }

            const alpha = p.life / p.maxLife;
            if (p.mesh.material.transparent) {
                p.mesh.material.opacity = alpha;
            }
            p.mesh.scale.setScalar(alpha);
        }
    }
}

// Export to window
window.World3DHelper = World3DHelper;
window.QuestionBlock3D = QuestionBlock3D;
window.BrickBlock3D = BrickBlock3D;
window.Coin3D = Coin3D;
window.Mushroom3D = Mushroom3D;
window.FireFlower3D = FireFlower3D;
window.Star3D = Star3D;
window.Fireball3D = Fireball3D;
window.Goomba3D = Goomba3D;
window.Koopa3D = Koopa3D;
window.PiranhaPlant3D = PiranhaPlant3D;
window.Bowser3D = Bowser3D;
window.FlagPole3D = FlagPole3D;
window.WarpPipe3D = WarpPipe3D;
window.MovingPlatform3D = MovingPlatform3D;
window.ParticleSystem3D = ParticleSystem3D;
