import { CONFIG, REAL_SECS_PER_GAME_HOUR } from '../config/constants.js';

export const INITIAL_GAME_STATE = {
    level: 1,
    exp: 0,
    gold: 2000,
    stamina: 100,
    maxStamina: 100,
    staminaFloat: 100,
    currentTool: 'hand',
    gameDay: 1,
    dayTimeSeconds: 6 * REAL_SECS_PER_GAME_HOUR,
    currentWeather: 'sunny',
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
    fishPond: { capacity: 6, fishes: [] },
    chickens: [{ id: 1, bornAt: Date.now() - 200000, yieldCount: 0, hungry: false, sick: false, lastSickDay: 0, producedAt: Date.now(), x: -20, z: -18 }],
    cows: [{ id: 1, bornAt: Date.now() - 400000, yieldCount: 0, hungry: false, sick: false, lastSickDay: 0, producedAt: Date.now(), x: -20, z: 10 }],
    pigs: [{ id: 1, bornAt: Date.now() - 200000, hungry: false, sick: false, lastSickDay: 0, producedAt: Date.now(), x: 20, z: 14 }],
    
    kitchenStoves: [
        { id: 0, levelReq: 1, cost: 0, unlocked: true, cooking: false, recipeId: null, quantity: 0, startTime: 0, duration: 0 },
        { id: 1, levelReq: 3, cost: 500, unlocked: false, cooking: false, recipeId: null, quantity: 0, startTime: 0, duration: 0 },
        { id: 2, levelReq: 5, cost: 1200, unlocked: false, cooking: false, recipeId: null, quantity: 0, startTime: 0, duration: 0 },
        { id: 3, levelReq: 8, cost: 2500, unlocked: false, cooking: false, recipeId: null, quantity: 0, startTime: 0, duration: 0 }
    ],
    selectedStoveIdx: 0,
    marketOrders: [],
    quests: [
        { id: 'harvest_crop', title: 'Thu hoạch 3 cây trồng', progress: 0, target: 3, rewardGold: 300, rewardExp: 50, completed: false },
        { id: 'feed_animals', title: 'Cho gia súc ăn 2 lần', progress: 0, target: 2, rewardGold: 200, rewardExp: 40, completed: false },
        { id: 'cook_food', title: 'Nấu 1 món ăn dinh dưỡng', progress: 0, target: 1, rewardGold: 400, rewardExp: 60, completed: false }
    ]
};

for (let i = 0; i < 6; i++) INITIAL_GAME_STATE.unlockedPlots[i] = true;

export let gameState = Object.assign({}, INITIAL_GAME_STATE);

export function loadGame() {
    try {
        const saved = localStorage.getItem(CONFIG.SAVE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            gameState = Object.assign({}, INITIAL_GAME_STATE, parsed);
            if (!gameState.kitchenStoves || !Array.isArray(gameState.kitchenStoves)) {
                gameState.kitchenStoves = INITIAL_GAME_STATE.kitchenStoves;
            }
            return true;
        }
    } catch(e) {}
    return false;
}

export function saveGame() {
    try { localStorage.setItem(CONFIG.SAVE_KEY, JSON.stringify(gameState)); } catch(e) {}
}
