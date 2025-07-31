// CareerPing - Modern Placement Tracker & Reminder App
// Enhanced UI with animations, accessibility, and responsive design

// --- Data Model & Local Storage ---
const STORAGE_KEY = 'placementApplications';
const DARK_MODE_KEY = 'darkModePreference';

function getApplications() {
    // Retrieve applications from localStorage
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

function saveApplications(apps) {
    // Save applications to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
}

function getDarkModePreference() {
    return localStorage.getItem(DARK_MODE_KEY) === 'true';
}

function saveDarkModePreference(isDark) {
    localStorage.setItem(DARK_MODE_KEY, isDark.toString());
}

// --- UI Elements ---
const form = document.getElementById('applicationForm');
const applicationsGrid = document.getElementById('applicationsGrid');
const totalApplications = document.getElementById('totalApplications');
const statusBreakdown = document.getElementById('statusBreakdown');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const deadlinesList = document.getElementById('deadlinesList');
const upcomingDeadlines = document.getElementById('upcomingDeadlines');
const offerCount = document.getElementById('offerCount');
const interviewCount = document.getElementById('interviewCount');
const darkModeToggle = document.getElementById('darkModeToggle');
const noApplications = document.getElementById('noApplications');
const noDeadlines = document.getElementById('noDeadlines');

// --- Status Configuration ---
const STATUS_CONFIG = {
    'Applied': { 
        badge: 'status-applied', 
        label: 'Applied',
        icon: 'fas fa-paper-plane',
        color: '#1e40af'
    },
    'Interview Scheduled': { 
        badge: 'status-interview', 
        label: 'Interview',
        icon: 'fas fa-calendar-check',
        color: '#d97706'
    },
    'Rejected': { 
        badge: 'status-rejected', 
        label: 'Rejected',
        icon: 'fas fa-times-circle',
        color: '#dc2626'
    },
    'Offer Received': { 
        badge: 'status-offer', 
        label: 'Offer',
        icon: 'fas fa-trophy',
        color: '#059669'
    }
};

// --- Form Validation & Submission ---
form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Bootstrap validation
    if (!form.checkValidity()) {
        e.stopPropagation();
        form.classList.add('was-validated');
        return;
    }
    
    // Create application object
    const app = {
        id: Date.now(), // Simple ID generation
        company: form.companyName.value.trim(),
        role: form.role.value.trim(),
        applicationDate: form.applicationDate.value,
        deadline: form.deadline.value,
        status: form.status.value,
        notes: form.notes.value.trim(),
        resumeData: window.currentResumeData || null, // Include resume data
        createdAt: new Date().toISOString()
    };
    
    // Validate deadline is after application date
    if (new Date(app.deadline) < new Date(app.applicationDate)) {
        showToast('Deadline cannot be before application date!', 'error');
        return;
    }
    
    const apps = getApplications();
    apps.push(app);
    saveApplications(apps);
    
    // Reset form and resume data
    form.reset();
    form.classList.remove('was-validated');
    window.currentResumeData = null;
    document.getElementById('resumePreview').style.display = 'none';
    
    // Update dashboard with animation
    renderDashboard();
    showToast('Application saved successfully! 🎉', 'success');
});

// --- Resume Upload Handling ---
window.currentResumeData = null;

function handleResumeUpload(input) {
    const file = input.files[0];
    if (!file) return;
    
    // Validate file type
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
        showToast('Please upload only PDF, DOC, or DOCX files', 'error');
        input.value = '';
        return;
    }
    
    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        showToast('File size must be less than 5MB', 'error');
        input.value = '';
        return;
    }
    
    // Read file as base64
    const reader = new FileReader();
    reader.onload = function(e) {
        window.currentResumeData = {
            name: file.name,
            type: file.type,
            size: file.size,
            data: e.target.result,
            uploadDate: new Date().toISOString()
        };
        
        // Show preview
        document.getElementById('resumeFileName').textContent = file.name;
        document.getElementById('resumePreview').style.display = 'block';
        showToast('Resume uploaded successfully! 📄', 'success');
    };
    
    reader.onerror = function() {
        showToast('Error reading file. Please try again.', 'error');
        input.value = '';
    };
    
    reader.readAsDataURL(file);
}

