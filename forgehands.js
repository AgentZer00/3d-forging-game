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
        this.selectedMetalType = 'iron'; // BUG FIX: Initialize metal type

        // Strike cooldown
        this.lastStrikeTime = 0;
        this.strikeCooldown = 0.3; // 300ms between strikes

        // Jump
        this.isJumping = false;
        this.jumpVelocity = 0;
        this.isGrounded = true;

        // Steam particles for quenching
        this.activeSteam = [];

        // Day/night cycle
        this.timeOfDay = 0.5; // 0 = midnight, 0.5 = noon, 1 = midnight
        this.daySpeed = 0.01; // How fast time passes

        // Ambient sound timer
        this.lastAmbientSound = 0;
        this.ambientSoundInterval = 5; // seconds

        // Shop system
        this.shopOpen = false;
        this.shopInventory = {
            metals: [
                { type: 'iron', price: 10, stock: 99 },
                { type: 'steel', price: 25, stock: 20 },
                { type: 'bronze', price: 15, stock: 30 },
                { type: 'mithril', price: 100, stock: 5 },
                { type: 'damascus', price: 150, stock: 3 }
            ],
            tools: [
                { name: 'Steel Hammer', price: 200, owned: false },
                { name: 'Master Hammer', price: 500, owned: false },
                { name: 'Fine Tongs', price: 150, owned: false }
            ]
        };

        // Achievement system
        this.achievements = {
            firstWeapon: { name: 'First Forge', desc: 'Forge your first weapon', unlocked: false },
            tenWeapons: { name: 'Apprentice Smith', desc: 'Forge 10 weapons', unlocked: false },
            fiftyWeapons: { name: 'Journeyman', desc: 'Forge 50 weapons', unlocked: false },
            hundredWeapons: { name: 'Master Blacksmith', desc: 'Forge 100 weapons', unlocked: false },
            firstRare: { name: 'Quality Crafts', desc: 'Forge a Rare weapon', unlocked: false },
            firstSuperior: { name: 'Superior Work', desc: 'Forge a Superior weapon', unlocked: false },
            firstMasterwork: { name: 'Masterwork', desc: 'Forge a Masterwork weapon', unlocked: false },
            legendary: { name: 'Legendary Smith', desc: 'Forge a Legendary weapon', unlocked: false },
            richSmith: { name: 'Prosperous', desc: 'Earn 1000 gold', unlocked: false },
            wealthySmith: { name: 'Wealthy', desc: 'Earn 10000 gold', unlocked: false },
            allMetals: { name: 'Metallurgist', desc: 'Work with all metal types', unlocked: false },
            perfectHeat: { name: 'Heat Master', desc: 'Strike 100 times at perfect heat', unlocked: false }
        };
        this.totalWeaponsForged = 0;
        this.totalMoneyEarned = 0;
        this.perfectHeatStrikes = 0;
        this.metalsWorked = new Set();

        // Forge bellows
        this.bellows = null;
        this.bellowsActive = false;
        this.forgeHeatBoost = 0;

        // Weapon display rack
        this.displayedWeapons = [];
        this.weaponRack = null

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
        this.createWorkshopFeatures(); // NEW: Additional workshop elements
        this.setupEventListeners();
        this.initAudio();
        this.loadGameState();
        this.animate();
    }

    createWorkshopFeatures() {
        // Create forge bellows
        this.createBellows();

        // Create weapon display rack
        this.createWeaponRack();

        // Create workbench
        this.createWorkbench();

        // Water is now added inside createQuenchTub()

        // Create coal pile near forge
        this.createCoalPile();
    }

    createBellows() {
        const bellowsGroup = new THREE.Group();

        // Bellows body
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(0.4, 0.3, 0.5),
            new THREE.MeshStandardMaterial({ color: 0x5a3a20, roughness: 0.8 })
        );
        bellowsGroup.add(body);

        // Nozzle
        const nozzle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03, 0.05, 0.3, 8),
            new THREE.MeshStandardMaterial({ color: 0x3a3a3a, metalness: 0.8 })
        );
        nozzle.rotation.z = Math.PI / 2;
        nozzle.position.set(0.35, 0, 0);
        bellowsGroup.add(nozzle);

        // Handle
        const handle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.02, 0.4, 8),
            new THREE.MeshStandardMaterial({ color: 0x4a3020, roughness: 0.7 })
        );
        handle.position.set(-0.1, 0.25, 0);
        bellowsGroup.add(handle);

        bellowsGroup.position.set(-3.5, 0.5, 0.8);
        bellowsGroup.userData.type = 'bellows';
        bellowsGroup.userData.grabbable = true;

        this.scene.add(bellowsGroup);
        this.bellows = bellowsGroup;
    }

    createWeaponRack() {
        const rackGroup = new THREE.Group();

        // Back board
        const backBoard = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 1.2, 0.05),
            new THREE.MeshStandardMaterial({ color: 0x4a3020, roughness: 0.8 })
        );
        backBoard.position.y = 0.6;
        rackGroup.add(backBoard);

        // Horizontal bars for holding weapons
        for (let i = 0; i < 3; i++) {
            const bar = new THREE.Mesh(
                new THREE.CylinderGeometry(0.02, 0.02, 1.4, 8),
                new THREE.MeshStandardMaterial({ color: 0x3a3a3a, metalness: 0.6 })
            );
            bar.rotation.z = Math.PI / 2;
            bar.position.set(0, 0.3 + i * 0.35, 0.08);
            rackGroup.add(bar);
        }

        rackGroup.position.set(4, 0, -3);
        rackGroup.rotation.y = -Math.PI / 4;
        this.scene.add(rackGroup);
        this.weaponRack = rackGroup;
    }

    createWorkbench() {
        const benchGroup = new THREE.Group();

        // Table top
        const top = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 0.1, 0.8),
            new THREE.MeshStandardMaterial({ color: 0x5a4030, roughness: 0.7 })
        );
        top.position.y = 0.85;
        top.castShadow = true;
        top.receiveShadow = true;
        benchGroup.add(top);

        // Legs
        for (let x = -0.6; x <= 0.6; x += 1.2) {
            for (let z = -0.3; z <= 0.3; z += 0.6) {
                const leg = new THREE.Mesh(
                    new THREE.BoxGeometry(0.1, 0.8, 0.1),
                    new THREE.MeshStandardMaterial({ color: 0x4a3020, roughness: 0.8 })
                );
                leg.position.set(x, 0.4, z);
                leg.castShadow = true;
                benchGroup.add(leg);
            }
        }

        benchGroup.position.set(3, 0, 2);
        this.scene.add(benchGroup);
    }

    createCoalPile() {
        // Coal pile near forge
        const coalGroup = new THREE.Group();

        for (let i = 0; i < 15; i++) {
            const coal = new THREE.Mesh(
                new THREE.DodecahedronGeometry(0.05 + Math.random() * 0.05),
                new THREE.MeshStandardMaterial({
                    color: 0x1a1a1a,
                    roughness: 0.9
                })
            );
            coal.position.set(
                (Math.random() - 0.5) * 0.4,
                Math.random() * 0.15,
                (Math.random() - 0.5) * 0.4
            );
            coal.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            coalGroup.add(coal);
        }

        coalGroup.position.set(-3.8, 0, -0.5);
        this.scene.add(coalGroup);
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
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: 'high-performance',
            stencil: false
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // High quality shadow settings
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.shadowMap.autoUpdate = true;

        // Enhanced tone mapping for realistic lighting
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        this.renderer.physicallyCorrectLights = true;
        this.renderer.outputEncoding = THREE.sRGBEncoding;

        // Enable logarithmic depth buffer for better depth precision
        this.renderer.logarithmicDepthBuffer = true;

        document.getElementById('game-container').appendChild(this.renderer.domElement);

        // Create environment map for realistic reflections
        this.createEnvironmentMap();

        // Setup post-processing
        this.setupPostProcessing();
    }

    createEnvironmentMap() {
        // Create a procedural environment map for forge atmosphere
        const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
        pmremGenerator.compileEquirectangularShader();

        // Create a warm forge-like environment
        const envScene = new THREE.Scene();

        // Gradient background - dark with warm highlights
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Create gradient
        const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
        gradient.addColorStop(0, '#ff6622');
        gradient.addColorStop(0.3, '#442211');
        gradient.addColorStop(0.7, '#221108');
        gradient.addColorStop(1, '#110804');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 512);

        // Add some noise for realism
        const imageData = ctx.getImageData(0, 0, 512, 512);
        for (let i = 0; i < imageData.data.length; i += 4) {
            const noise = (Math.random() - 0.5) * 10;
            imageData.data[i] = Math.max(0, Math.min(255, imageData.data[i] + noise));
            imageData.data[i + 1] = Math.max(0, Math.min(255, imageData.data[i + 1] + noise));
            imageData.data[i + 2] = Math.max(0, Math.min(255, imageData.data[i + 2] + noise));
        }
        ctx.putImageData(imageData, 0, 0);

        const envTexture = new THREE.CanvasTexture(canvas);
        envTexture.mapping = THREE.EquirectangularReflectionMapping;

        this.scene.environment = pmremGenerator.fromEquirectangular(envTexture).texture;
        this.scene.background = new THREE.Color(0x110804);

        pmremGenerator.dispose();
        envTexture.dispose();
    }

    setupPostProcessing() {
        // Store composer for post-processing effects
        // We'll use a simple bloom effect via shader
        this.bloomStrength = 0.4;
        this.bloomEnabled = true;

        // Create render targets for bloom
        const renderTargetParams = {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat
        };

        this.bloomRenderTarget = new THREE.WebGLRenderTarget(
            window.innerWidth / 2,
            window.innerHeight / 2,
            renderTargetParams
        );
    }

    setupLights() {
        // Ambient light - very subtle for dark forge atmosphere
        const ambient = new THREE.AmbientLight(0x1a1510, 0.15);
        this.scene.add(ambient);
        this.ambientLight = ambient;

        // Hemisphere light for subtle color variation (sky/ground)
        const hemi = new THREE.HemisphereLight(0x443322, 0x111108, 0.3);
        this.scene.add(hemi);

        // Main forge light - intense orange glow
        const forgeLight = new THREE.PointLight(0xff4400, 25, 8);
        forgeLight.position.set(-3, 1.2, 0);
        forgeLight.castShadow = true;
        forgeLight.shadow.mapSize.width = 1024;
        forgeLight.shadow.mapSize.height = 1024;
        forgeLight.shadow.bias = -0.001;
        forgeLight.shadow.radius = 4;
        this.scene.add(forgeLight);
        this.forgeLight = forgeLight;

        // Secondary forge ember glow (flickering)
        const emberLight = new THREE.PointLight(0xff2200, 8, 4);
        emberLight.position.set(-3.2, 0.8, 0.2);
        this.scene.add(emberLight);
        this.emberLight = emberLight;

        // Third forge light for depth
        const forgeDepthLight = new THREE.PointLight(0xff6600, 5, 3);
        forgeDepthLight.position.set(-2.5, 1.0, -0.3);
        this.scene.add(forgeDepthLight);
        this.forgeDepthLight = forgeDepthLight;

        // Overhead lantern light - warm tungsten color
        const lantern = new THREE.SpotLight(0xffcc88, 8, 15, Math.PI / 4, 0.5, 2);
        lantern.position.set(0, 5, 0);
        lantern.target.position.set(0, 0, 0);
        lantern.castShadow = true;
        lantern.shadow.mapSize.width = 2048;
        lantern.shadow.mapSize.height = 2048;
        lantern.shadow.bias = -0.0001;
        lantern.shadow.radius = 2;
        this.scene.add(lantern);
        this.scene.add(lantern.target);
        this.lanternLight = lantern;

        // Window light - cool blue moonlight/daylight
        const windowLight = new THREE.DirectionalLight(0x4466aa, 0.4);
        windowLight.position.set(5, 4, 3);
        windowLight.castShadow = true;
        windowLight.shadow.mapSize.width = 2048;
        windowLight.shadow.mapSize.height = 2048;
        windowLight.shadow.camera.near = 0.5;
        windowLight.shadow.camera.far = 20;
        windowLight.shadow.camera.left = -10;
        windowLight.shadow.camera.right = 10;
        windowLight.shadow.camera.top = 10;
        windowLight.shadow.camera.bottom = -10;
        windowLight.shadow.bias = -0.0001;
        this.scene.add(windowLight);
        this.windowLight = windowLight;

        // Anvil accent light - subtle rim light
        const anvilLight = new THREE.SpotLight(0xffeedd, 3, 5, Math.PI / 6, 0.8, 2);
        anvilLight.position.set(1, 3, 1);
        anvilLight.target.position.set(0, 1, 0);
        this.scene.add(anvilLight);
        this.scene.add(anvilLight.target);

        // Create visible light fixtures
        this.createLightFixtures();
    }

    createLightFixtures() {
        // Overhead lantern fixture
        const lanternGroup = new THREE.Group();

        // Chain links
        for (let i = 0; i < 8; i++) {
            const link = new THREE.Mesh(
                new THREE.TorusGeometry(0.03, 0.008, 8, 12),
                new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.9, roughness: 0.4 })
            );
            link.position.y = 5.5 - i * 0.08;
            link.rotation.x = i % 2 === 0 ? 0 : Math.PI / 2;
            lanternGroup.add(link);
        }

        // Lantern body
        const lanternBody = new THREE.Mesh(
            new THREE.CylinderGeometry(0.15, 0.12, 0.3, 8),
            new THREE.MeshStandardMaterial({
                color: 0x1a1a1a,
                metalness: 0.8,
                roughness: 0.3
            })
        );
        lanternBody.position.y = 4.8;
        lanternGroup.add(lanternBody);

        // Lantern glass (emissive)
        const lanternGlass = new THREE.Mesh(
            new THREE.CylinderGeometry(0.1, 0.1, 0.2, 8),
            new THREE.MeshStandardMaterial({
                color: 0xffcc88,
                emissive: 0xffaa44,
                emissiveIntensity: 0.8,
                transparent: true,
                opacity: 0.9
            })
        );
        lanternGlass.position.y = 4.8;
        lanternGroup.add(lanternGlass);

        this.scene.add(lanternGroup);

        // Wall sconces (2 on side walls)
        this.createWallSconce(new THREE.Vector3(-5, 2.5, -4), Math.PI / 4);
        this.createWallSconce(new THREE.Vector3(5, 2.5, -4), -Math.PI / 4);
    }

    createWallSconce(position, rotationY) {
        const sconceGroup = new THREE.Group();

        // Bracket
        const bracket = new THREE.Mesh(
            new THREE.BoxGeometry(0.05, 0.15, 0.1),
            new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.8, roughness: 0.4 })
        );
        sconceGroup.add(bracket);

        // Arm
        const arm = new THREE.Mesh(
            new THREE.CylinderGeometry(0.015, 0.015, 0.2, 8),
            new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.8, roughness: 0.4 })
        );
        arm.rotation.z = Math.PI / 2;
        arm.position.set(0.1, 0, 0);
        sconceGroup.add(arm);

        // Flame holder
        const holder = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.03, 0.08, 8),
            new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.7, roughness: 0.5 })
        );
        holder.position.set(0.2, 0, 0);
        sconceGroup.add(holder);

        // Flame (emissive cone)
        const flame = new THREE.Mesh(
            new THREE.ConeGeometry(0.025, 0.06, 8),
            new THREE.MeshStandardMaterial({
                color: 0xff8844,
                emissive: 0xff6622,
                emissiveIntensity: 1.5,
                transparent: true,
                opacity: 0.9
            })
        );
        flame.position.set(0.2, 0.06, 0);
        sconceGroup.add(flame);

        // Point light for sconce
        const sconceLight = new THREE.PointLight(0xff8844, 2, 5);
        sconceLight.position.set(0.2, 0.1, 0);
        sconceGroup.add(sconceLight);

        sconceGroup.position.copy(position);
        sconceGroup.rotation.y = rotationY;
        this.scene.add(sconceGroup);
    }

    createWorld() {
        // Create detailed stone floor
        this.createFloor();

        // Create workshop walls
        this.createWalls();

        // Anvil
        this.createAnvil();

        // Forge
        this.createForge();

        // Quench tub
        this.createQuenchTub();

        // Ambient dust particles
        this.createAmbientDust();
    }

    createFloor() {
        // Stone floor with procedural texture
        const floorSize = 20;
        const floorGroup = new THREE.Group();

        // Create stone tiles procedurally
        const tileSize = 1.0;
        for (let x = -floorSize / 2; x < floorSize / 2; x += tileSize) {
            for (let z = -floorSize / 2; z < floorSize / 2; z += tileSize) {
                // Vary stone colors slightly
                const colorVariation = 0.8 + Math.random() * 0.4;
                const baseColor = new THREE.Color(0x3a3530);
                baseColor.multiplyScalar(colorVariation);

                const tile = new THREE.Mesh(
                    new THREE.BoxGeometry(
                        tileSize - 0.02,
                        0.08 + Math.random() * 0.03,
                        tileSize - 0.02
                    ),
                    new THREE.MeshStandardMaterial({
                        color: baseColor,
                        roughness: 0.85 + Math.random() * 0.1,
                        metalness: 0.05
                    })
                );
                tile.position.set(
                    x + tileSize / 2 + (Math.random() - 0.5) * 0.02,
                    -0.04,
                    z + tileSize / 2 + (Math.random() - 0.5) * 0.02
                );
                tile.receiveShadow = true;
                tile.castShadow = true;
                floorGroup.add(tile);
            }
        }

        // Grout/dirt between stones
        const grout = new THREE.Mesh(
            new THREE.PlaneGeometry(floorSize, floorSize),
            new THREE.MeshStandardMaterial({
                color: 0x1a1815,
                roughness: 1.0,
                metalness: 0
            })
        );
        grout.rotation.x = -Math.PI / 2;
        grout.position.y = -0.1;
        grout.receiveShadow = true;
        floorGroup.add(grout);

        this.scene.add(floorGroup);
    }

    createWalls() {
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a2520,
            roughness: 0.9,
            metalness: 0.05
        });

        const wallHeight = 4;
        const wallLength = 12;

        // Back wall
        const backWall = new THREE.Mesh(
            new THREE.BoxGeometry(wallLength, wallHeight, 0.3),
            wallMaterial.clone()
        );
        backWall.position.set(0, wallHeight / 2, -6);
        backWall.receiveShadow = true;
        backWall.castShadow = true;
        this.scene.add(backWall);

        // Left wall with window opening
        const leftWall = new THREE.Group();
        const leftWallLower = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 2, wallLength),
            wallMaterial.clone()
        );
        leftWallLower.position.set(-6, 1, 0);
        leftWall.add(leftWallLower);

        const leftWallUpper = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 1.5, wallLength),
            wallMaterial.clone()
        );
        leftWallUpper.position.set(-6, 3.25, 0);
        leftWall.add(leftWallUpper);

        leftWall.children.forEach(c => {
            c.receiveShadow = true;
            c.castShadow = true;
        });
        this.scene.add(leftWall);

        // Right wall
        const rightWall = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, wallHeight, wallLength),
            wallMaterial.clone()
        );
        rightWall.position.set(6, wallHeight / 2, 0);
        rightWall.receiveShadow = true;
        rightWall.castShadow = true;
        this.scene.add(rightWall);

        // Add wooden beams
        this.createWoodenBeams();
    }

    createWoodenBeams() {
        const beamMaterial = new THREE.MeshStandardMaterial({
            color: 0x3a2510,
            roughness: 0.8,
            metalness: 0.05
        });

        // Ceiling beams
        for (let i = -4; i <= 4; i += 2) {
            const beam = new THREE.Mesh(
                new THREE.BoxGeometry(12, 0.2, 0.25),
                beamMaterial.clone()
            );
            beam.position.set(0, 3.9, i);
            beam.castShadow = true;
            beam.receiveShadow = true;
            this.scene.add(beam);
        }

        // Support posts
        const postPositions = [
            [-5.8, -5.8], [-5.8, 5.8], [5.8, -5.8], [5.8, 5.8]
        ];
        postPositions.forEach(([x, z]) => {
            const post = new THREE.Mesh(
                new THREE.BoxGeometry(0.2, 4, 0.2),
                beamMaterial.clone()
            );
            post.position.set(x, 2, z);
            post.castShadow = true;
            this.scene.add(post);
        });
    }

    createAmbientDust() {
        // Floating dust particles
        const dustCount = 200;
        const dustGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(dustCount * 3);
        const sizes = new Float32Array(dustCount);

        for (let i = 0; i < dustCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 15;
            positions[i * 3 + 1] = Math.random() * 4;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 15;
            sizes[i] = 0.02 + Math.random() * 0.03;
        }

        dustGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        dustGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const dustMaterial = new THREE.PointsMaterial({
            color: 0xffddaa,
            size: 0.03,
            transparent: true,
            opacity: 0.4,
            sizeAttenuation: true
        });

        this.dustParticles = new THREE.Points(dustGeometry, dustMaterial);
        this.scene.add(this.dustParticles);
    }

    createAnvil() {
        const anvilGroup = new THREE.Group();

        // High quality anvil material - worn steel with use marks
        const anvilMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a2a2a,
            metalness: 0.95,
            roughness: 0.25,
            envMapIntensity: 1.2
        });

        // Wooden stump base
        const stump = new THREE.Mesh(
            new THREE.CylinderGeometry(0.35, 0.4, 0.7, 12),
            new THREE.MeshStandardMaterial({
                color: 0x3a2810,
                roughness: 0.9,
                metalness: 0.0
            })
        );
        stump.position.y = 0.35;
        stump.castShadow = true;
        stump.receiveShadow = true;
        anvilGroup.add(stump);

        // Anvil body - tapered shape
        const bodyGeom = new THREE.BoxGeometry(0.5, 0.2, 0.35);
        const body = new THREE.Mesh(bodyGeom, anvilMaterial.clone());
        body.position.y = 0.8;
        body.castShadow = true;
        anvilGroup.add(body);

        // Anvil face (working surface) - polished from use
        const faceMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a4a4a,
            metalness: 0.98,
            roughness: 0.15,
            envMapIntensity: 1.5
        });
        const face = new THREE.Mesh(
            new THREE.BoxGeometry(0.45, 0.08, 0.32),
            faceMaterial
        );
        face.position.y = 0.94;
        face.castShadow = true;
        anvilGroup.add(face);

        // Step (smaller working surface)
        const step = new THREE.Mesh(
            new THREE.BoxGeometry(0.15, 0.12, 0.32),
            anvilMaterial.clone()
        );
        step.position.set(-0.25, 0.86, 0);
        step.castShadow = true;
        anvilGroup.add(step);

        // Horn - conical tapered shape
        const hornGeom = new THREE.ConeGeometry(0.12, 0.45, 16);
        const horn = new THREE.Mesh(hornGeom, anvilMaterial.clone());
        horn.rotation.z = -Math.PI / 2;
        horn.position.set(0.48, 0.88, 0);
        horn.castShadow = true;
        anvilGroup.add(horn);

        // Heel (back end)
        const heel = new THREE.Mesh(
            new THREE.BoxGeometry(0.12, 0.15, 0.28),
            anvilMaterial.clone()
        );
        heel.position.set(-0.3, 0.78, 0);
        heel.castShadow = true;
        anvilGroup.add(heel);

        // Hardy hole
        const hardyHole = new THREE.Mesh(
            new THREE.BoxGeometry(0.04, 0.1, 0.04),
            new THREE.MeshStandardMaterial({ color: 0x0a0a0a })
        );
        hardyHole.position.set(-0.1, 0.94, 0);
        anvilGroup.add(hardyHole);

        // Pritchel hole
        const pritchelHole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.015, 0.015, 0.1, 8),
            new THREE.MeshStandardMaterial({ color: 0x0a0a0a })
        );
        pritchelHole.position.set(-0.15, 0.94, 0.08);
        anvilGroup.add(pritchelHole);

        anvilGroup.position.set(0, 0, 0);
        this.scene.add(anvilGroup);
        this.anvil = anvilGroup;

        // Anvil snap zone
        this.anvilSnapZone = {
            min: new THREE.Vector3(-0.2, 0.9, -0.15),
            max: new THREE.Vector3(0.2, 1.3, 0.15)
        };
    }

    createForge() {
        const forgeGroup = new THREE.Group();

        // Brick forge body
        const brickMaterial = new THREE.MeshStandardMaterial({
            color: 0x5a3020,
            roughness: 0.85,
            metalness: 0.05
        });

        // Main forge body with bricks
        const forgeWidth = 1.8;
        const forgeDepth = 1.2;
        const forgeHeight = 1.0;

        // Create brick pattern
        const brickRows = 8;
        const brickCols = 12;
        for (let row = 0; row < brickRows; row++) {
            for (let col = 0; col < brickCols; col++) {
                // Skip bricks where opening is
                const isOpening = row >= 3 && row <= 6 && col >= 4 && col <= 7;
                if (isOpening) continue;

                const brickColor = new THREE.Color(0x5a3020);
                brickColor.multiplyScalar(0.85 + Math.random() * 0.3);

                const brick = new THREE.Mesh(
                    new THREE.BoxGeometry(0.14, 0.11, 0.08),
                    new THREE.MeshStandardMaterial({
                        color: brickColor,
                        roughness: 0.85 + Math.random() * 0.1,
                        metalness: 0.02
                    })
                );
                brick.position.set(
                    -forgeWidth / 2 + 0.08 + col * 0.15 + (row % 2) * 0.075,
                    0.06 + row * 0.12,
                    forgeDepth / 2
                );
                brick.castShadow = true;
                forgeGroup.add(brick);
            }
        }

        // Forge interior - black void
        const interior = new THREE.Mesh(
            new THREE.BoxGeometry(forgeWidth - 0.3, forgeHeight - 0.2, forgeDepth - 0.2),
            new THREE.MeshStandardMaterial({
                color: 0x0a0505,
                roughness: 1,
                metalness: 0
            })
        );
        interior.position.set(0, forgeHeight / 2, 0);
        forgeGroup.add(interior);

        // Glowing coals at bottom
        const coalBed = new THREE.Mesh(
            new THREE.PlaneGeometry(1.2, 0.8),
            new THREE.MeshStandardMaterial({
                color: 0xff2200,
                emissive: 0xff4400,
                emissiveIntensity: 3,
                roughness: 0.5
            })
        );
        coalBed.rotation.x = -Math.PI / 2;
        coalBed.position.set(0, 0.25, 0);
        forgeGroup.add(coalBed);
        this.coalBed = coalBed;

        // Individual glowing coal pieces
        for (let i = 0; i < 25; i++) {
            const coalPiece = new THREE.Mesh(
                new THREE.DodecahedronGeometry(0.04 + Math.random() * 0.04),
                new THREE.MeshStandardMaterial({
                    color: 0xff3300,
                    emissive: 0xff2200,
                    emissiveIntensity: 2 + Math.random() * 2,
                    roughness: 0.6
                })
            );
            coalPiece.position.set(
                (Math.random() - 0.5) * 1.0,
                0.28 + Math.random() * 0.1,
                (Math.random() - 0.5) * 0.6
            );
            coalPiece.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
            forgeGroup.add(coalPiece);
        }

        // Metal rim around top
        const rim = new THREE.Mesh(
            new THREE.TorusGeometry(0.8, 0.04, 8, 24),
            new THREE.MeshStandardMaterial({
                color: 0x2a2a2a,
                metalness: 0.9,
                roughness: 0.3
            })
        );
        rim.rotation.x = Math.PI / 2;
        rim.position.y = forgeHeight;
        rim.castShadow = true;
        forgeGroup.add(rim);

        // Chimney hood
        const hoodGroup = new THREE.Group();
        const hood = new THREE.Mesh(
            new THREE.ConeGeometry(0.9, 0.8, 6),
            new THREE.MeshStandardMaterial({
                color: 0x1a1a1a,
                metalness: 0.7,
                roughness: 0.4
            })
        );
        hood.position.y = forgeHeight + 0.4;
        hoodGroup.add(hood);

        const chimney = new THREE.Mesh(
            new THREE.CylinderGeometry(0.25, 0.35, 1.5, 8),
            new THREE.MeshStandardMaterial({
                color: 0x1a1a1a,
                metalness: 0.6,
                roughness: 0.5
            })
        );
        chimney.position.y = forgeHeight + 1.5;
        chimney.castShadow = true;
        hoodGroup.add(chimney);
        forgeGroup.add(hoodGroup);

        // Ember particles inside forge
        this.createForgeEmbers(forgeGroup);

        forgeGroup.position.set(-3, 0, 0);
        this.scene.add(forgeGroup);
        this.forge = forgeGroup;
        this.forgeOpen = true;
    }

    createForgeEmbers(forgeGroup) {
        // Floating ember particles
        const emberCount = 30;
        const emberGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(emberCount * 3);
        const colors = new Float32Array(emberCount * 3);

        for (let i = 0; i < emberCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 0.8;
            positions[i * 3 + 1] = 0.3 + Math.random() * 0.8;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;

            const brightness = 0.8 + Math.random() * 0.2;
            colors[i * 3] = brightness;
            colors[i * 3 + 1] = brightness * 0.3;
            colors[i * 3 + 2] = 0;
        }

        emberGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        emberGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const emberMaterial = new THREE.PointsMaterial({
            size: 0.03,
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            sizeAttenuation: true
        });

        const embers = new THREE.Points(emberGeometry, emberMaterial);
        forgeGroup.add(embers);
        this.forgeEmbers = embers;
    }

    createQuenchTub() {
        const tubGroup = new THREE.Group();

        // Wooden barrel with metal bands
        const staveCount = 16;
        for (let i = 0; i < staveCount; i++) {
            const angle = (i / staveCount) * Math.PI * 2;
            const stave = new THREE.Mesh(
                new THREE.BoxGeometry(0.06, 0.55, 0.15),
                new THREE.MeshStandardMaterial({
                    color: new THREE.Color(0x3a2510).multiplyScalar(0.9 + Math.random() * 0.2),
                    roughness: 0.8,
                    metalness: 0.05
                })
            );
            stave.position.set(
                Math.cos(angle) * 0.35,
                0.275,
                Math.sin(angle) * 0.35
            );
            stave.rotation.y = angle;
            stave.castShadow = true;
            tubGroup.add(stave);
        }

        // Metal bands
        const bandMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a2a2a,
            metalness: 0.9,
            roughness: 0.35
        });

        const topBand = new THREE.Mesh(
            new THREE.TorusGeometry(0.38, 0.02, 8, 24),
            bandMaterial
        );
        topBand.rotation.x = Math.PI / 2;
        topBand.position.y = 0.5;
        topBand.castShadow = true;
        tubGroup.add(topBand);

        const midBand = new THREE.Mesh(
            new THREE.TorusGeometry(0.36, 0.02, 8, 24),
            bandMaterial.clone()
        );
        midBand.rotation.x = Math.PI / 2;
        midBand.position.y = 0.3;
        tubGroup.add(midBand);

        const bottomBand = new THREE.Mesh(
            new THREE.TorusGeometry(0.34, 0.02, 8, 24),
            bandMaterial.clone()
        );
        bottomBand.rotation.x = Math.PI / 2;
        bottomBand.position.y = 0.1;
        tubGroup.add(bottomBand);

        // Water surface with subtle waves
        const waterGeom = new THREE.CircleGeometry(0.33, 32);
        const waterMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a3a4a,
            roughness: 0.05,
            metalness: 0.3,
            transparent: true,
            opacity: 0.85,
            envMapIntensity: 2.0
        });
        const water = new THREE.Mesh(waterGeom, waterMaterial);
        water.rotation.x = -Math.PI / 2;
        water.position.y = 0.45;
        tubGroup.add(water);
        this.waterSurface = water;

        tubGroup.position.set(2, 0, 0);
        this.scene.add(tubGroup);
        this.quenchTub = tubGroup;
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
        const mirror = side === 'left' ? -1 : 1;

        // Realistic skin material with subsurface scattering approximation
        const skinMaterial = new THREE.MeshStandardMaterial({
            color: 0xd4a574,  // Natural skin tone
            roughness: 0.6,
            metalness: 0.0,
            envMapIntensity: 0.3
        });

        // Slightly darker for creases and joints
        const skinCreaseMaterial = new THREE.MeshStandardMaterial({
            color: 0xc49464,
            roughness: 0.7,
            metalness: 0.0
        });

        // Fingernail material
        const nailMaterial = new THREE.MeshStandardMaterial({
            color: 0xffe8e0,
            roughness: 0.3,
            metalness: 0.1,
            envMapIntensity: 0.5
        });

        // Wrist
        const wrist = new THREE.Mesh(
            new THREE.CylinderGeometry(0.028, 0.032, 0.06, 12),
            skinMaterial.clone()
        );
        wrist.position.set(0, -0.08, 0);
        wrist.rotation.x = Math.PI / 2;
        hand.add(wrist);

        // Palm base - organic shape using combined geometries
        const palmBase = new THREE.Mesh(
            new THREE.BoxGeometry(0.085, 0.045, 0.10),
            skinMaterial.clone()
        );
        palmBase.position.set(0, 0, 0);
        hand.add(palmBase);

        // Palm - tapered toward fingers
        const palmUpper = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, 0.04, 0.05),
            skinMaterial.clone()
        );
        palmUpper.position.set(0, 0, 0.06);
        hand.add(palmUpper);

        // Thenar eminence (thumb muscle pad)
        const thenar = new THREE.Mesh(
            new THREE.SphereGeometry(0.025, 12, 12),
            skinMaterial.clone()
        );
        thenar.scale.set(1, 0.6, 1.2);
        thenar.position.set(mirror * 0.035, 0.01, -0.015);
        hand.add(thenar);

        // Hypothenar eminence (pinky side muscle pad)
        const hypothenar = new THREE.Mesh(
            new THREE.SphereGeometry(0.02, 12, 12),
            skinMaterial.clone()
        );
        hypothenar.scale.set(1, 0.6, 1.3);
        hypothenar.position.set(mirror * -0.035, 0.01, -0.01);
        hand.add(hypothenar);

        // Create detailed fingers
        const fingerData = [
            { name: 'index', x: mirror * 0.028, baseLength: 0.035, midLength: 0.025, tipLength: 0.022, radius: 0.009 },
            { name: 'middle', x: mirror * 0.009, baseLength: 0.04, midLength: 0.028, tipLength: 0.024, radius: 0.0095 },
            { name: 'ring', x: mirror * -0.01, baseLength: 0.037, midLength: 0.026, tipLength: 0.022, radius: 0.009 },
            { name: 'pinky', x: mirror * -0.03, baseLength: 0.028, midLength: 0.02, tipLength: 0.018, radius: 0.007 }
        ];

        fingerData.forEach((finger, idx) => {
            const fingerGroup = new THREE.Group();
            fingerGroup.position.set(finger.x, 0.01, 0.085);

            // Knuckle bump
            const knuckle = new THREE.Mesh(
                new THREE.SphereGeometry(finger.radius * 1.3, 10, 10),
                skinCreaseMaterial.clone()
            );
            knuckle.scale.set(1, 0.7, 1);
            knuckle.position.set(0, 0.008, -0.01);
            fingerGroup.add(knuckle);

            // Proximal phalanx (base segment)
            const proximal = new THREE.Mesh(
                new THREE.CapsuleGeometry(finger.radius, finger.baseLength, 8, 12),
                skinMaterial.clone()
            );
            proximal.position.set(0, 0, finger.baseLength / 2 + 0.005);
            proximal.rotation.x = Math.PI / 2;
            fingerGroup.add(proximal);

            // Middle joint
            const midJoint = new THREE.Mesh(
                new THREE.SphereGeometry(finger.radius * 1.1, 8, 8),
                skinCreaseMaterial.clone()
            );
            midJoint.position.set(0, 0, finger.baseLength + 0.008);
            fingerGroup.add(midJoint);

            // Middle phalanx
            const middle = new THREE.Mesh(
                new THREE.CapsuleGeometry(finger.radius * 0.9, finger.midLength, 8, 12),
                skinMaterial.clone()
            );
            middle.position.set(0, 0, finger.baseLength + finger.midLength / 2 + 0.012);
            middle.rotation.x = Math.PI / 2;
            fingerGroup.add(middle);

            // Distal joint
            const distalJoint = new THREE.Mesh(
                new THREE.SphereGeometry(finger.radius * 0.95, 8, 8),
                skinCreaseMaterial.clone()
            );
            distalJoint.position.set(0, 0, finger.baseLength + finger.midLength + 0.016);
            fingerGroup.add(distalJoint);

            // Distal phalanx (fingertip)
            const distal = new THREE.Mesh(
                new THREE.CapsuleGeometry(finger.radius * 0.85, finger.tipLength, 8, 12),
                skinMaterial.clone()
            );
            distal.position.set(0, 0, finger.baseLength + finger.midLength + finger.tipLength / 2 + 0.02);
            distal.rotation.x = Math.PI / 2;
            fingerGroup.add(distal);

            // Fingertip pad
            const pad = new THREE.Mesh(
                new THREE.SphereGeometry(finger.radius * 0.9, 8, 8),
                skinMaterial.clone()
            );
            pad.scale.set(1, 0.6, 1);
            pad.position.set(0, -0.004, finger.baseLength + finger.midLength + finger.tipLength + 0.02);
            fingerGroup.add(pad);

            // Fingernail
            const nail = new THREE.Mesh(
                new THREE.BoxGeometry(finger.radius * 1.6, 0.002, finger.tipLength * 0.7),
                nailMaterial.clone()
            );
            nail.position.set(0, finger.radius * 0.7, finger.baseLength + finger.midLength + finger.tipLength + 0.015);
            fingerGroup.add(nail);

            hand.add(fingerGroup);
            hand.userData[finger.name + 'Finger'] = fingerGroup;
        });

        // Thumb - anatomically correct with 3 segments
        const thumbGroup = new THREE.Group();
        thumbGroup.position.set(mirror * 0.045, 0, -0.02);
        thumbGroup.rotation.z = mirror * -0.5;
        thumbGroup.rotation.y = mirror * 0.4;

        // Thumb metacarpal
        const thumbMeta = new THREE.Mesh(
            new THREE.CapsuleGeometry(0.012, 0.025, 8, 12),
            skinMaterial.clone()
        );
        thumbMeta.rotation.x = Math.PI / 2;
        thumbMeta.position.set(0, 0.01, 0.02);
        thumbGroup.add(thumbMeta);

        // Thumb proximal phalanx
        const thumbProx = new THREE.Mesh(
            new THREE.CapsuleGeometry(0.011, 0.028, 8, 12),
            skinMaterial.clone()
        );
        thumbProx.rotation.x = Math.PI / 2;
        thumbProx.position.set(0, 0.01, 0.052);
        thumbGroup.add(thumbProx);

        // Thumb joint
        const thumbJoint = new THREE.Mesh(
            new THREE.SphereGeometry(0.012, 8, 8),
            skinCreaseMaterial.clone()
        );
        thumbJoint.position.set(0, 0.01, 0.07);
        thumbGroup.add(thumbJoint);

        // Thumb distal phalanx
        const thumbDist = new THREE.Mesh(
            new THREE.CapsuleGeometry(0.01, 0.022, 8, 12),
            skinMaterial.clone()
        );
        thumbDist.rotation.x = Math.PI / 2;
        thumbDist.position.set(0, 0.01, 0.088);
        thumbGroup.add(thumbDist);

        // Thumb nail
        const thumbNail = new THREE.Mesh(
            new THREE.BoxGeometry(0.016, 0.002, 0.015),
            nailMaterial.clone()
        );
        thumbNail.position.set(0, 0.02, 0.095);
        thumbGroup.add(thumbNail);

        // Thumb pad
        const thumbPad = new THREE.Mesh(
            new THREE.SphereGeometry(0.01, 8, 8),
            skinMaterial.clone()
        );
        thumbPad.scale.set(1, 0.6, 1);
        thumbPad.position.set(0, 0.002, 0.1);
        thumbGroup.add(thumbPad);

        hand.add(thumbGroup);
        hand.userData.thumb = thumbGroup;

        // Veins on back of hand (subtle raised lines)
        this.addHandVeins(hand, skinCreaseMaterial, mirror);

        // Enable shadows for all meshes
        hand.traverse(obj => {
            if (obj.isMesh) {
                obj.castShadow = true;
                obj.receiveShadow = true;
            }
        });

        hand.userData.side = side;
        return hand;
    }

    addHandVeins(hand, material, mirror) {
        // Subtle vein details on back of hand
        const veinMaterial = material.clone();
        veinMaterial.color.setHex(0xb89070);

        // Main dorsal vein
        const vein1 = new THREE.Mesh(
            new THREE.CylinderGeometry(0.002, 0.003, 0.08, 6),
            veinMaterial
        );
        vein1.rotation.x = Math.PI / 2;
        vein1.position.set(mirror * 0.01, 0.022, 0.02);
        hand.add(vein1);

        // Branch vein
        const vein2 = new THREE.Mesh(
            new THREE.CylinderGeometry(0.0015, 0.002, 0.04, 6),
            veinMaterial.clone()
        );
        vein2.rotation.set(Math.PI / 2, 0, mirror * 0.3);
        vein2.position.set(mirror * -0.01, 0.02, 0.04);
        hand.add(vein2);
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
        // Metal-specific base colors
        const metalColors = {
            iron: 0x8a8a8a,      // Gray
            steel: 0xa0a5aa,     // Blue-gray
            bronze: 0xcd7f32,    // Bronze/copper
            mithril: 0xc0d8e8,   // Silvery blue
            damascus: 0x6a6a7a   // Dark steel with pattern
        };

        const baseColor = metalColors[metalType] || 0x8a8a8a;

        const billet = new THREE.Mesh(
            new THREE.BoxGeometry(0.15, 0.05, 0.3),
            new THREE.MeshStandardMaterial({
                color: baseColor,
                metalness: 0.9,
                roughness: metalType === 'mithril' ? 0.15 : 0.3
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
            // Shop system
            if (e.key.toLowerCase() === 'b' && this.pointerLocked) {
                this.toggleShop();
            }
            // Achievements
            if (e.key === 'Tab') {
                e.preventDefault();
                this.showAchievementList();
            }
            // Bellows - hold E to pump
            if (e.key.toLowerCase() === 'e' && this.pointerLocked) {
                this.bellowsActive = true;
            }
        };
        window.addEventListener('keydown', this.eventListeners.keydown);

        this.eventListeners.keyup = (e) => {
            this.keys[e.key.toLowerCase()] = false;
            // Stop bellows when E released
            if (e.key.toLowerCase() === 'e') {
                this.bellowsActive = false;
            }
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
        this.updateSteam(delta);       // NEW: Steam particle system
        this.updateForgeEffects();
        this.updateDayNightCycle(delta); // NEW: Day/night lighting
        this.updateAmbientSounds(delta); // NEW: Ambient forge sounds
        this.updateBellows(delta);       // NEW: Bellows heat boost
        this.checkAnvilSnap();
        this.updateGrinding(delta);
        this.updatePolishing(delta);
        this.updateHUD();

        this.renderer.render(this.scene, this.camera);
    }

    // ========== NEW SYSTEMS ==========

    updateSteam(delta) {
        // Update and remove old steam particles
        for (let i = this.activeSteam.length - 1; i >= 0; i--) {
            const steam = this.activeSteam[i];
            steam.userData.age += delta;

            // Steam rises and fades
            steam.position.y += delta * 0.5;
            steam.position.x += (Math.random() - 0.5) * delta * 0.2;
            steam.position.z += (Math.random() - 0.5) * delta * 0.2;
            steam.material.opacity = Math.max(0, 1 - steam.userData.age / steam.userData.lifetime);
            steam.scale.multiplyScalar(1 + delta * 0.5);

            if (steam.userData.age >= steam.userData.lifetime) {
                this.scene.remove(steam);
                steam.geometry.dispose();
                steam.material.dispose();
                this.activeSteam.splice(i, 1);
            }
        }
    }

    createSteamParticles(position, intensity) {
        // Limit max active steam particles
        if (this.activeSteam.length > 50) return;

        for (let i = 0; i < 10 * intensity; i++) {
            const steam = new THREE.Mesh(
                new THREE.SphereGeometry(0.03 + Math.random() * 0.02),
                new THREE.MeshBasicMaterial({
                    color: 0xcccccc,
                    transparent: true,
                    opacity: 0.6
                })
            );
            steam.position.copy(position);
            steam.position.x += (Math.random() - 0.5) * 0.2;
            steam.position.z += (Math.random() - 0.5) * 0.2;
            steam.userData.lifetime = 1.5 + Math.random();
            steam.userData.age = 0;
            this.scene.add(steam);
            this.activeSteam.push(steam);
        }
    }

    updateDayNightCycle(delta) {
        // Advance time (very slow for gameplay)
        this.timeOfDay += delta * this.daySpeed * 0.01;
        if (this.timeOfDay >= 1) this.timeOfDay = 0;

        // Calculate sun position and light intensity
        const sunAngle = this.timeOfDay * Math.PI * 2;
        const sunIntensity = Math.max(0, Math.sin(sunAngle));

        // Update ambient light based on time
        const ambientIntensity = 0.1 + sunIntensity * 0.3;
        if (this.scene.children[0] && this.scene.children[0].isAmbientLight) {
            this.scene.children[0].intensity = ambientIntensity;
        }

        // Update sky color
        const nightColor = new THREE.Color(0x0a0a15);
        const dayColor = new THREE.Color(0x1a1410);
        const currentColor = nightColor.clone().lerp(dayColor, sunIntensity);
        this.scene.background = currentColor;
        if (this.scene.fog) {
            this.scene.fog.color = currentColor;
        }
    }

    updateAmbientSounds(delta) {
        this.lastAmbientSound += delta;

        // Play ambient forge sounds periodically
        if (this.lastAmbientSound > this.ambientSoundInterval) {
            this.lastAmbientSound = 0;
            this.ambientSoundInterval = 3 + Math.random() * 4;

            // Random ambient sound
            if (Math.random() < 0.3) {
                this.playForgeAmbience();
            }
        }
    }

    updateBellows(delta) {
        // Decay bellows heat boost
        if (this.forgeHeatBoost > 0) {
            this.forgeHeatBoost = Math.max(0, this.forgeHeatBoost - delta * 0.1);
        }

        // Check if bellows is being used
        if (this.bellowsActive && this.bellows) {
            this.forgeHeatBoost = Math.min(1.0, this.forgeHeatBoost + delta * 0.5);

            // Visual feedback - bellows compress
            this.bellows.scale.y = 0.7 + Math.sin(Date.now() * 0.01) * 0.1;

            // Play bellows sound occasionally
            if (Math.random() < 0.05) {
                this.playForgeAmbience();
            }
        } else if (this.bellows) {
            // Return to normal size
            this.bellows.scale.y = THREE.MathUtils.lerp(this.bellows.scale.y, 1.0, delta * 5);
        }
    }

    // ========== SHOP SYSTEM ==========

    toggleShop() {
        const existing = document.getElementById('shop-ui');
        if (existing) {
            existing.remove();
            this.shopOpen = false;
            return;
        }

        this.shopOpen = true;
        const ui = document.createElement('div');
        ui.id = 'shop-ui';
        ui.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(20,15,10,0.95);
            color: #ffaa44;
            padding: 25px;
            border-radius: 10px;
            border: 2px solid #5a4a3a;
            font-family: monospace;
            font-size: 14px;
            max-width: 500px;
            max-height: 80vh;
            overflow-y: auto;
            z-index: 1000;
        `;

        let html = `<h2 style="margin-top:0; color:#ffcc66;">BLACKSMITH SUPPLIES</h2>`;
        html += `<p>Your Gold: <span style="color:#ffdd00;">$${this.money}</span></p>`;
        html += `<hr style="border-color:#5a4a3a;">`;

        // Metals section
        html += `<h3 style="color:#aaa;">Metal Billets</h3>`;
        this.shopInventory.metals.forEach((item, i) => {
            const canAfford = this.money >= item.price;
            const color = canAfford ? '#66ff66' : '#ff6666';
            html += `<div style="margin: 8px 0; padding: 8px; background: rgba(255,255,255,0.05); border-radius: 5px;">`;
            html += `<strong>${item.type.charAt(0).toUpperCase() + item.type.slice(1)}</strong> - $${item.price} `;
            html += `<span style="color:#888;">(Stock: ${item.stock})</span>`;
            if (item.stock > 0) {
                html += ` <button onclick="window.game.buyMetal(${i})" style="margin-left:10px; padding:3px 10px; cursor:pointer; background:${color}; border:none; border-radius:3px;">Buy</button>`;
            }
            html += `</div>`;
        });

        html += `<hr style="border-color:#5a4a3a;">`;
        html += `<h3 style="color:#aaa;">Tools</h3>`;
        this.shopInventory.tools.forEach((item, i) => {
            const canAfford = this.money >= item.price;
            const color = canAfford ? '#66ff66' : '#ff6666';
            html += `<div style="margin: 8px 0; padding: 8px; background: rgba(255,255,255,0.05); border-radius: 5px;">`;
            html += `<strong>${item.name}</strong> - $${item.price}`;
            if (item.owned) {
                html += ` <span style="color:#66ff66;">OWNED</span>`;
            } else {
                html += ` <button onclick="window.game.buyTool(${i})" style="margin-left:10px; padding:3px 10px; cursor:pointer; background:${color}; border:none; border-radius:3px;">Buy</button>`;
            }
            html += `</div>`;
        });

        html += `<br><button onclick="document.getElementById('shop-ui').remove()" style="padding:10px 20px; cursor:pointer; background:#5a4a3a; color:#ffaa44; border:none; border-radius:5px;">Close Shop (B)</button>`;

        ui.innerHTML = html;
        document.body.appendChild(ui);
    }

    buyMetal(index) {
        const item = this.shopInventory.metals[index];
        if (!item || item.stock <= 0 || this.money < item.price) {
            this.playErrorSound();
            return;
        }

        this.money -= item.price;
        item.stock--;
        this.availableBillets.push(item.type);
        this.playSuccessSound();
        this.showFeedback(`Bought ${item.type} billet`);

        // Refresh shop UI
        this.toggleShop();
        this.toggleShop();
        this.saveGameState();
    }

    buyTool(index) {
        const item = this.shopInventory.tools[index];
        if (!item || item.owned || this.money < item.price) {
            this.playErrorSound();
            return;
        }

        this.money -= item.price;
        item.owned = true;
        this.playSuccessSound();
        this.showFeedback(`Bought ${item.name}!`);

        // Refresh shop UI
        this.toggleShop();
        this.toggleShop();
        this.saveGameState();
    }

    // ========== ACHIEVEMENT SYSTEM ==========

    checkAchievements() {
        let newAchievement = null;

        // Weapon count achievements
        if (this.totalWeaponsForged >= 1 && !this.achievements.firstWeapon.unlocked) {
            this.achievements.firstWeapon.unlocked = true;
            newAchievement = this.achievements.firstWeapon;
        }
        if (this.totalWeaponsForged >= 10 && !this.achievements.tenWeapons.unlocked) {
            this.achievements.tenWeapons.unlocked = true;
            newAchievement = this.achievements.tenWeapons;
        }
        if (this.totalWeaponsForged >= 50 && !this.achievements.fiftyWeapons.unlocked) {
            this.achievements.fiftyWeapons.unlocked = true;
            newAchievement = this.achievements.fiftyWeapons;
        }
        if (this.totalWeaponsForged >= 100 && !this.achievements.hundredWeapons.unlocked) {
            this.achievements.hundredWeapons.unlocked = true;
            newAchievement = this.achievements.hundredWeapons;
        }

        // Money achievements
        if (this.totalMoneyEarned >= 1000 && !this.achievements.richSmith.unlocked) {
            this.achievements.richSmith.unlocked = true;
            newAchievement = this.achievements.richSmith;
        }
        if (this.totalMoneyEarned >= 10000 && !this.achievements.wealthySmith.unlocked) {
            this.achievements.wealthySmith.unlocked = true;
            newAchievement = this.achievements.wealthySmith;
        }

        // Heat mastery
        if (this.perfectHeatStrikes >= 100 && !this.achievements.perfectHeat.unlocked) {
            this.achievements.perfectHeat.unlocked = true;
            newAchievement = this.achievements.perfectHeat;
        }

        // All metals
        if (this.metalsWorked.size >= 5 && !this.achievements.allMetals.unlocked) {
            this.achievements.allMetals.unlocked = true;
            newAchievement = this.achievements.allMetals;
        }

        if (newAchievement) {
            this.showAchievement(newAchievement);
        }
    }

    showAchievement(achievement) {
        this.playSuccessSound();

        const popup = document.createElement('div');
        popup.style.cssText = `
            position: fixed;
            top: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #4a3a20, #2a2010);
            color: #ffcc44;
            padding: 20px 40px;
            border-radius: 10px;
            border: 2px solid #ffaa44;
            font-family: monospace;
            text-align: center;
            z-index: 2000;
            animation: achievementPop 0.5s ease-out;
        `;
        popup.innerHTML = `
            <div style="font-size:12px; color:#aaa;">ACHIEVEMENT UNLOCKED</div>
            <div style="font-size:18px; margin:5px 0; color:#ffdd66;">${achievement.name}</div>
            <div style="font-size:12px; color:#888;">${achievement.desc}</div>
        `;

        // Add animation style
        const style = document.createElement('style');
        style.textContent = `
            @keyframes achievementPop {
                0% { transform: translateX(-50%) scale(0.5); opacity: 0; }
                50% { transform: translateX(-50%) scale(1.1); }
                100% { transform: translateX(-50%) scale(1); opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(popup);
        setTimeout(() => popup.remove(), 4000);
    }

    showAchievementList() {
        const existing = document.getElementById('achievement-ui');
        if (existing) {
            existing.remove();
            return;
        }

        const ui = document.createElement('div');
        ui.id = 'achievement-ui';
        ui.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(20,15,10,0.95);
            color: #ffaa44;
            padding: 25px;
            border-radius: 10px;
            border: 2px solid #5a4a3a;
            font-family: monospace;
            font-size: 14px;
            max-width: 400px;
            max-height: 80vh;
            overflow-y: auto;
            z-index: 1000;
        `;

        let html = `<h2 style="margin-top:0; color:#ffcc66;">ACHIEVEMENTS</h2>`;

        let unlockedCount = 0;
        Object.values(this.achievements).forEach(a => {
            if (a.unlocked) unlockedCount++;
        });
        html += `<p>Unlocked: ${unlockedCount}/${Object.keys(this.achievements).length}</p>`;
        html += `<hr style="border-color:#5a4a3a;">`;

        Object.values(this.achievements).forEach(a => {
            const color = a.unlocked ? '#66ff66' : '#666';
            const icon = a.unlocked ? '★' : '☆';
            html += `<div style="margin: 8px 0; padding: 8px; background: rgba(255,255,255,0.05); border-radius: 5px; color:${color};">`;
            html += `<span style="font-size:16px;">${icon}</span> <strong>${a.name}</strong><br>`;
            html += `<span style="font-size:11px; color:#888;">${a.desc}</span>`;
            html += `</div>`;
        });

        html += `<br><button onclick="document.getElementById('achievement-ui').remove()" style="padding:10px 20px; cursor:pointer; background:#5a4a3a; color:#ffaa44; border:none; border-radius:5px;">Close</button>`;

        ui.innerHTML = html;
        document.body.appendChild(ui);
    }

    checkWeaponAchievements(rarity) {
        // Rarity-based achievements
        const rarityIndex = this.rarities.indexOf(rarity);

        if (rarityIndex >= 3 && !this.achievements.firstRare.unlocked) {
            this.achievements.firstRare.unlocked = true;
            this.showAchievement(this.achievements.firstRare);
        }
        if (rarityIndex >= 4 && !this.achievements.firstSuperior.unlocked) {
            this.achievements.firstSuperior.unlocked = true;
            this.showAchievement(this.achievements.firstSuperior);
        }
        if (rarityIndex >= 5 && !this.achievements.firstMasterwork.unlocked) {
            this.achievements.firstMasterwork.unlocked = true;
            this.showAchievement(this.achievements.firstMasterwork);
        }
        if (rarityIndex >= 6 && !this.achievements.legendary.unlocked) {
            this.achievements.legendary.unlocked = true;
            this.showAchievement(this.achievements.legendary);
        }

        // Also check general achievements
        this.checkAchievements();
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
            // Track perfect heat strikes for achievement
            this.perfectHeatStrikes = (this.perfectHeatStrikes || 0) + 1;
        }

        // Material knowledge advancement when working with rare metals
        const metalType = this.currentBillet.userData.metalType;
        if (metalType !== 'iron' && metalType !== 'bronze') {
            this.advanceTraining('materialKnowledge', 0.005);
        }

        // Track metals worked for achievement
        if (!this.metalsWorked) this.metalsWorked = new Set();
        this.metalsWorked.add(metalType);

        // Check achievements periodically
        if (this.strikeCount % 10 === 0) {
            this.checkAchievements();
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
            const baseHeatRate = 0.15; // 15% per second
            const bellowsBoost = this.forgeHeatBoost || 1.0; // Bellows can boost up to 2x
            const heatRate = baseHeatRate * bellowsBoost;
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

        // Multiple layered flickering for realistic fire
        const flicker1 = Math.sin(time * 3.7) * 0.3;
        const flicker2 = Math.sin(time * 7.3) * 0.2;
        const flicker3 = Math.sin(time * 11.1) * 0.15;
        const randomFlicker = (Math.random() - 0.5) * 0.1;
        const totalFlicker = flicker1 + flicker2 + flicker3 + randomFlicker;

        // Main forge light
        if (this.forgeLight) {
            this.forgeLight.intensity = 25 + totalFlicker * 8;
            // Slight color shift
            const colorShift = 0.02 * Math.sin(time * 5);
            this.forgeLight.color.setRGB(1, 0.27 + colorShift, 0);
        }

        // Ember light (faster flicker)
        if (this.emberLight) {
            const emberFlicker = Math.sin(time * 15) * 0.4 + Math.random() * 0.2;
            this.emberLight.intensity = 8 + emberFlicker * 4;
        }

        // Depth light (slower pulse)
        if (this.forgeDepthLight) {
            const depthPulse = Math.sin(time * 1.5) * 0.3;
            this.forgeDepthLight.intensity = 5 + depthPulse * 2;
        }

        // Coal bed glow
        if (this.coalBed) {
            this.coalBed.material.emissiveIntensity = 3 + totalFlicker * 1.5;
        }

        // Animate forge embers
        if (this.forgeEmbers) {
            const positions = this.forgeEmbers.geometry.attributes.position.array;
            for (let i = 0; i < positions.length / 3; i++) {
                positions[i * 3 + 1] += 0.003; // Rise
                if (positions[i * 3 + 1] > 1.5) {
                    positions[i * 3 + 1] = 0.3;
                    positions[i * 3] = (Math.random() - 0.5) * 0.8;
                    positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
                }
                // Slight horizontal drift
                positions[i * 3] += (Math.random() - 0.5) * 0.002;
                positions[i * 3 + 2] += (Math.random() - 0.5) * 0.002;
            }
            this.forgeEmbers.geometry.attributes.position.needsUpdate = true;
        }

        // Animate dust particles
        if (this.dustParticles) {
            const dustPositions = this.dustParticles.geometry.attributes.position.array;
            for (let i = 0; i < dustPositions.length / 3; i++) {
                // Slow drift
                dustPositions[i * 3] += Math.sin(time + i) * 0.0005;
                dustPositions[i * 3 + 1] += Math.sin(time * 0.5 + i * 0.5) * 0.0003;
                dustPositions[i * 3 + 2] += Math.cos(time + i) * 0.0005;

                // Reset if too far
                if (Math.abs(dustPositions[i * 3]) > 8) {
                    dustPositions[i * 3] = (Math.random() - 0.5) * 15;
                }
            }
            this.dustParticles.geometry.attributes.position.needsUpdate = true;
        }

        // Lantern light subtle flicker
        if (this.lanternLight) {
            const lanternFlicker = Math.sin(time * 8) * 0.1 + Math.random() * 0.05;
            this.lanternLight.intensity = 8 + lanternFlicker * 2;
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
                this.rareWeaponsForged = data.rareWeaponsForged || 0;
                // Restore achievement tracking
                this.totalWeaponsForged = data.totalWeaponsForged || 0;
                this.totalMoneyEarned = data.totalMoneyEarned || 0;
                this.perfectHeatStrikes = data.perfectHeatStrikes || 0;
                this.metalsWorked = new Set(data.metalsWorked || []);
                if (data.achievements) {
                    Object.assign(this.achievements, data.achievements);
                }
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
            rareWeaponsForged: this.rareWeaponsForged,
            // Achievement tracking
            totalWeaponsForged: this.totalWeaponsForged,
            totalMoneyEarned: this.totalMoneyEarned,
            perfectHeatStrikes: this.perfectHeatStrikes,
            metalsWorked: Array.from(this.metalsWorked || []),
            achievements: this.achievements
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

        // Track total weapons forged and check achievements
        this.totalWeaponsForged = (this.totalWeaponsForged || 0) + 1;
        this.checkWeaponAchievements(rarity);

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

        // Create steam particles based on heat intensity
        if (heatBefore > 0.3) {
            this.createSteamParticles(this.quenchTub.position.clone().setY(1.0), heatBefore);
        }

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
        this.totalMoneyEarned = (this.totalMoneyEarned || 0) + weapon.value;
        this.inventory.splice(index, 1);

        // Check money achievements
        this.checkAchievements();

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

        // Show bellows status when active
        if (this.bellowsActive && this.forgeHeatBoost > 1.0) {
            html += `<div style="color:#ff8844">BELLOWS ACTIVE (${((this.forgeHeatBoost - 1) * 100).toFixed(0)}% boost)</div>`;
        }

        html += `<br>`;
        html += `<div style="font-size:11px; opacity:0.7;">`;
        html += `R - Weapon | M - Metal | N - New Billet<br>`;
        html += `F - Finish | Q - Quench | I - Inventory<br>`;
        html += `G - Grind (hold) | P - Polish (hold)<br>`;
        html += `B - Shop | Tab - Achievements | E - Bellows<br>`;
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
