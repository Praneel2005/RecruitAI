/**
 * Login Page Script
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Login page loaded - NO AUTO REDIRECT');
    
    // Hide loading screen immediately
    const loader = document.getElementById('loading-screen');
    if (loader) {
        setTimeout(() => {
            loader.classList.add('hidden');
        }, 300);
    }

    // DON'T check if already logged in - let user stay on login page
    console.log('👤 Login page ready');
});
