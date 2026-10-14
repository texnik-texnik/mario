// Super Mario 3D - Mario 3D Character Model, Rigging & Procedural Animations
// Creates a highly recognizable 3D Mario model using Three.js geometries and materials.

class Mario3D {
    constructor() {
        this.group = new THREE.Group();
        this.form = 'small'; // 'small', 'super', 'fire', 'star'
        this.starTimer = 0;
        this.starRainbowHue = 0;
        this.blinkTimer = 0;
        this.isInvulnerable = false;
        this.invulnerableTimer = 0;

        // Animation state
        this.animTime = 0;
        this.animState = 'idle'; // 'idle', 'walk', 'run', 'jump', 'fall', 'crouch', 'groundPound', 'skid', 'victory', 'die'
        this.groundPoundSpin = 0;

        // Build the 3D character mesh hierarchy
        this.buildMesh();

        // Shadows
        this.createDropShadow();

        // Initial scale
        this.applyForm('small');
    }

    buildMesh() {
        // Shared Colors & Materials
        this.colors = {
            skin: 0xffcca3,
            red: 0xd82800,
            white: 0xfafafa,
            blue: 0x0f42b8,
            yellow: 0xfcd828,
            brown: 0x5a2d0c,
            black: 0x111111,
            metal: 0xdddddd
        };

        // Material cache
        this.materials = {
            skin: new THREE.MeshLambertMaterial({ color: this.colors.skin }),
            shirt: new THREE.MeshLambertMaterial({ color: this.colors.red }),
            overalls: new THREE.MeshLambertMaterial({ color: this.colors.blue }),
            cap: new THREE.MeshLambertMaterial({ color: this.colors.red }),
            capBrim: new THREE.MeshLambertMaterial({ color: this.colors.red }),
            buttons: new THREE.MeshLambertMaterial({ color: this.colors.yellow }),
            hair: new THREE.MeshLambertMaterial({ color: this.colors.brown }),
            mustache: new THREE.MeshLambertMaterial({ color: this.colors.brown }),
            gloves: new THREE.MeshLambertMaterial({ color: this.colors.white }),
            shoes: new THREE.MeshLambertMaterial({ color: this.colors.brown }),
            eyesWhite: new THREE.MeshBasicMaterial({ color: 0xffffff }),
            eyesBlue: new THREE.MeshBasicMaterial({ color: 0x0088ff }),
            eyesPupil: new THREE.MeshBasicMaterial({ color: 0x111111 }),
            badgeWhite: new THREE.MeshBasicMaterial({ color: 0xffffff })
        };

        this.root = new THREE.Group();
        this.group.add(this.root);

        // 1. Torso Group (Center of character)
        this.torsoGroup = new THREE.Group();
        this.torsoGroup.position.y = 0.85;
        this.root.add(this.torsoGroup);

        // Torso / Belly (overalls body)
        const torsoGeo = new THREE.CylinderGeometry(0.38, 0.44, 0.7, 12);
        this.torsoMesh = new THREE.Mesh(torsoGeo, this.materials.overalls);
        this.torsoMesh.castShadow = true;
        this.torsoMesh.receiveShadow = true;
        this.torsoGroup.add(this.torsoMesh);

        // Overalls straps
        const strapGeo = new THREE.BoxGeometry(0.12, 0.65, 0.12);
        const leftStrap = new THREE.Mesh(strapGeo, this.materials.overalls);
        leftStrap.position.set(-0.2, 0.05, 0.36);
        leftStrap.rotation.x = -0.1;
        this.torsoGroup.add(leftStrap);

        const rightStrap = new THREE.Mesh(strapGeo, this.materials.overalls);
        rightStrap.position.set(0.2, 0.05, 0.36);
        rightStrap.rotation.x = -0.1;
        this.torsoGroup.add(rightStrap);

        // Yellow Overalls Buttons
        const buttonGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.04, 8);
        buttonGeo.rotateX(Math.PI / 2);
        const leftBtn = new THREE.Mesh(buttonGeo, this.materials.buttons);
        leftBtn.position.set(-0.2, 0.15, 0.43);
        this.torsoGroup.add(leftBtn);

        const rightBtn = new THREE.Mesh(buttonGeo, this.materials.buttons);
        rightBtn.position.set(0.2, 0.15, 0.43);
        this.torsoGroup.add(rightBtn);

