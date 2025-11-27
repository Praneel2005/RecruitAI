/**
 * Login Page Script
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Login page loaded');
    
    // Hide loading screen
    setTimeout(() => {
        const loader = document.getElementById('loading-screen');
        if (loader) {
            loader.classList.add('hidden');
            console.log('⏳ Loading screen hidden');
        }
    }, 500);

    // Check if already logged in
    checkIfLoggedIn();
});

async function checkIfLoggedIn() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
            console.log('✅ Already logged in, redirecting to dashboard');
            window.location.href = 'dashboard.html';
        } else {
            console.log('👤 Not logged in, showing login form');
        }
    } catch (error) {
        console.error('Error checking login status:', error);
    }
}
