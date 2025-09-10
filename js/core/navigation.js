// Navigation and tab switching functionality

// Tab switching functionality
export async function switchTab(tabId, clickedTab = null) {
    // Remove active class from all tabs
    const tabs = document.querySelectorAll('.navTab');
    tabs.forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Add active class to clicked tab (if provided) or find the right tab
    if (clickedTab) {
        clickedTab.classList.add('active');
    } else {
        // Find the tab by onclick attribute
        const targetTab = document.querySelector(`[onclick*="switchTab('${tabId}')"]`);
        if (targetTab) {
            targetTab.classList.add('active');
        }
    }
    
    // Load the appropriate page content
    await loadPageContent(tabId);
}

// Make switchTab globally available with proper event handling
window.switchTab = function(tabId, clickedTab) {
    return switchTab(tabId, clickedTab);
};

// Load page content dynamically
async function loadPageContent(tabId) {
    const tabContent = document.getElementById('tabContent');
    
    try {
        let pageContent;
        
        switch (tabId) {
            case 'completionist-plus-plus':
                const response1 = await fetch('./js/completionist-plus-plus/page.html');
                pageContent = await response1.text();
                // Initialize completionist++ functionality
                const cppModule = await import('../completionist-plus-plus/app.js');
                await cppModule.initializeCompletionistPlusPlus();
                break;
                
            case 'completionist-plus':
                const response2 = await fetch('./js/completionist-plus/page.html');
                pageContent = await response2.text();
                // Initialize completionist+ functionality
                const cpModule = await import('../completionist-plus/app.js');
                await cpModule.initializeCompletionistPlus();
                break;
                
            case 'naneinf':
                const response3 = await fetch('./js/naneinf/page.html');
                pageContent = await response3.text();
                // Initialize naneinf functionality
                const naneinfModule = await import('../naneinf/naneinf-tracker.js');
                naneinfModule.renderNaneinfGames();
                naneinfModule.updateNaneinfProgress();
                break;
                
            default:
                console.error('Unknown tab:', tabId);
                return;
        }
        
        tabContent.innerHTML = pageContent;
        
    } catch (error) {
        console.error('Error loading page content:', error);
        tabContent.innerHTML = '<div class="error">Error loading page content</div>';
    }
}
