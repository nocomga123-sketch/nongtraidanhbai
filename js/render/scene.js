// js/render/scene.js
import { gameState, CONFIG, CROPS_DB, TREES_DB, FISH_DB } from '../state/gameState.js';
import { createChickenModel, createCowModel, createPigModel } from './models.js';

export let scene, camera, renderer, controls, sunLight, ambientLight;
export let playerGroup, playerLeftArm, playerRightArm, playerLeftLeg, playerRightLeg;
export let plotMeshes = [], orchardPlotMeshes = [], stoveMeshes = [];
export let chickenMeshes = [], cowMeshes = [], pigMeshes = [], pondFishMeshes = [];
export let weatherParticleSystem = null;
export let triggerZones = [];

let playerTargetPos = null;
let isPlayerMoving = false;
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
    renderer.setPixelRatio(1);

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.15;
    controls.target.set(0, 1, 0);
    controls.maxDistance = 45;
    controls.minDistance = 10;

    ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    sunLight = new THREE.DirectionalLight(0xfffaed, 1.3);
    sunLight.position.set(30, 50, 25);
    sunLight.castShadow = true;
    
    sunLight.shadow.mapSize.width = 512;
    sunLight.shadow.mapSize.height = 512;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 150;
    const d = 45;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0003;
    scene.add(sunLight);

    buildFarmIsland();
    buildEnvironmentDecorations();
    create3DAvatar();
    applyWeatherEffects(gameState.currentWeather || 'sunny');

    setupTouchAndClickEvents(onWorldTapCallback, onTriggerEnter);
}

function isLocationFree(x, z) {
    if (x > -15 && x < 8 && z > -12 && z < 13) return false;
    if (x > -26 && x < -14 && z > -23 && z < -13) return false;
    if (x > -26 && x < -14 && z > 5 && z < 15) return false;
    if (x > 14 && x < 26 && z > 9 && z < 19) return false;
    if (x > -7 && x < 7 && z > -26 && z < -14) return false;
    if (x > 4 && x < 15 && z > 4 && z < 15) return false;
    if (Math.abs(x) > 31 || Math.abs(z) > 31) return false;
    return true;
}

function buildEnvironmentDecorations() {
    const sunGeo = new THREE.SphereGeometry(3.5, 16, 16);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    sunMesh.position.set(30, 42, -35);
    scene.add(sunMesh);

    const mountainTextureCanvas = document.createElement('canvas');
    mountainTextureCanvas.width = 1024;
    mountainTextureCanvas.height = 256;
    const ctx = mountainTextureCanvas.getContext('2d');

    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, 1024, 256);
    
    ctx.fillStyle = '#2d4a3e';
    ctx.beginPath();
    ctx.moveTo(0, 256);
    ctx.lineTo(0, 120);
    for (let x = 0; x <= 1024; x += 60) {
        ctx.lineTo(x, 80 + Math.sin(x * 0.01) * 40 + Math.cos(x * 0.03) * 20);
    }
    ctx.lineTo(1024, 256);
    ctx.fill();

    ctx.fillStyle = '#1e332a';
    ctx.beginPath();
    ctx.moveTo(0, 256);
    ctx.lineTo(0, 160);
    for (let x = 0; x <= 1024; x += 50) {
        ctx.lineTo(x, 130 + Math.cos(x * 0.02) * 35);
    }
    ctx.lineTo(1024, 256);
    ctx.fill();

    const mountainTexture = new THREE.CanvasTexture(mountainTextureCanvas);
    mountainTexture.wrapS = THREE.RepeatWrapping;
    mountainTexture.wrapT = THREE.ClampToEdgeWrapping;

    const mountainMat = new THREE.MeshBasicMaterial({
        map: mountainTexture,
        transparent: true,
        side: THREE.DoubleSide
    });

    const mtnWidth = 120;
    const mtnHeight = 30;
    const mtnDistance = 55;

    const directions = [
        { x: 0, z: -mtnDistance, rotY: 0 },
        { x: 0, z: mtnDistance, rotY: Math.PI },
        { x: -mtnDistance, z: 0, rotY: Math.PI / 2 },
        { x: mtnDistance, z: 0, rotY: -Math.PI / 2 }
    ];

    directions.forEach(d => {
        const mtnPlane = new THREE.Mesh(new THREE.PlaneGeometry(mtnWidth, mtnHeight), mountainMat);
        mtnPlane.position.set(d.x, mtnHeight / 2 - 2, d.z);
        mtnPlane.rotation.y = d.rotY;
        scene.add(mtnPlane);
    });

    const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1, transparent: true, opacity: 0.88 });
    const cloudPositions = [
        { x: -25, y: 24, z: -15 }, { x: 15, y: 28, z: -25 }, { x: 30, y: 22, z: 10 },
        { x: -30, y: 26, z: 20 }, { x: 0, y: 30, z: -30 }, { x: 22, y: 25, z: 25 }
    ];

    cloudPositions.forEach(p => {
        const group = new THREE.Group();
        group.position.set(p.x, p.y, p.z);
        for (let c = 0; c < 5; c++) {
            const cloudPart = new THREE.Mesh(new THREE.DodecahedronGeometry(2 + Math.random() * 1.5), cloudMat);
            cloudPart.position.set((c - 2) * 1.8, (Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 1.2);
            group.add(cloudPart);
        }
        scene.add(group);
    });

    const grassMat = new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.8 });
    for (let g = 0; g < 35; g++) {
        const rx = (Math.random() - 0.5) * 50;
        const rz = (Math.random() - 0.5) * 50;
        if (isLocationFree(rx, rz)) {
            const grassGroup = new THREE.Group();
            grassGroup.position.set(rx, 0, rz);
            for (let b = 0; b < 3; b++) {
                const blade = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.4 + Math.random() * 0.2, 4), grassMat);
                blade.position.set((b - 1) * 0.08, 0.2, (Math.random() - 0.5) * 0.08);
                blade.rotation.z = (b - 1) * 0.2;
                grassGroup.add(blade);
            }
            scene.add(grassGroup);
        }
    }

    const rockMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 });
    for (let r = 0; r < 20; r++) {
        const rx = (Math.random() - 0.5) * 50;
        const rz = (Math.random() - 0.5) * 50;
        if (isLocationFree(rx, rz)) {
            const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.25 + Math.random() * 0.25), rockMat);
            rock.position.set(rx, 0.15, rz);
            rock.scale.set(1.2, 0.7, 1.0);
            rock.rotation.set(Math.random(), Math.random(), Math.random());
            scene.add(rock);
        }
    }
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

    createTriggerZone(-20, -14.5, 'chicken');
    createTriggerZone(-20, 14, 'cow');
    createTriggerZone(20, 17.5, 'pig');
}

