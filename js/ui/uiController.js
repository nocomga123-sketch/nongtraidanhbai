// js/ui/uiController.js
import { gameState, REAL_SECS_PER_GAME_HOUR, WEATHER_ICONS, CROPS_DB, TREES_DB, RECIPES_DB, ANIMAL_PROD_INTERVALS, FISH_DB } from '../state/gameState.js';
import { camera, plotMeshes, orchardPlotMeshes, stoveMeshes, chickenMeshes, cowMeshes, pigMeshes, pondFishMeshes } from '../render/scene.js';

let lastTextUpdate = 0;
let cachedHtmlContent = "";

function formatTime(totalSecs) {
    const m = Math.floor(totalSecs / 60);
    const s = Math.floor(totalSecs % 60);
    return `${m > 0 ? m + 'm' : ''}${s}s`;
}

export function updateUI() {
    document.getElementById('gold-display').innerText = gameState.gold.toLocaleString('vi-VN');
    document.getElementById('stamina-display').innerText = `${gameState.stamina} / ${gameState.maxStamina}`;
    document.getElementById('player-level-badge').innerText = `Lv.${gameState.level}`;

    const reqExp = gameState.level * 100;
    const expPct = Math.min(100, Math.floor((gameState.exp / reqExp) * 100));
    document.getElementById('exp-bar').style.width = expPct + '%';
    document.getElementById('exp-text').innerText = `${gameState.exp} / ${reqExp} EXP`;

    const hrs = Math.floor(gameState.dayTimeSeconds / REAL_SECS_PER_GAME_HOUR);
    const mins = Math.floor((gameState.dayTimeSeconds % REAL_SECS_PER_GAME_HOUR) * (60 / REAL_SECS_PER_GAME_HOUR));
    const formatStr = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    
    document.getElementById('game-time-display').innerText = formatStr;
    document.getElementById('day-counter-display').innerText = `Ngày ${gameState.gameDay}`;
    document.getElementById('weather-icon').innerText = WEATHER_ICONS[gameState.currentWeather] || '☀️';

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

export function showToast(title, message, icon = '✨', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }

    const toast = document.createElement('div');
    toast.className = 'toast-item glass-panel p-3 rounded-2xl flex items-center gap-3 shadow-2xl border border-amber-300/80 bg-white/95 text-slate-800';
    toast.innerHTML = `
        <div class="text-2xl bg-amber-100 p-2 rounded-xl flex items-center justify-center">${icon}</div>
        <div class="flex-1 pr-1">
            <div class="font-extrabold text-xs text-slate-800">${title}</div>
            <div class="text-[11px] text-slate-600 font-medium">${message}</div>
        </div>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

export function updateFloatingHUD() {
    const container = document.getElementById('floating-hud-container');
    if (!container) return;

    const now = Date.now();
    let htmlContent = "";
    const tempV = new THREE.Vector3();

    const getScreenCoords = (vec) => {
        tempV.copy(vec);
        tempV.project(camera);
        if (tempV.z >= 1.0) return null;
        return {
            x: (tempV.x * 0.5 + 0.5) * window.innerWidth,
            y: (-(tempV.y * 0.5) + 0.5) * window.innerHeight
        };
    };

    gameState.plots.forEach((plot, i) => {
        if (!gameState.unlockedPlots[i] || !plot.cropId || plot.isDead) return;
        const mesh = plotMeshes[i];
        if (!mesh) return;

        mesh.getWorldPosition(tempV);
        tempV.y += 1.2;
        const pos = getScreenCoords(tempV);
        if (!pos) return;

        const crop = CROPS_DB[plot.cropId];
        const effTime = crop.growTime - (plot.reducedSecs || 0);
        const elapsed = (now - plot.plantedAt) / 1000;
        const isReady = elapsed >= effTime;
        const remSecs = Math.max(0, Math.ceil(effTime - elapsed));

        htmlContent += `
            <div class="hud-badge bg-white/95 backdrop-blur border border-amber-400 px-2 py-1 rounded-xl shadow-md text-[11px] font-black flex items-center gap-1.5 absolute" style="left: ${pos.x}px; top: ${pos.y}px; transform: translate(-50%, -100%); pointer-events: none;">
                <span class="text-base">${crop.icon}</span>
                ${isReady ? '' : `<span class="text-slate-700 font-mono">${formatTime(remSecs)}</span>`}
                ${plot.hasPest ? `<span>🐛</span>` : ''}
                ${plot.watered ? `<span>💧</span>` : ''}
            </div>
        `;
    });

    gameState.orchardPlots.forEach((tree, i) => {
        if (!tree.unlocked || !tree.treeType) return;
        const mesh = orchardPlotMeshes[i];
        if (!mesh) return;

        mesh.getWorldPosition(tempV);
        tempV.y += 3.2;
        const pos = getScreenCoords(tempV);
        if (!pos) return;

        const treeInfo = TREES_DB[tree.treeType];
        const elapsed = (now - tree.plantedAt) / 1000;
        const isReady = elapsed >= treeInfo.harvestTime;
        const remSecs = Math.max(0, Math.ceil(treeInfo.harvestTime - elapsed));

        htmlContent += `
            <div class="hud-badge bg-white/95 backdrop-blur border border-emerald-500 px-2 py-1 rounded-xl shadow-md text-[11px] font-black flex items-center gap-1.5 absolute" style="left: ${pos.x}px; top: ${pos.y}px; transform: translate(-50%, -100%); pointer-events: none;">
                <span class="text-base">${treeInfo.icon}</span>
                ${isReady ? '' : `<span class="text-slate-700 font-mono">${formatTime(remSecs)}</span>`}
            </div>
        `;
    });

    gameState.kitchenStoves.forEach((stove, i) => {
        if (!stove.unlocked || !stove.cooking) return;
        const mesh = stoveMeshes[i];
        if (!mesh) return;

        mesh.getWorldPosition(tempV);
        tempV.y += 2.2;
        const pos = getScreenCoords(tempV);
        if (!pos) return;

        const recipe = RECIPES_DB[stove.recipeId];
        const elapsed = (now - stove.startTime) / 1000;
        const isReady = elapsed >= stove.duration;
        const remSecs = Math.max(0, Math.ceil(stove.duration - elapsed));

        htmlContent += `
            <div class="hud-badge bg-amber-500 text-white px-2 py-1 rounded-xl shadow-md text-[11px] font-black flex items-center gap-1.5 absolute" style="left: ${pos.x}px; top: ${pos.y}px; transform: translate(-50%, -100%); pointer-events: none;">
                <span class="text-base">🍳 ${recipe ? recipe.icon : ''}</span>
                ${isReady ? '' : `<span class="font-mono">${formatTime(remSecs)}</span>`}
            </div>
        `;
    });

    chickenMeshes.forEach(item => {
        const c = item.data;
        const elapsed = (now - c.producedAt) / 1000;
        const total = ANIMAL_PROD_INTERVALS.chicken;
        const isReady = elapsed >= total;
        const remSecs = Math.max(0, Math.ceil(total - elapsed));

        tempV.set(c.x, 0.9, c.z);
        const pos = getScreenCoords(tempV);
        if (pos) {
            let badgeStyle = "bg-white/95 border border-amber-400 text-slate-800";
            let textHtml = `<span class="text-base">🥚</span> ${isReady ? '' : `<span class="font-mono">${formatTime(remSecs)}</span>`}`;
            if (c.sick) { badgeStyle = "bg-rose-500 text-white"; textHtml = '<span class="text-base">🐥 💊</span>'; }
            else if (c.hungry) { badgeStyle = "bg-amber-500 text-white"; textHtml = '<span class="text-base">🐥 🌾</span>'; }

            htmlContent += `
                <div class="hud-badge ${badgeStyle} px-2 py-1 rounded-xl shadow-md text-[11px] font-black flex items-center gap-1.5 absolute" style="left: ${pos.x}px; top: ${pos.y}px; transform: translate(-50%, -100%); pointer-events: none;">
                    ${textHtml}
                </div>
            `;
        }
    });

    cowMeshes.forEach(item => {
        const c = item.data;
        const elapsed = (now - c.producedAt) / 1000;
        const total = ANIMAL_PROD_INTERVALS.cow;
        const isReady = elapsed >= total;
        const remSecs = Math.max(0, Math.ceil(total - elapsed));

        tempV.set(c.x, 1.8, c.z);
        const pos = getScreenCoords(tempV);
        if (pos) {
            let badgeStyle = "bg-white/95 border border-sky-400 text-slate-800";
            let textHtml = `<span class="text-base">🥛</span> ${isReady ? '' : `<span class="font-mono">${formatTime(remSecs)}</span>`}`;
            if (c.sick) { badgeStyle = "bg-rose-500 text-white"; textHtml = '<span class="text-base">🐮 💊</span>'; }
            else if (c.hungry) { badgeStyle = "bg-amber-500 text-white"; textHtml = '<span class="text-base">🐮 🌿</span>'; }

            htmlContent += `
                <div class="hud-badge ${badgeStyle} px-2 py-1 rounded-xl shadow-md text-[11px] font-black flex items-center gap-1.5 absolute" style="left: ${pos.x}px; top: ${pos.y}px; transform: translate(-50%, -100%); pointer-events: none;">
                    ${textHtml}
                </div>
            `;
        }
    });

    pigMeshes.forEach(item => {
        const p = item.data;
        const elapsed = (now - p.producedAt) / 1000;
        const total = ANIMAL_PROD_INTERVALS.pig;
        const isReady = elapsed >= total;
        const remSecs = Math.max(0, Math.ceil(total - elapsed));

        tempV.set(p.x, 1.4, p.z);
        const pos = getScreenCoords(tempV);
        if (pos) {
            let badgeStyle = "bg-white/95 border border-rose-400 text-slate-800";
            let textHtml = `<span class="text-base">🥩</span> ${isReady ? '' : `<span class="font-mono">${formatTime(remSecs)}</span>`}`;
            if (p.sick) { badgeStyle = "bg-rose-500 text-white"; textHtml = '<span class="text-base">🐷 💊</span>'; }
            else if (p.hungry) { badgeStyle = "bg-amber-500 text-white"; textHtml = '<span class="text-base">🐷 🥔</span>'; }

            htmlContent += `
                <div class="hud-badge ${badgeStyle} px-2 py-1 rounded-xl shadow-md text-[11px] font-black flex items-center gap-1.5 absolute" style="left: ${pos.x}px; top: ${pos.y}px; transform: translate(-50%, -100%); pointer-events: none;">
                    ${textHtml}
                </div>
            `;
        }
    });

    gameState.fishPond.fishes.forEach((fish, i) => {
        const fInfo = FISH_DB[fish.type];
        if (!fInfo) return;
        const elapsed = (now - fish.plantedAt) / 1000;
        const isReady = elapsed >= fInfo.growTime;
        const remSecs = Math.max(0, Math.ceil(fInfo.growTime - elapsed));

        const meshObj = pondFishMeshes[i];
        if (meshObj) {
            meshObj.mesh.getWorldPosition(tempV);
            tempV.y += 0.8;
            const pos = getScreenCoords(tempV);
            if (pos) {
                htmlContent += `
                    <div class="hud-badge bg-white/95 border border-sky-500 px-2 py-1 rounded-xl shadow-md text-[11px] font-black flex items-center gap-1.5 absolute" style="left: ${pos.x}px; top: ${pos.y}px; transform: translate(-50%, -100%); pointer-events: none;">
                        <span class="text-base">${fInfo.icon}</span>
                        ${isReady ? '' : `<span class="text-slate-700 font-mono">${formatTime(remSecs)}</span>`}
                    </div>
                `;
            }
        }
    });

    container.innerHTML = htmlContent;
}
