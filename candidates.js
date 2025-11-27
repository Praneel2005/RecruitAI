/**
 * Candidates Page with Full CRUD Operations
 */
let allCandidates = [];

document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication
    const session = await getSession();
    if (!session) {
        window.location.href = 'login.html';
        return;
    }

    // Initialize page
    await loadCandidates();
    setupSearchFilter();
    setupAddCandidateButton();
    setupUserProfile();
});

// Load candidates from Supabase
async function loadCandidates() {
    try {
        const { data, error } = await supabase
            .from('candidates')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        allCandidates = data || [];
        renderCandidates(allCandidates);
    } catch (error) {
        console.error('Error loading candidates:', error);
        showNotification('Failed to load candidates', 'error');
    }
}

// Render candidates
function renderCandidates(candidates) {
    const candidatesGrid = document.getElementById('candidatesGrid');
    if (!candidatesGrid) return;

    if (candidates.length === 0) {
        candidatesGrid.innerHTML = '<div class="empty-state"><p>No candidates found. Upload resumes to add candidates.</p></div>';
        return;
    }

    candidatesGrid.innerHTML = candidates.map(candidate => `
        <div class="candidate-card">
            <div class="candidate-header">
                <div class="candidate-avatar-large">${candidate.avatar || getInitials(candidate.name)}</div>
                <div class="candidate-title">
                    <h3>${candidate.name}</h3>
                    <p>${candidate.location || 'Location not specified'}</p>
                    <span class="match-badge">
                        <i class="fas fa-star"></i> ${candidate.score || 0}% Match
                    </span>
                </div>
            </div>

            <div class="candidate-details">
                <div class="detail-row">
                    <span class="detail-label">Email</span>
                    <span class="detail-value">${candidate.email}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Phone</span>
                    <span class="detail-value">${candidate.phone || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Experience</span>
                    <span class="detail-value">${candidate.experience || 0} years</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Education</span>
                    <span class="detail-value">${candidate.education ? candidate.education.split(' - ')[0] : 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Certificate</span>
                    <span class="detail-value">
                        ${candidate.cert_verified ? 
                            '<span class="verified-badge"><i class="fas fa-check-circle"></i> Verified</span>' : 
                            'Pending'}
                    </span>
                </div>
            </div>

            <div class="candidate-skills">
                ${(candidate.skills || []).slice(0, 6).map(skill => `
                    <span class="skill-tag">${skill}</span>
                `).join('')}
                ${(candidate.skills || []).length > 6 ? '<span class="skill-tag">+' + ((candidate.skills || []).length - 6) + '</span>' : ''}
            </div>

            <div class="candidate-actions">
                <button class="btn btn-outline btn-sm" onclick="showCandidateProfile(${candidate.id})">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="btn btn-secondary btn-sm" onclick="editCandidate(${candidate.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-primary btn-sm" onclick="contactCandidate(${candidate.id})">
                    <i class="fas fa-envelope"></i> Contact
                </button>
            </div>
        </div>
    `).join('');
}

// Show candidate profile modal
function showCandidateProfile(candidateId) {
    const candidate = allCandidates.find(c => c.id === candidateId);
    if (!candidate) return;

    const modal = document.getElementById('candidateModal');
    const modalTitle = document.getElementById('modalCandidateTitle');
    const modalBody = document.getElementById('modalCandidateBody');

    modalTitle.textContent = candidate.name;
    modalBody.innerHTML = `
        <div class="candidate-preview">
            <div class="candidate-avatar-large">${candidate.avatar || getInitials(candidate.name)}</div>
            <div>
                <h3>${candidate.name}</h3>
                <p style="color: var(--primary); margin-bottom: 8px;">
                    <i class="fas fa-envelope"></i> ${candidate.email}
                </p>
                <p style="color: var(--gray-600); font-size: 14px;">
                    <i class="fas fa-map-marker-alt"></i> ${candidate.location || 'N/A'}
                </p>
                <span class="match-badge" style="margin-top: 12px;">
                    <i class="fas fa-star"></i> ${candidate.score || 0}% Match
                </span>
            </div>
        </div>

        <div class="detail-group">
            <h5><i class="fas fa-phone"></i> Contact</h5>
            <p>${candidate.phone || 'Not provided'}</p>
            <p>${candidate.email}</p>
        </div>

        <div class="detail-group">
            <h5><i class="fas fa-briefcase"></i> Experience</h5>
            <p>${candidate.experience || 0} years</p>
        </div>

        <div class="detail-group">
            <h5><i class="fas fa-graduation-cap"></i> Education</h5>
            <p>${candidate.education || 'Not provided'}</p>
        </div>

        <div class="detail-group">
            <h5><i class="fas fa-check-circle"></i> Certificate Status</h5>
            <p>${candidate.cert_verified ? 
                '<span class="verified-badge"><i class="fas fa-check-circle"></i> Verified</span>' : 
                'Pending Verification'}</p>
        </div>

        <div class="detail-group">
            <h5><i class="fas fa-tools"></i> Skills</h5>
            <div class="skills-list">
                ${(candidate.skills || []).map(skill => `
                    <span class="skill-tag">${skill}</span>
                `).join('')}
            </div>
        </div>

        <div class="detail-group">
            <h5><i class="fas fa-calendar"></i> Applied Date</h5>
            <p>${new Date(candidate.applied_date).toLocaleDateString()}</p>
        </div>

        ${candidate.resume_url ? `
        <div class="detail-group">
            <h5><i class="fas fa-file-pdf"></i> Resume</h5>
            <a href="${candidate.resume_url}" target="_blank" class="btn btn-outline btn-sm">
                <i class="fas fa-download"></i> Download Resume
            </a>
        </div>
        ` : ''}

        <div class="form-actions">
            <button class="btn btn-outline" onclick="closeCandidateModal()">Close</button>
            <button class="btn btn-secondary" onclick="editCandidate(${candidate.id})">
                <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn btn-primary" style="background: var(--error);" onclick="deleteCandidate(${candidate.id})">
                <i class="fas fa-trash"></i> Delete
            </button>
        </div>
    `;

    modal.classList.add('active');
}