function buildPlotsGrid() {
    plotMeshes = [];
    const startX = -12;
    const startZ = -9;

    for (let i = 0; i < CONFIG.TOTAL_PLOTS; i++) {
        const row = Math.floor(i / CONFIG.PLOTS_PER_ROW);
        const col = i % CONFIG.PLOTS_PER_ROW;
        const posX = startX + col * CONFIG.PLOT_SPACING;
        const posZ = startZ + row * CONFIG.PLOT_SPACING;

        const isUnlocked = gameState.unlockedPlots[i];
        const plotMesh = new THREE.Mesh(
            new THREE.BoxGeometry(1.8, 0.2, 1.8),
            new THREE.MeshStandardMaterial({ color: isUnlocked ? 0xc28544 : 0x475569, roughness: 0.9 })
        );
        plotMesh.position.set(posX, 0.1, posZ);
        plotMesh.receiveShadow = true;
        plotMesh.castShadow = true;
        plotMesh.userData = { type: 'plot', index: i };
        scene.add(plotMesh);

        plotMeshes.push(plotMesh);
        updatePlotVisual(i, true);
    }
}

export function updatePlotColorsByLevel() {
    plotMeshes.forEach((mesh, i) => {
        if (!gameState.unlockedPlots[i]) {
            const groupIndex = Math.floor(i / 6);
            const unlockLevelReq = groupIndex * 10;

            if (gameState.level >= unlockLevelReq) {
                mesh.material.color.setHex(0xeab308);
            } else {
                mesh.material.color.setHex(0x475569);
            }
        }
    });
}

function buildOrchardArea() {
    orchardPlotMeshes = [];
    for (let i = 0; i < 10; i++) {
        const posX = 16 + (i % 2) * 3;
        const posZ = -12 + Math.floor(i / 2) * 3.5;

        const treeData = gameState.orchardPlots[i];
        const mesh = new THREE.Mesh(
            new THREE.CylinderGeometry(1.2, 1.2, 0.2, 16),
            new THREE.MeshStandardMaterial({ color: treeData.unlocked ? 0x854d0e : 0x334155 })
        );
        mesh.position.set(posX, 0.1, posZ);
        mesh.receiveShadow = true;
        mesh.userData = { type: 'orchard', index: i };
        scene.add(mesh);
        orchardPlotMeshes.push(mesh);
        updateOrchardVisual(i);
    }
}

