import { gameState } from '../state/gameState.js';
import { CONFIG } from '../config/constants.js';
import { createLockIconMesh, renderCrop3DStage } from './models.js';
import { updateFloatingHUD } from './hud.js';
import { CROPS_DB } from '../config/database.js';

export let scene, camera, renderer, controls, sunLight, ambientLight;
export let playerGroup, playerLeftArm, playerRightArm, playerLeftLeg, playerRightLeg;
export let plotMeshes = [], orchardPlotMeshes = [], stoveMeshes = [];
export let chickenMeshes = [], cowMeshes = [], pigMeshes = [], pondFishMeshes = [];
export let weatherParticleSystem = null;

export let playerTargetPos = null;
export let moveSpeed = 0.22;
export let walkAnimTime = 0;

export function init3DScene(onWorldTapCallback) {
    const container = document.getElementById('canvas-container');
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.FogExp2(0x87ceeb, 0.01);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 28, 35);

    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.15;

    ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    sunLight = new THREE.DirectionalLight(0xfffaed, 1.3);
    sunLight.position.set(30, 50, 25);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.bias = -0.0003;
    scene.add(sunLight);

    buildFarmIsland();
    create3DAvatar();
    applyWeatherEffects(gameState.currentWeather || 'sunny');

    setupTouchAndClickEvents(onWorldTapCallback);
}

function buildFarmIsland() {
    const island = new THREE.Mesh(
        new THREE.BoxGeometry(68, 2, 68),
        new THREE.MeshStandardMaterial({ color: 0x52b788, roughness: 0.8 })
    );
    island.position.y = -1;
    island.receiveShadow = true;
    island.userData = { type: 'ground' };
    scene.add(island);

    buildPlotsGrid();
    buildOrchardArea();
    buildFishPond();
    buildChickenPen();
    buildCowBarn();
    buildPigPen();
    build4CookingStoves();
}

function buildPlotsGrid() {
    const startX = -12, startZ = -9;
    for (let i = 0; i < CONFIG.TOTAL_PLOTS; i++) {
        const row = Math.floor(i / CONFIG.PLOTS_PER_ROW);
        const col = i % CONFIG.PLOTS_PER_ROW;
        const plotMesh = new THREE.Mesh(
            new THREE.BoxGeometry(1.8, 0.2, 1.8),
            new THREE.MeshStandardMaterial({ color: gameState.unlockedPlots[i] ? 0xc28544 : 0x475569, roughness: 0.9 })
        );
        plotMesh.position.set(startX + col * CONFIG.PLOT_SPACING, 0.1, startZ + row * CONFIG.PLOT_SPACING);
        plotMesh.receiveShadow = true;
        plotMesh.castShadow = true;
        plotMesh.userData = { type: 'plot', index: i };
        scene.add(plotMesh);
        plotMeshes.push(plotMesh);
        updatePlotVisual(i);
    }
}

export function updatePlotVisual(index) {
    const mesh = plotMeshes[index];
    if (!mesh) return;
    const plot = gameState.plots[index];
    const isUnlocked = gameState.unlockedPlots[index];
    const reqLevel = Math.floor(index / 4) + 1;
    const canUnlock = gameState.level >= reqLevel;

    mesh.material.color.setHex(isUnlocked ? (plot.isDead ? 0x451a03 : (plot.watered ? 0x2e180d : 0xc28544)) : (canUnlock ? 0x334155 : 0x1e293b));

    if (mesh.userData.lockMesh) { mesh.remove(mesh.userData.lockMesh); mesh.userData.lockMesh = null; }
    if (!isUnlocked) {
        const lockMesh = createLockIconMesh(canUnlock);
        lockMesh.position.set(0, 0.2, 0);
        mesh.add(lockMesh);
        mesh.userData.lockMesh = lockMesh;
        return;
    }

    if (mesh.userData.cropMesh) { mesh.remove(mesh.userData.cropMesh); mesh.userData.cropMesh = null; }

    if (plot.cropId && !plot.isDead) {
        const crop = CROPS_DB[plot.cropId];
        const effTime = crop.growTime - (plot.reducedSecs || 0);
        const elapsed = (Date.now() - plot.plantedAt) / 1000;
        const ratio = Math.min(1.0, elapsed / effTime);
        const cropMesh = renderCrop3DStage(plot.cropId, ratio, plot.hasPest);
        mesh.add(cropMesh);
        mesh.userData.cropMesh = cropMesh;
    } else if (plot.isDead) {
        const grassMesh = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.4, 5), new THREE.MeshStandardMaterial({ color: 0x854d0e }));
        grassMesh.position.y = 0.2;
        mesh.add(grassMesh);
        mesh.userData.cropMesh = grassMesh;
    }
}

