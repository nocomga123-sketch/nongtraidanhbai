// js/app.js
import { loadGame, saveGame, gameState } from './state/gameState.js';
import { init3DScene, animateRenderLoop } from './render/scene.js';
import { updateUI, selectTool } from './ui/uiController.js';
import { openModal, closeModal, handlePlotClick } from './ui/modals.js';

function initApp() {
    loadGame();
    init3DScene(handleWorldInteraction);
    updateUI();
    setupEventListeners();

    setInterval(() => {
        gameState.dayTimeSeconds += 1;
        updateUI();
    }, 1000);

    setInterval(saveGame, 10000);
    animateRenderLoop();
}

function handleWorldInteraction(type, index) {
    if (type === 'plot') handlePlotClick(index);
    else if (type === 'stove') openModal('modal-kitchen');
    else if (type === 'pond') openModal('modal-fish-select');
    else if (type === 'chicken_pen' || type === 'cow_barn' || type === 'pig_pen') openModal('modal-animal-pen');
}

function setupEventListeners() {
    document.getElementById('btn-tool-hand').onclick = () => selectTool('hand');
    document.getElementById('btn-tool-water').onclick = () => selectTool('water');

    document.getElementById('btn-open-shop').onclick = () => openModal('modal-shop');
    document.getElementById('btn-open-inventory').onclick = () => openModal('modal-inventory');
    document.getElementById('btn-open-kitchen').onclick = () => openModal('modal-kitchen');
    document.getElementById('btn-open-market').onclick = () => openModal('modal-market');
    document.getElementById('btn-open-quests').onclick = () => openModal('modal-quests');
    document.getElementById('btn-open-horserace').onclick = () => openModal('modal-horse-race');
}

window.closeModal = closeModal;
window.onload = initApp;
