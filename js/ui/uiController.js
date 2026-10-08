import { gameState } from '../state/gameState.js';
import { WEATHER_ICONS, REAL_SECS_PER_GAME_DAY } from '../config/constants.js';

export function updateUI() {
    document.getElementById('gold-display').innerText = gameState.gold.toLocaleString();
    document.getElementById('stamina-display').innerText = `${gameState.stamina} / ${gameState.maxStamina}`;
    document.getElementById('player-level-badge').innerText = `Lv.${gameState.level}`;

    const req = gameState.level * 100;
    document.getElementById('exp-bar').style.width = `${Math.min(100, (gameState.exp / req) * 100)}%`;
    document.getElementById('exp-text').innerText = `${gameState.exp} / ${req} EXP`;

    document.getElementById('day-counter-display').innerText = `Ngày ${gameState.gameDay}`;
    document.getElementById('weather-icon').innerText = WEATHER_ICONS[gameState.currentWeather] || '☀️';

    const totalMins = Math.floor((gameState.dayTimeSeconds / REAL_SECS_PER_GAME_DAY) * 1440);
    const hrs = String(Math.floor(totalMins / 60)).padStart(2, '0');
    const mins = String(Math.floor(totalMins % 60)).padStart(2, '0');
    document.getElementById('game-time-display').innerText = `${hrs}:${mins}`;
}
