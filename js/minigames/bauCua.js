import { gameState, saveGame } from '../state/gameState.js';
import { updateUI } from '../ui/uiController.js';
import { showToast } from '../ui/toasts.js';

let bauCuaBets = { bau: 0, cua: 0, tom: 0, ca: 0, ga: 0, nai: 0 };

export function addBauCuaBet(type) {
    if (gameState.gold < 100) return showToast("Hết Vàng 💰", "Bạn cần ít nhất 100 Vàng!", "🪙");
    gameState.gold -= 100;
    bauCuaBets[type] += 100;
    document.getElementById(`bet-val-${type}`).innerText = `${bauCuaBets[type]}đ`;
    updateUI();
}

export function clearBauCuaBets() {
    let total = 0;
    Object.keys(bauCuaBets).forEach(k => { total += bauCuaBets[k]; bauCuaBets[k] = 0; document.getElementById(`bet-val-${k}`).innerText = '0đ'; });
    gameState.gold += total;
    updateUI();
}

export function rollBauCua() {
    const totalBet = Object.values(bauCuaBets).reduce((a, b) => a + b, 0);
    if (totalBet === 0) return showToast("Đặt Cược 🎲", "Hãy đặt cược vào ít nhất 1 ô!", "🎲");

    const items = ['bau', 'cua', 'tom', 'ca', 'ga', 'nai'];
    const icons = { bau: '🪷', cua: '🦀', tom: '🦐', ca: '🐟', ga: '🐓', nai: '🦌' };
    const r1 = items[Math.floor(Math.random() * 6)], r2 = items[Math.floor(Math.random() * 6)], r3 = items[Math.floor(Math.random() * 6)];

    document.getElementById('dice-container').innerHTML = `
        <div class="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-3xl">${icons[r1]}</div>
        <div class="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-3xl">${icons[r2]}</div>
        <div class="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-3xl">${icons[r3]}</div>
    `;

    let win = 0;
    [r1, r2, r3].forEach(r => { if (bauCuaBets[r] > 0) win += bauCuaBets[r] * 2; });

    if (win > 0) {
        gameState.gold += win;
        showToast("THẮNG BẦU CUA! 🎲", `Bạn trúng +${win} Vàng!`, "🎲");
    } else showToast("RẤT TIẾC 🎲", "Không trúng ô nào!", "🎲");

    Object.keys(bauCuaBets).forEach(k => { bauCuaBets[k] = 0; document.getElementById(`bet-val-${k}`).innerText = '0đ'; });
    updateUI();
    saveGame();
}
