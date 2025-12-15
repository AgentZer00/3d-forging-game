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

        // Weapon selection
        this.selectedWeaponType = 'Dagger'; // Default to simplest weapon

        // Strike cooldown
        this.lastStrikeTime = 0;
        this.strikeCooldown = 0.3; // 300ms between strikes

        // Jump
        this.isJumping = false;
        this.jumpVelocity = 0;
        this.isGrounded = true;

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

        // Sound system
        this.audioContext = null;
        this.sounds = {};

        // Grinding/Polishing state
        this.isGrinding = false;
        this.isPolishing = false;
        this.grindingProgress = 0;
        this.polishingProgress = 0;

        // Metal types with properties
        this.metalTypes = {
            'iron': { heatRate: 1.0, forgingBonus: 0, defectResistance: 0, value: 1.0 },
            'steel': { heatRate: 0.9, forgingBonus: 0.1, defectResistance: 0.1, value: 1.5 },
            'bronze': { heatRate: 1.2, forgingBonus: 0, defectResistance: -0.1, value: 0.8 },
            'mithril': { heatRate: 0.7, forgingBonus: 0.2, defectResistance: 0.2, value: 3.0 },
            'damascus': { heatRate: 0.8, forgingBonus: 0.15, defectResistance: 0.3, value: 4.0 }
        };

        // Available billets (metal stock)
        this.availableBillets = ['iron', 'iron', 'iron', 'steel', 'bronze'];

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
        this.initAudio();
        this.loadGameState();
        this.animate();
    }

    initAudio() {
        // Initialize Web Audio API
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // Create sound generators
        this.sounds = {
            hammer: () => this.playHammerSound(),
            quench: () => this.playQuenchSound(),
            grind: () => this.playGrindSound(),
            forge: () => this.playForgeAmbience(),
            error: () => this.playErrorSound(),
            success: () => this.playSuccessSound()
        };
    }

    playHammerSound() {
        if (!this.audioContext) return;

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // Create metallic impact sound
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'square';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, now);
        filter.frequency.exponentialRampToValueAtTime(200, now + 0.15);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.2);

        // Add noise burst for impact
        const noise = ctx.createBufferSource();
        const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.5;
        }
        noise.buffer = noiseBuffer;

        const noiseGain = ctx.createGain();
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.value = 3000;

        noiseGain.gain.setValueAtTime(0.15, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(ctx.destination);

        noise.start(now);
    }

    playQuenchSound() {
        if (!this.audioContext) return;

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // Sizzle/steam sound
        const noise = ctx.createBufferSource();
        const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1);
        }
        noise.buffer = noiseBuffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(4000, now);
        filter.frequency.exponentialRampToValueAtTime(1000, now + 1.5);
        filter.Q.value = 2;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start(now);
    }

    playGrindSound() {
        if (!this.audioContext) return;

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // Grinding wheel sound
        const noise = ctx.createBufferSource();
        const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1);
        }
        noise.buffer = noiseBuffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 2000;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start(now);
    }

    playForgeAmbience() {
        if (!this.audioContext) return;

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // Low rumble for forge
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.value = 60;

        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.5);
    }

    playErrorSound() {
        if (!this.audioContext) return;

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.setValueAtTime(150, now + 0.1);

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.2);
    }

    playSuccessSound() {
        if (!this.audioContext) return;

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(660, now + 0.1);
        osc.frequency.setValueAtTime(880, now + 0.2);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.4);
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
        // Rusty Hammer - Poor quality starting tool
        const rustyHammer = this.createHammer({
            name: 'Rusty Hammer',
            mass: 2.0,
            balance: 0.6,  // Poor balance
            faceSize: 0.8,
            quality: 0.6,
            speedModifier: 1.2,  // Slower (20% more time)
            durability: 100,
            maxDurability: 100,
            color: 0x5a4a3a  // Rusty color
        });
        rustyHammer.position.set(-1.5, 0.9, 1.5);
        this.scene.add(rustyHammer);
        this.hammers.push(rustyHammer);
        this.physicsObjects.push(rustyHammer);

        // Steel Hammer - Standard quality
        const steelHammer = this.createHammer({
            name: 'Steel Hammer',
            mass: 1.5,
            balance: 1.0,
            faceSize: 1.0,
            quality: 0.8,
            speedModifier: 1.0,
            durability: 150,
            maxDurability: 150,
            color: 0x6a6a6a
        });
        steelHammer.position.set(-1, 0.9, 1);
        this.scene.add(steelHammer);
        this.hammers.push(steelHammer);
        this.physicsObjects.push(steelHammer);

        // Master Hammer - Best quality (harder to find)
        const masterHammer = this.createHammer({
            name: 'Master Hammer',
            mass: 1.3,
            balance: 1.3,  // Wider sweet spot
            faceSize: 1.2,
            quality: 1.2,  // Reduces mistake penalties
            speedModifier: 0.8,  // 20% faster
            durability: 200,
            maxDurability: 200,
            color: 0x8a8a9a
        });
        masterHammer.position.set(-0.5, 0.9, 0.5);
        this.scene.add(masterHammer);
        this.hammers.push(masterHammer);
        this.physicsObjects.push(masterHammer);

        // Tongs for handling hot metal
        this.createTongs();
    }

    createTongs() {
        const tongsGroup = new THREE.Group();

        // Left arm
        const leftArm = new THREE.Mesh(
            new THREE.BoxGeometry(0.02, 0.4, 0.02),
            new THREE.MeshStandardMaterial({ color: 0x3a3a3a, metalness: 0.9, roughness: 0.3 })
        );
        leftArm.position.set(-0.025, 0, 0);
        tongsGroup.add(leftArm);

        // Right arm
        const rightArm = new THREE.Mesh(
            new THREE.BoxGeometry(0.02, 0.4, 0.02),
            new THREE.MeshStandardMaterial({ color: 0x3a3a3a, metalness: 0.9, roughness: 0.3 })
        );
        rightArm.position.set(0.025, 0, 0);
        tongsGroup.add(rightArm);

        // Jaws
        const leftJaw = new THREE.Mesh(
            new THREE.BoxGeometry(0.03, 0.08, 0.02),
            new THREE.MeshStandardMaterial({ color: 0x4a4a4a, metalness: 0.9, roughness: 0.3 })
        );
        leftJaw.position.set(-0.025, 0.24, 0);
        tongsGroup.add(leftJaw);

        const rightJaw = new THREE.Mesh(
            new THREE.BoxGeometry(0.03, 0.08, 0.02),
            new THREE.MeshStandardMaterial({ color: 0x4a4a4a, metalness: 0.9, roughness: 0.3 })
        );
        rightJaw.position.set(0.025, 0.24, 0);
        tongsGroup.add(rightJaw);

        // Handle hinge
        const hinge = new THREE.Mesh(
            new THREE.CylinderGeometry(0.015, 0.015, 0.06, 8),
            new THREE.MeshStandardMaterial({ color: 0x5a5a5a, metalness: 0.9, roughness: 0.3 })
        );
        hinge.rotation.x = Math.PI / 2;
        tongsGroup.add(hinge);

        tongsGroup.position.set(1.5, 0.9, -1);
        tongsGroup.userData.type = 'tongs';
        tongsGroup.userData.grabbable = true;
        tongsGroup.userData.velocity = new THREE.Vector3();
        tongsGroup.userData.stats = {
            name: 'Iron Tongs',
            gripStrength: 1.0,
            durability: 100,
            maxDurability: 100
        };
        tongsGroup.userData.heldBillet = null;  // For tracking held billet

        this.scene.add(tongsGroup);
        this.tongs.push(tongsGroup);
        this.physicsObjects.push(tongsGroup);
    }

    createHammer(stats) {
        const hammerGroup = new THREE.Group();
        const headColor = stats.color || 0x4a4a4a;

        // Handle
        const handle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.02, 0.4, 8),
            new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.7 })
        );
        handle.position.y = -0.2;
        hammerGroup.add(handle);

        // Head - size varies by faceSize stat
        const faceScale = stats.faceSize || 1.0;
        const head = new THREE.Mesh(
            new THREE.BoxGeometry(0.06 * faceScale, 0.08, 0.12 * faceScale),
            new THREE.MeshStandardMaterial({ color: headColor, metalness: 0.9, roughness: 0.2 })
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

            // Weapon control keys
            if (e.key.toLowerCase() === 'f' && this.pointerLocked) {
                this.finishWeapon();
            }
            if (e.key.toLowerCase() === 'q' && this.pointerLocked) {
                this.quenchBillet();
            }
            if (e.key.toLowerCase() === 'i' && this.pointerLocked) {
                this.toggleInventory();
            }
            if (e.key.toLowerCase() === 'r' && this.pointerLocked) {
                this.cycleWeaponType();
            }
            // Spawn new billet with different metal
            if (e.key.toLowerCase() === 'n' && this.pointerLocked) {
                this.spawnNewBillet();
            }
            // Cycle metal type for next billet
            if (e.key.toLowerCase() === 'm' && this.pointerLocked) {
                this.cycleMetalType();
            }
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

        // Click to lock pointer
        this.eventListeners.click = () => {
            if (!this.pointerLocked) {
                this.renderer.domElement.requestPointerLock();
            }
        };
        this.renderer.domElement.addEventListener('click', this.eventListeners.click);
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
        if (this.eventListeners.click) {
            this.renderer.domElement.removeEventListener('click', this.eventListeners.click);
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
        this.updateGrinding(delta);
        this.updatePolishing(delta);
        this.updateHUD();

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

        // Jump mechanics
        const groundLevel = 1.7; // Eye height
        this.isGrounded = this.cameraPosition.y <= groundLevel;

        if (this.keys[' '] && this.isGrounded && !this.isJumping) {
            this.jumpVelocity = 5.0; // Jump strength
            this.isJumping = true;
        }

        // Apply jump physics
        if (this.isJumping || !this.isGrounded) {
            this.jumpVelocity += this.gravity * delta;
            this.cameraPosition.y += this.jumpVelocity * delta;

            if (this.cameraPosition.y <= groundLevel) {
                this.cameraPosition.y = groundLevel;
                this.jumpVelocity = 0;
                this.isJumping = false;
            }
        }

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

        // Check tongs
        for (const tong of this.tongs) {
            if (tong && tong.userData?.grabbable) {
                const dist = handObj.position.distanceTo(tong.position);
                if (dist < grabRadius) {
                    if (hand === 'left') {
                        this.grabbedObjectLeft = tong;
                    } else {
                        this.grabbedObjectRight = tong;
                    }
                    this.activeTongs = tong;
                    return;
                }
            }
        }

        // Check current billet - MUST use tongs if billet is hot
        if (this.currentBillet && this.currentBillet.userData?.grabbable) {
            const dist = handObj.position.distanceTo(this.currentBillet.position);
            if (dist < grabRadius) {
                const heat = this.currentBillet.userData.heat;

                // If billet is hot (>0.3), require tongs
                if (heat > 0.3) {
                    // Check if the OTHER hand is holding tongs
                    const otherGrabbedObj = hand === 'left' ? this.grabbedObjectRight : this.grabbedObjectLeft;
                    if (otherGrabbedObj?.userData?.type === 'tongs') {
                        // Grab billet WITH tongs
                        if (hand === 'left') {
                            this.grabbedObjectLeft = this.currentBillet;
                        } else {
                            this.grabbedObjectRight = this.currentBillet;
                        }
                        otherGrabbedObj.userData.heldBillet = this.currentBillet;
                        this.unlockBilletFromAnvil();
                        this.showFeedback('Grabbed hot metal with tongs');
                    } else {
                        // Try to pick up hot metal without tongs - can't!
                        this.showFeedback('Too hot! Use tongs');
                        this.playErrorSound();
                        return;
                    }
                } else {
                    // Cool billet can be grabbed by hand
                    if (hand === 'left') {
                        this.grabbedObjectLeft = this.currentBillet;
                    } else {
                        this.grabbedObjectRight = this.currentBillet;
                    }
                    this.unlockBilletFromAnvil();
                }
                return;
            }
        }
    }

    unlockBilletFromAnvil() {
        // Unlock billet from anvil when grabbed
        if (this.billetAnvilLocked) {
            this.billetAnvilLocked = false;
            // Increment reheat count if mishandled
            if (this.currentBillet && this.currentBillet.userData.mishandled) {
                this.currentBillet.userData.reheatCount++;
                this.currentBillet.userData.mishandled = false; // Reset flag
            }
        }
    }

    releaseGrab(hand) {
        const releasedObj = hand === 'left' ? this.grabbedObjectLeft : this.grabbedObjectRight;

        // Handle billet release - CANNOT drop freely
        if (releasedObj && releasedObj.userData?.type === 'billet') {
            // Check if near anvil snap zone
            const pos = releasedObj.position;
            const zone = this.anvilSnapZone;

            if (pos.x >= zone.min.x && pos.x <= zone.max.x &&
                pos.y >= zone.min.y && pos.y <= zone.max.y &&
                pos.z >= zone.min.z && pos.z <= zone.max.z) {
                // Allow drop - billet will snap to anvil via checkAnvilSnap
                if (hand === 'left') {
                    this.grabbedObjectLeft = null;
                } else {
                    this.grabbedObjectRight = null;
                }
                // Clear tongs held billet reference
                this.clearTongsHeldBillet();
            } else if (this.isNearGrindingStation(pos) && this.grindingUnlocked) {
                // Allow drop at grinding station
                if (hand === 'left') {
                    this.grabbedObjectLeft = null;
                } else {
                    this.grabbedObjectRight = null;
                }
                this.clearTongsHeldBillet();
                this.startGrinding();
            } else if (this.isNearPolishingStation(pos) && this.polishingUnlocked) {
                // Allow drop at polishing station
                if (hand === 'left') {
                    this.grabbedObjectLeft = null;
                } else {
                    this.grabbedObjectRight = null;
                }
                this.clearTongsHeldBillet();
                this.startPolishing();
            } else {
                // Billet stays in hand - CANNOT drop freely!
                this.showFeedback('Cannot drop here. Place on anvil.');
                return; // Don't release!
            }
            return;
        }

        // Handle tongs release
        if (releasedObj && releasedObj.userData?.type === 'tongs') {
            if (releasedObj.userData.heldBillet) {
                // Tongs are holding a billet - release both
                releasedObj.userData.heldBillet = null;
            }
            this.activeTongs = null;
        }

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

    clearTongsHeldBillet() {
        // Clear tongs reference when billet is released
        for (const tong of this.tongs) {
            if (tong.userData.heldBillet === this.currentBillet) {
                tong.userData.heldBillet = null;
            }
        }
    }

    isNearGrindingStation(pos) {
        if (!this.grindingStation) return false;
        return pos.distanceTo(this.grindingStation.position) < 1.0;
    }

    isNearPolishingStation(pos) {
        if (!this.polishingStation) return false;
        return pos.distanceTo(this.polishingStation.position) < 1.0;
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

        const currentTime = Date.now() / 1000;
        // Strike cooldown to prevent spam
        if (currentTime - this.lastStrikeTime < this.strikeCooldown) return;

        const vel = hammer.userData.velocity;
        const speed = vel.length();
        const downwardVel = -vel.y;

        // Check if strike is valid
        if (downwardVel < 2.0) return; // Minimum downward speed
        if (hammer.position.distanceTo(this.currentBillet.position) > 0.3) return;

        const stats = hammer.userData.stats;

        // Calculate forging effectiveness
        const heat = this.currentBillet.userData.heat;
        const heatMult = this.getHeatMultiplier(heat);
        const hammerQuality = stats.quality;
        const trainingBonus = 1.0 + this.training.hammerControl * 0.01;
        const fatigueModifier = 1.0 - (this.fatigue * 0.3); // Up to 30% penalty at max fatigue

        // Hammer balance affects strike accuracy - poor balance = off-axis hits
        const balanceModifier = stats.balance || 1.0;
        const balanceRandom = 1.0 - ((1.0 - balanceModifier) * Math.random() * 0.5);

        const strikeAccuracy = Math.min(downwardVel / 5.0, 1.0) * fatigueModifier * balanceRandom;

        const effectiveness = heatMult * hammerQuality * trainingBonus * strikeAccuracy;

        // Apply speed modifier (affects shape progress rate)
        const speedModifier = stats.speedModifier || 1.0;

        // Apply forging with metal properties
        this.applyForging(effectiveness, heat, speedModifier);

        // Tool wear - durability decreases with use
        if (stats.durability > 0) {
            stats.durability -= 0.5;
            if (stats.durability <= stats.maxDurability * 0.2) {
                // Tool is getting worn
                stats.quality = Math.max(0.4, stats.quality * 0.995);
            }
        }

        // Play hammer sound
        this.playHammerSound();

        // Fatigue
        this.strikeCount++;
        const massPenalty = (stats.mass || 1.5) / 1.5; // Heavier hammers tire faster
        this.fatigue = Math.min(1.0, this.fatigue + 0.02 * massPenalty);

        // Training progression
        this.advanceTraining('hammerControl', effectiveness * 0.1);
        if (heat >= 0.6 && heat <= 0.75) {
            this.advanceTraining('heatReading', 0.01);
        }

        // Material knowledge advancement when working with rare metals
        const metalType = this.currentBillet.userData.metalType;
        if (metalType !== 'iron' && metalType !== 'bronze') {
            this.advanceTraining('materialKnowledge', 0.005);
        }

        this.lastStrikeTime = currentTime;
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

    applyForging(effectiveness, heat, speedModifier = 1.0) {
        if (!this.currentBillet) return;

        const data = this.currentBillet.userData;
        const metalType = data.metalType || 'iron';
        const metalProps = this.metalTypes[metalType] || this.metalTypes.iron;

        // Shape progress - modified by speed and metal properties
        const baseProgress = 0.05;
        const metalBonus = 1.0 + metalProps.forgingBonus;
        const progressGain = baseProgress * effectiveness * metalBonus / speedModifier;
        data.shapeProgress += progressGain;

        // Defects from bad hits - metal defect resistance helps
        const defectResistance = metalProps.defectResistance || 0;
        const materialKnowledgeBonus = this.training.materialKnowledge * 0.005; // Up to 50% reduction at max

        if (effectiveness < 0.3) {
            const defectAmount = 0.1 * (1.0 - defectResistance - materialKnowledgeBonus);
            data.defects += Math.max(0, defectAmount);
            data.mishandled = true;
        }

        if (heat < 0.4 || heat > 0.85) {
            const tempDefectAmount = 0.05 * (1.0 - defectResistance * 0.5);
            data.defects += Math.max(0, tempDefectAmount);
        }

        // Straightness affected by off-axis hits
        if (effectiveness < 0.5) {
            data.straightness *= 0.995;
        }

        // Visual deformation
        this.currentBillet.scale.y *= 0.95;
        this.currentBillet.scale.x *= 1.02;

        // Sparks based on heat - different metals spark differently
        if (heat > 0.5) {
            const sparkIntensity = heat * (metalType === 'steel' ? 1.2 : metalType === 'mithril' ? 0.5 : 1.0);
            this.createSparks(this.currentBillet.position, sparkIntensity);
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
            },
            rareWeaponsForged: this.rareWeaponsForged
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

    advanceTraining(skill, amount) {
        const maxLevel = 100;
        const before = this.training[skill];
        this.training[skill] = Math.min(maxLevel, this.training[skill] + amount);

        // Auto-save on training milestones
        if (Math.floor(before / 10) !== Math.floor(this.training[skill] / 10)) {
            this.saveGameState();
        }
    }

    finishWeapon() {
        if (!this.currentBillet) return null;
        if (!this.billetAnvilLocked) {
            this.showFeedback('Place billet on anvil to finish');
            return null;
        }

        const data = this.currentBillet.userData;

        // Minimum shape progress required
        if (data.shapeProgress < 1.0) {
            this.showFeedback('Weapon not sufficiently forged');
            return null;
        }

        // Calculate quality score (0-100)
        const shapeScore = Math.min(100, data.shapeProgress * 20);
        const straightnessScore = data.straightness * 30;
        const defectPenalty = Math.min(50, data.defects * 10);
        const trainingBonus = this.training.precisionForging * 0.2;

        let quality = shapeScore + straightnessScore - defectPenalty + trainingBonus;
        quality = Math.max(0, Math.min(100, quality));

        // Determine rarity based on quality
        const rarity = this.determineRarity(quality);

        // Create weapon object
        const weapon = {
            type: this.selectedWeaponType,
            rarity: rarity,
            quality: quality,
            metalType: data.metalType,
            value: this.calculateValue(this.selectedWeaponType, rarity, quality),
            defects: data.defects,
            straightness: data.straightness
        };

        // Track rare weapons
        const rarityIndex = this.rarities.indexOf(rarity);
        if (rarityIndex >= 3) { // Rare or better
            this.rareWeaponsForged++;
            if (this.rareWeaponsForged >= 5 && !this.grindingUnlocked) {
                this.grindingUnlocked = true;
                this.polishingUnlocked = true;
                this.showFeedback('GRINDING & POLISHING UNLOCKED!');
                this.createGrindingStation();
                this.createPolishingStation();
            }
        }

        // Add to inventory
        this.inventory.push(weapon);

        // Training advancement
        this.advanceTraining('precisionForging', quality * 0.01);

        // Remove billet
        this.scene.remove(this.currentBillet);
        const index = this.physicsObjects.indexOf(this.currentBillet);
        if (index > -1) this.physicsObjects.splice(index, 1);
        this.currentBillet = null;
        this.billetAnvilLocked = false;

        // Save state
        this.saveGameState();

        this.showFeedback(`${rarity} ${weapon.type} forged! Quality: ${quality.toFixed(0)}`);
        return weapon;
    }

    determineRarity(quality) {
        // Before grinding/polishing unlock
        if (!this.grindingUnlocked) {
            if (quality < 30) return 'Crude';
            if (quality < 50) return 'Common';
            if (quality < 70) return 'Fine';
            if (quality < 90) return 'Rare';
            // 1% chance for Superior if near-perfect
            if (quality >= 98 && Math.random() < 0.01) return 'Superior';
            return 'Rare';
        }

        // After grinding/polishing unlock
        if (quality < 30) return 'Crude';
        if (quality < 50) return 'Common';
        if (quality < 65) return 'Fine';
        if (quality < 80) return 'Rare';
        if (quality < 92) {
            // Superior: 4-6% based on quality
            const chance = (quality - 80) / 200;
            return Math.random() < chance ? 'Superior' : 'Rare';
        }
        if (quality < 98) {
            // Masterwork: ~0.5-1%
            return Math.random() < 0.01 ? 'Masterwork' : 'Superior';
        }
        // Legendary: extremely rare
        return Math.random() < 0.001 ? 'Legendary' : 'Masterwork';
    }

    calculateValue(weaponType, rarity, quality) {
        const baseValues = {
            'Dagger': 60,
            'Short Sword': 100,
            'Long Sword': 100,
            'Greatsword': 200,
            'Axe': 150,
            'War Hammer': 120,
            'Spear': 90,
            'Mace': 120,
            'Halberd': 200,
            'Curved Blade': 100
        };

        const rarityMultipliers = {
            'Crude': 0.5,
            'Common': 1.0,
            'Fine': 2.0,
            'Rare': 4.0,
            'Superior': 8.0,
            'Masterwork': 16.0,
            'Legendary': 32.0
        };

        const baseValue = baseValues[weaponType] || 100;
        const rarityMult = rarityMultipliers[rarity] || 1.0;
        const qualityMult = 0.5 + (quality / 100);

        return Math.floor(baseValue * rarityMult * qualityMult);
    }

    quenchBillet() {
        if (!this.currentBillet) return;
        if (this.grabbedObjectLeft !== this.currentBillet && this.grabbedObjectRight !== this.currentBillet) {
            this.showFeedback('Hold billet to quench');
            return;
        }

        // Check proximity to quench tub
        const dist = this.currentBillet.position.distanceTo(this.quenchTub.position);
        if (dist > 1.0) return;

        const data = this.currentBillet.userData;
        const heatBefore = data.heat;

        // Play quench sound
        this.playQuenchSound();

        // Quenching rapidly cools the billet
        data.heat = Math.max(0, data.heat - 0.5);

        // Quenching at wrong temperature can cause defects
        if (heatBefore > 0.7) {
            data.defects += 0.2;
            this.showFeedback('Quenched too hot - cracking!');
            this.playErrorSound();
        } else if (heatBefore > 0.3) {
            this.showFeedback('Quenched');
        } else {
            this.showFeedback('Already cool');
        }
    }

    // ========== GRINDING SYSTEM ==========
    startGrinding() {
        if (!this.currentBillet) return;
        if (!this.grindingUnlocked) {
            this.showFeedback('Grinding not yet unlocked');
            return;
        }

        const data = this.currentBillet.userData;

        // Must be sufficiently forged
        if (data.shapeProgress < 1.0) {
            this.showFeedback('Forge the weapon first');
            return;
        }

        // Must be cool
        if (data.heat > 0.1) {
            this.showFeedback('Metal too hot to grind');
            return;
        }

        this.isGrinding = true;
        this.grindingProgress = 0;
        this.currentBillet.position.copy(this.grindingStation.position);
        this.currentBillet.position.y += 0.5;
        this.showFeedback('Grinding... Hold G to continue');
    }

    updateGrinding(delta) {
        if (!this.isGrinding || !this.currentBillet) return;

        // Must hold G key to grind
        if (!this.keys.g) return;

        const data = this.currentBillet.userData;

        // Grinding progress
        this.grindingProgress += delta * 0.2; // Takes ~5 seconds

        // Fatigue affects grinding quality
        const fatigueEffect = 1.0 - (this.fatigue * 0.5);

        // Grinding removes surface imperfections
        if (this.grindingProgress < 1.0) {
            // Slight straightness improvement
            data.straightness = Math.min(1.0, data.straightness + 0.001 * fatigueEffect);

            // Can reveal existing flaws (defects become visible)
            // If over-grinding (progress > 0.8), risks damage
            if (this.grindingProgress > 0.8) {
                const overgrindRisk = (this.grindingProgress - 0.8) * 0.1;
                if (Math.random() < overgrindRisk) {
                    data.defects += 0.02;
                }
            }

            // Play grinding sound periodically
            if (Math.random() < 0.1) {
                this.playGrindSound();
            }
        } else {
            // Grinding complete
            this.isGrinding = false;
            this.grindingProgress = 0;

            // Apply grinding bonus
            data.groundLevel = (data.groundLevel || 0) + 1;

            this.showFeedback('Grinding complete');
            this.playSuccessSound();

            // Return billet to anvil area
            this.currentBillet.position.set(0, 1.15, 0);
            this.billetAnvilLocked = true;
        }

        // Increase fatigue
        this.fatigue = Math.min(1.0, this.fatigue + delta * 0.01);
    }

    // ========== POLISHING SYSTEM ==========
    startPolishing() {
        if (!this.currentBillet) return;
        if (!this.polishingUnlocked) {
            this.showFeedback('Polishing not yet unlocked');
            return;
        }

        const data = this.currentBillet.userData;

        // Must be sufficiently forged
        if (data.shapeProgress < 1.0) {
            this.showFeedback('Forge the weapon first');
            return;
        }

        // Must be cool
        if (data.heat > 0.1) {
            this.showFeedback('Metal too hot to polish');
            return;
        }

        // Should be ground first for best results
        if (!data.groundLevel || data.groundLevel < 1) {
            this.showFeedback('Grind the weapon first for best results');
        }

        this.isPolishing = true;
        this.polishingProgress = 0;
        this.currentBillet.position.copy(this.polishingStation.position);
        this.currentBillet.position.y += 0.5;
        this.showFeedback('Polishing... Hold P to continue');
    }

    updatePolishing(delta) {
        if (!this.isPolishing || !this.currentBillet) return;

        // Must hold P key to polish
        if (!this.keys.p) return;

        const data = this.currentBillet.userData;

        // Polishing progress - EXTREMELY sensitive to fatigue
        const fatigueMultiplier = Math.max(0.1, 1.0 - this.fatigue);
        this.polishingProgress += delta * 0.15 * fatigueMultiplier; // Takes ~7 seconds at optimal

        if (this.polishingProgress < 1.0) {
            // Polishing improves surface quality
            // High fatigue causes mistakes
            if (this.fatigue > 0.7 && Math.random() < 0.05) {
                data.defects += 0.01;
                this.showFeedback('Slip! Too fatigued');
            }
        } else {
            // Polishing complete
            this.isPolishing = false;
            this.polishingProgress = 0;

            // Apply polishing bonus - raises quality ceiling
            data.polishLevel = (data.polishLevel || 0) + 1;

            // Small quality boost (2-5% depending on fatigue)
            const qualityBoost = 0.02 + (0.03 * (1.0 - this.fatigue));
            data.shapeProgress += qualityBoost;

            this.showFeedback('Polishing complete');
            this.playSuccessSound();

            // Return billet to anvil area
            this.currentBillet.position.set(0, 1.15, 0);
            this.billetAnvilLocked = true;
        }

        // Polishing is less tiring than grinding
        this.fatigue = Math.min(1.0, this.fatigue + delta * 0.005);
    }

    createGrindingStation() {
        if (this.grindingStation) return;

        const station = new THREE.Mesh(
            new THREE.BoxGeometry(0.8, 0.6, 0.6),
            new THREE.MeshStandardMaterial({ color: 0x4a4a4a, metalness: 0.8, roughness: 0.3 })
        );
        station.position.set(3, 0.3, -2);
        station.castShadow = true;
        this.scene.add(station);
        this.grindingStation = station;
    }

    createPolishingStation() {
        if (this.polishingStation) return;

        const station = new THREE.Mesh(
            new THREE.BoxGeometry(0.6, 0.5, 0.6),
            new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.6 })
        );
        station.position.set(3, 0.25, 2);
        station.castShadow = true;
        this.scene.add(station);
        this.polishingStation = station;
    }

    cycleWeaponType() {
        const currentIndex = this.weaponTypes.indexOf(this.selectedWeaponType);
        const nextIndex = (currentIndex + 1) % this.weaponTypes.length;
        this.selectedWeaponType = this.weaponTypes[nextIndex];
        this.showFeedback(`Selected: ${this.selectedWeaponType}`);
    }

    toggleInventory() {
        const existing = document.getElementById('inventory-ui');
        if (existing) {
            existing.remove();
            return;
        }

        const ui = document.createElement('div');
        ui.id = 'inventory-ui';
        ui.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.9);
            color: #ffaa44;
            padding: 20px;
            border-radius: 10px;
            font-family: monospace;
            font-size: 14px;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
            z-index: 1000;
        `;

        let html = `<h2 style="margin-top:0">Inventory (${this.inventory.length} weapons)</h2>`;
        html += `<p>Money: $${this.money}</p>`;
        html += `<p>Rare Weapons Forged: ${this.rareWeaponsForged}</p>`;
        html += `<hr>`;

        if (this.inventory.length === 0) {
            html += `<p>No weapons yet. Forge something!</p>`;
        } else {
            this.inventory.forEach((weapon, i) => {
                html += `<div style="margin: 10px 0; padding: 10px; background: rgba(255,255,255,0.1);">`;
                html += `<strong>${weapon.rarity} ${weapon.type}</strong><br>`;
                html += `Quality: ${weapon.quality.toFixed(0)} | Value: $${weapon.value}<br>`;
                html += `<button onclick="window.game.sellWeapon(${i})" style="margin-top:5px; padding:5px 10px; cursor:pointer;">Sell</button>`;
                html += `</div>`;
            });
        }

        html += `<br><button onclick="document.getElementById('inventory-ui').remove()" style="padding:10px 20px; cursor:pointer;">Close (I)</button>`;

        ui.innerHTML = html;
        document.body.appendChild(ui);
    }

    sellWeapon(index) {
        if (index < 0 || index >= this.inventory.length) return;

        const weapon = this.inventory[index];
        this.money += weapon.value;
        this.inventory.splice(index, 1);

        this.saveGameState();
        this.showFeedback(`Sold ${weapon.rarity} ${weapon.type} for $${weapon.value}`);

        // Refresh inventory UI if open
        const ui = document.getElementById('inventory-ui');
        if (ui) {
            ui.remove();
            this.toggleInventory();
        }
    }

    showHUD() {
        const existing = document.getElementById('game-hud');
        if (existing) existing.remove();

        const hud = document.createElement('div');
        hud.id = 'game-hud';
        hud.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            color: #ffaa44;
            font-family: monospace;
            font-size: 14px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
            pointer-events: none;
            z-index: 100;
        `;

        let html = `<div>Weapon: ${this.selectedWeaponType}</div>`;
        html += `<div>Metal: ${this.selectedMetalType || 'iron'}</div>`;
        html += `<div>Money: $${this.money}</div>`;
        html += `<div>Inventory: ${this.inventory.length} weapons</div>`;

        // Show grinding/polishing status
        if (this.isGrinding) {
            html += `<div style="color:#ff6644">GRINDING: ${(this.grindingProgress * 100).toFixed(0)}%</div>`;
        }
        if (this.isPolishing) {
            html += `<div style="color:#66aaff">POLISHING: ${(this.polishingProgress * 100).toFixed(0)}%</div>`;
        }

        // Show unlock status
        if (this.grindingUnlocked) {
            html += `<div style="color:#66ff66; font-size:10px;">Grinding/Polishing: UNLOCKED</div>`;
        } else {
            html += `<div style="color:#666; font-size:10px;">Rare weapons forged: ${this.rareWeaponsForged}/5</div>`;
        }

        html += `<br>`;
        html += `<div style="font-size:11px; opacity:0.7;">`;
        html += `R - Weapon | M - Metal | N - New Billet<br>`;
        html += `F - Finish | Q - Quench | I - Inventory<br>`;
        html += `G - Grind (hold) | P - Polish (hold)<br>`;
        html += `WASD - Move | Space - Jump<br>`;
        html += `LMB/RMB - Hands | Release - Camera`;
        html += `</div>`;

        hud.innerHTML = html;
        document.body.appendChild(hud);
    }

    updateHUD() {
        this.showHUD();
    }

    // ========== BILLET MANAGEMENT ==========
    spawnNewBillet() {
        // Remove current billet if exists
        if (this.currentBillet) {
            this.scene.remove(this.currentBillet);
            const index = this.physicsObjects.indexOf(this.currentBillet);
            if (index > -1) this.physicsObjects.splice(index, 1);
            this.currentBillet = null;
            this.billetAnvilLocked = false;
        }

        const metalType = this.selectedMetalType || 'iron';
        this.createBillet(metalType);
        this.showFeedback(`New ${metalType} billet created`);
    }

    cycleMetalType() {
        const metals = Object.keys(this.metalTypes);
        const currentIndex = metals.indexOf(this.selectedMetalType || 'iron');
        const nextIndex = (currentIndex + 1) % metals.length;
        this.selectedMetalType = metals[nextIndex];
        this.showFeedback(`Metal: ${this.selectedMetalType}`);
    }

    // ========== WEAPON MODEL GENERATION ==========
    createWeaponModel(weaponType, rarity) {
        // Generate unique weapon models based on type and rarity
        const group = new THREE.Group();
        const rarityIndex = this.rarities.indexOf(rarity);
        const qualityColor = this.getWeaponColor(rarityIndex);

        const bladeMaterial = new THREE.MeshStandardMaterial({
            color: qualityColor,
            metalness: 0.9,
            roughness: 0.2 - (rarityIndex * 0.02)
        });

        const handleMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a3020,
            roughness: 0.7
        });

        // Generate different shapes based on weapon type
        switch (weaponType) {
            case 'Dagger':
                this.buildDaggerModel(group, bladeMaterial, handleMaterial, rarityIndex);
                break;
            case 'Short Sword':
            case 'Long Sword':
                this.buildSwordModel(group, bladeMaterial, handleMaterial, rarityIndex, weaponType === 'Long Sword' ? 1.5 : 1.0);
                break;
            case 'Greatsword':
                this.buildSwordModel(group, bladeMaterial, handleMaterial, rarityIndex, 2.0);
                break;
            case 'Axe':
                this.buildAxeModel(group, bladeMaterial, handleMaterial, rarityIndex);
                break;
            case 'War Hammer':
                this.buildWarHammerModel(group, bladeMaterial, handleMaterial, rarityIndex);
                break;
            case 'Spear':
                this.buildSpearModel(group, bladeMaterial, handleMaterial, rarityIndex);
                break;
            case 'Mace':
                this.buildMaceModel(group, bladeMaterial, handleMaterial, rarityIndex);
                break;
            case 'Halberd':
                this.buildHalberdModel(group, bladeMaterial, handleMaterial, rarityIndex);
                break;
            case 'Curved Blade':
                this.buildCurvedBladeModel(group, bladeMaterial, handleMaterial, rarityIndex);
                break;
            default:
                this.buildSwordModel(group, bladeMaterial, handleMaterial, rarityIndex, 1.0);
        }

        return group;
    }

    getWeaponColor(rarityIndex) {
        const colors = [
            0x5a5a5a,  // Crude - dull gray
            0x7a7a7a,  // Common - gray
            0x8a8a9a,  // Fine - silver-gray
            0x6a9aca,  // Rare - blue steel
            0x9a6aca,  // Superior - purple steel
            0xca9a6a,  // Masterwork - golden
            0xffffff   // Legendary - white/bright
        ];
        return colors[Math.min(rarityIndex, colors.length - 1)];
    }

    buildDaggerModel(group, bladeMaterial, handleMaterial, rarityIndex) {
        // Blade
        const blade = new THREE.Mesh(
            new THREE.BoxGeometry(0.02 + rarityIndex * 0.002, 0.15, 0.01),
            bladeMaterial
        );
        blade.position.y = 0.1;
        group.add(blade);

        // Handle
        const handle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.015, 0.015, 0.08, 8),
            handleMaterial
        );
        handle.position.y = -0.02;
        group.add(handle);

        // Guard (varies by rarity)
        if (rarityIndex >= 2) {
            const guard = new THREE.Mesh(
                new THREE.BoxGeometry(0.04, 0.01, 0.02),
                bladeMaterial
            );
            guard.position.y = 0.02;
            group.add(guard);
        }
    }

    buildSwordModel(group, bladeMaterial, handleMaterial, rarityIndex, lengthMultiplier) {
        // Blade
        const bladeLength = 0.3 * lengthMultiplier;
        const blade = new THREE.Mesh(
            new THREE.BoxGeometry(0.03 + rarityIndex * 0.003, bladeLength, 0.008),
            bladeMaterial
        );
        blade.position.y = bladeLength / 2 + 0.05;
        group.add(blade);

        // Handle
        const handleLength = 0.1 * lengthMultiplier;
        const handle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.015, 0.018, handleLength, 8),
            handleMaterial
        );
        handle.position.y = -handleLength / 2;
        group.add(handle);

        // Guard
        const guard = new THREE.Mesh(
            new THREE.BoxGeometry(0.08 + rarityIndex * 0.01, 0.015, 0.02),
            bladeMaterial
        );
        guard.position.y = 0.03;
        group.add(guard);

        // Pommel (higher rarity)
        if (rarityIndex >= 3) {
            const pommel = new THREE.Mesh(
                new THREE.SphereGeometry(0.02, 8, 8),
                bladeMaterial
            );
            pommel.position.y = -handleLength - 0.02;
            group.add(pommel);
        }
    }

    buildAxeModel(group, bladeMaterial, handleMaterial, rarityIndex) {
        // Axe head
        const head = new THREE.Mesh(
            new THREE.BoxGeometry(0.12 + rarityIndex * 0.01, 0.1, 0.02),
            bladeMaterial
        );
        head.position.set(0.05, 0.15, 0);
        group.add(head);

        // Handle
        const handle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.02, 0.4, 8),
            handleMaterial
        );
        handle.position.y = -0.05;
        group.add(handle);
    }

    buildWarHammerModel(group, bladeMaterial, handleMaterial, rarityIndex) {
        // Hammer head
        const head = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, 0.06, 0.1 + rarityIndex * 0.01),
            bladeMaterial
        );
        head.position.y = 0.2;
        group.add(head);

        // Handle
        const handle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.025, 0.35, 8),
            handleMaterial
        );
        handle.position.y = -0.02;
        group.add(handle);
    }

    buildSpearModel(group, bladeMaterial, handleMaterial, rarityIndex) {
        // Spear head
        const head = new THREE.Mesh(
            new THREE.ConeGeometry(0.02 + rarityIndex * 0.002, 0.15, 4),
            bladeMaterial
        );
        head.position.y = 0.45;
        group.add(head);

        // Shaft
        const shaft = new THREE.Mesh(
            new THREE.CylinderGeometry(0.015, 0.015, 0.8, 8),
            handleMaterial
        );
        shaft.position.y = 0;
        group.add(shaft);
    }

    buildMaceModel(group, bladeMaterial, handleMaterial, rarityIndex) {
        // Mace head
        const head = new THREE.Mesh(
            new THREE.SphereGeometry(0.05 + rarityIndex * 0.005, 8, 8),
            bladeMaterial
        );
        head.position.y = 0.2;
        group.add(head);

        // Spikes (higher rarity)
        if (rarityIndex >= 2) {
            for (let i = 0; i < 6; i++) {
                const spike = new THREE.Mesh(
                    new THREE.ConeGeometry(0.01, 0.03, 4),
                    bladeMaterial
                );
                const angle = (i / 6) * Math.PI * 2;
                spike.position.set(Math.cos(angle) * 0.05, 0.2, Math.sin(angle) * 0.05);
                spike.rotation.z = -Math.PI / 2 * Math.cos(angle);
                spike.rotation.x = -Math.PI / 2 * Math.sin(angle);
                group.add(spike);
            }
        }

        // Handle
        const handle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.015, 0.02, 0.25, 8),
            handleMaterial
        );
        handle.position.y = 0;
        group.add(handle);
    }

    buildHalberdModel(group, bladeMaterial, handleMaterial, rarityIndex) {
        // Axe blade
        const blade = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.15, 0.015),
            bladeMaterial
        );
        blade.position.set(0.04, 0.5, 0);
        group.add(blade);

        // Spike
        const spike = new THREE.Mesh(
            new THREE.ConeGeometry(0.015, 0.12, 4),
            bladeMaterial
        );
        spike.position.y = 0.65;
        group.add(spike);

        // Shaft
        const shaft = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.02, 1.0, 8),
            handleMaterial
        );
        shaft.position.y = 0;
        group.add(shaft);
    }

    buildCurvedBladeModel(group, bladeMaterial, handleMaterial, rarityIndex) {
        // Curved blade using custom geometry
        const curve = new THREE.QuadraticBezierCurve3(
            new THREE.Vector3(0, 0.05, 0),
            new THREE.Vector3(0.05, 0.2, 0),
            new THREE.Vector3(0, 0.35, 0)
        );
        const points = curve.getPoints(10);
        const bladeShape = new THREE.Shape();
        bladeShape.moveTo(0, 0);
        bladeShape.lineTo(0.02, 0);
        bladeShape.lineTo(0.015, 0.3);
        bladeShape.lineTo(0, 0.3);
        bladeShape.lineTo(0, 0);

        const blade = new THREE.Mesh(
            new THREE.BoxGeometry(0.025, 0.3, 0.008),
            bladeMaterial
        );
        blade.position.y = 0.2;
        blade.rotation.z = 0.15; // Slight curve effect
        group.add(blade);

        // Handle
        const handle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.015, 0.018, 0.1, 8),
            handleMaterial
        );
        handle.position.y = 0;
        group.add(handle);

        // Guard
        const guard = new THREE.Mesh(
            new THREE.BoxGeometry(0.05, 0.01, 0.015),
            bladeMaterial
        );
        guard.position.y = 0.05;
        group.add(guard);
    }
}

// Initialize game
window.addEventListener('DOMContentLoaded', () => {
    const game = new ForgeHands();
    window.game = game;

    // Add test billet (synchronously after game is ready)
    game.createBillet('iron');
});
