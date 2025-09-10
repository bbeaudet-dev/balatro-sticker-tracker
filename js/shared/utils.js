// Shared utility functions

import { COLOR_CODES } from './constants.js';

// Process description template literals
export function processDescription(description, jokerValue = 0) {
    let processed = description;
    
    // Replace money values
    processed = processed.replace(/\${moneyc}/g, `<span class="money">`);
    
    // Replace color codes with spans
    for (const [code, span] of Object.entries(COLOR_CODES)) {
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

// Get display name for stake type
export function getStakeDisplayName(stakeType) {
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

// Format date for display
export function formatDate(dateString) {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

// Generate joker string for display with stake sticker
export function jokerString(i, j, stakeType = 'noStake') {
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

// Create a reusable joker card component
export function createJokerCardComponent(jokerName, stakeType = 'noStake', size = 'normal', jokerData = []) {
    const joker = jokerData.find(j => j.name === jokerName);
    if (!joker) {
        return `<span class="jokerName">${jokerName}</span>`; // Fallback to text if joker not found
    }
    
    const [i, j] = joker.position;
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
        cardHTML += ` onclick="showStakeEditor(${joker.id})" onmousemove="hoverCard(event)" onmouseout="noHoverCard(event)"`;
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
