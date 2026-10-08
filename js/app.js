// js/app.js
import { gameState, loadGame, saveGame } from './state/gameState.js';
import { init3DScene, animate3D } from './render/scene.js';
import { updateUI } from './ui/uiController.js';
import { openModal, closeModal, handlePlotClick } from './ui/modals.js';

function initApp() {
    loadGame();
    init3DScene((type, idx) => {
        if (type === 'plot') handlePlotClick(idx);
    });

    setInterval(() => {
        gameState.dayTimeSeconds += 1;
        updateUI();
    }, 1000);

    setInterval(saveGame, 10000);
    updateUI();
    animate3D();
}

// Bắt sự kiện Window để HTML gọi được hàm Module
window.openModal = openModal;
window.closeModal = closeModal;

window.addEventListener('load', initApp);
