// js/render/models.js

export function createPlayerModel() {
    const group = new THREE.Group();

    // Đầu
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 16), new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.6 }));
    head.position.y = 1.45;
    head.castShadow = true;
    group.add(head);

    // Mắt Chibi
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1e1b4b });
    const lEye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), eyeMat);
    lEye.position.set(-0.14, 1.48, 0.36);
    group.add(lEye);
    const rEye = lEye.clone();
    rEye.position.set(0.14, 1.48, 0.36);
    group.add(rEye);

    // Mũ rơm
    const hatMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.8 });
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.05, 16), hatMat);
    brim.position.y = 1.72;
    group.add(brim);
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 0.35, 16), hatMat);
    crown.position.y = 1.9;
    group.add(crown);

    // Thân & Áo
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.35), new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.7 }));
    body.position.y = 0.85;
    body.castShadow = true;
    group.add(body);

    // Tay & Chân
    const armMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.7 });
    const legMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.8 });

    const lArm = new THREE.Group(); lArm.position.set(-0.32, 1.1, 0);
    const lArmM = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.45), armMat);
    lArmM.position.y = -0.2; lArm.add(lArmM); group.add(lArm);

    const rArm = new THREE.Group(); rArm.position.set(0.32, 1.1, 0);
    const rArmM = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.45), armMat);
    rArmM.position.y = -0.2; rArm.add(rArmM); group.add(rArm);

    const lLeg = new THREE.Group(); lLeg.position.set(-0.15, 0.55, 0);
    const lLegM = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.5), legMat);
    lLegM.position.y = -0.25; lLeg.add(lLegM); group.add(lLeg);

    const rLeg = new THREE.Group(); rLeg.position.set(0.15, 0.55, 0);
    const rLegM = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.5), legMat);
    rLegM.position.y = -0.25; rLeg.add(rLegM); group.add(rLeg);

    return { group, lArm, rArm, lLeg, rLeg };
}

export function createChickenModel(data) {
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 12), new THREE.MeshStandardMaterial({ color: 0xfffbeb, roughness: 0.6 }));
    body.scale.set(0.8, 0.9, 1.1);
    body.position.y = 0.35;
    body.castShadow = true;
    group.add(body);

    const comb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), new THREE.MeshStandardMaterial({ color: 0xdc2626 }));
    comb.position.set(0, 0.68, 0.20);
    group.add(comb);

    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.1, 6), new THREE.MeshStandardMaterial({ color: 0xf59e0b }));
    beak.position.set(0, 0.50, 0.36);
    beak.rotation.x = Math.PI / 2;
    group.add(beak);

    group.position.set(data.x, 0, data.z);
    group.userData = { type: 'chicken_pen' };
    return group;
}

export function createCowModel(data) {
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.8, 1.4), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 }));
    body.position.y = 0.85;
    body.castShadow = true;
    group.add(body);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.52, 0.55), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    head.position.set(0, 1.25, 0.75);
    head.castShadow = true;
    group.add(head);

    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.25, 0.25), new THREE.MeshStandardMaterial({ color: 0xfbcfe8 }));
    snout.position.set(0, 1.12, 1.02);
    group.add(snout);

    group.position.set(data.x, 0, data.z);
    group.userData = { type: 'cow_barn' };
    return group;
}

export function createPigModel(data) {
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.52, 16, 16), new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.6 }));
    body.scale.set(0.9, 0.85, 1.2);
    body.position.y = 0.55;
    body.castShadow = true;
    group.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 14, 14), new THREE.MeshStandardMaterial({ color: 0xf472b6 }));
    head.position.set(0, 0.65, 0.45);
    head.castShadow = true;
    group.add(head);

    const snout = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.08, 12), new THREE.MeshStandardMaterial({ color: 0xf43f5e }));
    snout.position.set(0, 0.60, 0.80);
    snout.rotation.x = Math.PI / 2;
    group.add(snout);

    group.position.set(data.x, 0, data.z);
    group.userData = { type: 'pig_pen' };
    return group;
}
