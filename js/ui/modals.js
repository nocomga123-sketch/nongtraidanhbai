// js/ui/modals.js
import { 
    gameState, CROPS_DB, TREES_DB, FISH_DB, SUPPLIES_DB, RECIPES_DB, ANIMAL_PROD_INTERVALS,
    shopBuyQty, activeShopTab, setShopBuyQty, setActiveShopTab, getItemInfo, saveGame 
} from '../state/gameState.js';
import { updateUI, showToast } from './uiController.js';
import { 
    plotMeshes, orchardPlotMeshes, updatePlotVisual, updateOrchardVisual,
    updateAnimalPen3DMeshes, updatePondFishVisuals, build4CookingStoves, updatePlotColorsByLevel 
} from '../render/scene.js';

let selectedPlotIdx = null;
let currentPenType = null;

export function checkAndDeductStamina(cost) {
    if (cost <= 0) return true;
    if (gameState.stamina < cost) {
        showToast("Hết Thể Lực! ⚡", `Bạn cần ít nhất ${cost} Thể lực ⚡ để thực hiện!`, "⚡");
        return false;
    }
    gameState.staminaFloat = Math.max(0, gameState.staminaFloat - cost);
    gameState.stamina = Math.floor(gameState.staminaFloat);
    updateUI();
    saveGame();
    return true;
}

export function addExp(amount) {
    gameState.exp += amount;
    const reqExp = gameState.level * 100;
    if (gameState.exp >= reqExp) {
        gameState.exp -= reqExp;
        gameState.level += 1;
        gameState.staminaFloat = gameState.maxStamina;
        gameState.stamina = gameState.maxStamina;
        updatePlotColorsByLevel();
        showToast("THĂNG CẤP! 🎉", `Chúc mừng! Bạn đã đạt Cấp ${gameState.level}. Hồi đầy thể lực!`, "⭐", 4000);
    }
    updateUI();
    saveGame();
}

export function trackQuestProgress(type, itemId = null, count = 1) {
    let updated = false;
    if (!gameState.quests || !Array.isArray(gameState.quests)) return;

    gameState.quests.forEach(q => {
        if (!q.completed) {
            let match = false;
            if (q.type === type) {
                if (!q.targetItem || q.targetItem === itemId) match = true;
            }
            if (match) {
                q.progress += count;
                if (q.progress >= q.target) {
                    q.progress = q.target;
                    q.completed = true;
                    showToast("Nhiệm Vụ Hoàn Thành! 📜", `Bạn đã hoàn thành: "${q.title}". Mở menu để nhận thưởng!`, "🎉");
                }
                updated = true;
            }
        }
    });
    if (updated) {
        updateQuestBadge();
        saveGame();
    }
}

export function updateQuestBadge() {
    const badge = document.getElementById('quest-badge');
    if (!badge) return;
    const hasUnclaimed = gameState.quests && gameState.quests.some(q => q.completed && !q.claimed);
    if (hasUnclaimed) badge.classList.remove('hidden');
    else badge.classList.add('hidden');
}

export function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('hidden');

    if (id === 'modal-shop') renderShopItems();
    else if (id === 'modal-inventory') renderInventory();
    else if (id === 'modal-kitchen') renderKitchenStoves();
    else if (id === 'modal-market') renderMarketOrders();
    else if (id === 'modal-quests') renderQuests();
}

export function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
}

export function handlePlotClick(idx) {
    selectedPlotIdx = idx;

    if (!gameState.unlockedPlots[idx]) {
        const groupIndex = Math.floor(idx / 6);
        const unlockLevelReq = groupIndex * 10; 

        if (gameState.level < unlockLevelReq) return;

        const cost = 200 + idx * 50;
        if (confirm(`Bạn đã đạt Level ${gameState.level}! Bạn có muốn mở khóa ô đất số ${idx + 1} với giá ${cost} 🪙 không?`)) {
            if (gameState.gold >= cost) {
                gameState.gold -= cost;
                gameState.unlockedPlots[idx] = true;
                plotMeshes[idx].material.color.setHex(0xc28544);
                showToast("Mở Khoá Đất! 🌾", `Đã mở khóa ô đất ${idx + 1}!`, "🔓");
                updateUI();
                saveGame();
            } else {
                showToast("Thiếu Vàng! 🪙", "Bạn không đủ vàng để mở ô đất này.", "❌");
            }
        }
        return;
    }

    const plot = gameState.plots[idx];
    if (plot.isDead) {
        if (checkAndDeductStamina(2)) {
            plot.cropId = null;
            plot.isDead = false;
            plot.hasPest = false;
            updatePlotVisual(idx, true);
            showToast("Dọn Đất 🧹", "Đã dọn dẹp cây chết!", "🌱");
        }
        return;
    }

    if (gameState.currentTool === 'hand') {
        if (plot.hasPest) {
            if (checkAndDeductStamina(1)) {
                plot.hasPest = false;
                plot.pestImmune = true;
                gameState.inventory.worm = (gameState.inventory.worm || 0) + 1;
                addExp(5);
                trackQuestProgress('catch_bug');
                updatePlotVisual(idx, true);
                showToast("Bắt Sâu! 🐛", "Đã bắt 1 con sâu đất (+1 Sâu Đất)!", "✨");
            }
            return;
        }

        if (plot.cropId) {
            const crop = CROPS_DB[plot.cropId];
            const effTime = crop.growTime - (plot.reducedSecs || 0);
            const elapsed = (Date.now() - plot.plantedAt) / 1000;

            if (elapsed >= effTime) {
                if (checkAndDeductStamina(2)) {
                    gameState.inventory[crop.id] = (gameState.inventory[crop.id] || 0) + 1;
                    addExp(crop.exp);
                    trackQuestProgress('harvest_crop', crop.id);
                    plot.cropId = null;
                    plot.watered = false;
                    plot.reducedSecs = 0;
                    updatePlotVisual(idx, true);
                    showToast("Thu Hoạch! 🌾", `Thu hoạch được 1 ${crop.name}!`, "🧺");
                }
            } else {
                showToast("Cây Đang Phát Triển 🌱", `Cây chưa chín, hãy đợi chút nữa!`, "⏳");
            }
        } else {
            openSeedModal();
        }
    } else if (gameState.currentTool === 'water') {
        if (plot.cropId && !plot.watered) {
            if (checkAndDeductStamina(1)) {
                plot.watered = true;
                plot.reducedSecs = (plot.reducedSecs || 0) + 15;
                trackQuestProgress('water');
                showToast("Tưới Nước! 💧", "Đã tưới nước, rút ngắn 15s thời gian lớn!", "💧");
                updatePlotVisual(idx, true);
            }
        } else if (plot.watered) {
            showToast("Đã Tưới Nước 💧", "Ô đất này đã được tưới nước rồi!", "ℹ️");
        }
    }
}

