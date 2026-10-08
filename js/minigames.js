import { gameState, saveGame } from './state.js';
import { updateUI, showToast } from './utils.js';

export let horseBetNumber = 1;
export let bauCuaBets = { bau: 0, cua: 0, tom: 0, ca: 0, ga: 0, nai: 0 };

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

export function addBauCuaBet(type) {
    const betStep = 100;
    if (gameState.gold < betStep) {
        showToast("Thiếu Vàng! 🪙", "Bạn cần ít nhất 100 Vàng để cược!", "❌");
        return;
    }

    gameState.gold -= betStep;
    bauCuaBets[type] += betStep;
    document.getElementById('bet-val-' + type).innerText = `${bauCuaBets[type].toLocaleString()}đ`;
    updateUI();
}

export function clearBauCuaBets() {
    Object.keys(bauCuaBets).forEach(k => {
        gameState.gold += bauCuaBets[k];
        bauCuaBets[k] = 0;
        document.getElementById('bet-val-' + k).innerText = '0đ';
    });
    updateUI();
}

export function rollBauCua() {
    const totalBet = Object.values(bauCuaBets).reduce((a, b) => a + b, 0);
    if (totalBet <= 0) {
        showToast("Chưa Đặt Cược! 🎲", "Hãy chọn ô cửa đặt cược trước!", "❌");
        return;
    }

    const btn = document.getElementById('btn-roll-baucua');
    btn.disabled = true;

    const icons = ['🪷', '🦀', '🦐', '🐟', '🐓', '🦌'];
    const keys = ['bau', 'cua', 'tom', 'ca', 'ga', 'nai'];

    let rolls = 0;
    const diceContainer = document.getElementById('dice-container');

    const anim = setInterval(() => {
        const r1 = Math.floor(Math.random() * 6);
        const r2 = Math.floor(Math.random() * 6);
        const r3 = Math.floor(Math.random() * 6);

        diceContainer.children[0].innerText = icons[r1];
        diceContainer.children[1].innerText = icons[r2];
        diceContainer.children[2].innerText = icons[r3];

        rolls++;
        if (rolls > 15) {
            clearInterval(anim);

            const final1 = Math.floor(Math.random() * 6);
            const final2 = Math.floor(Math.random() * 6);
            const final3 = Math.floor(Math.random() * 6);

            diceContainer.children[0].innerText = icons[final1];
            diceContainer.children[1].innerText = icons[final2];
            diceContainer.children[2].innerText = icons[final3];

            const results = [keys[final1], keys[final2], keys[final3]];
            let totalWin = 0;

            Object.keys(bauCuaBets).forEach(k => {
                const count = results.filter(r => r === k).length;
                if (count > 0) {
                    totalWin += bauCuaBets[k] * (count + 1);
                }
                bauCuaBets[k] = 0;
                document.getElementById('bet-val-' + k).innerText = '0đ';
            });

            gameState.gold += totalWin;
            const resBanner = document.getElementById('baucua-result');
            resBanner.classList.remove('hidden');

            if (totalWin > 0) {
                resBanner.className = 'mb-3 p-3 rounded-2xl text-center font-black border shadow-lg text-sm sm:text-base bg-emerald-900 border-emerald-500 text-emerald-200';
                resBanner.innerHTML = `🎉 Trúng Lớn! Nhận về +${totalWin.toLocaleString()} 🪙!`;
            } else {
                resBanner.className = 'mb-3 p-3 rounded-2xl text-center font-black border shadow-lg text-sm sm:text-base bg-rose-900 border-rose-500 text-rose-200';
                resBanner.innerHTML = `💸 Rất tiếc, không trúng cửa nào! Chúc bạn may mắn lần sau.`;
            }

            btn.disabled = false;
            updateUI();
            saveGame();
        }
    }, 80);
}
