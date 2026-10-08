import { scene } from './scene.js';
import { gameState } from './state.js';
import { CONFIG } from './config.js';
import { CROPS_DB, TREES_DB } from './data.js';
import { isLocationFree } from './utils.js';

export let plotMeshes = [];
export let orchardPlotMeshes = [];
export let stoveMeshes = [];
export let triggerZones = [];

export function buildEnvironmentDecorations() {
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
            const cloudPart = new THREE.Mesh(
                new THREE.DodecahedronGeometry(2 + Math.random() * 1.5),
                cloudMat
            );
            cloudPart.position.set(
                (c - 2) * 1.8,
                (Math.random() - 0.5) * 0.8,
                (Math.random() - 0.5) * 1.2
            );
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

export function createTriggerZone(x, z, penType) {
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

export function buildFarmIsland() {
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
    buildPenFence(-20, -18, 8, 6, 'front');
    buildPenFence(-20, 10, 9, 7, 'front');
    buildPenFence(20, 14, 8, 6, 'front');
    build4CookingStoves();

    createTriggerZone(-20, -14.5, 'chicken');
    createTriggerZone(-20, 14, 'cow');
    createTriggerZone(20, 17.5, 'pig');
}

function buildPlotsGrid() {
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

    if (tree.unlocked && tree.treeType) {
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
                fruit.position.set(
                    (Math.random() - 0.5) * 1.2,
                    2.0 + Math.random() * 0.8,
                    (Math.random() - 0.5) * 1.2
                );
                group.add(fruit);
            }
        }

        mesh.add(group);
        mesh.userData.treeMesh = group;
    }
}

export function updatePlotVisual(idx) {
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
