// js/state/gameState.js

export const REAL_SECS_PER_GAME_DAY = 900;
export const REAL_SECS_PER_GAME_HOUR = 37.5;

export const CONFIG = {
    TOTAL_PLOTS: 48,
    PLOTS_PER_ROW: 8,
    PLOT_SPACING: 2.2,
    SAVE_KEY: 'avatar_mini_farm_save_v10'
};

export const ANIMAL_PROD_INTERVALS = {
    chicken: 90,
    cow: 180,
    pig: 270
};

export const CROPS_DB = {
    rice: { id: 'rice', name: 'Lúa', growTime: 40, seedCost: 10, sellPrice: 25, exp: 5, icon: '🌾' },
    corn: { id: 'corn', name: 'Bắp Ngô', growTime: 80, seedCost: 25, sellPrice: 65, exp: 12, icon: '🌽' },
    tomato: { id: 'tomato', name: 'Cà Chua', growTime: 120, seedCost: 40, sellPrice: 110, exp: 20, icon: '🍅' },
    pumpkin: { id: 'pumpkin', name: 'Bí Ngô', growTime: 180, seedCost: 80, sellPrice: 230, exp: 40, icon: '🎃' },
    watermelon: { id: 'watermelon', name: 'Dưa Hấu', growTime: 240, seedCost: 150, sellPrice: 450, exp: 75, icon: '🍉' },
    strawberry: { id: 'strawberry', name: 'Dâu Tây', growTime: 360, seedCost: 250, sellPrice: 800, exp: 120, icon: '🍓' }
};

export const TREES_DB = {
    apple: { id: 'apple', name: 'Cây Táo', saplingCost: 300, harvestTime: 240, sellPrice: 180, exp: 35, icon: '🍎' },
    orange: { id: 'orange', name: 'Cây Cam', saplingCost: 500, harvestTime: 360, sellPrice: 300, exp: 55, icon: '🍊' },
    peach: { id: 'peach', name: 'Cây Đào', saplingCost: 800, harvestTime: 480, sellPrice: 450, exp: 80, icon: '🍑' },
    mango: { id: 'mango', name: 'Cây Xoài', saplingCost: 1200, harvestTime: 600, sellPrice: 650, exp: 110, icon: '🥭' }
};

export const FISH_DB = {
    fry_goldfish: { id: 'fry_goldfish', name: 'Cá Vàng giống', growTime: 120, cost: 50, adultId: 'goldfish', icon: '🐟' },
    fry_carp: { id: 'fry_carp', name: 'Cá Chép giống', growTime: 240, cost: 120, adultId: 'carp', icon: '🐠' },
    goldfish: { id: 'goldfish', name: 'Cá Vàng lớn', sellPrice: 200, exp: 40, icon: '🐟' },
    carp: { id: 'carp', name: 'Cá Chép lớn', sellPrice: 450, exp: 80, icon: '🐠' }
};

export const SUPPLIES_DB = {
    feed_chicken: { id: 'feed_chicken', name: 'Cám Gà', cost: 15, icon: '🌾' },
    feed_cow: { id: 'feed_cow', name: 'Cỏ Tươi', cost: 25, icon: '🌿' },
    feed_pig: { id: 'feed_pig', name: 'Thức Ăn Heo', cost: 20, icon: '🥔' },
    medicine: { id: 'medicine', name: 'Thuốc Thú Y', cost: 40, icon: '💊' }
};

