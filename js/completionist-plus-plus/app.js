// Completionist++ page initialization

import { initializeJokerData } from './joker-data.js';
import { loadAllUsers, renderBoardList, showDummyBoard } from './board-management.js';
import { initializeNaneinfPage } from '../../naneinf/naneinf-tracker.js';

// Initialize Completionist++ page
export async function initializeCompletionistPlusPlus() {
    // Initialize joker data
    initializeJokerData();
    
    // Show loading state immediately
    renderBoardList();
    
    // Load users in background
    await loadAllUsers();
    renderBoardList();
    
    // Auto-load Ben Beau's board if it exists, otherwise show dummy board
    // For now, just show dummy board
    showDummyBoard();
    
    // Set up click outside handler to close editors
    setupClickOutsideHandler();
}

// Set up click outside handler to close editors
function setupClickOutsideHandler() {
    document.addEventListener('click', function(event) {
        const target = event.target;
        const isJokerCard = target.classList.contains('jokerCard');
        const isStickerBtn = target.classList.contains('stickerBtn');
        const isStakeEditor = target.closest('.stakeEditor');
        
        if (!isJokerCard && !isStickerBtn && !isStakeEditor) {
            // Hide all stake editors
            const allEditors = document.querySelectorAll('.stakeEditor');
            allEditors.forEach(editor => {
                const editorId = editor.id.split('-')[1];
                import('./ui-renderer.js').then(module => {
                    module.hideStakeEditor(parseInt(editorId));
                });
            });
        }
    });
}
