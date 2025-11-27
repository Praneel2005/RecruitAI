/**
 * Supabase Configuration for RecruitAI
 */

// Your Supabase project details
const SUPABASE_URL = 'https://ikgkjqljzllvmkgdyijm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrZ2tqcWxqemxsdm1rZ2R5aWptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNjEwNzMsImV4cCI6MjA3OTgzNzA3M30.a8Hg6ZDF_1sReYF6i_xlblwGv9C3JjxbMQxUXqs4P5A';

// Initialize Supabase client immediately
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('✅ Supabase client initialized');

// Configuration object
const API_CONFIG = {
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    MOCK_MODE: false,
};

/**
 * Helper Functions
 */

// Get current authenticated user
async function getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
        console.error('Error getting user:', error);
        return null;
    }
    return user;
}

// Get current session
async function getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
        console.error('Error getting session:', error);
        return null;
    }
    return session;
}

// Check if user is authenticated
async function isAuthenticated() {
    const session = await getSession();
    return !!session;
}
