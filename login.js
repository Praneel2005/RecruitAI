/**
 * Login Page Script - No Auto Redirect
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Login page loaded');
    
    // Hide loading screen
    const loader = document.getElementById('loading-screen');
    if (loader) {
        setTimeout(() => {
            loader.classList.add('hidden');
        }, 300);
    }

    console.log('✅ Login page ready - no auto-redirect');
});
