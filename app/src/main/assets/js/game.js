/**
 * Ultimate Bike Racing 3D - Main Game Engine
 */

class GameApp {
  constructor() {
    this.container = document.getElementById('game-canvas-container');
    this.storage = window.gameStorage;
    this.sound = window.soundEngine;

    // Game state: 'menu', 'garage', 'levels', 'playing', 'paused', 'gameover', 'victory'
    this.state = 'menu';
    this.currentLevelIndex = 0; // 0-based for GAME_LEVELS

    // Three.js Core
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = new THREE.Clock();

    // Scene elements
    this.ambientLight = null;
    this.dirLight = null;
    this.roadSegments = [];
    this.roadWidth = 11.0;
    this.lanes = [-3.8, -1.25, 1.25, 3.8];

    // Player state
    this.playerBike = null;
    this.playerPos = new THREE.Vector3(0, 0, 0);
    this.playerSpeed = 0; // Current speed in m/s (1 m/s ~= 3.6 km/h)
    this.targetSpeed = 0;
    this.playerLaneX = 0;
    this.targetLaneX = 0;
    this.playerLean = 0; // Current lean angle
    this.nitroAmount = 100; // 0 to 100
    this.isNitroActive = false;
    this.isBraking = false;
    this.isAccelerating = false;
    this.turnDirection = 0; // -1 = left, +1 = right

    // Stats for current race
    this.raceDistanceTraveled = 0;
    this.raceCoinsCollected = 0;
    this.raceNearMisses = 0;
    this.raceTimeElapsed = 0;
    this.raceMissionProgress = 0;
    this.hasCrashed = false;
    this.hasFinished = false;

    // Active entities in world
    this.trafficCars = [];
    this.coins = [];
    this.nitroPickups = [];
    this.obstacles = [];
    this.sceneryObjects = [];
    this.streetLamps = [];
    this.finishLineArch = null;

    // Systems
    this.particles = null;

    // Garage showroom state
    this.showroomBike = null;
    this.showroomRotation = 0;

    // Controls input state
    this.keys = {
      left: false,
      right: false,
      accel: false,
      brake: false,
      nitro: false
    };

    this.initThree();
    this.initUI();
    this.bindEvents();
    this.setupMenuShowroom();
    this.animate();
  }

