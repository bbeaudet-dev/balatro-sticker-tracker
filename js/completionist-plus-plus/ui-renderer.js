// UI rendering functionality for completionist

import { STAKE_TYPES } from '../shared/constants.js';
import { processDescription, jokerString, getStakeDisplayName } from '../shared/utils.js';

// Render the joker grid
export function renderJokerGrid() {
    const grid = document.getElementById('jokerGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    import('../completionist/joker-data.js').then(module => {
        const filteredJokers = module.getFilteredJokers();
        
        filteredJokers.forEach(joker => {
            const jokerElement = createJokerElement(joker);
            grid.appendChild(jokerElement);
        });
    });
}

// Create a joker element
function createJokerElement(joker) {
    const div = document.createElement('div');
    div.className = 'jokerItem';
    
    const [i, j] = joker.position;
    const jokerStringValue = jokerString(i, j, joker.stakeSticker);
    
    // Check if this is a soul card and set the icon position
    const soulCards = {
        '8,3': true, '8,4': true, '8,5': true, '8,6': true, '8,7': true, '12,4': true
    };
    const isSoulCard = `${i},${j}` in soulCards;
    
    div.innerHTML = `
        <div class="tooltip">
            <div class="jokerCard${jokerStringValue}" data-stake="${joker.stakeSticker}" onclick="handleJokerClick(${joker.id})" onmousemove="hoverCard(event)" onmouseout="noHoverCard(event)"></div>
            <span class="tooltiptext hover-only">
                <div class="title">${joker.name}</div>
            </span>
            <span class="tooltiptext click-only">
                <div class="title">${joker.name}</div>
                <div class="desc">${processDescription(joker.description)}</div>
            </span>
        </div>
        <div class="stakeEditor" id="stakeEditor-${joker.id}" style="display: none;">
            <div class="stakeEditorButtons">
                ${STAKE_TYPES.map(stakeType => {
                    const isActive = joker.stakeSticker === stakeType;
                    return `<div class="stickerBtn ${stakeType} ${isActive ? 'active' : ''}" 
                                 onclick="setStakeSticker(${joker.id}, '${stakeType}')" 
                                 title="${getStakeDisplayName(stakeType)}"></div>`;
                }).join('')}
            </div>
        </div>
    `;
    
    // Set CSS custom property for soul cards
    if (isSoulCard) {
        const jokerCard = div.querySelector('.jokerCard');
        const iconPos = jokerCard.getAttribute('data-icon-pos');
        if (iconPos) {
            const [x, y] = iconPos.split(',').map(Number);
            jokerCard.style.setProperty('--icon-pos', `-${x}px -${y}px`);
        }
    }
    
    return div;
}

// Update statistics
export function updateStats() {
    import('../completionist/joker-data.js').then(module => {
        const jokerData = module.getJokerData();
        const totalJokers = jokerData.length;
        
        // Define stake levels in ascending order
        const stakeLevels = {
            'noStake': 0,
            'whiteStake': 1,
            'redStake': 2,
            'greenStake': 3,
            'blueStake': 4,
            'blackStake': 5,
            'purpleStake': 6,
            'orangeStake': 7,
            'goldStake': 8
        };
        
        // Count jokers at or above each stake level (cumulative progress)
        const noStakeCount = jokerData.filter(j => j.stakeSticker === 'noStake').length; // only truly blank
        const whiteStakeCount = jokerData.filter(j => stakeLevels[j.stakeSticker] >= stakeLevels['whiteStake']).length;
        const redStakeCount = jokerData.filter(j => stakeLevels[j.stakeSticker] >= stakeLevels['redStake']).length;
        const greenStakeCount = jokerData.filter(j => stakeLevels[j.stakeSticker] >= stakeLevels['greenStake']).length;
        const blueStakeCount = jokerData.filter(j => stakeLevels[j.stakeSticker] >= stakeLevels['blueStake']).length;
        const blackStakeCount = jokerData.filter(j => stakeLevels[j.stakeSticker] >= stakeLevels['blackStake']).length;
        const purpleStakeCount = jokerData.filter(j => stakeLevels[j.stakeSticker] >= stakeLevels['purpleStake']).length;
        const orangeStakeCount = jokerData.filter(j => stakeLevels[j.stakeSticker] >= stakeLevels['orangeStake']).length;
        const goldStakeCount = jokerData.filter(j => stakeLevels[j.stakeSticker] >= stakeLevels['goldStake']).length;
        
        // Calculate overall progress using Balatro scoring system
        // Each stake level counts as points: white=1, red=2, green=3, blue=4, black=5, purple=6, orange=7, gold=8
        const stakeValues = {
            'noStake': 0,
            'whiteStake': 1,
            'redStake': 2,
            'greenStake': 3,
            'blueStake': 4,
            'blackStake': 5,
            'purpleStake': 6,
            'orangeStake': 7,
            'goldStake': 8
        };
        
        const overallProgress = jokerData.reduce((total, joker) => {
            return total + stakeValues[joker.stakeSticker];
        }, 0);
        
        const maxOverallProgress = totalJokers * 8; // 8 stakes per joker
        const goldProgress = goldStakeCount;
        const maxGoldProgress = totalJokers;
        
        // Update stat counts
        document.getElementById('totalJokers').textContent = totalJokers;
        document.getElementById('noStakeCount').textContent = noStakeCount;
        document.getElementById('whiteStakeCount').textContent = whiteStakeCount;
        document.getElementById('redStakeCount').textContent = redStakeCount;
        document.getElementById('greenStakeCount').textContent = greenStakeCount;
        document.getElementById('blueStakeCount').textContent = blueStakeCount;
        document.getElementById('blackStakeCount').textContent = blackStakeCount;
        document.getElementById('purpleStakeCount').textContent = purpleStakeCount;
        document.getElementById('orangeStakeCount').textContent = orangeStakeCount;
        document.getElementById('goldStakeCount').textContent = goldStakeCount;
        
        // Update progress bars
        updateProgressBars(overallProgress, maxOverallProgress, goldProgress, maxGoldProgress);
    });
}

