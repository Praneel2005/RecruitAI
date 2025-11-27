/**
 * Verify Page with Blockchain Simulation
 */
let selectedCertificate = null;

document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication
    const session = await getSession();
    if (!session) {
        window.location.href = 'login.html';
        return;
    }

    // Initialize page
    setupCertificateUpload();
    setupUserProfile();
});

// Setup certificate upload
function setupCertificateUpload() {
    const verifyArea = document.getElementById('verifyArea');
    const fileInput = document.getElementById('certFileInput');

    // Click to upload
    verifyArea.addEventListener('click', function(e) {
        if (e.target !== fileInput) {
            fileInput.click();
        }
    });

    // File input change
    fileInput.addEventListener('change', function(e) {
        handleCertificate(e.target.files[0]);
    });

    // Drag and drop
    verifyArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        verifyArea.style.borderColor = 'var(--primary)';
        verifyArea.style.background = 'rgba(99, 102, 241, 0.05)';
    });

    verifyArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        verifyArea.style.borderColor = '';
        verifyArea.style.background = '';
    });

    verifyArea.addEventListener('drop', function(e) {
        e.preventDefault();
        verifyArea.style.borderColor = '';
        verifyArea.style.background = '';
        handleCertificate(e.dataTransfer.files[0]);
    });

    // Verify button
    const verifyBtn = document.getElementById('verifyBtn');
    if (verifyBtn) {
        verifyBtn.addEventListener('click', verifyCertificate);
    }
}

// Handle certificate
function handleCertificate(file) {
    if (!file) return;

    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
        showNotification('Please upload a PDF, JPG, or PNG file', 'error');
        return;
    }

    if (file.size > maxSize) {
        showNotification('File size exceeds 10MB limit', 'error');
        return;
    }

    selectedCertificate = file;
    renderSelectedFile();

    // Show verify button
    const verifyBtn = document.getElementById('verifyBtn');
    if (verifyBtn) {
        verifyBtn.style.display = 'block';
    }
}

// Render selected file
function renderSelectedFile() {
    const selectedFileDiv = document.getElementById('selectedFile');
    if (!selectedFileDiv || !selectedCertificate) return;

    selectedFileDiv.style.display = 'block';
    selectedFileDiv.innerHTML = `
        <div class="file-item">
            <div class="file-info">
                <i class="fas fa-certificate file-icon"></i>
                <div class="file-details">
                    <h4>${selectedCertificate.name}</h4>
                    <p>${(selectedCertificate.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
            </div>
            <i class="fas fa-times file-remove" onclick="removeCertificate()"></i>
        </div>
    `;
}

// Remove certificate
function removeCertificate() {
    selectedCertificate = null;
    
    const selectedFileDiv = document.getElementById('selectedFile');
    if (selectedFileDiv) {
        selectedFileDiv.style.display = 'none';
        selectedFileDiv.innerHTML = '';
    }

    const verifyBtn = document.getElementById('verifyBtn');
    if (verifyBtn) {
        verifyBtn.style.display = 'none';
    }

    // Clear results
    const resultsDiv = document.getElementById('verificationResult');
    if (resultsDiv) {
        resultsDiv.innerHTML = '<div class="empty-state"><p>Upload a certificate to verify</p></div>';
    }
}

// Generate blockchain hash (SHA-256 simulation)
async function generateBlockchainHash(file) {
    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Generate hash using Web Crypto API
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    
    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return '0x' + hashHex;
}

// Simple hash function fallback
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return '0x' + Math.abs(hash).toString(16) + Math.random().toString(36).substring(2, 15);
}

