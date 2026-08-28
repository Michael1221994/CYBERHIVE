/* ============================================================================
   CYBERHIVE // 3D WebGL Engine (Three.js)
   Renders the Bio-Particle Waggle Swarm, EMF Waves & Compute Monolith
   ========================================================================== */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

let scene, camera, renderer, composer;
let particleGeo, particleMat, particleSystem;
let danceCurveMesh, emfRings = [];
let monolithGroup;
let clock = new THREE.Clock();

// Simulation State
let emfIntensity = 0.0; // 0.0 (natural calm) to 1.0 (500MW AI surge)
const PARTICLE_COUNT = 3000;
let particlePositions, particleInitialPositions, particlePhases, particleSpeeds;
let mouseX = 0, mouseY = 0;
let targetCameraX = 0, targetCameraY = 0;

export function initScene() {
    const canvas = document.getElementById('webgl-canvas');
    if (!canvas) return;

    // 1. Scene & Camera Setup
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030305, 0.025);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 32);

    // 2. Renderer Setup
    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    // 3. Post-Processing Bloom
    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        1.3, // Strength
        0.5, // Radius
        0.18 // Threshold
    );

    composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);

    // 4. Build Scene Geometry
    createWaggleSwarm();
    createComputeMonolith();
    createEMFRadiationWaves();
    createAmbientHexMesh();

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);

    const amberLight = new THREE.PointLight(0xf59e0b, 3.5, 60);
    amberLight.position.set(0, 2, 8);
    scene.add(amberLight);

    const cyanLight = new THREE.PointLight(0x06b6d4, 2.5, 70);
    cyanLight.position.set(-15, 10, -5);
    scene.add(cyanLight);

    // 6. Event Listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    // Expose global hook for interactive telemetry slider
    window.setEMFIntensity = (val) => {
        emfIntensity = Math.max(0, Math.min(1, val));
        updateBloomAndLighting();
    };

    // Start Loop
    animate();
}

function createWaggleSwarm() {
    particleGeo = new THREE.BufferGeometry();
    particlePositions = new Float32Array(PARTICLE_COUNT * 3);
    particleInitialPositions = new Float32Array(PARTICLE_COUNT * 3);
    particlePhases = new Float32Array(PARTICLE_COUNT);
    particleSpeeds = new Float32Array(PARTICLE_COUNT);
    const particleColors = new Float32Array(PARTICLE_COUNT * 3);

    const colorAmber = new THREE.Color(0xfbbf24);
    const colorCyan = new THREE.Color(0x38bdf8);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        const t = Math.random() * Math.PI * 2;
        particlePhases[i] = t;
        particleSpeeds[i] = 0.3 + Math.random() * 0.7;

        // Lemniscate of Bernoulli (Figure-8) parametric curve
        const scale = 14;
        const denom = 1 + Math.sin(t) * Math.sin(t);
        const x = (scale * Math.cos(t)) / denom;
        const y = (scale * Math.sin(t) * Math.cos(t)) / denom;
        const z = (Math.random() - 0.5) * 4;

        particlePositions[i3] = x + (Math.random() - 0.5) * 2.5;
        particlePositions[i3 + 1] = y + (Math.random() - 0.5) * 2.5;
        particlePositions[i3 + 2] = z;

        particleInitialPositions[i3] = particlePositions[i3];
        particleInitialPositions[i3 + 1] = particlePositions[i3 + 1];
        particleInitialPositions[i3 + 2] = particlePositions[i3 + 2];

        // Color mix: Mostly gold, with occasional cyber pollen
        const mixed = colorAmber.clone().lerp(colorCyan, Math.random() * 0.15);
        particleColors[i3] = mixed.r;
        particleColors[i3 + 1] = mixed.g;
        particleColors[i3 + 2] = mixed.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    // Particle Material
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.3, 'rgba(251, 191, 36, 0.8)');
    grad.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);

    particleMat = new THREE.PointsMaterial({
        size: 0.85,
        map: texture,
        vertexColors: true,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // Visual Figure-8 Glow Trajectory Line
    const curvePoints = [];
    for (let i = 0; i <= 120; i++) {
        const t = (i / 120) * Math.PI * 2;
        const scale = 14;
        const denom = 1 + Math.sin(t) * Math.sin(t);
        const x = (scale * Math.cos(t)) / denom;
        const y = (scale * Math.sin(t) * Math.cos(t)) / denom;
        curvePoints.push(new THREE.Vector3(x, y, 0));
    }
    const curveGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);
    const curveMat = new THREE.LineBasicMaterial({
        color: 0xf59e0b,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending
    });
    danceCurveMesh = new THREE.Line(curveGeo, curveMat);
    scene.add(danceCurveMesh);
}

function createComputeMonolith() {
    monolithGroup = new THREE.Group();

    // Tower Body
    const towerGeo = new THREE.BoxGeometry(4, 24, 4);
    const towerMat = new THREE.MeshStandardMaterial({
        color: 0x07070e,
        metalness: 0.9,
        roughness: 0.2,
        wireframe: false
    });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    monolithGroup.add(tower);

    // Glowing Server Status Racks
    for (let y = -9; y <= 9; y += 1.8) {
        const rackGeo = new THREE.PlaneGeometry(3.6, 0.2);
        const rackMat = new THREE.MeshBasicMaterial({
            color: (y % 3 === 0) ? 0x06b6d4 : 0xa855f7,
            side: THREE.DoubleSide
        });
        const rackFront = new THREE.Mesh(rackGeo, rackMat);
        rackFront.position.set(0, y, 2.02);
        monolithGroup.add(rackFront);
    }

    monolithGroup.position.set(16, 2, -18);
    monolithGroup.rotation.y = -Math.PI / 6;
    scene.add(monolithGroup);
}

