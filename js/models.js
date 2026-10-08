import { scene } from './scene.js';
import { gameState } from './state.js';

export let chickenMeshes = [];
export let cowMeshes = [];
export let pigMeshes = [];
export let pondFishMeshes = [];

export function createChickenModel(data) {
    const group = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xfffbeb, roughness: 0.6 });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 12), bodyMat);
    body.scale.set(0.8, 0.9, 1.1);
    body.position.y = 0.35;
    body.castShadow = true;
    group.add(body);

    const wingMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.7 });
    const leftWing = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), wingMat);
    leftWing.position.set(-0.2, 0.36, 0);
    leftWing.scale.set(0.3, 0.8, 1.2);
    leftWing.rotation.z = -0.2;
    group.add(leftWing);

    const rightWing = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), wingMat);
    rightWing.position.set(0.2, 0.36, 0);
    rightWing.scale.set(0.3, 0.8, 1.2);
    rightWing.rotation.z = 0.2;
    group.add(rightWing);

    const tailMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 });
    for (let i = -1; i <= 1; i++) {
        const feather = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.22, 5), tailMat);
        feather.position.set(i * 0.05, 0.45, -0.25);
        feather.rotation.x = -0.8;
        feather.rotation.y = i * 0.2;
        group.add(feather);
    }

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), bodyMat);
    head.position.set(0, 0.52, 0.22);
    head.castShadow = true;
    group.add(head);

    const combMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.5 });
    for (let c = 0; c < 3; c++) {
        const combPart = new THREE.Mesh(new THREE.SphereGeometry(0.04 + c * 0.01, 8, 8), combMat);
        combPart.position.set(0, 0.68 + c * 0.01, 0.20 + (c - 1) * 0.04);
        group.add(combPart);
    }

    const wattle = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), combMat);
    wattle.position.set(0, 0.44, 0.34);
    group.add(wattle);

    const beakMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 });
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.1, 6), beakMat);
    beak.position.set(0, 0.50, 0.36);
    beak.rotation.x = Math.PI / 2;
    group.add(beak);

    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const lEye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), eyeMat);
    lEye.position.set(-0.11, 0.54, 0.30);
    group.add(lEye);

    const rEye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), eyeMat);
    rEye.position.set(0.11, 0.54, 0.30);
    group.add(rEye);

    const legMat = beakMat;
    [-0.08, 0.08].forEach(x => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.2), legMat);
        leg.position.set(x, 0.1, 0);
        group.add(leg);

        const foot = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.01, 0.1), legMat);
        foot.position.set(x, 0.01, 0.03);
        group.add(foot);
    });

    group.position.set(data.x, 0, data.z);
    group.userData = { type: 'chicken_pen' };
    scene.add(group);
    return group;
}

export function createCowModel(data) {
    const group = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 });
    const spotMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.8, 1.4), bodyMat);
    body.position.y = 0.85;
    body.castShadow = true;
    group.add(body);

    const spot1 = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), spotMat);
    spot1.position.set(0.42, 0.95, 0.2);
    spot1.scale.set(0.2, 0.8, 1.0);
    group.add(spot1);

    const spot2 = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), spotMat);
    spot2.position.set(-0.42, 0.8, -0.3);
    spot2.scale.set(0.2, 0.7, 0.9);
    group.add(spot2);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.52, 0.55), bodyMat);
    head.position.set(0, 1.25, 0.75);
    head.castShadow = true;
    group.add(head);

    const snoutMat = new THREE.MeshStandardMaterial({ color: 0xfbcfe8, roughness: 0.6 });
    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.25, 0.25), snoutMat);
    snout.position.set(0, 1.12, 1.02);
    group.add(snout);

    const nostrilMat = new THREE.MeshBasicMaterial({ color: 0x831843 });
    [-0.12, 0.12].forEach(nx => {
        const n = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), nostrilMat);
        n.position.set(nx, 1.14, 1.15);
        group.add(n);
    });

    const hornMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.4 });
    [-0.24, 0.24].forEach(hx => {
        const horn = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.22, 8), hornMat);
        horn.position.set(hx, 1.58, 0.75);
        horn.rotation.z = hx > 0 ? -0.3 : 0.3;
        group.add(horn);
    });

    [-0.28, 0.28].forEach(ex => {
        const ear = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 0.1), bodyMat);
        ear.position.set(ex, 1.42, 0.72);
        ear.rotation.z = ex > 0 ? -0.2 : 0.2;
        group.add(ear);
    });

    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const shineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    [-0.18, 0.18].forEach(ex => {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), eyeMat);
        eye.position.set(ex, 1.32, 1.0);
        group.add(eye);

        const shine = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 6), shineMat);
        shine.position.set(ex + 0.01, 1.33, 1.03);
        group.add(shine);
    });

    const udder = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), snoutMat);
    udder.position.set(0, 0.52, -0.1);
    udder.scale.set(1, 0.6, 1.2);
    group.add(udder);

    const legMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.8 });
    const hoofMat = spotMat;

    const legPositions = [
        { x: -0.32, z: 0.45 }, { x: 0.32, z: 0.45 },
        { x: -0.32, z: -0.45 }, { x: 0.32, z: -0.45 }
    ];

    legPositions.forEach(p => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.5), legMat);
        leg.position.set(p.x, 0.25, p.z);
        leg.castShadow = true;
        group.add(leg);

        const hoof = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.14), hoofMat);
        hoof.position.set(p.x, 0.04, p.z);
        group.add(hoof);
    });

    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5), spotMat);
    tail.position.set(0, 0.8, -0.72);
    tail.rotation.x = 0.2;
    group.add(tail);

    group.position.set(data.x, 0, data.z);
    group.userData = { type: 'cow_barn' };
    scene.add(group);
    return group;
}