// Update progress bars
function updateProgressBars(overallProgress, maxOverallProgress, goldProgress, maxGoldProgress) {
    // Overall progress bar
    const overallPercentage = (overallProgress / maxOverallProgress) * 100;
    document.getElementById('overallProgress').style.width = `${overallPercentage}%`;
    document.getElementById('overallProgressText').textContent = `${overallProgress} / ${maxOverallProgress}`;
    const overallPercentLabel = document.getElementById('overallPercent');
    if (overallPercentLabel) overallPercentLabel.textContent = `${Math.round(overallPercentage)}%`;
    
    // Gold progress bar
    const goldPercentage = (goldProgress / maxGoldProgress) * 100;
    document.getElementById('goldProgress').style.width = `${goldPercentage}%`;
    document.getElementById('goldProgressText').textContent = `${goldProgress} / ${maxGoldProgress}`;
    const goldPercentLabel = document.getElementById('goldPercent');
    if (goldPercentLabel) goldPercentLabel.textContent = `${Math.round(goldPercentage)}%`;
}

// Show stake editor for a joker
export function showStakeEditor(jokerId) {
    const editor = document.getElementById(`stakeEditor-${jokerId}`);
    const jokerCard = editor?.parentElement?.querySelector('.jokerCard');
    if (editor) {
        const isVisible = editor.style.display === 'block';
        if (isVisible) {
            hideStakeEditor(jokerId);
        } else {
            editor.style.display = 'block';
            jokerCard?.classList.add('selected');
        }
    }
}

export function hideStakeEditor(jokerId) {
    const editor = document.getElementById(`stakeEditor-${jokerId}`);
    const jokerCard = editor?.parentElement?.querySelector('.jokerCard');
    if (editor) {
        editor.style.display = 'none';
        jokerCard?.classList.remove('selected');
    }
}

// Set stake sticker for a joker
export function setStakeSticker(jokerId, stakeType) {
    import('../core/auth.js').then(authModule => {
        if (!authModule.getCanEdit()) {
            authModule.showLoginDialog();
            return;
        }
        
        import('../completionist/joker-data.js').then(module => {
            const joker = module.getJokerById(jokerId);
            if (joker) {
                const editor = document.getElementById(`stakeEditor-${jokerId}`);
                const buttons = editor.querySelectorAll('.stickerBtn');

                // Update joker data first
                module.setStakeSticker(jokerId, stakeType);
                
                // Update button states - remove active from all, add to selected
                buttons.forEach(btn => {
                    btn.classList.remove('active');
                    if (btn.classList.contains(stakeType)) {
                        btn.classList.add('active');
                    }
                });
                
                // Save data
                import('../core/api.js').then(apiModule => {
                    apiModule.saveUserData();
                });
                
                // Update only the specific joker element instead of re-rendering entire grid
                const jokerElement = editor.parentElement;
                const jokerCard = jokerElement.querySelector('.jokerCard');
                jokerCard.setAttribute('data-stake', stakeType);
                
                // Update stats and close editor immediately
                updateStats();
                hideStakeEditor(jokerId);
            }
        });
    });
}

// Handle joker click (either normal editing or game mode)
export function handleJokerClick(jokerId) {
    import('../completionist/game-tracking.js').then(gameModule => {
        if (gameModule.getGameMode()) {
            gameModule.selectJokerForGame(jokerId);
        } else {
            showStakeEditor(jokerId);
        }
    });
}

// Keep existing hover card functionality
export function hoverCard(event) {
    // This function is kept for compatibility with existing hoverCard.js
    // The tooltip functionality is now handled by CSS
}

export function noHoverCard(event) {
    // This function is kept for compatibility with existing hoverCard.js
    // The tooltip functionality is now handled by CSS
}

// Make functions globally available for onclick handlers
window.showStakeEditor = showStakeEditor;
window.hideStakeEditor = hideStakeEditor;
window.setStakeSticker = setStakeSticker;
window.handleJokerClick = handleJokerClick;
window.hoverCard = hoverCard;
window.noHoverCard = noHoverCard;
