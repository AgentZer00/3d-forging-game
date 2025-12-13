// Immersive 3D Forging Game with VR Support
// Main Game Engine

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

        // Game state
        this.metalTemperature = 20; // Celsius
        this.forgeTemperature = 1200;
        this.quality = 0;
        this.hammerStrikes = 0;
        this.isMetalInForge = false;
        this.isHammerSwinging = false;
        this.hammerVelocity = new THREE.Vector3();

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
        this.cameraPosition = new THREE.Vector3(0, 1.6, 3);

        // Audio context (for future sound implementation)
        this.sounds = {};

        this.init();
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
        this.setupEventListeners();
        this.createParticleSystems();
        this.hideLoadingScreen();
        this.animate();
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a0a00);
        this.scene.fog = new THREE.Fog(0x1a0a00, 5, 20);
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.copy(this.cameraPosition);
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.xr.enabled = true;
        document.getElementById('game-container').appendChild(this.renderer.domElement);
    }

    setupLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        this.scene.add(ambientLight);

        // Forge light (orange/red glow)
        const forgeLight = new THREE.PointLight(0xff4400, 2, 10);
        forgeLight.position.set(-2, 1, 0);
        forgeLight.castShadow = true;
        this.scene.add(forgeLight);
        this.forgeLight = forgeLight;

        // Workshop overhead light
        const overheadLight = new THREE.DirectionalLight(0xffffcc, 0.5);
        overheadLight.position.set(0, 5, 0);
        overheadLight.castShadow = true;
        overheadLight.shadow.mapSize.width = 2048;
        overheadLight.shadow.mapSize.height = 2048;
        this.scene.add(overheadLight);

        // Spotlight on anvil
        const anvilLight = new THREE.SpotLight(0xffffff, 1);
        anvilLight.position.set(0, 3, 0);
        anvilLight.angle = Math.PI / 6;
        anvilLight.penumbra = 0.5;
        anvilLight.castShadow = true;
        this.scene.add(anvilLight);
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

    enterVR() {
        this.renderer.xr.getSession().then(() => {
            this.isVR = true;
            document.body.classList.add('vr-mode');
        });
    }

    onVRSelectStart(controllerIndex) {
        this.onHammerSwing();
    }

    onVRSelectEnd(controllerIndex) {
        // Could be used for releasing tools
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
    }

    createWalls() {
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x3a2a1a,
            roughness: 0.9
        });

        // Back wall
        const backWall = new THREE.Mesh(
            new THREE.BoxGeometry(20, 5, 0.5),
            wallMaterial
        );
        backWall.position.set(0, 2.5, -5);
        backWall.receiveShadow = true;
        this.scene.add(backWall);

        // Left wall
        const leftWall = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 5, 20),
            wallMaterial
        );
        leftWall.position.set(-10, 2.5, 0);
        leftWall.receiveShadow = true;
        this.scene.add(leftWall);

        // Right wall
        const rightWall = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 5, 20),
            wallMaterial
        );
        rightWall.position.set(10, 2.5, 0);
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

        // Anvil base
        const baseGeometry = new THREE.CylinderGeometry(0.3, 0.35, 0.6, 8);
        const base = new THREE.Mesh(baseGeometry, anvilMaterial);
        base.position.y = -0.45;
        base.castShadow = true;
        anvilGroup.add(base);

        anvilGroup.position.set(0, 1, 0);
        this.scene.add(anvilGroup);
        this.anvil = anvilGroup;
    }

    createForge() {
        const forgeGroup = new THREE.Group();

        // Forge body
        const forgeGeometry = new THREE.BoxGeometry(1.5, 1, 1);
        const forgeMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a3a2a,
            roughness: 0.8
        });
        const forgeBody = new THREE.Mesh(forgeGeometry, forgeMaterial);
        forgeBody.castShadow = true;
        forgeGroup.add(forgeBody);

        // Forge opening
        const openingGeometry = new THREE.BoxGeometry(0.8, 0.4, 0.6);
        const emberMaterial = new THREE.MeshStandardMaterial({
            color: 0xff4400,
            emissive: 0xff2200,
            emissiveIntensity: 1
        });
        const opening = new THREE.Mesh(openingGeometry, emberMaterial);
        opening.position.set(0, 0.2, 0.3);
        forgeGroup.add(opening);

        // Chimney
        const chimneyGeometry = new THREE.CylinderGeometry(0.2, 0.25, 2, 8);
        const chimneyMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a2a2a,
            roughness: 0.9
        });
        const chimney = new THREE.Mesh(chimneyGeometry, chimneyMaterial);
        chimney.position.set(0, 1.5, -0.3);
        forgeGroup.add(chimney);

        forgeGroup.position.set(-2, 0.5, -1);
        this.scene.add(forgeGroup);
        this.forge = forgeGroup;
        this.forgeOpening = opening;
    }

    createWaterBarrel() {
        const barrelGroup = new THREE.Group();

        // Barrel body
        const barrelGeometry = new THREE.CylinderGeometry(0.4, 0.35, 0.8, 16);
        const barrelMaterial = new THREE.MeshStandardMaterial({
            color: 0x654321,
            roughness: 0.8
        });
        const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        barrel.castShadow = true;
        barrelGroup.add(barrel);

        // Water surface
        const waterGeometry = new THREE.CircleGeometry(0.38, 32);
        const waterMaterial = new THREE.MeshStandardMaterial({
            color: 0x1e5a8a,
            roughness: 0.1,
            metalness: 0.5,
            transparent: true,
            opacity: 0.8
        });
        const water = new THREE.Mesh(waterGeometry, waterMaterial);
        water.rotation.x = -Math.PI / 2;
        water.position.y = 0.35;
        barrelGroup.add(water);

        barrelGroup.position.set(2, 0.4, -1);
        this.scene.add(barrelGroup);
        this.waterBarrel = barrelGroup;
    }

    createToolRack() {
        const rackGeometry = new THREE.BoxGeometry(0.1, 1.5, 2);
        const rackMaterial = new THREE.MeshStandardMaterial({
            color: 0x654321,
            roughness: 0.8
        });
        const rack = new THREE.Mesh(rackGeometry, rackMaterial);
        rack.position.set(-3, 1, -3);
        rack.castShadow = true;
        this.scene.add(rack);
    }

    createTools() {
        // Hammer
        const hammerGroup = new THREE.Group();

        // Hammer head
        const headGeometry = new THREE.BoxGeometry(0.15, 0.1, 0.25);
        const hammerMaterial = new THREE.MeshStandardMaterial({
            color: 0x666666,
            roughness: 0.4,
            metalness: 0.8
        });
        const head = new THREE.Mesh(headGeometry, hammerMaterial);
        head.castShadow = true;
        hammerGroup.add(head);

        // Hammer handle
        const handleGeometry = new THREE.CylinderGeometry(0.02, 0.025, 0.6, 8);
        const handleMaterial = new THREE.MeshStandardMaterial({
            color: 0x654321,
            roughness: 0.7
        });
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.position.y = -0.35;
        handle.castShadow = true;
        hammerGroup.add(handle);

        // Position hammer in hand-like position
        hammerGroup.position.set(0.3, 1.3, 0.5);
        hammerGroup.rotation.x = -Math.PI / 4;
        this.scene.add(hammerGroup);
        this.hammer = hammerGroup;
        this.hammerInitialPosition = hammerGroup.position.clone();
        this.hammerInitialRotation = hammerGroup.rotation.clone();
    }

    createMetal() {
        // Create metal stock for forging
        const metalGeometry = new THREE.BoxGeometry(0.8, 0.1, 0.15);
        const metalMaterial = new THREE.MeshStandardMaterial({
            color: 0x8a8a8a,
            roughness: 0.5,
            metalness: 0.9
        });
        const metal = new THREE.Mesh(metalGeometry, metalMaterial);
        metal.position.set(0, 1.2, 0);
        metal.castShadow = true;
        metal.receiveShadow = true;
        this.scene.add(metal);
        this.metal = metal;

        // Store original material for temperature effects
        this.metalBaseMaterial = metalMaterial;
    }

    createParticleSystems() {
        // Spark particles
        const sparkGeometry = new THREE.BufferGeometry();
        const sparkCount = 100;
        const sparkPositions = new Float32Array(sparkCount * 3);
        const sparkVelocities = [];

        for (let i = 0; i < sparkCount; i++) {
            sparkPositions[i * 3] = 0;
            sparkPositions[i * 3 + 1] = 0;
            sparkPositions[i * 3 + 2] = 0;
            sparkVelocities.push(new THREE.Vector3());
        }

        sparkGeometry.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));

        const sparkMaterial = new THREE.PointsMaterial({
            color: 0xffaa00,
            size: 0.05,
            transparent: true,
            opacity: 0
        });

        const sparks = new THREE.Points(sparkGeometry, sparkMaterial);
        this.scene.add(sparks);
        this.sparkSystem = { points: sparks, velocities: sparkVelocities, active: false };

        // Smoke particles from forge
        this.createSmokeParticles();

        // Fire particles in forge
        this.createFireParticles();
    }

    createSmokeParticles() {
        const smokeGeometry = new THREE.BufferGeometry();
        const smokeCount = 50;
        const smokePositions = new Float32Array(smokeCount * 3);
        const smokeVelocities = [];

        for (let i = 0; i < smokeCount; i++) {
            const angle = (i / smokeCount) * Math.PI * 2;
            smokePositions[i * 3] = -2 + Math.cos(angle) * 0.2;
            smokePositions[i * 3 + 1] = 2 + Math.random() * 2;
            smokePositions[i * 3 + 2] = -1 + Math.sin(angle) * 0.2;
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
        const fireCount = 30;
        const firePositions = new Float32Array(fireCount * 3);

        for (let i = 0; i < fireCount; i++) {
            firePositions[i * 3] = -2 + (Math.random() - 0.5) * 0.6;
            firePositions[i * 3 + 1] = 0.7 + Math.random() * 0.3;
            firePositions[i * 3 + 2] = -0.8 + (Math.random() - 0.5) * 0.4;
        }

        fireGeometry.setAttribute('position', new THREE.BufferAttribute(firePositions, 3));

        const fireMaterial = new THREE.PointsMaterial({
            color: 0xff4400,
            size: 0.1,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
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
                this.onHammerSwing();
            }
        });

        window.addEventListener('mouseup', () => {
            this.mouseDown = false;
        });

        window.addEventListener('mousemove', (e) => {
            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

            // Camera rotation with mouse
            if (this.mouseDown) {
                this.cameraRotation.y -= e.movementX * 0.002;
                this.cameraRotation.x -= e.movementY * 0.002;
                this.cameraRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.cameraRotation.x));
            }
        });

        // Window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Pointer lock for better camera control
        this.renderer.domElement.addEventListener('click', () => {
            this.renderer.domElement.requestPointerLock();
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
        }
    }

    heatMetal() {
        // Move metal to forge
        if (!this.isMetalInForge) {
            this.isMetalInForge = true;
            this.metal.position.set(-2, 1, -0.7);
            console.log('Metal placed in forge');
        }
    }

    quenchMetal() {
        // Quench metal in water
        if (this.metalTemperature > 500) {
            this.metal.position.set(2, 0.5, -1);
            this.createSteamEffect();
            this.metalTemperature = 20;
            this.isMetalInForge = false;
            console.log('Metal quenched! Quality: ' + this.quality.toFixed(1) + '%');

            // Play quench sound (placeholder)
            this.playQuenchSound();
        }
    }

    resetMetal() {
        // Reset metal to anvil
        this.metal.position.set(0, 1.2, 0);
        this.metalTemperature = 20;
        this.quality = 0;
        this.hammerStrikes = 0;
        this.isMetalInForge = false;
        console.log('Metal reset');
    }

    onHammerSwing() {
        if (this.isHammerSwinging) return;

        this.isHammerSwinging = true;

        // Animate hammer swing
        const startPos = this.hammer.position.clone();
        const startRot = this.hammer.rotation.clone();
        const swingDuration = 0.3;
        let swingTime = 0;

        const swingAnimation = () => {
            swingTime += this.clock.getDelta();
            const progress = Math.min(swingTime / swingDuration, 1);

            if (progress < 0.5) {
                // Wind up
                this.hammer.position.y = startPos.y + progress * 0.4;
                this.hammer.rotation.x = startRot.x - progress * Math.PI / 2;
            } else {
                // Strike down
                const strikeProgress = (progress - 0.5) * 2;
                this.hammer.position.y = startPos.y + 0.2 - strikeProgress * 0.4;
                this.hammer.rotation.x = startRot.x - Math.PI / 4 + strikeProgress * Math.PI / 2;

                // Check for metal hit at bottom of swing
                if (strikeProgress > 0.7 && strikeProgress < 0.8) {
                    this.checkHammerHit();
                }
            }

            if (progress < 1) {
                requestAnimationFrame(swingAnimation);
            } else {
                // Reset hammer
                this.hammer.position.copy(this.hammerInitialPosition);
                this.hammer.rotation.copy(this.hammerInitialRotation);
                this.isHammerSwinging = false;
                swingTime = 0;
            }
        };

        swingAnimation();
    }

    checkHammerHit() {
        // Check if hammer hits metal
        const hammerPos = this.hammer.position;
        const metalPos = this.metal.position;
        const distance = hammerPos.distanceTo(metalPos);

        if (distance < 1) {
            this.onMetalStrike();
        }
    }

    onMetalStrike() {
        // Metal must be hot to forge
        if (this.metalTemperature < 600) {
            console.log('Metal too cold! Heat it in the forge first.');
            return;
        }

        this.hammerStrikes++;

        // Calculate quality based on temperature and strikes
        const optimalTemp = 1000;
        const tempDiff = Math.abs(this.metalTemperature - optimalTemp);
        const tempQuality = Math.max(0, 100 - (tempDiff / 10));

        this.quality = Math.min(100, this.quality + (tempQuality / 20));

        // Slightly deform metal (visual feedback)
        this.metal.scale.y *= 0.98;
        this.metal.scale.x *= 1.01;

        // Create sparks
        this.createSparks(this.metal.position);

        // Play hammer sound (placeholder)
        this.playHammerSound();

        // Cool metal slightly from working
        this.metalTemperature -= 15;

        console.log('Strike! Temperature: ' + this.metalTemperature + '°C, Quality: ' + this.quality.toFixed(1) + '%');
    }

    createSparks(position) {
        this.sparkSystem.active = true;
        const positions = this.sparkSystem.points.geometry.attributes.position.array;

        for (let i = 0; i < this.sparkSystem.velocities.length; i++) {
            positions[i * 3] = position.x;
            positions[i * 3 + 1] = position.y;
            positions[i * 3 + 2] = position.z;

            // Random velocity for sparks
            this.sparkSystem.velocities[i].set(
                (Math.random() - 0.5) * 0.1,
                Math.random() * 0.15,
                (Math.random() - 0.5) * 0.1
            );
        }

        this.sparkSystem.points.material.opacity = 1;
        this.sparkSystem.points.geometry.attributes.position.needsUpdate = true;
    }

    createSteamEffect() {
        // Create steam particles when quenching
        console.log('*HISSSSSS* Steam rises from the water!');
        // Visual steam effect would go here
    }

    playHammerSound() {
        // Placeholder for hammer strike sound
        // In a full implementation, this would play an actual audio file
    }

    playQuenchSound() {
        // Placeholder for quenching sound
        // In a full implementation, this would play a hissing/sizzling sound
    }

    updateParticles(deltaTime) {
        // Update sparks
        if (this.sparkSystem.active) {
            const positions = this.sparkSystem.points.geometry.attributes.position.array;
            let allDead = true;

            for (let i = 0; i < this.sparkSystem.velocities.length; i++) {
                positions[i * 3] += this.sparkSystem.velocities[i].x;
                positions[i * 3 + 1] += this.sparkSystem.velocities[i].y;
                positions[i * 3 + 2] += this.sparkSystem.velocities[i].z;

                // Gravity
                this.sparkSystem.velocities[i].y -= 0.005;

                if (positions[i * 3 + 1] > 0) {
                    allDead = false;
                }
            }

            this.sparkSystem.points.geometry.attributes.position.needsUpdate = true;
            this.sparkSystem.points.material.opacity *= 0.95;

            if (allDead || this.sparkSystem.points.material.opacity < 0.01) {
                this.sparkSystem.active = false;
            }
        }

        // Update smoke
        const smokePositions = this.smokeSystem.points.geometry.attributes.position.array;
        for (let i = 0; i < this.smokeSystem.velocities.length; i++) {
            smokePositions[i * 3] += this.smokeSystem.velocities[i].x;
            smokePositions[i * 3 + 1] += this.smokeSystem.velocities[i].y;
            smokePositions[i * 3 + 2] += this.smokeSystem.velocities[i].z;

            // Reset smoke particles that go too high
            if (smokePositions[i * 3 + 1] > 6) {
                const angle = (i / this.smokeSystem.velocities.length) * Math.PI * 2;
                smokePositions[i * 3] = -2 + Math.cos(angle) * 0.2;
                smokePositions[i * 3 + 1] = 2;
                smokePositions[i * 3 + 2] = -1 + Math.sin(angle) * 0.2;
            }
        }
        this.smokeSystem.points.geometry.attributes.position.needsUpdate = true;

        // Animate fire particles
        const firePositions = this.fireSystem.geometry.attributes.position.array;
        for (let i = 0; i < firePositions.length / 3; i++) {
            firePositions[i * 3 + 1] += Math.random() * 0.01;

            // Reset fire particles
            if (firePositions[i * 3 + 1] > 1.5) {
                firePositions[i * 3 + 1] = 0.7;
            }
        }
        this.fireSystem.geometry.attributes.position.needsUpdate = true;
    }

    updateMetalTemperature(deltaTime) {
        if (this.isMetalInForge) {
            // Heat up metal in forge
            this.metalTemperature = Math.min(this.forgeTemperature, this.metalTemperature + 100 * deltaTime);
        } else {
            // Cool down metal in air
            const coolingRate = 30 * deltaTime;
            this.metalTemperature = Math.max(20, this.metalTemperature - coolingRate);
        }

        // Update metal color based on temperature
        this.updateMetalColor();
    }

    updateMetalColor() {
        const temp = this.metalTemperature;
        let color;

        if (temp < 500) {
            color = new THREE.Color(0x8a8a8a); // Gray
        } else if (temp < 700) {
            color = new THREE.Color(0xff6666); // Dull red
        } else if (temp < 900) {
            color = new THREE.Color(0xff3333); // Red
        } else if (temp < 1100) {
            color = new THREE.Color(0xff9933); // Orange
        } else {
            color = new THREE.Color(0xffff66); // Yellow-white
        }

        this.metalBaseMaterial.color = color;

        // Add emissive glow when hot
        if (temp > 500) {
            this.metalBaseMaterial.emissive = color;
            this.metalBaseMaterial.emissiveIntensity = (temp - 500) / 700;
        } else {
            this.metalBaseMaterial.emissive = new THREE.Color(0x000000);
            this.metalBaseMaterial.emissiveIntensity = 0;
        }
    }

    updateUI() {
        // Update temperature bars
        const forgeTempPercent = (this.forgeTemperature / 1500) * 100;
        document.getElementById('forgeTemp').style.width = forgeTempPercent + '%';
        document.getElementById('forgeTempText').textContent = this.forgeTemperature.toFixed(0) + '°C';

        const metalTempPercent = (this.metalTemperature / 1500) * 100;
        document.getElementById('metalTemp').style.width = metalTempPercent + '%';
        document.getElementById('metalTempText').textContent = this.metalTemperature.toFixed(0) + '°C';

        // Update quality bar
        document.getElementById('qualityBar').style.width = this.quality + '%';
        document.getElementById('qualityText').textContent = this.quality.toFixed(1) + '%';
    }

    updateCamera(deltaTime) {
        if (this.isVR) return; // VR handles camera automatically

        // Keyboard camera movement
        const moveSpeed = 2 * deltaTime;
        const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraRotation.y);
        const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraRotation.y);

        if (this.keys['w'] || this.keys['arrowup']) {
            this.cameraPosition.add(forward.multiplyScalar(moveSpeed));
        }
        if (this.keys['s'] || this.keys['arrowdown']) {
            this.cameraPosition.add(forward.multiplyScalar(-moveSpeed));
        }
        if (this.keys['a'] || this.keys['arrowleft']) {
            this.cameraPosition.add(right.multiplyScalar(-moveSpeed));
        }
        if (this.keys['d'] || this.keys['arrowright']) {
            this.cameraPosition.add(right.multiplyScalar(moveSpeed));
        }

        // Apply camera position and rotation
        this.camera.position.copy(this.cameraPosition);
        this.camera.rotation.y = this.cameraRotation.y;
        this.camera.rotation.x = this.cameraRotation.x;
    }

    hideLoadingScreen() {
        setTimeout(() => {
            const loadingScreen = document.getElementById('loading-screen');
            loadingScreen.classList.add('hidden');
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }, 1000);
    }

    animate() {
        this.renderer.setAnimationLoop(() => {
            const deltaTime = this.clock.getDelta();

            this.updateMetalTemperature(deltaTime);
            this.updateParticles(deltaTime);
            this.updateCamera(deltaTime);
            this.updateUI();

            // Animate forge light flickering
            this.forgeLight.intensity = 2 + Math.sin(Date.now() * 0.003) * 0.3;

            this.renderer.render(this.scene, this.camera);
        });
    }
}

// Initialize game when page loads
window.addEventListener('DOMContentLoaded', () => {
    const game = new ForgingGame();
});
