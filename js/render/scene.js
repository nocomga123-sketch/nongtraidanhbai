// js/render/scene.js
import { gameState, CONFIG } from '../state/gameState.js';
import { createPlayerModel, createChickenModel, createCowModel, createPigModel } from './models.js';

export let scene, camera, renderer, controls, sunLight, ambientLight;
export let plotMeshes = [], orchardPlotMeshes = [], stoveMeshes = [];
export let chickenMeshes = [], cowMeshes = [], pigMeshes = [], pondFishMeshes = [];
export let triggerZones = [];

let playerObj, playerTargetPos = null, isPlayerMoving = false, moveSpeed = 0.22, walkAnimTime = 0, pendingAction = null;

export function init3DScene(onTapCallback) {
    const container = document.getElementById('canvas-container');
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.FogExp2(0x87ceeb, 0.008);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 28, 35);

    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x3d5a80, 0.4);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    sunLight = new THREE.DirectionalLight(0xfffaed, 1.2);
    sunLight.position.set(25, 45, 20);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    const d = 38;
    sunLight.shadow.camera.left = -d; sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d; sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    buildFarmIsland();
    playerObj = createPlayerModel();
    playerObj.group.position.set(0, 0, 5);
    scene.add(playerObj.group);

    setupEvents(onTapCallback);
}

function buildFarmIsland() {
    const island = new THREE.Mesh(new THREE.BoxGeometry(68, 2, 68), new THREE.MeshStandardMaterial({ color: 0x52b788, roughness: 0.8 }));
    island.position.y = -1;
    island.receiveShadow = true;
    island.userData = { type: 'ground' };
    scene.add(island);

    buildPlotsGrid();
    buildPenFence(-20, -18, 8, 6);
    buildPenFence(-20, 10, 9, 7);
    buildPenFence(20, 14, 8, 6);

    createTriggerZone(-20, -14.5, 'chicken');
    createTriggerZone(-20, 14, 'cow');
    createTriggerZone(20, 17.5, 'pig');

    updateAnimalMeshes();
}

function buildPlotsGrid() {
    plotMeshes = [];
    const startX = -12, startZ = -9;
    for (let i = 0; i < CONFIG.TOTAL_PLOTS; i++) {
        const row = Math.floor(i / CONFIG.PLOTS_PER_ROW);
        const col = i % CONFIG.PLOTS_PER_ROW;
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(1.8, 0.2, 1.8),
            new THREE.MeshStandardMaterial({ color: gameState.unlockedPlots[i] ? 0xc28544 : 0x475569, roughness: 0.9 })
        );
        mesh.position.set(startX + col * CONFIG.PLOT_SPACING, 0.1, startZ + row * CONFIG.PLOT_SPACING);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData = { type: 'plot', index: i };
        scene.add(mesh);
        plotMeshes.push(mesh);
    }
}

function buildPenFence(x, z, w, d) {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.8 });
    const postG = new THREE.CylinderGeometry(0.08, 0.08, 0.9, 8);

    [[-w/2, -d/2], [w/2, -d/2], [-w/2, d/2], [w/2, d/2]].forEach(p => {
        const post = new THREE.Mesh(postG, mat);
        post.position.set(p[0], 0.45, p[1]);
        group.add(post);
    });

    group.position.set(x, 0, z);
    scene.add(group);
}

function createTriggerZone(x, z, penType) {
    const group = new THREE.Group();
    group.position.set(x, 0.02, z);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.8, 1.1, 32), new THREE.MeshBasicMaterial({ color: 0xfcb316, side: THREE.DoubleSide, transparent: true, opacity: 0.8 }));
    ring.rotation.x = Math.PI / 2;
    group.add(ring);
    scene.add(group);

    triggerZones.push({ x, z, radius: 1.2, penType, mesh: group, isInside: false });
}

export function updateAnimalMeshes() {
    chickenMeshes.forEach(i => scene.remove(i.mesh)); chickenMeshes = [];
    gameState.chickens.forEach(d => { const m = createChickenModel(d); scene.add(m); chickenMeshes.push({ mesh: m, data: d }); });

    cowMeshes.forEach(i => scene.remove(i.mesh)); cowMeshes = [];
    gameState.cows.forEach(d => { const m = createCowModel(d); scene.add(m); cowMeshes.push({ mesh: m, data: d }); });

    pigMeshes.forEach(i => scene.remove(i.mesh)); pigMeshes = [];
    gameState.pigs.forEach(d => { const m = createPigModel(d); scene.add(m); pigMeshes.push({ mesh: m, data: d }); });
}

function setupEvents(onTapCallback) {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    window.addEventListener('pointerdown', (e) => {
        if (e.target.closest('.interactive-ui') || e.target.closest('.fixed')) return;
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);
        if (intersects.length > 0) {
            let obj = intersects[0].object;
            while (obj.parent && obj.parent !== scene && !obj.userData.type) obj = obj.parent;
            
            const type = obj.userData.type;
            const idx = obj.userData.index;

            if (type === 'ground') {
                playerTargetPos = new THREE.Vector3(intersects[0].point.x, 0, intersects[0].point.z);
            } else if (type === 'plot') {
                playerTargetPos = new THREE.Vector3(obj.position.x, 0, obj.position.z + 1.2);
                pendingAction = () => onTapCallback('plot', idx);
            } else if (type === 'stove') {
                playerTargetPos = new THREE.Vector3(obj.position.x, 0, obj.position.z + 1.2);
                pendingAction = () => onTapCallback('stove', idx);
            }
        }
    });
}

export function animateRenderLoop() {
    requestAnimationFrame(animateRenderLoop);
    controls.update();

    if (playerTargetPos && playerObj) {
        const p = playerObj.group.position;
        const dx = playerTargetPos.x - p.x, dz = playerTargetPos.z - p.z;
        const dist = Math.hypot(dx, dz);

        if (dist > 0.3) {
            playerObj.group.rotation.y = Math.atan2(dx, dz);
            p.x += (dx / dist) * moveSpeed;
            p.z += (dz / dist) * moveSpeed;

            walkAnimTime += 0.25;
            playerObj.lLeg.rotation.x = Math.sin(walkAnimTime) * 0.6;
            playerObj.rLeg.rotation.x = -Math.sin(walkAnimTime) * 0.6;
            playerObj.lArm.rotation.x = -Math.sin(walkAnimTime) * 0.6;
            playerObj.rArm.rotation.x = Math.sin(walkAnimTime) * 0.6;
            playerObj.group.position.y = Math.abs(Math.sin(walkAnimTime * 2)) * 0.1; // Dáng nhún vai tự nhiên
        } else {
            playerTargetPos = null;
            playerObj.lLeg.rotation.x = 0; playerObj.rLeg.rotation.x = 0;
            playerObj.lArm.rotation.x = 0; playerObj.rArm.rotation.x = 0;
            playerObj.group.position.y = 0;
            if (pendingAction) { const a = pendingAction; pendingAction = null; a(); }
        }
    }

    renderer.render(scene, camera);
}