export function updateOrchardVisual(idx) {
    const mesh = orchardPlotMeshes[idx];
    if (!mesh) return;
    const tree = gameState.orchardPlots[idx];

    if (mesh.userData.treeMesh) {
        mesh.remove(mesh.userData.treeMesh);
        mesh.userData.treeMesh = null;
    }

    if (tree.unlocked) {
        if (tree.treeType) {
            const treeInfo = TREES_DB[tree.treeType];
            const elapsed = (Date.now() - tree.plantedAt) / 1000;
            const ratio = Math.min(1.0, elapsed / treeInfo.harvestTime);

            const group = new THREE.Group();
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 2.0), new THREE.MeshStandardMaterial({ color: 0x78350f }));
            trunk.position.y = 1.0;
            group.add(trunk);

            const foliageScale = 0.5 + ratio * 0.7;
            const leaves = new THREE.Mesh(new THREE.DodecahedronGeometry(1.2 * foliageScale), new THREE.MeshStandardMaterial({ color: 0x15803d }));
            leaves.position.y = 2.4 * foliageScale;
            group.add(leaves);

            if (ratio >= 1.0) {
                for (let f = 0; f < 5; f++) {
                    const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
                    fruit.position.set((Math.random() - 0.5) * 1.2, 2.0 + Math.random() * 0.8, (Math.random() - 0.5) * 1.2);
                    group.add(fruit);
                }
            }

            mesh.add(group);
            mesh.userData.treeMesh = group;
        }
    }
}

export function updatePlotVisual(idx, fullRebuild = false) {
    const mesh = plotMeshes[idx];
    if (!mesh) return;
    const plot = gameState.plots[idx];

    if (mesh.userData.cropMesh) {
        mesh.remove(mesh.userData.cropMesh);
        mesh.userData.cropMesh = null;
    }

    if (gameState.unlockedPlots[idx] && plot && plot.cropId) {
        const group = new THREE.Group();
        const crop = CROPS_DB[plot.cropId];

        if (plot.isDead) {
            const deadMat = new THREE.MeshStandardMaterial({ color: 0x78350f });
            const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.6), deadMat);
            stem.position.y = 0.3;
            stem.rotation.z = 0.4;
            group.add(stem);
        } else {
            const effTime = crop.growTime - (plot.reducedSecs || 0);
            const elapsed = (Date.now() - plot.plantedAt) / 1000;
            const ratio = Math.min(1.0, elapsed / effTime);

            const cropMat = new THREE.MeshStandardMaterial({ color: ratio >= 1.0 ? 0x22c55e : 0x84cc16 });
            const plant = new THREE.Mesh(new THREE.ConeGeometry(0.3 + ratio * 0.3, 0.6 + ratio * 0.8, 6), cropMat);
            plant.position.y = (0.6 + ratio * 0.8) / 2;
            group.add(plant);

            if (plot.hasPest) {
                const pestMat = new THREE.MeshBasicMaterial({ color: 0x9333ea });
                const pest = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), pestMat);
                pest.position.set(0, 0.8 + ratio * 0.8, 0);
                group.add(pest);
            }
        }

        mesh.add(group);
        mesh.userData.cropMesh = group;
    }
}