function createEMFRadiationWaves() {
    // Concentric pulsing electromagnetic shockwave rings
    for (let i = 0; i < 6; i++) {
        const ringGeo = new THREE.RingGeometry(2 + i * 4.5, 2.3 + i * 4.5, 64);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0x06b6d4,
            transparent: true,
            opacity: 0.12,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.set(16, 2, -18);
        ring.rotation.x = Math.PI / 2.3;
        ring.userData = { baseRadius: 2 + i * 4.5, speed: 0.6 + i * 0.15 };
        scene.add(ring);
        emfRings.push(ring);
    }
}

function createAmbientHexMesh() {
    // Giant subtle honeycomb background matrix
    const hexGroup = new THREE.Group();
    const hexGeo = new THREE.CircleGeometry(4, 6);
    const edges = new THREE.EdgesGeometry(hexGeo);
    const lineMat = new THREE.LineBasicMaterial({
        color: 0xf59e0b,
        transparent: true,
        opacity: 0.03
    });

    for (let x = -40; x <= 40; x += 7) {
        for (let y = -25; y <= 25; y += 6) {
            const hex = new THREE.LineSegments(edges, lineMat);
            hex.position.set(x + (Math.abs(y) % 12 ? 3.5 : 0), y, -22);
            hexGroup.add(hex);
        }
    }
    scene.add(hexGroup);
}

function updateBloomAndLighting() {
    if (!particleMat) return;
    // Morph particle colors towards harsh cyan under severe EMF
    const colors = particleGeo.attributes.color.array;
    const colorAmber = new THREE.Color(0xfbbf24);
    const colorCyan = new THREE.Color(0x38bdf8);
    const colorDanger = new THREE.Color(0xf43f5e);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        let mixed = colorAmber.clone().lerp(colorCyan, emfIntensity * 0.9);
        if (emfIntensity > 0.75) {
            mixed.lerp(colorDanger, (emfIntensity - 0.75) * 3);
        }
        colors[i3] = mixed.r;
        colors[i3 + 1] = mixed.g;
        colors[i3 + 2] = mixed.b;
    }
    particleGeo.attributes.color.needsUpdate = true;

    if (danceCurveMesh) {
        danceCurveMesh.material.color.set(emfIntensity > 0.5 ? 0x06b6d4 : 0xf59e0b);
        danceCurveMesh.material.opacity = 0.35 + emfIntensity * 0.3;
    }
}

function onMouseMove(e) {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    targetCameraX = mouseX * 4;
    targetCameraY = -mouseY * 3;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const time = clock.getElapsedTime();

    // 1. Camera Parallax & Scroll travel
    camera.position.x += (targetCameraX - camera.position.x) * 0.05;
    camera.position.y += (targetCameraY - camera.position.y) * 0.05;
    camera.lookAt(0, 0, 0);

    // 2. Animate Bio-Particles along Waggle Curve + EMF Turbulence
    const positions = particleGeo.attributes.position.array;
    const scale = 14;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        particlePhases[i] += delta * particleSpeeds[i] * (1 + emfIntensity * 1.5);
        const t = particlePhases[i];

        // Base Lemniscate
        const denom = 1 + Math.sin(t) * Math.sin(t);
        let baseX = (scale * Math.cos(t)) / denom;
        let baseY = (scale * Math.sin(t) * Math.cos(t)) / denom;
        let baseZ = Math.sin(t * 3 + i) * 1.5;

        // Severe EMF Turbulence: Vector disorientation, jitter & chaotic scattering
        if (emfIntensity > 0.01) {
            const jitterScale = emfIntensity * 7.5;
            const noiseX = Math.sin(time * 8 + i * 0.1) * Math.cos(t * 2) * jitterScale;
            const noiseY = Math.cos(time * 9 + i * 0.1) * Math.sin(t * 3) * jitterScale;
            const noiseZ = Math.sin(time * 12 + i) * jitterScale * 0.8;

            baseX += noiseX;
            baseY += noiseY;
            baseZ += noiseZ;
        }

        positions[i3] = baseX;
        positions[i3 + 1] = baseY;
        positions[i3 + 2] = baseZ;
    }
    particleGeo.attributes.position.needsUpdate = true;

    // 3. Animate EMF Concentric Rings (Expansion pulse)
    emfRings.forEach((ring, idx) => {
        const s = 1 + (time * ring.userData.speed * (1 + emfIntensity * 2)) % 3.5;
        ring.scale.set(s, s, s);
        ring.material.opacity = Math.max(0, (3.5 - s) / 3.5 * (0.15 + emfIntensity * 0.45));
    });

    // 4. Subtle Monolith Hover Rotation
    if (monolithGroup) {
        monolithGroup.rotation.y = -Math.PI / 6 + Math.sin(time * 0.5) * 0.08;
    }

    // 5. Render post-processed scene
    composer.render();
}
