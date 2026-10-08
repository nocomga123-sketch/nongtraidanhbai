import { loadGame, saveGame, gameState } from './state/gameState.js';
import { init3DScene, animateRenderLoop } from './render/scene.js';
import { updateUI } from './ui/uiController.js';
import { 
    openModal, closeModal, openKitchenModal, adjustShopQty, switchShopTab,
    handlePlotClick, handleOrchardPlotClick 
} from './ui/modals.js';
import { selectHorseBet, adjustHorseBet, startHorseRace } from './minigames/horseRace.js';
import { addBauCuaBet, clearBauCuaBets, rollBauCua } from './minigames/bauCua.js';
import { selectTool } from './ui/uiController.js';

function initApp() {
    loadGame();
    init3DScene(handleWorldInteraction);
    updateUI();
    setupEventListeners();
    
    // Game loop tăng thời gian
    setInterval(() => {
        gameState.dayTimeSeconds += 1;
        updateUI();
    }, 1000);

    // Tự động lưu game
    setInterval(saveGame, 10000);

    animateRenderLoop();
}

// XỬ LÝ TƯƠNG TÁC KHI BẤM VÀO ĐỐI TƯỢNG 3D
function handleWorldInteraction(type, index) {
    if (type === 'plot') handlePlotClick(index);
    else if (type === 'orchard_plot') handleOrchardPlotClick(index);
    else if (type === 'stove') openKitchenModal();
    else if (type === 'pond') openModal('modal-fish-select');
    else if (type === 'chicken_pen' || type === 'cow_barn' || type === 'pig_pen') openModal('modal-animal-pen');
}

function setupEventListeners() {
    // Toolbar Chọn Công Cụ (Bắt sâu / Tưới nước)
    document.getElementById('btn-tool-hand').onclick = () => selectTool('hand');
    document.getElementById('btn-tool-water').onclick = () => selectTool('water');

    // Nút mở Modal chính
    document.getElementById('btn-open-shop').onclick = () => openModal('modal-shop');
    document.getElementById('btn-open-inventory').onclick = () => openModal('modal-inventory');
    document.getElementById('btn-open-kitchen').onclick = openKitchenModal;
    document.getElementById('btn-open-market').onclick = () => openModal('modal-market');
    document.getElementById('btn-open-quests').onclick = () => openModal('modal-quests');
    document.getElementById('btn-open-horserace').onclick = () => openModal('modal-horse-race');
