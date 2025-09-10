// Game tracking functionality for completionist

import { createJokerCardComponent } from '../shared/utils.js';

// Recent games tracking
let recentGames = [];

// Set recent games
export function setRecentGames(games) {
    recentGames = games || [];
}

// Get recent games
export function getRecentGames() {
    return recentGames;
}

// Render recent games section
export function renderRecentGames() {
    const container = document.getElementById('recentGamesList');
    if (!container) return;
    
    container.innerHTML = '';
    
    recentGames.forEach(game => {
        const gameElement = createGameElement(game);
        container.appendChild(gameElement);
    });
}

// Create a game element
function createGameElement(game) {
    const gameDiv = document.createElement('div');
    gameDiv.className = 'gameEntry';
    
    // Parse the date string as local date (not UTC)
    const [year, month, day] = game.date.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed
    const formattedDate = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    let jokersHTML = '';
    game.jokers.forEach(joker => {
        jokersHTML += `
            <div class="jokerProgression">
                <div class="jokerCardContainer">
                    ${createJokerCardComponent(joker.name, 'noStake', 'small')}
                </div>
                <div class="progressionArrow">
                    <div class="stakeIcon ${joker.from}"></div>
                    <div class="arrow">→</div>
                    <div class="stakeIcon ${joker.to}"></div>
                </div>
            </div>
        `;
    });
    
    // Add delete button if logged in
    const actionButtons = `
        <div class="gameActions">
            <button class="deleteGameBtn" onclick="deleteGame('${game.date}')" title="Delete Game">🗑️</button>
        </div>
    `;
    
    gameDiv.innerHTML = `
        <div class="gameRow">
            <div class="gameDate">${formattedDate}</div>
            <div class="gameJokers">
                ${jokersHTML}
            </div>
            ${actionButtons}
        </div>
    `;
    
    return gameDiv;
}

// Add a new game to recent games
export function addRecentGame(date, jokers) {
    const newGame = {
        date: date,
        jokers: jokers
    };
    
    recentGames.unshift(newGame); // Add to beginning of array
    
    // Keep only the last 50 games (increased from 10 to show more history)
    if (recentGames.length > 50) {
        recentGames = recentGames.slice(0, 50);
    }
    
    // Update joker stakes based on the game
    import('../completionist/joker-data.js').then(module => {
        module.updateJokerStakesFromGame(jokers);
    });
    
    // Save data and update UI
    import('../core/api.js').then(apiModule => {
        apiModule.saveUserData();
    });
    
    renderRecentGames();
    
    import('../completionist/ui-renderer.js').then(uiModule => {
        uiModule.renderJokerGrid();
        uiModule.updateStats();
    });
}

// Delete a game entry
export function deleteGame(gameDate) {
    const gameIndex = recentGames.findIndex(game => game.date === gameDate);
    if (gameIndex === -1) {
        alert('Game not found');
        return;
    }
    
    const game = recentGames[gameIndex];
    
    // Show what will be deleted
    let deleteInfo = `Delete game from ${game.date}?\n\nThis game contains:\n`;
    game.jokers.forEach(joker => {
        const fromStake = joker.from === 'noStake' ? 'No Stake' : joker.from.replace('Stake', ' Stake');
        const toStake = joker.to === 'noStake' ? 'No Stake' : joker.to.replace('Stake', ' Stake');
        deleteInfo += `• ${joker.name}: ${fromStake} → ${toStake}\n`;
    });
    
    if (confirm(deleteInfo)) {
        // Remove the game
        recentGames.splice(gameIndex, 1);
        
        // Save the updated data
        import('../core/api.js').then(apiModule => {
            apiModule.saveUserData();
        });
        
        // Re-render the games list
        renderRecentGames();
        
        alert('Game deleted successfully!');
    }
}

// Show dialog to add a new game
export function showAddGameDialog() {
    const today = new Date();
    const localDate = today.getFullYear() + '-' + 
                     String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                     String(today.getDate()).padStart(2, '0');
    const date = prompt('Enter the date (YYYY-MM-DD):', localDate);
    if (!date) return;
    
    const jokersInput = prompt('Enter jokers (format: "Joker Name:fromStake:toStake, Another Joker:fromStake:toStake"):\n\nExample: "Bull:blackStake:goldStake, Baseball Card:purpleStake:goldStake"');
    if (!jokersInput) return;
    
    const jokers = [];
    const jokerEntries = jokersInput.split(',').map(s => s.trim());
    
    for (const entry of jokerEntries) {
        const parts = entry.split(':');
        if (parts.length === 3) {
            jokers.push({
                name: parts[0].trim(),
                from: parts[1].trim(),
                to: parts[2].trim()
            });
        }
    }
    
    if (jokers.length > 0) {
        // Show preview
        let previewText = `This will update the following jokers:\n\n`;
        jokers.forEach(joker => {
            previewText += `• ${joker.name}: ${joker.from} → ${joker.to}\n`;
        });
        previewText += `\nAnd add this game to recent games. Continue?`;
        
        if (confirm(previewText)) {
            addRecentGame(date, jokers);
            alert(`Added game with ${jokers.length} joker progressions!`);
        }
    } else {
        alert('No valid joker entries found. Please check the format.');
    }
}

// Game mode functionality
let gameMode = false;
let selectedJokers = []; // Track jokers selected for game mode