export function handleOrchardClick(idx) {
    const tree = gameState.orchardPlots[idx];
    if (!tree.unlocked) {
        const cost = 800;
        if (confirm(`Bạn có muốn mở khóa vị trí trồng cây ăn quả số ${idx + 1} với giá ${cost} 🪙?`)) {
            if (gameState.gold >= cost) {
                gameState.gold -= cost;
                tree.unlocked = true;
                orchardPlotMeshes[idx].material.color.setHex(0x854d0e);
                showToast("Mở Khoá Cây Ăn Quả! 🌳", `Đã mở ô cây ăn quả ${idx + 1}!`, "🔓");
                updateUI();
                saveGame();
            }
        }
        return;
    }

    if (!tree.treeType) {
        openSaplingModal(idx);
    } else {
        const treeInfo = TREES_DB[tree.treeType];
        const elapsed = (Date.now() - tree.plantedAt) / 1000;
        if (elapsed >= treeInfo.harvestTime) {
            if (checkAndDeductStamina(2)) {
                gameState.inventory[tree.treeType] = (gameState.inventory[tree.treeType] || 0) + 3;
                addExp(treeInfo.exp);
                tree.plantedAt = Date.now();
                updateOrchardVisual(idx);
                showToast("Thu Hoạch Quả! 🧺", `Thu hoạch được 3 Quả ${treeInfo.name}!`, "🍎");
            }
        } else {
            showToast("Cây Đang Ra Quả 🍊", "Hãy chờ trái cây chín nhé!", "⏳");
        }
    }
}

function openSeedModal() {
    const list = document.getElementById('seed-list');
    if (!list) return;

    let html = '';
    Object.keys(CROPS_DB).forEach(key => {
        const crop = CROPS_DB[key];
        const seedKey = key + '_seed';
        const count = gameState.inventory[seedKey] || 0;

        html += `
            <div class="bg-amber-50 rounded-2xl p-3 border border-amber-200 flex flex-col justify-between items-center text-center">
                <div class="text-3xl mb-1">${crop.icon}</div>
                <div class="font-black text-xs text-slate-800">${crop.name}</div>
                <div class="text-[10px] text-slate-500 mb-2">Sở hữu: <b class="text-amber-600">${count}</b></div>
                <button onclick="window.plantSeed('${key}')" ${count <= 0 ? 'disabled' : ''} class="w-full py-1.5 ${count > 0 ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-slate-300 text-slate-500'} font-bold text-xs rounded-xl shadow">
                    Trồng Cây
                </button>
            </div>
        `;
    });

    list.innerHTML = html;
    openModal('modal-seeds');
}

window.plantSeed = function(cropKey) {
    if (selectedPlotIdx === null) return;
    const seedKey = cropKey + '_seed';
    if ((gameState.inventory[seedKey] || 0) <= 0) {
        showToast("Hết Hạt Giống! 🌾", "Hãy ghé Cửa hàng để mua thêm hạt giống!", "❌");
        return;
    }

    if (checkAndDeductStamina(1)) {
        gameState.inventory[seedKey] -= 1;
        gameState.plots[selectedPlotIdx] = {
            cropId: cropKey,
            plantedAt: Date.now(),
            watered: false,
            reducedSecs: 0,
            hasPest: false,
            pestAppearedAt: 0,
            pestImmune: false,
            isDead: false
        };
        updatePlotVisual(selectedPlotIdx, true);
        closeModal('modal-seeds');
        showToast("Đã Trồng Cây! 🌱", `Gieo hạt ${CROPS_DB[cropKey].name} thành công!`, "✨");
    }
};

