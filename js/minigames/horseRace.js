// js/minigames/horseRace.js
import { gameState, saveGame } from '../state/gameState.js';
import { updateUI, showToast } from '../ui/uiController.js';

let horseBetNumber = 1;

export function selectHorseBet(num) {
    horseBetNumber = num;
    for (let i = 1; i <= 4; i++) {
        const btn = document.getElementById('bet-horse-' + i);
        if (btn) {
            if (i === num) btn.classList.add('ring-2', 'ring-amber-400');
            else btn.classList.remove('ring-2', 'ring-amber-400');
        }
    }
}

export function adjustHorseBet(amt) {
    const input = document.getElementById('horse-bet-amount');
    if (input) {
        let cur = parseInt(input.value) || 100;
        input.value = Math.max(100, cur + amt);
    }
}

export function startHorseRace() {
    const amount = parseInt(document.getElementById('horse-bet-amount').value) || 500;
    if (gameState.gold < amount) {
        showToast("Thiếu Vàng! 🪙", "Bạn không có đủ vàng đặt cược!", "❌");
        return;
    }

    gameState.gold -= amount;
    updateUI();

    const resBanner = document.getElementById('horse-race-result');
    resBanner.classList.add('hidden');

    const btn = document.getElementById('btn-start-race');
    btn.disabled = true;

    const pos = [0, 0, 0, 0];
    const interval = setInterval(() => {
        for (let i = 0; i < 4; i++) {
            pos[i] += Math.random() * 8 + 2;
            const el = document.getElementById(`horse-${i + 1}`);
            if (el) el.style.left = Math.min(85, pos[i]) + '%';
        }

        if (pos.some(p => p >= 85)) {
            clearInterval(interval);
            const winner = pos.indexOf(Math.max(...pos)) + 1;
            const isWin = winner === horseBetNumber;

            resBanner.classList.remove('hidden');
            if (isWin) {
                const winGold = amount * 4;
                gameState.gold += winGold;
                resBanner.className = 'mb-3 p-3 rounded-2xl text-center font-black border shadow-lg text-sm sm:text-base bg-emerald-900 border-emerald-500 text-emerald-200';
                resBanner.innerHTML = `🎉 THẮNG LỚN! Ngựa #${winner} thắng cuộc. Nhận +${winGold.toLocaleString()} 🪙!`;
            } else {
                resBanner.className = 'mb-3 p-3 rounded-2xl text-center font-black border shadow-lg text-sm sm:text-base bg-rose-900 border-rose-500 text-rose-200';
                resBanner.innerHTML = `💸 RẤT TIẾC! Ngựa #${winner} về nhất. Bạn mất ${amount.toLocaleString()} 🪙.`;
            }

            btn.disabled = false;
            updateUI();
            saveGame();
        }
    }, 100);
}