export const RECIPES_DB = {
    rice_bowl: { id: 'rice_bowl', name: 'Cơm Trắng Dinh Dưỡng', cost: 0, cookTime: 20, sellPrice: 80, staminaRestore: 30, ingredients: { rice: 2 }, icon: '🍚' },
    grilled_corn: { id: 'grilled_corn', name: 'Bắp Nướng Mỡ Hành', cost: 0, cookTime: 25, sellPrice: 150, staminaRestore: 45, ingredients: { corn: 2 }, icon: '🌽' },
    apple_juice: { id: 'apple_juice', name: 'Nước Táo Ép', cost: 0, cookTime: 30, sellPrice: 280, staminaRestore: 40, ingredients: { apple: 2 }, icon: '🧃' },
    pork_stew: { id: 'pork_stew', name: 'Sườn Heo Hầm Cà Chua', cost: 0, cookTime: 50, sellPrice: 550, staminaRestore: 80, ingredients: { pork: 1, tomato: 2 }, icon: '🍲' },
    orange_smoothie: { id: 'orange_smoothie', name: 'Sinh Tố Cam Sữa', cost: 300, cookTime: 45, sellPrice: 520, staminaRestore: 70, ingredients: { orange: 2, milk: 1 }, icon: '🥤' },
    peach_tea: { id: 'peach_tea', name: 'Trà Đào Sảng Khoái', cost: 450, cookTime: 60, sellPrice: 750, staminaRestore: 95, ingredients: { peach: 2 }, icon: '🍹' },
    mango_smoothie: { id: 'mango_smoothie', name: 'Sinh Tố Xoài Nhiệt Đới', cost: 600, cookTime: 75, sellPrice: 1100, staminaRestore: 130, ingredients: { mango: 2, milk: 1 }, icon: '🥭' },
    apple_steak: { id: 'apple_steak', name: 'Bít Tết Bò Sốt Táo', cost: 500, cookTime: 90, sellPrice: 1450, staminaRestore: 180, ingredients: { milk: 2, apple: 2, pork: 1 }, icon: '🥩' },
    seafood_pumpkin: { id: 'seafood_pumpkin', name: 'Lẩu Bí Ngô Hải Sản', cost: 700, cookTime: 110, sellPrice: 1950, staminaRestore: 230, ingredients: { pumpkin: 1, carp: 1, tomato: 2 }, icon: '🍲' },
    choco_strawberry: { id: 'choco_strawberry', name: 'Dâu Tây Bọc Socola', cost: 400, cookTime: 40, sellPrice: 980, staminaRestore: 110, ingredients: { strawberry: 3 }, icon: '🍓' }
};

export const WEATHER_TYPES = ['sunny', 'rainy', 'cloudy', 'snowy'];
export const WEATHER_ICONS = { sunny: '☀️', rainy: '🌧️', cloudy: '☁️', snowy: '❄️' };
export const WEATHER_NAMES = { sunny: 'Nắng đẹp', rainy: 'Mưa rào', cloudy: 'Nhiều mây', snowy: 'Tuyết rơi' };

export let shopBuyQty = 1;
export let activeShopTab = 'seeds';
export function setShopBuyQty(val) { shopBuyQty = val; }
export function setActiveShopTab(val) { activeShopTab = val; }

