/**
 * Upload Page with Auto-Parse and Job Matching
 */
let uploadedFiles = [];
let parsedResumes = [];

document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication
    const session = await getSession();
    if (!session) {
        window.location.href = 'login.html';
        return;
    }

    console.log('📤 Upload page loaded');
    setupFileUpload();
    setupUserProfile();
});

// Setup file upload with auto-parse
function setupFileUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('resumeFileInput');

    if (!uploadArea || !fileInput) {
        console.error('❌ Upload elements not found');
        return;
    }

    // Click to upload
    uploadArea.addEventListener('click', function(e) {
        if (e.target !== fileInput) {
            fileInput.click();
        }
    });

    // File input change - AUTO PARSE
    fileInput.addEventListener('change', function(e) {
        handleFilesAndParse(e.target.files);
    });

    // Drag and drop
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--primary)';
        uploadArea.style.background = 'rgba(99, 102, 241, 0.05)';
    });

    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        uploadArea.style.borderColor = '';
        uploadArea.style.background = '';
    });

    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.style.borderColor = '';
        uploadArea.style.background = '';
        handleFilesAndParse(e.dataTransfer.files);
    });
}

// Handle files and auto-parse
async function handleFilesAndParse(files) {
    const validTypes = [
        'application/pdf', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
        'application/msword',
        'text/plain'
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB

    const validFiles = [];

    Array.from(files).forEach(file => {
        if (!validTypes.includes(file.type)) {
            showNotification(`${file.name} is not a supported file type`, 'error');
            return;
        }

        if (file.size > maxSize) {
            showNotification(`${file.name} exceeds 10MB limit`, 'error');
            return;
        }

        // Check for duplicates
        if (uploadedFiles.some(f => f.name === file.name && f.size === file.size)) {
            showNotification(`${file.name} is already added`, 'error');
            return;
        }

        validFiles.push(file);
    });

    if (validFiles.length > 0) {
        uploadedFiles = validFiles;
        renderUploadedFiles();
        
        // AUTO-PARSE immediately after upload
        showNotification(`Processing ${validFiles.length} resume(s)...`, 'info');
        await parseAndMatchResumes();
    }
}

// Get file icon based on type
function getFileIcon(type) {
    if (type.includes('pdf')) return 'pdf';
    if (type.includes('word') || type.includes('document')) return 'word';
    return 'alt';
}

// Render uploaded files
function renderUploadedFiles() {
    const uploadedFilesDiv = document.getElementById('uploadedFiles');
    if (!uploadedFilesDiv) return;

    if (uploadedFiles.length === 0) {
        uploadedFilesDiv.innerHTML = '';
        return;
    }

    uploadedFilesDiv.innerHTML = uploadedFiles.map((file, index) => `
        <div class="file-item">
            <div class="file-info">
                <i class="fas fa-file-${getFileIcon(file.type)} file-icon"></i>
                <div class="file-details">
                    <h4>${file.name}</h4>
                    <p>${(file.size / 1024 / 1024).toFixed(2)} MB • Processing...</p>
                </div>
            </div>
            <i class="fas fa-spinner fa-spin" style="color: var(--primary);"></i>
        </div>
    `).join('');
}

// Parse resumes and match with jobs
async function parseAndMatchResumes() {
    if (uploadedFiles.length === 0) {
        showNotification('No files to parse', 'error');
        return;
    }

    try {
        console.log('📥 Uploading and parsing resumes...');

        // First, load all active jobs for matching
        const { data: allJobs, error: jobsError } = await supabase
            .from('jobs')
            .select('*')
            .eq('status', 'active');

        if (jobsError) throw jobsError;

        console.log('✅ Loaded', allJobs.length, 'active jobs for matching');

        // Upload files to Supabase Storage and parse
        const uploadPromises = uploadedFiles.map(async (file, index) => {
            // Generate unique filename
            const timestamp = Date.now();
            const randomStr = Math.random().toString(36).substring(7);
            const fileName = `${timestamp}_${randomStr}_${file.name}`;

            // Upload to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('resumes')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('resumes')
                .getPublicUrl(fileName);

            // Simulate AI parsing (In production, call actual AI API here)
            const parsedData = await simulateAIParsing(file, index);

            // Match candidate skills with jobs
            const matchedJobs = matchCandidateWithJobs(parsedData.skills, allJobs);

            return {
                id: Date.now() + index,
                fileName: file.name,
                name: parsedData.name,
                email: parsedData.email,
                phone: parsedData.phone,
                skills: parsedData.skills,
                experience: parsedData.experience,
                education: parsedData.education,
                location: parsedData.location,
                matchScore: parsedData.matchScore,
                avatar: getInitials(parsedData.name),
                resume_url: urlData.publicUrl,
                matchedJobs: matchedJobs, // Array of {jobId, jobTitle, matchScore}
                bestMatchJob: matchedJobs[0] || null // Best matching job
            };
        });

        // Wait for all uploads and parsing
        parsedResumes = await Promise.all(uploadPromises);

        renderParsingResults();
        showNotification(`Successfully processed ${uploadedFiles.length} resume(s)!`, 'success');

        // Clear uploaded files display
        uploadedFiles = [];
        const uploadedFilesDiv = document.getElementById('uploadedFiles');
        if (uploadedFilesDiv) uploadedFilesDiv.innerHTML = '';

    } catch (error) {
        console.error('❌ Error parsing resumes:', error);
        showNotification(`Failed to parse resumes: ${error.message}`, 'error');
    }
}

// Simulate AI parsing (replace with actual AI API in production)
async function simulateAIParsing(file, index) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const mockNames = ['Alice Johnson', 'Bob Smith', 'Carol Williams', 'David Chen', 'Emma Davis', 'Frank Miller'];
    const mockEmails = ['alice.j@email.com', 'bob.smith@email.com', 'carol.w@email.com', 'david.chen@email.com', 'emma.d@email.com', 'frank.m@email.com'];
    const mockSkillSets = [
        ['React', 'Node.js', 'JavaScript', 'AWS', 'MongoDB', 'TypeScript'],
        ['Python', 'Machine Learning', 'TensorFlow', 'PyTorch', 'SQL', 'Docker'],
        ['Docker', 'Kubernetes', 'DevOps', 'AWS', 'CI/CD', 'Terraform'],
        ['React', 'Vue', 'CSS', 'JavaScript', 'UI/UX', 'Figma'],
        ['Java', 'Spring Boot', 'Microservices', 'MySQL', 'REST API'],
        ['Angular', 'TypeScript', 'RxJS', 'Node.js', 'GraphQL']
    ];
    const mockEducation = [
        'MS Computer Science - Stanford University',
        'MS Artificial Intelligence - MIT',
        'BS Computer Science - UC Berkeley',
        'BS Design & Computer Science - NYU',
        'MS Software Engineering - Carnegie Mellon',
        'BS Information Technology - Georgia Tech'
    ];
    const mockLocations = ['San Francisco, CA', 'Boston, MA', 'Seattle, WA', 'New York, NY', 'Austin, TX', 'Remote'];

    const idx = index % mockNames.length;

    return {
        name: mockNames[idx],
        email: mockEmails[idx],
        phone: `+1 (555) ${100 + index}${200 + index}-${3000 + index}`,
        skills: mockSkillSets[idx],
        experience: Math.floor(Math.random() * 8) + 2,
        education: mockEducation[idx],
        location: mockLocations[idx],
        matchScore: Math.floor(Math.random() * 20) + 80
    };
}

