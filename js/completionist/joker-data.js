// Joker data management for completionist tracking

import { COLLECTION_ORDER } from '../shared/constants.js';
import { processDescription, jokerString } from '../shared/utils.js';

// Joker data state
let jokerData = [];
let filteredJokers = [];
let searchTerm = '';
let sortBy = 'collection';

// Initialize joker data from the jokerTexts array
export function initializeJokerData() {
    jokerData = [];
    let jokerIndex = 0;
    
    for (let i = 0; i < jokerTexts.length; i++) {
        for (let j = 0; j < jokerTexts[i].length; j++) {
            if (jokerTexts[i][j] && jokerTexts[i][j][0]) {
                const jokerName = jokerTexts[i][j][0];
                const collectionOrderValue = COLLECTION_ORDER[jokerName] || 999;
                
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

// Get joker data
export function getJokerData() {
    return jokerData;
}

// Get filtered jokers
export function getFilteredJokers() {
    return filteredJokers;
}

// Set joker data (for loading from server)
export function setJokerData(data) {
    jokerData = data;
}

// Filter jokers based on search term
export function filterJokers() {
    searchTerm = document.getElementById('searchInput').value.toLowerCase();
    applyFilters();
}

// Sort jokers
export function sortJokers() {
    sortBy = document.querySelector('input[name="sort"]:checked').value;
    applyFilters();
}

// Apply filters and sorting
export function applyFilters() {
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
}

// Get joker position by name
export function getJokerPositionByName(jokerName) {
    const joker = jokerData.find(j => j.name === jokerName);
    return joker ? joker.position : null;
}

// Reset all stickers
export function resetAllStickers() {
    jokerData.forEach(joker => {
        joker.stakeSticker = 'noStake';
    });
}

// Set stake sticker for a joker
export function setStakeSticker(jokerId, stakeType) {
    const joker = jokerData.find(j => j.id === jokerId);
    if (joker) {
        joker.stakeSticker = stakeType;
    }
}

// Get joker by ID
export function getJokerById(jokerId) {
    return jokerData.find(j => j.id === jokerId);
}

// Get joker by name
export function getJokerByName(jokerName) {
    return jokerData.find(j => j.name === jokerName);
}

// Update joker stakes from game data
export function updateJokerStakesFromGame(jokers) {
    jokers.forEach(jokerProgression => {
        const joker = jokerData.find(j => j.name === jokerProgression.name);
        if (joker) {
            joker.stakeSticker = jokerProgression.to;
        }
    });
}

// Export joker data for saving
export function exportJokerData() {
    return jokerData.map(joker => ({
        id: joker.id,
        name: joker.name,
        stakeSticker: joker.stakeSticker
    }));
}

// Import joker data
export function importJokerData(importedJokers) {
    // Clear current data
    jokerData.forEach(joker => {
        joker.stakeSticker = 'noStake';
    });
    
    // Load imported data
    importedJokers.forEach(savedJoker => {
        const joker = jokerData.find(j => j.id === savedJoker.id);
        if (joker && savedJoker.stakeSticker) {
            joker.stakeSticker = savedJoker.stakeSticker;
        }
    });
}