function removeResume() {
    window.currentResumeData = null;
    document.getElementById('resumeUpload').value = '';
    document.getElementById('resumePreview').style.display = 'none';
    showToast('Resume removed', 'info');
}

function downloadResume(resumeData) {
    if (!resumeData) {
        showToast('No resume available for download', 'error');
        return;
    }
    
    // Create download link
    const link = document.createElement('a');
    link.href = resumeData.data;
    link.download = resumeData.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Resume download started', 'success');
}

// --- Enhanced Dashboard Rendering ---
function renderDashboard() {
    const apps = getApplications();
    
    // Update statistics with animations
    updateStatistics(apps);
    updateStatusBreakdown(apps);
    updateProgressBar(apps);
    updateDeadlinesList(apps);
    updateApplicationsGrid(apps);
    checkReminders(apps);
}

function updateStatistics(apps) {
    const stats = {
        total: apps.length,
        upcoming: apps.filter(app => daysUntil(app.deadline) <= 7 && daysUntil(app.deadline) >= 0).length,
        offers: apps.filter(app => app.status === 'Offer Received').length,
        interviews: apps.filter(app => app.status === 'Interview Scheduled').length
    };
    
    animateCounter(totalApplications, stats.total);
    animateCounter(upcomingDeadlines, stats.upcoming);
    animateCounter(offerCount, stats.offers);
    animateCounter(interviewCount, stats.interviews);
}

function animateCounter(element, targetValue) {
    const currentValue = parseInt(element.textContent) || 0;
    const increment = targetValue > currentValue ? 1 : -1;
    const stepTime = 50;
    
    const timer = setInterval(() => {
        const current = parseInt(element.textContent);
        if ((increment > 0 && current >= targetValue) || (increment < 0 && current <= targetValue)) {
            element.textContent = targetValue;
            clearInterval(timer);
        } else {
            element.textContent = current + increment;
        }
    }, stepTime);
}

function updateStatusBreakdown(apps) {
    const statusCounts = {
        'Applied': 0,
        'Interview Scheduled': 0,
        'Rejected': 0,
        'Offer Received': 0
    };
    
    apps.forEach(app => statusCounts[app.status]++);
    
    statusBreakdown.innerHTML = '';
    Object.keys(statusCounts).forEach(status => {
        const config = STATUS_CONFIG[status];
        const count = statusCounts[status];
        
        if (count > 0) {
            const badge = document.createElement('div');
            badge.className = `status-badge ${config.badge}`;
            badge.innerHTML = `
                <i class="${config.icon}"></i>
                ${config.label}: ${count}
            `;
            statusBreakdown.appendChild(badge);
        }
    });
}

function updateProgressBar(apps) {
    const offerCount = apps.filter(app => app.status === 'Offer Received').length;
    const percent = apps.length ? Math.round((offerCount / apps.length) * 100) : 0;
    
    // Animate progress bar
    setTimeout(() => {
        progressBar.style.width = percent + '%';
        progressBar.setAttribute('aria-valuenow', percent);
        progressText.textContent = percent + '%';
    }, 100);
}

function updateDeadlinesList(apps) {
    deadlinesList.innerHTML = '';
    
    // Sort by deadline and filter upcoming
    const upcomingApps = apps
        .filter(app => daysUntil(app.deadline) >= 0)
        .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
        .slice(0, 5); // Show only next 5 deadlines
    
    if (upcomingApps.length === 0) {
        noDeadlines.style.display = 'block';
        return;
    }
    
    noDeadlines.style.display = 'none';
    
    upcomingApps.forEach((app, index) => {
        const days = daysUntil(app.deadline);
        const item = createDeadlineItem(app, days);
        item.style.animationDelay = `${index * 0.1}s`;
        item.classList.add('fade-in-up');
        deadlinesList.appendChild(item);
    });
}