function buildOrchardArea() {
    const startX = 18, startZ = -18;
    for (let i = 0; i < 10; i++) {
        const row = Math.floor(i / 2), col = i % 2;
        const plotMesh = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 1.6, 0.2, 16),
            new THREE.MeshStandardMaterial({ color: gameState.orchardPlots[i].unlocked ? 0x78350f : 0x334155 })
        );
        plotMesh.position.set(startX + col * 4.5, 0.1, startZ + row * 3.5);
        plotMesh.userData = { type: 'orchard_plot', index: i };
        scene.add(plotMesh);
        orchardPlotMeshes.push(plotMesh);
        updateOrchardPlotVisual(i);
    }
}

export function updateOrchardPlotVisual(index) {
    const mesh = orchardPlotMeshes[index];
    if (!mesh) return;
    const oData = gameState.orchardPlots[index];

    if (mesh.userData.treeMesh) { mesh.remove(mesh.userData.treeMesh); mesh.userData.treeMesh = null; }
    if (!oData.unlocked) {
        const lockMesh = createLockIconMesh(gameState.level >= (index + 2));
        lockMesh.position.set(0, 0.2, 0);
        mesh.add(lockMesh);
        mesh.userData.treeMesh = lockMesh;
        return;
    }

    if (oData.treeType) {
        const treeGroup = new THREE.Group();
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 2.6), new THREE.MeshStandardMaterial({ color: 0x5c4033 }));
        trunk.position.y = 1.3;
        treeGroup.add(trunk);
        const foliage = new THREE.Mesh(new THREE.DodecahedronGeometry(1.6), new THREE.MeshStandardMaterial({ color: 0x2d6a4f }));
        foliage.position.y = 3.0;
        treeGroup.add(foliage);
        mesh.add(treeGroup);
        mesh.userData.treeMesh = treeGroup;
    }
}

function build4CookingStoves() {
    stoveMeshes = [];
    const positions = [{ x: 8, z: 8 }, { x: 11, z: 8 }, { x: 8, z: 11 }, { x: 11, z: 11 }];
    positions.forEach((pos, idx) => {
        const stoveData = gameState.kitchenStoves[idx];
        const stoveGroup = new THREE.Group();
        stoveGroup.position.set(pos.x, 0, pos.z);

        const base = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.2, 2.2), new THREE.MeshStandardMaterial({ color: stoveData.unlocked ? 0x78350f : 0x334155 }));
        base.position.y = 0.6;
        stoveGroup.add(base);

        if (stoveData.unlocked) {
            const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.6, 16), new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85 }));
            pot.position.y = 1.5;
            stoveGroup.add(pot);
        } else {
            const lockMesh = createLockIconMesh(gameState.level >= stoveData.levelReq);
            lockMesh.position.set(0, 1.4, 0);
            stoveGroup.add(lockMesh);
        }

        base.userData = { type: 'stove', index: idx };
        scene.add(stoveGroup);
        stoveMeshes.push(stoveGroup);
    });
}

export function update4Stoves3D() {
    stoveMeshes.forEach((mesh, idx) => {
        const stoveData = gameState.kitchenStoves[idx];
        const base = mesh.children[0];
        if (base) base.material.color.setHex(stoveData.unlocked ? 0x78350f : 0x334155);
    });
}