function buildPenFence(x, z, width, depth, gateSide = 'front') {
    const fenceGroup = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.8 });
    const postGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.9, 8);
    const railGeoH = new THREE.BoxGeometry(width, 0.08, 0.05);
    const railGeoV = new THREE.BoxGeometry(0.05, 0.08, depth);

    const hW = width / 2;
    const hD = depth / 2;

    const corners = [
        { x: -hW, z: -hD }, { x: hW, z: -hD },
        { x: -hW, z: hD },  { x: hW, z: hD }
    ];

    corners.forEach(c => {
        const post = new THREE.Mesh(postGeo, woodMat);
        post.position.set(c.x, 0.45, c.z);
        post.castShadow = true;
        post.receiveShadow = true;
        fenceGroup.add(post);
    });

    if (gateSide !== 'back') {
        [0.3, 0.65].forEach(y => {
            const rail = new THREE.Mesh(railGeoH, woodMat);
            rail.position.set(0, y, -hD);
            rail.castShadow = true;
            fenceGroup.add(rail);
        });
    }

    if (gateSide !== 'front') {
        [0.3, 0.65].forEach(y => {
            const rail = new THREE.Mesh(railGeoH, woodMat);
            rail.position.set(0, y, hD);
            rail.castShadow = true;
            fenceGroup.add(rail);
        });
    } else {
        const gateWidth = 1.4;
        const sideWidth = (width - gateWidth) / 2;
        [ -hW + sideWidth / 2, hW - sideWidth / 2 ].forEach(posX => {
            [0.3, 0.65].forEach(y => {
                const r = new THREE.Mesh(new THREE.BoxGeometry(sideWidth, 0.08, 0.05), woodMat);
                r.position.set(posX, y, hD);
                r.castShadow = true;
                fenceGroup.add(r);
            });
            const p = new THREE.Mesh(postGeo, woodMat);
            p.position.set(posX > 0 ? hW - sideWidth : -hW + sideWidth, 0.45, hD);
            p.castShadow = true;
            fenceGroup.add(p);
        });
    }

    [0.3, 0.65].forEach(y => {
        const rail = new THREE.Mesh(railGeoV, woodMat);
        rail.position.set(-hW, y, 0);
        rail.castShadow = true;
        fenceGroup.add(rail);
    });

    [0.3, 0.65].forEach(y => {
        const rail = new THREE.Mesh(railGeoV, woodMat);
        rail.position.set(hW, y, 0);
        rail.castShadow = true;
        fenceGroup.add(rail);
    });

    fenceGroup.position.set(x, 0, z);
    scene.add(fenceGroup);
    return fenceGroup;
}

function buildChickenPen() {
    buildPenFence(-20, -18, 8, 6, 'front');
    updateAnimalPen3DMeshes('chicken');
}

function buildCowBarn() {
    buildPenFence(-20, 10, 9, 7, 'front');
    updateAnimalPen3DMeshes('cow');
}

function buildPigPen() {
    buildPenFence(20, 14, 8, 6, 'front');
    updateAnimalPen3DMeshes('pig');
}

export function updateAnimalPen3DMeshes(type) {
    if (type === 'chicken') {
        chickenMeshes.forEach(item => scene.remove(item.mesh));
        chickenMeshes = [];
        gameState.chickens.forEach(data => {
            const mesh = createChickenModel(data);
            chickenMeshes.push({ mesh, data });
        });
    } else if (type === 'cow') {
        cowMeshes.forEach(item => scene.remove(item.mesh));
        cowMeshes = [];
        gameState.cows.forEach(data => {
            const mesh = createCowModel(data);
            cowMeshes.push({ mesh, data });
        });
    } else if (type === 'pig') {
        pigMeshes.forEach(item => scene.remove(item.mesh));
        pigMeshes = [];
        gameState.pigs.forEach(data => {
            const mesh = createPigModel(data);
            pigMeshes.push({ mesh, data });
        });
    }
}

function buildFishPond() {
    const pondGroup = new THREE.Group();
    pondGroup.position.set(0, 0, 20);

    const rimMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.4, 0.25, 24), rimMat);
    rim.position.y = 0.05;
    pondGroup.add(rim);

    const waterMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, transparent: true, opacity: 0.82, roughness: 0.1 });
    const water = new THREE.Mesh(new THREE.CylinderGeometry(2.9, 2.9, 0.2, 24), waterMat);
    water.position.y = 0.08;
    pondGroup.add(water);

    pondGroup.userData = { type: 'pond' };
    scene.add(pondGroup);

    updatePondFishVisuals();
}

export function updatePondFishVisuals() {
    pondFishMeshes.forEach(f => scene.remove(f.mesh));
    pondFishMeshes = [];

    gameState.fishPond.fishes.forEach((fish) => {
        const fishGroup = new THREE.Group();
        const isAdult = !fish.type.startsWith('fry_');
        
        const fishMat = new THREE.MeshStandardMaterial({
            color: fish.type.includes('goldfish') ? 0xf97316 : 0x0ea5e9,
            roughness: 0.3
        });

        const scale = isAdult ? 0.25 : 0.15;
        const body = new THREE.Mesh(new THREE.ConeGeometry(scale, scale * 2.5, 8), fishMat);
        body.rotation.x = Math.PI / 2;
        fishGroup.add(body);

        const tail = new THREE.Mesh(new THREE.BoxGeometry(0.02, scale * 0.8, scale * 0.8), fishMat);
        tail.position.z = -scale * 1.2;
        fishGroup.add(tail);

        fishGroup.position.set(0, 0.15, 20);
        scene.add(fishGroup);

        pondFishMeshes.push({ mesh: fishGroup, data: fish });
    });
}