  initThree() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x64b5f6);
    this.scene.fog = new THREE.FogExp2(0xcfe2f3, 0.009);

    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(62, aspect, 0.1, 450);
    this.camera.position.set(0, 3.2, 5.0);

    const isHigh = this.storage.data.settings.graphics !== 'low';
    this.renderer = new THREE.WebGLRenderer({
      antialias: isHigh,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, isHigh ? 2 : 1.2));
    this.renderer.shadowMap.enabled = this.storage.data.settings.graphics === 'high';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    // Lights
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xfffaed, 1.2);
    this.dirLight.position.set(20, 40, 20);
    if (this.storage.data.settings.graphics === 'high') {
      this.dirLight.castShadow = true;
      this.dirLight.shadow.mapSize.width = 1024;
      this.dirLight.shadow.mapSize.height = 1024;
      this.dirLight.shadow.camera.near = 0.5;
      this.dirLight.shadow.camera.far = 120;
      this.dirLight.shadow.camera.left = -20;
      this.dirLight.shadow.camera.right = 20;
      this.dirLight.shadow.camera.top = 20;
      this.dirLight.shadow.camera.bottom = -20;
    }
    this.scene.add(this.dirLight);

    this.particles = new ParticleSystem(this.scene);
  }

  // --- ROAD & ENVIRONMENT GENERATION ---

  buildEnvironment(env) {
    this.scene.background = new THREE.Color(env.skyColor);
    this.scene.fog.color = new THREE.Color(env.fogColor);
    this.ambientLight.color = new THREE.Color(env.ambientLight);
    this.dirLight.color = new THREE.Color(env.dirLight);

    // Ground plane
    if (this.groundMesh) {
      this.scene.remove(this.groundMesh);
    }
    const groundGeo = new THREE.PlaneGeometry(300, 800);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshStandardMaterial({ color: env.groundColor, roughness: 0.9 });
    this.groundMesh = new THREE.Mesh(groundGeo, groundMat);
    this.groundMesh.position.y = -0.05;
    this.scene.add(this.groundMesh);

    // Clear previous entities
    this.clearWorldEntities();

    // Build 12 recycled road segments (each 40m long)
    const segmentLength = 40;
    const totalSegments = 14;
    for (let i = 0; i < totalSegments; i++) {
      const seg = this.createRoadSegment(i * segmentLength, segmentLength, env);
      this.roadSegments.push(seg);
      this.scene.add(seg);
    }
  }

  createRoadSegment(zPos, length, env) {
    const group = new THREE.Group();
    group.position.z = -zPos;

    // Asphalt
    const roadMat = new THREE.MeshStandardMaterial({ color: env.roadColor, roughness: 0.7 });
    const roadGeo = new THREE.PlaneGeometry(this.roadWidth, length);
    roadGeo.rotateX(-Math.PI / 2);
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.receiveShadow = true;
    group.add(road);

    // Curbs / Barriers
    const curbMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5 });
    const whiteCurbMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
    const barrierMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.7, roughness: 0.3 });

    // Guardrails
    const railGeo = new THREE.BoxGeometry(0.3, 0.7, length);
    const leftRail = new THREE.Mesh(railGeo, barrierMat);
    leftRail.position.set(-this.roadWidth / 2 - 0.2, 0.35, 0);
    group.add(leftRail);

    const rightRail = new THREE.Mesh(railGeo, barrierMat);
    rightRail.position.set(this.roadWidth / 2 + 0.2, 0.35, 0);
    group.add(rightRail);

    // Lane dashes
    const dashMat = new THREE.MeshBasicMaterial({ color: 0xf1f5f9 });
    const dashGeo = new THREE.PlaneGeometry(0.2, 3.5);
    dashGeo.rotateX(-Math.PI / 2);

    for (let z = -length / 2 + 2; z < length / 2; z += 6.0) {
      // 3 divider lines between 4 lanes
      [-2.5, 0, 2.5].forEach(x => {
        const dash = new THREE.Mesh(dashGeo, dashMat);
        dash.position.set(x, 0.01, z);
        group.add(dash);
      });
    }

    // Roadside Scenery (Trees / Buildings)
    const sceneryLeft = ModelBuilder.createScenery(env.type, false);
    sceneryLeft.position.set(-this.roadWidth / 2 - 5 - Math.random() * 5, 0, (Math.random() - 0.5) * length * 0.7);
    group.add(sceneryLeft);

    const sceneryRight = ModelBuilder.createScenery(env.type, true);
    sceneryRight.position.set(this.roadWidth / 2 + 5 + Math.random() * 5, 0, (Math.random() - 0.5) * length * 0.7);
    group.add(sceneryRight);

    // Street Lamps
    if (Math.random() > 0.4) {
      const lamp = ModelBuilder.createStreetLamp(true);
      lamp.position.set(this.roadWidth / 2 + 1.2, 0, 0);
      group.add(lamp);
    }

    group.segmentLength = length;
    return group;
  }

  clearWorldEntities() {
    for (let seg of this.roadSegments) this.scene.remove(seg);
    this.roadSegments = [];

    for (let car of this.trafficCars) this.scene.remove(car);
    this.trafficCars = [];

    for (let coin of this.coins) this.scene.remove(coin);
    this.coins = [];

    for (let n of this.nitroPickups) this.scene.remove(n);
    this.nitroPickups = [];

    for (let obs of this.obstacles) this.scene.remove(obs);
    this.obstacles = [];

    if (this.finishLineArch) {
      this.scene.remove(this.finishLineArch);
      this.finishLineArch = null;
    }

    if (this.particles) this.particles.clear();
  }

  // --- SPAWNING MECHANICS ---

  spawnEntitiesForLevel(lvl) {
    const totalDist = lvl.distance;
    const trafficDensity = lvl.trafficDensity;
    const carTypes = ['sedan', 'sedan', 'suv', 'truck'];
    const carColors = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b, 0x8b5cf6, 0x64748b, 0xd97706];

    // Spawn traffic vehicles ahead along the track
    let z = 60; // Start spawning 60m ahead of player
    while (z < totalDist - 80) {
      const laneIdx = Math.floor(Math.random() * this.lanes.length);
      const laneX = this.lanes[laneIdx];
      const type = carTypes[Math.floor(Math.random() * carTypes.length)];
      const col = carColors[Math.floor(Math.random() * carColors.length)];

      const car = ModelBuilder.createTrafficCar(type, col);
      car.position.set(laneX, 0, -z);
      // Speed in m/s (approx 45-80 km/h)
      car.speed = (lvl.trafficSpeed[0] + Math.random() * (lvl.trafficSpeed[1] - lvl.trafficSpeed[0])) / 3.6;
      car.laneX = laneX;
      car.passed = false;

      this.scene.add(car);
      this.trafficCars.push(car);

      // Distance to next car based on density
      z += (35 / trafficDensity) + Math.random() * 25;
    }

    // Spawn Gold Coins in strings
    let coinZ = 40;
    while (coinZ < totalDist - 50) {
      const laneX = this.lanes[Math.floor(Math.random() * this.lanes.length)];
      const count = 3 + Math.floor(Math.random() * 4);
      for (let c = 0; c < count; c++) {
        const coin = ModelBuilder.createCoin();
        coin.position.set(laneX, 0.6, -(coinZ + c * 3.5));
        this.scene.add(coin);
        this.coins.push(coin);
      }
      coinZ += 80 + Math.random() * 60;
    }

    // Spawn Nitro Pickups
    let nitroZ = 120;
    while (nitroZ < totalDist - 100) {
      const laneX = this.lanes[Math.floor(Math.random() * this.lanes.length)];
      const nitro = ModelBuilder.createNitroPickup();
      nitro.position.set(laneX, 0.65, -nitroZ);
      this.scene.add(nitro);
      this.nitroPickups.push(nitro);
      nitroZ += 180 + Math.random() * 120;
    }

    // Spawn Road Cones / Obstacles
    let obsZ = 90;
    while (obsZ < totalDist - 60) {
      if (Math.random() > 0.4) {
        const laneX = this.lanes[Math.floor(Math.random() * this.lanes.length)];
        const obs = ModelBuilder.createObstacle();
        obs.position.set(laneX, 0, -obsZ);
        this.scene.add(obs);
        this.obstacles.push(obs);
      }
      obsZ += 100 + Math.random() * 80;
    }

    // Place Finish Line Arch at level distance
    this.finishLineArch = ModelBuilder.createFinishLine();
    this.finishLineArch.position.set(0, 0, -totalDist);
    this.scene.add(this.finishLineArch);
  }

  // --- GAMEPLAY INITIALIZATION & RUN ---

  startRace(levelIndex) {
    this.currentLevelIndex = levelIndex;
    const level = GAME_LEVELS[levelIndex];

    // Build environment
    this.buildEnvironment(level.environment);

    // Create player bike
    if (this.playerBike) {
      this.scene.remove(this.playerBike);
    }
    const currentBikeId = this.storage.data.selectedBikeId;
    const currentBikeColor = this.storage.data.bikeColors[currentBikeId] || '#f97316';
    this.playerBike = ModelBuilder.createPlayerBike(currentBikeId, currentBikeColor);
    this.scene.add(this.playerBike);

    // Reset race variables
    this.playerPos.set(0, 0, 0);
    this.playerBike.position.set(0, 0, 0);
    this.playerSpeed = 0;
    this.targetLaneX = 0;
    this.playerLaneX = 0;
    this.playerLean = 0;
    this.nitroAmount = 100;
    this.isNitroActive = false;
    this.isBraking = false;
    this.isAccelerating = false;
    this.raceDistanceTraveled = 0;
    this.raceCoinsCollected = 0;
    this.raceNearMisses = 0;
    this.raceTimeElapsed = 0;
    this.raceMissionProgress = 0;
    this.hasCrashed = false;
    this.hasFinished = false;

    // Camera initial position
    this.camera.position.set(0, 2.5, 4.5);
    this.camera.lookAt(0, 1.2, -5);

    // Spawn entities
    this.spawnEntitiesForLevel(level);

    // UI Updates
    document.getElementById('hud-level-title').innerText = `Lvl ${level.levelNumber}: ${level.shortTitle}`;
    document.getElementById('hud-coins-count').innerText = '0';
    document.getElementById('hud-target-dist').innerText = `${level.distance}m`;
    this.showScreen('hud');

    // Audio
    this.sound.startEngine();
    this.sound.startMusic();

    this.state = 'playing';
  }

  // --- MAIN PHYSICS & SIMULATION UPDATE LOOP ---

  updateGameplay(delta) {
    if (this.state !== 'playing') return;

    const level = GAME_LEVELS[this.currentLevelIndex];
    const stats = this.storage.getEffectiveBikeStats(this.storage.data.selectedBikeId);

    this.raceTimeElapsed += delta;

    // 1. INPUT & ACCELERATION PHYSICS
    const accelInput = this.keys.accel;
    const brakeInput = this.keys.brake;
    const nitroInput = this.keys.nitro && this.nitroAmount > 5;

    this.isAccelerating = accelInput;
    this.isBraking = brakeInput;

    // Top speed calculation (converted from km/h to m/s)
    let maxSpeedKmh = stats.maxSpeed;
    if (nitroInput) {
      maxSpeedKmh += stats.nitroPower;
      this.nitroAmount = Math.max(0, this.nitroAmount - delta * 25);
      if (!this.isNitroActive) {
        this.isNitroActive = true;
        this.sound.startNitro();
        if (window.AndroidBridge && window.AndroidBridge.vibrate) {
          window.AndroidBridge.vibrate(50);
        }
      }
    } else {
      if (this.isNitroActive) {
        this.isNitroActive = false;
        this.sound.stopNitro();
      }
      // Slowly recharge nitro
      this.nitroAmount = Math.min(100, this.nitroAmount + delta * 5);
    }

    const maxSpeedMs = maxSpeedKmh / 3.6;
    const accelRate = stats.accel;
    const brakeRate = stats.braking;

    if (brakeInput) {
      this.playerSpeed = Math.max(0, this.playerSpeed - brakeRate * delta);
      if (this.playerSpeed > 10) {
        this.sound.playBrake();
        this.particles.emitBrakeSmoke(this.playerBike.position);
      }
      if (this.playerBike.tailLight) {
        this.playerBike.tailLight.scale.set(1.5, 1.5, 1.5);
      }
    } else if (accelInput) {
      this.playerSpeed = Math.min(maxSpeedMs, this.playerSpeed + accelRate * delta);
      if (this.playerBike.tailLight) {
        this.playerBike.tailLight.scale.set(1.0, 1.0, 1.0);
      }
    } else {
      // Coasting / natural rolling drag
      this.playerSpeed = Math.max(0, this.playerSpeed - 9.0 * delta);
    }

    const currentSpeedKmh = Math.round(this.playerSpeed * 3.6);

    // 2. STEERING & LATERAL LEANING PHYSICS
    let steerDir = 0;
    if (this.keys.left) steerDir -= 1;
    if (this.keys.right) steerDir += 1;

    // Handling response rate
    const handlingSpeed = stats.handling * (0.8 + (this.playerSpeed / maxSpeedMs) * 0.6);
    this.targetLaneX += steerDir * handlingSpeed * delta;
    // Clamp to road boundaries
    const maxBound = (this.roadWidth / 2) - 0.9;
    this.targetLaneX = Math.max(-maxBound, Math.min(maxBound, this.targetLaneX));

    // Smooth lateral interpolation
    this.playerLaneX += (this.targetLaneX - this.playerLaneX) * Math.min(1, delta * 14);

    // Target motorcycle leaning angle in radians
    const targetLean = -steerDir * (0.45 * Math.min(1, this.playerSpeed / 15));
    this.playerLean += (targetLean - this.playerLean) * Math.min(1, delta * 12);

    // Forward motion distance
    const forwardDistance = this.playerSpeed * delta;
    this.raceDistanceTraveled += forwardDistance;
    this.playerPos.z -= forwardDistance;
    this.playerPos.x = this.playerLaneX;

    // Update Bike Position & Rotation
    this.playerBike.position.set(this.playerPos.x, 0, this.playerPos.z);
    this.playerBike.rotation.z = this.playerLean; // Leaning into the turn
    this.playerBike.rotation.y = steerDir * -0.06; // Slight front yaw

    // Spin wheels
    if (this.playerBike.frontWheel) {
      this.playerBike.frontWheel.rotation.x -= this.playerSpeed * delta * 4;
    }
    if (this.playerBike.rearWheel) {
      this.playerBike.rearWheel.rotation.x -= this.playerSpeed * delta * 4;
    }

    // Particle effects
    if (this.isNitroActive && this.playerBike.exhaustTip) {
      const tipWorldPos = new THREE.Vector3();
      this.playerBike.exhaustTip.getWorldPosition(tipWorldPos);
      this.particles.emitNitroFlames(tipWorldPos, true);
    }
    this.particles.updateSpeedLines(this.camera.position, this.isNitroActive, this.playerSpeed / maxSpeedMs);
    this.particles.update(delta);

    // 3. ROAD RECYCLING
    // Recycle road segments that fell behind player
    const recycleThreshold = this.playerPos.z + 50;
    for (let seg of this.roadSegments) {
      if (seg.position.z > recycleThreshold) {
        // Find furthest ahead road segment
        let minZ = 0;
        for (let s of this.roadSegments) {
          if (s.position.z < minZ) minZ = s.position.z;
        }
        seg.position.z = minZ - seg.segmentLength;
      }
    }

    // 4. TRAFFIC MOVEMENT & COLLISION DETECTION
    for (let i = 0; i < this.trafficCars.length; i++) {
      const car = this.trafficCars[i];
      // Traffic drives forward (down the road in -Z direction)
      car.position.z -= car.speed * delta;

      // Spin wheels
      if (car.wheels) {
        for (let w of car.wheels) w.rotation.x -= car.speed * delta * 3;
      }

      // Check distance to player
      const dz = Math.abs(car.position.z - this.playerPos.z);
      const dx = Math.abs(car.position.x - this.playerPos.x);

      // NEAR-MISS DETECTION:
      if (!car.passed && this.playerPos.z < car.position.z && dz < 2.5 && dx < 2.2 && dx > 0.8 && this.playerSpeed > 25) {
        car.passed = true;
        this.triggerNearMiss(car.position);
      }

      // COLLISION DETECTION:
      const hitZ = (car.hitLength || 3.0) / 2 + 0.6;
      const hitX = (car.hitRadius || 0.9) + 0.35;
      if (dz < hitZ && dx < hitX && !this.hasCrashed) {
        this.triggerCrash(car);
        return;
      }
    }

    // 5. COIN COLLECTION
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const coin = this.coins[i];
      coin.rotation.y += delta * 4;
      const dz = Math.abs(coin.position.z - this.playerPos.z);
      const dx = Math.abs(coin.position.x - this.playerPos.x);
      if (dz < 1.2 && dx < 1.2) {
        this.collectCoin(coin, i);
      }
    }

    // 6. NITRO PICKUPS
    for (let i = this.nitroPickups.length - 1; i >= 0; i--) {
      const n = this.nitroPickups[i];
      n.rotation.y += delta * 3;
      const dz = Math.abs(n.position.z - this.playerPos.z);
      const dx = Math.abs(n.position.x - this.playerPos.x);
      if (dz < 1.2 && dx < 1.2) {
        this.nitroAmount = Math.min(100, this.nitroAmount + 40);
        this.sound.playCoin();
        this.scene.remove(n);
        this.nitroPickups.splice(i, 1);
        this.showToast('NITRO BOOST REFILLED! ⚡');
      }
    }

    // 7. ROAD OBSTACLES (CONES)
    for (let obs of this.obstacles) {
      const dz = Math.abs(obs.position.z - this.playerPos.z);
      const dx = Math.abs(obs.position.x - this.playerPos.x);
      if (dz < 0.8 && dx < 0.6 && !this.hasCrashed) {
        // Cone causes slight speed bump and spin
        this.playerSpeed = Math.max(0, this.playerSpeed - 12);
        this.particles.emitSparks(obs.position, 10);
        this.sound.playBrake();
        obs.position.y = -10; // Dismiss
      }
    }

    // 8. FINISH LINE CHECK
    if (this.finishLineArch && this.playerPos.z <= this.finishLineArch.position.z && !this.hasFinished) {
      this.triggerFinishLevel();
      return;
    }

    // 9. DYNAMIC CHASE CAMERA WITH SHAKE & TILT
    const targetCamX = this.playerPos.x * 0.85;
    const targetCamY = 2.4 + (this.playerSpeed / maxSpeedMs) * 0.4;
    const targetCamZ = this.playerPos.z + 4.2 + (this.isNitroActive ? 0.6 : 0);

    this.camera.position.x += (targetCamX - this.camera.position.x) * Math.min(1, delta * 10);
    this.camera.position.y += (targetCamY - this.camera.position.y) * Math.min(1, delta * 10);
    this.camera.position.z += (targetCamZ - this.camera.position.z) * Math.min(1, delta * 14);

    // Camera shake during high speed / nitro
    if (this.isNitroActive || currentSpeedKmh > 200) {
      const shakeAmt = (this.isNitroActive ? 0.04 : 0.02);
      this.camera.position.x += (Math.random() - 0.5) * shakeAmt;
      this.camera.position.y += (Math.random() - 0.5) * shakeAmt;
    }

    this.camera.lookAt(this.playerPos.x * 0.5, 1.2, this.playerPos.z - 8.0);

    // 10. UPDATE AUDIO
    this.sound.updateEngine(currentSpeedKmh, stats.maxSpeed, accelInput, brakeInput);

    // 11. UPDATE HUD
    this.updateHUD(currentSpeedKmh, maxSpeedKmh, level);
  }

  // --- EVENTS & TRIGGERS ---

  triggerNearMiss(pos) {
    this.raceNearMisses++;
    this.raceCoinsCollected += 15;
    this.nitroAmount = Math.min(100, this.nitroAmount + 15);
    this.sound.playNearMiss();
    this.showFloatingScore('CLOSE CALL! +15 🪙', pos);
    if (window.AndroidBridge && window.AndroidBridge.vibrate) {
      window.AndroidBridge.vibrate(30);
    }
  }

  collectCoin(coinMesh, index) {
    this.raceCoinsCollected++;
    this.sound.playCoin();
    this.particles.emitCoinSparkle(coinMesh.position);
    this.scene.remove(coinMesh);
    this.coins.splice(index, 1);
    document.getElementById('hud-coins-count').innerText = this.raceCoinsCollected;
  }

  triggerCrash(obstacleMesh) {
    this.hasCrashed = true;
    this.state = 'gameover';
    this.sound.stopEngine();
    this.sound.stopNitro();
    this.sound.playCrash();
    this.particles.emitSparks(this.playerBike.position, 60);

    if (window.AndroidBridge && window.AndroidBridge.vibrate) {
      window.AndroidBridge.vibrate(300);
    }

    // Show crash game over screen after brief explosion pause
    setTimeout(() => {
      this.showGameOverModal();
    }, 900);
  }

  triggerFinishLevel() {
    this.hasFinished = true;
    this.state = 'victory';
    this.sound.stopEngine();
    this.sound.stopNitro();
    this.sound.playVictory();

    const level = GAME_LEVELS[this.currentLevelIndex];

    // Calculate stars (1-3) based on time
    let stars = 1;
    if (this.raceTimeElapsed <= level.targetTime) {
      stars = 3;
    } else if (this.raceTimeElapsed <= level.targetTime * 1.35) {
      stars = 2;
    }

    // Rewards calculation
    const baseCoins = level.coinsReward;
    const collectedCoins = this.raceCoinsCollected * 10;
    const nearMissBonus = this.raceNearMisses * 25;
    const totalEarnedCoins = baseCoins + collectedCoins + nearMissBonus;
    const earnedXp = level.xpReward;

    // Save progression
    this.storage.addCoins(totalEarnedCoins);
    this.storage.addXp(earnedXp);
    this.storage.setLevelResult(level.levelNumber, stars, Math.round(this.raceTimeElapsed));

    // Show Victory Screen
    setTimeout(() => {
      this.showVictoryModal(level, stars, totalEarnedCoins, earnedXp);
    }, 500);
  }

  // --- UI SCREENS & MODALS ---

  showScreen(screenId) {
    const screens = ['menu-screen', 'garage-screen', 'levels-screen', 'daily-modal', 'settings-modal', 'hud-screen', 'pause-modal', 'gameover-modal', 'victory-modal'];
    screens.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    });

    const target = document.getElementById(screenId);
    if (target) {
      target.classList.remove('hidden');
    }
  }

  updateHUD(speedKmh, maxSpeedKmh, level) {
    // Speedometer
    document.getElementById('hud-speed-val').innerText = speedKmh;
    const speedRatio = Math.min(1.0, speedKmh / maxSpeedKmh);
    const gaugeBar = document.getElementById('hud-speed-gauge-fill');
    if (gaugeBar) {
      gaugeBar.style.width = `${speedRatio * 100}%`;
    }

    // Distance & Progress
    const progressRatio = Math.min(1.0, this.raceDistanceTraveled / level.distance);
    document.getElementById('hud-progress-fill').style.width = `${progressRatio * 100}%`;
    document.getElementById('hud-current-dist').innerText = `${Math.round(this.raceDistanceTraveled)}m`;

    // Nitro Bar
    const nitroFill = document.getElementById('hud-nitro-fill');
    if (nitroFill) {
      nitroFill.style.width = `${this.nitroAmount}%`;
      if (this.isNitroActive) {
        nitroFill.classList.add('nitro-pulsing');
      } else {
        nitroFill.classList.remove('nitro-pulsing');
      }
    }
  }

  showGameOverModal() {
    this.showScreen('gameover-modal');
    document.getElementById('gameover-dist').innerText = `${Math.round(this.raceDistanceTraveled)}m`;
    document.getElementById('gameover-coins').innerText = `+${this.raceCoinsCollected * 10} Coins`;
    this.storage.addCoins(this.raceCoinsCollected * 10);
  }

  showVictoryModal(level, stars, totalCoins, xp) {
    this.showScreen('victory-modal');
    document.getElementById('victory-level-title').innerText = `${level.title} COMPLETED!`;
    document.getElementById('victory-time').innerText = `${Math.round(this.raceTimeElapsed)}s`;
    document.getElementById('victory-coins').innerText = `+${totalCoins} Coins`;
    document.getElementById('victory-xp').innerText = `+${xp} XP`;
    document.getElementById('victory-nearmiss').innerText = `${this.raceNearMisses} Close Calls`;

    // Stars render
    const starsContainer = document.getElementById('victory-stars-row');
    starsContainer.innerHTML = '';
    for (let s = 1; s <= 3; s++) {
      const star = document.createElement('span');
      star.className = `star-icon ${s <= stars ? 'active' : ''}`;
      star.innerHTML = '★';
      starsContainer.appendChild(star);
    }
  }

  showFloatingScore(text, worldPos) {
    const el = document.createElement('div');
    el.className = 'floating-score';
    el.innerText = text;
    document.body.appendChild(el);
    setTimeout(() => {
      el.remove();
    }, 1200);
  }

  showToast(text) {
    let toast = document.getElementById('game-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'game-toast';
      document.body.appendChild(toast);
    }
    toast.innerText = text;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2000);
  }

  // --- SHOWROOM & GARAGE ---

  setupMenuShowroom() {
    this.state = 'menu';
    this.clearWorldEntities();

    // Soft showroom studio lighting
    this.scene.background = new THREE.Color(0x0a0f1d);
    this.scene.fog.color = new THREE.Color(0x0a0f1d);
    this.ambientLight.color = new THREE.Color(0x38bdf8);
    this.dirLight.color = new THREE.Color(0xffffff);

    // Circular showroom platform
    const platformGeo = new THREE.CylinderGeometry(4.5, 4.8, 0.4, 32);
    const platformMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 });
    this.platform = new THREE.Mesh(platformGeo, platformMat);
    this.platform.position.y = -0.2;
    this.scene.add(this.platform);

    // Neon showroom floor ring
    const ringGeo = new THREE.RingGeometry(4.55, 4.75, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 0.01;
    this.scene.add(ring);

    this.updateShowroomBike();

    this.camera.position.set(0, 1.8, 3.8);
    this.camera.lookAt(0, 0.8, 0);

    this.updateMenuHeaderStats();
  }

  updateShowroomBike() {
    if (this.showroomBike) {
      this.scene.remove(this.showroomBike);
    }
    const bikeId = this.storage.data.selectedBikeId;
    const color = this.storage.data.bikeColors[bikeId] || '#f97316';
    this.showroomBike = ModelBuilder.createPlayerBike(bikeId, color);
    this.scene.add(this.showroomBike);
  }

  updateMenuHeaderStats() {
    document.getElementById('menu-coins-val').innerText = this.storage.data.coins.toLocaleString();
    document.getElementById('menu-player-lvl').innerText = `Lvl ${this.storage.data.playerLevel}`;
    const xpProgress = (this.storage.data.xp % 1000) / 10;
    const xpBar = document.getElementById('menu-xp-bar-fill');
    if (xpBar) xpBar.style.width = `${xpProgress}%`;
  }

  // --- GARAGE & UPGRADES SYSTEM ---

  openGarage() {
    this.state = 'garage';
    this.showScreen('garage-screen');
    this.sound.playButtonClick();
    this.renderGarageBikesList();
    this.renderGarageUpgrades();
  }

  renderGarageBikesList() {
    const listEl = document.getElementById('garage-bikes-carousel');
    listEl.innerHTML = '';

    BIKES.forEach(b => {
      const isUnlocked = this.storage.data.unlockedBikes.includes(b.id);
      const isSelected = this.storage.data.selectedBikeId === b.id;
      const card = document.createElement('div');
      card.className = `bike-card ${isSelected ? 'selected' : ''} ${!isUnlocked ? 'locked' : ''}`;

      card.innerHTML = `
        <div class="bike-card-header">
          <span class="bike-card-category">${b.category}</span>
          <span class="bike-card-status">${isSelected ? 'EQUIPPED' : isUnlocked ? 'OWNED' : `${b.price.toLocaleString()} Coins`}</span>
        </div>
        <div class="bike-card-title">${b.name}</div>
        <div class="bike-card-stats-preview">
          <div>Speed: ${b.baseStats.maxSpeed} km/h</div>
          <div>Power: Lvl ${b.baseStats.engine}</div>
        </div>
      `;

      card.addEventListener('click', () => {
        this.selectOrBuyBike(b);
      });

      listEl.appendChild(card);
    });

    this.renderGarageColors();
  }

  selectOrBuyBike(bike) {
    this.sound.playButtonClick();
    const isUnlocked = this.storage.data.unlockedBikes.includes(bike.id);

    if (isUnlocked) {
      this.storage.data.selectedBikeId = bike.id;
      this.storage.save();
      this.updateShowroomBike();
      this.renderGarageBikesList();
      this.renderGarageUpgrades();
      this.showToast(`${bike.name} EQUIPPED!`);
    } else {
      // Buy prompt
      if (this.storage.data.coins >= bike.price) {
        this.storage.data.coins -= bike.price;
        this.storage.data.unlockedBikes.push(bike.id);
        this.storage.data.selectedBikeId = bike.id;
        this.storage.save();
        this.sound.playVictory();
        this.updateShowroomBike();
        this.renderGarageBikesList();
        this.renderGarageUpgrades();
        this.updateMenuHeaderStats();
        this.showToast(`UNLOCKED ${bike.name}! 🎉`);
      } else {
        this.showToast(`Need ${bike.price.toLocaleString()} Coins! Keep racing!`);
      }
    }
  }

  renderGarageColors() {
    const palette = document.getElementById('garage-color-swatches');
    if (!palette) return;
    palette.innerHTML = '';

    const currentBike = BIKES.find(b => b.id === this.storage.data.selectedBikeId) || BIKES[0];
    const currentColor = this.storage.data.bikeColors[currentBike.id] || currentBike.colors[0];

    currentBike.colors.forEach(hex => {
      const swatch = document.createElement('div');
      swatch.className = `color-swatch ${hex === currentColor ? 'active' : ''}`;
      swatch.style.backgroundColor = hex;
      swatch.addEventListener('click', () => {
        this.storage.data.bikeColors[currentBike.id] = hex;
        this.storage.save();
        this.updateShowroomBike();
        this.renderGarageColors();
        this.sound.playButtonClick();
      });
      palette.appendChild(swatch);
    });
  }

  renderGarageUpgrades() {
    const container = document.getElementById('garage-upgrades-grid');
    if (!container) return;
    container.innerHTML = '';

    const bikeId = this.storage.data.selectedBikeId;
    const stats = this.storage.getEffectiveBikeStats(bikeId);
    const ups = stats.upgrades;

    const categories = [
      { key: 'engine', label: 'Engine Power', icon: '⚡', val: `Stage ${ups.engine}/10` },
      { key: 'maxSpeed', label: 'Max Speed', icon: '🚀', val: `${stats.maxSpeed} KM/H` },
      { key: 'accel', label: 'Acceleration', icon: '⏱️', val: `Stage ${ups.accel}/10` },
      { key: 'braking', label: 'Braking Force', icon: '🛑', val: `Stage ${ups.braking}/10` },
      { key: 'handling', label: 'Cornering Handling', icon: '🎯', val: `Stage ${ups.handling}/10` },
      { key: 'nitroPower', label: 'Nitro Boost', icon: '🔥', val: `+${stats.nitroPower} KM/H` }
    ];

    categories.forEach(cat => {
      const currentLvl = ups[cat.key];
      const isMax = currentLvl >= 10;
      const nextCost = isMax ? 0 : UPGRADE_COSTS[currentLvl];

      const item = document.createElement('div');
      item.className = 'upgrade-item-card';
      item.innerHTML = `
        <div class="upgrade-item-header">
          <span class="upgrade-icon">${cat.icon}</span>
          <span class="upgrade-title">${cat.label}</span>
          <span class="upgrade-stage">${cat.val}</span>
        </div>
        <div class="upgrade-bar">
          <div class="upgrade-bar-fill" style="width: ${(currentLvl / 10) * 100}%"></div>
        </div>
        <button class="upgrade-action-btn ${isMax ? 'disabled' : ''}">
          ${isMax ? 'MAX LEVEL' : `UPGRADE (${nextCost.toLocaleString()} 🪙)`}
        </button>
      `;

      const btn = item.querySelector('.upgrade-action-btn');
      if (!isMax) {
        btn.addEventListener('click', () => {
          this.performUpgrade(bikeId, cat.key, nextCost);
        });
      }

      container.appendChild(item);
    });
  }

  performUpgrade(bikeId, statKey, cost) {
    if (this.storage.data.coins >= cost) {
      this.storage.data.coins -= cost;
      this.storage.data.upgrades[bikeId][statKey]++;
      this.storage.save();
      this.sound.playCoin();
      this.renderGarageUpgrades();
      this.renderGarageBikesList();
      this.updateMenuHeaderStats();
      this.showToast(`UPGRADED ${statKey.toUpperCase()} TO LEVEL ${this.storage.data.upgrades[bikeId][statKey]}!`);
    } else {
      this.showToast(`Not enough coins! Win races to earn more.`);
    }
  }

  // --- LEVEL SELECTION SCREEN ---

  openLevelsScreen() {
    this.state = 'levels';
    this.showScreen('levels-screen');
    this.sound.playButtonClick();
    this.renderLevelsGrid();
  }

  renderLevelsGrid() {
    const grid = document.getElementById('levels-grid-container');
    grid.innerHTML = '';

    const unlocked = this.storage.data.unlockedLevel;

    GAME_LEVELS.forEach((lvl, idx) => {
      const isUnlocked = lvl.levelNumber <= unlocked;
      const stars = this.storage.data.levelStars[lvl.levelNumber] || 0;
      const bestTime = this.storage.data.levelBestTimes[lvl.levelNumber];

      const card = document.createElement('div');
      card.className = `level-select-card ${isUnlocked ? 'unlocked' : 'locked'}`;

      let starHtml = '';
      for (let s = 1; s <= 3; s++) {
        starHtml += `<span class="${s <= stars ? 'star-filled' : 'star-empty'}">★</span>`;
      }

      card.innerHTML = `
        <div class="level-num">${lvl.levelNumber}</div>
        <div class="level-name">${lvl.shortTitle}</div>
        <div class="level-env">${lvl.environment.name} • ${lvl.distance}m</div>
        <div class="level-stars">${starHtml}</div>
        ${bestTime ? `<div class="level-best-time">Best: ${bestTime}s</div>` : ''}
      `;

      if (isUnlocked) {
        card.addEventListener('click', () => {
          this.sound.playButtonClick();
          this.startRace(idx);
        });
      }

      grid.appendChild(card);
    });
  }

  // --- DAILY REWARDS MODAL ---

  openDailyRewards() {
    this.sound.playButtonClick();
    this.showScreen('daily-modal');
    const container = document.getElementById('daily-rewards-container');
    container.innerHTML = '';

    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const canClaim = (now - this.storage.data.lastDailyClaim) > oneDayMs;
    const streak = this.storage.data.dailyStreak % 7;

    DAILY_REWARDS.forEach((rew, idx) => {
      const isCurrent = idx === streak;
      const isClaimed = idx < streak;
      const card = document.createElement('div');
      card.className = `daily-day-card ${isCurrent ? 'current' : ''} ${isClaimed ? 'claimed' : ''}`;

      card.innerHTML = `
        <div class="daily-day-title">Day ${rew.day}</div>
        <div class="daily-day-icon">${rew.day === 7 ? '👑' : '🪙'}</div>
        <div class="daily-day-reward">${rew.label}</div>
        <div class="daily-status">${isClaimed ? 'CLAIMED' : isCurrent ? (canClaim ? 'READY!' : 'LOCKED') : 'WAIT'}</div>
      `;

      if (isCurrent && canClaim) {
        card.addEventListener('click', () => {
          this.claimDailyReward(rew);
        });
      }

      container.appendChild(card);
    });

    const claimBtn = document.getElementById('daily-claim-btn');
    if (canClaim) {
      claimBtn.disabled = false;
      claimBtn.innerText = `CLAIM DAY ${streak + 1} REWARD!`;
      claimBtn.onclick = () => {
        this.claimDailyReward(DAILY_REWARDS[streak]);
      };
    } else {
      claimBtn.disabled = true;
      claimBtn.innerText = 'COME BACK TOMORROW!';
    }
  }

  claimDailyReward(reward) {
    this.storage.addCoins(reward.coins);
    this.storage.data.lastDailyClaim = Date.now();
    this.storage.data.dailyStreak++;
    this.storage.save();
    this.sound.playVictory();
    this.updateMenuHeaderStats();
    this.showToast(`CLAIMED ${reward.label}! 🎉`);
    this.openDailyRewards(); // Re-render
  }

  // --- SETTINGS MODAL ---

  openSettings() {
    this.sound.playButtonClick();
    this.showScreen('settings-modal');

    // Sync settings toggles
    const s = this.storage.data.settings;
    document.getElementById('setting-sound-toggle').checked = s.sound;
    document.getElementById('setting-music-toggle').checked = s.music;
    document.getElementById('setting-haptics-toggle').checked = s.haptics;

    document.querySelectorAll('.gfx-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.gfx === s.graphics);
    });
  }

  // --- INPUT & EVENT BINDINGS ---

  bindEvents() {
    // Window Resize
    window.addEventListener('resize', () => {
      if (this.camera && this.renderer) {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
      }
    });

    // Touch Controls using PointerEvents for zero-latency multi-touch
    const bindTouchButton = (elementId, keyName) => {
      const el = document.getElementById(elementId);
      if (!el) return;

      const handlePress = (e) => {
        e.preventDefault();
        this.keys[keyName] = true;
        el.classList.add('pressed');
        if (window.AndroidBridge && window.AndroidBridge.vibrate && this.storage.data.settings.haptics) {
          window.AndroidBridge.vibrate(20);
        }
      };

      const handleRelease = (e) => {
        e.preventDefault();
        this.keys[keyName] = false;
        el.classList.remove('pressed');
      };

      el.addEventListener('pointerdown', handlePress);
      el.addEventListener('pointerup', handleRelease);
      el.addEventListener('pointercancel', handleRelease);
      el.addEventListener('pointerleave', handleRelease);
    };

    bindTouchButton('btn-touch-left', 'left');
    bindTouchButton('btn-touch-right', 'right');
    bindTouchButton('btn-touch-accel', 'accel');
    bindTouchButton('btn-touch-brake', 'brake');
    bindTouchButton('btn-touch-nitro', 'nitro');

    // Keyboard support for desktop browsers
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keys.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.right = true;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') this.keys.accel = true;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') this.keys.brake = true;
      if (e.key === ' ' || e.key === 'Shift') this.keys.nitro = true;
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (this.state === 'playing') this.pauseGame();
        else if (this.state === 'paused') this.resumeGame();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.right = false;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') this.keys.accel = false;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') this.keys.brake = false;
      if (e.key === ' ' || e.key === 'Shift') this.keys.nitro = false;
    });

    // Pause button in HUD
    document.getElementById('hud-pause-btn').addEventListener('click', () => {
      this.pauseGame();
    });

    // Pause Modal Buttons
    document.getElementById('pause-resume-btn').addEventListener('click', () => {
      this.resumeGame();
    });
    document.getElementById('pause-restart-btn').addEventListener('click', () => {
      this.startRace(this.currentLevelIndex);
    });
    document.getElementById('pause-quit-btn').addEventListener('click', () => {
      this.sound.stopEngine();
      this.sound.stopNitro();
      this.sound.stopMusic();
      this.setupMenuShowroom();
      this.showScreen('menu-screen');
    });

    // Game Over & Victory buttons
    document.getElementById('gameover-retry-btn').addEventListener('click', () => {
      this.startRace(this.currentLevelIndex);
    });
    document.getElementById('gameover-garage-btn').addEventListener('click', () => {
      this.openGarage();
    });
    document.getElementById('gameover-menu-btn').addEventListener('click', () => {
      this.setupMenuShowroom();
      this.showScreen('menu-screen');
    });

    document.getElementById('victory-next-btn').addEventListener('click', () => {
      const nextLvl = this.currentLevelIndex + 1;
      if (nextLvl < GAME_LEVELS.length) {
        this.startRace(nextLvl);
      } else {
        this.openLevelsScreen();
      }
    });
    document.getElementById('victory-replay-btn').addEventListener('click', () => {
      this.startRace(this.currentLevelIndex);
    });
    document.getElementById('victory-garage-btn').addEventListener('click', () => {
      this.openGarage();
    });
    document.getElementById('victory-menu-btn').addEventListener('click', () => {
      this.setupMenuShowroom();
      this.showScreen('menu-screen');
    });

    // Menu Navigation Buttons
    document.getElementById('menu-play-btn').addEventListener('click', () => {
      this.sound.playButtonClick();
      this.startRace(this.storage.data.unlockedLevel - 1);
    });
    document.getElementById('menu-garage-btn').addEventListener('click', () => {
      this.openGarage();
    });
    document.getElementById('menu-upgrades-btn').addEventListener('click', () => {
      this.openGarage();
    });
    document.getElementById('menu-levels-btn').addEventListener('click', () => {
      this.openLevelsScreen();
    });
    document.getElementById('menu-daily-btn').addEventListener('click', () => {
      this.openDailyRewards();
    });
    document.getElementById('menu-settings-btn').addEventListener('click', () => {
      this.openSettings();
    });

    // Back buttons from sub-screens
    document.getElementById('garage-back-btn').addEventListener('click', () => {
      this.sound.playButtonClick();
      this.setupMenuShowroom();
      this.showScreen('menu-screen');
    });
    document.getElementById('levels-back-btn').addEventListener('click', () => {
      this.sound.playButtonClick();
      this.setupMenuShowroom();
      this.showScreen('menu-screen');
    });
    document.getElementById('daily-close-btn').addEventListener('click', () => {
      this.sound.playButtonClick();
      this.showScreen('menu-screen');
    });
    document.getElementById('settings-close-btn').addEventListener('click', () => {
      this.sound.playButtonClick();
      this.showScreen(this.state === 'playing' ? 'pause-modal' : 'menu-screen');
    });

    // Settings change events
    document.getElementById('setting-sound-toggle').addEventListener('change', (e) => {
      this.storage.data.settings.sound = e.target.checked;
      this.storage.save();
      this.sound.setSoundEnabled(e.target.checked);
    });
    document.getElementById('setting-music-toggle').addEventListener('change', (e) => {
      this.storage.data.settings.music = e.target.checked;
      this.storage.save();
      this.sound.setMusicEnabled(e.target.checked);
    });
    document.getElementById('setting-haptics-toggle').addEventListener('change', (e) => {
      this.storage.data.settings.haptics = e.target.checked;
      this.storage.save();
    });

    document.querySelectorAll('.gfx-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.gfx-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.storage.data.settings.graphics = btn.dataset.gfx;
        this.storage.save();
        this.renderer.shadowMap.enabled = btn.dataset.gfx === 'high';
        this.showToast(`GRAPHICS SET TO ${btn.dataset.gfx.toUpperCase()}`);
      });
    });
  }

  pauseGame() {
    if (this.state === 'playing') {
      this.state = 'paused';
      this.sound.stopEngine();
      this.sound.stopNitro();
      this.showScreen('pause-modal');
    }
  }

  resumeGame() {
    if (this.state === 'paused') {
      this.state = 'playing';
      this.sound.startEngine();
      this.showScreen('hud');
    }
  }

  initUI() {
    this.updateMenuHeaderStats();
  }

  // --- ANIMATION FRAME ---

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = Math.min(0.1, this.clock.getDelta());

    if (this.state === 'playing') {
      this.updateGameplay(delta);
    } else if (this.state === 'menu' || this.state === 'garage') {
      // Rotate showroom motorcycle smoothly
      if (this.showroomBike) {
        this.showroomBike.rotation.y += delta * 0.6;
      }
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }
}

// Start Game Engine when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  window.gameApp = new GameApp();
});