        // Red Shirt chest showing between straps
        const chestGeo = new THREE.CylinderGeometry(0.35, 0.4, 0.68, 10);
        this.chestMesh = new THREE.Mesh(chestGeo, this.materials.shirt);
        this.chestMesh.scale.set(0.96, 0.96, 0.96);
        this.torsoGroup.add(this.chestMesh);

        // 2. Head Group
        this.headGroup = new THREE.Group();
        this.headGroup.position.set(0, 0.5, 0.05);
        this.torsoGroup.add(this.headGroup);

        // Head Base
        const headGeo = new THREE.SphereGeometry(0.36, 12, 10);
        this.headMesh = new THREE.Mesh(headGeo, this.materials.skin);
        this.headMesh.castShadow = true;
        this.headGroup.add(this.headMesh);

        // Nose
        const noseGeo = new THREE.SphereGeometry(0.15, 10, 8);
        noseGeo.scale(1.1, 0.95, 1.25);
        this.noseMesh = new THREE.Mesh(noseGeo, this.materials.skin);
        this.noseMesh.position.set(0, -0.02, 0.38);
        this.headGroup.add(this.noseMesh);

        // Mustache
        this.mustacheGroup = new THREE.Group();
        this.mustacheGroup.position.set(0, -0.12, 0.35);
        const mustacheGeo = new THREE.CylinderGeometry(0.07, 0.08, 0.42, 8);
        mustacheGeo.rotateZ(Math.PI / 2);
        this.mustacheMesh = new THREE.Mesh(mustacheGeo, this.materials.mustache);
        this.mustacheGroup.add(this.mustacheMesh);

        // Mustache bumps
        const mBumpGeo = new THREE.SphereGeometry(0.09, 8, 6);
        const mBumpL = new THREE.Mesh(mBumpGeo, this.materials.mustache);
        mBumpL.position.set(-0.16, -0.02, 0.02);
        this.mustacheGroup.add(mBumpL);
        const mBumpR = new THREE.Mesh(mBumpGeo, this.materials.mustache);
        mBumpR.position.set(0.16, -0.02, 0.02);
        this.mustacheGroup.add(mBumpR);
        this.headGroup.add(this.mustacheGroup);

        // Eyes
        const createEye = (x) => {
            const eyeGroup = new THREE.Group();
            eyeGroup.position.set(x, 0.1, 0.32);

            const whiteGeo = new THREE.SphereGeometry(0.08, 8, 6);
            whiteGeo.scale(0.7, 1.1, 0.4);
            const eyeWhite = new THREE.Mesh(whiteGeo, this.materials.eyesWhite);
            eyeGroup.add(eyeWhite);

            const irisGeo = new THREE.SphereGeometry(0.045, 6, 6);
            irisGeo.scale(0.8, 1.0, 0.3);
            const eyeIris = new THREE.Mesh(irisGeo, this.materials.eyesBlue);
            eyeIris.position.set(x > 0 ? -0.015 : 0.015, 0.01, 0.03);
            eyeGroup.add(eyeIris);

            const pupilGeo = new THREE.SphereGeometry(0.025, 6, 6);
            pupilGeo.scale(0.8, 1.0, 0.3);
            const eyePupil = new THREE.Mesh(pupilGeo, this.materials.eyesPupil);
            eyePupil.position.set(x > 0 ? -0.015 : 0.015, 0.01, 0.042);
            eyeGroup.add(eyePupil);

            return eyeGroup;
        };
        this.headGroup.add(createEye(-0.14));
        this.headGroup.add(createEye(0.14));

        // Hair & Sideburns
        const hairGeo = new THREE.SphereGeometry(0.38, 10, 8);
        hairGeo.scale(1.0, 0.9, 0.95);
        this.hairMesh = new THREE.Mesh(hairGeo, this.materials.hair);
        this.hairMesh.position.set(0, -0.03, -0.08);
        this.headGroup.add(this.hairMesh);

        // Cap (Dome + Visor Brim + 'M' Emblem)
        this.capGroup = new THREE.Group();
        this.capGroup.position.set(0, 0.14, -0.02);
        this.headGroup.add(this.capGroup);

        // Cap Dome
        const capDomeGeo = new THREE.SphereGeometry(0.4, 12, 10);
        capDomeGeo.scale(1.06, 0.85, 1.15);
        this.capDome = new THREE.Mesh(capDomeGeo, this.materials.cap);
        this.capDome.position.set(0, 0.06, -0.02);
        this.capDome.castShadow = true;
        this.capGroup.add(this.capDome);

