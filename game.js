// Immersive 3D Forging Game with VR Support
// Main Game Engine - MASSIVELY ENHANCED GRAPHICS & INTERACTION VERSION

class ForgingGame {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();

        // VR
        this.isVR = false;
        this.controllers = [];
        this.handModels = [];

        // Game objects
        this.anvil = null;
        this.forge = null;
        this.waterBarrel = null;
        this.hammer = null;
        this.metal = null;
        this.tongs = null;

        // First-person hands - NOW MUCH MORE PROMINENT
        this.playerHands = null;
        this.rightHand = null;
        this.leftHand = null;
        this.handsGroup = null;

        // Game state
        this.metalTemperature = 20; // Celsius
        this.forgeTemperature = 1200;
        this.quality = 0;
        this.hammerStrikes = 0;
        this.isMetalInForge = false;
        this.isHammerSwinging = false;
        this.hammerSwingProgress = 0;
        this.hammerVelocity = new THREE.Vector3();
        this.metalDeformationCount = 0;
        this.hasHitThisSwing = false;

        // Metal holding state
        this.isHoldingMetal = false;
        this.metalOnAnvil = true;

        // Interaction states - ENHANCED
        this.nearForge = false;
        this.nearAnvil = false;
        this.nearWater = false;
        this.interactionTarget = null;
        this.isGrabbing = false;
        this.grabPulse = 0;

        // Particles
        this.sparkParticles = [];
        this.smokeParticles = [];
        this.fireParticles = [];

        // Input
        this.keys = {};
        this.mouseDown = false;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // Camera movement
        this.cameraRotation = { x: 0, y: 0 };
        this.cameraPosition = new THREE.Vector3(0, 1.6, 2);
        this.cameraBounds = {
            minX: -4, maxX: 4,
            minZ: -3, maxZ: 4
        };

        // Hand animation - ENHANCED
        this.handBobTime = 0;
        this.targetHandRotation = { x: 0, y: 0 };
        this.handSway = { x: 0, y: 0 };
        this.mouseTargetPos = { x: 0, y: 0 };

        // VR-style hand physics for desktop
        this.rightHandFingers = [];
        this.leftHandFingers = [];
        this.fingerCurlProgress = 0;
        this.targetFingerCurl = 0;

        // Screen shake - ENHANCED
        this.screenShake = { x: 0, y: 0, intensity: 0 };

        // Hand IK targets
        this.rightHandTarget = new THREE.Vector3();
        this.leftHandTarget = new THREE.Vector3();

        // Audio context
        this.audioContext = null;
        this.sounds = {};
        this.setupAudio();

        // Steam particle system
        this.steamSystem = null;

        // Pointer lock state
        this.pointerLocked = false;

        // Game completion
        this.bladesForged = 0;
        this.bestQuality = 0;

        // Crosshair
        this.crosshair = null;

        // NEW: Post-processing and visual effects
        this.bloomPass = null;
        this.composer = null;
        this.heatDistortion = 0;
        this.vignetteIntensity = 0.3;

        // NEW: Hand glow effects
        this.handGlowIntensity = 0;
        this.interactionGlow = null;

        // NEW: Environmental effects
        this.dustParticles = null;
        this.heatWaves = null;

        // NEW: Hit feedback
        this.impactFlash = 0;
        this.metalSparks = [];

        // PHYSICS & PICKUP SYSTEM
        this.pickupableItems = [];
        this.heldItemRight = null;
        this.heldItemLeft = null;
        this.nearbyItems = [];

        // MOUSE SWING MECHANICS
        this.mouseSwingState = 'idle'; // idle, charging, swinging
        this.swingStartY = 0;
        this.swingPower = 0;
        this.lastMouseY = 0;
        this.mouseVelocityY = 0;

        // WEAPON TYPE SYSTEM
        this.weaponTypes = {
            sword: { name: 'Sword', basePrice: 100, difficulty: 1.0, requiredStrikes: 8 },
            axe: { name: 'Battle Axe', basePrice: 150, difficulty: 1.2, requiredStrikes: 10 },
            dagger: { name: 'Dagger', basePrice: 60, difficulty: 0.8, requiredStrikes: 5 },
            mace: { name: 'Mace', basePrice: 120, difficulty: 1.1, requiredStrikes: 7 },
            spear: { name: 'Spear', basePrice: 90, difficulty: 0.9, requiredStrikes: 6 },
            greatsword: { name: 'Greatsword', basePrice: 200, difficulty: 1.5, requiredStrikes: 12 }
        };
        this.currentWeaponType = 'sword';
        this.finishedWeapons = [];

        // ECONOMY SYSTEM
        this.money = 0;
        this.reputation = 0;

        // CUSTOMER SYSTEM
        this.customers = [];
        this.customerQueue = [];
        this.nextCustomerTime = 0;
        this.shopOpen = false;

        // SELLING SYSTEM
        this.displayedWeapons = [];
        this.selectedWeaponForSale = null;