function createDeadlineItem(app, days) {
    const item = document.createElement('div');
    item.className = 'deadline-item';
    
    if (days <= 3) item.classList.add('urgent');
    
    const urgency = days <= 1 ? 'urgent' : days <= 3 ? 'soon' : 'normal';
    const badgeText = days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days} days`;
    
    item.innerHTML = `
        <div class="deadline-content">
            <div class="deadline-company">${app.company}</div>
            <div class="deadline-role">${app.role}</div>
        </div>
        <div class="deadline-date">${formatDate(app.deadline)}</div>
        <span class="deadline-badge badge-${urgency}">${badgeText}</span>
    `;
    
    return item;
}

function updateApplicationsGrid(apps) {
    applicationsGrid.innerHTML = '';
    
    if (apps.length === 0) {
        noApplications.style.display = 'block';
        return;
    }
    
    noApplications.style.display = 'none';
    
    // Sort by most recent
    const sortedApps = [...apps].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    sortedApps.forEach((app, index) => {
        const card = createApplicationCard(app);
        card.style.animationDelay = `${index * 0.1}s`;
        card.classList.add('fade-in-up');
        applicationsGrid.appendChild(card);
    });
}

function createApplicationCard(app) {
    const card = document.createElement('div');
    card.className = 'application-card';
    
    const config = STATUS_CONFIG[app.status];
    const daysLeft = daysUntil(app.deadline);
    
    // Resume section HTML
    const resumeSection = app.resumeData ? `
        <div class="application-resume">
            <div class="resume-info">
                <i class="fas fa-file-pdf text-danger me-2"></i>
                <span class="resume-name">${app.resumeData.name}</span>
                <small class="text-muted ms-2">(${(app.resumeData.size / 1024 / 1024).toFixed(1)}MB)</small>
            </div>
            <button class="btn btn-outline-success btn-sm" onclick="downloadResume(getApplications().find(a => a.id === ${app.id}).resumeData)" title="Download Resume">
                <i class="fas fa-download"></i> Download
            </button>
        </div>
    ` : `
        <div class="application-resume">
            <div class="resume-info text-muted">
                <i class="fas fa-file-plus me-2"></i>
                <span>No resume uploaded</span>
            </div>
        </div>
    `;
    
    card.innerHTML = `
        <div class="application-header">
            <div>
                <div class="application-company">${app.company}</div>
                <div class="application-role">${app.role}</div>
            </div>
        </div>
        
        <div class="application-status">
            <span class="status-badge ${config.badge}">
                <i class="${config.icon}"></i>
                ${app.status}
            </span>
        </div>
        
        <div class="application-dates">
            <div class="date-item">
                <div class="date-label">Applied</div>
                <div class="date-value">${formatDate(app.applicationDate)}</div>
            </div>
            <div class="date-item">
                <div class="date-label">Deadline</div>
                <div class="date-value">${formatDate(app.deadline)}</div>
            </div>
        </div>
        
        ${resumeSection}
        
        ${app.notes ? `<div class="application-notes">"${app.notes}"</div>` : ''}
        
        <div class="application-actions">
            <button class="btn btn-outline-primary btn-sm" onclick="editApplication(${app.id})" aria-label="Edit application for ${app.company}">
                <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn btn-outline-danger btn-sm" onclick="deleteApplication(${app.id})" aria-label="Delete application for ${app.company}">
                <i class="fas fa-trash"></i> Delete
            </button>
        </div>
    `;
    
    return card;
}

// --- Application Management ---
window.editApplication = function(id) {
    const apps = getApplications();
    const app = apps.find(a => a.id === id);
    if (!app) return;
    
    // Populate form with existing data
    form.companyName.value = app.company;
    form.role.value = app.role;
    form.applicationDate.value = app.applicationDate;
    form.deadline.value = app.deadline;
    form.status.value = app.status;
    form.notes.value = app.notes;
    
    // Delete the old entry
    deleteApplication(id, false);
    
    // Scroll to form
    form.scrollIntoView({ behavior: 'smooth' });
    form.companyName.focus();
};

window.deleteApplication = function(id, showConfirm = true) {
    if (showConfirm && !confirm('Delete this application?')) return;
    
    const apps = getApplications();
    const updatedApps = apps.filter(app => app.id !== id);
    saveApplications(updatedApps);
    renderDashboard();
    
    if (showConfirm) {
        showToast('Application deleted successfully', 'info');
    }
};

// --- Enhanced Reminder System ---
function checkReminders(apps) {
    const urgentApps = apps.filter(app => {
        const days = daysUntil(app.deadline);
        return days <= 3 && days >= 0;
    });
    
    if (urgentApps.length > 0) {
        showReminderPopup(urgentApps);
    }
}

function showReminderPopup(urgentApps) {
    const overlay = document.getElementById('reminderPopupOverlay');
    const modalContent = document.getElementById('reminderPopupContent');
    
    // Create urgency-based styling and messages
    const createAppCard = (app) => {
        const days = daysUntil(app.deadline);
        let urgencyClass = '';
        let urgencyText = '';
        let timeText = '';
        
        if (days === 0) {
            urgencyClass = 'text-danger fw-bold';
            urgencyText = '🚨 DUE TODAY!';
            timeText = 'today';
        } else if (days === 1) {
            urgencyClass = 'text-warning fw-bold';
            urgencyText = '⚠️ Due Tomorrow';
            timeText = 'tomorrow';
        } else {
            urgencyClass = 'text-info';
            urgencyText = `📅 Due in ${days} days`;
            timeText = `in ${days} days`;
        }
        
        return `
            <div class="card mb-2 border-0 shadow-sm">
                <div class="card-body p-3">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h6 class="card-title mb-1 fw-bold">${app.company}</h6>
                            <p class="card-text text-muted mb-1 small">${app.role}</p>
                            <small class="${urgencyClass}">${urgencyText}</small>
                        </div>
                        <div class="text-end">
                            <span class="badge bg-light text-dark small">${formatDate(app.deadline)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    };
    
    const appCards = urgentApps.map(createAppCard).join('');
    
    modalContent.innerHTML = `
        <div class="text-center mb-3">
            <div class="display-1 text-warning mb-2">⏰</div>
            <h5 class="fw-bold mb-2">${urgentApps.length} approaching deadline${urgentApps.length > 1 ? 's' : ''}!</h5>
            <p class="text-muted small mb-3">Don't let these opportunities slip away.</p>
        </div>
        <div class="applications-list">
            ${appCards}
        </div>
        <div class="alert alert-info border-0 bg-light mt-3 p-2">
            <i class="fas fa-lightbulb me-2"></i>
            <small><strong>Tip:</strong> Click "Snooze" for 1-hour delay or "Got it!" to dismiss.</small>
        </div>
    `;
    
    // Show the popup with animation
    overlay.style.display = 'block';
    
    // Set up event handlers
    function closePopup() {
        overlay.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
            overlay.style.display = 'none';
            overlay.style.animation = '';
        }, 300);
    }
    
    function snoozeReminder() {
        closePopup();
        // Schedule reminder again in 1 hour
        setTimeout(() => {
            const currentApps = getApplications();
            checkReminders(currentApps);
        }, 60 * 60 * 1000); // 1 hour
        showToast('Reminder snoozed for 1 hour ⏰', 'info');
    }
    
    // Remove any existing event listeners
    const closeBtn = document.getElementById('closeReminderPopup');
    const snoozeBtn = document.getElementById('snoozeReminderBtn');
    const dismissBtn = document.getElementById('dismissReminderBtn');
    
    // Clone buttons to remove all event listeners
    const newCloseBtn = closeBtn.cloneNode(true);
    const newSnoozeBtn = snoozeBtn.cloneNode(true);
    const newDismissBtn = dismissBtn.cloneNode(true);
    
    closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
    snoozeBtn.parentNode.replaceChild(newSnoozeBtn, snoozeBtn);
    dismissBtn.parentNode.replaceChild(newDismissBtn, dismissBtn);
    
    // Add new event listeners
    newCloseBtn.addEventListener('click', closePopup);
    newSnoozeBtn.addEventListener('click', snoozeReminder);
    newDismissBtn.addEventListener('click', closePopup);
    
    // Auto-dismiss after 30 seconds
    setTimeout(() => {
        if (overlay.style.display === 'block') {
            closePopup();
        }
    }, 30000);
}

