import { gameState, saveGame } from '../state/gameState.js';
import { updateUI } from '../ui/uiController.js';
import { showToast } from '../ui/toasts.js';

let horseBet = 1, horseBetAmount = 500;

export function selectHorseBet(num) { horseBet = num; showToast("Chọn Ngựa 🐎", `Bạn đã chọn Ngựa #${num}`, "🐎"); }
export function adjustHorseBet(delta) {
    horseBetAmount = Math.max(100, horseBetAmount + delta);
    document.getElementById('horse-bet-amount').value = horseBetAmount;
}

export function startHorseRace() {
    if (gameState.gold < horseBetAmount) return showToast("Hết Vàng 💰", "Bạn không đủ Vàng!", "🪙");
    gameState.gold -= horseBetAmount;
    updateUI();

    const pos = [0, 0, 0, 0];
    const btn = document.getElementById('btn-start-race');
    btn.disabled = true;

    const timer = setInterval(() => {
        let winner = null;
        for (let i = 0; i < 4; i++) {
            pos[i] += Math.random() * 8 + 2;
            document.getElementById(`horse-${i + 1}`).style.left = `${Math.min(90, pos[i])}%`;
            if (pos[i] >= 90 && winner === null) winner = i + 1;
        }

        if (winner !== null) {
            clearInterval(timer);
            btn.disabled = false;
            if (winner === horseBet) {
                const winAmt = horseBetAmount * 4;
                gameState.gold += winAmt;
                showToast("THẮNG ĐUA NGỰA! 🎉", `Ngựa #${winner} về nhất! Nhận +${winAmt} Vàng!`, "🏆");
            } else showToast("RẤT TIẾC! 🐎", `Ngựa #${winner} về nhất!`, "🐎");
            updateUI();
            saveGame();
        }
    }, 100);
}
