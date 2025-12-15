// ForgeHands - Immersive Blacksmith Simulation
// Physics-driven, hand-controlled, skill-based forging

class ForgeHands {
    constructor() {
        // Core systems
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();

        // Physics world (using basic Three.js physics)
        this.gravity = -9.8;
        this.physicsObjects = [];

        // Hand control system
        this.leftHand = null;
        this.rightHand = null;
        this.leftHandTarget = new THREE.Vector3();
        this.rightHandTarget = new THREE.Vector3();
        this.leftMouseDown = false;
        this.rightMouseDown = false;
        this.grabbedObjectLeft = null;
        this.grabbedObjectRight = null;

        // Camera & movement
        this.cameraPosition = new THREE.Vector3(0, 1.7, 3);
        this.cameraRotation = { x: 0, y: 0 };
        this.velocity = new THREE.Vector3();
        this.moveSpeed = 3.0;
        this.sprintMultiplier = 1.5;
        this.keys = {};

        // World objects
        this.anvil = null;
        this.forge = null;
        this.quenchTub = null;
        this.grindingStation = null;
        this.polishingStation = null;

        // Current billet
        this.currentBillet = null;
        this.billetAnvilLocked = false;

        // Tools
        this.hammers = [];
        this.tongs = [];
        this.activeHammer = null;
        this.activeTongs = null;

        // Player state
        this.fatigue = 0;
        this.strikeCount = 0;
        this.money = 0;
        this.inventory = [];

        // Training (progression)
        this.training = {
            heatReading: 0,
            hammerControl: 0,
            precisionForging: 0,
            materialKnowledge: 0
        };

        // Unlocks
        this.grindingUnlocked = false;
        this.polishingUnlocked = false;
        this.rareWeaponsForged = 0;

        // Weapon types (10 total)
        this.weaponTypes = [
            'Dagger', 'Short Sword', 'Long Sword', 'Greatsword',
            'Axe', 'War Hammer', 'Spear', 'Mace', 'Halberd', 'Curved Blade'
        ];

        // Rarity levels
        this.rarities = [
            'Crude', 'Common', 'Fine', 'Rare', 'Superior', 'Masterwork', 'Legendary'
        ];

        // Pointer lock
        this.pointerLocked = false;

        // Active sparks tracking
        this.activeSparks = [];

        // Event listener references for cleanup
        this.eventListeners = {
            mousedown: null,
            mouseup: null,
            mousemove: null,
            contextmenu: null,
            keydown: null,
            keyup: null,
            pointerlockchange: null,
            resize: null
        };

        this.init();
    }

