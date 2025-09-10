// API calls and server communication

// These will be imported dynamically to avoid circular dependencies

// Save user data
export async function saveUserData() {
    // Import modules dynamically to avoid circular dependencies
    const boardModule = await import('../completionist/board-management.js');
    const jokerModule = await import('../completionist/joker-data.js');
    const gameModule = await import('../completionist/game-tracking.js');
    const authModule = await import('./auth.js');
    
    const currentUser = boardModule.getCurrentUser();
    const canEdit = authModule.getCanEdit();
    
    if (!currentUser || !canEdit) return;
    
    const jokerData = jokerModule.getJokerData();
    const recentGames = gameModule.getRecentGames();
    
    const data = {
        lastUpdated: new Date().toISOString(),
        jokers: jokerData.map(joker => ({
            id: joker.id,
            name: joker.name,
            stakeSticker: joker.stakeSticker
        })),
        recentGames: recentGames
    };

    try {
        // Get the password from the current authentication session
        const currentPassword = authModule.getCurrentPassword();
        if (!currentPassword) {
            console.error('No password stored for current session');
            return;
        }
        
        const response = await fetch(`/api/users/${currentUser}/data`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                password: currentPassword,
                jokers: data.jokers,
                recentGames: data.recentGames
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            if (error.error === 'Invalid password') {
                // Password is no longer valid, log out
                authModule.setCanEdit(false);
                authModule.setCurrentPassword(null);
                document.getElementById('loginStatus').textContent = 'Edits disabled';
                authModule.updateUIForAuth();
                alert('Session expired. Please log in again.');
            } else {
                alert(`Error saving: ${error.error}`);
            }
        } else {
            // Update the user's gold count in the board list
            const goldCount = jokerData.filter(j => j.stakeSticker === 'goldStake').length;
            const allUsers = boardModule.getAllUsers();
            if (allUsers[currentUser]) {
                allUsers[currentUser].goldCount = goldCount;
            }
            
            // Update the cache with the new data
            boardModule.updateBoardCache(currentUser, data);
        }
    } catch (error) {
        console.error('Error saving data:', error);
        alert('Error saving data');
    }
}

// Export sticker data
export async function exportStickerData() {
    const authModule = await import('./auth.js');
    const jokerModule = await import('../completionist/joker-data.js');
    const gameModule = await import('../completionist/game-tracking.js');
    const boardModule = await import('../completionist/board-management.js');
    
    const canEdit = authModule.getCanEdit();
    if (!canEdit) {
        authModule.showLoginDialog();
        return;
    }
    
    const jokerData = jokerModule.getJokerData();
    const recentGames = gameModule.getRecentGames();
    const currentUser = boardModule.getCurrentUser();
    
    const data = {
        lastUpdated: new Date().toISOString(),
        jokers: jokerData.map(joker => ({
            id: joker.id,
            name: joker.name,
            stakeSticker: joker.stakeSticker
        })),
        recentGames: recentGames
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `balatro-stakes-${currentUser}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Import sticker data from JSON file
export async function importStickerData() {
    const authModule = await import('./auth.js');
    
    const canEdit = authModule.getCanEdit();
    if (!canEdit) {
        authModule.showLoginDialog();
        return;
    }
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const data = JSON.parse(e.target.result);
                    if (data.jokers && Array.isArray(data.jokers)) {
                        // Import joker data
                        import('../completionist/joker-data.js').then(module => {
                            module.importJokerData(data.jokers);
                        });
                        
                        // Import recent games if available
                        if (data.recentGames && Array.isArray(data.recentGames)) {
                            import('../completionist/game-tracking.js').then(module => {
                                module.setRecentGames(data.recentGames);
                            });
                        }
                        
                        // Save to server and update display
                        saveUserData();
                        
                        import('../completionist/ui-renderer.js').then(uiModule => {
                            uiModule.renderJokerGrid();
                            uiModule.updateStats();
                        });
                        
                        import('../completionist/game-tracking.js').then(gameModule => {
                            gameModule.renderRecentGames();
                        });
                        
                        alert(`Successfully imported ${data.jokers.length} joker stakes!`);
                    } else {
                        alert('Invalid file format. Please select a valid Balatro stakes JSON file.');
                    }
                } catch (error) {
                    console.error('Error importing data:', error);
                    alert('Error importing data. Please check the file format.');
                }
            };
            reader.readAsText(file);
        }
    };
    input.click();
}

// Make functions globally available for onclick handlers
window.exportStickerData = exportStickerData;
window.importStickerData = importStickerData;