function openSaplingModal(idx) {
    selectedPlotIdx = idx;
    const list = document.getElementById('sapling-list');
    if (!list) return;

    let html = '';
    Object.keys(TREES_DB).forEach(key => {
        const tree = TREES_DB[key];
        const saplingKey = 'sapling_' + key;
        const count = gameState.inventory[saplingKey] || 0;

        html += `
            <div class="bg-emerald-50 rounded-2xl p-3 border border-emerald-200 flex flex-col justify-between items-center text-center">
                <div class="text-3xl mb-1">${tree.icon}</div>
                <div class="font-black text-xs text-slate-800">${tree.name}</div>
                <div class="text-[10px] text-slate-500 mb-2">Sở hữu: <b class="text-emerald-600">${count}</b></div>
                <button onclick="window.plantSapling('${key}')" ${count <= 0 ? 'disabled' : ''} class="w-full py-1.5 ${count > 0 ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-slate-300 text-slate-500'} font-bold text-xs rounded-xl shadow">
                    Trồng Cây
                </button>
            </div>
        `;
    });

    list.innerHTML = html;
    openModal('modal-tree-saplings');
}

window.plantSapling = function(treeKey) {
    if (selectedPlotIdx === null) return;
    const saplingKey = 'sapling_' + treeKey;
    if ((gameState.inventory[saplingKey] || 0) <= 0) {
        showToast("Hết Cây Giống! 🌳", "Hãy ghé Cửa hàng mua cây giống!", "❌");
        return;
    }

    if (checkAndDeductStamina(2)) {
        gameState.inventory[saplingKey] -= 1;
        gameState.orchardPlots[selectedPlotIdx].treeType = treeKey;
        gameState.orchardPlots[selectedPlotIdx].plantedAt = Date.now();
        updateOrchardVisual(selectedPlotIdx);
        closeModal('modal-tree-saplings');
        showToast("Trồng Cây Ăn Quả! 🌳", `Đã trồng ${TREES_DB[treeKey].name}!`, "✨");
    }
};

export function openAnimalPenModal(penType) {
    currentPenType = penType;
    const titleMap = { chicken: '🐥 Chuồng Gà', cow: '🐮 Chuồng Bò', pig: '🐷 Chuồng Heo' };
    document.getElementById('animal-pen-title').innerText = titleMap[penType] || '🏡 Quản Lý Chuồng';

    let arrayName = penType === 'chicken' ? 'chickens' : (penType === 'cow' ? 'cows' : 'pigs');
    const items = gameState[arrayName] || [];

    let text = `Số lượng vật nuôi: <b>${items.length}</b><br>`;
    let hungryCount = items.filter(a => a.hungry).length;
    let sickCount = items.filter(a => a.sick).length;

    text += `Tình trạng: <span class="${hungryCount > 0 ? 'text-amber-600 font-bold' : 'text-emerald-600'}">${hungryCount} con đói</span> | <span class="${sickCount > 0 ? 'text-rose-600 font-bold' : 'text-emerald-600'}">${sickCount} con bệnh</span>`;
    document.getElementById('animal-pen-status').innerHTML = text;

    openModal('modal-animal-pen');
}