export function build4CookingStoves() {
    stoveMeshes = [];
    const positions = [
        { x: -5, z: -20 },
        { x: -1.8, z: -20 },
        { x: 1.8, z: -20 },
        { x: 5, z: -20 }
    ];

    positions.forEach((p, idx) => {
        const group = new THREE.Group();
        group.position.set(p.x, 0, p.z);

        const stoveData = gameState.kitchenStoves[idx];
        const isUnlocked = stoveData && stoveData.unlocked;

        const baseMat = new THREE.MeshStandardMaterial({ color: isUnlocked ? 0xef4444 : 0x475569, roughness: 0.6 });
        const base = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.8, 1.4), baseMat);
        base.position.y = 0.4;
        base.castShadow = true;
        group.add(base);

        const topMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3 });
        const top = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.05, 1.3), topMat);
        top.position.y = 0.82;
        group.add(top);

        if (isUnlocked) {
            const potMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.2, metalness: 0.8 });
            const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.3, 0.35, 12), potMat);
            pot.position.y = 1.02;
            group.add(pot);
        }

        group.userData = { type: 'stove', index: idx };
        scene.add(group);
        stoveMeshes.push(group);
    });
}

function create3DAvatar() {
    playerGroup = new THREE.Group();
    playerGroup.position.set(0, 0, 5);

    const headMat = new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.6 });
    const headGeo = new THREE.SphereGeometry(0.42, 16, 16);
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.45;
    head.castShadow = true;
    playerGroup.add(head);

    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1e1b4b });
    const shineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), eyeMat);
    leftEye.position.set(-0.14, 1.48, 0.36);
    leftEye.scale.set(1, 1.3, 0.4);
    playerGroup.add(leftEye);

    const leftShine = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), shineMat);
    leftShine.position.set(-0.12, 1.51, 0.39);
    playerGroup.add(leftShine);

    const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), eyeMat);
    rightEye.position.set(0.14, 1.48, 0.36);
    rightEye.scale.set(1, 1.3, 0.4);
    playerGroup.add(rightEye);

    const rightShine = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), shineMat);
    rightShine.position.set(0.16, 1.51, 0.39);
    playerGroup.add(rightShine);

    const blushMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e, transparent: true, opacity: 0.6 });
    const leftBlush = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), blushMat);
    leftBlush.position.set(-0.21, 1.41, 0.35);
    leftBlush.scale.set(1.2, 0.6, 0.3);
    playerGroup.add(leftBlush);

    const rightBlush = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), blushMat);
    rightBlush.position.set(0.21, 1.41, 0.35);
    rightBlush.scale.set(1.2, 0.6, 0.3);
    playerGroup.add(rightBlush);

    const smileMat = new THREE.MeshBasicMaterial({ color: 0x9f1239 });
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.012, 8, 8, Math.PI), smileMat);
    smile.position.set(0, 1.40, 0.39);
    smile.rotation.x = Math.PI / 2;
    smile.rotation.z = Math.PI;
    playerGroup.add(smile);

    const hatMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.8 });
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.05, 16), hatMat);
    brim.position.y = 1.72;
    brim.rotation.x = 0.1;
    playerGroup.add(brim);

    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 0.35, 16), hatMat);
    crown.position.y = 1.9;
    crown.rotation.x = 0.1;
    playerGroup.add(crown);

    const ribbon = new THREE.Mesh(new THREE.CylinderGeometry(0.39, 0.40, 0.08, 16), new THREE.MeshBasicMaterial({ color: 0xdc2626 }));
    ribbon.position.y = 1.78;
    ribbon.rotation.x = 0.1;
    playerGroup.add(ribbon);

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.7 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.7 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.35), bodyMat);
    body.position.y = 0.85;
    body.castShadow = true;
    playerGroup.add(body);

    const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.25, 0.33), shirtMat);
    shirt.position.y = 1.05;
    playerGroup.add(shirt);

    const armMat = shirtMat;
    const legMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.8 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });

    playerLeftArm = new THREE.Group();
    playerLeftArm.position.set(-0.32, 1.1, 0);
    const lArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.45), armMat);
    lArmMesh.position.y = -0.2;
    playerLeftArm.add(lArmMesh);
    playerGroup.add(playerLeftArm);

    playerRightArm = new THREE.Group();
    playerRightArm.position.set(0.32, 1.1, 0);
    const rArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.45), armMat);
    rArmMesh.position.y = -0.2;
    playerRightArm.add(rArmMesh);
    playerGroup.add(playerRightArm);

    playerLeftLeg = new THREE.Group();
    playerLeftLeg.position.set(-0.15, 0.55, 0);
    const lLegMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.5), legMat);
    lLegMesh.position.y = -0.25;
    const lShoe = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.25), shoeMat);
    lShoe.position.set(0, -0.48, 0.04);
    playerLeftLeg.add(lLegMesh);
    playerLeftLeg.add(lShoe);
    playerGroup.add(playerLeftLeg);

    playerRightLeg = new THREE.Group();
    playerRightLeg.position.set(0.15, 0.55, 0);
    const rLegMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.5), legMat);
    rLegMesh.position.y = -0.25;
    const rShoe = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.25), shoeMat);
    rShoe.position.set(0, -0.48, 0.04);
    playerRightLeg.add(rLegMesh);
    playerRightLeg.add(rShoe);
    playerGroup.add(playerRightLeg);

    scene.add(playerGroup);
}

