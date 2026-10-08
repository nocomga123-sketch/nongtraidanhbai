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

export function selectTool(tool) {
    gameState.currentTool = tool;
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.classList.remove('bg-amber-500', 'text-white', 'scale-105');
        btn.classList.add('bg-slate-200', 'text-slate-700');
    });
    const selected = document.getElementById('tool-' + tool);
    if (selected) {
        selected.classList.remove('bg-slate-200', 'text-slate-700');
        selected.classList.add('bg-amber-500', 'text-white', 'scale-105');
    }
}

export function updateFloatingHUD() {
    const container = document.getElementById('floating-hud-container');
    if (!container) return;

    let html = "";
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
        const effTime = crop.growTime - (plot.reducedSecs || 0);
        const elapsed = (now - plot.plantedAt) / 1000;
        const isReady = elapsed >= effTime;
        const remSecs = Math.max(0, Math.ceil(effTime - elapsed));

        html += `
            <div class="hud-badge bg-white/95 border border-amber-400 px-2 py-1 rounded-xl shadow text-[11px] font-black flex items-center gap-1 absolute" style="left: ${x}px; top: ${y}px;">
                <span>${crop.icon}</span>
                ${isReady ? '✨' : `<span class="font-mono">${remSecs}s</span>`}
            </div>
        `;
    });

    container.innerHTML = html;
}