        // Cap Brim / Visor
        const brimGeo = new THREE.CylinderGeometry(0.44, 0.44, 0.06, 12, 1, false, -Math.PI * 0.4, Math.PI * 0.8);
        this.capBrim = new THREE.Mesh(brimGeo, this.materials.capBrim);
        this.capBrim.position.set(0, 0.04, 0.22);
        this.capBrim.rotation.x = 0.2;
        this.capGroup.add(this.capBrim);

        // Cap 'M' Emblem Badge
        const badgeGeo = new THREE.CircleGeometry(0.12, 12);
        this.badgeMesh = new THREE.Mesh(badgeGeo, this.materials.badgeWhite);
        this.badgeMesh.position.set(0, 0.22, 0.4);
        this.badgeMesh.rotation.x = -0.35;
        this.capGroup.add(this.badgeMesh);

        // Canvas for Red 'M' on Badge
        const mCanvas = document.createElement('canvas');
        mCanvas.width = 64;
        mCanvas.height = 64;
        const mCtx = mCanvas.getContext('2d');
        mCtx.fillStyle = '#ffffff';
        mCtx.beginPath();
        mCtx.arc(32, 32, 30, 0, Math.PI * 2);
        mCtx.fill();
        mCtx.fillStyle = '#d82800';
        mCtx.font = 'bold 36px sans-serif';
        mCtx.textAlign = 'center';
        mCtx.textBaseline = 'middle';
        mCtx.fillText('M', 32, 34);
        const mTexture = new THREE.CanvasTexture(mCanvas);
        this.badgeMesh.material = new THREE.MeshBasicMaterial({ map: mTexture, transparent: true });

        // 3. Arms (Left & Right)
        this.leftArmGroup = new THREE.Group();
        this.leftArmGroup.position.set(-0.45, 0.22, 0);
        this.torsoGroup.add(this.leftArmGroup);

