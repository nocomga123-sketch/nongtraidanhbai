import { CROPS_DB } from '../config/database.js';

export function createLockIconMesh(isOpen = false) {
    const group = new THREE.Group();
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.35, 0.2),
        new THREE.MeshStandardMaterial({ color: isOpen ? 0x10b981 : 0xea580c })
    );
    body.position.y = 0.175;
    body.castShadow = true;
    group.add(body);

    const shackle = new THREE.Mesh(
        new THREE.TorusGeometry(0.12, 0.04, 8, 16, Math.PI),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0 })
    );
    shackle.position.set(isOpen ? 0.08 : 0, 0.38, 0);
    shackle.rotation.z = isOpen ? -0.4 : 0;
    shackle.castShadow = true;
    group.add(shackle);

    return group;
}

export function renderCrop3DStage(cropId, growRatio, hasPest) {
    const group = new THREE.Group();

    if (growRatio < 0.33) {
        const sprout = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03, 0.04, 0.25),
            new THREE.MeshStandardMaterial({ color: 0x86efac })
        );
        sprout.position.y = 0.125;
        group.add(sprout);
    } else if (growRatio < 0.95) {
        const stalk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.06, 0.08, 0.5),
            new THREE.MeshStandardMaterial({ color: 0x22c55e })
        );
        stalk.position.y = 0.25;
        group.add(stalk);
    } else {
        if (cropId === 'rice') {
            for (let a = 0; a < 5; a++) {
                const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.7), new THREE.MeshStandardMaterial({ color: 0x854d0e }));
                stem.rotation.z = (a - 2) * 0.2;
                stem.position.set((a - 2) * 0.1, 0.35, 0);
                group.add(stem);

                const grains = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.35, 6), new THREE.MeshStandardMaterial({ color: 0xeab308 }));
                grains.position.set((a - 2) * 0.15, 0.65, 0);
                grains.rotation.z = (a - 2) * 0.3;
                group.add(grains);
            }
        } else if (cropId === 'corn') {
            const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 1.1), new THREE.MeshStandardMaterial({ color: 0x15803d }));
            stalk.position.y = 0.55;
            group.add(stalk);

            const cob = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.5, 10), new THREE.MeshStandardMaterial({ color: 0xfacc15 }));
            cob.position.set(0.12, 0.65, 0);
            cob.rotation.z = -0.3;
            group.add(cob);

            const silk = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.15), new THREE.MeshStandardMaterial({ color: 0xb45309 }));
            silk.position.set(0.2, 0.88, 0);
            group.add(silk);
        } else if (cropId === 'tomato') {
            const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.4), new THREE.MeshStandardMaterial({ color: 0x16a34a }));
            bush.position.y = 0.4;
            group.add(bush);

            for (let t = 0; t < 4; t++) {
                const tom = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.2 }));
                const angle = (t / 4) * Math.PI * 2;
                tom.position.set(Math.cos(angle) * 0.28, 0.35, Math.sin(angle) * 0.28);
                group.add(tom);
            }
        } else if (cropId === 'pumpkin') {
            const pumpkin = new THREE.Mesh(new THREE.SphereGeometry(0.38, 12, 8), new THREE.MeshStandardMaterial({ color: 0xea580c }));
            pumpkin.scale.set(1.2, 0.8, 1.2);
            pumpkin.position.y = 0.3;
            group.add(pumpkin);

            const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.18), new THREE.MeshStandardMaterial({ color: 0x15803d }));
            stem.position.y = 0.55;
            group.add(stem);
        } else if (cropId === 'watermelon') {
            const melon = new THREE.Mesh(new THREE.SphereGeometry(0.4, 12, 10), new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.3 }));
            melon.scale.set(1.3, 0.9, 0.9);
            melon.position.y = 0.32;
            group.add(melon);
        } else if (cropId === 'strawberry') {
            const bush = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), new THREE.MeshStandardMaterial({ color: 0x22c55e }));
            bush.position.y = 0.3;
            group.add(bush);

            for (let s = 0; s < 3; s++) {
                const berry = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.22, 8), new THREE.MeshStandardMaterial({ color: 0xf43f5e }));
                berry.rotation.x = Math.PI;
                const angle = (s / 3) * Math.PI * 2;
                berry.position.set(Math.cos(angle) * 0.25, 0.25, Math.sin(angle) * 0.25);
                group.add(berry);
            }
        }
    }

    if (hasPest) {
        const pest = new THREE.Mesh(new THREE.SphereGeometry(0.12), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
        pest.position.set(0.2, 0.4, 0.2);
        group.add(pest);
    }

    return group;
}
