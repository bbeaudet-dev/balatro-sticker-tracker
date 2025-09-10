// Board management functionality for completionist tracking

// Board state
let currentUser = null;
let currentUserData = null;
let allUsers = {};
let boardCache = {}; // Cache loaded board data to avoid repeated API calls

// Load all users
export async function loadAllUsers() {
    try {
        const response = await fetch('/api/users');
        if (response.ok) {
            const data = await response.json();
            allUsers = data.users;
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// Render board list
export function renderBoardList() {
    const boardList = document.getElementById('boardList');
    boardList.innerHTML = '';
    
    if (Object.keys(allUsers).length === 0) {
        boardList.innerHTML = '<p>Fetching data...</p>';
        return;
    }
    
    const userEntries = Object.entries(allUsers);
    const maxDisplay = 20;
    const displayUsers = userEntries.slice(0, maxDisplay);
    
    displayUsers.forEach(([username, userData]) => {
        const boardBtn = document.createElement('button');
        boardBtn.className = 'boardButton';
        if (currentUser === username) {
            boardBtn.classList.add('currentBoard');
        }
        boardBtn.onclick = () => selectBoard(username);
        
        // Calculate gold count from cached data or use stored value
        let goldCount = userData.goldCount;
        if (boardCache[username] && boardCache[username].jokers) {
            goldCount = boardCache[username].jokers.filter(j => j.stakeSticker === 'goldStake').length;
        }
        
        boardBtn.innerHTML = `
            <div class="boardName">${userData.displayName}</div>
            <div class="boardGold">
                <div class="stakeIcon goldStake"></div>
                <span>${goldCount}</span>
            </div>
        `;
        boardList.appendChild(boardBtn);
    });
    
    if (userEntries.length > maxDisplay) {
        const moreBtn = document.createElement('button');
        moreBtn.className = 'boardButton more';
        moreBtn.textContent = `+${userEntries.length - maxDisplay} more`;
        moreBtn.onclick = () => {
            // Could implement pagination or expand view here
            alert(`There are ${userEntries.length} total boards. Showing first ${maxDisplay}.`);
        };
        boardList.appendChild(moreBtn);
    }
}

// Select a board
export async function selectBoard(username) {
    try {
        // Check if we have this board cached
        if (boardCache[username]) {
            console.log(`Loading ${username} from cache`);
            loadBoardFromCache(username);
            return;
        }
        
        console.log(`Loading ${username} from database`);
        const response = await fetch(`/api/users/${username}/data`);
        if (response.ok) {
            currentUser = username;
            currentUserData = await response.json();
            
            // Cache the board data
            boardCache[username] = {
                jokers: [...currentUserData.jokers],
                recentGames: [...currentUserData.recentGames],
                timestamp: Date.now()
            };
            
            loadBoardData(username);
        }
    } catch (error) {
        console.error('Error loading board:', error);
        alert('Error loading board data');
    }
}

// Load board data from cache or fresh data
export function loadBoardData(username) {
    // Import joker data functions
    import('../completionist/joker-data.js').then(module => {
        // Reset all joker stakes to default
        const jokerData = module.getJokerData();
        jokerData.forEach(joker => {
            joker.stakeSticker = 'noStake';
        });
        
        // Load joker data
        if (currentUserData.jokers && Array.isArray(currentUserData.jokers)) {
            currentUserData.jokers.forEach(savedJoker => {
                const joker = jokerData.find(j => j.id === savedJoker.id);
                if (joker && savedJoker.stakeSticker) {
                    joker.stakeSticker = savedJoker.stakeSticker;
                }
            });
        }
        
        // Load recent games
        import('../completionist/game-tracking.js').then(gameModule => {
            gameModule.setRecentGames(currentUserData.recentGames || []);
        });
        
        // Update UI - reset authentication when switching boards
        document.getElementById('viewingUser').textContent = `${allUsers[username].displayName}'s board`;
        
        // Check if we're already authenticated for this board
        import('../core/auth.js').then(authModule => {
            const canEdit = authModule.getCanEdit();
            if (canEdit) {
                document.getElementById('loginStatus').textContent = 'Edits enabled';
            } else {
                // Reset authentication when switching to a different board
                authModule.setCanEdit(false);
                authModule.setCurrentPassword(null);
                document.getElementById('loginStatus').textContent = 'Edits disabled';
            }
            
            authModule.updateUIForAuth();
        });
        
        // Render UI
        import('../completionist/ui-renderer.js').then(uiModule => {
            uiModule.renderJokerGrid();
            uiModule.renderRecentGames();
            uiModule.updateStats();
        });
        
        // Apply current sort to the loaded data
        module.applyFilters();
        
        // Re-render board list to update highlighting
        renderBoardList();
    });
}

// Load board from cache
function loadBoardFromCache(username) {
    currentUser = username;
    currentUserData = boardCache[username];
    
    loadBoardData(username);
}

// Refresh board cache from database
export async function refreshBoardCache(username) {
    try {
        console.log(`Refreshing cache for ${username}`);
        const response = await fetch(`/api/users/${username}/data`);
        if (response.ok) {
            const freshData = await response.json();
            boardCache[username] = {
                jokers: [...freshData.jokers],
                recentGames: [...freshData.recentGames],
                timestamp: Date.now()
            };
            console.log(`Cache refreshed for ${username}`);
        }
    } catch (error) {
        console.error(`Error refreshing cache for ${username}:`, error);
    }
}

// Show dummy board with sample data
export function showDummyBoard() {
    currentUser = 'demo';
    currentUserData = {
        jokers: [],
        recentGames: []
    };
    
    // No sample data - start with clean slate
    import('../completionist/game-tracking.js').then(gameModule => {
        gameModule.setRecentGames([]);
    });
    
    document.getElementById('viewingUser').textContent = 'Demo Board';
    document.getElementById('loginStatus').textContent = 'Edits disabled';
    
    import('../core/auth.js').then(authModule => {
        authModule.setCanEdit(false);
        authModule.setCurrentPassword(null);
        authModule.updateUIForAuth();
    });
    
    import('../completionist/ui-renderer.js').then(uiModule => {
        uiModule.renderJokerGrid();
        uiModule.renderRecentGames();
        uiModule.updateStats();
    });
    
    import('../completionist/joker-data.js').then(module => {
        module.applyFilters();
    });
}

// Show create board dialog
export function showCreateBoardDialog() {
    const username = prompt('Enter username (max 15 characters, alphanumeric only):');
    if (!username) return;
    
    const displayName = prompt('Enter display name (optional, press Cancel to use username):') || username;
    const password = prompt('Enter password:');
    if (!password) return;
    
    createBoard(username, displayName, password);
}

// Create new board
export async function createBoard(username, displayName, password) {
    try {
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, displayName, password })
        });
        
        if (response.ok) {
            await loadAllUsers();
            renderBoardList();
            alert('Board created successfully!');
        } else {
            const error = await response.json();
            alert(`Error: ${error.error}`);
        }
    } catch (error) {
        console.error('Error creating board:', error);
        alert('Error creating board');
    }
}

// Get current user
export function getCurrentUser() {
    return currentUser;
}

// Get current user data
export function getCurrentUserData() {
    return currentUserData;
}

// Get all users
export function getAllUsers() {
    return allUsers;
}

// Get board cache
export function getBoardCache() {
    return boardCache;
}

// Update board cache
export function updateBoardCache(username, data) {
    boardCache[username] = {
        jokers: [...data.jokers],
        recentGames: [...data.recentGames],
        timestamp: Date.now()
    };
}
