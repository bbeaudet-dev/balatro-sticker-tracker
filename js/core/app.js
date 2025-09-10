// Main application initialization

import { switchTab } from './navigation.js';

// Initialize the application
export async function initializeApp() {
    // Load the default page (completionist++)
    await switchTab('completionist-plus-plus');
}