    init() {
        this.setupScene();
        this.setupCamera();
        this.setupRenderer();
        this.setupLights();
        this.createWorld();
        this.createHands();
        this.createTools();
        this.setupEventListeners();
        this.loadGameState();
        this.animate();
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1410);
        this.scene.fog = new THREE.Fog(0x1a1410, 5, 20);
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            100
        );
        this.camera.position.copy(this.cameraPosition);
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        this.renderer.physicallyCorrectLights = true;
        this.renderer.outputEncoding = THREE.sRGBEncoding;

        document.getElementById('game-container').appendChild(this.renderer.domElement);
    }

    setupLights() {
        // Ambient light
        const ambient = new THREE.AmbientLight(0x2a2520, 0.3);
        this.scene.add(ambient);

        // Forge light (main)
        const forgeLight = new THREE.PointLight(0xff6622, 15, 10);
        forgeLight.position.set(-3, 1.5, 0);
        forgeLight.castShadow = true;
        this.scene.add(forgeLight);
        this.forgeLight = forgeLight;

        // Overhead workshop light
        const overhead = new THREE.PointLight(0xffffcc, 3, 12);
        overhead.position.set(0, 4, 0);
        overhead.castShadow = true;
        this.scene.add(overhead);
    }

    createWorld() {
        // Floor
        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(30, 30),
            new THREE.MeshStandardMaterial({
                color: 0x2a2a2a,
                roughness: 0.9,
                metalness: 0.1
            })
        );
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);

        // Anvil
        this.createAnvil();

        // Forge
        this.createForge();

        // Quench tub
        this.createQuenchTub();
    }

    createAnvil() {
        const anvilGroup = new THREE.Group();

        // Base
        const base = new THREE.Mesh(
            new THREE.BoxGeometry(0.6, 0.3, 0.6),
            new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8, roughness: 0.3 })
        );
        base.position.y = 0.15;
        base.castShadow = true;
        anvilGroup.add(base);

        // Horn
        const horn = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.15, 0.4, 8),
            new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.9, roughness: 0.2 })
        );
        horn.rotation.z = Math.PI / 2;
        horn.position.set(0.25, 0.45, 0);
        horn.castShadow = true;
        anvilGroup.add(horn);

        // Flat surface
        const surface = new THREE.Mesh(
            new THREE.BoxGeometry(0.4, 0.15, 0.3),
            new THREE.MeshStandardMaterial({ color: 0x3a3a3a, metalness: 0.9, roughness: 0.2 })
        );
        surface.position.y = 0.375;
        surface.castShadow = true;
        anvilGroup.add(surface);

        anvilGroup.position.set(0, 0.7, 0);
        this.scene.add(anvilGroup);
        this.anvil = anvilGroup;

        // Anvil snap zone (invisible)
        this.anvilSnapZone = {
            min: new THREE.Vector3(-0.2, 0.9, -0.15),
            max: new THREE.Vector3(0.2, 1.3, 0.15)
        };
    }

    createForge() {
        const forgeGroup = new THREE.Group();

        // Main body
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 1.2, 0.8),
            new THREE.MeshStandardMaterial({ color: 0x3a2010, roughness: 0.8 })
        );
        body.position.y = 0.6;
        body.castShadow = true;
        forgeGroup.add(body);

        // Opening (glowing)
        const opening = new THREE.Mesh(
            new THREE.PlaneGeometry(0.6, 0.4),
            new THREE.MeshStandardMaterial({
                color: 0xff3300,
                emissive: 0xff3300,
                emissiveIntensity: 2
            })
        );
        opening.position.set(0, 0.6, 0.41);
        forgeGroup.add(opening);
        this.forgeOpening = opening;

        forgeGroup.position.set(-3, 0, 0);
        this.scene.add(forgeGroup);
        this.forge = forgeGroup;
        this.forgeOpen = true;
    }

    createQuenchTub() {
        const tub = new THREE.Mesh(
            new THREE.CylinderGeometry(0.4, 0.35, 0.5, 16),
            new THREE.MeshStandardMaterial({ color: 0x1a3a4a, roughness: 0.3, metalness: 0.6 })
        );
        tub.position.set(2, 0.25, 0);
        tub.castShadow = true;
        this.scene.add(tub);
        this.quenchTub = tub;
    }

    createHands() {
        // Left hand
        this.leftHand = this.createHand('left');
        this.leftHand.position.set(-0.3, 1.4, -0.5);
        this.scene.add(this.leftHand);

        // Right hand
        this.rightHand = this.createHand('right');
        this.rightHand.position.set(0.3, 1.4, -0.5);
        this.scene.add(this.rightHand);
    }

    createHand(side) {
        const hand = new THREE.Group();

        // Palm
        const palm = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, 0.12, 0.04),
            new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.6 })
        );
        hand.add(palm);

        // Fingers (simplified)
        for (let i = 0; i < 4; i++) {
            const finger = new THREE.Mesh(
                new THREE.BoxGeometry(0.015, 0.05, 0.015),
                new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.6 })
            );
            finger.position.set(-0.03 + i * 0.02, 0.085, 0);
            hand.add(finger);
        }

        hand.userData.side = side;
        return hand;
    }

    createTools() {
        // Starting hammer
        const hammer = this.createHammer({
            name: 'Steel Hammer',
            mass: 1.5,
            balance: 1.0,
            faceSize: 1.0,
            quality: 1.0,
            speedModifier: 1.0
        });
        hammer.position.set(-1, 0.9, 1);
        this.scene.add(hammer);
        this.hammers.push(hammer);
        this.physicsObjects.push(hammer);
    }

    createHammer(stats) {
        const hammerGroup = new THREE.Group();

        // Handle
        const handle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.02, 0.4, 8),
            new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.7 })
        );
        handle.position.y = -0.2;
        hammerGroup.add(handle);

        // Head
        const head = new THREE.Mesh(
            new THREE.BoxGeometry(0.06, 0.08, 0.12),
            new THREE.MeshStandardMaterial({ color: 0x4a4a4a, metalness: 0.9, roughness: 0.2 })
        );
        head.position.y = 0.04;
        head.castShadow = true;
        hammerGroup.add(head);

        hammerGroup.userData.type = 'hammer';
        hammerGroup.userData.stats = stats;
        hammerGroup.userData.grabbable = true;
        hammerGroup.userData.velocity = new THREE.Vector3();

        return hammerGroup;
    }

    createBillet(metalType = 'iron') {
        const billet = new THREE.Mesh(
            new THREE.BoxGeometry(0.15, 0.05, 0.3),
            new THREE.MeshStandardMaterial({
                color: 0x8a8a8a,
                metalness: 0.9,
                roughness: 0.3
            })
        );
        billet.position.set(-2.5, 1.2, 0);
        billet.castShadow = true;

        billet.userData.type = 'billet';
        billet.userData.heat = 0.0; // 0.0 to 1.0 (INVISIBLE)
        billet.userData.metalType = metalType;
        billet.userData.defects = 0;
        billet.userData.straightness = 1.0;
        billet.userData.shapeProgress = 0.0;
        billet.userData.reheatCount = 0;
        billet.userData.mishandled = false;
        billet.userData.grabbable = true;

        this.scene.add(billet);
        this.currentBillet = billet;
        this.physicsObjects.push(billet);
        return billet;
    }

    setupEventListeners() {
        // Mouse controls
        this.eventListeners.mousedown = (e) => {
            if (!this.pointerLocked) return;

            if (e.button === 0) this.leftMouseDown = true;
            if (e.button === 2) this.rightMouseDown = true;

            e.preventDefault();
        };
        window.addEventListener('mousedown', this.eventListeners.mousedown);

        this.eventListeners.mouseup = (e) => {
            if (e.button === 0) {
                this.leftMouseDown = false;
                this.releaseGrab('left');
            }
            if (e.button === 2) {
                this.rightMouseDown = false;
                this.releaseGrab('right');
            }
        };
        window.addEventListener('mouseup', this.eventListeners.mouseup);

        this.eventListeners.mousemove = (e) => {
            if (!this.pointerLocked) return;

            // Camera rotation
            if (!this.leftMouseDown && !this.rightMouseDown) {
                this.cameraRotation.y -= e.movementX * 0.002;
                this.cameraRotation.x -= e.movementY * 0.002;
                this.cameraRotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.cameraRotation.x));
            }

            // Hand movement
            if (this.leftMouseDown || this.rightMouseDown) {
                const moveScale = 0.003;
                if (this.leftMouseDown) {
                    this.leftHandTarget.x += e.movementX * moveScale;
                    this.leftHandTarget.y -= e.movementY * moveScale;
                }
                if (this.rightMouseDown) {
                    this.rightHandTarget.x += e.movementX * moveScale;
                    this.rightHandTarget.y -= e.movementY * moveScale;
                }
            }
        };
        window.addEventListener('mousemove', this.eventListeners.mousemove);

        this.eventListeners.contextmenu = (e) => e.preventDefault();
        window.addEventListener('contextmenu', this.eventListeners.contextmenu);

        // Keyboard
        this.eventListeners.keydown = (e) => {
            this.keys[e.key.toLowerCase()] = true;
        };
        window.addEventListener('keydown', this.eventListeners.keydown);

        this.eventListeners.keyup = (e) => {
            this.keys[e.key.toLowerCase()] = false;
        };
        window.addEventListener('keyup', this.eventListeners.keyup);

        // Pointer lock
        this.eventListeners.pointerlockchange = () => {
            this.pointerLocked = document.pointerLockElement === this.renderer.domElement;
        };
        document.addEventListener('pointerlockchange', this.eventListeners.pointerlockchange);

        // Window resize
        this.eventListeners.resize = () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', this.eventListeners.resize);
    }

    destroy() {
        // Clean up event listeners
        if (this.eventListeners.mousedown) {
            window.removeEventListener('mousedown', this.eventListeners.mousedown);
        }
        if (this.eventListeners.mouseup) {
            window.removeEventListener('mouseup', this.eventListeners.mouseup);
        }
        if (this.eventListeners.mousemove) {
            window.removeEventListener('mousemove', this.eventListeners.mousemove);
        }
        if (this.eventListeners.contextmenu) {
            window.removeEventListener('contextmenu', this.eventListeners.contextmenu);
        }
        if (this.eventListeners.keydown) {
            window.removeEventListener('keydown', this.eventListeners.keydown);
        }
        if (this.eventListeners.keyup) {
            window.removeEventListener('keyup', this.eventListeners.keyup);
        }
        if (this.eventListeners.pointerlockchange) {
            document.removeEventListener('pointerlockchange', this.eventListeners.pointerlockchange);
        }
        if (this.eventListeners.resize) {
            window.removeEventListener('resize', this.eventListeners.resize);
        }

        // Clean up Three.js resources
        this.renderer.dispose();

        // Clean up sparks
        this.activeSparks.forEach(spark => {
            this.scene.remove(spark);
            spark.geometry.dispose();
            spark.material.dispose();
        });
        this.activeSparks = [];
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const delta = Math.min(this.clock.getDelta(), 0.1);

        this.updateMovement(delta);
        this.updateHands(delta);
        this.updatePhysics(delta);
        this.updateHeatSystem(delta);
        this.updateFatigue(delta);
        this.updateSparks(delta);
        this.updateForgeEffects();
        this.checkAnvilSnap();

        this.renderer.render(this.scene, this.camera);
    }

    updateFatigue(delta) {
        // Fatigue recovers when: Standing still, Resting hands, Not striking
        const isMoving = this.velocity.length() > 0.01;
        const isUsingHands = this.leftMouseDown || this.rightMouseDown;

        if (!isMoving && !isUsingHands) {
            // Recover fatigue when resting
            const recoveryRate = 0.05; // 5% per second
            this.fatigue = Math.max(0, this.fatigue - recoveryRate * delta);
        }
    }

    updateMovement(delta) {
        const forward = new THREE.Vector3();
        const right = new THREE.Vector3();

        this.camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();
        right.crossVectors(forward, new THREE.Vector3(0, 1, 0));

        const speed = this.moveSpeed * (this.keys.shift ? this.sprintMultiplier : 1.0);

        this.velocity.set(0, 0, 0);

        if (this.keys.w) this.velocity.add(forward.clone().multiplyScalar(speed));
        if (this.keys.s) this.velocity.add(forward.clone().multiplyScalar(-speed));
        if (this.keys.a) this.velocity.add(right.clone().multiplyScalar(-speed));
        if (this.keys.d) this.velocity.add(right.clone().multiplyScalar(speed));

        this.cameraPosition.add(this.velocity.clone().multiplyScalar(delta));

        this.camera.position.copy(this.cameraPosition);
        this.camera.rotation.set(this.cameraRotation.x, this.cameraRotation.y, 0, 'YXZ');
    }

    updateHands(delta) {
        // Smooth hand movement
        const lerpFactor = 10 * delta;

        const baseLeft = this.camera.position.clone().add(new THREE.Vector3(-0.3, -0.3, -0.5));
        const baseRight = this.camera.position.clone().add(new THREE.Vector3(0.3, -0.3, -0.5));

        this.leftHand.position.lerp(
            baseLeft.clone().add(this.leftHandTarget),
            lerpFactor
        );

        this.rightHand.position.lerp(
            baseRight.clone().add(this.rightHandTarget),
            lerpFactor
        );

        // Check for grabs
        if (this.leftMouseDown && !this.grabbedObjectLeft) {
            this.attemptGrab('left');
        }
        if (this.rightMouseDown && !this.grabbedObjectRight) {
            this.attemptGrab('right');
        }

        // Move grabbed objects
        if (this.grabbedObjectLeft) {
            this.grabbedObjectLeft.position.copy(this.leftHand.position);
        }
        if (this.grabbedObjectRight) {
            this.grabbedObjectRight.position.copy(this.rightHand.position);

            // Track hammer velocity for strike detection
            if (this.grabbedObjectRight.userData.type === 'hammer') {
                const prevPos = this.grabbedObjectRight.userData.prevPosition || this.grabbedObjectRight.position.clone();
                // Prevent division by zero
                const safeDelta = Math.max(delta, 0.001);
                this.grabbedObjectRight.userData.velocity = this.grabbedObjectRight.position.clone().sub(prevPos).divideScalar(safeDelta);
                this.grabbedObjectRight.userData.prevPosition = this.grabbedObjectRight.position.clone();
            }
        }
    }

    attemptGrab(hand) {
        const handObj = hand === 'left' ? this.leftHand : this.rightHand;
        const grabRadius = 0.3;

        // Check hammers
        for (const obj of this.hammers) {
            if (obj && obj.userData?.grabbable) {
                const dist = handObj.position.distanceTo(obj.position);
                if (dist < grabRadius) {
                    if (hand === 'left') {
                        this.grabbedObjectLeft = obj;
                    } else {
                        this.grabbedObjectRight = obj;
                    }
                    return;
                }
            }
        }

        // Check current billet
        if (this.currentBillet && this.currentBillet.userData?.grabbable) {
            const dist = handObj.position.distanceTo(this.currentBillet.position);
            if (dist < grabRadius) {
                if (hand === 'left') {
                    this.grabbedObjectLeft = this.currentBillet;
                } else {
                    this.grabbedObjectRight = this.currentBillet;
                }

                // Unlock billet from anvil when grabbed
                if (this.billetAnvilLocked) {
                    this.billetAnvilLocked = false;
                    // Increment reheat count if mishandled
                    if (this.currentBillet.userData.mishandled) {
                        this.currentBillet.userData.reheatCount++;
                        this.currentBillet.userData.mishandled = false; // Reset flag
                    }
                }
                return;
            }
        }
    }

    releaseGrab(hand) {
        if (hand === 'left') {
            this.grabbedObjectLeft = null;
        } else {
            const obj = this.grabbedObjectRight;
            this.grabbedObjectRight = null;

            // Check for hammer strike
            if (obj && obj.userData.type === 'hammer') {
                this.checkHammerStrike(obj);
            }
        }
    }

    checkAnvilSnap() {
        if (!this.currentBillet) return;
        if (this.billetAnvilLocked) return;
        if (this.grabbedObjectLeft === this.currentBillet || this.grabbedObjectRight === this.currentBillet) return;

        const pos = this.currentBillet.position;
        const zone = this.anvilSnapZone;

        if (pos.x >= zone.min.x && pos.x <= zone.max.x &&
            pos.y >= zone.min.y && pos.y <= zone.max.y &&
            pos.z >= zone.min.z && pos.z <= zone.max.z) {

            // SNAP TO ANVIL
            this.currentBillet.position.set(0, 1.15, 0);
            this.currentBillet.rotation.set(0, 0, 0);
            this.billetAnvilLocked = true;

            this.showFeedback('Billet locked on anvil');
        }
    }

    checkHammerStrike(hammer) {
        if (!this.billetAnvilLocked) return;
        if (!this.currentBillet) return;

        const vel = hammer.userData.velocity;
        const speed = vel.length();
        const downwardVel = -vel.y;

        // Check if strike is valid
        if (downwardVel < 2.0) return; // Minimum downward speed
        if (hammer.position.distanceTo(this.currentBillet.position) > 0.3) return;

        // Calculate forging effectiveness
        const heat = this.currentBillet.userData.heat;
        const heatMult = this.getHeatMultiplier(heat);
        const hammerQuality = hammer.userData.stats.quality;
        const trainingBonus = 1.0 + this.training.hammerControl * 0.01;
        const strikeAccuracy = Math.min(downwardVel / 5.0, 1.0);

        const effectiveness = heatMult * hammerQuality * trainingBonus * strikeAccuracy;

        // Apply forging
        this.applyForging(effectiveness, heat);

        // Fatigue
        this.strikeCount++;
        this.fatigue = Math.min(1.0, this.fatigue + 0.02);

        this.showFeedback(`Strike! Power: ${(effectiveness * 100).toFixed(0)}%`);
    }

    getHeatMultiplier(heat) {
        // Perfect heat: 0.6-0.75
        // Too cold: < 0.4
        // Too hot: > 0.8

        if (heat < 0.4) return 0.1 + heat * 0.25; // Very ineffective when cold
        if (heat >= 0.6 && heat <= 0.75) return 1.0; // Perfect
        if (heat > 0.75 && heat <= 0.9) return 0.8; // Too hot but workable
        if (heat > 0.9) return 0.5; // Burning

        // Transitional zones
        return 0.5 + (heat - 0.4) * 2.5;
    }

    applyForging(effectiveness, heat) {
        if (!this.currentBillet) return;

        const data = this.currentBillet.userData;

        // Shape progress
        data.shapeProgress += effectiveness * 0.05;

        // Defects from bad hits
        if (effectiveness < 0.3) {
            data.defects += 0.1;
            data.mishandled = true;
        }

        if (heat < 0.4 || heat > 0.85) {
            data.defects += 0.05;
        }

        // Visual deformation
        this.currentBillet.scale.y *= 0.95;
        this.currentBillet.scale.x *= 1.02;

        // Sparks based on heat
        if (heat > 0.5) {
            this.createSparks(this.currentBillet.position, heat);
        }
    }

    updateHeatSystem(delta) {
        if (!this.currentBillet) return;

        const data = this.currentBillet.userData;

        // Check if billet is in forge
        const forgePos = this.forge.position;
        const billetPos = this.currentBillet.position;
        const distToForge = new THREE.Vector3(
            billetPos.x - forgePos.x,
            billetPos.y - forgePos.y,
            billetPos.z - forgePos.z
        ).length();

        // Heat INCREASES when in forge (within 1.5 units of forge center and forge is open)
        if (this.forgeOpen && distToForge < 1.5 && !this.billetAnvilLocked) {
            const heatRate = 0.15; // 15% per second
            data.heat = Math.min(1.0, data.heat + heatRate * delta);
        }

        // Heat ONLY decays when anvil-locked
        if (this.billetAnvilLocked) {
            const baseDecay = 0.01; // 1% per second
            // Reheat penalty: First bad-hit cycle → +5%, each additional → +4%
            // Formula: 1.0 + (reheatCount > 0 ? 0.05 + (reheatCount - 1) * 0.04 : 0)
            const reheatPenalty = data.reheatCount > 0 ? 1.0 + 0.05 + (data.reheatCount - 1) * 0.04 : 1.0;
            data.heat = Math.max(0, data.heat - baseDecay * reheatPenalty * delta);
        }

        // Update visual color based on heat (subtle)
        const heatColor = new THREE.Color();
        if (data.heat < 0.3) {
            heatColor.setHex(0x8a8a8a); // Gray
        } else if (data.heat < 0.6) {
            heatColor.setHex(0xaa6644); // Dull red
        } else if (data.heat < 0.8) {
            heatColor.setHex(0xff6644); // Bright red
        } else {
            heatColor.setHex(0xffaa44); // Orange-white
        }

        this.currentBillet.material.color.copy(heatColor);
        this.currentBillet.material.emissive.copy(heatColor).multiplyScalar(data.heat * 0.5);
    }

    updatePhysics(delta) {
        // Simple gravity for non-grabbed objects
        this.physicsObjects.forEach(obj => {
            if (obj === this.grabbedObjectLeft || obj === this.grabbedObjectRight) return;
            if (obj.userData.type === 'billet' && this.billetAnvilLocked) return;

            obj.userData.velocity = obj.userData.velocity || new THREE.Vector3();
            obj.userData.velocity.y += this.gravity * delta;
            obj.position.add(obj.userData.velocity.clone().multiplyScalar(delta));

            // Ground collision
            if (obj.position.y < 0.1) {
                obj.position.y = 0.1;
                obj.userData.velocity.y = 0;
            }
        });
    }

    updateForgeEffects() {
        const time = Date.now() * 0.001;
        const flicker = Math.sin(time * 3) * 0.3 + Math.sin(time * 7) * 0.2;

        if (this.forgeLight) {
            this.forgeLight.intensity = 15 + flicker * 3;
        }

        if (this.forgeOpening) {
            this.forgeOpening.material.emissiveIntensity = 2 + flicker * 0.5;
        }
    }

    createSparks(position, intensity) {
        // Limit max active sparks to prevent memory issues
        if (this.activeSparks.length > 100) return;

        // Simple spark particle system
        for (let i = 0; i < 5 * intensity; i++) {
            const spark = new THREE.Mesh(
                new THREE.SphereGeometry(0.01),
                new THREE.MeshBasicMaterial({ color: 0xffaa44 })
            );
            spark.position.copy(position);
            spark.userData.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                Math.random() * 3,
                (Math.random() - 0.5) * 2
            );
            spark.userData.lifetime = 0.5; // seconds
            spark.userData.age = 0;
            this.scene.add(spark);
            this.activeSparks.push(spark);
        }
    }

    updateSparks(delta) {
        // Update and remove old sparks
        for (let i = this.activeSparks.length - 1; i >= 0; i--) {
            const spark = this.activeSparks[i];
            spark.userData.age += delta;

            if (spark.userData.age >= spark.userData.lifetime) {
                this.scene.remove(spark);
                spark.geometry.dispose();
                spark.material.dispose();
                this.activeSparks.splice(i, 1);
            }
        }
    }

    showFeedback(message) {
        // Simple text feedback (subtle)
        const existing = document.getElementById('feedback-message');
        if (existing) existing.remove();

        const msg = document.createElement('div');
        msg.id = 'feedback-message';
        msg.textContent = message;
        msg.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.7);
            color: #ffaa44;
            padding: 10px 20px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 14px;
            pointer-events: none;
            z-index: 1000;
        `;
        document.body.appendChild(msg);

        setTimeout(() => msg.remove(), 2000);
    }

    async loadGameState() {
        try {
            const response = await fetch('/api/state');
            if (response.ok) {
                const data = await response.json();
                this.money = data.money || 0;
                this.inventory = data.inventory || [];
                this.training = data.trainingLevels || this.training;
                this.grindingUnlocked = data.unlocks?.grindingUnlocked || false;
                this.polishingUnlocked = data.unlocks?.polishingUnlocked || false;
            }
        } catch (err) {
            console.log('No backend available, using local state');
        }
    }

    async saveGameState() {
        const state = {
            money: this.money,
            inventory: this.inventory,
            trainingLevels: this.training,
            unlocks: {
                grindingUnlocked: this.grindingUnlocked,
                polishingUnlocked: this.polishingUnlocked
            }
        };

        try {
            await fetch('/api/state', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(state)
            });
        } catch (err) {
            console.log('Could not save to backend');
        }
    }
}

// Initialize game
window.addEventListener('DOMContentLoaded', () => {
    const game = new ForgeHands();
    window.game = game;

    // Add test billet (synchronously after game is ready)
    game.createBillet('iron');
});
