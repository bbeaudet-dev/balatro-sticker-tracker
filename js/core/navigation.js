// Navigation and tab switching functionality

// Tab switching functionality
export function switchTab(tabId) {
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
        // Import and call naneinf functions
        import('../naneinf/naneinf-tracker.js').then(module => {
            module.renderNaneinfGames();
            module.updateNaneinfProgress();
        });
    }
}
