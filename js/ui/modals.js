// js/ui/modals.js
import { gameState, CROPS_DB, RECIPES_DB, getItemInfo, saveGame } from '../state/gameState.js';
import { updateUI } from './uiController.js';

let selectedPlotIdx = null;

export function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('hidden');

    if (id === 'modal-shop') renderShop();
    else if (id === 'modal-inventory') renderInventory();
    else if (id === 'modal-market') renderMarket();
    else if (id === 'modal-quests') renderQuests();
}

export function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
}

export function handlePlotClick(idx) {
    selectedPlotIdx = idx;
    const plot = gameState.plots[idx];

    if (!gameState.unlockedPlots[idx]) {
        if (confirm(`Bạn có muốn mở khóa ô đất số ${idx + 1} không?`)) {
            gameState.unlockedPlots[idx] = true;
            updateUI(); saveGame();
        }
        return;
    }

    if (!plot.cropId) {
        openModal('modal-seeds');
        renderSeedList();
    } else {
        const crop = CROPS_DB[plot.cropId];
        const elapsed = (Date.now() - plot.plantedAt) / 1000;
        if (elapsed >= crop.growTime) {
            gameState.inventory[crop.id] = (gameState.inventory[crop.id] || 0) + 1;
            gameState.exp += crop.exp;
            plot.cropId = null;
            updateUI(); saveGame();
            alert(`Thu hoạch thành công 1 ${crop.name}!`);
        } else {
            alert(`Cây đang lớn, vui lòng đợi!`);
        }
    }
}

function renderSeedList() {
    const list = document.getElementById('seed-list');
    if (!list) return;
    let html = '';
    Object.keys(CROPS_DB).forEach(k => {
        const c = CROPS_DB[k];
        const count = gameState.inventory[k + '_seed'] || 0;
        html += `
            <div class="bg-amber-50 p-3 rounded-2xl border flex flex-col items-center">
                <span class="text-3xl">${c.icon}</span>
                <span class="font-bold text-xs">${c.name} (${count})</span>
                <button onclick="window.plantSeed('${k}')" ${count <= 0 ? 'disabled' : ''} class="mt-2 px-3 py-1 bg-emerald-500 text-white font-bold text-xs rounded-xl">Trồng</button>
            </div>
        `;
    });
    list.innerHTML = html;
}

window.plantSeed = function(cropKey) {
    if (selectedPlotIdx === null) return;
    gameState.inventory[cropKey + '_seed']--;
    gameState.plots[selectedPlotIdx] = { cropId: cropKey, plantedAt: Date.now(), watered: false };
    closeModal('modal-seeds');
    updateUI(); saveGame();
};

function renderInventory() {
    const container = document.getElementById('inventory-container');
    if (!container) return;
    let html = '';
    Object.keys(gameState.inventory).forEach(k => {
        const q = gameState.inventory[k];
        if (q > 0) {
            const info = getItemInfo(k);
            html += `
                <div class="bg-white p-3 rounded-2xl border flex flex-col items-center">
                    <span class="text-3xl">${info.icon}</span>
                    <span class="font-bold text-xs">${info.name}</span>
                    <span class="text-[10px] text-amber-600 font-bold">x${q}</span>
                </div>
            `;
        }
    });
    container.innerHTML = html || '<div class="col-span-3 text-center text-slate-400 py-4">Túi đồ trống</div>';
}

function renderShop() {
    const container = document.getElementById('shop-items-container');
    if (!container) return;
    let html = '';
    Object.keys(CROPS_DB).forEach(k => {
        const c = CROPS_DB[k];
        html += `
            <div class="bg-amber-50 p-3 rounded-2xl border flex justify-between items-center">
                <div class="flex items-center gap-2"><span class="text-2xl">${c.icon}</span><span class="font-bold text-xs">${c.name}</span></div>
                <button onclick="window.buyItem('${k}_seed', ${c.seedCost})" class="px-3 py-1 bg-amber-500 text-white font-bold text-xs rounded-xl">Mua (${c.seedCost}🪙)</button>
            </div>
        `;
    });
    container.innerHTML = html;
}

window.buyItem = function(key, cost) {
    if (gameState.gold >= cost) {
        gameState.gold -= cost;
        gameState.inventory[key] = (gameState.inventory[key] || 0) + 1;
        updateUI(); saveGame(); renderShop();
    }
};

function renderMarket() {
    const container = document.getElementById('market-orders-container');
    if (container) container.innerHTML = '<div class="text-center font-bold text-slate-500 py-4">Sạp hàng đang cập nhật đơn hàng mới...</div>';
}

function renderQuests() {
    const container = document.getElementById('quests-container');
    if (container) container.innerHTML = '<div class="text-center font-bold text-slate-500 py-4">Nhiệm vụ hàng ngày đã hoàn thành!</div>';
}
