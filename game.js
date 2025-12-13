// Immersive 3D Forging Game with VR Support
// Main Game Engine - Completely Revamped with First-Person Hands

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

        // First-person hands
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

        // Interaction states
        this.nearForge = false;
        this.nearAnvil = false;
        this.nearWater = false;
        this.interactionTarget = null;

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

        // Hand animation
        this.handBobTime = 0;
        this.targetHandRotation = { x: 0, y: 0 };
        this.handSway = { x: 0, y: 0 };
        this.mouseTargetPos = { x: 0, y: 0 };

        // VR-style hand physics for desktop
        this.rightHandFingers = [];
        this.leftHandFingers = [];
        this.fingerCurlProgress = 0;
        this.targetFingerCurl = 0;

        // Screen shake
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
        this.hideLoadingScreen();
        this.animate();
    }

    setupScene() {
        this.scene = new THREE.Scene();
        // DARKER, more atmospheric background
        this.scene.background = new THREE.Color(0x0a0500);
        // Denser fog for more mystery and depth
        this.scene.fog = new THREE.Fog(0x0a0500, 3, 15);
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
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap at 2x for performance

        // ENHANCED rendering settings for better visuals
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Soft shadows

        // Tone mapping for more realistic lighting (HDR-like)
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2; // Slightly brighter

        // Enable physically correct lighting
        this.renderer.physicallyCorrectLights = true;

        this.renderer.xr.enabled = true;
        document.getElementById('game-container').appendChild(this.renderer.domElement);
    }

    setupLights() {
        // ENHANCED LIGHTING - Much more dramatic!

        // Lower ambient light for more contrast
        const ambientLight = new THREE.AmbientLight(0x201510, 0.25);
        this.scene.add(ambientLight);

        // MAIN: Forge light (intense orange/red glow) - THE STAR!
        const forgeLight = new THREE.PointLight(0xff3300, 4.5, 12);
        forgeLight.position.set(-2.5, 1.2, -1.2);
        forgeLight.castShadow = true;
        forgeLight.shadow.mapSize.width = 2048;
        forgeLight.shadow.mapSize.height = 2048;
        forgeLight.shadow.bias = -0.001;
        this.scene.add(forgeLight);
        this.forgeLight = forgeLight;

        // Secondary forge light (for better glow around opening)
        const forgeLightSecondary = new THREE.PointLight(0xff5500, 2, 5);
        forgeLightSecondary.position.set(-2.5, 0.9, -0.8);
        this.scene.add(forgeLightSecondary);
        this.forgeLightSecondary = forgeLightSecondary;

        // Anvil spotlight - focused task lighting
        const anvilLight = new THREE.SpotLight(0xffd9aa, 1.5);
        anvilLight.position.set(0.5, 3.5, 0.5);
        anvilLight.target.position.set(0, 1, 0);
        anvilLight.angle = Math.PI / 8;
        anvilLight.penumbra = 0.6;
        anvilLight.decay = 2;
        anvilLight.castShadow = true;
        anvilLight.shadow.mapSize.width = 2048;
        anvilLight.shadow.mapSize.height = 2048;
        this.scene.add(anvilLight);
        this.scene.add(anvilLight.target);

        // Dim overhead fill light (softer)
        const overheadLight = new THREE.DirectionalLight(0x443322, 0.3);
        overheadLight.position.set(2, 5, 3);
        overheadLight.castShadow = true;
        overheadLight.shadow.mapSize.width = 2048;
        overheadLight.shadow.mapSize.height = 2048;
        overheadLight.shadow.camera.left = -8;
        overheadLight.shadow.camera.right = 8;
        overheadLight.shadow.camera.top = 8;
        overheadLight.shadow.camera.bottom = -8;
        this.scene.add(overheadLight);

        // Rim light (backlight for depth)
        const rimLight = new THREE.DirectionalLight(0x6688ff, 0.2);
        rimLight.position.set(-3, 2, -5);
        this.scene.add(rimLight);
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

        // Create right hand (holding hammer)
        this.rightHand = this.createHand('right');
        this.rightHand.position.set(0.35, -0.4, -0.5);
        this.rightHand.rotation.set(0, -0.3, 0);
        this.handsGroup.add(this.rightHand);

        // Create left hand (holding tongs with metal)
        this.leftHand = this.createHand('left');
        this.leftHand.position.set(-0.35, -0.45, -0.5);
        this.leftHand.rotation.set(0, 0.3, 0);
        this.handsGroup.add(this.leftHand);

        // Create hammer attached to right hand
        this.createHandHammer();

        // Create tongs attached to left hand
        this.createHandTongs();

        // Create held metal (attached to tongs)
        this.createHeldMetal();
    }

    createHand(side) {
        const handGroup = new THREE.Group();
        const skinColor = 0xffdbac;
        const skinMaterial = new THREE.MeshStandardMaterial({
            color: skinColor,
            roughness: 0.7,
            metalness: 0.1
        });

        // Palm
        const palmGeometry = new THREE.BoxGeometry(0.08, 0.1, 0.12);
        const palm = new THREE.Mesh(palmGeometry, skinMaterial);
        palm.castShadow = true;
        handGroup.add(palm);

        // Fingers - store references for animation
        const fingerGeometry = new THREE.CylinderGeometry(0.012, 0.01, 0.08, 8);
        const fingerPositions = [
            { x: -0.028, z: -0.08 },
            { x: -0.009, z: -0.09 },
            { x: 0.009, z: -0.09 },
            { x: 0.028, z: -0.08 }
        ];

        const fingers = [];
        fingerPositions.forEach((pos, index) => {
            const finger = new THREE.Mesh(fingerGeometry, skinMaterial);
            finger.position.set(pos.x, 0, pos.z);
            finger.rotation.x = Math.PI / 2 - 0.4; // Slightly curved
            finger.castShadow = true;
            finger.userData.baseRotation = finger.rotation.clone();
            fingers.push(finger);
            handGroup.add(finger);
        });

        // Thumb
        const thumbGeometry = new THREE.CylinderGeometry(0.014, 0.012, 0.06, 8);
        const thumb = new THREE.Mesh(thumbGeometry, skinMaterial);
        const thumbX = side === 'right' ? 0.05 : -0.05;
        thumb.position.set(thumbX, 0, -0.02);
        thumb.rotation.set(Math.PI / 2, side === 'right' ? 0.5 : -0.5, 0);
        thumb.castShadow = true;
        thumb.userData.baseRotation = thumb.rotation.clone();
        fingers.push(thumb);
        handGroup.add(thumb);

        // Store finger references
        handGroup.userData.fingers = fingers;

        // Wrist/Arm stub
        const wristGeometry = new THREE.CylinderGeometry(0.035, 0.04, 0.15, 8);
        const wrist = new THREE.Mesh(wristGeometry, skinMaterial);
        wrist.position.set(0, 0.02, 0.1);
        wrist.rotation.x = Math.PI / 2;
        wrist.castShadow = true;
        handGroup.add(wrist);

        // Sleeve
        const sleeveGeometry = new THREE.CylinderGeometry(0.045, 0.05, 0.1, 8);
        const sleeveMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a3525,
            roughness: 0.9
        });
        const sleeve = new THREE.Mesh(sleeveGeometry, sleeveMaterial);
        sleeve.position.set(0, 0.02, 0.18);
        sleeve.rotation.x = Math.PI / 2;
        sleeve.castShadow = true;
        handGroup.add(sleeve);

        return handGroup;
    }

    createHandHammer() {
        const hammerGroup = new THREE.Group();

        // Hammer head
        const headGeometry = new THREE.BoxGeometry(0.1, 0.07, 0.15);
        const hammerMaterial = new THREE.MeshStandardMaterial({
            color: 0x555555,
            roughness: 0.3,
            metalness: 0.9
        });
        const head = new THREE.Mesh(headGeometry, hammerMaterial);
        head.castShadow = true;
        hammerGroup.add(head);

        // Hammer handle
        const handleGeometry = new THREE.CylinderGeometry(0.015, 0.018, 0.35, 8);
        const handleMaterial = new THREE.MeshStandardMaterial({
            color: 0x654321,
            roughness: 0.7
        });
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.position.y = 0.2;
        handle.castShadow = true;
        hammerGroup.add(handle);

        // Position hammer in right hand
        hammerGroup.position.set(0, -0.08, -0.1);
        hammerGroup.rotation.x = -Math.PI / 4;
        this.rightHand.add(hammerGroup);
        this.handHammer = hammerGroup;

        // Store initial rotation for animation
        this.hammerRestRotation = hammerGroup.rotation.clone();
    }

    createHandTongs() {
        const tongsGroup = new THREE.Group();
        const tongsMaterial = new THREE.MeshStandardMaterial({
            color: 0x444444,
            roughness: 0.4,
            metalness: 0.8
        });

        // Left arm of tongs
        const armGeometry = new THREE.BoxGeometry(0.015, 0.25, 0.02);
        const leftArm = new THREE.Mesh(armGeometry, tongsMaterial);
        leftArm.position.set(-0.015, -0.1, 0);
        leftArm.rotation.z = 0.1;
        leftArm.castShadow = true;
        tongsGroup.add(leftArm);

        // Right arm of tongs
        const rightArm = new THREE.Mesh(armGeometry, tongsMaterial);
        rightArm.position.set(0.015, -0.1, 0);
        rightArm.rotation.z = -0.1;
        rightArm.castShadow = true;
        tongsGroup.add(rightArm);

        // Pivot joint
        const pivotGeometry = new THREE.CylinderGeometry(0.015, 0.015, 0.03, 8);
        const pivot = new THREE.Mesh(pivotGeometry, tongsMaterial);
        pivot.rotation.x = Math.PI / 2;
        pivot.castShadow = true;
        tongsGroup.add(pivot);

        // Gripping ends
        const gripGeometry = new THREE.BoxGeometry(0.025, 0.08, 0.02);
        const leftGrip = new THREE.Mesh(gripGeometry, tongsMaterial);
        leftGrip.position.set(-0.022, -0.26, 0);
        leftGrip.rotation.z = 0.2;
        leftGrip.castShadow = true;
        tongsGroup.add(leftGrip);

        const rightGrip = new THREE.Mesh(gripGeometry, tongsMaterial);
        rightGrip.position.set(0.022, -0.26, 0);
        rightGrip.rotation.z = -0.2;
        rightGrip.castShadow = true;
        tongsGroup.add(rightGrip);

        // Position tongs in left hand
        tongsGroup.position.set(0, -0.05, -0.12);
        tongsGroup.rotation.x = -Math.PI / 3;
        this.leftHand.add(tongsGroup);
        this.handTongs = tongsGroup;
    }

    createHeldMetal() {
        // Metal piece held by tongs
        const metalGeometry = new THREE.BoxGeometry(0.12, 0.025, 0.04);
        const metalMaterial = new THREE.MeshStandardMaterial({
            color: 0x8a8a8a,
            roughness: 0.4,
            metalness: 0.9
        });
        const heldMetal = new THREE.Mesh(metalGeometry, metalMaterial);
        heldMetal.position.set(0, -0.28, 0);
        heldMetal.castShadow = true;
        heldMetal.receiveShadow = true;

        this.handTongs.add(heldMetal);
        this.heldMetal = heldMetal;
        this.heldMetalMaterial = metalMaterial;
        this.heldMetal.visible = true; // Metal is always held
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
        // World hammer (decorative, on tool rack)
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

        hammerGroup.position.set(-3.85, 1.5, -2.5);
        hammerGroup.rotation.z = Math.PI / 6;
        this.scene.add(hammerGroup);
        this.hammer = hammerGroup;
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
        const fireCount = 80; // Double the fire particles!
        const firePositions = new Float32Array(fireCount * 3);
        const fireColors = new Float32Array(fireCount * 3);

        for (let i = 0; i < fireCount; i++) {
            firePositions[i * 3] = -2.5 + (Math.random() - 0.5) * 0.8;
            firePositions[i * 3 + 1] = 0.8 + Math.random() * 0.4;
            firePositions[i * 3 + 2] = -1.2 + (Math.random() - 0.5) * 0.5;

            // Vary fire colors (red to yellow-white)
            const colorVariation = Math.random();
            if (colorVariation > 0.7) {
                // Hot white-yellow core
                fireColors[i * 3] = 1.0;
                fireColors[i * 3 + 1] = 0.9;
                fireColors[i * 3 + 2] = 0.3;
            } else if (colorVariation > 0.4) {
                // Orange
                fireColors[i * 3] = 1.0;
                fireColors[i * 3 + 1] = 0.4;
                fireColors[i * 3 + 2] = 0.0;
            } else {
                // Red
                fireColors[i * 3] = 1.0;
                fireColors[i * 3 + 1] = 0.15;
                fireColors[i * 3 + 2] = 0.0;
            }
        }

        fireGeometry.setAttribute('position', new THREE.BufferAttribute(firePositions, 3));
        fireGeometry.setAttribute('color', new THREE.BufferAttribute(fireColors, 3));

        const fireMaterial = new THREE.PointsMaterial({
            size: 0.15, // Bigger fire particles
            transparent: true,
            opacity: 0.85,
            blending: THREE.AdditiveBlending,
            vertexColors: true, // Use per-particle colors
            depthWrite: false
        });

        const fire = new THREE.Points(fireGeometry, fireMaterial);
        this.scene.add(fire);
        this.fireSystem = fire;
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

    onMetalStrike() {
        // Metal must be hot to forge effectively
        if (this.metalTemperature < 600) {
            this.showMessage('Metal too cold! Heat it in the forge first (Press E near forge)', '#ff6666');
            this.playErrorSound();
            // Small shake for failed strike
            this.addScreenShake(0.003);
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
            const qualityIncrease = tempQuality / 10;
            this.quality = Math.min(100, this.quality + qualityIncrease);
            this.showMessage('Perfect strike! +' + qualityIncrease.toFixed(1) + '% quality', '#00ff00', 800);
            // Bigger shake for perfect strike
            this.addScreenShake(0.012);
        } else if (this.metalTemperature >= 600) {
            // Acceptable range - minimal quality gain
            const qualityIncrease = 1;
            this.quality = Math.min(100, this.quality + qualityIncrease);
            this.showMessage('Strike! +' + qualityIncrease.toFixed(1) + '% (heat metal more for better results)', '#ffaa00', 800);
            // Medium shake for normal strike
            this.addScreenShake(0.008);
        }

        // ENHANCED metal deformation - more realistic forging
        if (this.heldMetal && this.metalDeformationCount < 30) {
            // Flatten more dramatically
            this.heldMetal.scale.y *= 0.94;
            this.heldMetal.scale.x *= 1.025;
            this.heldMetal.scale.z *= 1.015;

            // Add slight rotation for more organic feel
            this.heldMetal.rotation.y += (Math.random() - 0.5) * 0.02;
            this.heldMetal.rotation.z += (Math.random() - 0.5) * 0.01;

            // Subtle position offset (being worked on anvil)
            const wobble = (Math.random() - 0.5) * 0.003;
            this.heldMetal.position.x = wobble;
        } else if (this.metalDeformationCount >= 30) {
            // Reset deformation for continued forging (blade taking shape)
            this.heldMetal.scale.set(1.5, 0.5, 1.3);
            this.heldMetal.rotation.set(0, 0, 0);
            this.heldMetal.position.set(0, -0.28, 0);
            this.metalDeformationCount = 0;
        }

        // Create sparks at anvil position
        this.createSparks(new THREE.Vector3(
            this.anvil.position.x,
            this.anvil.position.y + 0.2,
            this.anvil.position.z
        ));

        // Play hammer sound
        this.playHammerSound();

        // Cool metal from working
        this.metalTemperature = Math.max(20, this.metalTemperature - 20);
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
            // Spread sparks in a wider area
            positions[i * 3] = position.x + (Math.random() - 0.5) * 0.3;
            positions[i * 3 + 1] = position.y + Math.random() * 0.1;
            positions[i * 3 + 2] = position.z + (Math.random() - 0.5) * 0.3;

            // ENHANCED: Much more dramatic velocities!
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.15 + Math.random() * 0.25; // Faster sparks
            this.sparkSystem.velocities[i].set(
                Math.cos(angle) * speed,
                Math.random() * 0.35 + 0.15, // More upward velocity
                Math.sin(angle) * speed
            );

            // Random lifetime for variation
            this.sparkSystem.lifetimes[i] = Math.random() * 0.3 + 0.7;
        }

        this.sparkSystem.points.material.opacity = 1;
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
        // ENHANCED Update sparks with better physics
        if (this.sparkSystem.active) {
            const positions = this.sparkSystem.points.geometry.attributes.position.array;
            let allDead = true;

            for (let i = 0; i < this.sparkSystem.velocities.length; i++) {
                // Update position
                positions[i * 3] += this.sparkSystem.velocities[i].x * deltaTime * 60;
                positions[i * 3 + 1] += this.sparkSystem.velocities[i].y * deltaTime * 60;
                positions[i * 3 + 2] += this.sparkSystem.velocities[i].z * deltaTime * 60;

                // Enhanced gravity (stronger)
                this.sparkSystem.velocities[i].y -= 0.015;

                // Air resistance
                this.sparkSystem.velocities[i].multiplyScalar(0.98);

                // Lifetime
                this.sparkSystem.lifetimes[i] -= deltaTime;

                if (positions[i * 3 + 1] > 0 && this.sparkSystem.lifetimes[i] > 0) {
                    allDead = false;
                }

                // Bounce off floor
                if (positions[i * 3 + 1] < 0.05) {
                    this.sparkSystem.velocities[i].y *= -0.4; // Bounce with energy loss
                    positions[i * 3 + 1] = 0.05;
                }
            }

            this.sparkSystem.points.geometry.attributes.position.needsUpdate = true;
            this.sparkSystem.points.material.opacity *= 0.94; // Slower fade

            if (allDead || this.sparkSystem.points.material.opacity < 0.01) {
                this.sparkSystem.active = false;
            }
        }

        // Update ember particles (floating embers around forge)
        if (this.emberSystem) {
            const emberPositions = this.emberSystem.points.geometry.attributes.position.array;
            for (let i = 0; i < this.emberSystem.velocities.length; i++) {
                emberPositions[i * 3] += this.emberSystem.velocities[i].x;
                emberPositions[i * 3 + 1] += this.emberSystem.velocities[i].y;
                emberPositions[i * 3 + 2] += this.emberSystem.velocities[i].z;

                // Swirl motion
                emberPositions[i * 3] += Math.sin(Date.now() * 0.001 + i) * 0.002;
                emberPositions[i * 3 + 2] += Math.cos(Date.now() * 0.001 + i) * 0.002;

                // Reset when too high
                if (emberPositions[i * 3 + 1] > 3.5) {
                    emberPositions[i * 3] = -2.5 + (Math.random() - 0.5) * 2;
                    emberPositions[i * 3 + 1] = 0.8;
                    emberPositions[i * 3 + 2] = -1.5 + (Math.random() - 0.5) * 2;
                }
            }
            this.emberSystem.points.geometry.attributes.position.needsUpdate = true;

            // Pulsing glow effect
            this.emberSystem.points.material.opacity = 0.6 + Math.sin(Date.now() * 0.003) * 0.2;
        }

        // Update smoke
        const smokePositions = this.smokeSystem.points.geometry.attributes.position.array;
        for (let i = 0; i < this.smokeSystem.velocities.length; i++) {
            smokePositions[i * 3] += this.smokeSystem.velocities[i].x;
            smokePositions[i * 3 + 1] += this.smokeSystem.velocities[i].y;
            smokePositions[i * 3 + 2] += this.smokeSystem.velocities[i].z;

            if (smokePositions[i * 3 + 1] > 6) {
                const angle = (i / this.smokeSystem.velocities.length) * Math.PI * 2;
                smokePositions[i * 3] = -2.5 + Math.cos(angle) * 0.2;
                smokePositions[i * 3 + 1] = 2.5;
                smokePositions[i * 3 + 2] = -1.5 + Math.sin(angle) * 0.2;
            }
        }
        this.smokeSystem.points.geometry.attributes.position.needsUpdate = true;

        // Animate fire particles with MORE CHAOS!
        const firePositions = this.fireSystem.geometry.attributes.position.array;
        for (let i = 0; i < firePositions.length / 3; i++) {
            firePositions[i * 3 + 1] += Math.random() * 0.02 + 0.01;
            firePositions[i * 3] += (Math.random() - 0.5) * 0.01;
            firePositions[i * 3 + 2] += (Math.random() - 0.5) * 0.01;

            if (firePositions[i * 3 + 1] > 1.8) {
                firePositions[i * 3] = -2.5 + (Math.random() - 0.5) * 0.8;
                firePositions[i * 3 + 1] = 0.8;
                firePositions[i * 3 + 2] = -1.2 + (Math.random() - 0.5) * 0.5;
            }
        }
        this.fireSystem.geometry.attributes.position.needsUpdate = true;

        // Update steam particles
        if (this.steamSystem && this.steamSystem.active) {
            const steamPositions = this.steamSystem.points.geometry.attributes.position.array;
            this.steamSystem.lifetime += deltaTime;

            for (let i = 0; i < this.steamSystem.velocities.length; i++) {
                steamPositions[i * 3] += this.steamSystem.velocities[i].x;
                steamPositions[i * 3 + 1] += this.steamSystem.velocities[i].y;
                steamPositions[i * 3 + 2] += this.steamSystem.velocities[i].z;

                this.steamSystem.velocities[i].x *= 1.01;
                this.steamSystem.velocities[i].z *= 1.01;
            }

            this.steamSystem.points.geometry.attributes.position.needsUpdate = true;
            this.steamSystem.points.material.opacity *= 0.97;

            if (this.steamSystem.lifetime > 3) {
                this.steamSystem.active = false;
                this.steamSystem.points.material.opacity = 0;
            }
        }
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
        let emissiveIntensity = 0;

        if (temp < 400) {
            color = new THREE.Color(0x8a8a8a);
        } else if (temp < 600) {
            color = new THREE.Color(0xaa5555);
            emissiveIntensity = (temp - 400) / 400;
        } else if (temp < 800) {
            color = new THREE.Color(0xff4444);
            emissiveIntensity = 0.5 + (temp - 600) / 400;
        } else if (temp < 1000) {
            color = new THREE.Color(0xff6633);
            emissiveIntensity = 1.0 + (temp - 800) / 400;
        } else {
            color = new THREE.Color(0xffaa44);
            emissiveIntensity = 1.5;
        }

        this.heldMetalMaterial.color = color;
        this.heldMetalMaterial.emissive = color;
        this.heldMetalMaterial.emissiveIntensity = emissiveIntensity * 0.5;
    }

    updateUI() {
        // Update temperature bars
        const forgeTempPercent = (this.forgeTemperature / 1500) * 100;
        document.getElementById('forgeTemp').style.width = forgeTempPercent + '%';
        document.getElementById('forgeTempText').textContent = this.forgeTemperature.toFixed(0) + '°C';

        const metalTempPercent = (this.metalTemperature / 1500) * 100;
        document.getElementById('metalTemp').style.width = metalTempPercent + '%';
        document.getElementById('metalTempText').textContent = this.metalTemperature.toFixed(0) + '°C';

        // Color the metal temp bar based on forging quality
        const metalTempBar = document.getElementById('metalTemp');
        if (this.metalTemperature >= 800 && this.metalTemperature <= 1100) {
            metalTempBar.style.background = 'linear-gradient(90deg, #00ff00, #88ff00)';
        } else if (this.metalTemperature >= 600) {
            metalTempBar.style.background = 'linear-gradient(90deg, #ffaa00, #ff6600)';
        } else {
            metalTempBar.style.background = 'linear-gradient(90deg, #ff3300, #ff6600, #ffaa00)';
        }

        // Update quality bar
        document.getElementById('qualityBar').style.width = this.quality + '%';
        document.getElementById('qualityText').textContent = this.quality.toFixed(1) + '%';

        // Update crosshair color based on proximity
        if (this.crosshairElement) {
            const ring = this.crosshairElement.querySelector('.crosshair-ring');
            if (ring) {
                if (this.nearAnvil) {
                    ring.style.borderColor = '#00ff00';
                } else if (this.nearForge) {
                    ring.style.borderColor = '#ff6600';
                } else if (this.nearWater) {
                    ring.style.borderColor = '#4488ff';
                } else {
                    ring.style.borderColor = '#ffffff';
                }
            }
        }
    }

    updateHammerSwing(deltaTime) {
        if (!this.isHammerSwinging || !this.handHammer) return;

        const swingDuration = 0.25; // Faster swing
        this.hammerSwingProgress += deltaTime / swingDuration;

        if (this.hammerSwingProgress >= 1) {
            // End of swing - reset
            this.handHammer.rotation.x = this.hammerRestRotation.x;
            this.handHammer.rotation.z = this.hammerRestRotation.z || 0;
            this.handHammer.position.y = -0.08;
            this.rightHand.position.y = -0.4;
            this.rightHand.position.z = -0.5;
            this.isHammerSwinging = false;
            this.hammerSwingProgress = 0;
        } else {
            const progress = this.hammerSwingProgress;

            if (progress < 0.3) {
                // Wind up - raise hammer back
                const windupProgress = progress / 0.3;
                const easeOut = 1 - Math.pow(1 - windupProgress, 3); // Ease out cubic

                this.handHammer.rotation.x = this.hammerRestRotation.x - easeOut * 1.0;
                this.handHammer.rotation.z = easeOut * -0.3; // Slight twist
                this.rightHand.position.y = -0.4 + easeOut * 0.2;
                this.rightHand.position.z = -0.5 - easeOut * 0.1; // Pull back
                this.rightHand.rotation.z = easeOut * -0.15; // Shoulder rotation

            } else if (progress < 0.6) {
                // Strike down - POWER!
                const strikeProgress = (progress - 0.3) / 0.3;
                const easeIn = strikeProgress * strikeProgress * strikeProgress; // Ease in cubic (fast)

                this.handHammer.rotation.x = this.hammerRestRotation.x - 1.0 + easeIn * 2.2;
                this.handHammer.rotation.z = -0.3 + easeIn * 0.5; // Twist back
                this.rightHand.position.y = -0.4 + 0.2 - easeIn * 0.35; // Slam down
                this.rightHand.position.z = -0.5 - 0.1 + easeIn * 0.15; // Forward thrust
                this.rightHand.rotation.z = -0.15 + easeIn * 0.25; // Follow through

                // Check for hit at middle of strike
                if (strikeProgress > 0.4 && strikeProgress < 0.6 && !this.hasHitThisSwing) {
                    this.checkHammerHit();
                }

                // Add impact recoil when hitting
                if (this.hasHitThisSwing && strikeProgress > 0.5) {
                    const recoil = Math.sin((strikeProgress - 0.5) * 20) * 0.02;
                    this.handHammer.position.y = -0.08 + recoil;
                    this.handHammer.rotation.x += recoil;
                }

            } else {
                // Return to rest position
                const returnProgress = (progress - 0.6) / 0.4;
                const easeOut = 1 - Math.pow(1 - returnProgress, 2); // Ease out quad

                this.handHammer.rotation.x = this.hammerRestRotation.x + 1.2 - easeOut * 1.2;
                this.handHammer.rotation.z = 0.2 - easeOut * 0.2;
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
        const forgeDistance = new THREE.Vector2(
            playerPos.x - this.forge.position.x,
            playerPos.z - this.forge.position.z
        ).length();
        this.nearForge = forgeDistance < 2.5;

        // Check anvil proximity
        const anvilDistance = new THREE.Vector2(
            playerPos.x - this.anvil.position.x,
            playerPos.z - this.anvil.position.z
        ).length();
        this.nearAnvil = anvilDistance < 1.8;

        // Check water proximity
        const waterDistance = new THREE.Vector2(
            playerPos.x - this.waterBarrel.position.x,
            playerPos.z - this.waterBarrel.position.z
        ).length();
        this.nearWater = waterDistance < 2;

        // Update interaction indicators
        this.updateIndicator(this.forge, this.nearForge);
        this.updateIndicator(this.anvil, this.nearAnvil);
        this.updateIndicator(this.waterBarrel, this.nearWater);
    }

    updateIndicator(object, isNear) {
        if (object.userData.indicator) {
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

        // Apply screen shake (decays over time)
        if (this.screenShake.intensity > 0) {
            this.screenShake.intensity *= 0.85; // Decay
            if (this.screenShake.intensity < 0.001) {
                this.screenShake.intensity = 0;
                this.screenShake.x = 0;
                this.screenShake.y = 0;
            } else {
                // Randomize shake direction for more dynamic feel
                this.screenShake.x += (Math.random() - 0.5) * this.screenShake.intensity * 0.5;
                this.screenShake.y += (Math.random() - 0.5) * this.screenShake.intensity * 0.5;
            }
        }

        // Apply camera position and rotation with screen shake
        this.camera.position.copy(this.cameraPosition);
        this.camera.rotation.y = this.cameraRotation.y + this.screenShake.x;
        this.camera.rotation.x = this.cameraRotation.x + this.screenShake.y;
    }

    hideLoadingScreen() {
        let progress = 0;
        const loadingInterval = setInterval(() => {
            progress += Math.random() * 15 + 5;
            if (progress > 100) progress = 100;

            const progressBar = document.getElementById('loadingProgress');
            const loadingText = document.getElementById('loadingText');

            if (progressBar) {
                progressBar.style.width = progress + '%';
            }

            if (loadingText) {
                const messages = [
                    'Heating the forge...',
                    'Preparing the anvil...',
                    'Sharpening tools...',
                    'Stoking the fire...',
                    'Ready to forge!'
                ];
                const messageIndex = Math.min(Math.floor(progress / 20), messages.length - 1);
                loadingText.textContent = messages[messageIndex];
            }

            if (progress >= 100) {
                clearInterval(loadingInterval);
                setTimeout(() => {
                    const loadingScreen = document.getElementById('loading-screen');
                    if (loadingScreen) {
                        loadingScreen.classList.add('hidden');
                        setTimeout(() => {
                            loadingScreen.style.display = 'none';

                            // Show welcome message with new features
                            setTimeout(() => {
                                this.showMessage(
                                    '🔥 VR-STYLE HANDS NOW ON DESKTOP! 🔥\nMove mouse to aim • Watch your fingers curl • Feel the hammer recoil!\nClick to forge!',
                                    '#ffaa00',
                                    5000
                                );
                            }, 500);
                        }, 500);
                    }
                }, 300);
            }
        }, 100);
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

            // ENHANCED forge light flickering - more realistic fire behavior
            const time = Date.now() * 0.001;
            const flicker1 = Math.sin(time * 3.7) * 0.4;
            const flicker2 = Math.sin(time * 7.3) * 0.25;
            const flicker3 = Math.sin(time * 11.1) * 0.15;
            const flicker4 = Math.sin(time * 2.1) * 0.35;

            this.forgeLight.intensity = 4.5 + flicker1 + flicker2 + flicker3;

            // Secondary forge light flickers differently
            if (this.forgeLightSecondary) {
                this.forgeLightSecondary.intensity = 2 + flicker2 * 2 + flicker4;
            }

            // Animate forge opening emissive with complex pattern
            if (this.forgeOpening) {
                this.forgeOpening.material.emissiveIntensity = 1.8 + flicker1 * 0.6 + flicker3;
                // Subtle color shift
                const heatPulse = (Math.sin(time * 0.5) + 1) * 0.5;
                this.forgeOpening.material.emissive.setHSL(0.05 + heatPulse * 0.03, 1, 0.5);
            }

            this.renderer.render(this.scene, this.camera);
        });
    }
}

// Initialize game when page loads
window.addEventListener('DOMContentLoaded', () => {
    const game = new ForgingGame();
    window.game = game; // For debugging
});
