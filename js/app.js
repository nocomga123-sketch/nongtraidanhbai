// js/app.js
import { 
    gameState, loadGame, saveGame, REAL_SECS_PER_GAME_HOUR, REAL_SECS_PER_GAME_DAY,
    WEATHER_NAMES, WEATHER_ICONS, CROPS_DB 
} from './state/gameState.js';
import { 
    init3DScene, animate3D, updatePlotColorsByLevel, applyWeatherEffects,
    updatePlotVisual 
} from './render/scene.js';
import { updateUI, selectTool, showToast } from './ui/uiController.js';
import { 
    openModal, closeModal, handlePlotClick, handleOrchardClick, openFishPondModal,
    openAnimalPenModal, executePenAction, harvestFishFromPond, switchShopTab, adjustShopQty,
    updateQuestBadge 
} from './ui/modals.js';
import { selectHorseBet, adjustHorseBet, startHorseRace } from './minigames/horseRace.js';
import { addBauCuaBet, clearBauCuaBets, rollBauCua } from './minigames/bauCua.js';

function generateDailyQuests() {
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

window.generateMarketOrders = function() {
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
};

function gameLogicLoop() {
    const now = Date.now();
    gameState.dayTimeSeconds += 1;

    if (gameState.dayTimeSeconds % REAL_SECS_PER_GAME_HOUR === 0) {
        if (gameState.currentWeather !== 'sunny') {
            if (Math.random() < 0.7) {
                setGameWeather('sunny');
                showToast('Trời Tạnh Rồi! ☀️', 'Trời đã hửng nắng đẹp trở lại!', '☀️');
            }
        } else {
            if (Math.random() < 0.15) {
                const randomBadWeather = ['rainy', 'cloudy', 'snowy'][Math.floor(Math.random() * 3)];
                setGameWeather(randomBadWeather);
                showToast('Thay Đổi Thời Tiết 🌦️', `Trời bắt đầu có ${WEATHER_NAMES[randomBadWeather]}!`, WEATHER_ICONS[randomBadWeather]);
            }
        }
    }

    if (gameState.dayTimeSeconds >= REAL_SECS_PER_GAME_DAY) {
        gameState.dayTimeSeconds = 0;
        gameState.gameDay += 1;
        gameState.gold += 500;

        setGameWeather('sunny');
        generateDailyQuests();
        showToast(`Ngày Mới Bắt Đầu! 🌅`, `Chào mừng tới Ngày ${gameState.gameDay}. Bạn nhận được +500 🪙 trợ cấp ngày mới!`, '🪙');
    }

    if (gameState.staminaFloat < gameState.maxStamina) {
        gameState.staminaFloat = Math.min(gameState.maxStamina, gameState.staminaFloat + 0.05);
        gameState.stamina = Math.floor(gameState.staminaFloat);
    }

    ['chickens', 'cows', 'pigs'].forEach(type => {
        gameState[type].forEach(a => {
            if (gameState.dayTimeSeconds % 15 === 0) {
                if (!a.sick && a.lastSickDay !== gameState.gameDay) {
                    if (a.hungry) {
                        if (Math.random() < 0.5) { 
                            a.sick = true;
                            a.lastSickDay = gameState.gameDay;
                            showToast("Cảnh Báo Gia Súc 💊", "Có vật nuôi bị bệnh! Hãy dùng Thuốc Thú Y chữa ngay.", "⚠️");
                        }
                    } else {
                        if (Math.random() < 0.2) {
                            a.hungry = true;
                        }
                    }
                }
            }
        });
    });

    gameState.plots.forEach((p, idx) => {
        if (p.cropId && !p.isDead) {
            const crop = CROPS_DB[p.cropId];
            const effTime = crop.growTime - (p.reducedSecs || 0);
            const elapsed = (now - p.plantedAt) / 1000;

            if (elapsed < effTime && !p.hasPest && !p.pestImmune && Math.random() < 0.02) {
                p.hasPest = true;
                p.pestAppearedAt = now;
                updatePlotVisual(idx, true);
            }

            if (p.hasPest && (now - p.pestAppearedAt) >= 60000) {
                p.isDead = true;
                p.hasPest = false;
                updatePlotVisual(idx, true);
            }
        }
    });

    updateUI();
}

function setGameWeather(weatherType) {
    gameState.currentWeather = weatherType;
    applyWeatherEffects(weatherType);
    updateUI();
}

function handleWorldTap(type, index) {
    if (type === 'plot') handlePlotClick(index);
    else if (type === 'orchard') handleOrchardClick(index);
    else if (type === 'pond') openFishPondModal();
    else if (type === 'stove') openModal('modal-kitchen');
}

function initApp() {
    loadGame();
    if (!gameState.quests || gameState.quests.length === 0) generateDailyQuests();
    if (!gameState.marketOrders || gameState.marketOrders.length === 0) window.generateMarketOrders();

    init3DScene(handleWorldTap, (penType) => openAnimalPenModal(penType));

    setInterval(gameLogicLoop, 1000);
    setInterval(saveGame, 10000);

    updatePlotColorsByLevel();
    updateUI();
    animate3D((penType) => openAnimalPenModal(penType));
}

// Bắt sự kiện onclick HTML thông qua window
window.selectTool = selectTool;
window.openModal = openModal;
window.closeModal = closeModal;
window.executePenAction = executePenAction;
window.harvestFishFromPond = harvestFishFromPond;
window.adjustShopQty = adjustShopQty;
window.switchShopTab = switchShopTab;
window.selectHorseBet = selectHorseBet;
window.adjustHorseBet = adjustHorseBet;
window.startHorseRace = startHorseRace;
window.addBauCuaBet = addBauCuaBet;
window.clearBauCuaBets = clearBauCuaBets;
window.rollBauCua = rollBauCua;
window.openHorseRaceModal = () => openModal('modal-horse-race');
window.openBauCuaModal = () => openModal('modal-bau-cua');

window.addEventListener('load', initApp);