function showReminderToast(urgentApps) {
    const toastElement = document.getElementById('reminderToast');
    const toastBody = toastElement.querySelector('.toast-body');
    
    const messages = urgentApps.map(app => {
        const days = daysUntil(app.deadline);
        const timeText = days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`;
        return `<div><strong>${app.company}</strong> - ${app.role} (${timeText})</div>`;
    });
    
    toastBody.innerHTML = `
        <div class="mb-2">
            <strong>⚠️ ${urgentApps.length} deadline(s) approaching:</strong>
        </div>
        ${messages.join('')}
    `;
    
    const toast = new bootstrap.Toast(toastElement, {
        delay: 8000
    });
    toast.show();
}

// --- Enhanced Toast System ---
function showToast(message, type = 'info') {
    const toastContainer = document.querySelector('.toast-container');
    const toastId = 'toast-' + Date.now();
    
    const iconMap = {
        'success': 'fas fa-check-circle text-success',
        'error': 'fas fa-exclamation-circle text-danger',
        'warning': 'fas fa-exclamation-triangle text-warning',
        'info': 'fas fa-info-circle text-info'
    };
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.id = toastId;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
        <div class="toast-header">
            <i class="${iconMap[type]} me-2"></i>
            <strong class="me-auto">CareerPing</strong>
            <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    const bsToast = new bootstrap.Toast(toast, {
        delay: 4000
    });
    bsToast.show();
    
    // Remove toast element after it's hidden
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

// --- Enhanced Dark Mode ---
darkModeToggle.addEventListener('click', function() {
    const isDark = document.body.classList.toggle('dark-mode');
    
    darkModeToggle.innerHTML = isDark 
        ? '<i class="fas fa-sun me-1"></i>Light Mode'
        : '<i class="fas fa-moon me-1"></i>Dark Mode';
    
    saveDarkModePreference(isDark);
});

// --- Utility Functions ---
function daysUntil(dateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(dateStr);
    const diff = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
    return diff;
}

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

// --- Accessibility Enhancements ---
function setupAccessibility() {
    // Keyboard navigation for cards
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && e.target.classList.contains('application-card')) {
            const editBtn = e.target.querySelector('.btn-outline-primary');
            if (editBtn) editBtn.click();
        }
    });
    
    // Add tabindex to application cards
    document.addEventListener('DOMContentLoaded', function() {
        const cards = document.querySelectorAll('.application-card');
        cards.forEach(card => {
            card.setAttribute('tabindex', '0');
            card.setAttribute('role', 'button');
        });
    });
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', function() {
    // Apply saved dark mode preference
    if (getDarkModePreference()) {
        document.body.classList.add('dark-mode');
        darkModeToggle.innerHTML = '<i class="fas fa-sun me-1"></i>Light Mode';
    }
    
    // Set default application date to today
    const today = new Date().toISOString().split('T')[0];
    form.applicationDate.value = today;
    
    // Setup accessibility
    setupAccessibility();
    
    // Initial render
    renderDashboard();
    
    // Check for urgent reminders on page load
    const apps = getApplications();
    checkReminders(apps);
    
    // Setup periodic reminder checks (every 30 minutes)
    setInterval(() => {
        const apps = getApplications();
        checkReminders(apps);
    }, 30 * 60 * 1000);
});

// --- Service Worker Registration (for future PWA features) ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        // Future implementation for offline functionality
    });
}