// Toggle game mode
export function toggleGameMode() {
    gameMode = !gameMode;
    selectedJokers = [];
    
    const gameModeBtn = document.getElementById('gameModeBtn');
    const updateGameBtn = document.getElementById('updateGameBtn');
    
    if (gameMode) {
        gameModeBtn.textContent = 'Exit Game Mode';
        gameModeBtn.style.background = '#dc3545';
        updateGameBtn.style.display = 'inline-block';
        document.body.classList.add('gameMode');
    } else {
        gameModeBtn.textContent = 'Game Mode';
        gameModeBtn.style.background = '#007bff';
        updateGameBtn.style.display = 'none';
        document.body.classList.remove('gameMode');
        
        // Clear any selected jokers
        document.querySelectorAll('.jokerCard.selected-for-game').forEach(card => {
            card.classList.remove('selected-for-game');
        });
    }
}

// Update game progress
export function updateGameProgress() {
    if (selectedJokers.length === 0) {
        alert('No jokers selected for game mode. Click on jokers to select them.');
        return;
    }
    
    const today = new Date();
    const localDate = today.getFullYear() + '-' + 
                     String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                     String(today.getDate()).padStart(2, '0');
    const date = prompt('Enter the date (YYYY-MM-DD):', localDate);
    if (!date) return;
    
    // Analyze selected jokers to determine current stakes and progression
    import('../completionist/joker-data.js').then(module => {
        const jokerData = module.getJokerData();
        const jokerAnalysis = selectedJokers.map(jokerId => {
            const joker = jokerData.find(j => j.id === jokerId);
            return {
                id: jokerId,
                name: joker.name,
                currentStake: joker.stakeSticker
            };
        });
        
        // Group by current stake level
        const stakeGroups = {};
        jokerAnalysis.forEach(joker => {
            if (!stakeGroups[joker.currentStake]) {
                stakeGroups[joker.currentStake] = [];
            }
            stakeGroups[joker.currentStake].push(joker);
        });
        
        // Build preview text showing current stakes
        let previewText = `Selected ${selectedJokers.length} jokers:\n\n`;
        Object.keys(stakeGroups).forEach(stake => {
            const jokers = stakeGroups[stake];
            const stakeName = stake === 'noStake' ? 'No Stake' : stake.replace('Stake', ' Stake');
            previewText += `${jokers.length} jokers currently at ${stakeName}:\n`;
            jokers.forEach(joker => {
                previewText += `  - ${joker.name}\n`;
            });
            previewText += '\n';
        });
        
        // Ask user to choose target stake
        const stakeLevels = ['noStake', 'whiteStake', 'redStake', 'greenStake', 'blueStake', 'blackStake', 'purpleStake', 'orangeStake', 'goldStake'];
        const stakeOptions = stakeLevels.map(stake => stake === 'noStake' ? 'No Stake' : stake.replace('Stake', ' Stake')).join(', ');
        const targetStakeInput = prompt(`Enter target stake level for all selected jokers (${stakeOptions}):`, 'goldStake');
        if (!targetStakeInput) return;
        
        // Convert back to internal format
        const targetStake = targetStakeInput === 'No Stake' ? 'noStake' : targetStakeInput.replace(' ', '');
        
        if (!stakeLevels.includes(targetStake)) {
            alert('Invalid stake level. Please try again.');
            return;
        }
        
        const finalPreviewText = `Confirm: Update all ${selectedJokers.length} jokers to ${targetStake === 'noStake' ? 'No Stake' : targetStake.replace('Stake', ' Stake')}?`;
        
        if (confirm(finalPreviewText)) {
            // Create game entry with individual from/to for each joker
            const gameJokers = selectedJokers.map(jokerId => {
                const joker = jokerData.find(j => j.id === jokerId);
                return {
                    name: joker.name,
                    from: joker.stakeSticker,
                    to: targetStake
                };
            });
            
            // Update joker stakes
            selectedJokers.forEach(jokerId => {
                const joker = jokerData.find(j => j.id === jokerId);
                if (joker) {
                    joker.stakeSticker = targetStake;
                }
            });
            
            // Add to recent games
            addRecentGame(date, gameJokers);
            
            // Store count before clearing
            const jokerCount = selectedJokers.length;
            
            // Exit game mode
            toggleGameMode();
            
            alert(`Updated ${jokerCount} jokers to ${targetStake === 'noStake' ? 'No Stake' : targetStake.replace('Stake', ' Stake')}!`);
        }
    });
}

// Handle joker selection in game mode
export function selectJokerForGame(jokerId) {
    if (!gameMode) return;
    
    const jokerCard = document.querySelector(`[onclick*="handleJokerClick(${jokerId})"]`);
    if (!jokerCard) return;
    
    if (selectedJokers.includes(jokerId)) {
        // Deselect
        selectedJokers = selectedJokers.filter(id => id !== jokerId);
        jokerCard.classList.remove('selected-for-game');
    } else {
        // Select
        selectedJokers.push(jokerId);
        jokerCard.classList.add('selected-for-game');
    }
}

// Get game mode state
export function getGameMode() {
    return gameMode;
}

// Get selected jokers
export function getSelectedJokers() {
    return selectedJokers;
}

// Make functions globally available for onclick handlers
window.deleteGame = deleteGame;
window.showAddGameDialog = showAddGameDialog;
window.toggleGameMode = toggleGameMode;
window.updateGameProgress = updateGameProgress;
window.selectJokerForGame = selectJokerForGame;