// Match candidate skills with jobs using AI scoring
function matchCandidateWithJobs(candidateSkills, allJobs) {
    const matches = [];

    allJobs.forEach(job => {
        const jobSkills = job.required_skills || [];
        
        // Calculate match score based on skill overlap
        let matchingSkills = 0;
        candidateSkills.forEach(skill => {
            if (jobSkills.some(js => js.toLowerCase().includes(skill.toLowerCase()) || 
                                     skill.toLowerCase().includes(js.toLowerCase()))) {
                matchingSkills++;
            }
        });

        const matchPercentage = Math.round((matchingSkills / jobSkills.length) * 100);

        if (matchPercentage > 30) { // Only include if at least 30% match
            matches.push({
                jobId: job.id,
                jobTitle: job.title,
                company: job.company,
                matchScore: matchPercentage,
                matchingSkills: matchingSkills,
                requiredSkills: jobSkills.length
            });
        }
    });

    // Sort by match score (highest first)
    matches.sort((a, b) => b.matchScore - a.matchScore);

    return matches;
}

// Render parsing results with job matches
function renderParsingResults() {
    const resultsDiv = document.getElementById('parsingResults');
    if (!resultsDiv) return;

    if (parsedResumes.length === 0) {
        resultsDiv.innerHTML = '<div class="empty-state"><p>Upload resumes to see results</p></div>';
        return;
    }

    resultsDiv.innerHTML = parsedResumes.map(resume => `
        <div class="parsed-resume">
            <div class="parsed-header">
                <div class="parsed-avatar">${resume.avatar}</div>
                <div class="parsed-info">
                    <h4>${resume.name}</h4>
                    <p>${resume.email}</p>
                </div>
            </div>

            <div class="parsed-details">
                <div class="detail-group">
                    <h5>📍 Location</h5>
                    <p>${resume.location}</p>
                </div>

                <div class="detail-group">
                    <h5>📞 Contact</h5>
                    <p>${resume.phone}</p>
                </div>

                <div class="detail-group">
                    <h5>💼 Experience</h5>
                    <p>${resume.experience} years</p>
                </div>

                <div class="detail-group">
                    <h5>🎓 Education</h5>
                    <p>${resume.education}</p>
                </div>

                <div class="detail-group">
                    <h5>🛠️ Skills Extracted</h5>
                    <div class="skills-list">
                        ${resume.skills.map(skill => `
                            <span class="skill-tag">${skill}</span>
                        `).join('')}
                    </div>
                </div>

                <div class="detail-group">
                    <h5>🎯 Best Matching Jobs (${resume.matchedJobs.length} found)</h5>
                    ${resume.matchedJobs.length > 0 ? `
                        <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 12px;">
                            ${resume.matchedJobs.slice(0, 3).map(job => `
                                <div style="padding: 12px; background: var(--gray-50); border-radius: 8px; border-left: 3px solid ${job.matchScore >= 70 ? 'var(--success)' : job.matchScore >= 50 ? 'var(--warning)' : 'var(--gray-400)'};">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                                        <strong style="color: var(--gray-900);">${job.jobTitle}</strong>
                                        <span class="match-badge">
                                            <i class="fas fa-star"></i> ${job.matchScore}% Match
                                        </span>
                                    </div>
                                    <p style="font-size: 13px; color: var(--gray-600); margin: 0;">
                                        ${job.company} • ${job.matchingSkills}/${job.requiredSkills} skills match
                                    </p>
                                </div>
                            `).join('')}
                        </div>
                    ` : '<p style="color: var(--gray-500); font-style: italic;">No matching jobs found</p>'}
                </div>

                <div class="detail-group">
                    <h5>📄 Resume File</h5>
                    <a href="${resume.resume_url}" target="_blank" class="btn btn-outline btn-sm">
                        <i class="fas fa-download"></i> Download Resume
                    </a>
                </div>
            </div>

            <button class="btn btn-primary btn-sm" style="width: 100%; margin-top: 12px;" onclick="saveCandidate(${resume.id})">
                <i class="fas fa-save"></i> Save Candidate with Job Matches
            </button>
        </div>
    `).join('');
}

