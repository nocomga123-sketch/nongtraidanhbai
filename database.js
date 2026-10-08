// js/config/database.js
export const CROPS_DB = {
    rice: { id: 'rice', name: 'Lúa', growTime: 40, seedCost: 10, sellPrice: 25, exp: 5, icon: '🌾' },
    corn: { id: 'corn', name: 'Bắp Ngô', growTime: 80, seedCost: 25, sellPrice: 65, exp: 12, icon: '🌽' },
    // Thêm loại cây mới cực kỳ đơn giản ở đây
    melon: { id: 'melon', name: 'Dưa Lưới', growTime: 150, seedCost: 60, sellPrice: 180, exp: 30, icon: '🍈' }
};

export const RECIPES_DB = {
    rice_bowl: { id: 'rice_bowl', name: 'Cơm Trắng Dinh Dưỡng', cost: 0, cookTime: 20, sellPrice: 80, staminaRestore: 30, ingredients: { rice: 2 }, icon: '🍚' },
    // Thêm công thức mới tại đây
    bread: { id: 'bread', name: 'Bánh Mì Ngon', cost: 100, cookTime: 30, sellPrice: 200, staminaRestore: 50, ingredients: { rice: 3 }, icon: '🍞' }
};