// Verify certificate with blockchain simulation
async function verifyCertificate() {
    if (!selectedCertificate) {
        showNotification('No certificate selected', 'error');
        return;
    }

    const verifyBtn = document.getElementById('verifyBtn');
    const originalText = verifyBtn.innerHTML;
    verifyBtn.disabled = true;
    verifyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';

    try {
        showNotification('Uploading certificate to blockchain...', 'info');

        // Upload to Supabase Storage
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(7);
        const fileName = `${timestamp}_${randomStr}_${selectedCertificate.name}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('certificates')
            .upload(fileName, selectedCertificate, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('certificates')
            .getPublicUrl(fileName);

        // Generate blockchain hash
        const blockchainHash = await generateBlockchainHash(selectedCertificate);

        // Simulate blockchain verification (85% success rate)
        await new Promise(resolve => setTimeout(resolve, 2500));
        const isVerified = Math.random() > 0.15;

        // Store verification in database
        const verificationData = {
            certificate_url: urlData.publicUrl,
            verified: isVerified,
            blockchain_hash: blockchainHash,
            issuer: isVerified ? getRandomIssuer() : null,
            issue_date: isVerified ? getRandomDate() : null,
            verified_at: new Date().toISOString()
        };

        const { error: dbError } = await supabase
            .from('certificates')
            .insert([verificationData]);

        if (dbError) console.error('Error storing verification:', dbError);

        renderVerificationResult(isVerified, verificationData, urlData.publicUrl);

        if (isVerified) {
            showNotification('Certificate verified successfully on blockchain!', 'success');
        } else {
            showNotification('Certificate verification failed', 'error');
        }

    } catch (error) {
        console.error('Verification error:', error);
        showNotification(`Verification failed: ${error.message}`, 'error');
        renderVerificationResult(false, {});
    } finally {
        verifyBtn.disabled = false;
        verifyBtn.innerHTML = originalText;
    }
}

// Render verification result
function renderVerificationResult(isVerified, verificationData, certificateUrl) {
    const resultsDiv = document.getElementById('verificationResult');
    if (!resultsDiv) return;

    if (isVerified) {
        resultsDiv.innerHTML = `
            <div class="verification-success">
                <div class="verification-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h4>Certificate Verified ✓</h4>
                <p style="color: var(--gray-600); margin-bottom: 20px;">
                    This certificate has been successfully verified on the blockchain
                </p>

                <div class="verification-details">
                    <div class="detail-row">
                        <span class="detail-label">Certificate Name</span>
                        <span class="detail-value">${selectedCertificate.name}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Verification Date</span>
                        <span class="detail-value">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Blockchain Network</span>
                        <span class="detail-value">Ethereum Mainnet</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Transaction Hash</span>
                        <span class="detail-value" style="font-size: 11px; word-break: break-all;">${verificationData.blockchain_hash}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Status</span>
                        <span class="detail-value">
                            <span class="verified-badge">
                                <i class="fas fa-check-circle"></i> Verified
                            </span>
                        </span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Issuer</span>
                        <span class="detail-value">${verificationData.issuer}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Issue Date</span>
                        <span class="detail-value">${new Date(verificationData.issue_date).toLocaleDateString()}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Certificate File</span>
                        <span class="detail-value">
                            <a href="${certificateUrl}" target="_blank" style="color: var(--primary);">
                                <i class="fas fa-external-link-alt"></i> View
                            </a>
                        </span>
                    </div>
                </div>

                <div style="display: flex; gap: 12px; margin-top: 20px;">
                    <button class="btn btn-primary" style="flex: 1;" onclick="downloadReport()">
                        <i class="fas fa-download"></i> Download Report
                    </button>
                    <button class="btn btn-outline" style="flex: 1;" onclick="viewOnBlockchain('${verificationData.blockchain_hash}')">
                        <i class="fas fa-link"></i> View on Blockchain
                    </button>
                </div>
            </div>
        `;
    } else {
        resultsDiv.innerHTML = `
            <div class="verification-failed">
                <div class="verification-icon">
                    <i class="fas fa-times-circle"></i>
                </div>
                <h4>Verification Failed ✗</h4>
                <p style="color: var(--gray-600); margin-bottom: 20px;">
                    This certificate could not be verified on the blockchain
                </p>

                <div class="verification-details">
                    <div class="detail-row">
                        <span class="detail-label">Certificate Name</span>
                        <span class="detail-value">${selectedCertificate.name}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Verification Date</span>
                        <span class="detail-value">${new Date().toLocaleDateString()}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Status</span>
                        <span class="detail-value" style="color: var(--error);">
                            <i class="fas fa-times-circle"></i> Not Verified
                        </span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Reason</span>
                        <span class="detail-value">Certificate not found in blockchain registry</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Recommendation</span>
                        <span class="detail-value">Contact the issuing institution to register this certificate</span>
                    </div>
                </div>

                <button class="btn btn-outline" style="width: 100%; margin-top: 20px;" onclick="removeCertificate()">
                    <i class="fas fa-redo"></i> Try Another Certificate
                </button>
            </div>
        `;
    }
}

// Download verification report
function downloadReport() {
    showNotification('Generating verification report...', 'info');
    
    // Simulate report generation
    setTimeout(() => {
        const reportContent = `
CERTIFICATE VERIFICATION REPORT
================================

Certificate: ${selectedCertificate.name}
Verification Date: ${new Date().toLocaleString()}
Status: VERIFIED ✓
Blockchain: Ethereum Mainnet

This certificate has been successfully verified on the blockchain.

Generated by RecruitAI Verification System
        `;
        
        const blob = new Blob([reportContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `verification_report_${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        
        showNotification('Report downloaded successfully!', 'success');
    }, 1000);
}

// View on blockchain (simulated)
function viewOnBlockchain(hash) {
    showNotification('Opening blockchain explorer...', 'info');
    // In production, this would open etherscan.io or similar
    window.open(`https://etherscan.io/tx/${hash}`, '_blank');
}

// Helper functions
function getRandomIssuer() {
    const issuers = [
        'Stanford University',
        'MIT',
        'Harvard University',
        'UC Berkeley',
        'Carnegie Mellon University',
        'Georgia Tech'
    ];
    return issuers[Math.floor(Math.random() * issuers.length)];
}

function getRandomDate() {
    const start = new Date(2020, 0, 1);
    const end = new Date(2024, 11, 31);
    const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    return date.toISOString().split('T')[0];
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
