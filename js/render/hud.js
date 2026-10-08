import { gameState } from '../state/gameState.js';
import { CROPS_DB, TREES_DB, RECIPES_DB } from '../config/database.js';

export function formatTime(totalSecs) {
    const m = Math.floor(totalSecs / 60);
    const s = Math.floor(totalSecs % 60);
    return `${m > 0 ? m + 'm' : ''}${s}s`;
}

export function updateFloatingHUD(camera, plotMeshes, orchardPlotMeshes, stoveMeshes) {
    const container = document.getElementById('floating-hud-container');
    if (!container) return;

    let htmlContent = '';
    const now = Date.now();
    const tempV = new THREE.Vector3();

    // 1. Crops Floating Status
    gameState.plots.forEach((plot, i) => {
        if (plot.cropId && !plot.isDead) {
            const crop = CROPS_DB[plot.cropId];
            const effTime = crop.growTime - (plot.reducedSecs || 0);
            const elapsed = (now - plot.plantedAt) / 1000;
            const ratio = Math.min(1.0, elapsed / effTime);
            const remSecs = Math.max(0, Math.ceil(effTime - elapsed));

            const mesh = plotMeshes[i];
            if (mesh) {
                mesh.getWorldPosition(tempV);
                tempV.y += 1.2;
                tempV.project(camera);

                if (tempV.z < 1.0) {
                    const x = (tempV.x * .5 + .5) * window.innerWidth;
                    const y = (-(tempV.y * .5) + .5) * window.innerHeight;
                    const isReady = ratio >= 1.0;

                    htmlContent += `
                        <div class="hud-badge bg-white/90 backdrop-blur border border-amber-400 px-2 py-0.5 rounded-xl shadow text-[10px] font-extrabold flex items-center gap-1" style="left: ${x}px; top: ${y}px;">
                            <span>${crop.icon}</span>
                            ${isReady ? `<span class="text-emerald-600 font-black">CHÍN!</span>` : `<div class="w-10 bg-slate-200 h-1.5 rounded-full overflow-hidden border"><div class="bg-emerald-500 h-full" style="width:${Math.floor(ratio*100)}%"></div></div><span class="text-slate-600">${formatTime(remSecs)}</span>`}
                            ${plot.hasPest ? `<span>🐛</span>` : ''}
                            ${plot.watered ? `<span>💧</span>` : ''}
                        </div>
                    `;
                }
            }
        }
    });

    // 2. Orchard Trees Floating Status
    gameState.orchardPlots.forEach((tree, i) => {
        if (tree.unlocked && tree.treeType) {
            const treeInfo = TREES_DB[tree.treeType];
            const elapsed = (now - tree.plantedAt) / 1000;
            const ratio = Math.min(1.0, elapsed / treeInfo.harvestTime);
            const remSecs = Math.max(0, Math.ceil(treeInfo.harvestTime - elapsed));

            const mesh = orchardPlotMeshes[i];
            if (mesh) {
                mesh.getWorldPosition(tempV);
                tempV.y += 3.2;
                tempV.project(camera);

                if (tempV.z < 1.0) {
                    const x = (tempV.x * .5 + .5) * window.innerWidth;
                    const y = (-(tempV.y * .5) + .5) * window.innerHeight;
                    const isReady = ratio >= 1.0;

                    htmlContent += `
                        <div class="hud-badge bg-white/90 backdrop-blur border border-emerald-500 px-2 py-0.5 rounded-xl shadow text-[10px] font-extrabold flex items-center gap-1" style="left: ${x}px; top: ${y}px;">
                            <span>${treeInfo.icon}</span>
                            ${isReady ? `<span class="text-emerald-600 font-black">SẴN SÀNG!</span>` : `<div class="w-10 bg-slate-200 h-1.5 rounded-full overflow-hidden border"><div class="bg-emerald-500 h-full" style="width:${Math.floor(ratio*100)}%"></div></div><span class="text-slate-600">${formatTime(remSecs)}</span>`}
                        </div>
                    `;
                }
            }
        }
    });

    // 3. Kitchen Stoves Floating Status
    gameState.kitchenStoves.forEach((stove, i) => {
        if (stove.unlocked && stove.cooking) {
            const elapsed = (now - stove.startTime) / 1000;
            const ratio = Math.min(1.0, elapsed / stove.duration);
            const remSecs = Math.max(0, Math.ceil(stove.duration - elapsed));

            const mesh = stoveMeshes[i];
            if (mesh) {
                mesh.getWorldPosition(tempV);
                tempV.y += 2.2;
                tempV.project(camera);

                if (tempV.z < 1.0) {
                    const x = (tempV.x * .5 + .5) * window.innerWidth;
                    const y = (-(tempV.y * .5) + .5) * window.innerHeight;
                    const recipe = RECIPES_DB[stove.recipeId];

                    htmlContent += `
                        <div class="hud-badge bg-amber-500 text-white px-2 py-0.5 rounded-xl shadow text-[10px] font-black flex items-center gap-1" style="left: ${x}px; top: ${y}px;">
                            <span>🍳 ${recipe ? recipe.icon : ''}</span>
                            ${ratio >= 1.0 ? `<span>XONG!</span>` : `<div class="w-10 bg-black/30 h-1.5 rounded-full overflow-hidden"><div class="bg-white h-full" style="width:${Math.floor(ratio*100)}\%"></div></div><span>${formatTime(remSecs)}</span>`}
                        </div>
                    `;
                }
            }
        }
    });

    container.innerHTML = htmlContent;
}