export function createPigModel(data) {
    const group = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.6 });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.52, 16, 16), bodyMat);
    body.scale.set(0.9, 0.85, 1.2);
    body.position.y = 0.55;
    body.castShadow = true;
    group.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 14, 14), bodyMat);
    head.position.set(0, 0.65, 0.45);
    head.castShadow = true;
    group.add(head);

    const snoutMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.5 });
    const snout = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.08, 12), snoutMat);
    snout.position.set(0, 0.60, 0.80);
    snout.rotation.x = Math.PI / 2;
    group.add(snout);

    const nostrilMat = new THREE.MeshBasicMaterial({ color: 0x881337 });
    [-0.05, 0.05].forEach(nx => {
        const n = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), nostrilMat);
        n.position.set(nx, 0.60, 0.84);
        group.add(n);
    });

    [-0.22, 0.22].forEach(ex => {
        const ear = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.22, 4), bodyMat);
        ear.position.set(ex, 0.88, 0.50);
        ear.rotation.z = ex > 0 ? -0.5 : 0.5;
        ear.rotation.x = 0.3;
        group.add(ear);
    });

    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1e1b4b });
    const shineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    [-0.15, 0.15].forEach(ex => {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), eyeMat);
        eye.position.set(ex, 0.72, 0.72);
        group.add(eye);

        const shine = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 6), shineMat);
        shine.position.set(ex + 0.01, 0.73, 0.75);
        group.add(shine);
    });

    const tailMat = snoutMat;
    const tail = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.02, 8, 12, Math.PI * 1.5), tailMat);
    tail.position.set(0, 0.6, -0.6);
    tail.rotation.y = Math.PI / 2;
    group.add(tail);

    const hoofMat = snoutMat;
    const legPositions = [
        { x: -0.22, z: 0.3 }, { x: 0.22, z: 0.3 },
        { x: -0.22, z: -0.3 }, { x: 0.22, z: -0.3 }
    ];

    legPositions.forEach(p => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.25), bodyMat);
        leg.position.set(p.x, 0.14, p.z);
        leg.castShadow = true;
        group.add(leg);

        const hoof = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.05), hoofMat);
        hoof.position.set(p.x, 0.02, p.z);
        group.add(hoof);
    });

    group.position.set(data.x, 0, data.z);
    group.userData = { type: 'pig_pen' };
    scene.add(group);
    return group;
}

export function updateAnimalPen3DMeshes(type) {
    if (type === 'chicken') {
        chickenMeshes.forEach(item => scene.remove(item.mesh));
        chickenMeshes.length = 0;
        gameState.chickens.forEach(data => {
            const mesh = createChickenModel(data);
            chickenMeshes.push({ mesh, data });
        });
    } else if (type === 'cow') {
        cowMeshes.forEach(item => scene.remove(item.mesh));
        cowMeshes.length = 0;
        gameState.cows.forEach(data => {
            const mesh = createCowModel(data);
            cowMeshes.push({ mesh, data });
        });
    } else if (type === 'pig') {
        pigMeshes.forEach(item => scene.remove(item.mesh));
        pigMeshes.length = 0;
        gameState.pigs.forEach(data => {
            const mesh = createPigModel(data);
            pigMeshes.push({ mesh, data });
        });
    }
}

export function updatePondFishVisuals() {
    pondFishMeshes.forEach(f => scene.remove(f.mesh));
    pondFishMeshes.length = 0;

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

export function updateAnimalMovement() {
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
            const angle = Math.atan2(dx, dz);
            mesh.rotation.y = angle;
            mesh.position.x += (dx / Math.hypot(dx, dz)) * 0.03;
            mesh.position.z += (dz / Math.hypot(dx, dz)) * 0.03;
            mesh.position.y = Math.abs(Math.sin(now * 0.01)) * 0.05;
            c.x = mesh.position.x;
            c.z = mesh.position.z;
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
            const angle = Math.atan2(dx, dz);
            mesh.rotation.y = angle;
            mesh.position.x += (dx / Math.hypot(dx, dz)) * 0.015;
            mesh.position.z += (dz / Math.hypot(dx, dz)) * 0.015;
            c.x = mesh.position.x;
            c.z = mesh.position.z;
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
            const angle = Math.atan2(dx, dz);
            mesh.rotation.y = angle;
            mesh.position.x += (dx / Math.hypot(dx, dz)) * 0.02;
            mesh.position.z += (dz / Math.hypot(dx, dz)) * 0.02;
            p.x = mesh.position.x;
            p.z = mesh.position.z;
        }
    });

    pondFishMeshes.forEach((item, idx) => {
        const mesh = item.mesh;
        const time = now * 0.001 + idx * 1.5;
        const radius = 1.8 + (idx % 3) * 0.6;
        const x = Math.cos(time * 0.6) * radius;
        const z = 20 + Math.sin(time * 0.6) * radius;
        
        mesh.position.x = x;
        mesh.position.z = z;
        mesh.position.y = 0.15 + Math.sin(time * 2) * 0.05;
        mesh.rotation.y = -time * 0.6 + Math.PI / 2;
    });
}