function buildFishPond() {
    const group = new THREE.Group();
    group.position.set(0, 0, -20);
    const water = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 0.2, 32), new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1, transparent: true, opacity: 0.85 }));
    water.position.y = 0.05;
    water.userData = { type: 'pond' };
    group.add(water);
    scene.add(group);
}

function buildRealisticFence(width, depth, material) {
    const fenceGroup = new THREE.Group();
    const hW = width / 2, hD = depth / 2;
    [[-hW, -hD], [hW, -hD], [-hW, hD], [hW, hD]].forEach(([px, pz]) => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.2, 8), material);
        post.position.set(px, 0.6, pz);
        fenceGroup.add(post);
    });
    return fenceGroup;
}

function buildChickenPen() {
    const group = new THREE.Group();
    group.position.set(-20, 0, -18);
    const floor = new THREE.Mesh(new THREE.BoxGeometry(9, 0.1, 7), new THREE.MeshStandardMaterial({ color: 0xb45309 }));
    floor.userData = { type: 'chicken_pen' };
    group.add(floor);
    group.add(buildRealisticFence(9, 7, new THREE.MeshStandardMaterial({ color: 0x78350f })));
    scene.add(group);
    update3DChickens();
}

function buildCowBarn() {
    const group = new THREE.Group();
    group.position.set(-20, 0, 10);
    const floor = new THREE.Mesh(new THREE.BoxGeometry(11, 0.1, 9), new THREE.MeshStandardMaterial({ color: 0x92400e }));
    floor.userData = { type: 'cow_barn' };
    group.add(floor);
    group.add(buildRealisticFence(11, 9, new THREE.MeshStandardMaterial({ color: 0x854d0e })));
    scene.add(group);
    update3DCows();
}

function buildPigPen() {
    const group = new THREE.Group();
    group.position.set(20, 0, 14);
    const floor = new THREE.Mesh(new THREE.BoxGeometry(10, 0.1, 8), new THREE.MeshStandardMaterial({ color: 0xa16207 }));
    floor.userData = { type: 'pig_pen' };
    group.add(floor);
    group.add(buildRealisticFence(10, 8, new THREE.MeshStandardMaterial({ color: 0x713f12 })));
    scene.add(group);
    update3DPigs();
}

export function update3DChickens() {
    chickenMeshes.forEach(m => scene.remove(m.mesh));
    chickenMeshes = [];
    gameState.chickens.forEach((c) => {
        const group = new THREE.Group();
        group.position.set(c.x, 0.35, c.z);
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 12), new THREE.MeshStandardMaterial({ color: c.sick ? 0x94a3b8 : 0xfacc15 }));
        group.add(body);
        scene.add(group);
        chickenMeshes.push({ mesh: group, data: c });
    });
}

export function update3DCows() {
    cowMeshes.forEach(m => scene.remove(m.mesh));
    cowMeshes = [];
    gameState.cows.forEach((c) => {
        const group = new THREE.Group();
        group.position.set(c.x, 0.8, c.z);
        const cowBody = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.1, 2.0), new THREE.MeshStandardMaterial({ color: c.sick ? 0x64748b : 0xf8fafc }));
        group.add(cowBody);
        scene.add(group);
        cowMeshes.push({ mesh: group, data: c });
    });
}

export function update3DPigs() {
    pigMeshes.forEach(m => scene.remove(m.mesh));
    pigMeshes = [];
    gameState.pigs.forEach((p) => {
        const group = new THREE.Group();
        group.position.set(p.x, 0.6, p.z);
        const pigBody = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 1.6), new THREE.MeshStandardMaterial({ color: p.sick ? 0x94a3b8 : 0xf472b6 }));
        group.add(pigBody);
        scene.add(group);
        pigMeshes.push({ mesh: group, data: p });
    });
}