export let gameState = {
    level: 1, exp: 0, gold: 2000, stamina: 100, maxStamina: 100, staminaFloat: 100,
    currentTool: 'hand', gameDay: 1, dayTimeSeconds: 6 * REAL_SECS_PER_GAME_HOUR, currentWeather: 'sunny',
    inventory: {
        rice_seed: 5, corn_seed: 3, sapling_apple: 2, feed_chicken: 5, feed_cow: 3, feed_pig: 3,
        medicine: 2, buy_chicken: 2, buy_cow: 1, buy_pig: 1, fry_goldfish: 2, egg: 2, milk: 1, pork: 0, worm: 2
    },
    unlockedRecipes: ['rice_bowl', 'grilled_corn', 'apple_juice', 'pork_stew'],
    unlockedPlots: Array(CONFIG.TOTAL_PLOTS).fill(false),
    plots: Array(CONFIG.TOTAL_PLOTS).fill(null).map(() => ({
        cropId: null, plantedAt: 0, watered: false, reducedSecs: 0, hasPest: false, pestAppearedAt: 0, pestImmune: false, isDead: false
    })),
    orchardPlots: Array(10).fill(null).map((_, i) => ({
        unlocked: i < 2, treeType: i === 0 ? 'apple' : null, plantedAt: i === 0 ? Date.now() - 120000 : 0
    })),
    fishPond: { 
        capacity: 6, 
        fishes: [
            { id: 1, type: 'fry_goldfish', plantedAt: Date.now() - 40000 },
            { id: 2, type: 'fry_carp', plantedAt: Date.now() - 100000 }
        ] 
    },
    chickens: [{ id: 1, bornAt: Date.now() - 200000, yieldCount: 0, hungry: false, sick: false, lastSickDay: 0, producedAt: Date.now() - 50000, x: -20, z: -18, targetX: -20, targetZ: -18 }],
    cows: [{ id: 1, bornAt: Date.now() - 400000, yieldCount: 0, hungry: false, sick: false, lastSickDay: 0, producedAt: Date.now() - 100000, x: -20, z: 10, targetX: -20, targetZ: 10 }],
    pigs: [{ id: 1, bornAt: Date.now() - 200000, hungry: false, sick: false, lastSickDay: 0, producedAt: Date.now() - 150000, x: 20, z: 14, targetX: 20, targetZ: 14 }],
    kitchenStoves: [
        { id: 0, levelReq: 1, cost: 0, unlocked: true, cooking: false, recipeId: null, quantity: 0, startTime: 0, duration: 0 },
        { id: 1, levelReq: 3, cost: 500, unlocked: false, cooking: false, recipeId: null, quantity: 0, startTime: 0, duration: 0 },
        { id: 2, levelReq: 5, cost: 1200, unlocked: false, cooking: false, recipeId: null, quantity: 0, startTime: 0, duration: 0 },
        { id: 3, levelReq: 8, cost: 2500, unlocked: false, cooking: false, recipeId: null, quantity: 0, startTime: 0, duration: 0 }
    ],
    selectedStoveIdx: 0, marketOrders: [], quests: []
};

for (let i = 0; i < 6; i++) gameState.unlockedPlots[i] = true;

export function getItemInfo(key) {
    if (CROPS_DB[key]) return CROPS_DB[key];
    if (TREES_DB[key]) return TREES_DB[key];
    if (FISH_DB[key]) return FISH_DB[key];
    if (SUPPLIES_DB[key]) return SUPPLIES_DB[key];
    if (RECIPES_DB[key]) return RECIPES_DB[key];
    
    if (key.endsWith('_seed')) {
        const base = key.replace('_seed', '');
        if (CROPS_DB[base]) return { name: 'Hạt Giống ' + CROPS_DB[base].name, icon: '🌱', cost: CROPS_DB[base].seedCost };
    }
    if (key.startsWith('sapling_')) {
        const base = key.replace('sapling_', '');
        if (TREES_DB[base]) return { name: 'Cây Giống ' + TREES_DB[base].name, icon: '🌳', cost: TREES_DB[base].saplingCost };
    }
    
    const specialMap = {
        buy_chicken: { name: 'Gà Con Giống', icon: '🐥', cost: 150 },
        buy_cow: { name: 'Bò Giống', icon: '🐮', cost: 500 },
        buy_pig: { name: 'Heo Giống', icon: '🐷', cost: 300 },
        egg: { name: 'Trứng Gà', icon: '🥚', sellPrice: 50, exp: 15 },
        milk: { name: 'Sữa Bò Tươi', icon: '🥛', sellPrice: 120, exp: 25 },
        pork: { name: 'Thịt Heo Sạch', icon: '🥩', sellPrice: 150, exp: 30 },
        worm: { name: 'Sâu Đất', icon: '🐛', sellPrice: 10, exp: 5 }
    };
    if (specialMap[key]) return specialMap[key];

    return { name: key, icon: '📦', sellPrice: 20 };
}

export function saveGame() {
    try { localStorage.setItem(CONFIG.SAVE_KEY, JSON.stringify(gameState)); } catch(e) {}
}

export function loadGame() {
    try {
        const saved = localStorage.getItem(CONFIG.SAVE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            Object.assign(gameState, parsed);
            return true;
        }
    } catch(e) {}
    return false;
}