// Close candidate modal
function closeCandidateModal() {
    const modal = document.getElementById('candidateModal');
    modal.classList.remove('active');
}

// Setup add candidate button
function setupAddCandidateButton() {
    // Add button to page header if not exists
    const pageHeader = document.querySelector('.page-header');
    if (pageHeader && !document.getElementById('addCandidateBtn')) {
        const addBtn = document.createElement('button');
        addBtn.id = 'addCandidateBtn';
        addBtn.className = 'btn btn-primary';
        addBtn.innerHTML = '<i class="fas fa-plus"></i> Add Candidate';
        addBtn.onclick = showAddCandidateModal;
        pageHeader.appendChild(addBtn);
    }
}

// Show add candidate modal
function showAddCandidateModal() {
    const modal = document.getElementById('candidateModal');
    const modalTitle = document.getElementById('modalCandidateTitle');
    const modalBody = document.getElementById('modalCandidateBody');

    modalTitle.textContent = 'Add New Candidate';
    modalBody.innerHTML = `
        <form id="addCandidateForm" onsubmit="handleAddCandidate(event)">
            <div class="form-group">
                <label>Full Name *</label>
                <input type="text" class="form-control" id="candidateName" required placeholder="e.g. John Doe">
            </div>

            <div class="form-group">
                <label>Email *</label>
                <input type="email" class="form-control" id="candidateEmail" required placeholder="john.doe@email.com">
            </div>

            <div class="form-group">
                <label>Phone</label>
                <input type="tel" class="form-control" id="candidatePhone" placeholder="+1 (555) 123-4567">
            </div>

            <div class="form-group">
                <label>Location</label>
                <input type="text" class="form-control" id="candidateLocation" placeholder="e.g. San Francisco, CA">
            </div>

            <div class="form-group">
                <label>Experience (years)</label>
                <input type="number" class="form-control" id="candidateExperience" min="0" max="50" placeholder="5">
            </div>

            <div class="form-group">
                <label>Education</label>
                <input type="text" class="form-control" id="candidateEducation" placeholder="e.g. BS Computer Science - MIT">
            </div>

            <div class="form-group">
                <label>Skills (comma-separated)</label>
                <input type="text" class="form-control" id="candidateSkills" placeholder="e.g. React, Node.js, Python">
            </div>

            <div class="form-group">
                <label>Match Score (0-100)</label>
                <input type="number" class="form-control" id="candidateScore" min="0" max="100" value="75">
            </div>

            <div class="form-actions">
                <button type="button" class="btn btn-outline" onclick="closeCandidateModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">
                    <i class="fas fa-plus"></i> Add Candidate
                </button>
            </div>
        </form>
    `;

    modal.classList.add('active');
}

// Handle add candidate
async function handleAddCandidate(event) {
    event.preventDefault();

    const name = document.getElementById('candidateName').value;
    const candidateData = {
        name: name,
        email: document.getElementById('candidateEmail').value,
        phone: document.getElementById('candidatePhone').value || null,
        location: document.getElementById('candidateLocation').value || null,
        experience: parseInt(document.getElementById('candidateExperience').value) || 0,
        education: document.getElementById('candidateEducation').value || null,
        skills: document.getElementById('candidateSkills').value.split(',').map(s => s.trim()).filter(s => s),
        score: parseInt(document.getElementById('candidateScore').value) || 75,
        avatar: getInitials(name),
        cert_verified: false,
        matched_jobs: [],
        applied_date: new Date().toISOString().split('T')[0]
    };

    try {
        const { data, error } = await supabase
            .from('candidates')
            .insert([candidateData])
            .select();

        if (error) throw error;

        showNotification('Candidate added successfully!', 'success');
        closeCandidateModal();
        await loadCandidates();
    } catch (error) {
        console.error('Error adding candidate:', error);
        showNotification(error.message || 'Failed to add candidate', 'error');
    }
}

