/**
 * Jobs Page with Full CRUD Operations
 */
let allJobs = [];

document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication
    const session = await getSession();
    if (!session) {
        window.location.href = 'login.html';
        return;
    }

    // Initialize page
    await loadJobs();
    setupSearchFilter();
    setupAddJobButton();
    setupUserProfile();
});

// Load jobs from Supabase
async function loadJobs() {
    try {
        const { data, error } = await supabase
            .from('jobs')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        allJobs = data || [];
        renderJobs(allJobs);
    } catch (error) {
        console.error('Error loading jobs:', error);
        showNotification('Failed to load jobs', 'error');
    }
}

// Render jobs
function renderJobs(jobs) {
    const jobsGrid = document.getElementById('jobsGrid');
    if (!jobsGrid) return;

    if (jobs.length === 0) {
        jobsGrid.innerHTML = '<div class="empty-state"><p>No jobs found. Click "Add New Job" to create one.</p></div>';
        return;
    }

    jobsGrid.innerHTML = jobs.map(job => `
        <div class="job-card" onclick="showJobDetails(${job.id})">
            <div class="job-header">
                <div>
                    <h3 class="job-title">${job.title}</h3>
                    <div class="job-company">
                        <i class="fas fa-building"></i>
                        ${job.company}
                    </div>
                </div>
                <span class="job-status ${job.status}">${job.status}</span>
            </div>
            <div class="job-details">
                <div class="job-detail">
                    <i class="fas fa-map-marker-alt"></i>
                    ${job.location || 'Remote'}
                </div>
                <div class="job-detail">
                    <i class="fas fa-clock"></i>
                    ${job.type || 'Full-time'}
                </div>
                <div class="job-detail">
                    <i class="fas fa-briefcase"></i>
                    ${job.experience || 'Any'}
                </div>
            </div>
            <div class="job-skills">
                ${(job.required_skills || []).slice(0, 5).map(skill => `
                    <span class="skill-tag">${skill}</span>
                `).join('')}
                ${(job.required_skills || []).length > 5 ? '<span class="skill-tag">+' + ((job.required_skills || []).length - 5) + ' more</span>' : ''}
            </div>
            <div class="job-footer">
                <div class="matched-candidates">
                    <i class="fas fa-users"></i>
                    <span class="matched-count">${job.candidates_count || 0} candidates</span>
                </div>
                <span style="font-size: 14px; color: var(--gray-600);">${job.salary || 'Competitive'}</span>
            </div>
        </div>
    `).join('');
}

// Show job details modal
function showJobDetails(jobId) {
    const job = allJobs.find(j => j.id === jobId);
    if (!job) return;

    const modal = document.getElementById('jobModal');
    const modalTitle = document.getElementById('modalJobTitle');
    const modalBody = document.getElementById('modalJobBody');

    modalTitle.textContent = job.title;
    modalBody.innerHTML = `
        <div class="candidate-preview">
            <div>
                <h4 style="margin-bottom: 8px;">${job.company}</h4>
                <p style="color: var(--gray-600); font-size: 14px;">
                    <i class="fas fa-map-marker-alt"></i> ${job.location} • 
                    <i class="fas fa-clock"></i> ${job.type}
                </p>
            </div>
        </div>
        
        <div class="detail-group">
            <h5>Experience Required</h5>
            <p>${job.experience || 'Not specified'}</p>
        </div>

        <div class="detail-group">
            <h5>Salary Range</h5>
            <p>${job.salary || 'Competitive'}</p>
        </div>

        <div class="detail-group">
            <h5>Required Skills</h5>
            <div class="skills-list">
                ${(job.required_skills || []).map(skill => `
                    <span class="skill-tag">${skill}</span>
                `).join('')}
            </div>
        </div>

        <div class="detail-group">
            <h5>Description</h5>
            <p>${job.description || 'No description provided'}</p>
        </div>

        <div class="detail-group">
            <h5>Status</h5>
            <span class="job-status ${job.status}">${job.status}</span>
        </div>

        <div class="form-actions">
            <button class="btn btn-outline" onclick="closeJobModal()">Close</button>
            <button class="btn btn-secondary" onclick="editJob(${job.id})">
                <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn btn-primary" style="background: var(--error);" onclick="deleteJob(${job.id})">
                <i class="fas fa-trash"></i> Delete
            </button>
        </div>
    `;

    modal.classList.add('active');
}

