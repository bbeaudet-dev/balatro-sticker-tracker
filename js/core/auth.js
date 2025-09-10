// Authentication logic for completionist tracking

import { getCurrentUser, getAllUsers } from '../completionist/board-management.js';

// Authentication state
let canEdit = false; // Simplified: just track if editing is enabled
let currentPassword = null; // Store password for current session

// Get authentication state
export function getCanEdit() {
    return canEdit;
}

// Set authentication state
export function setCanEdit(editState) {
    canEdit = editState;
}

// Get current password
export function getCurrentPassword() {
    return currentPassword;
}

// Set current password
export function setCurrentPassword(password) {
    currentPassword = password;
}

// Show login dialog
export function showLoginDialog() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        alert('Please select a board first');
        return;
    }
    
    const allUsers = getAllUsers();
    const password = prompt(`Enter password for ${allUsers[currentUser].displayName}'s board:`);
    if (!password) return;
    
    authenticateUser(currentUser, password);
}

// Authenticate user
export async function authenticateUser(username, password) {
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
export function logout() {
    canEdit = false;
    currentPassword = null; // Clear password on logout
    document.getElementById('loginStatus').textContent = 'Edits disabled';
    updateUIForAuth();
}

// Update UI based on authentication
export function updateUIForAuth() {
    const resetBtn = document.getElementById('resetBtn');
    const exportBtn = document.getElementById('exportBtn');
    const importBtn = document.getElementById('importBtn');
    const gameModeBtn = document.getElementById('gameModeBtn');
    const updateGameBtn = document.getElementById('updateGameBtn');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (canEdit && getCurrentUser()) {
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
    import('../completionist/game-tracking.js').then(module => {
        module.renderRecentGames();
    });
}

// Reset all stickers
export function resetAllStickers() {
    if (!canEdit) {
        showLoginDialog();
        return;
    }
    
    if (confirm('Are you sure you want to reset all stickers?')) {
        import('../completionist/joker-data.js').then(module => {
            module.resetAllStickers();
        });
        
        import('../core/api.js').then(apiModule => {
            apiModule.saveUserData();
        });
        
        import('../completionist/ui-renderer.js').then(uiModule => {
            uiModule.renderJokerGrid();
            uiModule.updateStats();
        });
    }
}

// Make functions globally available for onclick handlers
window.showLoginDialog = showLoginDialog;
window.logout = logout;
window.resetAllStickers = resetAllStickers;