export function executePenAction(action) {
    if (!currentPenType) return;
    let arrayName = currentPenType === 'chicken' ? 'chickens' : (currentPenType === 'cow' ? 'cows' : 'pigs');
    const items = gameState[arrayName] || [];

    if (action === 'feed') {
        const feedKey = 'feed_' + currentPenType;
        const hungryList = items.filter(a => a.hungry);
        if (hungryList.length === 0) {
            showToast("Vật Nuôi Đã No 🌾", "Tất cả vật nuôi trong chuồng đều no bụng!", "ℹ️");
            return;
        }
        if ((gameState.inventory[feedKey] || 0) < hungryList.length) {
            showToast("Thiếu Thức Ăn! 🌾", `Bạn cần ${hungryList.length} thức ăn phù hợp!`, "❌");
            return;
        }
        if (checkAndDeductStamina(1)) {
            gameState.inventory[feedKey] -= hungryList.length;
            hungryList.forEach(a => a.hungry = false);
            showToast("Cho Ăn Thành Công! 🌾", `Đã cho tất cả vật nuôi ăn đầy đủ!`, "✨");
            openAnimalPenModal(currentPenType);
        }
    } else if (action === 'heal') {
        const sickList = items.filter(a => a.sick);
        if (sickList.length === 0) {
            showToast("Không Có Bệnh 💊", "Tất cả vật nuôi hoàn toàn khỏe mạnh!", "ℹ️");
            return;
        }
        if ((gameState.inventory.medicine || 0) < sickList.length) {
            showToast("Thiếu Thuốc! 💊", "Hãy mua thêm Thuốc Thú Y ở Cửa Hàng!", "❌");
            return;
        }
        if (checkAndDeductStamina(1)) {
            gameState.inventory.medicine -= sickList.length;
            sickList.forEach(a => a.sick = false);
            showToast("Chữa Bệnh! 💊", "Tất cả vật nuôi đã bình phục khỏe mạnh!", "✨");
            openAnimalPenModal(currentPenType);
        }
    } else if (action === 'add') {
        const buyKey = 'buy_' + currentPenType;
        if ((gameState.inventory[buyKey] || 0) <= 0) {
            showToast("Hết Con Giống! 🐥", "Hãy ghé Cửa Hàng mua con giống mới!", "❌");
            return;
        }
        if (checkAndDeductStamina(1)) {
            gameState.inventory[buyKey] -= 1;
            const posX = currentPenType === 'chicken' ? -20 : (currentPenType === 'cow' ? -20 : 20);
            const posZ = currentPenType === 'chicken' ? -18 : (currentPenType === 'cow' ? 10 : 14);

            items.push({
                id: Date.now(),
                bornAt: Date.now(),
                yieldCount: 0,
                hungry: false,
                sick: false,
                lastSickDay: 0,
                producedAt: Date.now(),
                x: posX,
                z: posZ
            });
            updateAnimalPen3DMeshes(currentPenType);
            showToast("Thêm Vật Nuôi! 🐣", "Đã thả vật nuôi mới vào chuồng!", "🎉");
            openAnimalPenModal(currentPenType);
        }
    } else if (action === 'harvest') {
        const now = Date.now();
        const interval = ANIMAL_PROD_INTERVALS[currentPenType];
        const readyAnimals = items.filter(a => !a.sick && !a.hungry && ((now - a.producedAt) / 1000 >= interval));

        if (readyAnimals.length > 0) {
            if (checkAndDeductStamina(2)) {
                const count = readyAnimals.length;
                let retiredCount = 0;

                readyAnimals.forEach(a => {
                    a.yieldCount = (a.yieldCount || 0) + 1;
                    a.producedAt = now;
                    if (a.yieldCount >= 10) retiredCount++;
                });

                let updatedList = items.filter(a => (a.yieldCount || 0) < 10);
                if (currentPenType === 'chicken') gameState.chickens = updatedList;
                else if (currentPenType === 'cow') gameState.cows = updatedList;
                else if (currentPenType === 'pig') gameState.pigs = updatedList;

                const prodKey = currentPenType === 'chicken' ? 'egg' : (currentPenType === 'cow' ? 'milk' : 'pork');
                const prodName = currentPenType === 'chicken' ? 'Trứng Gà' : (currentPenType === 'cow' ? 'Sữa Bò' : 'Thịt Heo');
                
                gameState.inventory[prodKey] = (gameState.inventory[prodKey] || 0) + count;
                addExp(count * 15);
                trackQuestProgress('collect_animal', prodKey, count);
                updateAnimalPen3DMeshes(currentPenType);

                if (retiredCount > 0) {
                    showToast("Thu Hoạch & Xuất Chuồng! 🧺", `Thu được ${count} ${prodName}. Có ${retiredCount} vật nuôi xuất chuồng!`, "🎉", 4000);
                } else {
                    showToast("Thu Hoạch Sản Phẩm! 🧺", `Thu được ${count} ${prodName}!`, "✨");
                }
                openAnimalPenModal(currentPenType);
            }
        } else {
            showToast("Chưa Có Sản Phẩm ⏳", "Vật nuôi chưa sẵn sàng cho sản phẩm mới!", "ℹ️");
        }
    }
}

export function openFishPondModal() {
    const list = document.getElementById('fish-stock-list');
    if (!list) return;

    let html = '';
    ['fry_goldfish', 'fry_carp'].forEach(fryKey => {
        const fInfo = FISH_DB[fryKey];
        const count = gameState.inventory[fryKey] || 0;

        html += `
            <div class="bg-sky-50 rounded-2xl p-3 border border-sky-200 flex flex-col justify-between items-center text-center">
                <div class="text-3xl mb-1">${fInfo.icon}</div>
                <div class="font-black text-xs text-slate-800">${fInfo.name}</div>
                <div class="text-[10px] text-slate-500 mb-2">Sở hữu: <b class="text-sky-600">${count}</b></div>
                <button onclick="window.addFishToPond('${fryKey}')" ${count <= 0 ? 'disabled' : ''} class="w-full py-1.5 ${count > 0 ? 'bg-sky-500 hover:bg-sky-600 text-white' : 'bg-slate-300 text-slate-500'} font-bold text-xs rounded-xl shadow">
                    Thả Cá
                </button>
            </div>
        `;
    });

    list.innerHTML = html;
    openModal('modal-fish-select');
}

window.addFishToPond = function(fryKey) {
    if (gameState.fishPond.fishes.length >= gameState.fishPond.capacity) {
        showToast("Ao Đã Đầy! 🐟", "Ao cá đã đạt giới hạn tối đa!", "❌");
        return;
    }
    if ((gameState.inventory[fryKey] || 0) <= 0) {
        showToast("Hết Cá Giống! 🐟", "Hãy mua thêm con giống trong Cửa Hàng!", "❌");
        return;
    }

    if (checkAndDeductStamina(1)) {
        gameState.inventory[fryKey] -= 1;
        gameState.fishPond.fishes.push({ id: Date.now(), type: fryKey, plantedAt: Date.now() });
        updatePondFishVisuals();
        openFishPondModal();
        showToast("Thả Cá Giống! 🐟", `Đã thả 1 ${FISH_DB[fryKey].name} vào ao!`, "💦");
    }
};