// Close job modal
function closeJobModal() {
    const modal = document.getElementById('jobModal');
    modal.classList.remove('active');
}

// Setup add job button
function setupAddJobButton() {
    const addJobBtn = document.getElementById('addJobBtn');
    if (addJobBtn) {
        addJobBtn.addEventListener('click', showAddJobModal);
    }
}

// Show add job modal
function showAddJobModal() {
    const modal = document.getElementById('jobModal');
    const modalTitle = document.getElementById('modalJobTitle');
    const modalBody = document.getElementById('modalJobBody');

    modalTitle.textContent = 'Add New Job';
    modalBody.innerHTML = `
        <form id="addJobForm" onsubmit="handleAddJob(event)">
            <div class="form-group">
                <label>Job Title *</label>
                <input type="text" class="form-control" id="jobTitle" required placeholder="e.g. Senior Developer">
            </div>

            <div class="form-group">
                <label>Company *</label>
                <input type="text" class="form-control" id="jobCompany" required placeholder="e.g. Tech Corp">
            </div>

            <div class="form-group">
                <label>Location</label>
                <input type="text" class="form-control" id="jobLocation" placeholder="e.g. San Francisco, CA or Remote">
            </div>

            <div class="form-group">
                <label>Job Type</label>
                <select class="form-control" id="jobType">
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                </select>
            </div>

            <div class="form-group">
                <label>Experience Required</label>
                <input type="text" class="form-control" id="jobExperience" placeholder="e.g. 3-5 years">
            </div>

            <div class="form-group">
                <label>Salary Range</label>
                <input type="text" class="form-control" id="jobSalary" placeholder="e.g. $80k - $120k">
            </div>

            <div class="form-group">
                <label>Required Skills (comma-separated)</label>
                <input type="text" class="form-control" id="jobSkills" placeholder="e.g. React, Node.js, AWS">
            </div>

            <div class="form-group">
                <label>Job Description</label>
                <textarea class="form-control" id="jobDescription" rows="4" placeholder="Describe the role..."></textarea>
            </div>

            <div class="form-actions">
                <button type="button" class="btn btn-outline" onclick="closeJobModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">
                    <i class="fas fa-plus"></i> Create Job
                </button>
            </div>
        </form>
    `;

    modal.classList.add('active');
}

// Handle add job
async function handleAddJob(event) {
    event.preventDefault();

    const jobData = {
        title: document.getElementById('jobTitle').value,
        company: document.getElementById('jobCompany').value,
        location: document.getElementById('jobLocation').value || null,
        type: document.getElementById('jobType').value,
        experience: document.getElementById('jobExperience').value || null,
        salary: document.getElementById('jobSalary').value || null,
        required_skills: document.getElementById('jobSkills').value.split(',').map(s => s.trim()).filter(s => s),
        description: document.getElementById('jobDescription').value || null,
        status: 'active',
        candidates_count: 0
    };

    try {
        const { data, error } = await supabase
            .from('jobs')
            .insert([jobData])
            .select();

        if (error) throw error;

        showNotification('Job created successfully!', 'success');
        closeJobModal();
        await loadJobs();
    } catch (error) {
        console.error('Error creating job:', error);
        showNotification('Failed to create job', 'error');
    }
}