// Edit candidate
function editCandidate(candidateId) {
    const candidate = allCandidates.find(c => c.id === candidateId);
    if (!candidate) return;

    const modal = document.getElementById('candidateModal');
    const modalTitle = document.getElementById('modalCandidateTitle');
    const modalBody = document.getElementById('modalCandidateBody');

    modalTitle.textContent = 'Edit Candidate';
    modalBody.innerHTML = `
        <form id="editCandidateForm" onsubmit="handleEditCandidate(event, ${candidateId})">
            <div class="form-group">
                <label>Full Name *</label>
                <input type="text" class="form-control" id="editCandidateName" required value="${candidate.name}">
            </div>

            <div class="form-group">
                <label>Email *</label>
                <input type="email" class="form-control" id="editCandidateEmail" required value="${candidate.email}">
            </div>

            <div class="form-group">
                <label>Phone</label>
                <input type="tel" class="form-control" id="editCandidatePhone" value="${candidate.phone || ''}">
            </div>

            <div class="form-group">
                <label>Location</label>
                <input type="text" class="form-control" id="editCandidateLocation" value="${candidate.location || ''}">
            </div>

            <div class="form-group">
                <label>Experience (years)</label>
                <input type="number" class="form-control" id="editCandidateExperience" min="0" max="50" value="${candidate.experience || 0}">
            </div>

            <div class="form-group">
                <label>Education</label>
                <input type="text" class="form-control" id="editCandidateEducation" value="${candidate.education || ''}">
            </div>

            <div class="form-group">
                <label>Skills (comma-separated)</label>
                <input type="text" class="form-control" id="editCandidateSkills" value="${(candidate.skills || []).join(', ')}">
            </div>

            <div class="form-group">
                <label>Match Score (0-100)</label>
                <input type="number" class="form-control" id="editCandidateScore" min="0" max="100" value="${candidate.score || 75}">
            </div>

            <div class="form-group">
                <label>Certificate Verified</label>
                <select class="form-control" id="editCandidateCertVerified">
                    <option value="false" ${!candidate.cert_verified ? 'selected' : ''}>No</option>
                    <option value="true" ${candidate.cert_verified ? 'selected' : ''}>Yes</option>
                </select>
            </div>

            <div class="form-actions">
                <button type="button" class="btn btn-outline" onclick="closeCandidateModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">
                    <i class="fas fa-save"></i> Save Changes
                </button>
            </div>
        </form>
    `;

    modal.classList.add('active');
}

// Handle edit candidate
async function handleEditCandidate(event, candidateId) {
    event.preventDefault();

    const name = document.getElementById('editCandidateName').value;
    const candidateData = {
        name: name,
        email: document.getElementById('editCandidateEmail').value,
        phone: document.getElementById('editCandidatePhone').value || null,
        location: document.getElementById('editCandidateLocation').value || null,
        experience: parseInt(document.getElementById('editCandidateExperience').value) || 0,
        education: document.getElementById('editCandidateEducation').value || null,
        skills: document.getElementById('editCandidateSkills').value.split(',').map(s => s.trim()).filter(s => s),
        score: parseInt(document.getElementById('editCandidateScore').value) || 75,
        cert_verified: document.getElementById('editCandidateCertVerified').value === 'true',
        avatar: getInitials(name),
        updated_at: new Date().toISOString()
    };

    try {
        const { error } = await supabase
            .from('candidates')
            .update(candidateData)
            .eq('id', candidateId);

        if (error) throw error;

        showNotification('Candidate updated successfully!', 'success');
        closeCandidateModal();
        await loadCandidates();
    } catch (error) {
        console.error('Error updating candidate:', error);
        showNotification('Failed to update candidate', 'error');
    }
}

// Delete candidate
async function deleteCandidate(candidateId) {
    if (!confirm('Are you sure you want to delete this candidate? This action cannot be undone.')) {
        return;
    }

    try {
        const { error } = await supabase
            .from('candidates')
            .delete()
            .eq('id', candidateId);

        if (error) throw error;

        showNotification('Candidate deleted successfully', 'success');
        closeCandidateModal();
        await loadCandidates();
    } catch (error) {
        console.error('Error deleting candidate:', error);
        showNotification('Failed to delete candidate', 'error');
    }
}

// Contact candidate
function contactCandidate(candidateId) {
    const candidate = allCandidates.find(c => c.id === candidateId);
    if (!candidate) return;

    window.location.href = `mailto:${candidate.email}?subject=Job Opportunity at RecruitAI`;
}

// Search filter
function setupSearchFilter() {
    const searchInput = document.getElementById('candidateSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const query = e.target.value.toLowerCase();
            const filtered = allCandidates.filter(candidate => 
                candidate.name.toLowerCase().includes(query) ||
                candidate.email.toLowerCase().includes(query) ||
                (candidate.location && candidate.location.toLowerCase().includes(query)) ||
                (candidate.skills && candidate.skills.some(skill => skill.toLowerCase().includes(query)))
            );
            renderCandidates(filtered);
        });
    }
}

// Setup user profile
function setupUserProfile() {
    const userProfile = document.getElementById('userProfile');
    if (userProfile) {
        userProfile.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Do you want to logout?')) {
                logout();
            }
        });
    }
    updateUserProfile();
}

// Helper function
function getInitials(name) {
    return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
}