function createTriggerZone(x, z, penType) {
    const group = new THREE.Group();
    group.position.set(x, 0.02, z);

    const ringGeo = new THREE.RingGeometry(0.8, 1.1, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xfcb316, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    const innerGeo = new THREE.CircleGeometry(0.8, 32);
    const innerMat = new THREE.MeshBasicMaterial({ color: 0xfde047, side: THREE.DoubleSide, transparent: true, opacity: 0.25 });
    const inner = new THREE.Mesh(innerGeo, innerMat);
    inner.rotation.x = Math.PI / 2;
    group.add(inner);

    group.userData = { type: penType + '_trigger', penType: penType };
    scene.add(group);

    triggerZones.push({ x, z, radius: 1.2, penType, mesh: group, isInside: false });
}

function setupTouchAndClickEvents(onWorldTapCallback, onTriggerEnter) {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    window.addEventListener('pointerdown', (e) => {
        if (e.target.closest('.interactive-ui') || e.target.closest('#modal-dialog') || e.target.closest('#modal-shop') || e.target.closest('#modal-inventory') || e.target.closest('#modal-quests') || e.target.closest('#modal-market') || e.target.closest('#modal-kitchen') || e.target.closest('#modal-horse-race') || e.target.closest('#modal-bau-cua') || e.target.closest('#modal-animal-pen') || e.target.closest('#modal-fish-select') || e.target.closest('#modal-seeds') || e.target.closest('#modal-tree-saplings')) {
            return;
        }

        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);

        if (intersects.length > 0) {
            let hitObj = intersects[0].object;
            while (hitObj.parent && hitObj.parent !== scene && !hitObj.userData.type) {
                hitObj = hitObj.parent;
            }

            const type = hitObj.userData.type;
            const point = intersects[0].point;

            if (type === 'ground') {
                playerTargetPos = new THREE.Vector3(point.x, 0, point.z);
            } else if (type === 'plot') {
                const idx = hitObj.userData.index;
                playerTargetPos = new THREE.Vector3(hitObj.position.x, 0, hitObj.position.z + 1.2);
                pendingWorldInteraction = () => onWorldTapCallback('plot', idx);
            } else if (type === 'orchard') {
                const idx = hitObj.userData.index;
                playerTargetPos = new THREE.Vector3(hitObj.position.x, 0, hitObj.position.z + 1.5);
                pendingWorldInteraction = () => onWorldTapCallback('orchard', idx);
            } else if (type && type.endsWith('_trigger')) {
                playerTargetPos = new THREE.Vector3(hitObj.position.x, 0, hitObj.position.z);
            } else if (type === 'pond') {
                playerTargetPos = new THREE.Vector3(0, 0, 20 - 4);
                pendingWorldInteraction = () => onWorldTapCallback('pond');
            } else if (type === 'stove') {
                playerTargetPos = new THREE.Vector3(hitObj.position.x, 0, hitObj.position.z + 1.2);
                pendingWorldInteraction = () => onWorldTapCallback('stove');
            }
        }
    });

    window.addEventListener('keydown', (e) => {
        if (!playerGroup) return;
        const key = e.key.toLowerCase();
        const step = 0.8;
        let moved = false;
        let targetX = playerGroup.position.x;
        let targetZ = playerGroup.position.z;

        if (key === 'w' || key === 'arrowup') { targetZ -= step; moved = true; }
        if (key === 's' || key === 'arrowdown') { targetZ += step; moved = true; }
        if (key === 'a' || key === 'arrowleft') { targetX -= step; moved = true; }
        if (key === 'd' || key === 'arrowright') { targetX += step; moved = true; }

        if (moved) playerTargetPos = new THREE.Vector3(targetX, 0, targetZ);
    });
}

