// Joker stake sticker tracking system
let jokerData = [];
let filteredJokers = [];
let searchTerm = '';
let sortBy = 'collection';

// Multi-user system
let currentUser = null;
let currentUserData = null;
let allUsers = {};
let canEdit = false; // Simplified: just track if editing is enabled
let currentPassword = null; // Store password for current session

// Board caching system
let boardCache = {}; // Cache loaded board data to avoid repeated API calls

// Game mode for adding game progress
let gameMode = false;
let selectedJokers = []; // Track jokers selected for game mode

// Recent games tracking
let recentGames = [];

// naneinf tracking
let naneinfGames = [];
const NANEINF_TARGET = 1.80e308; // 1.80 × 10^308
const NANEINF_CURRENT = 3.984e115; // 3.984 × 10^115

// Stake types
const stakeTypes = [
    'noStake',
    'whiteStake',
    'redStake', 
    'greenStake', 
    'blueStake', 
    'blackStake', 
    'purpleStake', 
    'orangeStake', 
    'goldStake'
];

// Color codes for joker descriptions
const colorCodes = {
    multc: '<span class="mult">',
    endc: '</span>',
    numc: '<span class="num">',
    probc: '<span class="prob">',
    chipc: '<span class="chip">',
    shadowc: '<span class="shadow">',
    diamondc: '<span class="diamond">♦</span>',
    heartc: '<span class="heart">♥</span>',
    spadec: '<span class="spade">♠</span>',
    clubc: '<span class="club">♣</span>',
    prodc: '<span class="prod">',
    moneyc: '<span class="money>'
};

// Process description template literals
function processDescription(description, jokerValue = 0) {
    let processed = description;
    
    // Replace money values
    processed = processed.replace(/\${moneyc}/g, `<span class="money">`);
    
    // Replace color codes with spans
    for (const [code, span] of Object.entries(colorCodes)) {
        processed = processed.replaceAll('${' + code + '}', span);
    }
    
    // Replace joker value if present
    processed = processed.replace(/\${(\d+\*)?jokerValue}/, (match, multiplier) => {
        if (multiplier) {
            return parseInt(multiplier) * jokerValue;
        }
        return jokerValue;
    });

    // Add money class for dollar amounts
    processed = processed.replace(/\$(\d+)/g, '<span class="money">$$$1</span>');
    
    return processed;
}

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    initializeJokerData();
    
    // Show loading state immediately
    renderBoardList();
    
    // Load users in background
    await loadAllUsers();
    renderBoardList();
    
    // Auto-load Ben Beau's board if it exists, otherwise show dummy board
    if (allUsers['benbeau']) {
        await selectBoard('benbeau');
    } else {
        // Show dummy board with sample data
        showDummyBoard();
    }
    
    updateUIForAuth();
    
    // Initialize naneinf page
    initializeNaneinfPage();
});

