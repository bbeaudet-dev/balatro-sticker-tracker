// Joker stake sticker tracking system
let jokerData = [];
let filteredJokers = [];
let searchTerm = '';
let sortBy = 'collection';

// Read-only mode - set to true for live site deployment
const READ_ONLY_MODE = false; // Change to true for live site

// Recent games tracking
let recentGames = [
    {
        date: '2024-08-12',
        jokers: [
            { name: 'Bull', from: 'blackStake', to: 'goldStake' },
            { name: 'Baseball Card', from: 'purpleStake', to: 'goldStake' },
            { name: 'Seeing Double', from: 'blueStake', to: 'goldStake' }
        ]
    },
    {
        date: '2024-08-01',
        jokers: [
            { name: 'Stone Joker', from: 'blueStake', to: 'goldStake' },
            { name: 'Blackboard', from: 'purpleStake', to: 'goldStake' },
            { name: 'Sly Joker', from: 'noStake', to: 'goldStake' },
            { name: 'Marble Joker', from: 'greenStake', to: 'goldStake' },
            { name: 'Blue Joker', from: 'purpleStake', to: 'goldStake' }
        ]
    },
    {
        date: '2024-07-23',
        jokers: [
            { name: 'Sock and Buskin', from: 'redStake', to: 'goldStake' },
            { name: 'Dusk', from: 'redStake', to: 'goldStake' },
            { name: 'Wrathful Joker', from: 'purpleStake', to: 'goldStake' }
        ]
    }
];


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
    await loadStickerData();
    loadRecentGames();
    renderJokerGrid();
    renderRecentGames();
    updateStats();
});

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
                
                // Debug logging for Seance and nearby jokers
                if (jokerName === 'Seance' || jokerName === 'Riff-raff' || jokerName === 'Vampire' || jokerName === 'Shortcut') {
                    console.log(`Joker: ${jokerName}, Collection Order: ${collectionOrderValue}`);
                }
                
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
    
    filteredJokers = [...jokerData];
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
        console.log(`Soul card at ${i},${j} using background -${soul.bgCol * cardWidth}px -${soul.bgRow * cardHeight}px and icon -${soul.iconCol * cardWidth}px -${soul.iconRow * cardHeight}px`);
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
    
    const date = new Date(game.date);
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
    
    gameDiv.innerHTML = `
        <div class="gameRow">
            <div class="gameDate">${formattedDate}</div>
            <div class="gameJokers">
                ${jokersHTML}
            </div>
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
            <div class="jokerCard${jokerStringValue}" data-stake="${joker.stakeSticker}" onclick="showStakeEditor(${joker.id})" onmousemove="hoverCard(event)" onmouseout="noHoverCard(event)"></div>
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
    const joker = jokerData.find(j => j.id === jokerId);
    if (joker) {
        const editor = document.getElementById(`stakeEditor-${jokerId}`);
        const buttons = editor.querySelectorAll('.stickerBtn');

        // Remove selected class from all buttons
        buttons.forEach(btn => btn.classList.remove('selected'));
        
        // Update joker data and save immediately
        joker.stakeSticker = stakeType;
        saveStickerData();
        
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
    
    // Count jokers at or above each stake level
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
    if (confirm('Are you sure you want to reset all stickers?')) {
        jokerData.forEach(joker => {
            joker.stakeSticker = 'noStake';
        });
        saveStickerData();
        renderJokerGrid();
        updateStats();
    }
}

// Save sticker data to file
async function saveStickerData() {
    const data = {
        lastUpdated: new Date().toISOString(),
        jokers: jokerData.map(joker => ({
            id: joker.id,
            name: joker.name,
            stakeSticker: joker.stakeSticker
        }))
    };

    try {
        const response = await fetch('/save-stakes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data, null, 2)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        console.error('Error saving data:', error);
        // Fallback to localStorage if file save fails
        localStorage.setItem('balatroStakeData', JSON.stringify(data));
    }
}

// Load sticker data from file
async function loadStickerData() {
    try {
        console.log('Loading sticker data...');
        const response = await fetch('/data/stakes.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Loaded data:', data);
        
        if (data.jokers && Array.isArray(data.jokers)) {
            console.log(`Found ${data.jokers.length} saved jokers`);
            data.jokers.forEach(savedJoker => {
                const joker = jokerData.find(j => j.id === savedJoker.id);
                if (joker && savedJoker.stakeSticker) {
                    console.log(`Loading stake ${savedJoker.stakeSticker} for joker ${savedJoker.name} (ID: ${savedJoker.id})`);
                    joker.stakeSticker = savedJoker.stakeSticker;
                }
            });
        }
    } catch (error) {
        console.error('Error loading data from file:', error);
        // Fallback to localStorage if file load fails
        const saved = localStorage.getItem('balatroStakeData');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                data.jokers.forEach(savedJoker => {
                    const joker = jokerData.find(j => j.id === savedJoker.id);
                    if (joker && savedJoker.stakeSticker) {
                        joker.stakeSticker = savedJoker.stakeSticker;
                    }
                });
            } catch (error) {
                console.error('Error loading saved data:', error);
            }
        }
    }
}

// Import sticker data from JSON file
function importStickerData() {
    if (READ_ONLY_MODE) {
        alert('This feature is disabled in read-only mode.');
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
                                console.log(`Loading stake ${savedJoker.stakeSticker} for joker ${savedJoker.name} (ID: ${savedJoker.id})`);
                            }
                        });
                        
                        // Save to localStorage and update display
                        saveStickerData();
                        renderJokerGrid();
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
    if (READ_ONLY_MODE) {
        alert('This feature is disabled in read-only mode.');
        return;
    }
    
    const newGame = {
        date: date,
        jokers: jokers
    };
    
    recentGames.unshift(newGame); // Add to beginning of array
    
    // Keep only the last 10 games
    if (recentGames.length > 10) {
        recentGames = recentGames.slice(0, 10);
    }
    
    saveRecentGames();
    renderRecentGames();
}

// Save recent games to localStorage
function saveRecentGames() {
    try {
        localStorage.setItem('balatroRecentGames', JSON.stringify(recentGames));
        console.log('Recent games saved to localStorage');
    } catch (error) {
        console.error('Error saving recent games:', error);
    }
}

// Load recent games from localStorage
function loadRecentGames() {
    try {
        const saved = localStorage.getItem('balatroRecentGames');
        if (saved) {
            recentGames = JSON.parse(saved);
            console.log('Recent games loaded from localStorage');
        }
    } catch (error) {
        console.error('Error loading recent games:', error);
    }
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
    if (READ_ONLY_MODE) {
        alert('This feature is disabled in read-only mode.');
        return;
    }
    
    const date = prompt('Enter the date (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
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
        addRecentGame(date, jokers);
        alert(`Added game with ${jokers.length} joker progressions!`);
    } else {
        alert('No valid joker entries found. Please check the format.');
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