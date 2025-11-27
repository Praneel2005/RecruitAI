/**
 * Authentication Module with Supabase
 */

// Wait for page to load
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Auth module loaded');
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        console.log('📝 Login form found, attaching handler');
        loginForm.addEventListener('submit', handleLogin);
    }

    // Check for existing session on protected pages
    if (!window.location.pathname.includes('login.html')) {
        checkAuthSession();
    }
});

/**
 * Check for existing auth session
 */
async function checkAuthSession() {
    console.log('🔍 Checking auth session...');
    
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error('Session check error:', error);
            window.location.href = 'login.html';
            return;
        }

        if (!session) {
            console.log('❌ No active session, redirecting to login');
            window.location.href = 'login.html';
            return;
        }

        console.log('✅ Active session found:', session.user.email);
        
        // Update user profile in navbar
        updateUserProfile();
        
    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = 'login.html';
    }
}

/**
 * Handle login form submission with Supabase
 */
async function handleLogin(e) {
    e.preventDefault();
    console.log('🔐 Login attempt started');

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    console.log('📧 Email:', email);

    // Disable button and show loading
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';

    try {
        // Sign in with Supabase
        console.log('🚀 Attempting Supabase sign in...');
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            console.error('❌ Login error:', error);
            throw error;
        }

        console.log('✅ Login successful:', data.user.email);

        if (data.session) {
            // Get or create user profile
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', data.user.id)
                .single();

            if (profileError && profileError.code !== 'PGRST116') {
                console.error('Profile fetch error:', profileError);
            }

            // Store user data
            const userData = {
                id: data.user.id,
                email: data.user.email,
                name: profile?.full_name || data.user.email.split('@')[0],
                role: profile?.role || 'user'
            };

            localStorage.setItem('recruitai_loggedIn', 'true');
            localStorage.setItem('recruitai_user', JSON.stringify(userData));

            showNotification('Login successful! Redirecting...', 'success');

            console.log('🎉 Redirecting to dashboard...');

            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        }
    } catch (error) {
        console.error('❌ Login failed:', error);
        showNotification(error.message || 'Invalid credentials. Please try again.', 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

/**
 * Handle logout with Supabase
 */
async function logout() {
    try {
        console.log('👋 Logging out...');
        const { error } = await supabase.auth.signOut();
        
        if (error) throw error;

        localStorage.removeItem('recruitai_loggedIn');
        localStorage.removeItem('recruitai_user');
        
        showNotification('Logged out successfully', 'info');

        setTimeout(() => {
            window.location.href = 'login.html';
        }, 500);
    } catch (error) {
        console.error('Logout error:', error);
        showNotification('Error logging out', 'error');
    }
}

/**
 * Update user profile in navbar
 */
function updateUserProfile() {
    const userData = localStorage.getItem('recruitai_user');
    if (!userData) return;

    const user = JSON.parse(userData);
    const userProfile = document.getElementById('userProfile');
    
    if (userProfile) {
        const avatar = userProfile.querySelector('.user-avatar');
        const nameSpan = userProfile.querySelector('span');

        if (avatar) {
            const initials = user.name
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .substring(0, 2);
            avatar.textContent = initials;
        }

        if (nameSpan) {
            nameSpan.textContent = user.name;
        }
    }
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
    const notificationsContainer = document.getElementById('notifications');
    if (!notificationsContainer) {
        console.log(`Notification (${type}): ${message}`);
        return;
    }

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icon = type === 'success' ? 'check-circle' : 
                 type === 'error' ? 'exclamation-circle' : 
                 'info-circle';

    notification.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <div>
            <strong>${type.charAt(0).toUpperCase() + type.slice(1)}</strong>
            <p style="margin: 0; font-size: 13px;">${message}</p>
        </div>
    `;

    notificationsContainer.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}