        const armGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.4, 8);
        armGeo.translate(0, -0.2, 0);
        this.leftArmMesh = new THREE.Mesh(armGeo, this.materials.shirt);
        this.leftArmGroup.add(this.leftArmMesh);

        const gloveGeo = new THREE.SphereGeometry(0.16, 8, 8);
        gloveGeo.scale(1.0, 1.1, 1.1);
        this.leftGloveMesh = new THREE.Mesh(gloveGeo, this.materials.gloves);
        this.leftGloveMesh.position.set(0, -0.42, 0);
        this.leftArmGroup.add(this.leftGloveMesh);

        this.rightArmGroup = new THREE.Group();
        this.rightArmGroup.position.set(0.45, 0.22, 0);
        this.torsoGroup.add(this.rightArmGroup);

        this.rightArmMesh = new THREE.Mesh(armGeo, this.materials.shirt);
        this.rightArmGroup.add(this.rightArmMesh);

        this.rightGloveMesh = new THREE.Mesh(gloveGeo, this.materials.gloves);
        this.rightGloveMesh.position.set(0, -0.42, 0);
        this.rightArmGroup.add(this.rightGloveMesh);

        // 4. Legs (Left & Right)
        this.leftLegGroup = new THREE.Group();
        this.leftLegGroup.position.set(-0.2, -0.28, 0);
        this.torsoGroup.add(this.leftLegGroup);

        const legGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.45, 8);
        legGeo.translate(0, -0.2, 0);
        this.leftLegMesh = new THREE.Mesh(legGeo, this.materials.overalls);
        this.leftLegGroup.add(this.leftLegMesh);

        // Shoes (Brown rounded boot)
        const shoeGeo = new THREE.BoxGeometry(0.24, 0.18, 0.42);
        shoeGeo.translate(0, -0.09, 0.08);
        this.leftShoeMesh = new THREE.Mesh(shoeGeo, this.materials.shoes);
        this.leftShoeMesh.position.set(0, -0.42, 0);
        this.leftLegGroup.add(this.leftShoeMesh);

        this.rightLegGroup = new THREE.Group();
        this.rightLegGroup.position.set(0.2, -0.28, 0);
        this.torsoGroup.add(this.rightLegGroup);

        this.rightLegMesh = new THREE.Mesh(legGeo, this.materials.overalls);
        this.rightLegGroup.add(this.rightLegMesh);

        this.rightShoeMesh = new THREE.Mesh(shoeGeo, this.materials.shoes);
        this.rightShoeMesh.position.set(0, -0.42, 0);
        this.rightLegGroup.add(this.rightShoeMesh);
    }

    createDropShadow() {
        const shadowGeo = new THREE.CircleGeometry(0.5, 16);
        shadowGeo.rotateX(-Math.PI / 2);
        const shadowMat = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.45,
            depthWrite: false
        });
        this.dropShadow = new THREE.Mesh(shadowGeo, shadowMat);
        this.dropShadow.position.y = 0.02;
    }

    applyForm(form) {
        this.form = form;
        if (form === 'small') {
            this.root.scale.set(0.85, 0.85, 0.85);
            this.materials.shirt.color.setHex(this.colors.red);
            this.materials.overalls.color.setHex(this.colors.blue);
            this.materials.cap.color.setHex(this.colors.red);
            this.materials.capBrim.color.setHex(this.colors.red);
        } else if (form === 'super') {
            this.root.scale.set(1.22, 1.22, 1.22);
            this.materials.shirt.color.setHex(this.colors.red);
            this.materials.overalls.color.setHex(this.colors.blue);
            this.materials.cap.color.setHex(this.colors.red);
            this.materials.capBrim.color.setHex(this.colors.red);
        } else if (form === 'fire') {
            this.root.scale.set(1.22, 1.22, 1.22);
            // Fire Mario: White shirt & cap, red overalls
            this.materials.shirt.color.setHex(this.colors.white);
            this.materials.overalls.color.setHex(this.colors.red);
            this.materials.cap.color.setHex(this.colors.white);
            this.materials.capBrim.color.setHex(this.colors.white);
        }
    }

    setInvulnerable(seconds = 2.0) {
        this.isInvulnerable = true;
        this.invulnerableTimer = seconds;
    }

    setStarPower(seconds = 10.0) {
        this.starTimer = seconds;
        window.audio.playBGM('starman');
    }

    update(dt, speed, isGrounded, isMoving) {
        this.animTime += dt * 10;

        // Invulnerability blink
        if (this.invulnerableTimer > 0) {
            this.invulnerableTimer -= dt;
            this.blinkTimer += dt * 30;
            this.root.visible = Math.floor(this.blinkTimer) % 2 === 0;
            if (this.invulnerableTimer <= 0) {
                this.isInvulnerable = false;
                this.root.visible = true;
            }
        } else {
            this.root.visible = true;
        }

        // Star Power Rainbow Cycling
        if (this.starTimer > 0) {
            this.starTimer -= dt;
            this.starRainbowHue = (this.starRainbowHue + dt * 3) % 1.0;
            const starColor = new THREE.Color().setHSL(this.starRainbowHue, 1.0, 0.55);
            this.materials.shirt.color.copy(starColor);
            this.materials.cap.color.copy(starColor);
            this.materials.capBrim.color.copy(starColor);

            if (this.starTimer <= 0) {
                this.applyForm(this.form);
                if (window.game && window.game.level) {
                    window.audio.playBGM(window.game.level.bgmTheme);
                }
            }
        }

        // Animation Pose Updating
        this.updateAnimationPose(dt, speed, isGrounded, isMoving);
    }

    updateAnimationPose(dt, speed, isGrounded, isMoving) {
        // Reset local rotations/positions defaults
        this.torsoGroup.rotation.set(0, 0, 0);
        this.headGroup.rotation.set(0, 0, 0);
        this.torsoGroup.position.y = 0.85;

        if (this.animState === 'groundPound') {
            // Mid-air flip or slam down
            this.groundPoundSpin += dt * 25;
            this.root.rotation.x = Math.PI; // Upside down slam
            this.leftLegGroup.rotation.x = 0.2;
            this.rightLegGroup.rotation.x = 0.2;
            this.leftArmGroup.rotation.x = -1.5;
            this.rightArmGroup.rotation.x = -1.5;
            return;
        } else {
            this.root.rotation.x = 0;
        }

        if (!isGrounded) {
            // Jump / In-air Pose
            this.animState = 'jump';
            // Classic Mario Jump: Right arm up high, left arm down/back
            this.rightArmGroup.rotation.x = -2.7; // Raised fist!
            this.rightArmGroup.rotation.z = -0.2;
            this.leftArmGroup.rotation.x = 0.8;
            this.leftArmGroup.rotation.z = 0.4;

            // Legs bent
            this.rightLegGroup.rotation.x = -0.8;
            this.leftLegGroup.rotation.x = 0.4;

            this.headGroup.rotation.x = -0.2; // Look up
            this.torsoGroup.position.y = 0.95;
            return;
        }

        if (this.animState === 'crouch') {
            // Crouch pose
            this.torsoGroup.position.y = 0.55;
            this.torsoGroup.scale.set(1.1, 0.7, 1.1);
            this.headGroup.position.y = 0.3;
            this.leftLegGroup.rotation.x = -1.2;
            this.rightLegGroup.rotation.x = -1.2;
            this.leftArmGroup.rotation.x = 0.5;
            this.rightArmGroup.rotation.x = 0.5;
            return;
        } else {
            this.torsoGroup.scale.set(1.0, 1.0, 1.0);
            this.headGroup.position.y = 0.5;
        }

        if (isMoving && speed > 0.5) {
            // Walking / Running Stride
            this.animState = speed > 6.0 ? 'run' : 'walk';
            const runFreq = speed > 6.0 ? 16 : 10;
            const legAmp = speed > 6.0 ? 1.0 : 0.65;
            const armAmp = speed > 6.0 ? 1.1 : 0.7;

            const cycle = Math.sin(this.animTime * runFreq * 0.1);

            // Legs oscillate
            this.leftLegGroup.rotation.x = cycle * legAmp;
            this.rightLegGroup.rotation.x = -cycle * legAmp;

            // Arms swing oppositely
            this.leftArmGroup.rotation.x = -cycle * armAmp;
            this.leftArmGroup.rotation.z = 0.2;
            this.rightArmGroup.rotation.x = cycle * armAmp;
            this.rightArmGroup.rotation.z = -0.2;

            // Torso slight bob & forward tilt
            this.torsoGroup.position.y = 0.85 + Math.abs(cycle) * 0.08;
            this.torsoGroup.rotation.x = speed > 6.0 ? 0.25 : 0.12;
            this.headGroup.rotation.x = speed > 6.0 ? -0.15 : -0.05;
        } else {
            // Idle breathing
            this.animState = 'idle';
            const breath = Math.sin(this.animTime * 1.5) * 0.03;
            this.torsoGroup.position.y = 0.85 + breath;
            this.headGroup.position.y = 0.5 + breath * 0.5;

            // Rest legs
            this.leftLegGroup.rotation.set(0, 0, 0);
            this.rightLegGroup.rotation.set(0, 0, 0);

            // Rest arms
            this.leftArmGroup.rotation.set(0, 0, 0.15);
            this.rightArmGroup.rotation.set(0, 0, -0.15);
        }
    }

    // Play growth or shrink scale animation
    growAnimation(callback) {
        let elapsed = 0;
        const duration = 0.6;
        const startScale = 0.85;
        const targetScale = 1.22;

        const animate = () => {
            elapsed += 0.03;
            const t = Math.min(1.0, elapsed / duration);
            // Wobbly Mario 64 scale pulse
            const pulse = Math.sin(t * Math.PI * 4) * 0.15;
            const currentScale = startScale + (targetScale - startScale) * t + pulse;
            this.root.scale.set(currentScale, currentScale, currentScale);

            if (t < 1.0) {
                requestAnimationFrame(animate);
            } else {
                this.root.scale.set(targetScale, targetScale, targetScale);
                if (callback) callback();
            }
        };
        animate();
    }

    shrinkAnimation(callback) {
        let elapsed = 0;
        const duration = 0.6;
        const startScale = 1.22;
        const targetScale = 0.85;

        const animate = () => {
            elapsed += 0.03;
            const t = Math.min(1.0, elapsed / duration);
            const pulse = Math.sin(t * Math.PI * 4) * 0.12;
            const currentScale = startScale + (targetScale - startScale) * t + pulse;
            this.root.scale.set(currentScale, currentScale, currentScale);

            if (t < 1.0) {
                requestAnimationFrame(animate);
            } else {
                this.root.scale.set(targetScale, targetScale, targetScale);
                if (callback) callback();
            }
        };
        animate();
    }
}

window.Mario3D = Mario3D;
