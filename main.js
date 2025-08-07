// Joker stake sticker tracking system
let jokerData = [];
let filteredJokers = [];
let searchTerm = '';
let sortBy = 'name';


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

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeJokerData();
    loadStickerData();
    renderJokerGrid();
    updateStats();
});

// Initialize joker data from the jokerTexts array
function initializeJokerData() {
    jokerData = [];
    let jokerIndex = 0;
    
    for (let i = 0; i < jokerTexts.length; i++) {
        for (let j = 0; j < jokerTexts[i].length; j++) {
            if (jokerTexts[i][j] && jokerTexts[i][j][0]) {
                const joker = {
                    id: jokerIndex++,
                    name: jokerTexts[i][j][0],
                    description: jokerTexts[i][j][1],
                    position: [i, j],
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
    let jmodifierString = 'url(assets/Jokers.png) 0px -855px, ';
    const cardWidth = 85;
    const cardHeight = 112;

    // Handle special cases
    switch(`${i},${j}`) {
        case '8,3': jmodifierString = `url(assets/Jokers.png) -${71*3}px -${95*9}px, `; break;
        case '8,4': jmodifierString = `url(assets/Jokers.png) -${71*4}px -${95*9}px, `; break;
        case '8,5': jmodifierString = `url(assets/Jokers.png) -${71*5}px -${95*9}px, `; break;
        case '8,6': jmodifierString = `url(assets/Jokers.png) -${71*6}px -${95*9}px, `; break;
        case '8,7': jmodifierString = `url(assets/Jokers.png) -${71*7}px -${95*9}px, `; break;
        case '12,4': jmodifierString = `url(assets/Jokers.png) -${71*2}px -${95*9}px, `; break;
    }
    
    return `" style="mask-position: -${71*j}px -${95*i}px; background: ${jmodifierString}url(assets/Jokers.png) -${71*j}px -${95*i}px"`;
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

// Create a joker element
function createJokerElement(joker) {
    const div = document.createElement('div');
    div.className = 'jokerItem';
    
    const [i, j] = joker.position;
    const jokerStringValue = jokerString(i, j, joker.stakeSticker);
    
    div.innerHTML = `
        <div class="tooltip">
            <div class="jokerCard${jokerStringValue}" data-stake="${joker.stakeSticker}" onclick="showStakeEditor(${joker.id})" onmousemove="hoverCard(event)" onmouseout="noHoverCard(event)"></div>
            <span class="tooltiptext hover-only">
                <div class="title">${joker.name}</div>
            </span>
            <span class="tooltiptext click-only">
                <div class="title">${joker.name}</div>
                <div class="current-stake">Current: ${getStakeDisplayName(joker.stakeSticker)}</div>
                <div class="desc">${joker.description}</div>
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
        joker.stakeSticker = stakeType;
        const editor = document.getElementById(`stakeEditor-${jokerId}`);
        const jokerCard = editor?.parentElement?.querySelector('.jokerCard');
        if (editor) {
            editor.style.display = 'none';
            jokerCard?.classList.remove('selected');
        }
        saveStickerData();
        renderJokerGrid();
        updateStats();
    }
}

// Filter jokers based on search term
function filterJokers() {
    searchTerm = document.getElementById('searchInput').value.toLowerCase();
    applyFilters();
}

// Sort jokers
function sortJokers() {
    sortBy = document.getElementById('sortSelect').value;
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

            case 'goldStake':
                return (b.stakeSticker === 'goldStake' ? 1 : 0) - (a.stakeSticker === 'goldStake' ? 1 : 0);
            case 'orangeStake':
                return (b.stakeSticker === 'orangeStake' ? 1 : 0) - (a.stakeSticker === 'orangeStake' ? 1 : 0);
            case 'purpleStake':
                return (b.stakeSticker === 'purpleStake' ? 1 : 0) - (a.stakeSticker === 'purpleStake' ? 1 : 0);
            case 'blackStake':
                return (b.stakeSticker === 'blackStake' ? 1 : 0) - (a.stakeSticker === 'blackStake' ? 1 : 0);
            case 'blueStake':
                return (b.stakeSticker === 'blueStake' ? 1 : 0) - (a.stakeSticker === 'blueStake' ? 1 : 0);
            case 'greenStake':
                return (b.stakeSticker === 'greenStake' ? 1 : 0) - (a.stakeSticker === 'greenStake' ? 1 : 0);
            case 'redStake':
                return (b.stakeSticker === 'redStake' ? 1 : 0) - (a.stakeSticker === 'redStake' ? 1 : 0);
            case 'whiteStake':
                return (b.stakeSticker === 'whiteStake' ? 1 : 0) - (a.stakeSticker === 'whiteStake' ? 1 : 0);
            case 'none':
                return (a.stakeSticker === 'noStake' ? 1 : 0) - (b.stakeSticker === 'noStake' ? 1 : 0);
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
    const noStakeCount = jokerData.filter(j => stakeLevels[j.stakeSticker] >= stakeLevels['noStake']).length;
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
    
    // Gold progress bar
    const goldPercentage = (goldProgress / maxGoldProgress) * 100;
    document.getElementById('goldProgress').style.width = `${goldPercentage}%`;
    document.getElementById('goldProgressText').textContent = `${goldProgress} / ${maxGoldProgress}`;
}

// Reset all stickers
function resetAllStickers() {
    if (confirm('Are you sure you want to reset all stake stickers? This cannot be undone.')) {
        jokerData.forEach(joker => {
            joker.stakeSticker = 'noStake';
        });
        saveStickerData();
        renderJokerGrid();
        updateStats();
    }
}

// Export data
function exportData() {
    const data = {
        jokers: jokerData.map(joker => ({
            id: joker.id,
            name: joker.name,
            stakeSticker: joker.stakeSticker
        })),
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `balatro-stakes-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Import data
function importData() {
    document.getElementById('importFile').click();
}

// Handle import file
function handleImportFile(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                if (data.jokers && Array.isArray(data.jokers)) {
                    // Update joker data with imported stickers
                    data.jokers.forEach(importedJoker => {
                        const joker = jokerData.find(j => j.id === importedJoker.id);
                        if (joker && importedJoker.stakeSticker) {
                            joker.stakeSticker = importedJoker.stakeSticker;
                        }
                    });
                    saveStickerData();
                    renderJokerGrid();
                    updateStats();
                    alert('Data imported successfully!');
                } else {
                    alert('Invalid file format. Please select a valid export file.');
                }
            } catch (error) {
                alert('Error reading file. Please make sure it\'s a valid JSON file.');
            }
        };
        reader.readAsText(file);
    }
    // Reset file input
    event.target.value = '';
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
        const response = await fetch('/data/stakes.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.jokers && Array.isArray(data.jokers)) {
            data.jokers.forEach(savedJoker => {
                const joker = jokerData.find(j => j.id === savedJoker.id);
                if (joker && savedJoker.stakeSticker) {
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
    const editor = document.getElementById(`stakeEditor-${jokerId}`);
    const jokerCard = editor?.parentElement?.querySelector('.jokerCard');
    
    // If this joker is already selected, deselect it
    if (jokerCard?.classList.contains('selected')) {
        editor.style.display = 'none';
        jokerCard.classList.remove('selected');
        return;
    }
    
    // Close any open editors and remove selected states first
    document.querySelectorAll('.stakeEditor').forEach(editor => {
        editor.style.display = 'none';
    });
    document.querySelectorAll('.jokerCard').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Show the editor for this joker and add selected state
    if (editor && jokerCard) {
        editor.style.display = 'block';
        jokerCard.classList.add('selected');
    }
}

// Close stake editor for a joker
function closeStakeEditor(jokerId) {
    const editor = document.getElementById(`stakeEditor-${jokerId}`);
    const jokerCard = editor?.parentElement?.querySelector('.jokerCard');
    if (editor) {
        editor.style.display = 'none';
        jokerCard?.classList.remove('selected');
    }
}


