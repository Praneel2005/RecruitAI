/**
 * Dashboard Module with Supabase
 */
let dashboardData = null;

console.log('📊 Dashboard.js loaded');

/**
 * Initialize dashboard
 */
async function initDashboard() {
    console.log('🚀 initDashboard called');
    
    try {
        // Check authentication
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            console.log('❌ No session, redirecting to login');
            window.location.href = 'login.html';
            return;
        }

        console.log('✅ Session found, loading data...');
        await loadDashboardData();
        renderDashboard();
        
    } catch (error) {
        console.error('❌ Dashboard initialization error:', error);
        showNotification('Failed to load dashboard data', 'error');
    }
}

/**
 * Load dashboard data from Supabase
 */
async function loadDashboardData() {
    try {
        console.log('📥 Loading dashboard data...');
        
        // Get jobs count
        const { data: jobs, count: jobsCount, error: jobsError } = await supabase
            .from('jobs')
            .select('*', { count: 'exact' })
            .eq('status', 'active');

        if (jobsError) throw jobsError;
        console.log('✅ Jobs loaded:', jobsCount);

        // Get candidates count
        const { data: candidates, count: candidatesCount, error: candidatesError } = await supabase
            .from('candidates')
            .select('*', { count: 'exact' });

        if (candidatesError) throw candidatesError;
        console.log('✅ Candidates loaded:', candidatesCount);

        // Get verified candidates count
        const { count: verifiedCount, error: verifiedError } = await supabase
            .from('candidates')
            .select('*', { count: 'exact', head: true })
            .eq('cert_verified', true);

        if (verifiedError) throw verifiedError;
        console.log('✅ Verified candidates:', verifiedCount);

        // Get top candidates
        const { data: topCandidates, error: topError } = await supabase
            .from('candidates')
            .select('*')
            .order('score', { ascending: false })
            .limit(3);

        if (topError) throw topError;
        console.log('✅ Top candidates:', topCandidates?.length);

        // Calculate stats
        const verificationRate = candidatesCount > 0 
            ? Math.round((verifiedCount / candidatesCount) * 100) 
            : 0;

        // Calculate average match score
        const avgMatchScore = candidates && candidates.length > 0
            ? Math.round(candidates.reduce((sum, c) => sum + (c.score || 0), 0) / candidates.length)
            : 0;

        dashboardData = {
            stats: {
                activeJobs: jobsCount || 0,
                totalCandidates: candidatesCount || 0,
                verifiedCandidates: verifiedCount || 0,
                verificationRate: verificationRate,
                avgMatchScore: avgMatchScore,
                recentCandidates: Math.min(candidatesCount || 0, 5)
            },
            topCandidates: topCandidates || [],
            recentActivity: [
                {
                    icon: 'success',
                    title: 'Dashboard loaded',
                    description: 'Real-time data from Supabase',
                    time: 'Just now'
                }
            ],
            trendData: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                values: [85, 88, 82, 90, 87, 92, 89]
            }
        };

        console.log('✅ Dashboard data prepared:', dashboardData);
        return dashboardData;
        
    } catch (error) {
        console.error('❌ Failed to load dashboard data:', error);
        throw error;
    }
}

/**
 * Render dashboard with data
 */
function renderDashboard() {
    if (!dashboardData) {
        console.error('❌ No dashboard data to render');
        return;
    }

    console.log('🎨 Rendering dashboard...');

    const stats = dashboardData.stats;
    
    // Update stats
    updateElement('activeJobs', stats.activeJobs);
    updateElement('totalCandidates', stats.totalCandidates);
    updateElement('verifiedCount', stats.verifiedCandidates);
    updateElement('verifiedRate', `${stats.verificationRate}% success rate`);
    updateElement('candidatesChange', `+${stats.recentCandidates} from last week`);

    // Update average match score if element exists
    const avgScoreElement = document.querySelector('.stat-card:nth-child(4) .stat-value');
    if (avgScoreElement) {
        avgScoreElement.textContent = `${stats.avgMatchScore}%`;
    }

    // Render top candidates
    renderTopCandidates(dashboardData.topCandidates);
    
    // Render recent activity
    renderRecentActivity(dashboardData.recentActivity);
    
    // Render trend chart
    renderTrendChart(dashboardData.trendData);
    
    console.log('✅ Dashboard rendered successfully!');
}

function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
        console.log(`✅ Updated ${id}:`, value);
    } else {
        console.warn(`⚠️ Element not found: ${id}`);
    }
}

function renderTopCandidates(candidates) {
    const container = document.getElementById('topCandidatesList');
    if (!container) {
        console.warn('⚠️ topCandidatesList container not found');
        return;
    }

    if (candidates.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No candidates yet</p></div>';
        return;
    }

    container.innerHTML = candidates.map(candidate => `
        <div class="candidate-item">
            <div class="candidate-avatar">${candidate.avatar || getInitials(candidate.name)}</div>
            <div class="candidate-info">
                <div class="candidate-name">${candidate.name}</div>
                <div class="candidate-education">${candidate.education || 'N/A'}</div>
            </div>
            <div class="candidate-score">
                <div class="score-value">${candidate.score || 0}%</div>
                <div class="score-label">Match</div>
            </div>
        </div>
    `).join('');
    
    console.log('✅ Top candidates rendered:', candidates.length);
}

function renderRecentActivity(activities) {
    const container = document.getElementById('recentActivityLog');
    if (!container) {
        console.warn('⚠️ recentActivityLog container not found');
        return;
    }

    if (activities.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No recent activity</p></div>';
        return;
    }

    container.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon ${activity.icon}">
                <i class="fas fa-${activity.icon === 'success' ? 'check' : 'info'}"></i>
            </div>
            <div class="activity-content">
                <h4>${activity.title}</h4>
                <p>${activity.description}</p>
            </div>
            <div class="activity-time">${activity.time}</div>
        </div>
    `).join('');
    
    console.log('✅ Activity log rendered:', activities.length);
}

function renderTrendChart(trendData) {
    const container = document.getElementById('trendsChart');
    if (!container || !trendData) {
        console.warn('⚠️ trendsChart container not found');
        return;
    }

    const maxValue = Math.max(...trendData.values);
    
    container.innerHTML = `
        <div class="chart-container">
            <div class="chart-bars">
                ${trendData.values.map((value, index) => `
                    <div class="chart-bar" style="height: ${(value / maxValue) * 100}%">
                        <span class="chart-bar-label">${trendData.labels[index]}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    console.log('✅ Trend chart rendered');
}

function getInitials(name) {
    if (!name) return '??';
    return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
}

// Make function globally available
window.initDashboard = initDashboard;

console.log('✅ Dashboard.js fully loaded, initDashboard available globally');