export function harvestFishFromPond() {
    const now = Date.now();
    let count = 0;
    const remaining = [];

    gameState.fishPond.fishes.forEach(f => {
        const fInfo = FISH_DB[f.type];
        const elapsed = (now - f.plantedAt) / 1000;
        if (elapsed >= fInfo.growTime) {
            count++;
            const adultId = fInfo.adultId;
            gameState.inventory[adultId] = (gameState.inventory[adultId] || 0) + 1;
            addExp(FISH_DB[adultId].exp);
        } else {
            remaining.push(f);
        }
    });

    if (count > 0) {
        if (checkAndDeductStamina(2)) {
            gameState.fishPond.fishes = remaining;
            updatePondFishVisuals();
            trackQuestProgress('harvest_fish', null, count);
            showToast("Thu Hoạch Ao Cá! 🐟", `Thu hoạch được ${count} cá lớn!`, "🧺");
            openFishPondModal();
        }
    } else {
        showToast("Chưa Có Cá Lớn 🐟", "Cá trong ao vẫn chưa đủ lớn!", "ℹ️");
    }
}

export function switchShopTab(tab) {
    setActiveShopTab(tab);
    document.querySelectorAll('.shop-tab-btn').forEach(btn => {
        btn.classList.remove('bg-amber-500', 'text-white', 'shadow');
        btn.classList.add('text-slate-600');
    });
    const sel = document.getElementById('tab-shop-' + tab);
    if (sel) {
        sel.classList.remove('text-slate-600');
        sel.classList.add('bg-amber-500', 'text-white', 'shadow');
    }
    renderShopItems();
}

export function adjustShopQty(delta) {
    setShopBuyQty(Math.max(1, Math.min(50, shopBuyQty + delta)));
    document.getElementById('shop-buy-qty').innerText = shopBuyQty;
}

export function renderShopItems() {
    const container = document.getElementById('shop-items-container');
    if (!container) return;

    let html = '';
    if (activeShopTab === 'seeds') {
        Object.keys(CROPS_DB).forEach(key => {
            const c = CROPS_DB[key];
            const price = c.seedCost * shopBuyQty;
            html += `
                <div class="bg-amber-50/80 rounded-2xl p-3 border border-amber-200 flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <span class="text-3xl">${c.icon}</span>
                        <div>
                            <div class="font-extrabold text-xs text-slate-800">Hạt Giống ${c.name}</div>
                            <div class="text-[10px] text-amber-600 font-bold">Giá: ${price} 🪙</div>
                        </div>
                    </div>
                    <button onclick="window.buyItem('${key}_seed')" class="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow">Mua</button>
                </div>
            `;
        });
    } else if (activeShopTab === 'trees') {
        Object.keys(TREES_DB).forEach(key => {
            const t = TREES_DB[key];
            const price = t.saplingCost * shopBuyQty;
            html += `
                <div class="bg-emerald-50/80 rounded-2xl p-3 border border-emerald-200 flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <span class="text-3xl">${t.icon}</span>
                        <div>
                            <div class="font-extrabold text-xs text-slate-800">Cây Giống ${t.name}</div>
                            <div class="text-[10px] text-emerald-600 font-bold">Giá: ${price} 🪙</div>
                        </div>
                    </div>
                    <button onclick="window.buyItem('sapling_${key}')" class="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow">Mua</button>
                </div>
            `;
        });
    } else if (activeShopTab === 'animals') {
        const animals = [
            { id: 'buy_chicken', name: 'Gà Con Giống', cost: 150, icon: '🐥' },
            { id: 'buy_cow', name: 'Bò Giống', cost: 500, icon: '🐮' },
            { id: 'buy_pig', name: 'Heo Giống', cost: 300, icon: '🐷' },
            { id: 'fry_goldfish', name: 'Cá Vàng Giống', cost: 50, icon: '🐟' },
            { id: 'fry_carp', name: 'Cá Chép Giống', cost: 120, icon: '🐠' }
        ];
        animals.forEach(a => {
            const price = a.cost * shopBuyQty;
            html += `
                <div class="bg-sky-50/80 rounded-2xl p-3 border border-sky-200 flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <span class="text-3xl">${a.icon}</span>
                        <div>
                            <div class="font-extrabold text-xs text-slate-800">${a.name}</div>
                            <div class="text-[10px] text-sky-600 font-bold">Giá: ${price} 🪙</div>
                        </div>
                    </div>
                    <button onclick="window.buyItem('${a.id}')" class="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-xl shadow">Mua</button>
                </div>
            `;
        });
    } else if (activeShopTab === 'supplies') {
        Object.keys(SUPPLIES_DB).forEach(key => {
            const s = SUPPLIES_DB[key];
            const price = s.cost * shopBuyQty;
            html += `
                <div class="bg-purple-50/80 rounded-2xl p-3 border border-purple-200 flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <span class="text-3xl">${s.icon}</span>
                        <div>
                            <div class="font-extrabold text-xs text-slate-800">${s.name}</div>
                            <div class="text-[10px] text-purple-600 font-bold">Giá: ${price} 🪙</div>
                        </div>
                    </div>
                    <button onclick="window.buyItem('${key}')" class="px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs rounded-xl shadow">Mua</button>
                </div>
            `;
        });
    } else if (activeShopTab === 'recipes') {
        Object.keys(RECIPES_DB).forEach(key => {
            const r = RECIPES_DB[key];
            const unlocked = gameState.unlockedRecipes.includes(key);
            html += `
                <div class="bg-orange-50/80 rounded-2xl p-3 border border-orange-200 flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <span class="text-3xl">${r.icon}</span>
                        <div>
                            <div class="font-extrabold text-xs text-slate-800">Công thức: ${r.name}</div>
                            <div class="text-[10px] text-orange-600 font-bold">${unlocked ? 'Đã mở khóa' : 'Giá: ' + (r.cost || 200) + ' 🪙'}</div>
                        </div>
                    </div>
                    <button onclick="window.buyRecipe('${key}')" ${unlocked ? 'disabled' : ''} class="px-3 py-1.5 ${unlocked ? 'bg-slate-300 text-slate-500' : 'bg-orange-500 hover:bg-orange-600 text-white'} font-bold text-xs rounded-xl shadow">
                        ${unlocked ? 'Đã Có' : 'Học'}
                    </button>
                </div>
            `;
        });
    } else if (activeShopTab === 'sell') {
        Object.keys(gameState.inventory).forEach(key => {
            const qty = gameState.inventory[key];
            if (qty > 0) {
                const info = getItemInfo(key);
                const price = (info.sellPrice || 10) * qty;
                html += `
                    <div class="bg-slate-50 rounded-2xl p-3 border border-slate-200 flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <span class="text-3xl">${info.icon}</span>
                            <div>
                                <div class="font-extrabold text-xs text-slate-800">${info.name}</div>
                                <div class="text-[10px] text-slate-500">Số lượng: <b>${qty}</b></div>
                            </div>
                        </div>
                        <button onclick="window.sellItem('${key}')" class="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow">
                            Bán (+${price}🪙)
                        </button>
                    </div>
                `;
            }
        });
    }

    container.innerHTML = html;
}

