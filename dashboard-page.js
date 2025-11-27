/**
 * Dashboard Page Script
 */
document.addEventListener('DOMContentLoaded', async function() {
    console.log('📄 Dashboard page script loaded');
    
    // Check authentication
    const isLoggedIn = localStorage.getItem('recruitai_loggedIn') === 'true';
    if (!isLoggedIn) {
        window.location.href = 'login.html';
        return;
    }

    // Update user profile in navbar
    if (typeof updateUserProfile === 'function') {
        updateUserProfile();
    }

    // Wait a bit for dashboard.js to load
    setTimeout(async () => {
        console.log('🚀 Calling initDashboard...');
        
        if (typeof initDashboard === 'function') {
            await initDashboard();
        } else {
            console.error('❌ initDashboard function not found!');
        }
    }, 500);

    // Setup refresh button
    const refreshBtn = document.getElementById('refreshDashboard');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async function() {
            console.log('🔄 Refresh clicked');
            await initDashboard();
            showNotification('Dashboard refreshed successfully', 'success');
        });
    }

    // User profile logout
    const userProfile = document.getElementById('userProfile');
    if (userProfile) {
        userProfile.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Do you want to logout?')) {
                logout();
            }
        });
    }
});
