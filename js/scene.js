export let scene, camera, renderer, controls, sunLight, ambientLight;
export let weatherParticleSystem = null;

export function setWeatherParticleSystem(val) {
    weatherParticleSystem = val;
}

export function initScene() {
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

    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
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
        const ps = new THREE.Points(geometry, material);
        ps.userData = { type: 'rainy' };
        setWeatherParticleSystem(ps);
        scene.add(ps);
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
        const ps = new THREE.Points(geometry, material);
        ps.userData = { type: 'snowy' };
        setWeatherParticleSystem(ps);
        scene.add(ps);
    }
}