window.buyItem = function(itemKey) {
    const info = getItemInfo(itemKey);
    const unitPrice = info.cost || 20;
    const totalPrice = unitPrice * shopBuyQty;

    if (gameState.gold >= totalPrice) {
        gameState.gold -= totalPrice;
        gameState.inventory[itemKey] = (gameState.inventory[itemKey] || 0) + shopBuyQty;
        showToast("Mua Thành Công! 🛒", `Đã mua ${shopBuyQty} ${info.name}!`, "🪙");
        updateUI();
        renderShopItems();
        saveGame();
    } else {
        showToast("Không Đủ Vàng! 🪙", "Bạn cần thêm vàng để mua vật phẩm này!", "❌");
    }
};

window.buyRecipe = function(recipeKey) {
    const r = RECIPES_DB[recipeKey];
    const cost = r.cost || 200;
    if (gameState.gold >= cost) {
        gameState.gold -= cost;
        gameState.unlockedRecipes.push(recipeKey);
        showToast("Đã Học Công Thức! 📜", `Bạn đã mở khóa món ăn "${r.name}"!`, "🎉");
        updateUI();
        renderShopItems();
        saveGame();
    } else {
        showToast("Không Đủ Vàng! 🪙", "Bạn cần thêm vàng để mua công thức này!", "❌");
    }
};

window.sellItem = function(itemKey) {
    const qty = gameState.inventory[itemKey] || 0;
    if (qty <= 0) return;

    const info = getItemInfo(itemKey);
    const unitPrice = info.sellPrice || 10;
    const totalPrice = unitPrice * qty;

    gameState.gold += totalPrice;
    gameState.inventory[itemKey] = 0;
    showToast("Bán Hàng Thành Công! 💰", `Thu được +${totalPrice.toLocaleString()} 🪙!`, "🪙");
    updateUI();
    renderShopItems();
    saveGame();
};

export function renderInventory() {
    const container = document.getElementById('inventory-container');
    if (!container) return;

    let html = '';
    Object.keys(gameState.inventory).forEach(key => {
        const qty = gameState.inventory[key];
        if (qty > 0) {
            const info = getItemInfo(key);
            html += `
                <div class="bg-white/80 rounded-2xl p-3 border border-slate-200 flex flex-col items-center text-center shadow-sm">
                    <span class="text-3xl mb-1">${info.icon}</span>
                    <div class="font-extrabold text-xs text-slate-800 mb-1">${info.name}</div>
                    <div class="text-[10px] text-amber-600 font-bold mb-2">Số lượng: ${qty}</div>
                    ${info.staminaRestore ? `<button onclick="window.eatFood('${key}')" class="w-full py-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] rounded-xl shadow">Ăn (+${info.staminaRestore}⚡)</button>` : ''}
                </div>
            `;
        }
    });

    container.innerHTML = html || `<div class="col-span-3 text-center text-slate-400 py-8 font-bold">Túi đồ trống rỗng!</div>`;
}

window.eatFood = function(recipeKey) {
    const qty = gameState.inventory[recipeKey] || 0;
    if (qty <= 0) return;

    const r = RECIPES_DB[recipeKey];
    if (r && r.staminaRestore) {
        gameState.inventory[recipeKey] -= 1;
        gameState.staminaFloat = Math.min(gameState.maxStamina, gameState.staminaFloat + r.staminaRestore);
        gameState.stamina = Math.floor(gameState.staminaFloat);
        showToast("Thưởng Thức Món Ăn! 😋", `Hồi phục +${r.staminaRestore} Thể lực!`, "⚡");
        updateUI();
        renderInventory();
        saveGame();
    }
};

