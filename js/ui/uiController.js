// js/ui/uiController.js
import { gameState, CROPS_DB } from '../state/gameState.js';
import { camera, plotMeshes } from '../render/scene.js';

export function updateUI() {
    document.getElementById('gold-display').innerText = gameState.gold.toLocaleString('vi-VN');
    document.getElementById('stamina-display').innerText = `${gameState.stamina} / ${gameState.maxStamina}`;
    document.getElementById('player-level-badge').innerText = `Lv.${gameState.level}`;

    const reqExp = gameState.level * 100;
    const expPct = Math.min(100, Math.floor((gameState.exp / reqExp) * 100));
    document.getElementById('exp-bar').style.width = expPct + '%';
    document.getElementById('exp-text').innerText = `${gameState.exp} / ${reqExp} EXP`;

    updateFloatingHUD();
}

export function showToast(title, message, icon = '✨') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'p-3 bg-white/95 rounded-2xl shadow-xl border border-amber-300 flex items-center gap-3 text-xs font-bold';
    toast.innerHTML = `<span class="text-2xl">${icon}</span><div><div>${title}</div><div class="text-slate-500">${message}</div></div>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

export function updateFloatingHUD() {
    const container = document.getElementById('floating-hud-container');
    if (!container) return;

    let html = '';
    const tempV = new THREE.Vector3();
    const now = Date.now();

    gameState.plots.forEach((plot, i) => {
        if (!gameState.unlockedPlots[i] || !plot.cropId || plot.isDead) return;
        const mesh = plotMeshes[i];
        if (!mesh) return;

        mesh.getWorldPosition(tempV);
        tempV.y += 1.2;
        tempV.project(camera);
        if (tempV.z >= 1.0) return;

        const x = (tempV.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-(tempV.y * 0.5) + 0.5) * window.innerHeight;

        const crop = CROPS_DB[plot.cropId];
        const elapsed = (now - plot.plantedAt) / 1000;
        const remSecs = Math.max(0, Math.ceil(crop.growTime - elapsed));

        html += `
            <div class="hud-badge bg-white/95 border border-amber-400 px-2 py-1 rounded-xl shadow text-[11px] font-black flex items-center gap-1 absolute" style="left: ${x}px; top: ${y}px; transform: translate(-50%, -100%);">
                <span>${crop.icon}</span>
                ${remSecs === 0 ? '✨' : `<span class="font-mono">${remSecs}s</span>`}
            </div>
        `;
    });

    container.innerHTML = html;
}
