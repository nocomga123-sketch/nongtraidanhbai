// js/render/scene.js
import { gameState, CONFIG, CROPS_DB, TREES_DB } from '../state/gameState.js';
import { createChickenModel, createCowModel, createPigModel } from './models.js';

export let scene, camera, renderer, controls, sunLight, ambientLight;
export let playerGroup, playerLeftArm, playerRightArm, playerLeftLeg, playerRightLeg;
export let plotMeshes = [], orchardPlotMeshes = [], stoveMeshes = [];
export let chickenMeshes = [], cowMeshes = [], pigMeshes = [], pondFishMeshes = [];
export let weatherParticleSystem = null;
export let triggerZones = [];

let playerTargetPos = null;
let moveSpeed = 0.22;
let walkAnimTime = 0;
let pendingWorldInteraction = null;

export function init3DScene(onWorldTapCallback, onTriggerEnter) {
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

    ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    sunLight = new THREE.DirectionalLight(0xfffaed, 1.3);
    sunLight.position.set(30, 50, 25);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    scene.add(sunLight);

    buildFarmIsland();
    create3DAvatar();
    setupTouchAndClickEvents(onWorldTapCallback);
}

function buildFarmIsland() {
    const island = new THREE.Mesh(new THREE.BoxGeometry(68, 2, 68), new THREE.MeshStandardMaterial({ color: 0x52b788, roughness: 0.8 }));
    island.position.y = -1;
    island.receiveShadow = true;
    island.userData = { type: 'ground' };
    scene.add(island);

    buildPlotsGrid();
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

function create3DAvatar() {
    playerGroup = new THREE.Group();
    playerGroup.position.set(0, 0, 5);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 16), new THREE.MeshStandardMaterial({ color: 0xffdbac }));
    head.position.y = 1.45;
    head.castShadow = true;
    playerGroup.add(head);

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.35), new THREE.MeshStandardMaterial({ color: 0x2563eb }));
    body.position.y = 0.85;
    body.castShadow = true;
    playerGroup.add(body);

    scene.add(playerGroup);
}

function setupTouchAndClickEvents(onTap) {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    window.addEventListener('pointerdown', (e) => {
        if (e.target.closest('.interactive-ui') || e.target.closest('#modal-dialog') || e.target.closest('.fixed')) return;
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);
        if (intersects.length > 0) {
            let obj = intersects[0].object;
            while (obj.parent && obj.parent !== scene && !obj.userData.type) obj = obj.parent;
            if (obj.userData.type === 'ground') {
                playerTargetPos = new THREE.Vector3(intersects[0].point.x, 0, intersects[0].point.z);
            } else if (obj.userData.type === 'plot') {
                playerTargetPos = new THREE.Vector3(obj.position.x, 0, obj.position.z + 1.2);
                pendingWorldInteraction = () => onTap('plot', obj.userData.index);
            }
        }
    });
}

export function animate3D() {
    requestAnimationFrame(animate3D);
    controls.update();

    if (playerTargetPos && playerGroup) {
        const p = playerGroup.position;
        const dx = playerTargetPos.x - p.x, dz = playerTargetPos.z - p.z;
        const dist = Math.hypot(dx, dz);
        if (dist > 0.3) {
            playerGroup.rotation.y = Math.atan2(dx, dz);
            p.x += (dx / dist) * moveSpeed;
            p.z += (dz / dist) * moveSpeed;
        } else {
            playerTargetPos = null;
            if (pendingWorldInteraction) { const a = pendingWorldInteraction; pendingWorldInteraction = null; a(); }
        }
    }

    renderer.render(scene, camera);
}
