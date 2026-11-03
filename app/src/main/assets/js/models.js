/**
 * Ultimate Bike Racing 3D - Procedural 3D Models
 * Builds high-fidelity 3D motorcycles, animated riders, traffic vehicles, and environment assets
 */

const ModelBuilder = {
  // Shared materials & geometries cache for extreme mobile performance
  materials: {},

  getMaterial(key, creator) {
    if (!this.materials[key]) {
      this.materials[key] = creator();
    }
    return this.materials[key];
  },

  /**
   * Builds player motorcycle with animated 3D rider
   */
  createPlayerBike(bikeId, colorHex = '#f97316') {
    const root = new THREE.Group();
    const primaryColor = new THREE.Color(colorHex);
    const darkMetal = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.5, metalness: 0.8 });
    const chrome = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2, metalness: 0.95 });
    const rubber = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9, metalness: 0.1 });
    const bodyMat = new THREE.MeshStandardMaterial({ color: primaryColor, roughness: 0.25, metalness: 0.6 });
    const glass = new THREE.MeshStandardMaterial({ color: 0x0284c7, transparent: true, opacity: 0.65, roughness: 0.1 });
    const emissionCyan = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const emissionRed = new THREE.MeshBasicMaterial({ color: 0xff0033 });

    // 1. CHASSIS / FRAME
    const frameGeo = new THREE.BoxGeometry(0.35, 0.45, 1.2);
    const frame = new THREE.Mesh(frameGeo, darkMetal);
    frame.position.set(0, 0.55, 0);
    frame.castShadow = true;
    root.add(frame);

    // Engine block
    const engineGeo = new THREE.BoxGeometry(0.32, 0.35, 0.5);
    const engine = new THREE.Mesh(engineGeo, chrome);
    engine.position.set(0, 0.4, 0);
    root.add(engine);

    // 2. FUEL TANK & SEAT
    const tankGeo = new THREE.CylinderGeometry(0.22, 0.26, 0.65, 8);
    tankGeo.rotateX(Math.PI / 2);
    const tank = new THREE.Mesh(tankGeo, bodyMat);
    tank.position.set(0, 0.82, -0.05);
    tank.scale.set(0.9, 0.7, 1.1);
    root.add(tank);

    const seatGeo = new THREE.BoxGeometry(0.28, 0.1, 0.45);
    const seat = new THREE.Mesh(seatGeo, darkMetal);
    seat.position.set(0, 0.76, 0.35);
    root.add(seat);

    // 3. REAR TAIL COWL
    const tailGeo = new THREE.ConeGeometry(0.22, 0.55, 6);
    tailGeo.rotateX(-Math.PI / 2);
    const tail = new THREE.Mesh(tailGeo, bodyMat);
    tail.position.set(0, 0.8, 0.75);
    root.add(tail);

    // Taillight
    const tailLightGeo = new THREE.BoxGeometry(0.18, 0.06, 0.04);
    const tailLight = new THREE.Mesh(tailLightGeo, emissionRed);
    tailLight.position.set(0, 0.8, 1.0);
    root.add(tailLight);
    root.tailLight = tailLight;

    // 4. FRONT FORKS & FAIRING
    const forkGroup = new THREE.Group();
    const forkBarGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.75, 8);
    const leftFork = new THREE.Mesh(forkBarGeo, chrome);
    leftFork.position.set(0.12, 0.45, -0.65);
    leftFork.rotation.x = 0.32;
    forkGroup.add(leftFork);

    const rightFork = new THREE.Mesh(forkBarGeo, chrome);
    rightFork.position.set(-0.12, 0.45, -0.65);
    rightFork.rotation.x = 0.32;
    forkGroup.add(rightFork);

    // Handlebars
    const barGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.55, 8);
    barGeo.rotateZ(Math.PI / 2);
    const bar = new THREE.Mesh(barGeo, darkMetal);
    bar.position.set(0, 0.85, -0.55);
    forkGroup.add(bar);

    // Grips
    const gripGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.12, 8);
    gripGeo.rotateZ(Math.PI / 2);
    const leftGrip = new THREE.Mesh(gripGeo, rubber);
    leftGrip.position.set(0.24, 0.85, -0.55);
    forkGroup.add(leftGrip);
    const rightGrip = new THREE.Mesh(gripGeo, rubber);
    rightGrip.position.set(-0.24, 0.85, -0.55);
    forkGroup.add(rightGrip);

    // Front Fairing & Windscreen
    const fairingGeo = new THREE.ConeGeometry(0.28, 0.6, 6);
    fairingGeo.rotateX(Math.PI / 2.3);
    const fairing = new THREE.Mesh(fairingGeo, bodyMat);
    fairing.position.set(0, 0.8, -0.65);
    forkGroup.add(fairing);

    const windshieldGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.35, 8, 1, false, 0, Math.PI);
    windshieldGeo.rotateX(0.4);
    const windshield = new THREE.Mesh(windshieldGeo, glass);
    windshield.position.set(0, 0.98, -0.62);
    forkGroup.add(windshield);

    // Headlight
    const headLightGeo = new THREE.BoxGeometry(0.18, 0.08, 0.06);
    const headLight = new THREE.Mesh(headLightGeo, emissionCyan);
    headLight.position.set(0, 0.72, -0.85);
    forkGroup.add(headLight);

    root.add(forkGroup);
    root.forkGroup = forkGroup;

    // 5. WHEELS (Detailed with alloy rims and brake discs)
    const createWheel = (isFront) => {
      const wheel = new THREE.Group();
      // Rubber tire
      const tireGeo = new THREE.TorusGeometry(0.28, 0.08, 10, 20);
      const tire = new THREE.Mesh(tireGeo, rubber);
      tire.castShadow = true;
      wheel.add(tire);

      // Rim
      const rimGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.08, 12);
      rimGeo.rotateX(Math.PI / 2);
      const rim = new THREE.Mesh(rimGeo, chrome);
      wheel.add(rim);

      // Brake disc
      const discGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.02, 10);
      discGeo.rotateX(Math.PI / 2);
      const disc = new THREE.Mesh(discGeo, darkMetal);
      wheel.add(disc);

      return wheel;
    };

    const frontWheel = createWheel(true);
    frontWheel.position.set(0, 0.35, -0.8);
    root.add(frontWheel);
    root.frontWheel = frontWheel;

    const rearWheel = createWheel(false);
    rearWheel.position.set(0, 0.35, 0.75);
    root.add(rearWheel);
    root.rearWheel = rearWheel;

    // 6. EXHAUST PIPE with Nitro Flame Socket
    const exhaustGeo = new THREE.CylinderGeometry(0.045, 0.06, 0.65, 8);
    exhaustGeo.rotateX(-Math.PI / 3);
    const exhaust = new THREE.Mesh(exhaustGeo, chrome);
    exhaust.position.set(0.18, 0.38, 0.5);
    root.add(exhaust);

    // Exhaust tip (origin for nitro flame particles)
    const exhaustTip = new THREE.Object3D();
    exhaustTip.position.set(0.18, 0.48, 0.82);
    root.add(exhaustTip);
    root.exhaustTip = exhaustTip;

    // 7. ANIMATED 3D RIDER (Helmet, Racing Suit, Tuck Position)
    const riderGroup = new THREE.Group();
    const suitMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
    const suitAccent = new THREE.MeshStandardMaterial({ color: primaryColor, roughness: 0.4 });
    const helmetMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2, metalness: 0.8 });
    const visorMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.9, roughness: 0.1 });

    // Rider torso (tucked down onto tank)
    const torsoGeo = new THREE.BoxGeometry(0.32, 0.4, 0.25);
    const torso = new THREE.Mesh(torsoGeo, suitAccent);
    torso.position.set(0, 1.05, 0.05);
    torso.rotation.x = 0.55; // Tucked forward
    riderGroup.add(torso);

    // Helmet
    const headGeo = new THREE.SphereGeometry(0.16, 12, 10);
    const helmet = new THREE.Mesh(headGeo, helmetMat);
    helmet.position.set(0, 1.3, -0.15);
    helmet.rotation.x = 0.3;
    riderGroup.add(helmet);

    // Visor
    const visorGeo = new THREE.BoxGeometry(0.18, 0.07, 0.12);
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 1.28, -0.26);
    riderGroup.add(visor);

    // Arms reaching to grips
    const armGeo = new THREE.CylinderGeometry(0.045, 0.04, 0.38, 8);
    armGeo.rotateX(0.7);

    const leftArm = new THREE.Mesh(armGeo, suitMat);
    leftArm.position.set(0.18, 1.0, -0.25);
    leftArm.rotation.z = -0.3;
    riderGroup.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, suitMat);
    rightArm.position.set(-0.18, 1.0, -0.25);
    rightArm.rotation.z = 0.3;
    riderGroup.add(rightArm);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.1, 0.3, 0.35);
    const leftLeg = new THREE.Mesh(legGeo, suitMat);
    leftLeg.position.set(0.16, 0.65, 0.2);
    riderGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, suitMat);
    rightLeg.position.set(-0.16, 0.65, 0.2);
    riderGroup.add(rightLeg);

    root.add(riderGroup);
    root.riderGroup = riderGroup;
    root.bodyMat = bodyMat;
    root.suitAccent = suitAccent;

    return root;
  },

  /**
   * Builds detailed 3D traffic vehicles
   */
  createTrafficCar(type = 'sedan', colorHex = 0xef4444) {
    const root = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.3, metalness: 0.5 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.1, metalness: 0.9 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.2, metalness: 0.9 });
    const rubberMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    const lightFront = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const lightBack = new THREE.MeshBasicMaterial({ color: 0xff1100 });

    if (type === 'truck') {
      // Big Semi-Truck with Trailer
      const cabGeo = new THREE.BoxGeometry(1.6, 1.8, 2.0);
      const cab = new THREE.Mesh(cabGeo, bodyMat);
      cab.position.set(0, 1.1, -2.5);
      cab.castShadow = true;
      root.add(cab);

      // Windshield
      const winGeo = new THREE.BoxGeometry(1.4, 0.7, 0.1);
      const win = new THREE.Mesh(winGeo, glassMat);
      win.position.set(0, 1.4, -3.5);
      root.add(win);

      // Huge Cargo Trailer
      const trailerGeo = new THREE.BoxGeometry(1.7, 2.2, 5.5);
      const trailerMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.6, metalness: 0.2 });
      const trailer = new THREE.Mesh(trailerGeo, trailerMat);
      trailer.position.set(0, 1.4, 1.4);
      trailer.castShadow = true;
      root.add(trailer);

      // Taillights
      const rlGeo = new THREE.BoxGeometry(0.4, 0.12, 0.05);
      const rl = new THREE.Mesh(rlGeo, lightBack);
      rl.position.set(0, 0.6, 4.15);
      root.add(rl);

      root.hitRadius = 1.2;
      root.hitLength = 7.5;
    } else if (type === 'suv') {
      // Modern SUV
      const lowerGeo = new THREE.BoxGeometry(1.5, 0.6, 3.2);
      const lower = new THREE.Mesh(lowerGeo, bodyMat);
      lower.position.set(0, 0.55, 0);
      lower.castShadow = true;
      root.add(lower);

      const cabinGeo = new THREE.BoxGeometry(1.3, 0.65, 2.0);
      const cabin = new THREE.Mesh(cabinGeo, glassMat);
      cabin.position.set(0, 1.1, 0.2);
      root.add(cabin);

      // Headlights / Taillights
      const fl = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.05), lightFront);
      fl.position.set(0.45, 0.6, -1.6);
      root.add(fl);
      const fr = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.05), lightFront);
      fr.position.set(-0.45, 0.6, -1.6);
      root.add(fr);

      const bl = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.05), lightBack);
      bl.position.set(0.45, 0.65, 1.6);
      root.add(bl);
      const br = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.05), lightBack);
      br.position.set(-0.45, 0.65, 1.6);
      root.add(br);

      root.hitRadius = 0.95;
      root.hitLength = 3.3;
    } else {
      // Sport Sedan
      const lowerGeo = new THREE.BoxGeometry(1.4, 0.45, 3.0);
      const lower = new THREE.Mesh(lowerGeo, bodyMat);
      lower.position.set(0, 0.45, 0);
      lower.castShadow = true;
      root.add(lower);

      const cabinGeo = new THREE.BoxGeometry(1.15, 0.45, 1.6);
      const cabin = new THREE.Mesh(cabinGeo, glassMat);
      cabin.position.set(0, 0.85, 0.2);
      root.add(cabin);

      // Headlights / Taillights
      const fl = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.05), lightFront);
      fl.position.set(0.42, 0.48, -1.5);
      root.add(fl);
      const fr = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.05), lightFront);
      fr.position.set(-0.42, 0.48, -1.5);
      root.add(fr);

      const bl = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.05), lightBack);
      bl.position.set(0.42, 0.48, 1.5);
      root.add(bl);
      const br = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.05), lightBack);
      br.position.set(-0.42, 0.48, 1.5);
      root.add(br);

      root.hitRadius = 0.85;
      root.hitLength = 3.0;
    }

    // Wheels for car
    const wheelPositions = [
      [-0.7, 0.28, -0.9],
      [0.7, 0.28, -0.9],
      [-0.7, 0.28, 0.9],
      [0.7, 0.28, 0.9]
    ];
    root.wheels = [];
    wheelPositions.forEach(pos => {
      const wGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.16, 8);
      wGeo.rotateZ(Math.PI / 2);
      const w = new THREE.Mesh(wGeo, rubberMat);
      w.position.set(pos[0], pos[1], pos[2]);
      root.add(w);
      root.wheels.push(w);
    });

    return root;
  },

  /**
   * Collectible 3D Gold Coin
   */
  createCoin() {
    const root = new THREE.Group();
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xffb703,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0xd97706,
      emissiveIntensity: 0.4
    });
    const geo = new THREE.CylinderGeometry(0.4, 0.4, 0.08, 14);
    geo.rotateZ(Math.PI / 2);
    const coin = new THREE.Mesh(geo, goldMat);
    coin.castShadow = true;
    root.add(coin);

    // Inner embossed star/circle
    const innerGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.09, 6);
    innerGeo.rotateZ(Math.PI / 2);
    const inner = new THREE.Mesh(innerGeo, new THREE.MeshBasicMaterial({ color: 0xffe600 }));
    root.add(inner);

    root.position.y = 0.6;
    return root;
  },

  /**
   * 3D Nitro Canister
   */
  createNitroPickup() {
    const root = new THREE.Group();
    const bottleMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.6
    });
    const geo = new THREE.CylinderGeometry(0.2, 0.2, 0.7, 10);
    const bottle = new THREE.Mesh(geo, bottleMat);
    root.add(bottle);

    // Valve cap
    const capGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.15, 8);
    const cap = new THREE.Mesh(capGeo, new THREE.MeshStandardMaterial({ color: 0xef4444 }));
    cap.position.y = 0.4;
    root.add(cap);

    root.position.y = 0.65;
    return root;
  },

  /**
   * Road Hazard Cone
   */
  createObstacle() {
    const root = new THREE.Group();
    const coneMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.5 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });

    const baseGeo = new THREE.BoxGeometry(0.5, 0.05, 0.5);
    const base = new THREE.Mesh(baseGeo, coneMat);
    root.add(base);

    const coneGeo = new THREE.ConeGeometry(0.18, 0.6, 8);
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.y = 0.3;
    root.add(cone);

    const stripeGeo = new THREE.CylinderGeometry(0.12, 0.15, 0.12, 8);
    const stripe = new THREE.Mesh(stripeGeo, whiteMat);
    stripe.position.y = 0.3;
    root.add(stripe);

    return root;
  },

  /**
   * Checkered Finish Line Archway
   */
  createFinishLine() {
    const root = new THREE.Group();
    const archMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 });
    const checkerMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    const neonTextMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });

    // Left and right pillars
    const pillarGeo = new THREE.BoxGeometry(0.6, 6.0, 0.6);
    const leftPillar = new THREE.Mesh(pillarGeo, archMat);
    leftPillar.position.set(-6.5, 3.0, 0);
    root.add(leftPillar);

    const rightPillar = new THREE.Mesh(pillarGeo, archMat);
    rightPillar.position.set(6.5, 3.0, 0);
    root.add(rightPillar);

    // Crossbar
    const crossbarGeo = new THREE.BoxGeometry(14.0, 1.2, 0.8);
    const crossbar = new THREE.Mesh(crossbarGeo, archMat);
    crossbar.position.set(0, 5.5, 0);
    root.add(crossbar);

    // Banner board
    const bannerGeo = new THREE.BoxGeometry(8.0, 0.8, 0.05);
    const banner = new THREE.Mesh(bannerGeo, neonTextMat);
    banner.position.set(0, 5.5, 0.45);
    root.add(banner);

    // Road checkered strip
    const stripGeo = new THREE.PlaneGeometry(12.0, 1.5);
    stripGeo.rotateX(-Math.PI / 2);
    const strip = new THREE.Mesh(stripGeo, checkerMat);
    strip.position.set(0, 0.02, 0);
    root.add(strip);

    return root;
  },

  /**
   * Environment Scenery (Buildings, Trees, Cacti, Mountains)
   */
  createScenery(envType, isRight = false) {
    const root = new THREE.Group();

    if (envType === 'city' || envType === 'night_city') {
      // Skyscraper tower
      const height = 15 + Math.random() * 30;
      const width = 6 + Math.random() * 5;
      const depth = 6 + Math.random() * 5;
      const color = envType === 'night_city' ? 0x0f172a : 0x334155;
      const mat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.4, metalness: 0.5 });
      const tower = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), mat);
      tower.position.y = height / 2;
      root.add(tower);

      // Glowing windows on night city
      if (envType === 'night_city') {
        const winGeo = new THREE.PlaneGeometry(width * 0.8, height * 0.8);
        const winMat = new THREE.MeshBasicMaterial({
          color: Math.random() > 0.5 ? 0x00f0ff : 0xff007f,
          transparent: true,
          opacity: 0.6
        });
        const winMesh = new THREE.Mesh(winGeo, winMat);
        winMesh.position.set(0, height / 2, depth / 2 + 0.05);
        root.add(winMesh);
      }
    } else if (envType === 'desert') {
      // Saguaro Cactus or Sandstone Rock
      if (Math.random() > 0.4) {
        const rockMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.9 });
        const rockGeo = new THREE.DodecahedronGeometry(2 + Math.random() * 2);
        const rock = new THREE.Mesh(rockGeo, rockMat);
        rock.position.y = 1.5;
        rock.scale.set(1.5, 1.0, 1.2);
        root.add(rock);
      } else {
        const cactusMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 4.0, 8), cactusMat);
        trunk.position.y = 2.0;
        root.add(trunk);
        // Arms
        const arm1 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1.5, 8), cactusMat);
        arm1.position.set(0.6, 2.5, 0);
        arm1.rotation.z = -0.5;
        root.add(arm1);
      }
    } else if (envType === 'snow') {
      // Snowy Pine Tree
      const woodMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
      const snowMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.7 });
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 2.0, 6), woodMat);
      trunk.position.y = 1.0;
      root.add(trunk);

      for (let i = 0; i < 3; i++) {
        const cone = new THREE.Mesh(new THREE.ConeGeometry(2.0 - i * 0.4, 2.0, 7), snowMat);
        cone.position.y = 2.2 + i * 1.3;
        root.add(cone);
      }
    } else {
      // Green Forest / Mountain Pine Tree
      const woodMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
      const leafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 2.5, 6), woodMat);
      trunk.position.y = 1.25;
      root.add(trunk);

      for (let i = 0; i < 3; i++) {
        const cone = new THREE.Mesh(new THREE.ConeGeometry(2.2 - i * 0.5, 2.2, 7), leafMat);
        cone.position.y = 2.4 + i * 1.4;
        root.add(cone);
      }
    }

    return root;
  },

  /**
   * Street Lamp
   */
  createStreetLamp(isRight = false) {
    const root = new THREE.Group();
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xfffaed });

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 5.5, 8), metalMat);
    pole.position.y = 2.75;
    root.add(pole);

    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.6, 8), metalMat);
    arm.position.set(isRight ? -0.7 : 0.7, 5.3, 0);
    arm.rotation.z = isRight ? 0.7 : -0.7;
    root.add(arm);

    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), glowMat);
    lamp.position.set(isRight ? -1.2 : 1.2, 5.2, 0);
    root.add(lamp);

    return root;
  }
};

window.ModelBuilder = ModelBuilder;