export function renderKitchenStoves() {
    const tabsContainer = document.getElementById('kitchen-stoves-tabs');
    if (!tabsContainer) return;

    let tabsHtml = '';
    gameState.kitchenStoves.forEach((s, idx) => {
        const isSelected = idx === gameState.selectedStoveIdx;
        tabsHtml += `
            <button onclick="window.selectStove(${idx})" class="p-2 rounded-2xl border flex flex-col items-center justify-center transition ${isSelected ? 'bg-amber-500 text-white border-amber-600 shadow-md scale-105' : (s.unlocked ? 'bg-white text-slate-700 border-slate-200' : 'bg-slate-200 text-slate-400 border-slate-300')}">
                <span class="text-lg">🍳</span>
                <span class="text-[10px] font-black">Bếp ${idx + 1}</span>
            </button>
        `;
    });
    tabsContainer.innerHTML = tabsHtml;

    const curStove = gameState.kitchenStoves[gameState.selectedStoveIdx];
    const statusEl = document.getElementById('stove-cooking-status');

    if (!curStove.unlocked) {
        statusEl.innerHTML = `
            <div class="flex items-center justify-between">
                <div>
                    <div class="font-extrabold text-slate-800">Bếp ${curStove.id + 1} chưa mở khóa</div>
                    <div class="text-[11px] text-slate-500">Yêu cầu Cấp ${curStove.levelReq} - Giá: ${curStove.cost} 🪙</div>
                </div>
                <button onclick="window.unlockStove(${curStove.id})" class="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow">Mở Khoá</button>
            </div>
        `;
    } else if (curStove.cooking) {
        const recipe = RECIPES_DB[curStove.recipeId];
        const elapsed = (Date.now() - curStove.startTime) / 1000;
        const remSecs = Math.max(0, Math.ceil(curStove.duration - elapsed));

        statusEl.innerHTML = `
            <div class="flex items-center justify-between">
                <div>
                    <div class="font-extrabold text-slate-800 flex items-center gap-1">${recipe.icon} Đang nấu ${recipe.name}...</div>
                    <div class="text-[11px] text-slate-500">Thời gian còn lại: <b>${Math.floor(remSecs/60)}m${remSecs%60}s</b></div>
                </div>
                <button onclick="window.claimCookedFood(${curStove.id})" ${remSecs > 0 ? 'disabled' : ''} class="px-3 py-1.5 ${remSecs === 0 ? 'bg-amber-500 hover:bg-amber-600 text-white animate-bounce' : 'bg-slate-300 text-slate-500'} font-bold rounded-xl shadow">
                    ${remSecs === 0 ? 'Nhận Món' : 'Đang Nấu'}
                </button>
            </div>
        `;
    } else {
        statusEl.innerHTML = `<div class="text-slate-600 font-bold text-center">Bếp trống. Chọn công thức bên dưới để bắt đầu nấu!</div>`;
    }

    const recipesContainer = document.getElementById('kitchen-recipes-container');
    let recipesHtml = '';

    gameState.unlockedRecipes.forEach(rKey => {
        const r = RECIPES_DB[rKey];
        let canCook = true;
        let reqText = [];

        Object.keys(r.ingredients).forEach(ing => {
            const reqQty = r.ingredients[ing];
            const hasQty = gameState.inventory[ing] || 0;
            if (hasQty < reqQty) canCook = false;
            const ingInfo = getItemInfo(ing);
            reqText.push(`${ingInfo.name}: ${hasQty}/${reqQty}`);
        });

        recipesHtml += `
            <div class="bg-white/90 rounded-2xl p-3 border border-amber-200 flex items-center justify-between shadow-sm">
                <div class="flex items-center gap-2.5">
                    <span class="text-3xl">${r.icon}</span>
                    <div>
                        <div class="font-black text-xs text-slate-800">${r.name}</div>
                        <div class="text-[10px] text-slate-500">${reqText.join(' | ')}</div>
                    </div>
                </div>
                <button onclick="window.cookRecipe('${rKey}')" ${(!curStove.unlocked || curStove.cooking || !canCook) ? 'disabled' : ''} class="px-3 py-1.5 ${canCook && curStove.unlocked && !curStove.cooking ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-slate-200 text-slate-400'} font-bold text-xs rounded-xl shadow">
                    Nấu
                </button>
            </div>
        `;
    });

    recipesContainer.innerHTML = recipesHtml;
}

window.selectStove = function(idx) {
    gameState.selectedStoveIdx = idx;
    renderKitchenStoves();
};

window.unlockStove = function(stoveIdx) {
    const stove = gameState.kitchenStoves[stoveIdx];
    if (gameState.level < stove.levelReq) {
        showToast("Cấp Độ Chưa Đủ! ⭐", `Bạn cần Cấp ${stove.levelReq} để mở bếp này!`, "❌");
        return;
    }
    if (gameState.gold < stove.cost) {
        showToast("Thiếu Vàng! 🪙", `Bạn cần ${stove.cost} Vàng để mở bếp này!`, "❌");
        return;
    }

    gameState.gold -= stove.cost;
    stove.unlocked = true;
    build4CookingStoves();
    showToast("Mở Khoá Bếp Nấu! 🍳", `Đã mở khóa Bếp ${stoveIdx + 1}!`, "🎉");
    updateUI();
    renderKitchenStoves();
    saveGame();
};