// Load all users
async function loadAllUsers() {
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
function renderBoardList() {
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
async function selectBoard(username) {
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
function loadBoardData(username) {
    // Reset all joker stakes to default
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
    recentGames = currentUserData.recentGames || [];
    
    // Update UI - reset authentication when switching boards
    document.getElementById('viewingUser').textContent = `${allUsers[username].displayName}'s board`;
    
    // Check if we're already authenticated for this board
    if (canEdit) {
        document.getElementById('loginStatus').textContent = 'Edits enabled';
    } else {
        // Reset authentication when switching to a different board
        canEdit = false;
        currentPassword = null;
        document.getElementById('loginStatus').textContent = 'Edits disabled';
    }
    
    renderJokerGrid();
    renderRecentGames();
    updateStats();
    updateUIForAuth();
    
    // Apply current sort to the loaded data
    applyFilters();
    
    // Re-render board list to update highlighting
    renderBoardList();
}

// Load board from cache
function loadBoardFromCache(username) {
    currentUser = username;
    currentUserData = boardCache[username];
    
    loadBoardData(username);
}

// Refresh board cache from database
async function refreshBoardCache(username) {
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
function showDummyBoard() {
    currentUser = 'demo';
    currentUserData = {
        jokers: [],
        recentGames: []
    };
    
    // No sample data - start with clean slate
    recentGames = [];
    
    document.getElementById('viewingUser').textContent = 'Demo Board';
    document.getElementById('loginStatus').textContent = 'Edits disabled';
    canEdit = false;
    currentPassword = null;
    
    renderJokerGrid();
    renderRecentGames();
    updateStats();
    updateUIForAuth();
    applyFilters();
}

// Show create board dialog
function showCreateBoardDialog() {
    const username = prompt('Enter username (max 15 characters, alphanumeric only):');
    if (!username) return;
    
    const displayName = prompt('Enter display name (optional, press Cancel to use username):') || username;
    const password = prompt('Enter password:');
    if (!password) return;
    
    createBoard(username, displayName, password);
}

// Create new board
async function createBoard(username, displayName, password) {
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

// Show login dialog
function showLoginDialog() {
    if (!currentUser) {
        alert('Please select a board first');
        return;
    }
    
    const password = prompt(`Enter password for ${allUsers[currentUser].displayName}'s board:`);
    if (!password) return;
    
    authenticateUser(currentUser, password);
}

// Authenticate user
async function authenticateUser(username, password) {
    try {
        const response = await fetch('/api/auth', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });
        
        if (response.ok) {
            canEdit = true;
            currentPassword = password; // Store password for current session
            document.getElementById('loginStatus').textContent = 'Edits enabled';
            updateUIForAuth();
        } else {
            alert('Incorrect password');
        }
    } catch (error) {
        console.error('Error authenticating:', error);
        alert('Error authenticating');
    }
}

// Logout
function logout() {
    canEdit = false;
    currentPassword = null; // Clear password on logout
    document.getElementById('loginStatus').textContent = 'Edits disabled';
    updateUIForAuth();
}

// Update UI based on authentication
function updateUIForAuth() {
    const resetBtn = document.getElementById('resetBtn');
    const exportBtn = document.getElementById('exportBtn');
    const importBtn = document.getElementById('importBtn');
    const gameModeBtn = document.getElementById('gameModeBtn');
    const updateGameBtn = document.getElementById('updateGameBtn');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (canEdit && currentUser) {
        // Show editing features
        if (resetBtn) resetBtn.style.display = 'inline-block';
        if (exportBtn) exportBtn.style.display = 'inline-block';
        if (importBtn) importBtn.style.display = 'inline-block';
        if (gameModeBtn) gameModeBtn.style.display = 'inline-block';
        if (loginBtn) loginBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
        
        // Enable joker editing
        document.body.classList.add('canEdit');
    } else {
        // Hide editing features
        if (resetBtn) resetBtn.style.display = 'none';
        if (exportBtn) exportBtn.style.display = 'none';
        if (importBtn) importBtn.style.display = 'none';
        if (gameModeBtn) gameModeBtn.style.display = 'none';
        if (updateGameBtn) updateGameBtn.style.display = 'none';
        if (loginBtn) loginBtn.style.display = 'inline-block';
        if (logoutBtn) logoutBtn.style.display = 'none';
        
        // Disable joker editing
        document.body.classList.remove('canEdit');
    }
    
    // Re-render recent games to show/hide edit buttons
    renderRecentGames();
}

// Initialize joker data from the jokerTexts array
function initializeJokerData() {
    jokerData = [];
    let jokerIndex = 0;
    
    // Collection order mapping (from cards.js)
    const collectionOrder = {
        'Joker': 1, 'Greedy Joker': 2, 'Lusty Joker': 3, 'Wrathful Joker': 4, 'Gluttonous Joker': 5,
        'Jolly Joker': 6, 'Zany Joker': 7, 'Mad Joker': 8, 'Crazy Joker': 9, 'Droll Joker': 10,
        'Sly Joker': 11, 'Wily Joker': 12, 'Clever Joker': 13, 'Devious Joker': 14, 'Crafty Joker': 15,
        'Half Joker': 16, 'Joker Stencil': 17, 'Four Fingers': 18, 'Mime': 19, 'Credit Card': 20,
        'Ceremonial Dagger': 21, 'Banner': 22, 'Mystic Summit': 23, 'Marble Joker': 24, 'Loyalty Card': 25,
        '8 Ball': 26, 'Misprint': 27, 'Dusk': 28, 'Raised Fist': 29, 'Chaos the Clown': 30,
        'Fibonacci': 31, 'Steel Joker': 32, 'Scary Face': 33, 'Abstract Joker': 34, 'Delayed Gratification': 35,
        'Hack': 36, 'Pareidolia': 37, 'Gros Michel': 38, 'Even Steven': 39, 'Odd Todd': 40,
        'Scholar': 41, 'Business Card': 42, 'Supernova': 43, 'Ride the Bus': 44, 'Space Joker': 45,
        'Egg': 46, 'Burglar': 47, 'Blackboard': 48, 'Runner': 49, 'Ice Cream': 50,
        'DNA': 51, 'Splash': 52, 'Blue Joker': 53, 'Sixth Sense': 54, 'Constellation': 55,
        'Hiker': 56, 'Faceless Joker': 57, 'Green Joker': 58, 'Superposition': 59, 'To Do List': 60,
        'Cavendish': 61, 'Card Sharp': 62, 'Red Card': 63, 'Madness': 64, 'Square Joker': 65,
        'Séance': 66, 'Riff-raff': 67, 'Vampire': 68, 'Shortcut': 69, 'Hologram': 70,
        'Vagabond': 71, 'Baron': 72, 'Cloud 9': 73, 'Rocket': 74, 'Obelisk': 75,
        'Midas Mask': 76, 'Luchador': 77, 'Photograph': 78, 'Gift Card': 79, 'Turtle Bean': 80,
        'Erosion': 81, 'Reserved Parking': 82, 'Mail-In Rebate': 83, 'To the Moon': 84, 'Hallucination': 85,
        'Fortune Teller': 86, 'Juggler': 87, 'Drunkard': 88, 'Stone Joker': 89, 'Golden Joker': 90,
        'Lucky Cat': 91, 'Baseball Card': 92, 'Bull': 93, 'Diet Cola': 94, 'Trading Card': 95,
        'Flash Card': 96, 'Popcorn': 97, 'Spare Trousers': 98, 'Ancient Joker': 99, 'Ramen': 100,
        'Walkie Talkie': 101, 'Seltzer': 102, 'Castle': 103, 'Smiley Face': 104, 'Campfire': 105,
        'Golden Ticket': 106, 'Mr. Bones': 107, 'Acrobat': 108, 'Sock and Buskin': 109, 'Swashbuckler': 110,
        'Troubadour': 111, 'Certificate': 112, 'Smeared Joker': 113, 'Throwback': 114, 'Hanging Chad': 115,
        'Rough Gem': 116, 'Bloodstone': 117, 'Arrowhead': 118, 'Onyx Agate': 119, 'Glass Joker': 120,
        'Showman': 121, 'Flower Pot': 122, 'Blueprint': 123, 'Wee Joker': 124, 'Merry Andy': 125,
        'Oops! All 6s': 126, 'The Idol': 127, 'Seeing Double': 128, 'Matador': 129, 'Hit the Road': 130,
        'The Duo': 131, 'The Trio': 132, 'The Family': 133, 'The Order': 134, 'The Tribe': 135,
        'Stuntman': 136, 'Invisible Joker': 137, 'Brainstorm': 138, 'Satellite': 139, 'Shoot the Moon': 140,
        "Driver's License": 141, 'Cartomancer': 142, 'Astronomer': 143, 'Burnt Joker': 144, 'Bootstraps': 145,
        'Canio': 146, 'Triboulet': 147, 'Yorick': 148, 'Chicot': 149, 'Perkeo': 150
    };
    
    for (let i = 0; i < jokerTexts.length; i++) {
        for (let j = 0; j < jokerTexts[i].length; j++) {
            if (jokerTexts[i][j] && jokerTexts[i][j][0]) {
                const jokerName = jokerTexts[i][j][0];
                const collectionOrderValue = collectionOrder[jokerName] || 999;
                
                const joker = {
                    id: jokerIndex++,
                    name: jokerName,
                    description: jokerTexts[i][j][1],
                    position: [i, j],
                    rarity: jokerRarity[i][j],
                    rarityName: rarityNames[jokerRarity[i][j]],
                    collectionOrder: collectionOrderValue,
                    stakeSticker: 'noStake' // Default to no stake
                };
                jokerData.push(joker);
            }
        }
    }
    
    // Initialize with collection order sorting
    filteredJokers = [...jokerData].sort((a, b) => a.collectionOrder - b.collectionOrder);
}

// Generate joker string for display with stake sticker
function jokerString(i, j, stakeType = 'noStake') {
    // The sprite sheet is 710x1520 pixels, with each joker being 71x95 pixels
    const cardWidth = 71;
    const cardHeight = 95;
    
    // Calculate positions
    const xPos = j * cardWidth;
    const yPos = i * cardHeight;
    
    // Handle special cases for soul cards (including Hologram)
    // Background positions and icon positions (zero-based row/col)
    const soulCards = {
        '8,3': { bgRow: 8, bgCol: 3, iconRow: 9, iconCol: 3 }, // Canio (Row 9 pos 4 / Row 10 pos 4)
        '8,4': { bgRow: 8, bgCol: 4, iconRow: 9, iconCol: 4 }, // Triboulet (Row 9 pos 5 / Row 10 pos 5)
        '8,5': { bgRow: 8, bgCol: 5, iconRow: 9, iconCol: 5 }, // Yorick (Row 9 pos 6 / Row 10 pos 6)
        '8,6': { bgRow: 8, bgCol: 6, iconRow: 9, iconCol: 6 }, // Chicot (Row 9 pos 7 / Row 10 pos 7)
        '8,7': { bgRow: 8, bgCol: 7, iconRow: 9, iconCol: 7 }, // Perkeo (Row 9 pos 8 / Row 10 pos 8)
        '12,4': { bgRow: 9, bgCol: 9, iconRow: 9, iconCol: 2 } // Hologram (Row 10 pos 10 / Row 10 pos 3)
    };
    
    if (`${i},${j}` in soulCards) {
        const soul = soulCards[`${i},${j}`];
        // For soul cards, we need both the background and the icon
        return `" style="background-position: -${soul.bgCol * cardWidth}px -${soul.bgRow * cardHeight}px" data-soul="true" data-icon-pos="${soul.iconCol * cardWidth},${soul.iconRow * cardHeight}"`;
    }
    
    return `" style="background-position: -${xPos}px -${yPos}px"`;
}

// Render the joker grid
function renderJokerGrid() {
    const grid = document.getElementById('jokerGrid');
    grid.innerHTML = '';
    
    filteredJokers.forEach(joker => {
        const jokerElement = createJokerElement(joker);
        grid.appendChild(jokerElement);
    });
}

// Render recent games section
function renderRecentGames() {
    const container = document.getElementById('recentGamesList');
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
    const actionButtons = canEdit ? `
        <div class="gameActions">
            <button class="deleteGameBtn" onclick="deleteGame('${game.date}')" title="Delete Game">🗑️</button>
        </div>
    ` : '';
    
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
                ${stakeTypes.map(stakeType => {
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

// Get display name for stake type
function getStakeDisplayName(stakeType) {
    const names = {
        'noStake': 'No Stake',
        'goldStake': 'Gold Stake',
        'orangeStake': 'Orange Stake',
        'purpleStake': 'Purple Stake',
        'blackStake': 'Black Stake',
        'blueStake': 'Blue Stake',
        'greenStake': 'Green Stake',
        'redStake': 'Red Stake',
        'whiteStake': 'White Stake'
    };
    return names[stakeType] || stakeType;
}

// Set stake sticker for a joker
function setStakeSticker(jokerId, stakeType) {
    if (!canEdit) {
        showLoginDialog();
        return;
    }
    
    const joker = jokerData.find(j => j.id === jokerId);
    if (joker) {
        const editor = document.getElementById(`stakeEditor-${jokerId}`);
        const buttons = editor.querySelectorAll('.stickerBtn');

        // Update joker data first
        joker.stakeSticker = stakeType;
        
        // Update button states - remove active from all, add to selected
        buttons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.classList.contains(stakeType)) {
                btn.classList.add('active');
            }
        });
        
        // Save data
        saveUserData();
        
        // Update only the specific joker element instead of re-rendering entire grid
        const jokerElement = editor.parentElement;
        const jokerCard = jokerElement.querySelector('.jokerCard');
        jokerCard.setAttribute('data-stake', stakeType);
        
        // Update stats and close editor immediately
        updateStats();
        hideStakeEditor(jokerId);
    }
}

// Filter jokers based on search term
function filterJokers() {
    searchTerm = document.getElementById('searchInput').value.toLowerCase();
    applyFilters();
}

// Sort jokers
function sortJokers() {
    sortBy = document.querySelector('input[name="sort"]:checked').value;
    applyFilters();
}

// Apply filters and sorting
function applyFilters() {
    filteredJokers = jokerData.filter(joker => {
        return joker.name.toLowerCase().includes(searchTerm) ||
               joker.description.toLowerCase().includes(searchTerm);
    });
    
    // Sort the filtered jokers
    filteredJokers.sort((a, b) => {
        switch (sortBy) {
            case 'name':
                return a.name.localeCompare(b.name);
            case 'rarity':
                // Sort by rarity (highest to lowest) and then by name
                if (b.rarity !== a.rarity) {
                    return b.rarity - a.rarity;
                }
                return a.name.localeCompare(b.name);
            case 'stake':
                // Define stake order from highest to lowest
                const stakeOrder = {
                    'goldStake': 8,
                    'orangeStake': 7,
                    'purpleStake': 6,
                    'blackStake': 5,
                    'blueStake': 4,
                    'greenStake': 3,
                    'redStake': 2,
                    'whiteStake': 1,
                    'noStake': 0
                };
                // Sort by stake value (highest to lowest) and then by name
                if (stakeOrder[b.stakeSticker] !== stakeOrder[a.stakeSticker]) {
                    return stakeOrder[b.stakeSticker] - stakeOrder[a.stakeSticker];
                }
                return a.name.localeCompare(b.name);
            case 'collection':
                // Sort by collection order (the order they appear in the game)
                return a.collectionOrder - b.collectionOrder;
            default:
                return 0;
        }
    });
    
    renderJokerGrid();
}

// Update statistics
function updateStats() {
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

// Reset all stickers
function resetAllStickers() {
    if (!canEdit) {
        showLoginDialog();
        return;
    }
    
    if (confirm('Are you sure you want to reset all stickers?')) {
        jokerData.forEach(joker => {
            joker.stakeSticker = 'noStake';
        });
        saveUserData();
        renderJokerGrid();
        updateStats();
    }
}

// Save user data
async function saveUserData() {
    if (!currentUser || !canEdit) return;
    
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
        // We need to store it when user logs in
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
                canEdit = false;
                currentPassword = null;
                document.getElementById('loginStatus').textContent = 'Edits disabled';
                updateUIForAuth();
                alert('Session expired. Please log in again.');
            } else {
                alert(`Error saving: ${error.error}`);
            }
        } else {
            // Update the user's gold count in the board list
            const goldCount = jokerData.filter(j => j.stakeSticker === 'goldStake').length;
            if (allUsers[currentUser]) {
                allUsers[currentUser].goldCount = goldCount;
            }
            
            // Update the cache with the new data
            if (boardCache[currentUser]) {
                boardCache[currentUser] = {
                    jokers: [...data.jokers],
                    recentGames: [...data.recentGames],
                    timestamp: Date.now()
                };
            }
        }
    } catch (error) {
        console.error('Error saving data:', error);
        alert('Error saving data');
    }
}

// Export sticker data
function exportStickerData() {
    if (!canEdit) {
        showLoginDialog();
        return;
    }
    
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
function importStickerData() {
    if (!canEdit) {
        showLoginDialog();
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
                        // Clear current data
                        jokerData.forEach(joker => {
                            joker.stakeSticker = 'noStake';
                        });
                        
                        // Load imported data
                        data.jokers.forEach(savedJoker => {
                            const joker = jokerData.find(j => j.id === savedJoker.id);
                            if (joker && savedJoker.stakeSticker) {
                                joker.stakeSticker = savedJoker.stakeSticker;
                            }
                        });
                        
                        // Load recent games if available
                        if (data.recentGames && Array.isArray(data.recentGames)) {
                            recentGames = data.recentGames;
                        }
                        
                        // Save to server and update display
                        saveUserData();
                        renderJokerGrid();
                        renderRecentGames();
                        updateStats();
                        
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

// Add a new game to recent games
function addRecentGame(date, jokers) {
    if (!canEdit) {
        showLoginDialog();
        return;
    }
    
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
    jokers.forEach(jokerProgression => {
        const joker = jokerData.find(j => j.name === jokerProgression.name);
        if (joker) {
            joker.stakeSticker = jokerProgression.to;
        }
    });
    
    saveUserData();
    renderRecentGames();
    renderJokerGrid();
    updateStats();
}

// Get joker position by name
function getJokerPositionByName(jokerName) {
    const joker = jokerData.find(j => j.name === jokerName);
    return joker ? joker.position : null;
}

// Create a reusable joker card component
function createJokerCardComponent(jokerName, stakeType = 'noStake', size = 'normal') {
    const position = getJokerPositionByName(jokerName);
    if (!position) {
        return `<span class="jokerName">${jokerName}</span>`; // Fallback to text if joker not found
    }
    
    const [i, j] = position;
    const jokerStringValue = jokerString(i, j, stakeType);
    
    // Check if this is a soul card
    const soulCards = {
        '8,3': true, '8,4': true, '8,5': true, '8,6': true, '8,7': true, '12,4': true
    };
    const isSoulCard = `${i},${j}` in soulCards;
    
    const sizeClass = size === 'small' ? 'jokerCardSmall' : 'jokerCard';
    
    let cardHTML = `<div class="${sizeClass}${jokerStringValue}" data-stake="${stakeType}" title="${jokerName}"`;
    
    if (size === 'small') {
        cardHTML += ` onmousemove="hoverCard(event)" onmouseout="noHoverCard(event)"`;
    } else {
        cardHTML += ` onclick="showStakeEditor(${jokerData.find(j => j.name === jokerName)?.id})" onmousemove="hoverCard(event)" onmouseout="noHoverCard(event)"`;
    }
    
    cardHTML += `></div>`;
    
    // Set CSS custom property for soul cards
    if (isSoulCard) {
        const iconPos = jokerStringValue.match(/data-icon-pos="([^"]+)"/);
        if (iconPos) {
            cardHTML = cardHTML.replace('></div>', ` style="--icon-pos: ${iconPos[1]};"></div>`);
        }
    }
    
    return cardHTML;
}

// Show dialog to add a new game
function showAddGameDialog() {
    if (!canEdit) {
        showLoginDialog();
        return;
    }
    
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

// Toggle game mode
function toggleGameMode() {
    if (!canEdit) {
        showLoginDialog();
        return;
    }
    
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
function updateGameProgress() {
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
}



// Delete a game entry
function deleteGame(gameDate) {
    if (!canEdit) {
        showLoginDialog();
        return;
    }
    
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
        saveUserData();
        
        // Re-render the games list
        renderRecentGames();
        
        alert('Game deleted successfully!');
    }
}

// Handle joker selection in game mode
function selectJokerForGame(jokerId) {
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

// Handle joker click (either normal editing or game mode)
function handleJokerClick(jokerId) {
    if (gameMode) {
        selectJokerForGame(jokerId);
    } else {
        showStakeEditor(jokerId);
    }
}

// Keep existing hover card functionality
function hoverCard(event) {
    // This function is kept for compatibility with existing hoverCard.js
    // The tooltip functionality is now handled by CSS
}

function noHoverCard(event) {
    // This function is kept for compatibility with existing hoverCard.js
    // The tooltip functionality is now handled by CSS
}

// Show stake editor for a joker
function showStakeEditor(jokerId) {
    if (!canEdit) {
        showLoginDialog();
        return;
    }
    
    // Hide any other open editors first
    const allEditors = document.querySelectorAll('.stakeEditor');
    allEditors.forEach(editor => {
        const editorId = editor.id.split('-')[1];
        if (editorId !== jokerId.toString()) {
            hideStakeEditor(parseInt(editorId));
        }
    });

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

function hideStakeEditor(jokerId) {
    const editor = document.getElementById(`stakeEditor-${jokerId}`);
    const jokerCard = editor?.parentElement?.querySelector('.jokerCard');
    if (editor) {
        editor.style.display = 'none';
        jokerCard?.classList.remove('selected');
    }
}

// Add click outside handler to close editors
document.addEventListener('click', function(event) {
    const target = event.target;
    const isJokerCard = target.classList.contains('jokerCard');
    const isStickerBtn = target.classList.contains('stickerBtn');
    const isStakeEditor = target.closest('.stakeEditor');
    
    if (!isJokerCard && !isStickerBtn && !isStakeEditor) {
        const allEditors = document.querySelectorAll('.stakeEditor');
        allEditors.forEach(editor => {
            const editorId = editor.id.split('-')[1];
            hideStakeEditor(parseInt(editorId));
        });
    }
});

// Tab switching functionality
function switchTab(tabId) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tabContent');
    tabContents.forEach(content => {
        content.classList.remove('active');
    });
    
    // Remove active class from all tabs
    const tabs = document.querySelectorAll('.navTab');
    tabs.forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab content
    const selectedTab = document.getElementById(tabId);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Add active class to clicked tab
    const clickedTab = event.target;
    clickedTab.classList.add('active');
    
    // Initialize specific tab content if needed
    if (tabId === 'naneinf') {
        renderNaneinfGames();
        updateNaneinfProgress();
    }
}

// naneinf page functions
function initializeNaneinfPage() {
    // Add sample naneinf games
    naneinfGames = [
        {
            id: 1,
            date: '2025-01-15',
            score: 3.984e115,
            media: [],
            notes: 'First attempt at naneinf. Managed to get a decent score but still far from the target. Need to work on better joker combinations and deck building strategies.'
        },
        {
            id: 2,
            date: '2025-01-14',
            score: 2.1e110,
            media: [],
            notes: 'Tried a different approach with more focus on multiplier jokers. Got close to my previous high but still need to optimize the build.'
        }
    ];
    
    // Add the "Add New Game" button
    const naneinfSection = document.getElementById('naneinfRecentGamesSection');
    if (naneinfSection && !document.getElementById('addNaneinfGameBtn')) {
        const addBtn = document.createElement('button');
        addBtn.id = 'addNaneinfGameBtn';
        addBtn.textContent = 'Add New naneinf Run';
        addBtn.onclick = showAddNaneinfGameDialog;
        naneinfSection.appendChild(addBtn);
    }
}

function updateNaneinfProgress() {
    const progress = (NANEINF_CURRENT / NANEINF_TARGET) * 100;
    const progressBar = document.getElementById('naneinfProgress');
    const progressPercent = document.getElementById('naneinfPercent');
    const progressText = document.getElementById('naneinfProgressText');
    
    if (progressBar) {
        progressBar.style.width = `${Math.min(progress, 100)}%`;
    }
    
    if (progressPercent) {
        progressPercent.textContent = `${(progress * 1e-10).toFixed(2)}e-10%`; // Show in scientific notation
    }
    
    if (progressText) {
        progressText.textContent = `3.984 × 10¹¹⁵ / 1.80 × 10³⁰⁸`;
    }
}

function renderNaneinfGames() {
    const container = document.getElementById('naneinfRecentGamesList');
    if (!container) return;
    
    container.innerHTML = '';
    
    naneinfGames.forEach(game => {
        const gameElement = createNaneinfGameElement(game);
        container.appendChild(gameElement);
    });
}

function createNaneinfGameElement(game) {
    const gameDiv = document.createElement('div');
    gameDiv.className = 'naneinfGameEntry';
    gameDiv.id = `naneinf-game-${game.id}`;
    
    // Parse the date string as local date (not UTC)
    const [year, month, day] = game.date.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed
    const formattedDate = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    // Format score in scientific notation
    const formattedScore = game.score.toExponential(3);
    
    let mediaHTML = '';
    if (game.media && game.media.length > 0) {
        game.media.forEach((mediaItem, index) => {
            if (mediaItem.type === 'image') {
                mediaHTML += `
                    <div class="naneinfMediaItem">
                        <img src="${mediaItem.url}" alt="Screenshot ${index + 1}">
                        <button class="removeMedia" onclick="removeNaneinfMedia(${game.id}, ${index})">×</button>
                    </div>
                `;
            } else if (mediaItem.type === 'video') {
                mediaHTML += `
                    <div class="naneinfMediaItem">
                        <video controls>
                            <source src="${mediaItem.url}" type="video/mp4">
                            Your browser does not support the video tag.
                        </video>
                        <button class="removeMedia" onclick="removeNaneinfMedia(${game.id}, ${index})">×</button>
                    </div>
                `;
            }
        });
    }
    
    // Add media upload area
    mediaHTML += `
        <div class="naneinfMediaUpload" onclick="uploadNaneinfMedia(${game.id})">
            <p>📷 Click to add screenshots or videos</p>
            <p style="font-size: 0.8em; color: #666;">Drag & drop or click to upload</p>
        </div>
    `;
    
    // Add action buttons
    const actionButtons = `
        <div class="naneinfGameActions">
            <button class="naneinfEditBtn" onclick="editNaneinfGame(${game.id})" title="Edit Game">✏️</button>
            <button class="naneinfDeleteBtn" onclick="deleteNaneinfGame(${game.id})" title="Delete Game">🗑️</button>
        </div>
    `;
    
    gameDiv.innerHTML = `
        <div class="naneinfGameHeader">
            <div class="naneinfGameDate">${formattedDate}</div>
            <div class="naneinfGameScore">${formattedScore}</div>
        </div>
        <div class="naneinfGameContent">
            <div class="naneinfGameMedia">
                ${mediaHTML}
            </div>
            <div class="naneinfGameNotes">
                <h4>Notes</h4>
                <p>${game.notes || 'No notes added yet.'}</p>
            </div>
        </div>
        ${actionButtons}
    `;
    
    return gameDiv;
}

function showAddNaneinfGameDialog() {
    const today = new Date();
    const localDate = today.getFullYear() + '-' + 
                     String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                     String(today.getDate()).padStart(2, '0');
    
    const date = prompt('Enter the date (YYYY-MM-DD):', localDate);
    if (!date) return;
    
    const scoreInput = prompt('Enter your score (e.g., 3.984e115):');
    if (!scoreInput) return;
    
    const score = parseFloat(scoreInput);
    if (isNaN(score)) {
        alert('Invalid score format. Please enter a valid number.');
        return;
    }
    
    const notes = prompt('Enter notes about this run (optional):') || '';
    
    const newGame = {
        id: Date.now(), // Simple ID generation
        date: date,
        score: score,
        media: [],
        notes: notes
    };
    
    naneinfGames.unshift(newGame); // Add to beginning
    
    // Keep only the last 20 games
    if (naneinfGames.length > 20) {
        naneinfGames = naneinfGames.slice(0, 20);
    }
    
    renderNaneinfGames();
    updateNaneinfProgress();
    
    alert('naneinf run added successfully!');
}

function editNaneinfGame(gameId) {
    const game = naneinfGames.find(g => g.id === gameId);
    if (!game) return;
    
    const newScore = prompt('Enter new score:', game.score.toString());
    if (newScore === null) return;
    
    const score = parseFloat(newScore);
    if (isNaN(score)) {
        alert('Invalid score format.');
        return;
    }
    
    const newNotes = prompt('Enter new notes:', game.notes);
    if (newNotes === null) return;
    
    game.score = score;
    game.notes = newNotes;
    
    renderNaneinfGames();
    updateNaneinfProgress();
    
    alert('Game updated successfully!');
}

function deleteNaneinfGame(gameId) {
    const game = naneinfGames.find(g => g.id === gameId);
    if (!game) return;
    
    const [year, month, day] = game.date.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const formattedDate = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    if (confirm(`Delete naneinf run from ${formattedDate} with score ${game.score.toExponential(3)}?`)) {
        naneinfGames = naneinfGames.filter(g => g.id !== gameId);
        renderNaneinfGames();
        alert('Game deleted successfully!');
    }
}

function uploadNaneinfMedia(gameId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*';
    input.multiple = true;
    
    input.onchange = function(event) {
        const files = Array.from(event.target.files);
        const game = naneinfGames.find(g => g.id === gameId);
        
        if (!game) return;
        
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const mediaItem = {
                    type: file.type.startsWith('image/') ? 'image' : 'video',
                    url: e.target.result,
                    name: file.name
                };
                
                if (!game.media) {
                    game.media = [];
                }
                game.media.push(mediaItem);
                
                renderNaneinfGames();
            };
            reader.readAsDataURL(file);
        });
    };
    
    input.click();
}

function removeNaneinfMedia(gameId, mediaIndex) {
    const game = naneinfGames.find(g => g.id === gameId);
    if (!game || !game.media) return;
    
    if (confirm('Remove this media item?')) {
        game.media.splice(mediaIndex, 1);
        renderNaneinfGames();
    }
}