// Edit job
function editJob(jobId) {
    const job = allJobs.find(j => j.id === jobId);
    if (!job) return;

    const modal = document.getElementById('jobModal');
    const modalTitle = document.getElementById('modalJobTitle');
    const modalBody = document.getElementById('modalJobBody');

    modalTitle.textContent = 'Edit Job';
    modalBody.innerHTML = `
        <form id="editJobForm" onsubmit="handleEditJob(event, ${jobId})">
            <div class="form-group">
                <label>Job Title *</label>
                <input type="text" class="form-control" id="editJobTitle" required value="${job.title}">
            </div>

            <div class="form-group">
                <label>Company *</label>
                <input type="text" class="form-control" id="editJobCompany" required value="${job.company}">
            </div>

            <div class="form-group">
                <label>Location</label>
                <input type="text" class="form-control" id="editJobLocation" value="${job.location || ''}">
            </div>

            <div class="form-group">
                <label>Job Type</label>
                <select class="form-control" id="editJobType">
                    <option value="Full-time" ${job.type === 'Full-time' ? 'selected' : ''}>Full-time</option>
                    <option value="Part-time" ${job.type === 'Part-time' ? 'selected' : ''}>Part-time</option>
                    <option value="Contract" ${job.type === 'Contract' ? 'selected' : ''}>Contract</option>
                    <option value="Internship" ${job.type === 'Internship' ? 'selected' : ''}>Internship</option>
                </select>
            </div>

            <div class="form-group">
                <label>Experience Required</label>
                <input type="text" class="form-control" id="editJobExperience" value="${job.experience || ''}">
            </div>

            <div class="form-group">
                <label>Salary Range</label>
                <input type="text" class="form-control" id="editJobSalary" value="${job.salary || ''}">
            </div>

            <div class="form-group">
                <label>Required Skills (comma-separated)</label>
                <input type="text" class="form-control" id="editJobSkills" value="${(job.required_skills || []).join(', ')}">
            </div>

            <div class="form-group">
                <label>Job Description</label>
                <textarea class="form-control" id="editJobDescription" rows="4">${job.description || ''}</textarea>
            </div>

            <div class="form-group">
                <label>Status</label>
                <select class="form-control" id="editJobStatus">
                    <option value="active" ${job.status === 'active' ? 'selected' : ''}>Active</option>
                    <option value="closed" ${job.status === 'closed' ? 'selected' : ''}>Closed</option>
                    <option value="draft" ${job.status === 'draft' ? 'selected' : ''}>Draft</option>
                </select>
            </div>

            <div class="form-actions">
                <button type="button" class="btn btn-outline" onclick="closeJobModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">
                    <i class="fas fa-save"></i> Save Changes
                </button>
            </div>
        </form>
    `;

    modal.classList.add('active');
}

// Handle edit job
async function handleEditJob(event, jobId) {
    event.preventDefault();

    const jobData = {
        title: document.getElementById('editJobTitle').value,
        company: document.getElementById('editJobCompany').value,
        location: document.getElementById('editJobLocation').value || null,
        type: document.getElementById('editJobType').value,
        experience: document.getElementById('editJobExperience').value || null,
        salary: document.getElementById('editJobSalary').value || null,
        required_skills: document.getElementById('editJobSkills').value.split(',').map(s => s.trim()).filter(s => s),
        description: document.getElementById('editJobDescription').value || null,
        status: document.getElementById('editJobStatus').value,
        updated_at: new Date().toISOString()
    };

    try {
        const { error } = await supabase
            .from('jobs')
            .update(jobData)
            .eq('id', jobId);

        if (error) throw error;

        showNotification('Job updated successfully!', 'success');
        closeJobModal();
        await loadJobs();
    } catch (error) {
        console.error('Error updating job:', error);
        showNotification('Failed to update job', 'error');
    }
}

// Delete job
async function deleteJob(jobId) {
    if (!confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
        return;
    }

    try {
        const { error } = await supabase
            .from('jobs')
            .delete()
            .eq('id', jobId);

        if (error) throw error;

        showNotification('Job deleted successfully', 'success');
        closeJobModal();
        await loadJobs();
    } catch (error) {
        console.error('Error deleting job:', error);
        showNotification('Failed to delete job', 'error');
    }
}

// Search filter
function setupSearchFilter() {
    const searchInput = document.getElementById('jobSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const query = e.target.value.toLowerCase();
            const filtered = allJobs.filter(job => 
                job.title.toLowerCase().includes(query) ||
                job.company.toLowerCase().includes(query) ||
                (job.location && job.location.toLowerCase().includes(query))
            );
            renderJobs(filtered);
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
