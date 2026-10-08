import { loadGame, saveGame, gameState } from './state/gameState.js';
import { init3DScene, animateRenderLoop } from './render/scene.js';
import { updateUI } from './ui/uiController.js';
import { openModal, closeModal, openKitchenModal, adjustShopQty, switchShopTab } from './ui/modals.js';
import { selectHorseBet, adjustHorseBet, startHorseRace } from './minigames/horseRace.js';
import { addBauCuaBet, clearBauCuaBets, rollBauCua } from './minigames/bauCua.js';

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
    if (type === 'stove') openKitchenModal();
    else if (type === 'pond') openModal('modal-fish-select');
    else if (type === 'chicken_pen' || type === 'cow_barn' || type === 'pig_pen') openModal('modal-animal-pen');
}

function setupEventListeners() {
    document.getElementById('btn-open-shop').onclick = () => openModal('modal-shop');
    document.getElementById('btn-open-inventory').onclick = () => openModal('modal-inventory');
    document.getElementById('btn-open-kitchen').onclick = openKitchenModal;
    document.getElementById('btn-open-market').onclick = () => openModal('modal-market');
    document.getElementById('btn-open-quests').onclick = () => openModal('modal-quests');
    document.getElementById('btn-open-horserace').onclick = () => openModal('modal-horse-race');
    document.getElementById('btn-open-baucua').onclick = () => openModal('modal-bau-cua');

    document.querySelectorAll('.close-modal-btn').forEach(btn => {
        btn.onclick = () => closeModal(btn.dataset.modal);
    });

    document.getElementById('shop-qty-minus').onclick = () => adjustShopQty(-1);
    document.getElementById('shop-qty-plus').onclick = () => adjustShopQty(1);
    document.getElementById('shop-qty-plus5').onclick = () => adjustShopQty(5);

    document.querySelectorAll('.shop-tab-btn').forEach(btn => {
        btn.onclick = () => switchShopTab(btn.dataset.tab);
    });

    document.querySelectorAll('.btn-bet-horse').forEach(btn => {
        btn.onclick = () => selectHorseBet(parseInt(btn.dataset.horse));
    });
    document.getElementById('btn-horse-bet-m500').onclick = () => adjustHorseBet(-500);
    document.getElementById('btn-horse-bet-m100').onclick = () => adjustHorseBet(-100);
    document.getElementById('btn-horse-bet-p100').onclick = () => adjustHorseBet(100);
    document.getElementById('btn-horse-bet-p500').onclick = () => adjustHorseBet(500);
    document.getElementById('btn-start-race').onclick = startHorseRace;

    document.querySelectorAll('.btn-bet-baucua').forEach(btn => {
        btn.onclick = () => addBauCuaBet(btn.dataset.type);
    });
    document.getElementById('btn-clear-baucua').onclick = clearBauCuaBets;
    document.getElementById('btn-roll-baucua').onclick = rollBauCua;
}

window.onload = initApp;
