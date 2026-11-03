/**
 * Ultimate Bike Racing 3D - Particle System & Visual FX
 */

class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.maxParticles = 250;

    // Particle geometries
    this.boxGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
    this.sparkGeo = new THREE.BoxGeometry(0.04, 0.04, 0.15);

    // Speed lines group
    this.speedLinesGroup = new THREE.Group();
    this.scene.add(this.speedLinesGroup);
    this.speedLines = [];
    this.createSpeedLines();
  }

  createSpeedLines() {
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 });
    const lineGeo = new THREE.CylinderGeometry(0.015, 0.015, 6.0, 4);
    lineGeo.rotateX(Math.PI / 2);

    for (let i = 0; i < 40; i++) {
      const line = new THREE.Mesh(lineGeo, lineMat);
      line.position.set(
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 8 + 2,
        -Math.random() * 30
      );
      line.visible = false;
      this.speedLinesGroup.add(line);
      this.speedLines.push(line);
    }
  }

  updateSpeedLines(cameraPos, isNitro, speedRatio) {
    this.speedLinesGroup.position.copy(cameraPos);
    const show = isNitro || speedRatio > 0.75;
    for (let i = 0; i < this.speedLines.length; i++) {
      const line = this.speedLines[i];
      line.visible = show;
      if (show) {
        line.position.z += 1.8 + (isNitro ? 2.0 : 0);
        if (line.position.z > 5) {
          line.position.z = -35 - Math.random() * 20;
          line.position.x = (Math.random() - 0.5) * 16;
          line.position.y = (Math.random() - 0.5) * 8 + 2;
        }
      }
    }
  }

  emitNitroFlames(originPos, isNitro) {
    if (!isNitro) return;
    const colors = [0x00f0ff, 0x38bdf8, 0xffffff, 0x0284c7];
    const col = colors[Math.floor(Math.random() * colors.length)];
    const mat = new THREE.MeshBasicMaterial({ color: col });
    const p = new THREE.Mesh(this.boxGeo, mat);

    p.position.copy(originPos);
    p.position.x += (Math.random() - 0.5) * 0.08;
    p.position.y += (Math.random() - 0.5) * 0.08;
    p.position.z += 0.1;

    p.scale.setScalar(0.8 + Math.random() * 0.8);
    p.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.8,
      (Math.random() - 0.5) * 0.5,
      2.5 + Math.random() * 2.0
    );
    p.life = 1.0;
    p.decay = 0.08 + Math.random() * 0.05;

    this.scene.add(p);
    this.particles.push(p);
  }

  emitBrakeSmoke(pos) {
    const mat = new THREE.MeshBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.5 });
    const p = new THREE.Mesh(this.boxGeo, mat);
    p.position.copy(pos);
    p.position.x += (Math.random() - 0.5) * 0.1;
    p.position.y = 0.2;
    p.scale.setScalar(0.6 + Math.random() * 0.6);
    p.velocity = new THREE.Vector3((Math.random() - 0.5) * 0.4, 0.3 + Math.random() * 0.3, 0.8);
    p.life = 1.0;
    p.decay = 0.06;
    this.scene.add(p);
    this.particles.push(p);
  }

  emitSparks(pos, count = 25) {
    const colors = [0xffd000, 0xff4d00, 0xffffff];
    for (let i = 0; i < count; i++) {
      const col = colors[Math.floor(Math.random() * colors.length)];
      const mat = new THREE.MeshBasicMaterial({ color: col });
      const p = new THREE.Mesh(this.sparkGeo, mat);
      p.position.copy(pos);
      p.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 6,
        1.5 + Math.random() * 4,
        (Math.random() - 0.5) * 6
      );
      p.life = 1.0;
      p.decay = 0.03 + Math.random() * 0.03;
      this.scene.add(p);
      this.particles.push(p);
    }
  }

  emitCoinSparkle(pos) {
    for (let i = 0; i < 12; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: 0xffe600 });
      const p = new THREE.Mesh(this.boxGeo, mat);
      p.position.copy(pos);
      p.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 3,
        1.0 + Math.random() * 2,
        (Math.random() - 0.5) * 3
      );
      p.life = 1.0;
      p.decay = 0.05;
      this.scene.add(p);
      this.particles.push(p);
    }
  }

  update(delta) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.position.addScaledVector(p.velocity, delta * 30);
      p.life -= p.decay;
      p.scale.multiplyScalar(0.95);

      if (p.life <= 0) {
        this.scene.remove(p);
        this.particles.splice(i, 1);
      }
    }
  }

  clear() {
    for (let p of this.particles) {
      this.scene.remove(p);
    }
    this.particles = [];
  }
}

window.ParticleSystem = ParticleSystem;