export function update3DFishPond() {
    pondFishMeshes.forEach(m => scene.remove(m));
    pondFishMeshes = [];
    (gameState.fishPond.fishes || []).forEach((f, idx) => {
        const fishGroup = new THREE.Group();
        const bodyMesh = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 10), new THREE.MeshStandardMaterial({ color: f.fryId === 'fry_carp' ? 0x0284c7 : 0xf97316 }));
        fishGroup.add(bodyMesh);
        const angle = (idx / Math.max(1, gameState.fishPond.fishes.length)) * Math.PI * 2;
        fishGroup.position.set(Math.cos(angle) * 2.5, 0.35, -20 + Math.sin(angle) * 2.5);
        scene.add(fishGroup);
        pondFishMeshes.push(fishGroup);
    });
}

function create3DAvatar() {
    playerGroup = new THREE.Group();
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 16), new THREE.MeshStandardMaterial({ color: 0xffdbac }));
    head.position.y = 1.55; playerGroup.add(head);

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.9, 16), new THREE.MeshStandardMaterial({ color: 0x0284c7 }));
    body.position.y = 0.95; playerGroup.add(body);

    const legGeo = new THREE.BoxGeometry(0.18, 0.45, 0.18);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
    playerLeftLeg = new THREE.Mesh(legGeo, legMat); playerLeftLeg.position.set(-0.16, 0.25, 0); playerGroup.add(playerLeftLeg);
    playerRightLeg = new THREE.Mesh(legGeo, legMat); playerRightLeg.position.set(0.16, 0.25, 0); playerGroup.add(playerRightLeg);

    playerGroup.position.set(0, 0, 5);
    scene.add(playerGroup);
}

export function applyWeatherEffects(type) {
    if (weatherParticleSystem) { scene.remove(weatherParticleSystem); weatherParticleSystem = null; }
    if (type === 'sunny') {
        scene.background.setHex(0x87ceeb);
        sunLight.intensity = 1.3;
    } else if (type === 'rainy') {
        scene.background.setHex(0x475569);
        sunLight.intensity = 0.5;
    }
}

function setupTouchAndClickEvents(onWorldTapCallback) {
    let pointerDownPos = { x: 0, y: 0 };
    let isDragging = false;

    window.addEventListener('pointerdown', (e) => {
        if (e.target.closest('.interactive-ui') || e.target.closest('.glass-panel')) return;
        pointerDownPos = { x: e.clientX, y: e.clientY };
        isDragging = false;
    });
    window.addEventListener('pointermove', (e) => {
        if (Math.abs(e.clientX - pointerDownPos.x) > 8 || Math.abs(e.clientY - pointerDownPos.y) > 8) isDragging = true;
    });
    window.addEventListener('pointerup', (e) => {
        if (e.target.closest('.interactive-ui') || e.target.closest('.glass-panel') || isDragging) return;
        const mouse = new THREE.Vector2((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);
        if (intersects.length > 0) {
            const point = intersects[0].point;
            playerTargetPos = new THREE.Vector3(point.x, 0, point.z);
            let obj = intersects[0].object;
            while (obj && !obj.userData.type && obj.parent) obj = obj.parent;
            if (obj && obj.userData.type) onWorldTapCallback(obj.userData.type, obj.userData.index);
        }
    });
}

export function animateRenderLoop() {
    requestAnimationFrame(animateRenderLoop);
    controls.update();

    if (playerTargetPos && playerGroup) {
        const dx = playerTargetPos.x - playerGroup.position.x;
        const dz = playerTargetPos.z - playerGroup.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist > 0.3) {
            playerGroup.rotation.y = Math.atan2(dx, dz);
            playerGroup.position.x += (dx / dist) * moveSpeed;
            playerGroup.position.z += (dz / dist) * moveSpeed;
        } else {
            playerTargetPos = null;
        }
    }

    updateFloatingHUD(camera, plotMeshes, orchardPlotMeshes, stoveMeshes);
    renderer.render(scene, camera);
}
