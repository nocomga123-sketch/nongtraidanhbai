import { gameState, saveGame } from '../state/gameState.js';
import { CROPS_DB, TREES_DB, RECIPES_DB, FISH_DB, SUPPLIES_DB, ANIMALS_SHOP_DB } from '../config/database.js';
import { updateUI } from './uiController.js';
import { showToast } from './toasts.js';
import { update4Stoves3D } from '../render/scene.js';

let shopBuyQty = 1;

export function openModal(id) {
    if (id === 'modal-shop') switchShopTab('seeds');
    else if (id === 'modal-inventory') renderInventoryModal();
    else if (id === 'modal-market') renderMarketModal();
    else if (id === 'modal-quests') renderQuestsModal();
    document.getElementById(id).classList.remove('hidden');
}

export function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
}

export function adjustShopQty(delta) {
    shopBuyQty = Math.max(1, Math.min(99, shopBuyQty + delta));
    document.getElementById('shop-buy-qty').innerText = shopBuyQty;
}

export function switchShopTab(tab) {
    document.querySelectorAll('.shop-tab-btn').forEach(btn => btn.className = "shop-tab-btn flex-1 py-2 px-2 rounded-xl text-slate-600 hover:bg-white/50");
    const activeBtn = document.getElementById(`tab-shop-${tab}`);
    if (activeBtn) activeBtn.className = "shop-tab-btn flex-1 py-2 px-2 rounded-xl bg-amber-500 text-white shadow";

    const container = document.getElementById('shop-items-container');
    container.innerHTML = '';

    if (tab === 'seeds') {
        Object.values(CROPS_DB).forEach(c => {
            const price = c.seedCost * shopBuyQty;
            const item = document.createElement('div');
            item.className = "glass-panel p-3 rounded-2xl flex items-center justify-between border";
            item.innerHTML = `
                <div class="flex items-center gap-2">
                    <span class="text-3xl">${c.icon}</span>
                    <div>
                        <div class="font-bold text-xs">${c.name}</div>
                        <div class="text-[10px] text-slate-500">Giá: ${price}🪙 (x${shopBuyQty})</div>
                    </div>
                </div>
                <button class="btn-buy-item px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow" data-key="${c.id}_seed" data-cost="${price}">Mua</button>
            `;
            container.appendChild(item);
        });
    } else if (tab === 'recipes') {
        Object.values(RECIPES_DB).forEach(r => {
            const unlocked = gameState.unlockedRecipes.includes(r.id);
            const item = document.createElement('div');
            item.className = "glass-panel p-3 rounded-2xl flex items-center justify-between border";
            item.innerHTML = `
                <div class="flex items-center gap-2">
                    <span class="text-3xl">${r.icon}</span>
                    <div>
                        <div class="font-bold text-xs">${r.name}</div>
                        <div class="text-[10px] text-slate-500">${r.cost > 0 ? `Giá: ${r.cost}🪙` : 'Miễn phí'}</div>
                    </div>
                </div>
                ${unlocked ? `<span class="text-xs text-emerald-600 font-bold">Đã Mua</span>` : `
                    <button class="btn-buy-recipe px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow" data-id="${r.id}" data-cost="${r.cost}">Mua</button>
                `}
            `;
            container.appendChild(item);
        });
    }

    container.querySelectorAll('.btn-buy-item').forEach(btn => {
        btn.onclick = () => buyShopItem(btn.dataset.key, parseInt(btn.dataset.cost));
    });
}

function buyShopItem(itemKey, totalCost) {
    if (gameState.gold < totalCost) return showToast("Không Đủ Vàng 💰", "Bạn không có đủ Vàng!", "🪙");
    gameState.gold -= totalCost;
    gameState.inventory[itemKey] = (gameState.inventory[itemKey] || 0) + shopBuyQty;
    updateUI();
    saveGame();
    showToast("Mua Thành Công! 🛒", `Đã mua x${shopBuyQty} vật phẩm vào túi!`, "🛒");
}

export function openKitchenModal() {
    renderKitchenModal();
    document.getElementById('modal-kitchen').classList.remove('hidden');
}

function renderKitchenModal() {
    const tabsContainer = document.getElementById('kitchen-stoves-tabs');
    tabsContainer.innerHTML = '';
    gameState.kitchenStoves.forEach((stove, idx) => {
        const isSelected = gameState.selectedStoveIdx === idx;
        const tab = document.createElement('button');
        tab.onclick = () => { gameState.selectedStoveIdx = idx; renderKitchenModal(); };
        tab.className = `p-2 rounded-2xl border text-center flex flex-col items-center justify-center ${isSelected ? 'bg-amber-500 text-white' : 'bg-white text-slate-700'}`;
        tab.innerHTML = `<span class="text-xs font-bold">🍳 Bếp ${idx + 1}</span>`;
        tabsContainer.appendChild(tab);
    });

    const activeStove = gameState.kitchenStoves[gameState.selectedStoveIdx];
    const statusBox = document.getElementById('stove-cooking-status');
    statusBox.innerHTML = activeStove.unlocked ? `<div class="font-bold text-emerald-700">✨ Bếp #${gameState.selectedStoveIdx + 1} đang rảnh!</div>` : `<div class="font-bold text-slate-800">🔒 Bếp chưa mở khóa</div>`;
}

export function renderInventoryModal() {
    const container = document.getElementById('inventory-container');
    container.innerHTML = '';
    Object.entries(gameState.inventory).forEach(([itemKey, qty]) => {
        if (qty > 0) {
            const item = document.createElement('div');
            item.className = "glass-panel p-3 rounded-2xl flex flex-col items-center text-center border";
            item.innerHTML = `<div class="font-bold text-xs">${itemKey}</div><div class="text-[10px]">x${qty}</div>`;
            container.appendChild(item);
        }
    });
}

export function renderMarketModal() {}
export function renderQuestsModal() {}
