import { CROPS_DB, TREES_DB, FISH_DB, SUPPLIES_DB, RECIPES_DB } from './data.js';

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

export function formatTime(totalSecs) {
    const m = Math.floor(totalSecs / 60);
    const s = Math.floor(totalSecs % 60);
    return `${m > 0 ? m + 'm' : ''}${s}s`;
}

export function isLocationFree(x, z) {
    if (x > -15 && x < 8 && z > -12 && z < 13) return false;
    if (x > -26 && x < -14 && z > -23 && z < -13) return false;
    if (x > -26 && x < -14 && z > 5 && z < 15) return false;
    if (x > 14 && x < 26 && z > 9 && z < 19) return false;
    if (x > -7 && x < 7 && z > -26 && z < -14) return false;
    if (x > 4 && x < 15 && z > 4 && z < 15) return false;
    if (Math.abs(x) > 31 || Math.abs(z) > 31) return false;
    return true;
}