window.cookRecipe = function(recipeKey) {
    const stove = gameState.kitchenStoves[gameState.selectedStoveIdx];
    if (!stove || !stove.unlocked || stove.cooking) return;

    const r = RECIPES_DB[recipeKey];
    Object.keys(r.ingredients).forEach(ing => {
        gameState.inventory[ing] -= r.ingredients[ing];
    });

    stove.cooking = true;
    stove.recipeId = recipeKey;
    stove.startTime = Date.now();
    stove.duration = r.cookTime;

    showToast("Bắt Đầu Nấu! 🍳", `Đang chế biến món ${r.name}...`, "🔥");
    renderKitchenStoves();
    saveGame();
};

window.claimCookedFood = function(stoveIdx) {
    const stove = gameState.kitchenStoves[stoveIdx];
    if (!stove || !stove.cooking) return;

    const r = RECIPES_DB[stove.recipeId];
    gameState.inventory[stove.recipeId] = (gameState.inventory[stove.recipeId] || 0) + 1;
    addExp(25);
    trackQuestProgress('cook_recipe', stove.recipeId);

    stove.cooking = false;
    stove.recipeId = null;

    showToast("Món Ăn Hoàn Thành! 🍳", `Nhận được 1 ${r.name}!`, "🎉");
    renderKitchenStoves();
    saveGame();
};

export function renderMarketOrders() {
    const container = document.getElementById('market-orders-container');
    if (!container) return;

    let html = '';
    gameState.marketOrders.forEach(o => {
        let canFulfill = true;
        let reqsHtml = o.reqs.map(r => {
            const hasQty = gameState.inventory[r.id] || 0;
            if (hasQty < r.qty) canFulfill = false;
            return `<span class="inline-flex items-center gap-1 bg-amber-100 px-2 py-0.5 rounded-lg text-[10px] font-bold text-amber-800">${r.icon} ${r.name} (${hasQty}/${r.qty})</span>`;
        }).join(' ');

        html += `
            <div class="bg-amber-50/80 rounded-2xl p-3 border border-amber-200 flex flex-col gap-2">
                <div class="flex justify-between items-center">
                    <span class="font-extrabold text-xs text-slate-800">👤 Khách hàng: ${o.customer}</span>
                    <span class="text-xs font-black text-amber-600">+${o.rewardGold}🪙 | +${o.rewardExp}EXP</span>
                </div>
                <div class="flex flex-wrap gap-1">${reqsHtml}</div>
                <button onclick="window.fulfillMarketOrder('${o.id}')" ${!canFulfill || o.completed ? 'disabled' : ''} class="py-2 ${canFulfill && !o.completed ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-slate-200 text-slate-400'} font-bold text-xs rounded-xl shadow">
                    ${o.completed ? 'Đã Hoàn Thành' : 'Giao Hàng'}
                </button>
            </div>
        `;
    });

    container.innerHTML = html;
}

window.fulfillMarketOrder = function(orderId) {
    const order = gameState.marketOrders.find(o => o.id === orderId);
    if (!order || order.completed) return;

    order.reqs.forEach(r => {
        gameState.inventory[r.id] -= r.qty;
    });

    order.completed = true;
    gameState.gold += order.rewardGold;
    addExp(order.rewardExp);

    showToast("Giao Hàng Thành Công! 📦", `Nhận được +${order.rewardGold} Vàng & +${order.rewardExp} EXP!`, "🎉");

    if (gameState.marketOrders.every(o => o.completed)) {
        window.generateMarketOrders();
        showToast("Sạp Hàng Mới! 🏪", "Đã cập nhật đơn hàng khách mới!", "✨");
    }

    renderMarketOrders();
    updateUI();
    saveGame();
};

export function renderQuests() {
    const container = document.getElementById('quests-container');
    if (!container) return;

    let html = '';
    gameState.quests.forEach(q => {
        html += `
            <div class="bg-purple-50/80 rounded-2xl p-3 border border-purple-200 flex flex-col gap-2">
                <div class="flex justify-between items-center">
                    <span class="font-extrabold text-xs text-slate-800">${q.title}</span>
                    <span class="text-xs font-black text-purple-600">+${q.rewardGold}🪙 | +${q.rewardExp}EXP</span>
                </div>
                <div class="w-full bg-slate-200 h-2 rounded-full overflow-hidden border border-slate-300">
                    <div class="bg-purple-500 h-full" style="width: ${Math.floor((q.progress / q.target) * 100)}%"></div>
                </div>
                <div class="flex justify-between items-center text-[10px] text-slate-500">
                    <span>Tiến độ: ${q.progress}/${q.target}</span>
                    <button onclick="window.claimQuestReward('${q.id}')" ${!q.completed || q.claimed ? 'disabled' : ''} class="px-3 py-1 ${q.completed && !q.claimed ? 'bg-purple-500 hover:bg-purple-600 text-white animate-pulse' : 'bg-slate-200 text-slate-400'} font-bold rounded-xl shadow">
                        ${q.claimed ? 'Đã Nhận' : 'Nhận Thưởng'}
                    </button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

window.claimQuestReward = function(questId) {
    const q = gameState.quests.find(item => item.id === questId);
    if (!q || !q.completed || q.claimed) return;

    q.claimed = true;
    gameState.gold += q.rewardGold;
    addExp(q.rewardExp);

    showToast("Nhận Thưởng Nhiệm Vụ! 📜", `Nhận được +${q.rewardGold} Vàng & +${q.rewardExp} EXP!`, "🎉");
    renderQuests();
    updateQuestBadge();
    updateUI();
    saveGame();
};