// Save candidate to database with matched jobs
async function saveCandidate(resumeId) {
    const resume = parsedResumes.find(r => r.id === resumeId);
    if (!resume) return;

    const candidateData = {
        name: resume.name,
        email: resume.email,
        phone: resume.phone,
        location: resume.location,
        score: resume.matchScore,
        skills: resume.skills,
        experience: resume.experience,
        education: resume.education,
        cert_verified: false,
        avatar: resume.avatar,
        applied_date: new Date().toISOString().split('T')[0],
        matched_jobs: resume.matchedJobs.map(j => j.jobId), // Save job IDs
        resume_url: resume.resume_url
    };

    try {
        const { data, error } = await supabase
            .from('candidates')
            .insert([candidateData])
            .select();

        if (error) {
            if (error.code === '23505') {
                showNotification(`Candidate ${resume.name} already exists with this email`, 'error');
            } else {
                throw error;
            }
            return;
        }

        showNotification(`✅ ${resume.name} saved successfully with ${resume.matchedJobs.length} job matches!`, 'success');
        
        // Remove from parsed list
        parsedResumes = parsedResumes.filter(r => r.id !== resumeId);
        renderParsingResults();
        
    } catch (error) {
        console.error('Error saving candidate:', error);
        showNotification(`Failed to save candidate: ${error.message}`, 'error');
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
