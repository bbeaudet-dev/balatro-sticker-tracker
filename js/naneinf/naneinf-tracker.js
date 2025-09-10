// naneinf progress tracking functionality

import { NANEINF_TARGET, NANEINF_CURRENT } from '../shared/constants.js';
import { formatDate } from '../shared/utils.js';

// naneinf tracking
let naneinfGames = [];

// Initialize naneinf page
export function initializeNaneinfPage() {
    // Add sample naneinf games
    naneinfGames = [
        {
            id: 1,
            date: '2025-09-09',
            score: 3.984e115,
            media: [],
            notes: 'Best run so far, got 7 joker slots and 6 of the 7 jokers. Ended up finding a Perkeo and racked up 50+ Pluto cards, but ended up never finding the Observatory.'
        },
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

export function updateNaneinfProgress() {
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

export function renderNaneinfGames() {
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
    
    const formattedDate = formatDate(game.date);
    
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
    
    const formattedDate = formatDate(game.date);
    
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

// Make functions globally available for onclick handlers
window.showAddNaneinfGameDialog = showAddNaneinfGameDialog;
window.editNaneinfGame = editNaneinfGame;
window.deleteNaneinfGame = deleteNaneinfGame;
window.uploadNaneinfMedia = uploadNaneinfMedia;
window.removeNaneinfMedia = removeNaneinfMedia;
