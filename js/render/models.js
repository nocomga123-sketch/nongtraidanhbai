// js/render/models.js

export function createChickenModel(data) {
    const group = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xfffbeb, roughness: 0.6 });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 12), bodyMat);
    body.scale.set(0.8, 0.9, 1.1);
    body.position.y = 0.35;
    body.castShadow = true;
    group.add(body);

    const combMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.5 });
    const comb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), combMat);
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