export function applyWeatherEffects(type) {
    if (weatherParticleSystem) {
        scene.remove(weatherParticleSystem);
        weatherParticleSystem.geometry.dispose();
        weatherParticleSystem.material.dispose();
        weatherParticleSystem = null;
    }

    if (type === 'sunny') {
        scene.background.setHex(0x87ceeb);
        scene.fog.color.setHex(0x87ceeb);
        sunLight.intensity = 1.3;
        ambientLight.intensity = 0.75;
    } else if (type === 'cloudy') {
        scene.background.setHex(0x94a3b8);
        scene.fog.color.setHex(0x94a3b8);
        sunLight.intensity = 0.8;
        ambientLight.intensity = 0.6;
    } else if (type === 'rainy') {
        scene.background.setHex(0x475569);
        scene.fog.color.setHex(0x475569);
        sunLight.intensity = 0.5;
        ambientLight.intensity = 0.5;

        const count = 250;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 80;
            positions[i + 1] = Math.random() * 40;
            positions[i + 2] = (Math.random() - 0.5) * 80;
        }
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const material = new THREE.PointsMaterial({ color: 0x38bdf8, size: 0.25, transparent: true, opacity: 0.75 });
        weatherParticleSystem = new THREE.Points(geometry, material);
        weatherParticleSystem.userData = { type: 'rainy' };
        scene.add(weatherParticleSystem);
    } else if (type === 'snowy') {
        scene.background.setHex(0xe2e8f0);
        scene.fog.color.setHex(0xe2e8f0);
        sunLight.intensity = 0.9;
        ambientLight.intensity = 0.8;

        const count = 250;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 80;
            positions[i + 1] = Math.random() * 40;
            positions[i + 2] = (Math.random() - 0.5) * 80;
        }
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const material = new THREE.PointsMaterial({ color: 0xffffff, size: 0.4, transparent: true, opacity: 0.9 });
        weatherParticleSystem = new THREE.Points(geometry, material);
        weatherParticleSystem.userData = { type: 'snowy' };
        scene.add(weatherParticleSystem);
    }
}