        this.init();
    }

    setupAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }

    init() {
        this.setupScene();
        this.setupCamera();
        this.setupRenderer();
        this.setupLights();
        this.setupVR();
        this.createWorkshop();
        this.createTools();
        this.createMetal();
        this.createFirstPersonHands();
        this.createCrosshair();
        this.setupEventListeners();
        this.createParticleSystems();
        this.animate();
    }

    setupScene() {
        this.scene = new THREE.Scene();
        // MUCH DARKER, more dramatic background
        this.scene.background = new THREE.Color(0x050200);
        // Denser fog for more mystery and depth - shorter range for more drama
        this.scene.fog = new THREE.Fog(0x050200, 2, 12);

        // Create impact flash overlay (invisible initially)
        this.createImpactFlash();
    }

    createImpactFlash() {
        // Full-screen flash effect for hammer impacts
        const flashGeometry = new THREE.PlaneGeometry(100, 100);
        const flashMaterial = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 0,
            depthTest: false,
            depthWrite: false
        });
        this.impactFlashMesh = new THREE.Mesh(flashGeometry, flashMaterial);
        this.impactFlashMesh.position.z = -2;
        this.impactFlashMesh.renderOrder = 999;
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            80, // Slightly wider FOV for more immersive VR-like feel
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.copy(this.cameraPosition);
        this.camera.rotation.order = 'YXZ'; // Prevent gimbal lock
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: 'high-performance',
            alpha: false
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // MASSIVELY ENHANCED rendering for dramatic visuals
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // HDR-like tone mapping - more contrast and drama
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.5; // Brighter exposure for more contrast

        // Enable physically correct lighting
        this.renderer.physicallyCorrectLights = true;

        // Set output encoding for better colors
        this.renderer.outputEncoding = THREE.sRGBEncoding;

        this.renderer.xr.enabled = true;
        document.getElementById('game-container').appendChild(this.renderer.domElement);

        // Create custom render effects layer
        this.createRenderEffects();
    }

    createRenderEffects() {
        // Create a vignette overlay for cinematic effect
        const vignetteDiv = document.createElement('div');
        vignetteDiv.id = 'vignette-overlay';
        vignetteDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 50;
            background: radial-gradient(ellipse at center,
                transparent 0%,
                transparent 40%,
                rgba(0,0,0,0.3) 80%,
                rgba(0,0,0,0.6) 100%);
        `;
        document.body.appendChild(vignetteDiv);
        this.vignetteOverlay = vignetteDiv;

        // Create heat wave overlay
        const heatDiv = document.createElement('div');
        heatDiv.id = 'heat-overlay';
        heatDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 49;
            opacity: 0;
            background: radial-gradient(ellipse at 30% 50%,
                rgba(255,100,0,0.15) 0%,
                transparent 50%);
            mix-blend-mode: screen;
            transition: opacity 0.3s;
        `;
        document.body.appendChild(heatDiv);
        this.heatOverlay = heatDiv;

        // Create impact flash overlay
        const flashDiv = document.createElement('div');
        flashDiv.id = 'impact-flash';
        flashDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 60;
            opacity: 0;
            background: rgba(255, 170, 0, 0.4);
            transition: opacity 0.05s;
        `;
        document.body.appendChild(flashDiv);
        this.impactFlashDiv = flashDiv;
    }

    setupLights() {
        // MASSIVELY ENHANCED LIGHTING - Super dramatic!

        // Very low ambient for maximum contrast
        const ambientLight = new THREE.AmbientLight(0x100800, 0.15);
        this.scene.add(ambientLight);

        // MAIN: Forge light (INTENSE orange/red glow) - THE STAR!
        const forgeLight = new THREE.PointLight(0xff4400, 8, 15);
        forgeLight.position.set(-2.5, 1.2, -1.2);
        forgeLight.castShadow = true;
        forgeLight.shadow.mapSize.width = 2048;
        forgeLight.shadow.mapSize.height = 2048;
        forgeLight.shadow.bias = -0.001;
        forgeLight.shadow.radius = 4;
        this.scene.add(forgeLight);
        this.forgeLight = forgeLight;

        // Secondary forge light (fills the opening)
        const forgeLightSecondary = new THREE.PointLight(0xff6600, 4, 6);
        forgeLightSecondary.position.set(-2.5, 0.9, -0.8);
        this.scene.add(forgeLightSecondary);
        this.forgeLightSecondary = forgeLightSecondary;

        // Third forge light for extra glow depth
        const forgeLightTertiary = new THREE.PointLight(0xffaa00, 2, 4);
        forgeLightTertiary.position.set(-2.5, 1.5, -1.0);
        this.scene.add(forgeLightTertiary);
        this.forgeLightTertiary = forgeLightTertiary;

        // Anvil spotlight - FOCUSED dramatic task lighting
        const anvilLight = new THREE.SpotLight(0xffddaa, 3);
        anvilLight.position.set(0.5, 4, 0.5);
        anvilLight.target.position.set(0, 1, 0);
        anvilLight.angle = Math.PI / 6;
        anvilLight.penumbra = 0.8;
        anvilLight.decay = 2;
        anvilLight.castShadow = true;
        anvilLight.shadow.mapSize.width = 2048;
        anvilLight.shadow.mapSize.height = 2048;
        this.scene.add(anvilLight);
        this.scene.add(anvilLight.target);
        this.anvilLight = anvilLight;

        // Overhead fill light (very dim)
        const overheadLight = new THREE.DirectionalLight(0x332211, 0.2);
        overheadLight.position.set(2, 5, 3);
        overheadLight.castShadow = true;
        overheadLight.shadow.mapSize.width = 2048;
        overheadLight.shadow.mapSize.height = 2048;
        overheadLight.shadow.camera.left = -8;
        overheadLight.shadow.camera.right = 8;
        overheadLight.shadow.camera.top = 8;
        overheadLight.shadow.camera.bottom = -8;
        this.scene.add(overheadLight);

        // Cool rim light for dramatic depth
        const rimLight = new THREE.DirectionalLight(0x4466aa, 0.25);
        rimLight.position.set(-3, 2, -5);
        this.scene.add(rimLight);

        // Water barrel ambient glow
        const waterLight = new THREE.PointLight(0x4488ff, 0.8, 4);
        waterLight.position.set(2.5, 0.8, -1);
        this.scene.add(waterLight);
        this.waterLight = waterLight;

        // Player hand light (subtle fill for hands visibility)
        this.handLight = new THREE.PointLight(0xffaa66, 0, 2);
        this.scene.add(this.handLight);
    }

    setupVR() {
        // VR Button
        const vrButton = document.getElementById('vrButton');

        if ('xr' in navigator) {
            navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
                if (supported) {
                    vrButton.addEventListener('click', () => this.enterVR());
                } else {
                    vrButton.textContent = 'VR Not Supported';
                    vrButton.disabled = true;
                }
            });
        } else {
            vrButton.textContent = 'WebXR Not Available';
            vrButton.disabled = true;
        }

        // Create VR controllers
        for (let i = 0; i < 2; i++) {
            const controller = this.renderer.xr.getController(i);
            controller.addEventListener('selectstart', () => this.onVRSelectStart(i));
            controller.addEventListener('selectend', () => this.onVRSelectEnd(i));
            this.scene.add(controller);
            this.controllers.push(controller);

            // Add hand model
            const handGeometry = new THREE.SphereGeometry(0.05, 16, 16);
            const handMaterial = new THREE.MeshStandardMaterial({
                color: 0xffdbac,
                roughness: 0.8,
                metalness: 0.2
            });
            const hand = new THREE.Mesh(handGeometry, handMaterial);
            controller.add(hand);
            this.handModels.push(hand);
        }
    }

    async enterVR() {
        try {
            const sessionInit = { optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking'] };
            const session = await navigator.xr.requestSession('immersive-vr', sessionInit);
            await this.renderer.xr.setSession(session);
            this.isVR = true;
            document.body.classList.add('vr-mode');

            // Hide first-person hands in VR mode
            if (this.handsGroup) {
                this.handsGroup.visible = false;
            }

            // Resume audio context on user interaction
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
        } catch (error) {
            console.error('Failed to start VR session:', error);
            alert('Could not start VR session. Please check your VR headset connection.');
        }
    }

    onVRSelectStart(controllerIndex) {
        this.onHammerSwing();
    }

    onVRSelectEnd(controllerIndex) {
        // Could be used for releasing tools
    }

    createFirstPersonHands() {
        // Create a group that will follow the camera
        this.handsGroup = new THREE.Group();
        this.camera.add(this.handsGroup);
        this.scene.add(this.camera);

        // Add impact flash to camera
        if (this.impactFlashMesh) {
            this.camera.add(this.impactFlashMesh);
        }

        // Create right hand (holding hammer) - NOW MUCH BIGGER AND CLOSER
        this.rightHand = this.createHand('right');
        this.rightHand.position.set(0.4, -0.35, -0.45);  // Closer and larger
        this.rightHand.rotation.set(0, -0.3, 0);
        this.rightHand.scale.set(1.4, 1.4, 1.4);  // 40% bigger hands!
        this.handsGroup.add(this.rightHand);

        // Create left hand (holding tongs with metal) - NOW MUCH BIGGER
        this.leftHand = this.createHand('left');
        this.leftHand.position.set(-0.38, -0.38, -0.42);  // Closer and larger
        this.leftHand.rotation.set(0, 0.3, 0);
        this.leftHand.scale.set(1.4, 1.4, 1.4);  // 40% bigger hands!
        this.handsGroup.add(this.leftHand);

        // VR-style: Tools are picked up from world, not attached to hands

        // Create held metal (can be picked up with tongs) - MORE PROMINENT
        this.createHeldMetal();

        // Add hand glow effect meshes
        this.createHandGlowEffects();
    }

    createHandGlowEffects() {
        // Glow effect for right hand (shows when near anvil)
        const glowGeometry = new THREE.SphereGeometry(0.25, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xff8800,
            transparent: true,
            opacity: 0,
            depthWrite: false
        });
        this.rightHandGlow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.rightHandGlow.scale.set(1, 0.6, 0.8);
        this.rightHand.add(this.rightHandGlow);

        // Glow effect for left hand (shows when holding hot metal)
        this.leftHandGlow = new THREE.Mesh(glowGeometry.clone(), glowMaterial.clone());
        this.leftHandGlow.scale.set(0.8, 0.5, 0.6);
        this.leftHand.add(this.leftHandGlow);
    }

    createHand(side) {
        const handGroup = new THREE.Group();
        const skinColor = 0xffccaa;  // Slightly warmer skin tone
        const skinMaterial = new THREE.MeshStandardMaterial({
            color: skinColor,
            roughness: 0.5,  // Smoother for better light catch
            metalness: 0.05,
            emissive: 0x331100,
            emissiveIntensity: 0.1  // Slight self-illumination for visibility
        });

        // Palm - BIGGER and more detailed
        const palmGeometry = new THREE.BoxGeometry(0.1, 0.12, 0.14);
        const palm = new THREE.Mesh(palmGeometry, skinMaterial);
        palm.castShadow = true;
        palm.receiveShadow = true;
        handGroup.add(palm);

        // Add palm detail (knuckle bumps)
        const knuckleGeometry = new THREE.SphereGeometry(0.015, 8, 8);
        const knucklePositions = [
            { x: -0.035, y: 0.06, z: -0.06 },
            { x: -0.012, y: 0.06, z: -0.065 },
            { x: 0.012, y: 0.06, z: -0.065 },
            { x: 0.035, y: 0.06, z: -0.06 }
        ];
        knucklePositions.forEach(pos => {
            const knuckle = new THREE.Mesh(knuckleGeometry, skinMaterial);
            knuckle.position.set(pos.x, pos.y, pos.z);
            knuckle.scale.set(1, 0.6, 1);
            handGroup.add(knuckle);
        });

        // Fingers - BIGGER and store references for animation
        const fingerGeometry = new THREE.CylinderGeometry(0.016, 0.013, 0.1, 8);
        const fingerPositions = [
            { x: -0.035, z: -0.1 },
            { x: -0.012, z: -0.11 },
            { x: 0.012, z: -0.11 },
            { x: 0.035, z: -0.1 }
        ];

        const fingers = [];
        fingerPositions.forEach((pos, index) => {
            const finger = new THREE.Mesh(fingerGeometry, skinMaterial);
            finger.position.set(pos.x, 0.03, pos.z);
            finger.rotation.x = Math.PI / 2 - 0.5;
            finger.castShadow = true;
            finger.userData.baseRotation = finger.rotation.clone();
            fingers.push(finger);
            handGroup.add(finger);

            // Add fingertip
            const tipGeometry = new THREE.SphereGeometry(0.013, 8, 8);
            const tip = new THREE.Mesh(tipGeometry, skinMaterial);
            tip.position.set(0, -0.05, 0);
            tip.scale.set(1, 0.8, 1);
            finger.add(tip);
        });

        // Thumb - BIGGER
        const thumbGeometry = new THREE.CylinderGeometry(0.018, 0.015, 0.08, 8);
        const thumb = new THREE.Mesh(thumbGeometry, skinMaterial);
        const thumbX = side === 'right' ? 0.06 : -0.06;
        thumb.position.set(thumbX, 0.02, -0.02);
        thumb.rotation.set(Math.PI / 2, side === 'right' ? 0.6 : -0.6, 0);
        thumb.castShadow = true;
        thumb.userData.baseRotation = thumb.rotation.clone();
        fingers.push(thumb);
        handGroup.add(thumb);

        // Store finger references
        handGroup.userData.fingers = fingers;

        // VR-style hands - NO ARMS OR WRISTS, just clean hand cut-off
        return handGroup;
    }

    // Tools are now pickupable items in the world, not attached to hands

    createHeldMetal() {
        // Metal piece that can be picked up with tongs - MUCH BIGGER AND MORE VISIBLE
        const metalGeometry = new THREE.BoxGeometry(0.2, 0.04, 0.06);
        const metalMaterial = new THREE.MeshStandardMaterial({
            color: 0x9a9a9a,
            roughness: 0.3,
            metalness: 0.95,
            emissive: 0x000000,
            emissiveIntensity: 0
        });
        const heldMetal = new THREE.Mesh(metalGeometry, metalMaterial);
        heldMetal.position.set(-1.5, 1.3, 0); // Place on workbench
        heldMetal.castShadow = true;
        heldMetal.receiveShadow = true;

        // Add edge bevels for realism
        const bevelGeometry = new THREE.BoxGeometry(0.21, 0.01, 0.065);
        const bevelMaterial = new THREE.MeshStandardMaterial({
            color: 0x888888,
            roughness: 0.35,
            metalness: 0.9
        });
        const topBevel = new THREE.Mesh(bevelGeometry, bevelMaterial);
        topBevel.position.y = 0.025;
        heldMetal.add(topBevel);

        // Add a subtle glow mesh for hot metal
        const glowGeometry = new THREE.BoxGeometry(0.22, 0.05, 0.07);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xff4400,
            transparent: true,
            opacity: 0,
            depthWrite: false
        });
        this.metalGlowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        heldMetal.add(this.metalGlowMesh);

        // Add to scene as pickupable item
        heldMetal.userData.type = 'metal';
        heldMetal.userData.pickupable = true;
        heldMetal.userData.holdOffset = new THREE.Vector3(0, -0.25, -0.1);
        this.scene.add(heldMetal);
        this.pickupableItems.push(heldMetal);

        this.heldMetal = heldMetal;
        this.heldMetalMaterial = metalMaterial;
    }

    createCrosshair() {
        // Create HTML crosshair
        const crosshair = document.createElement('div');
        crosshair.id = 'crosshair';
        crosshair.innerHTML = `
            <div class="crosshair-dot"></div>
            <div class="crosshair-ring"></div>
        `;
        document.getElementById('ui-overlay').appendChild(crosshair);
        this.crosshairElement = crosshair;
    }

    createWorkshop() {
        // Floor
        const floorGeometry = new THREE.PlaneGeometry(20, 20);
        const floorMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a2a2a,
            roughness: 0.9,
            metalness: 0.1
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);

        // Walls
        this.createWalls();

        // Anvil
        this.createAnvil();

        // Forge/Furnace
        this.createForge();

        // Water Barrel
        this.createWaterBarrel();

        // Tool rack
        this.createToolRack();

        // Workbench
        this.createWorkbench();
    }

    createWalls() {
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x3a2a1a,
            roughness: 0.9
        });

        // Back wall
        const backWall = new THREE.Mesh(
            new THREE.BoxGeometry(12, 5, 0.5),
            wallMaterial
        );
        backWall.position.set(0, 2.5, -4);
        backWall.receiveShadow = true;
        this.scene.add(backWall);

        // Left wall
        const leftWall = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 5, 10),
            wallMaterial
        );
        leftWall.position.set(-6, 2.5, -0.5);
        leftWall.receiveShadow = true;
        this.scene.add(leftWall);

        // Right wall
        const rightWall = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 5, 10),
            wallMaterial
        );
        rightWall.position.set(6, 2.5, -0.5);
        rightWall.receiveShadow = true;
        this.scene.add(rightWall);
    }

    createAnvil() {
        const anvilGroup = new THREE.Group();

        // Anvil body
        const bodyGeometry = new THREE.BoxGeometry(0.6, 0.3, 0.8);
        const anvilMaterial = new THREE.MeshStandardMaterial({
            color: 0x555555,
            roughness: 0.3,
            metalness: 0.9
        });
        const body = new THREE.Mesh(bodyGeometry, anvilMaterial);
        body.castShadow = true;
        body.receiveShadow = true;
        anvilGroup.add(body);

        // Anvil horn
        const hornGeometry = new THREE.CylinderGeometry(0.05, 0.15, 0.4, 8);
        const horn = new THREE.Mesh(hornGeometry, anvilMaterial);
        horn.rotation.z = Math.PI / 2;
        horn.position.set(0.4, 0.1, 0);
        horn.castShadow = true;
        anvilGroup.add(horn);

        // Anvil base (wooden stump)
        const baseGeometry = new THREE.CylinderGeometry(0.35, 0.4, 0.7, 12);
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a3525,
            roughness: 0.9
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = -0.5;
        base.castShadow = true;
        anvilGroup.add(base);

        anvilGroup.position.set(0, 1, 0);
        this.scene.add(anvilGroup);
        this.anvil = anvilGroup;

        // Add interaction indicator
        this.createInteractionIndicator(anvilGroup, 'ANVIL - Click to Strike', 0xffaa00);
    }

    createForge() {
        const forgeGroup = new THREE.Group();

        // Forge body (brick structure)
        const forgeGeometry = new THREE.BoxGeometry(1.8, 1.2, 1.2);
        const forgeMaterial = new THREE.MeshStandardMaterial({
            color: 0x8b4513,
            roughness: 0.8
        });
        const forgeBody = new THREE.Mesh(forgeGeometry, forgeMaterial);
        forgeBody.castShadow = true;
        forgeGroup.add(forgeBody);

        // Forge opening
        const openingGeometry = new THREE.BoxGeometry(1.0, 0.5, 0.6);
        const emberMaterial = new THREE.MeshStandardMaterial({
            color: 0xff4400,
            emissive: 0xff2200,
            emissiveIntensity: 1.5
        });
        const opening = new THREE.Mesh(openingGeometry, emberMaterial);
        opening.position.set(0, 0.2, 0.35);
        forgeGroup.add(opening);

        // Chimney
        const chimneyGeometry = new THREE.CylinderGeometry(0.25, 0.3, 2.5, 8);
        const chimneyMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a2a2a,
            roughness: 0.9
        });
        const chimney = new THREE.Mesh(chimneyGeometry, chimneyMaterial);
        chimney.position.set(0, 1.8, -0.3);
        forgeGroup.add(chimney);

        // Bellows
        const bellowsGeometry = new THREE.BoxGeometry(0.4, 0.3, 0.2);
        const bellowsMaterial = new THREE.MeshStandardMaterial({
            color: 0x654321,
            roughness: 0.8
        });
        const bellows = new THREE.Mesh(bellowsGeometry, bellowsMaterial);
        bellows.position.set(-1.0, 0, 0);
        bellows.castShadow = true;
        forgeGroup.add(bellows);

        forgeGroup.position.set(-2.5, 0.6, -1.5);
        this.scene.add(forgeGroup);
        this.forge = forgeGroup;
        this.forgeOpening = opening;

        // Add interaction indicator
        this.createInteractionIndicator(forgeGroup, 'FORGE - Press E to Heat', 0xff6600);
    }

    createWaterBarrel() {
        const barrelGroup = new THREE.Group();

        // Barrel body
        const barrelGeometry = new THREE.CylinderGeometry(0.45, 0.4, 0.9, 16);
        const barrelMaterial = new THREE.MeshStandardMaterial({
            color: 0x654321,
            roughness: 0.8
        });
        const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        barrel.castShadow = true;
        barrelGroup.add(barrel);

        // Metal bands
        const bandGeometry = new THREE.TorusGeometry(0.43, 0.02, 8, 32);
        const bandMaterial = new THREE.MeshStandardMaterial({
            color: 0x444444,
            metalness: 0.8,
            roughness: 0.3
        });
        const topBand = new THREE.Mesh(bandGeometry, bandMaterial);
        topBand.rotation.x = Math.PI / 2;
        topBand.position.y = 0.35;
        barrelGroup.add(topBand);

        const bottomBand = new THREE.Mesh(bandGeometry, bandMaterial);
        bottomBand.rotation.x = Math.PI / 2;
        bottomBand.position.y = -0.35;
        barrelGroup.add(bottomBand);

        // Water surface
        const waterGeometry = new THREE.CircleGeometry(0.42, 32);
        const waterMaterial = new THREE.MeshStandardMaterial({
            color: 0x1e5a8a,
            roughness: 0.1,
            metalness: 0.5,
            transparent: true,
            opacity: 0.8
        });
        const water = new THREE.Mesh(waterGeometry, waterMaterial);
        water.rotation.x = -Math.PI / 2;
        water.position.y = 0.4;
        barrelGroup.add(water);

        barrelGroup.position.set(2.5, 0.45, -1);
        this.scene.add(barrelGroup);
        this.waterBarrel = barrelGroup;

        // Add interaction indicator
        this.createInteractionIndicator(barrelGroup, 'WATER - Press Q to Quench', 0x4488ff);
    }

    createInteractionIndicator(parent, text, color) {
        // Create a floating text sprite
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 128;

        context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        context.roundRect(10, 10, 492, 108, 20);
        context.fill();

        context.strokeStyle = '#' + color.toString(16).padStart(6, '0');
        context.lineWidth = 4;
        context.roundRect(10, 10, 492, 108, 20);
        context.stroke();

        context.font = 'bold 36px Arial';
        context.fillStyle = '#ffffff';
        context.textAlign = 'center';
        context.fillText(text, 256, 75);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 0
        });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(2, 0.5, 1);
        sprite.position.y = 1.5;
        sprite.userData.baseOpacity = 0;
        parent.add(sprite);
        parent.userData.indicator = sprite;
    }

    createToolRack() {
        const rackGroup = new THREE.Group();

        // Rack board
        const rackGeometry = new THREE.BoxGeometry(0.1, 1.5, 2);
        const rackMaterial = new THREE.MeshStandardMaterial({
            color: 0x654321,
            roughness: 0.8
        });
        const rack = new THREE.Mesh(rackGeometry, rackMaterial);
        rack.castShadow = true;
        rackGroup.add(rack);

        // Add decorative tools on the rack
        const toolMaterial = new THREE.MeshStandardMaterial({
            color: 0x555555,
            metalness: 0.8,
            roughness: 0.3
        });

        // Hanging hammer
        const hammerHead = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.12), toolMaterial);
        hammerHead.position.set(0.08, 0.3, -0.5);
        rackGroup.add(hammerHead);

        // Hanging tongs
        const tongsHandle = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.4, 0.02), toolMaterial);
        tongsHandle.position.set(0.08, 0, 0);
        rackGroup.add(tongsHandle);

        rackGroup.position.set(-4, 1.2, -2.5);
        this.scene.add(rackGroup);
    }

    createWorkbench() {
        const benchGroup = new THREE.Group();

        // Table top
        const topGeometry = new THREE.BoxGeometry(2, 0.1, 0.8);
        const woodMaterial = new THREE.MeshStandardMaterial({
            color: 0x5a4030,
            roughness: 0.8
        });
        const top = new THREE.Mesh(topGeometry, woodMaterial);
        top.castShadow = true;
        top.receiveShadow = true;
        benchGroup.add(top);

        // Legs
        const legGeometry = new THREE.BoxGeometry(0.1, 0.8, 0.1);
        const positions = [
            { x: -0.9, z: -0.3 },
            { x: -0.9, z: 0.3 },
            { x: 0.9, z: -0.3 },
            { x: 0.9, z: 0.3 }
        ];

        positions.forEach(pos => {
            const leg = new THREE.Mesh(legGeometry, woodMaterial);
            leg.position.set(pos.x, -0.45, pos.z);
            leg.castShadow = true;
            benchGroup.add(leg);
        });

        benchGroup.position.set(3.5, 0.9, -2.5);
        this.scene.add(benchGroup);
    }

    createTools() {
        // PICKUPABLE HAMMER - on workbench
        const hammerGroup = new THREE.Group();

        const headGeometry = new THREE.BoxGeometry(0.15, 0.1, 0.25);
        const hammerMaterial = new THREE.MeshStandardMaterial({
            color: 0x666666,
            roughness: 0.4,
            metalness: 0.8
        });
        const head = new THREE.Mesh(headGeometry, hammerMaterial);
        head.castShadow = true;
        hammerGroup.add(head);

        const handleGeometry = new THREE.CylinderGeometry(0.02, 0.025, 0.6, 8);
        const handleMaterial = new THREE.MeshStandardMaterial({
            color: 0x654321,
            roughness: 0.7
        });
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.position.y = -0.35;
        handle.castShadow = true;
        hammerGroup.add(handle);

        hammerGroup.position.set(0.5, 1.3, 0.5);
        hammerGroup.rotation.z = Math.PI / 2;
        hammerGroup.userData.type = 'hammer';
        hammerGroup.userData.pickupable = true;
        hammerGroup.userData.holdOffset = new THREE.Vector3(0, -0.3, -0.1);
        this.scene.add(hammerGroup);
        this.hammer = hammerGroup;
        this.pickupableItems.push(hammerGroup);

        // PICKUPABLE TONGS - on workbench
        const tongsGroup = new THREE.Group();
        const tongsMaterial = new THREE.MeshStandardMaterial({
            color: 0x444444,
            roughness: 0.4,
            metalness: 0.8
        });

        const armGeometry = new THREE.BoxGeometry(0.015, 0.25, 0.02);
        const leftArm = new THREE.Mesh(armGeometry, tongsMaterial);
        leftArm.position.set(-0.015, -0.1, 0);
        leftArm.rotation.z = 0.1;
        leftArm.castShadow = true;
        tongsGroup.add(leftArm);

        const rightArm = new THREE.Mesh(armGeometry, tongsMaterial);
        rightArm.position.set(0.015, -0.1, 0);
        rightArm.rotation.z = -0.1;
        rightArm.castShadow = true;
        tongsGroup.add(rightArm);

        const pivotGeometry = new THREE.CylinderGeometry(0.01, 0.01, 0.04, 8);
        const pivot = new THREE.Mesh(pivotGeometry, tongsMaterial);
        pivot.rotation.z = Math.PI / 2;
        tongsGroup.add(pivot);

        tongsGroup.position.set(-0.5, 1.3, 0.5);
        tongsGroup.rotation.z = Math.PI / 2;
        tongsGroup.userData.type = 'tongs';
        tongsGroup.userData.pickupable = true;
        tongsGroup.userData.holdOffset = new THREE.Vector3(0, -0.15, -0.08);
        this.scene.add(tongsGroup);
        this.tongs = tongsGroup;
        this.pickupableItems.push(tongsGroup);
    }

    createMetal() {
        // Metal on anvil (for visual feedback)
        const metalGeometry = new THREE.BoxGeometry(0.5, 0.08, 0.12);
        const metalMaterial = new THREE.MeshStandardMaterial({
            color: 0x8a8a8a,
            roughness: 0.5,
            metalness: 0.9
        });
        const metal = new THREE.Mesh(metalGeometry, metalMaterial);
        metal.position.set(0, 1.22, 0);
        metal.castShadow = true;
        metal.receiveShadow = true;
        metal.visible = false; // Hidden by default, shown when "placing" metal
        this.scene.add(metal);
        this.metal = metal;
        this.metalBaseMaterial = metalMaterial;
    }

    createParticleSystems() {
        // ENHANCED Spark particles - MORE SPARKS!
        const sparkGeometry = new THREE.BufferGeometry();
        const sparkCount = 250; // 2.5x more sparks!
        const sparkPositions = new Float32Array(sparkCount * 3);
        const sparkVelocities = [];
        const sparkLifetimes = [];

        for (let i = 0; i < sparkCount; i++) {
            sparkPositions[i * 3] = 0;
            sparkPositions[i * 3 + 1] = 0;
            sparkPositions[i * 3 + 2] = 0;
            sparkVelocities.push(new THREE.Vector3());
            sparkLifetimes.push(0);
        }

        sparkGeometry.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));

        const sparkMaterial = new THREE.PointsMaterial({
            color: 0xffdd33, // Brighter, more yellow-orange
            size: 0.08, // Bigger sparks
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending // Additive blending for glow
        });

        const sparks = new THREE.Points(sparkGeometry, sparkMaterial);
        this.scene.add(sparks);
        this.sparkSystem = {
            points: sparks,
            velocities: sparkVelocities,
            lifetimes: sparkLifetimes,
            active: false
        };

        // Smoke particles from forge
        this.createSmokeParticles();

        // Fire particles in forge  - ENHANCED
        this.createFireParticles();

        // NEW: Ember particles (glowing bits that float around forge)
        this.createEmberParticles();
    }

    createEmberParticles() {
        const emberGeometry = new THREE.BufferGeometry();
        const emberCount = 30;
        const emberPositions = new Float32Array(emberCount * 3);
        const emberVelocities = [];

        for (let i = 0; i < emberCount; i++) {
            // Random positions around forge
            emberPositions[i * 3] = -2.5 + (Math.random() - 0.5) * 2;
            emberPositions[i * 3 + 1] = 0.8 + Math.random() * 1.5;
            emberPositions[i * 3 + 2] = -1.5 + (Math.random() - 0.5) * 2;
            emberVelocities.push(new THREE.Vector3(
                (Math.random() - 0.5) * 0.02,
                0.03 + Math.random() * 0.02,
                (Math.random() - 0.5) * 0.02
            ));
        }

        emberGeometry.setAttribute('position', new THREE.BufferAttribute(emberPositions, 3));

        const emberMaterial = new THREE.PointsMaterial({
            color: 0xff4400,
            size: 0.06,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });

        const embers = new THREE.Points(emberGeometry, emberMaterial);
        this.scene.add(embers);
        this.emberSystem = { points: embers, velocities: emberVelocities };
    }

    createSmokeParticles() {
        const smokeGeometry = new THREE.BufferGeometry();
        const smokeCount = 50;
        const smokePositions = new Float32Array(smokeCount * 3);
        const smokeVelocities = [];

        for (let i = 0; i < smokeCount; i++) {
            const angle = (i / smokeCount) * Math.PI * 2;
            smokePositions[i * 3] = -2.5 + Math.cos(angle) * 0.2;
            smokePositions[i * 3 + 1] = 2.5 + Math.random() * 2;
            smokePositions[i * 3 + 2] = -1.5 + Math.sin(angle) * 0.2;
            smokeVelocities.push(new THREE.Vector3(
                (Math.random() - 0.5) * 0.01,
                0.02 + Math.random() * 0.01,
                (Math.random() - 0.5) * 0.01
            ));
        }

        smokeGeometry.setAttribute('position', new THREE.BufferAttribute(smokePositions, 3));

        const smokeMaterial = new THREE.PointsMaterial({
            color: 0x555555,
            size: 0.3,
            transparent: true,
            opacity: 0.3
        });

        const smoke = new THREE.Points(smokeGeometry, smokeMaterial);
        this.scene.add(smoke);
        this.smokeSystem = { points: smoke, velocities: smokeVelocities };
    }

    createFireParticles() {
        const fireGeometry = new THREE.BufferGeometry();
        const fireCount = 150; // LOTS more fire particles!
        const firePositions = new Float32Array(fireCount * 3);
        const fireColors = new Float32Array(fireCount * 3);

        for (let i = 0; i < fireCount; i++) {
            firePositions[i * 3] = -2.5 + (Math.random() - 0.5) * 1.0;
            firePositions[i * 3 + 1] = 0.6 + Math.random() * 0.6;
            firePositions[i * 3 + 2] = -1.1 + (Math.random() - 0.5) * 0.6;

            // Vary fire colors (red to white-hot)
            const colorVariation = Math.random();
            if (colorVariation > 0.85) {
                // White-hot core
                fireColors[i * 3] = 1.0;
                fireColors[i * 3 + 1] = 1.0;
                fireColors[i * 3 + 2] = 0.7;
            } else if (colorVariation > 0.6) {
                // Yellow
                fireColors[i * 3] = 1.0;
                fireColors[i * 3 + 1] = 0.8;
                fireColors[i * 3 + 2] = 0.2;
            } else if (colorVariation > 0.3) {
                // Orange
                fireColors[i * 3] = 1.0;
                fireColors[i * 3 + 1] = 0.4;
                fireColors[i * 3 + 2] = 0.0;
            } else {
                // Deep red
                fireColors[i * 3] = 1.0;
                fireColors[i * 3 + 1] = 0.1;
                fireColors[i * 3 + 2] = 0.0;
            }
        }

        fireGeometry.setAttribute('position', new THREE.BufferAttribute(firePositions, 3));
        fireGeometry.setAttribute('color', new THREE.BufferAttribute(fireColors, 3));

        const fireMaterial = new THREE.PointsMaterial({
            size: 0.2, // BIGGER fire particles
            transparent: true,
            opacity: 0.95,
            blending: THREE.AdditiveBlending,
            vertexColors: true,
            depthWrite: false
        });

        const fire = new THREE.Points(fireGeometry, fireMaterial);
        this.scene.add(fire);
        this.fireSystem = fire;

        // Create additional glow layer for forge
        this.createForgeGlow();
    }

    createForgeGlow() {
        // Large glow sphere around forge
        const glowGeometry = new THREE.SphereGeometry(1.5, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xff4400,
            transparent: true,
            opacity: 0.15,
            depthWrite: false,
            side: THREE.BackSide
        });
        this.forgeGlowSphere = new THREE.Mesh(glowGeometry, glowMaterial);
        this.forgeGlowSphere.position.set(-2.5, 0.9, -1.2);
        this.scene.add(this.forgeGlowSphere);
    }

    setupEventListeners() {
        // Keyboard
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            this.handleKeyPress(e.key.toLowerCase());
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        // Mouse
        window.addEventListener('mousedown', (e) => {
            this.mouseDown = true;
            if (e.button === 0) { // Left click
                if (!this.pointerLocked) {
                    this.renderer.domElement.requestPointerLock();
                } else {
                    this.onHammerSwing();
                }
                // Curl fingers when clicking
                this.targetFingerCurl = 1;
            }
        });

        window.addEventListener('mouseup', () => {
            this.mouseDown = false;
            // Uncurl fingers when releasing
            this.targetFingerCurl = 0;
        });

        window.addEventListener('mousemove', (e) => {
            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

            // Camera rotation with mouse (pointer lock)
            if (this.pointerLocked) {
                this.cameraRotation.y -= e.movementX * 0.002;
                this.cameraRotation.x -= e.movementY * 0.002;
                this.cameraRotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.cameraRotation.x));

                // VR-style hand tracking - hands follow mouse movement
                this.mouseTargetPos.x = this.mouse.x * 0.15;
                this.mouseTargetPos.y = this.mouse.y * 0.1;

                // MOUSE SWING MECHANICS - Track vertical mouse movement
                this.mouseVelocityY = e.movementY;
                this.updateMouseSwing(e.movementY);
            }
        });

        // Window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Track pointer lock state
        document.addEventListener('pointerlockchange', () => {
            this.pointerLocked = document.pointerLockElement === this.renderer.domElement;
            if (this.crosshairElement) {
                this.crosshairElement.style.display = this.pointerLocked ? 'block' : 'none';
            }
        });

        document.addEventListener('pointerlockerror', () => {
            console.warn('Pointer lock failed');
        });

        // Escape to exit pointer lock
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.pointerLocked) {
                document.exitPointerLock();
            }
        });
    }

    handleKeyPress(key) {
        switch(key) {
            case 'e':
                this.heatMetal();
                break;
            case 'q':
                this.quenchMetal();
                break;
            case 'r':
                this.resetMetal();
                break;
            case 'f':
                // Pick up / drop items
                this.togglePickup();
                break;
            case 'g':
                // Drop held item
                this.dropItem();
                break;
            case 't':
                // Toggle shop
                this.toggleShop();
                break;
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
                // Select weapon type
                const types = Object.keys(this.weaponTypes);
                this.currentWeaponType = types[parseInt(key) - 1];
                this.showMessage(`Selected: ${this.weaponTypes[this.currentWeaponType].name}`);
                break;
            case ' ':
                // Spacebar also swings hammer
                if (this.pointerLocked) {
                    this.onHammerSwing();
                }
                break;
        }
    }

    heatMetal() {
        // Check if player is near forge
        const playerPos = this.cameraPosition;
        const forgePos = this.forge.position;
        const distance = new THREE.Vector2(
            playerPos.x - forgePos.x,
            playerPos.z - forgePos.z
        ).length();

        if (distance < 2.5) {
            if (!this.isMetalInForge) {
                this.isMetalInForge = true;
                this.showMessage('Heating metal in forge...', '#ff6600');
                // Resume audio context on interaction
                if (this.audioContext && this.audioContext.state === 'suspended') {
                    this.audioContext.resume();
                }
            }
        } else {
            this.showMessage('Get closer to the forge!', '#ff4444');
        }
    }

    quenchMetal() {
        // Check if player is near water barrel
        const playerPos = this.cameraPosition;
        const waterPos = this.waterBarrel.position;
        const distance = new THREE.Vector2(
            playerPos.x - waterPos.x,
            playerPos.z - waterPos.z
        ).length();

        if (distance < 2) {
            if (this.metalTemperature > 100) {
                this.createSteamEffect();
                this.metalTemperature = 20;
                this.isMetalInForge = false;

                // Check if blade is complete
                if (this.quality >= 80) {
                    this.completeBlade();
                } else if (this.quality >= 50) {
                    this.showMessage('Blade quenched! Quality: ' + this.quality.toFixed(0) + '% - Keep practicing!', '#88ff88');
                } else {
                    this.showMessage('Blade quenched. Quality: ' + this.quality.toFixed(0) + '% - Try heating more before striking', '#ffaa00');
                }

                this.playQuenchSound();
            } else {
                this.showMessage('Metal is already cool', '#aaaaaa');
            }
        } else {
            this.showMessage('Get closer to the water barrel!', '#ff4444');
        }
    }

    completeBlade() {
        this.bladesForged++;
        if (this.quality > this.bestQuality) {
            this.bestQuality = this.quality;
        }
        this.showMessage('EXCELLENT BLADE! Quality: ' + this.quality.toFixed(0) + '% | Blades Forged: ' + this.bladesForged, '#00ff00', 4000);
        this.playSuccessSound();
    }

    resetMetal() {
        if (!this.metal) return;

        // Reset metal state
        this.metal.scale.set(1, 1, 1);
        this.metalTemperature = 20;
        this.quality = 0;
        this.hammerStrikes = 0;
        this.metalDeformationCount = 0;
        this.isMetalInForge = false;

        // Reset held metal scale
        if (this.heldMetal) {
            this.heldMetal.scale.set(1, 1, 1);
        }

        this.showMessage('Metal reset - Ready to forge again!', '#aaaaaa');
    }

    showMessage(text, color = '#ffffff', duration = 2000) {
        // Remove existing message
        const existing = document.getElementById('game-message');
        if (existing) existing.remove();

        const message = document.createElement('div');
        message.id = 'game-message';
        message.textContent = text;
        message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: ${color};
            padding: 20px 40px;
            border-radius: 10px;
            font-size: 24px;
            font-weight: bold;
            z-index: 1000;
            border: 2px solid ${color};
            text-align: center;
            pointer-events: none;
            animation: fadeInOut ${duration}ms ease-in-out;
        `;
        document.body.appendChild(message);

        setTimeout(() => message.remove(), duration);
    }

    onHammerSwing() {
        if (this.isHammerSwinging) return;

        // Resume audio context on first interaction
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        this.isHammerSwinging = true;
        this.hammerSwingProgress = 0;
        this.hasHitThisSwing = false;
    }

    checkHammerHit() {
        if (this.hasHitThisSwing) return;

        // Check if player is near anvil
        const playerPos = this.cameraPosition;
        const anvilPos = this.anvil.position;
        const distanceToAnvil = new THREE.Vector2(
            playerPos.x - anvilPos.x,
            playerPos.z - anvilPos.z
        ).length();

        if (distanceToAnvil < 1.8) {
            // Player is close enough to anvil to strike
            this.onMetalStrike();
            this.hasHitThisSwing = true;
        }
    }

    onMetalStrike(powerMultiplier = 1.0) {
        // Metal must be hot to forge effectively
        if (this.metalTemperature < 600) {
            this.showMessage('Metal too cold! Heat it in the forge first (Press E near forge)', '#ff6666');
            this.playErrorSound();
            this.addScreenShake(0.005);
            return;
        }

        this.hammerStrikes++;
        this.metalDeformationCount++;

        // Calculate quality based on temperature
        const optimalTemp = 950;
        const tempDiff = Math.abs(this.metalTemperature - optimalTemp);

        // Quality calculation based on temperature range
        if (this.metalTemperature >= 800 && this.metalTemperature <= 1100) {
            // Optimal range - maximum quality gain
            const tempQuality = Math.max(0, 100 - (tempDiff / 5));
            const qualityIncrease = (tempQuality / 10) * powerMultiplier;
            this.quality = Math.min(100, this.quality + qualityIncrease);
            this.showMessage('PERFECT STRIKE! +' + qualityIncrease.toFixed(1) + '% quality', '#00ff00', 800);
            // MASSIVE shake for perfect strike
            this.addScreenShake(0.025 * powerMultiplier);
            // Flash effect
            this.triggerImpactFlash(0.5 * powerMultiplier);
            // Bright anvil light pulse
            if (this.anvilLight) {
                this.anvilLight.intensity = 8 * powerMultiplier;
            }
        } else if (this.metalTemperature >= 600) {
            // Acceptable range - minimal quality gain
            const qualityIncrease = 1 * powerMultiplier;
            this.quality = Math.min(100, this.quality + qualityIncrease);
            this.showMessage('Strike! +' + qualityIncrease.toFixed(1) + '% (heat metal more for better results)', '#ffaa00', 800);
            // Medium shake for normal strike
            this.addScreenShake(0.015 * powerMultiplier);
            this.triggerImpactFlash(0.3 * powerMultiplier);
        }

        // ENHANCED metal deformation - more dramatic forging
        if (this.heldMetal && this.metalDeformationCount < 30) {
            // Flatten more dramatically
            this.heldMetal.scale.y *= 0.92;
            this.heldMetal.scale.x *= 1.03;
            this.heldMetal.scale.z *= 1.02;

            // More dramatic rotation for impact feel
            this.heldMetal.rotation.y += (Math.random() - 0.5) * 0.04;
            this.heldMetal.rotation.z += (Math.random() - 0.5) * 0.02;

            // Position jitter
            const wobble = (Math.random() - 0.5) * 0.005;
            this.heldMetal.position.x = wobble;
        } else if (this.metalDeformationCount >= 30) {
            // Reset deformation for continued forging (blade taking shape)
            this.heldMetal.scale.set(1.8, 0.4, 1.5);
            this.heldMetal.rotation.set(0, 0, 0);
            this.heldMetal.position.set(0, -0.32, 0);
            this.metalDeformationCount = 0;
            this.showMessage('Blade taking shape!', '#ffdd00', 1200);
        }

        // Create MASSIVE sparks at anvil position
        this.createSparks(new THREE.Vector3(
            this.anvil.position.x,
            this.anvil.position.y + 0.2,
            this.anvil.position.z
        ));

        // Play hammer sound
        this.playHammerSound();

        // Cool metal from working
        this.metalTemperature = Math.max(20, this.metalTemperature - 15);
    }

    triggerImpactFlash(intensity) {
        // Trigger screen flash effect
        if (this.impactFlashDiv) {
            this.impactFlashDiv.style.opacity = intensity;
            setTimeout(() => {
                this.impactFlashDiv.style.opacity = 0;
            }, 50);
        }

        // Flash the impact mesh if present
        if (this.impactFlashMesh && this.impactFlashMesh.material) {
            this.impactFlashMesh.material.opacity = intensity * 0.3;
        }
    }

    addScreenShake(intensity) {
        this.screenShake.intensity = intensity;
        this.screenShake.x = (Math.random() - 0.5) * intensity;
        this.screenShake.y = (Math.random() - 0.5) * intensity;
    }

    createSparks(position) {
        this.sparkSystem.active = true;
        const positions = this.sparkSystem.points.geometry.attributes.position.array;

        for (let i = 0; i < this.sparkSystem.velocities.length; i++) {
            // Tight spawn point at impact
            positions[i * 3] = position.x + (Math.random() - 0.5) * 0.15;
            positions[i * 3 + 1] = position.y + Math.random() * 0.05;
            positions[i * 3 + 2] = position.z + (Math.random() - 0.5) * 0.15;

            // MASSIVE DRAMATIC VELOCITIES - sparks fly everywhere!
            const angle = Math.random() * Math.PI * 2;
            const elevation = Math.random() * Math.PI * 0.4 + 0.1;
            const speed = 0.25 + Math.random() * 0.4; // MUCH faster sparks
            this.sparkSystem.velocities[i].set(
                Math.cos(angle) * Math.cos(elevation) * speed,
                Math.sin(elevation) * speed + 0.3, // Strong upward burst
                Math.sin(angle) * Math.cos(elevation) * speed
            );

            // Longer lifetime for trailing effect
            this.sparkSystem.lifetimes[i] = Math.random() * 0.5 + 0.8;
        }

        this.sparkSystem.points.material.opacity = 1;
        this.sparkSystem.points.material.size = 0.12;  // Bigger sparks
        this.sparkSystem.points.geometry.attributes.position.needsUpdate = true;
    }

    createSteamEffect() {
        if (!this.steamSystem) {
            const steamGeometry = new THREE.BufferGeometry();
            const steamCount = 60;
            const steamPositions = new Float32Array(steamCount * 3);
            this.steamVelocities = [];

            for (let i = 0; i < steamCount; i++) {
                steamPositions[i * 3] = this.waterBarrel.position.x + (Math.random() - 0.5) * 0.4;
                steamPositions[i * 3 + 1] = this.waterBarrel.position.y + 0.4;
                steamPositions[i * 3 + 2] = this.waterBarrel.position.z + (Math.random() - 0.5) * 0.4;
                this.steamVelocities.push(new THREE.Vector3(
                    (Math.random() - 0.5) * 0.03,
                    0.08 + Math.random() * 0.04,
                    (Math.random() - 0.5) * 0.03
                ));
            }

            steamGeometry.setAttribute('position', new THREE.BufferAttribute(steamPositions, 3));

            const steamMaterial = new THREE.PointsMaterial({
                color: 0xeeeeee,
                size: 0.5,
                transparent: true,
                opacity: 0.9
            });

            const steam = new THREE.Points(steamGeometry, steamMaterial);
            this.scene.add(steam);
            this.steamSystem = { points: steam, velocities: this.steamVelocities, active: true, lifetime: 0 };
        } else {
            // Reset steam positions
            const positions = this.steamSystem.points.geometry.attributes.position.array;
            for (let i = 0; i < this.steamVelocities.length; i++) {
                positions[i * 3] = this.waterBarrel.position.x + (Math.random() - 0.5) * 0.4;
                positions[i * 3 + 1] = this.waterBarrel.position.y + 0.4;
                positions[i * 3 + 2] = this.waterBarrel.position.z + (Math.random() - 0.5) * 0.4;
                this.steamVelocities[i].set(
                    (Math.random() - 0.5) * 0.03,
                    0.08 + Math.random() * 0.04,
                    (Math.random() - 0.5) * 0.03
                );
            }
            this.steamSystem.points.geometry.attributes.position.needsUpdate = true;
            this.steamSystem.active = true;
            this.steamSystem.lifetime = 0;
            this.steamSystem.points.material.opacity = 0.9;
        }
    }

    playHammerSound() {
        if (!this.audioContext) return;

        const now = this.audioContext.currentTime;

        // Impact sound
        const osc1 = this.audioContext.createOscillator();
        const osc2 = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        osc1.type = 'square';
        osc1.frequency.setValueAtTime(180, now);
        osc1.frequency.exponentialRampToValueAtTime(80, now + 0.1);

        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(400, now);
        osc2.frequency.exponentialRampToValueAtTime(100, now + 0.08);

        gainNode.gain.setValueAtTime(0.4, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.15);
        osc2.stop(now + 0.15);
    }

    playQuenchSound() {
        if (!this.audioContext) return;

        const now = this.audioContext.currentTime;
        const bufferSize = this.audioContext.sampleRate * 2;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize / 2.5));
        }

        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();

        source.buffer = buffer;
        filter.type = 'highpass';
        filter.frequency.value = 800;

        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 2);

        source.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        source.start(now);
    }

    playErrorSound() {
        if (!this.audioContext) return;

        const now = this.audioContext.currentTime;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(100, now);
        oscillator.frequency.exponentialRampToValueAtTime(50, now + 0.15);

        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.start(now);
        oscillator.stop(now + 0.2);
    }

    playSuccessSound() {
        if (!this.audioContext) return;

        const now = this.audioContext.currentTime;

        // Play ascending notes
        [440, 550, 660, 880].forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'sine';
            osc.frequency.value = freq;

            gain.gain.setValueAtTime(0, now + i * 0.1);
            gain.gain.linearRampToValueAtTime(0.15, now + i * 0.1 + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.3);

            osc.connect(gain);
            gain.connect(this.audioContext.destination);

            osc.start(now + i * 0.1);
            osc.stop(now + i * 0.1 + 0.3);
        });
    }

    updateParticles(deltaTime) {
        this._updateSparkParticles(deltaTime);
        this._updateEmberParticles();
        this._updateSmokeParticles();
        this._updateFireParticles();
        this._updateSteamParticles(deltaTime);
    }

    _updateSparkParticles(deltaTime) {
        if (!this.sparkSystem.active) return;

        const positions = this.sparkSystem.points.geometry.attributes.position.array;
        let allDead = true;

        for (let i = 0; i < this.sparkSystem.velocities.length; i++) {
            this._applyVelocityToParticle(positions, i, this.sparkSystem.velocities[i], deltaTime * 60);

            this.sparkSystem.velocities[i].y -= 0.015; // Enhanced gravity
            this.sparkSystem.velocities[i].multiplyScalar(0.98); // Air resistance
            this.sparkSystem.lifetimes[i] -= deltaTime;

            if (positions[i * 3 + 1] > 0 && this.sparkSystem.lifetimes[i] > 0) {
                allDead = false;
            }

            this._applyFloorBounce(positions, i, this.sparkSystem.velocities[i]);
        }

        this.sparkSystem.points.geometry.attributes.position.needsUpdate = true;
        this.sparkSystem.points.material.opacity *= 0.94;

        if (allDead || this.sparkSystem.points.material.opacity < 0.01) {
            this.sparkSystem.active = false;
        }
    }

    _updateEmberParticles() {
        if (!this.emberSystem) return;

        const positions = this.emberSystem.points.geometry.attributes.position.array;
        const time = Date.now() * 0.001;

        for (let i = 0; i < this.emberSystem.velocities.length; i++) {
            this._applyVelocityToParticle(positions, i, this.emberSystem.velocities[i]);

            positions[i * 3] += Math.sin(time + i) * 0.002; // Swirl motion
            positions[i * 3 + 2] += Math.cos(time + i) * 0.002;

            if (positions[i * 3 + 1] > 3.5) {
                this._resetEmberParticle(positions, i);
            }
        }

        this.emberSystem.points.geometry.attributes.position.needsUpdate = true;
        this.emberSystem.points.material.opacity = 0.6 + Math.sin(Date.now() * 0.003) * 0.2;
    }

    _updateSmokeParticles() {
        const positions = this.smokeSystem.points.geometry.attributes.position.array;

        for (let i = 0; i < this.smokeSystem.velocities.length; i++) {
            this._applyVelocityToParticle(positions, i, this.smokeSystem.velocities[i]);

            if (positions[i * 3 + 1] > 6) {
                this._resetSmokeParticle(positions, i);
            }
        }

        this.smokeSystem.points.geometry.attributes.position.needsUpdate = true;
    }

    _updateFireParticles() {
        const positions = this.fireSystem.geometry.attributes.position.array;

        for (let i = 0; i < positions.length / 3; i++) {
            positions[i * 3 + 1] += Math.random() * 0.02 + 0.01;
            positions[i * 3] += (Math.random() - 0.5) * 0.01;
            positions[i * 3 + 2] += (Math.random() - 0.5) * 0.01;

            if (positions[i * 3 + 1] > 1.8) {
                this._resetFireParticle(positions, i);
            }
        }

        this.fireSystem.geometry.attributes.position.needsUpdate = true;
    }

    _updateSteamParticles(deltaTime) {
        if (!this.steamSystem || !this.steamSystem.active) return;

        const positions = this.steamSystem.points.geometry.attributes.position.array;
        this.steamSystem.lifetime += deltaTime;

        for (let i = 0; i < this.steamSystem.velocities.length; i++) {
            this._applyVelocityToParticle(positions, i, this.steamSystem.velocities[i]);

            this.steamSystem.velocities[i].x *= 1.01; // Expansion
            this.steamSystem.velocities[i].z *= 1.01;
        }

        this.steamSystem.points.geometry.attributes.position.needsUpdate = true;
        this.steamSystem.points.material.opacity *= 0.97;

        if (this.steamSystem.lifetime > 3) {
            this.steamSystem.active = false;
            this.steamSystem.points.material.opacity = 0;
        }
    }

    _applyVelocityToParticle(positions, index, velocity, multiplier = 1) {
        positions[index * 3] += velocity.x * multiplier;
        positions[index * 3 + 1] += velocity.y * multiplier;
        positions[index * 3 + 2] += velocity.z * multiplier;
    }

    _applyFloorBounce(positions, index, velocity) {
        if (positions[index * 3 + 1] < 0.05) {
            velocity.y *= -0.4; // Bounce with energy loss
            positions[index * 3 + 1] = 0.05;
        }
    }

    _resetEmberParticle(positions, index) {
        positions[index * 3] = -2.5 + (Math.random() - 0.5) * 2;
        positions[index * 3 + 1] = 0.8;
        positions[index * 3 + 2] = -1.5 + (Math.random() - 0.5) * 2;
    }

    _resetSmokeParticle(positions, index) {
        const angle = (index / this.smokeSystem.velocities.length) * Math.PI * 2;
        positions[index * 3] = -2.5 + Math.cos(angle) * 0.2;
        positions[index * 3 + 1] = 2.5;
        positions[index * 3 + 2] = -1.5 + Math.sin(angle) * 0.2;
    }

    _resetFireParticle(positions, index) {
        positions[index * 3] = -2.5 + (Math.random() - 0.5) * 0.8;
        positions[index * 3 + 1] = 0.8;
        positions[index * 3 + 2] = -1.2 + (Math.random() - 0.5) * 0.5;
    }

    updateMetalTemperature(deltaTime) {
        if (this.isMetalInForge) {
            // Heat up metal in forge
            this.metalTemperature = Math.min(this.forgeTemperature, this.metalTemperature + 150 * deltaTime);
        } else {
            // Cool down metal in air
            const coolingRate = 25 * deltaTime;
            this.metalTemperature = Math.max(20, this.metalTemperature - coolingRate);
        }

        // Update held metal color based on temperature
        this.updateHeldMetalColor();
    }

    updateHeldMetalColor() {
        if (!this.heldMetal || !this.heldMetalMaterial) return;

        const temp = this.metalTemperature;
        let color;
        let emissiveColor;
        let emissiveIntensity = 0;
        let glowOpacity = 0;

        if (temp < 400) {
            color = new THREE.Color(0x8a8a8a);
            emissiveColor = new THREE.Color(0x000000);
        } else if (temp < 600) {
            color = new THREE.Color(0xcc6644);
            emissiveColor = new THREE.Color(0x661100);
            emissiveIntensity = (temp - 400) / 300;
            glowOpacity = 0.1;
        } else if (temp < 800) {
            color = new THREE.Color(0xff5533);
            emissiveColor = new THREE.Color(0xff2200);
            emissiveIntensity = 0.8 + (temp - 600) / 300;
            glowOpacity = 0.25;
        } else if (temp < 1000) {
            color = new THREE.Color(0xff7744);
            emissiveColor = new THREE.Color(0xff4400);
            emissiveIntensity = 1.5 + (temp - 800) / 300;
            glowOpacity = 0.4;
        } else {
            color = new THREE.Color(0xffbb66);
            emissiveColor = new THREE.Color(0xffaa00);
            emissiveIntensity = 2.5;
            glowOpacity = 0.55;
        }

        this.heldMetalMaterial.color = color;
        this.heldMetalMaterial.emissive = emissiveColor;
        this.heldMetalMaterial.emissiveIntensity = emissiveIntensity;

        // Update glow mesh
        if (this.metalGlowMesh && this.metalGlowMesh.material) {
            this.metalGlowMesh.material.opacity = glowOpacity;
            // Pulsing glow
            const pulse = Math.sin(Date.now() * 0.005) * 0.1;
            this.metalGlowMesh.material.opacity = Math.max(0, glowOpacity + pulse);
        }

        // Update left hand glow based on metal temp
        if (this.leftHandGlow && this.leftHandGlow.material) {
            this.leftHandGlow.material.opacity = glowOpacity * 0.5;
            this.leftHandGlow.material.color.setHex(temp > 800 ? 0xff6600 : 0xff4400);
        }

        // Update heat overlay when near forge
        if (this.heatOverlay) {
            const heatOpacity = this.nearForge ? 0.3 + (temp / 1200) * 0.4 : 0;
            this.heatOverlay.style.opacity = heatOpacity;
        }
    }

    updateUI() {
        // Modern useful HUD
        this.updateStatsPanel();
        this.updateEconomyPanel();
        this.updateActionHints();
        this.updateHeldItemsDisplay();
        this.updateCustomerQueue();
    }

    updateStatsPanel() {
        // Metal temperature bar
        const metalTempPercent = Math.min(100, (this.metalTemperature / 1500) * 100);
        const metalTempBar = document.getElementById('metalTempBar');
        const metalTempText = document.getElementById('metalTempText');

        if (metalTempBar && metalTempText) {
            metalTempBar.style.width = metalTempPercent + '%';
            metalTempText.textContent = Math.floor(this.metalTemperature) + '°C';

            // Color based on temperature
            if (this.metalTemperature >= 800 && this.metalTemperature <= 1100) {
                metalTempBar.style.background = 'linear-gradient(90deg, #00ff00, #88ff88, #00ff00)';
                metalTempBar.style.boxShadow = '0 0 15px rgba(0, 255, 0, 0.8)';
            } else if (this.metalTemperature >= 600) {
                metalTempBar.style.background = 'linear-gradient(90deg, #ffaa00, #ff6600, #ffaa00)';
                metalTempBar.style.boxShadow = '0 0 10px rgba(255, 170, 0, 0.6)';
            } else {
                metalTempBar.style.background = 'linear-gradient(90deg, #ff3300, #ff6600, #ffaa00)';
                metalTempBar.style.boxShadow = '0 0 10px rgba(255, 102, 0, 0.6)';
            }
        }

        // Quality bar
        const qualityBar = document.getElementById('qualityBar');
        const qualityText = document.getElementById('qualityText');

        if (qualityBar && qualityText) {
            qualityBar.style.width = Math.min(100, this.quality) + '%';
            qualityText.textContent = Math.floor(this.quality) + '%';
        }
    }

    updateEconomyPanel() {
        const moneyText = document.getElementById('moneyText');
        const reputationText = document.getElementById('reputationText');
        const weaponTypeText = document.getElementById('weaponTypeText');

        if (moneyText) {
            moneyText.textContent = '$' + this.money;
        }

        if (reputationText) {
            reputationText.textContent = 'Rep: ' + this.reputation;
        }

        if (weaponTypeText) {
            const weaponName = this.weaponTypes[this.currentWeaponType]?.name || 'Sword';
            weaponTypeText.textContent = weaponName;
        }
    }

    updateActionHints() {
        const actionHint = document.getElementById('actionHint');
        if (!actionHint) return;

        let hint = '';

        if (this.nearbyItems.length > 0 && !this.heldItemRight) {
            hint = `Press F to pickup ${this.nearbyItems[0].userData.type}`;
        } else if (this.nearForge && !this.isMetalInForge) {
            hint = 'Press E to heat metal in forge';
        } else if (this.nearAnvil && this.heldItemRight?.userData.type === 'hammer') {
            hint = 'Move mouse UP then DOWN to swing hammer';
        } else if (this.nearWater && this.metalTemperature > 400) {
            hint = 'Press Q to quench metal';
        } else if (this.quality >= 80) {
            hint = 'Weapon ready! Press R to finish or keep improving';
        }

        actionHint.textContent = hint;
        actionHint.style.display = hint ? 'block' : 'none';
    }

    updateHeldItemsDisplay() {
        const rightHandItem = document.getElementById('rightHandItem');
        const leftHandItem = document.getElementById('leftHandItem');
        const rightHandSlot = document.getElementById('rightHandSlot');
        const leftHandSlot = document.getElementById('leftHandSlot');

        if (rightHandItem) {
            if (this.heldItemRight) {
                rightHandItem.textContent = this.heldItemRight.userData.type.charAt(0).toUpperCase() +
                                           this.heldItemRight.userData.type.slice(1);
                rightHandSlot?.classList.add('has-item');
            } else {
                rightHandItem.textContent = 'Empty';
                rightHandSlot?.classList.remove('has-item');
            }
        }

        if (leftHandItem) {
            if (this.heldItemLeft) {
                leftHandItem.textContent = this.heldItemLeft.userData.type.charAt(0).toUpperCase() +
                                          this.heldItemLeft.userData.type.slice(1);
                leftHandSlot?.classList.add('has-item');
            } else {
                leftHandItem.textContent = 'Empty';
                leftHandSlot?.classList.remove('has-item');
            }
        }
    }

    updateCustomerQueue() {
        const customerQueue = document.getElementById('customer-queue');
        if (!customerQueue) return;

        customerQueue.innerHTML = '';

        this.customers.forEach(customer => {
            const card = document.createElement('div');
            card.className = 'customer-card';

            const patiencePercent = (customer.patience / (customer.patience + 30)) * 100;

            card.innerHTML = `
                <div class="customer-name">👤 ${customer.name}</div>
                <div class="customer-request">Wants: ${customer.desiredWeapon}</div>
                <div class="customer-request">Min Quality: ${Math.floor(customer.minQuality)}%</div>
                <div class="customer-patience">
                    <div class="patience-bar">
                        <div class="patience-fill" style="width: ${patiencePercent}%"></div>
                    </div>
                    <span class="patience-text">${Math.floor(customer.patience)}s</span>
                </div>
            `;

            customerQueue.appendChild(card);
        });
    }

    updateHammerSwing(deltaTime) {
        if (!this.isHammerSwinging) return;

        const hammer = this.heldItemRight;
        if (!hammer || hammer.userData.type !== 'hammer') return;

        const swingDuration = 0.25; // Faster swing
        this.hammerSwingProgress += deltaTime / swingDuration;

        // Store initial rotation if not set
        if (!hammer.userData.restRotation) {
            hammer.userData.restRotation = hammer.rotation.clone();
        }

        if (this.hammerSwingProgress >= 1) {
            // End of swing - reset
            hammer.rotation.copy(hammer.userData.restRotation);
            hammer.position.y = hammer.userData.holdOffset.y;
            this.rightHand.position.y = -0.35;
            this.rightHand.position.z = -0.45;
            this.isHammerSwinging = false;
            this.hammerSwingProgress = 0;
        } else {
            const progress = this.hammerSwingProgress;

            if (progress < 0.3) {
                // Wind up - raise hammer back
                const windupProgress = progress / 0.3;
                const easeOut = 1 - Math.pow(1 - windupProgress, 3); // Ease out cubic

                hammer.rotation.x = hammer.userData.restRotation.x - easeOut * 1.0;
                hammer.rotation.z = easeOut * -0.3; // Slight twist
                this.rightHand.position.y = -0.35 + easeOut * 0.2;
                this.rightHand.position.z = -0.45 - easeOut * 0.1; // Pull back
                this.rightHand.rotation.z = easeOut * -0.15; // Shoulder rotation

            } else if (progress < 0.6) {
                // Strike down - POWER!
                const strikeProgress = (progress - 0.3) / 0.3;
                const easeIn = strikeProgress * strikeProgress * strikeProgress; // Ease in cubic (fast)

                hammer.rotation.x = hammer.userData.restRotation.x - 1.0 + easeIn * 2.2;
                hammer.rotation.z = -0.3 + easeIn * 0.5; // Twist back
                this.rightHand.position.y = -0.35 + 0.2 - easeIn * 0.35; // Slam down
                this.rightHand.position.z = -0.45 - 0.1 + easeIn * 0.15; // Forward thrust
                this.rightHand.rotation.z = -0.15 + easeIn * 0.25; // Follow through

                // Check for hit at middle of strike
                if (strikeProgress > 0.4 && strikeProgress < 0.6 && !this.hasHitThisSwing) {
                    this.checkHammerHit();
                }

                // Add impact recoil when hitting
                if (this.hasHitThisSwing && strikeProgress > 0.5) {
                    const recoil = Math.sin((strikeProgress - 0.5) * 20) * 0.02;
                    hammer.position.y = hammer.userData.holdOffset.y + recoil;
                    hammer.rotation.x += recoil;
                }

            } else {
                // Return to rest position
                const returnProgress = (progress - 0.6) / 0.4;
                const easeOut = 1 - Math.pow(1 - returnProgress, 2); // Ease out quad

                hammer.rotation.x = hammer.userData.restRotation.x + 1.2 - easeOut * 1.2;
                hammer.rotation.z = 0.2 - easeOut * 0.2;
                this.rightHand.position.y = -0.4 - 0.15 + easeOut * 0.15;
                this.rightHand.position.z = -0.5 + 0.05 - easeOut * 0.05;
                this.rightHand.rotation.z = 0.1 - easeOut * 0.1;
            }
        }
    }

    updateHandAnimation(deltaTime) {
        if (this.isVR || !this.handsGroup) return;

        this.handBobTime += deltaTime;

        // VR-STYLE HAND PHYSICS FOR DESKTOP

        // 1. Finger curl animation (when clicking/gripping)
        this.fingerCurlProgress += (this.targetFingerCurl - this.fingerCurlProgress) * 8 * deltaTime;

        // Animate right hand fingers
        if (this.rightHand && this.rightHand.userData.fingers) {
            this.rightHand.userData.fingers.forEach((finger, index) => {
                const baseRot = finger.userData.baseRotation;
                const curlAmount = this.fingerCurlProgress * (index === 4 ? 0.3 : 0.5); // Thumb curls less
                finger.rotation.x = baseRot.x + curlAmount;
            });
        }

        // Animate left hand fingers
        if (this.leftHand && this.leftHand.userData.fingers) {
            this.leftHand.userData.fingers.forEach((finger, index) => {
                const baseRot = finger.userData.baseRotation;
                const curlAmount = this.fingerCurlProgress * (index === 4 ? 0.3 : 0.4); // Always slightly gripping tongs
                finger.rotation.x = baseRot.x + 0.2 + curlAmount;
            });
        }

        // 2. Mouse-based hand tracking (IK-style)
        const mouseInfluence = 5 * deltaTime;
        this.handSway.x += (this.mouseTargetPos.x - this.handSway.x) * mouseInfluence;
        this.handSway.y += (this.mouseTargetPos.y - this.handSway.y) * mouseInfluence;

        // 3. Movement-based hand sway (when walking)
        const velocity = new THREE.Vector3(
            this.keys['w'] || this.keys['s'] ? 1 : 0,
            0,
            this.keys['a'] || this.keys['d'] ? 1 : 0
        );
        const movementIntensity = velocity.length();

        // 4. Idle bob animation (breathing)
        const bobAmount = 0.005;
        const bobSpeed = 2;
        const bobY = Math.sin(this.handBobTime * bobSpeed) * bobAmount;
        const bobX = Math.cos(this.handBobTime * bobSpeed * 0.7) * bobAmount * 0.5;

        // 5. Walking sway
        const walkSwayAmount = 0.02;
        const walkBob = Math.sin(this.handBobTime * 6) * movementIntensity * walkSwayAmount;
        const walkSwayX = Math.cos(this.handBobTime * 6) * movementIntensity * walkSwayAmount * 0.7;

        if (!this.isHammerSwinging) {
            // RIGHT HAND (Hammer) - more dramatic movement
            this.rightHand.position.y = -0.4 + bobY + walkBob * 1.5 + this.handSway.y;
            this.rightHand.position.x = 0.35 + bobX + walkSwayX + this.handSway.x * 0.8;
            this.rightHand.position.z = -0.5 + this.handSway.y * 0.5;

            // Rotate hand based on mouse movement (aiming)
            this.rightHand.rotation.y = -0.3 + this.handSway.x * 0.5;
            this.rightHand.rotation.x = this.handSway.y * 0.3;
            this.rightHand.rotation.z = Math.sin(this.handBobTime * 1.5) * 0.01 + walkSwayX * 0.5;

            // LEFT HAND (Tongs with metal) - steadier, holding metal carefully
            this.leftHand.position.y = -0.45 + bobY * 0.8 + walkBob - this.handSway.y * 0.3;
            this.leftHand.position.x = -0.35 - bobX + walkSwayX * 0.5 - this.handSway.x * 0.6;
            this.leftHand.position.z = -0.5 - this.handSway.y * 0.3;

            this.leftHand.rotation.y = 0.3 - this.handSway.x * 0.3;
            this.leftHand.rotation.x = -this.handSway.y * 0.2;
            this.leftHand.rotation.z = Math.sin(this.handBobTime * 1.5) * 0.01 - walkSwayX * 0.3;
        }

        // 6. Breathing motion
        const breatheAmount = Math.sin(this.handBobTime * 1.2) * 0.002;
        this.handsGroup.position.y = breatheAmount;
    }

    updateProximityChecks() {
        const playerPos = this.cameraPosition;

        // Check forge proximity
        if (this.forge && this.forge.position) {
            const forgeDistance = new THREE.Vector2(
                playerPos.x - this.forge.position.x,
                playerPos.z - this.forge.position.z
            ).length();
            this.nearForge = forgeDistance < 2.5;
        } else {
            this.nearForge = false;
        }

        // Check anvil proximity
        if (this.anvil && this.anvil.position) {
            const anvilDistance = new THREE.Vector2(
                playerPos.x - this.anvil.position.x,
                playerPos.z - this.anvil.position.z
            ).length();
            this.nearAnvil = anvilDistance < 1.8;
        } else {
            this.nearAnvil = false;
        }

        // Check water proximity
        if (this.waterBarrel && this.waterBarrel.position) {
            const waterDistance = new THREE.Vector2(
                playerPos.x - this.waterBarrel.position.x,
                playerPos.z - this.waterBarrel.position.z
            ).length();
            this.nearWater = waterDistance < 2;
        } else {
            this.nearWater = false;
        }

        // Update interaction indicators
        this.updateIndicator(this.forge, this.nearForge);
        this.updateIndicator(this.anvil, this.nearAnvil);
        this.updateIndicator(this.waterBarrel, this.nearWater);
    }

    updateIndicator(object, isNear) {
        if (object && object.userData && object.userData.indicator) {
            const indicator = object.userData.indicator;
            const targetOpacity = isNear ? 0.9 : 0;
            indicator.material.opacity += (targetOpacity - indicator.material.opacity) * 0.1;
        }
    }

    updateCamera(deltaTime) {
        if (this.isVR) return;

        // Keyboard camera movement
        const moveSpeed = 3 * deltaTime;
        const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraRotation.y);
        const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraRotation.y);

        let moved = false;

        if (this.keys['w'] || this.keys['arrowup']) {
            this.cameraPosition.add(forward.clone().multiplyScalar(moveSpeed));
            moved = true;
        }
        if (this.keys['s'] || this.keys['arrowdown']) {
            this.cameraPosition.add(forward.clone().multiplyScalar(-moveSpeed));
            moved = true;
        }
        if (this.keys['a'] || this.keys['arrowleft']) {
            this.cameraPosition.add(right.clone().multiplyScalar(-moveSpeed));
            moved = true;
        }
        if (this.keys['d'] || this.keys['arrowright']) {
            this.cameraPosition.add(right.clone().multiplyScalar(moveSpeed));
            moved = true;
        }

        // Apply camera bounds
        this.cameraPosition.x = Math.max(this.cameraBounds.minX, Math.min(this.cameraBounds.maxX, this.cameraPosition.x));
        this.cameraPosition.z = Math.max(this.cameraBounds.minZ, Math.min(this.cameraBounds.maxZ, this.cameraPosition.z));

        // Apply DRAMATIC screen shake (decays over time)
        if (this.screenShake.intensity > 0) {
            this.screenShake.intensity *= 0.88; // Slightly slower decay for more impact
            if (this.screenShake.intensity < 0.0005) {
                this.screenShake.intensity = 0;
                this.screenShake.x = 0;
                this.screenShake.y = 0;
            } else {
                // Dramatic high-frequency shake
                const freq = 25; // High frequency shake
                const time = Date.now() * 0.001;
                this.screenShake.x = Math.sin(time * freq) * this.screenShake.intensity;
                this.screenShake.y = Math.cos(time * freq * 1.3) * this.screenShake.intensity * 0.7;
                // Add random noise
                this.screenShake.x += (Math.random() - 0.5) * this.screenShake.intensity * 0.3;
                this.screenShake.y += (Math.random() - 0.5) * this.screenShake.intensity * 0.2;
            }
        }

        // Apply camera position and rotation with screen shake
        this.camera.position.copy(this.cameraPosition);
        this.camera.rotation.y = this.cameraRotation.y + this.screenShake.x;
        this.camera.rotation.x = this.cameraRotation.x + this.screenShake.y;
    }

    animate() {
        this.renderer.setAnimationLoop(() => {
            const deltaTime = Math.min(this.clock.getDelta(), 0.1);

            this.updateMetalTemperature(deltaTime);
            this.updateParticles(deltaTime);
            this.updateHammerSwing(deltaTime);
            this.updateHandAnimation(deltaTime);
            this.updateProximityChecks();
            this.updateCamera(deltaTime);
            this.updateUI();
            this.updateVisualEffects(deltaTime);

            // NEW SYSTEMS
            this.updateNearbyItems();
            this.updateCustomers(deltaTime);

            // MASSIVELY ENHANCED forge light flickering
            const time = Date.now() * 0.001;
            const flicker1 = Math.sin(time * 3.7) * 0.6;
            const flicker2 = Math.sin(time * 7.3) * 0.4;
            const flicker3 = Math.sin(time * 11.1) * 0.25;
            const flicker4 = Math.sin(time * 2.1) * 0.5;
            const flicker5 = Math.sin(time * 17.3) * 0.2;

            this.forgeLight.intensity = 8 + flicker1 + flicker2 + flicker3 + flicker5;

            // Secondary forge light flickers differently
            if (this.forgeLightSecondary) {
                this.forgeLightSecondary.intensity = 4 + flicker2 * 2 + flicker4;
            }

            // Tertiary forge light
            if (this.forgeLightTertiary) {
                this.forgeLightTertiary.intensity = 2 + flicker3 * 3 + flicker1 * 0.5;
            }

            // Animate forge opening emissive with complex pattern
            if (this.forgeOpening) {
                this.forgeOpening.material.emissiveIntensity = 2.5 + flicker1 * 0.8 + flicker3;
                const heatPulse = (Math.sin(time * 0.5) + 1) * 0.5;
                this.forgeOpening.material.emissive.setHSL(0.05 + heatPulse * 0.03, 1, 0.5);
            }

            // Animate forge glow sphere
            if (this.forgeGlowSphere && this.forgeGlowSphere.material) {
                this.forgeGlowSphere.material.opacity = 0.12 + flicker1 * 0.04;
                this.forgeGlowSphere.scale.setScalar(1 + flicker2 * 0.1);
            }

            // Decay anvil light back to normal after impact
            if (this.anvilLight && this.anvilLight.intensity > 3) {
                this.anvilLight.intensity = Math.max(3, this.anvilLight.intensity * 0.9);
            }

            // Fade impact flash
            if (this.impactFlashMesh && this.impactFlashMesh.material && this.impactFlashMesh.material.opacity > 0) {
                this.impactFlashMesh.material.opacity *= 0.85;
            }

            // Update hand light to follow camera
            if (this.handLight) {
                this.handLight.position.copy(this.camera.position);
                this.handLight.position.y -= 0.3;
                // Intensify near forge
                this.handLight.intensity = this.nearForge ? 0.5 : 0.2;
            }

            // Water light subtle ripple
            if (this.waterLight) {
                this.waterLight.intensity = 0.8 + Math.sin(time * 2) * 0.2;
            }

            this.renderer.render(this.scene, this.camera);
        });
    }

    updateVisualEffects(deltaTime) {
        // Update right hand glow based on proximity to anvil
        if (this.rightHandGlow && this.rightHandGlow.material) {
            const targetOpacity = this.nearAnvil ? 0.25 : 0;
            this.rightHandGlow.material.opacity += (targetOpacity - this.rightHandGlow.material.opacity) * 5 * deltaTime;
            // Pulse effect when near anvil
            if (this.nearAnvil) {
                this.grabPulse += deltaTime * 4;
                this.rightHandGlow.material.opacity += Math.sin(this.grabPulse) * 0.1;
            }
        }

        // Dynamic vignette based on action
        if (this.vignetteOverlay) {
            let vignette = 'radial-gradient(ellipse at center, transparent 0%, transparent 40%,';
            if (this.nearForge) {
                vignette += ' rgba(255,50,0,0.2) 70%, rgba(100,20,0,0.5) 100%)';
            } else if (this.nearWater) {
                vignette += ' rgba(0,50,100,0.15) 70%, rgba(0,20,50,0.4) 100%)';
            } else {
                vignette += ' rgba(0,0,0,0.3) 80%, rgba(0,0,0,0.6) 100%)';
            }
            this.vignetteOverlay.style.background = vignette;
        }
    }

    // ===== NEW GAME SYSTEMS =====

    // MOUSE SWING MECHANICS - Swing by moving mouse up then down
    updateMouseSwing(movementY) {
        if (!this.heldItemRight || this.heldItemRight.userData.type !== 'hammer') return;

        if (this.mouseSwingState === 'idle' && movementY < -5) {
            // Moving mouse up - start charging
            this.mouseSwingState = 'charging';
            this.swingStartY = Date.now();
            this.swingPower = 0;
        } else if (this.mouseSwingState === 'charging' && movementY > 5) {
            // Moving mouse down - execute swing
            this.mouseSwingState = 'swinging';
            this.swingPower = Math.min(100, (Date.now() - this.swingStartY) / 10);
            this.executeHammerSwing(this.swingPower);
            setTimeout(() => {
                this.mouseSwingState = 'idle';
            }, 500);
        }
    }

    executeHammerSwing(power) {
        if (!this.heldItemRight) return;

        this.isHammerSwinging = true;
        this.hammerSwingProgress = 0;
        this.hasHitThisSwing = false;

        // Stronger swing with more power
        const powerMultiplier = 0.5 + (power / 100);
        this.showMessage(`Swing Power: ${Math.floor(power)}%`);

        // Check if hitting metal
        setTimeout(() => {
            if (this.nearAnvil && this.metal && this.metal.visible) {
                this.onMetalStrike(powerMultiplier);
            }
        }, 200);
    }

    // ITEM PICKUP SYSTEM
    updateNearbyItems() {
        this.nearbyItems = [];
        if (!this.rightHand) return;

        const handPos = new THREE.Vector3();
        this.rightHand.getWorldPosition(handPos);

        this.pickupableItems.forEach(item => {
            const dist = handPos.distanceTo(item.position);
            if (dist < 0.8) {
                this.nearbyItems.push(item);
            }
        });
    }

    togglePickup() {
        if (this.heldItemRight) {
            this.dropItem('right');
        } else if (this.nearbyItems.length > 0) {
            this.pickupItem(this.nearbyItems[0], 'right');
        }
    }

    pickupItem(item, hand) {
        if (!item || !item.userData.pickupable) return;

        const handObj = hand === 'right' ? this.rightHand : this.leftHand;

        // Remove from world
        this.scene.remove(item);

        // Attach to hand
        item.position.copy(item.userData.holdOffset || new THREE.Vector3(0, -0.2, -0.1));
        item.rotation.set(-Math.PI / 4, 0, 0);
        handObj.add(item);

        if (hand === 'right') {
            this.heldItemRight = item;
        } else {
            this.heldItemLeft = item;
        }

        this.showMessage(`Picked up ${item.userData.type}`);
        this.targetFingerCurl = 0.7; // Curl fingers to hold item
    }

    dropItem(hand = 'right') {
        const item = hand === 'right' ? this.heldItemRight : this.heldItemLeft;
        if (!item) return;

        const handObj = hand === 'right' ? this.rightHand : this.leftHand;

        // Get world position
        const worldPos = new THREE.Vector3();
        item.getWorldPosition(worldPos);

        // Remove from hand
        handObj.remove(item);

        // Add back to world
        item.position.copy(worldPos);
        item.rotation.set(0, 0, Math.PI / 2);
        this.scene.add(item);

        if (hand === 'right') {
            this.heldItemRight = null;
        } else {
            this.heldItemLeft = null;
        }

        this.showMessage(`Dropped ${item.userData.type}`);
        this.targetFingerCurl = 0;
    }

    // WEAPON TYPE SYSTEM
    createWeapon(type) {
        const weaponDef = this.weaponTypes[type];
        if (!weaponDef) return null;

        const weapon = {
            type: type,
            name: weaponDef.name,
            quality: this.quality,
            strikes: this.hammerStrikes,
            price: this.calculateWeaponPrice(type, this.quality),
            timestamp: Date.now()
        };

        this.finishedWeapons.push(weapon);
        this.showMessage(`${weaponDef.name} completed! Quality: ${Math.floor(this.quality)}% - Worth $${weapon.price}`);

        return weapon;
    }

    calculateWeaponPrice(type, quality) {
        const weaponDef = this.weaponTypes[type];
        const basePrice = weaponDef.basePrice;
        const qualityMultiplier = 0.5 + (quality / 100) * 1.5; // 0.5x to 2x based on quality
        const reputationBonus = 1 + (this.reputation / 100) * 0.5; // Up to 50% bonus
        return Math.floor(basePrice * qualityMultiplier * reputationBonus);
    }

    // CUSTOMER SYSTEM
    spawnCustomer() {
        if (this.customers.length >= 3) return; // Max 3 customers

        const customer = {
            id: Date.now(),
            name: this.generateCustomerName(),
            desiredWeapon: this.getRandomWeaponType(),
            minQuality: 30 + Math.random() * 40,
            patience: 30 + Math.random() * 30, // seconds
            position: new THREE.Vector3(-3, 0, 2 + this.customers.length * 1.5),
            model: this.createCustomerModel()
        };

        customer.model.position.copy(customer.position);
        this.scene.add(customer.model);
        this.customers.push(customer);

        this.showMessage(`${customer.name} wants a ${customer.desiredWeapon}!`);
    }

    generateCustomerName() {
        const names = ['Aldric', 'Brom', 'Cedric', 'Darius', 'Eldrin', 'Finn', 'Gareth', 'Haldor'];
        return names[Math.floor(Math.random() * names.length)];
    }

    getRandomWeaponType() {
        const types = Object.keys(this.weaponTypes);
        return types[Math.floor(Math.random() * types.length)];
    }

    createCustomerModel() {
        const customerGroup = new THREE.Group();

        // Simple body
        const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.35, 1.5, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a3520,
            roughness: 0.8
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.75;
        body.castShadow = true;
        customerGroup.add(body);

        // Head
        const headGeometry = new THREE.SphereGeometry(0.25, 8, 8);
        const headMaterial = new THREE.MeshStandardMaterial({
            color: 0xffccaa,
            roughness: 0.6
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.65;
        head.castShadow = true;
        customerGroup.add(head);

        return customerGroup;
    }

    updateCustomers(deltaTime) {
        // Iterate backwards to safely remove customers
        for (let i = this.customers.length - 1; i >= 0; i--) {
            const customer = this.customers[i];
            customer.patience -= deltaTime;

            if (customer.patience <= 0) {
                // Customer leaves
                this.scene.remove(customer.model);
                this.customers.splice(i, 1);
                this.showMessage(`${customer.name} left impatiently!`);
                this.reputation = Math.max(0, this.reputation - 5);
            }
        }

        // Spawn new customers
        this.nextCustomerTime -= deltaTime;
        if (this.nextCustomerTime <= 0 && this.shopOpen) {
            this.spawnCustomer();
            this.nextCustomerTime = 15 + Math.random() * 15; // Every 15-30 seconds
        }
    }

    // SELLING SYSTEM
    toggleShop() {
        this.shopOpen = !this.shopOpen;
        this.showMessage(this.shopOpen ? 'Shop OPEN - Customers will arrive!' : 'Shop CLOSED');

        if (this.shopOpen && this.customers.length === 0) {
            this.spawnCustomer();
            this.nextCustomerTime = 10;
        }
    }

    sellWeapon(weapon, customer) {
        if (!weapon || !customer) return;

        const weaponDef = this.weaponTypes[weapon.type];

        // Check if weapon matches request
        if (weapon.type !== customer.desiredWeapon) {
            this.showMessage(`${customer.name}: That's not what I ordered!`);
            return;
        }

        // Check quality
        if (weapon.quality < customer.minQuality) {
            this.showMessage(`${customer.name}: This quality is too low!`);
            this.reputation = Math.max(0, this.reputation - 10);
            return;
        }

        // Successful sale!
        const salePrice = weapon.price;
        this.money += salePrice;
        this.reputation += 5;

        // Remove weapon and customer
        const weaponIndex = this.finishedWeapons.indexOf(weapon);
        if (weaponIndex > -1) {
            this.finishedWeapons.splice(weaponIndex, 1);
        }

        const customerIndex = this.customers.indexOf(customer);
        if (customerIndex > -1) {
            this.scene.remove(customer.model);
            this.customers.splice(customerIndex, 1);
        }

        this.showMessage(`Sold ${weapon.name} for $${salePrice}! Total: $${this.money}`);
    }

    // AUTO-SELL when weapon completed (simplified for now)
    completeForgingAndSell() {
        const weapon = this.createWeapon(this.currentWeaponType);
        if (!weapon) return;

        // Auto-sell to first customer if available
        if (this.customers.length > 0) {
            const customer = this.customers[0];
            this.sellWeapon(weapon, customer);
        }
    }
}

// Initialize game when page loads
window.addEventListener('DOMContentLoaded', () => {
    const game = new ForgingGame();
    window.game = game; // For debugging
});
