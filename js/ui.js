import { gameState, saveGame } from './state.js';
import { CROPS_DB, TREES_DB, FISH_DB, SUPPLIES_DB, RECIPES_DB, WEATHER_ICONS } from './data.js';
import { REAL_SECS_PER_GAME_HOUR, ANIMAL_PROD_INTERVALS } from './config.js';
import { getItemInfo, showToast, formatTime } from './utils.js';
import { camera } from './scene.js';
import { plotMeshes, orchardPlotMeshes, stoveMeshes, updatePlotVisual, updateOrchardVisual, updatePlotColorsByLevel, build4CookingStoves } from './environment.js';
import { chickenMeshes, cowMeshes, pigMeshes, pondFishMeshes, updateAnimalPen3DMeshes, updatePondFishVisuals } from './models.js';

export let shopBuyQty = 1;
export let activeShopTab = 'seeds';
export let selectedPlotIdx = null;
export let currentPenType = null;

let lastTextUpdate = 0;
let cachedHtmlContent = "";

export function setSelectedPlotIdx(val) { selectedPlotIdx = val; }

export function updateUI() {
    document.getElementById('gold-display').innerText = gameState.gold.toLocaleString('vi-VN');
    document.getElementById('stamina-display').innerText = `${gameState.stamina} /${gameState.maxStamina}`;
    document.getElementById('player-level-badge').innerText = `Lv.${gameState.level}`;

    const reqExp = gameState.level * 100;
    const expPct = Math.min(100, Math.floor((gameState.exp / reqExp) * 100));
    document.getElementById('exp-bar').style.width = expPct + '%';
    document.getElementById('exp-text').innerText = `${gameState.exp} /${reqExp} EXP`;

    const hrs = Math.floor(gameState.dayTimeSeconds / REAL_SECS_PER_GAME_HOUR);
    const mins = Math.floor((gameState.dayTimeSeconds % REAL_SECS_PER_GAME_HOUR) * (60 / REAL_SECS_PER_GAME_HOUR));
    const formatStr = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    
    document.getElementById('game-time-display').innerText = formatStr;
    document.getElementById('day-counter-display').innerText = `Ngày ${gameState.gameDay}`;
    document.getElementById('weather-icon').innerText = WEATHER_ICONS[gameState.currentWeather] || '☀️';
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

export function updateQuestBadge() {
    const badge = document.getElementById('quest-badge');
    if (!badge) return;
    const hasUnclaimed = gameState.quests && gameState.quests.some(q => q.completed && !q.claimed);
    if (hasUnclaimed) badge.classList.remove('hidden');
    else badge.classList.add('hidden');
}

export function trackQuestProgress(type, itemId = null, count = 1) {
    let updated = false;
    if (!gameState.quests || !Array.isArray(gameState.quests)) return;

    gameState.quests.forEach(q => {
        if (!q.completed) {
            let match = false;
            if (q.type === type) {
                if (!q.targetItem || q.targetItem === itemId) {
                    match = true;
                }
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

export function generateDailyQuests() {
    const questPool = [
        { type: 'harvest_crop', itemId: 'rice', title: 'Thu hoạch 5 Lúa', target: 5, rewardGold: 300, rewardExp: 50 },
        { type: 'harvest_crop', itemId: 'corn', title: 'Thu hoạch 3 Bắp Ngô', target: 3, rewardGold: 350, rewardExp: 60 },
        { type: 'harvest_crop', itemId: 'tomato', title: 'Thu hoạch 3 Cà Chua', target: 3, rewardGold: 400, rewardExp: 70 },
        { type: 'harvest_crop', itemId: 'pumpkin', title: 'Thu hoạch 2 Bí Ngô', target: 2, rewardGold: 500, rewardExp: 80 },
        { type: 'catch_bug', itemId: null, title: 'Bắt 3 con sâu trên ruộng', target: 3, rewardGold: 350, rewardExp: 60 },
        { type: 'water', itemId: null, title: 'Tưới nước cho 8 ô đất', target: 8, rewardGold: 250, rewardExp: 40 },
        { type: 'collect_animal', itemId: 'egg', title: 'Thu hoạch 3 Trứng gà', target: 3, rewardGold: 300, rewardExp: 50 },
        { type: 'collect_animal', itemId: 'milk', title: 'Thu hoạch 2 Sữa bò', target: 2, rewardGold: 450, rewardExp: 75 },
        { type: 'collect_animal', itemId: 'pork', title: 'Thu hoạch 2 Thịt heo', target: 2, rewardGold: 500, rewardExp: 80 },
        { type: 'harvest_fish', itemId: null, title: 'Thu hoạch 2 Cá lớn trong ao', target: 2, rewardGold: 400, rewardExp: 65 },
        { type: 'cook_recipe', itemId: 'rice_bowl', title: 'Nấu 2 Cơm Trắng Dinh Dưỡng', target: 2, rewardGold: 450, rewardExp: 70 },
        { type: 'cook_recipe', itemId: 'grilled_corn', title: 'Nấu 2 Bắp Nướng Mỡ Hành', target: 2, rewardGold: 500, rewardExp: 85 },
        { type: 'cook_recipe', itemId: 'pork_stew', title: 'Nấu 1 Sườn Heo Hầm Cà Chua', target: 1, rewardGold: 600, rewardExp: 100 }
    ];

    const shuffled = [...questPool].sort(() => 0.5 - Math.random());
    gameState.quests = shuffled.slice(0, 3).map((q, idx) => ({
        id: 'quest_' + Date.now() + '_' + idx,
        type: q.type,
        targetItem: q.itemId,
        title: q.title,
        progress: 0,
        target: q.target,
        rewardGold: q.rewardGold,
        rewardExp: q.rewardExp,
        completed: false,
        claimed: false
    }));
    updateQuestBadge();
}

export function generateMarketOrders() {
    const possibleItems = [
        { id: 'rice', name: 'Lúa', price: 25, exp: 5, icon: '🌾' },
        { id: 'corn', name: 'Bắp Ngô', price: 65, exp: 12, icon: '🌽' },
        { id: 'tomato', name: 'Cà Chua', price: 110, exp: 20, icon: '🍅' },
        { id: 'pumpkin', name: 'Bí Ngô', price: 230, exp: 40, icon: '🎃' },
        { id: 'apple', name: 'Quả Táo', price: 180, exp: 35, icon: '🍎' },
        { id: 'egg', name: 'Trứng gà', price: 50, exp: 15, icon: '🥚' },
        { id: 'milk', name: 'Sữa bò', price: 120, exp: 25, icon: '🥛' },
        { id: 'pork', name: 'Thịt heo', price: 150, exp: 30, icon: '🥩' },
        { id: 'goldfish', name: 'Cá Vàng', price: 200, exp: 40, icon: '🐟' },
        { id: 'rice_bowl', name: 'Cơm Trắng', price: 80, exp: 20, icon: '🍚' },
        { id: 'grilled_corn', name: 'Bắp Nướng', price: 150, exp: 35, icon: '🌽' },
        { id: 'pork_stew', name: 'Sườn Heo Hầm', price: 550, exp: 80, icon: '🍲' }
    ];

    const customerNames = ["Cụ Bà Tư", "Anh Bảy Ngư Phủ", "Chị Hoa Đầu Bếp", "Thương Nhân Nam", "Chú Sáu Nông Dân"];

    gameState.marketOrders = [];
    for (let i = 0; i < 3; i++) {
        const item1 = possibleItems[Math.floor(Math.random() * possibleItems.length)];
        const qty1 = Math.floor(Math.random() * 3) + 1;
        
        let reqs = [{ id: item1.id, name: item1.name, icon: item1.icon, qty: qty1, price: item1.price }];
        let totalVal = item1.price * qty1;
        let totalExp = item1.exp * qty1;

        if (Math.random() < 0.5) {
            const item2 = possibleItems[Math.floor(Math.random() * possibleItems.length)];
            if (item2.id !== item1.id) {
                const qty2 = Math.floor(Math.random() * 2) + 1;
                reqs.push({ id: item2.id, name: item2.name, icon: item2.icon, qty: qty2, price: item2.price });
                totalVal += item2.price * qty2;
                totalExp += item2.exp * qty2;
            }
        }

        const bonusGold = Math.floor(totalVal * 1.35);
        const bonusExp = Math.floor(totalExp * 1.5);

        gameState.marketOrders.push({
            id: 'order_' + Date.now() + '_' + i,
            customer: customerNames[Math.floor(Math.random() * customerNames.length)],
            reqs: reqs,
            rewardGold: bonusGold,
            rewardExp: bonusExp,
            completed: false
        });
    }
}

export function handlePlotClick(idx) {
    setSelectedPlotIdx(idx);

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

export function openSeedModal() {
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
                <button class="btn-plant-seed w-full py-1.5 ${count > 0 ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-slate-300 text-slate-500'} font-bold text-xs rounded-xl shadow" data-crop="${key}" ${count <= 0 ? 'disabled' : ''}>
                    Trồng Cây
                </button>
            </div>
        `;
    });

    list.innerHTML = html;
    openModal('modal-seeds');
}

export function plantSeed(cropKey) {
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

export function openSaplingModal(idx) {
    setSelectedPlotIdx(idx);
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
                <button class="btn-plant-sapling w-full py-1.5 ${count > 0 ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-slate-300 text-slate-500'} font-bold text-xs rounded-xl shadow" data-tree="${key}" ${count <= 0 ? 'disabled' : ''}>
                    Trồng Cây
                </button>
            </div>
        `;
    });

    list.innerHTML = html;
    openModal('modal-tree-saplings');
}

export function plantSapling(treeKey) {
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
}

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
                    if (a.yieldCount >= 10) {
                        retiredCount++;
                    }
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
                    showToast("Thu Hoạch & Xuất Chuồng! 🧺", `Thu được ${count} ${prodName}. Có ${retiredCount} vật nuôi đã đủ 10 lần thu hoạch và xuất chuồng!`, "🎉", 4000);
                } else {
                    showToast("Thu Hoạch Sản Phẩm! 🧺", `Thu được ${count}${prodName}!`, "✨");
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
                <button class="btn-add-fish w-full py-1.5 ${count > 0 ? 'bg-sky-500 hover:bg-sky-600 text-white' : 'bg-slate-300 text-slate-500'} font-bold text-xs rounded-xl shadow" data-fry="${fryKey}" ${count <= 0 ? 'disabled' : ''}>
                    Thả Cá
                </button>
            </div>
        `;
    });

    list.innerHTML = html;
    openModal('modal-fish-select');
}

export function addFishToPond(fryKey) {
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
        gameState.fishPond.fishes.push({
            id: Date.now(),
            type: fryKey,
            plantedAt: Date.now()
        });
        updatePondFishVisuals();
        openFishPondModal();
        showToast("Thả Cá Giống! 🐟", `Đã thả 1 ${FISH_DB[fryKey].name} vào ao!`, "💦");
    }
}

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
    activeShopTab = tab;
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
    shopBuyQty = Math.max(1, Math.min(50, shopBuyQty + delta));
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
                    <button class="btn-buy-item px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow" data-item="${key}_seed">Mua</button>
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
                    <button class="btn-buy-item px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow" data-item="sapling_${key}">Mua</button>
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
                    <button class="btn-buy-item px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-xl shadow" data-item="${a.id}">Mua</button>
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
                    <button class="btn-buy-item px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs rounded-xl shadow" data-item="${key}">Mua</button>
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
                    <button class="btn-buy-recipe px-3 py-1.5 ${unlocked ? 'bg-slate-300 text-slate-500' : 'bg-orange-500 hover:bg-orange-600 text-white'} font-bold text-xs rounded-xl shadow" data-recipe="${key}" ${unlocked ? 'disabled' : ''}>
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
                        <button class="btn-sell-item px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-