export function animate3D(onTriggerEnter) {
    requestAnimationFrame(() => animate3D(onTriggerEnter));
    controls.update();

    if (camera.position.y < 0.5) camera.position.y = 0.5;

    // Movement Player
    if (playerGroup) {
        if (playerTargetPos) {
            const currentPos = playerGroup.position;
            const dx = playerTargetPos.x - currentPos.x;
            const dz = playerTargetPos.z - currentPos.z;
            const dist = Math.sqrt(dx * dx + dz * dz);

            if (dist > 0.3) {
                isPlayerMoving = true;
                playerGroup.rotation.y = Math.atan2(dx, dz);
                currentPos.x += (dx / dist) * moveSpeed;
                currentPos.z += (dz / dist) * moveSpeed;

                walkAnimTime += 0.25;
                if (playerLeftLeg && playerRightLeg && playerLeftArm && playerRightArm) {
                    playerLeftLeg.rotation.x = Math.sin(walkAnimTime) * 0.6;
                    playerRightLeg.rotation.x = -Math.sin(walkAnimTime) * 0.6;
                    playerLeftArm.rotation.x = -Math.sin(walkAnimTime) * 0.6;
                    playerRightArm.rotation.x = Math.sin(walkAnimTime) * 0.6;
                }
            } else {
                isPlayerMoving = false;
                playerTargetPos = null;
                if (playerLeftLeg) playerLeftLeg.rotation.x = 0;
                if (playerRightLeg) playerRightLeg.rotation.x = 0;
                if (playerLeftArm) playerLeftArm.rotation.x = 0;
                if (playerRightArm) playerRightArm.rotation.x = 0;

                if (pendingWorldInteraction) {
                    const act = pendingWorldInteraction;
                    pendingWorldInteraction = null;
                    act();
                }
            }
        }

        const px = playerGroup.position.x;
        const pz = playerGroup.position.z;

        triggerZones.forEach(zone => {
            const dist = Math.hypot(px - zone.x, pz - zone.z);
            if (dist <= zone.radius) {
                if (!zone.isInside) {
                    zone.isInside = true;
                    zone.mesh.children[0].material.color.setHex(0x22c55e); 
                    playerTargetPos = null;
                    isPlayerMoving = false;
                    if (onTriggerEnter) onTriggerEnter(zone.penType);
                }
            } else {
                if (zone.isInside) {
                    zone.isInside = false;
                    zone.mesh.children[0].material.color.setHex(0xfcb316); 
                }
            }
        });
    }

    // Animals Movement
    const now = Date.now();
    chickenMeshes.forEach(item => {
        const c = item.data;
        const mesh = item.mesh;
        if (!c.targetX || Math.hypot(c.targetX - mesh.position.x, c.targetZ - mesh.position.z) < 0.2) {
            if (!c.nextMoveTime || now > c.nextMoveTime) {
                c.targetX = -20 + (Math.random() - 0.5) * 5;
                c.targetZ = -18 + (Math.random() - 0.5) * 3.5;
                c.nextMoveTime = now + 2000 + Math.random() * 4000;
            }
        } else {
            const dx = c.targetX - mesh.position.x;
            const dz = c.targetZ - mesh.position.z;
            mesh.rotation.y = Math.atan2(dx, dz);
            mesh.position.x += (dx / Math.hypot(dx, dz)) * 0.03;
            mesh.position.z += (dz / Math.hypot(dx, dz)) * 0.03;
            mesh.position.y = Math.abs(Math.sin(now * 0.01)) * 0.05;
            c.x = mesh.position.x; c.z = mesh.position.z;
        }
    });

    cowMeshes.forEach(item => {
        const c = item.data;
        const mesh = item.mesh;
        if (!c.targetX || Math.hypot(c.targetX - mesh.position.x, c.targetZ - mesh.position.z) < 0.2) {
            if (!c.nextMoveTime || now > c.nextMoveTime) {
                c.targetX = -20 + (Math.random() - 0.5) * 6.5;
                c.targetZ = 10 + (Math.random() - 0.5) * 4.5;
                c.nextMoveTime = now + 4000 + Math.random() * 6000;
            }
        } else {
            const dx = c.targetX - mesh.position.x;
            const dz = c.targetZ - mesh.position.z;
            mesh.rotation.y = Math.atan2(dx, dz);
            mesh.position.x += (dx / Math.hypot(dx, dz)) * 0.015;
            mesh.position.z += (dz / Math.hypot(dx, dz)) * 0.015;
            c.x = mesh.position.x; c.z = mesh.position.z;
        }
    });

    pigMeshes.forEach(item => {
        const p = item.data;
        const mesh = item.mesh;
        if (!p.targetX || Math.hypot(p.targetX - mesh.position.x, p.targetZ - mesh.position.z) < 0.2) {
            if (!p.nextMoveTime || now > p.nextMoveTime) {
                p.targetX = 20 + (Math.random() - 0.5) * 5.5;
                p.targetZ = 14 + (Math.random() - 0.5) * 3.8;
                p.nextMoveTime = now + 3000 + Math.random() * 5000;
            }
        } else {
            const dx = p.targetX - mesh.position.x;
            const dz = p.targetZ - mesh.position.z;
            mesh.rotation.y = Math.atan2(dx, dz);
            mesh.position.x += (dx / Math.hypot(dx, dz)) * 0.02;
            mesh.position.z += (dz / Math.hypot(dx, dz)) * 0.02;
            p.x = mesh.position.x; p.z = mesh.position.z;
        }
    });

    pondFishMeshes.forEach((item, idx) => {
        const mesh = item.mesh;
        const time = now * 0.001 + idx * 1.5;
        const radius = 1.8 + (idx % 3) * 0.6;
        mesh.position.x = Math.cos(time * 0.6) * radius;
        mesh.position.z = 20 + Math.sin(time * 0.6) * radius;
        mesh.position.y = 0.15 + Math.sin(time * 2) * 0.05;
        mesh.rotation.y = -time * 0.6 + Math.PI / 2;
    });

    if (weatherParticleSystem) {
        const positions = weatherParticleSystem.geometry.attributes.position.array;
        const type = weatherParticleSystem.userData.type;
        for (let i = 1; i < positions.length; i += 3) {
            positions[i] -= type === 'rainy' ? 0.8 : 0.2;
            if (positions[i] < 0) positions[i] = 40;
        }
        weatherParticleSystem.geometry.attributes.position.needsUpdate = true;
    }

    renderer.render(scene, camera);
}
