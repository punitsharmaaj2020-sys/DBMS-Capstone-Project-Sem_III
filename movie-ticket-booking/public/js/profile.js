/**
 * CinePass Premium - User Profile & Navbar Dropdown Manager
 * Powers:
 * - Commercial-grade user profile pill in navigation bar
 * - Interactive profile dropdown menu (Bookings, Watchlist, Edit Profile, Logout)
 * - Edit Profile Modal with:
 *     - Device photo upload (automatic canvas resize & base64 encoding)
 *     - Pre-made cinema emoji avatars (🍿, 🎬, 🦇, 🕶️, 🚀, 🎭, 👑, 🦁)
 *     - Name & Mobile phone editing
 * - Synchronization with MySQL `users` table & localStorage
 */

(function () {
    const CINEMA_PRESETS = ['🍿', '🎬', '🦇', '🕶️', '🚀', '🎭', '👑', '🦁'];

    document.addEventListener('DOMContentLoaded', () => {
        initUserProfile();
    });

    // Make functions globally accessible
    window.cinepassProfile = {
        init: initUserProfile,
        openEditModal: openEditProfileModal
    };

    function initUserProfile() {
        const userNavActions = document.getElementById('userNavActions');
        if (!userNavActions) return;

        const token = localStorage.getItem('cinepass_token');
        const userJson = localStorage.getItem('cinepass_user');

        if (token && userJson) {
            try {
                const user = JSON.parse(userJson);
                renderLoggedInNav(userNavActions, user);
                ensureEditProfileModal();
                return;
            } catch (e) {
                console.error('Error parsing cinepass_user:', e);
            }
        }

        // Guest / Not logged in state
        renderGuestNav(userNavActions);
    }

    /**
     * Render Logged-In Profile Pill & Dropdown
     */
    function renderLoggedInNav(container, user) {
        const firstName = (user.name || 'User').split(' ')[0];
        const avatarContent = formatAvatarContent(user.avatar, user.name);
        const roleBadge = user.role === 'ADMIN' ? 'ADMIN' : 'PRIME MEMBER';

        container.innerHTML = `
            <div class="user-profile-menu-wrap" id="userProfileMenuWrap">
                <button type="button" class="user-profile-btn" id="userProfileBtn" aria-expanded="false" title="Account Menu">
                    <div class="user-avatar-circle" id="navAvatarCircle">
                        ${avatarContent}
                    </div>
                    <span class="user-profile-name" id="navProfileName">${escapeHtml(firstName)}</span>
                    <span class="user-profile-chevron">▼</span>
                </button>

                <div class="user-profile-dropdown" id="userProfileDropdown">
                    <div class="dropdown-user-header">
                        <div class="user-avatar-circle" style="width: 44px; height: 44px; font-size: 1.4rem;" id="dropdownAvatarCircle">
                            ${avatarContent}
                        </div>
                        <div class="dropdown-user-info">
                            <div class="dropdown-user-name" id="dropdownUserName">${escapeHtml(user.name || 'User')}</div>
                            <div class="dropdown-user-email">${escapeHtml(user.email || '')}</div>
                            <span class="dropdown-user-badge">${roleBadge}</span>
                        </div>
                    </div>

                    <ul class="dropdown-menu-list">
                        <li>
                            <button type="button" class="dropdown-menu-item" id="dropdownEditProfileBtn">
                                <span>✏️</span>
                                <span>Edit Profile</span>
                            </button>
                        </li>
                        <li>
                            <a href="bookings.html" class="dropdown-menu-item">
                                <span>🎟️</span>
                                <span>My Bookings</span>
                            </a>
                        </li>
                        <li>
                            <a href="bookings.html?tab=watchlist" class="dropdown-menu-item">
                                <span>❤️</span>
                                <span>My Watchlist</span>
                            </a>
                        </li>
                        ${user.role === 'ADMIN' ? `
                        <li>
                            <a href="admin.html" class="dropdown-menu-item" style="color: #ffab00;">
                                <span>⚡</span>
                                <span>Admin Dashboard</span>
                            </a>
                        </li>
                        ` : ''}
                        <li>
                            <button type="button" class="dropdown-menu-item logout-item" id="dropdownLogoutBtn">
                                <span>🚪</span>
                                <span>Sign Out</span>
                            </button>
                        </li>
                    </ul>
                </div>
            </div>
        `;

        // Bind dropdown toggle
        const profileBtn = document.getElementById('userProfileBtn');
        const dropdown = document.getElementById('userProfileDropdown');

        if (profileBtn && dropdown) {
            profileBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = dropdown.classList.contains('show');
                dropdown.classList.toggle('show', !isOpen);
                profileBtn.classList.toggle('active', !isOpen);
            });

            // Close on outside click
            document.addEventListener('click', (e) => {
                if (!container.contains(e.target)) {
                    dropdown.classList.remove('show');
                    profileBtn.classList.remove('active');
                }
            });
        }

        // Edit Profile Button
        const editBtn = document.getElementById('dropdownEditProfileBtn');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                if (dropdown) dropdown.classList.remove('show');
                if (profileBtn) profileBtn.classList.remove('active');
                openEditProfileModal();
            });
        }

        // Logout Button
        const logoutBtn = document.getElementById('dropdownLogoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                localStorage.removeItem('cinepass_token');
                localStorage.removeItem('cinepass_user');
                window.location.reload();
            });
        }
    }

    /**
     * Render Guest Navigation (Sign In Button)
     */
    function renderGuestNav(container) {
        container.innerHTML = `
            <button class="btn btn-primary btn-auth-nav" id="openAuthModalBtn">
                <span>Sign In</span>
            </button>
        `;
        const openAuthBtn = document.getElementById('openAuthModalBtn');
        if (openAuthBtn) {
            openAuthBtn.addEventListener('click', () => {
                const modal = document.getElementById('authModal');
                if (modal) {
                    modal.classList.add('active');
                    modal.style.display = 'flex';
                } else {
                    window.location.href = 'index.html';
                }
            });
        }
    }

    /**
     * Helper to render avatar as either image or emoji/initials
     */
    function formatAvatarContent(avatarStr, fallbackName) {
        if (!avatarStr) {
            const initial = fallbackName ? fallbackName.trim().charAt(0).toUpperCase() : '👤';
            return `<span style="font-weight: 700; color: #fff;">${initial}</span>`;
        }

        // If data URL image or HTTP URL
        if (avatarStr.startsWith('data:image') || avatarStr.startsWith('http://') || avatarStr.startsWith('https://')) {
            return `<img src="${avatarStr}" alt="User Avatar">`;
        }

        // Otherwise emoji avatar
        return `<span>${avatarStr}</span>`;
    }

    /**
     * Ensure Edit Profile Modal exists in the document
     */
    function ensureEditProfileModal() {
        if (document.getElementById('editProfileModal')) return;

        const modalDiv = document.createElement('div');
        modalDiv.id = 'editProfileModal';
        modalDiv.className = 'modal-overlay';
        modalDiv.setAttribute('role', 'dialog');
        modalDiv.setAttribute('aria-modal', 'true');
        modalDiv.style.display = 'none';

        let presetsHtml = '';
        CINEMA_PRESETS.forEach(p => {
            presetsHtml += `<button type="button" class="preset-avatar-btn" data-preset="${p}" title="Select ${p}">${p}</button>`;
        });

        modalDiv.innerHTML = `
            <div class="modal-card" style="max-width: 480px; padding: 28px;">
                <button type="button" class="modal-close-btn" id="closeEditProfileBtn">&times;</button>
                
                <div class="modal-header text-center" style="margin-bottom: 20px;">
                    <h2 class="modal-title" style="font-size: 1.5rem; color: #fff;">Edit Profile</h2>
                    <p class="section-subtitle">Customize your avatar, display photo, and personal details</p>
                </div>

                <!-- Avatar Customization Section -->
                <div class="avatar-selection-wrap">
                    <div class="avatar-large-preview" id="editAvatarPreview">
                        <span id="editAvatarPreviewContent">👤</span>
                    </div>

                    <div style="display: flex; justify-content: center; gap: 12px; margin-bottom: 14px;">
                        <label for="devicePhotoInput" class="upload-device-photo-btn">
                            <span>📁 Upload Photo from Device</span>
                        </label>
                        <input type="file" id="devicePhotoInput" accept="image/png, image/jpeg, image/webp" style="display: none;">
                    </div>

                    <div style="font-size: 0.78rem; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px; margin-bottom: 6px;">
                        Or Choose a Cinema Avatar
                    </div>
                    <div class="avatar-cinema-presets" id="cinemaPresetsWrap">
                        ${presetsHtml}
                    </div>
                </div>

                <!-- Alert Message -->
                <div id="editProfileAlert" class="alert hidden" style="margin-bottom: 16px;"></div>

                <!-- Form Fields -->
                <form id="editProfileForm">
                    <div class="form-group">
                        <label class="form-label" for="profileEditName">Full Name *</label>
                        <input type="text" id="profileEditName" class="form-control" required placeholder="Your full name">
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="profileEditPhone">Mobile Number</label>
                        <input type="tel" id="profileEditPhone" class="form-control" placeholder="+91 9876543210">
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="profileEditEmail">Email Address</label>
                        <input type="email" id="profileEditEmail" class="form-control" readonly style="opacity: 0.7; cursor: not-allowed;" title="Email cannot be changed">
                    </div>

                    <div style="display: flex; gap: 10px; margin-top: 24px;">
                        <button type="button" class="btn btn-secondary" id="cancelEditProfileBtn" style="flex: 1;">Cancel</button>
                        <button type="submit" class="btn btn-primary" id="saveProfileBtn" style="flex: 2;">
                            <span>✓ Save Changes</span>
                        </button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modalDiv);

        // Bind events
        bindEditProfileEvents(modalDiv);
    }

    let selectedAvatarValue = null;

    function bindEditProfileEvents(modal) {
        const closeBtn = document.getElementById('closeEditProfileBtn');
        const cancelBtn = document.getElementById('cancelEditProfileBtn');
        const fileInput = document.getElementById('devicePhotoInput');
        const presetsWrap = document.getElementById('cinemaPresetsWrap');
        const form = document.getElementById('editProfileForm');

        function closeModal() {
            modal.classList.remove('active');
            modal.style.display = 'none';
        }

        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        // Device Photo Upload with automatic Canvas compression
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;

                if (!file.type.startsWith('image/')) {
                    alert('Please select a valid image file (PNG, JPG, WEBP).');
                    return;
                }

                const reader = new FileReader();
                reader.onload = function (evt) {
                    const img = new Image();
                    img.onload = function () {
                        // Resize image to max 250x250 for lightweight, fast base64 storage
                        const canvas = document.createElement('canvas');
                        const MAX_SIZE = 240;
                        let width = img.width;
                        let height = img.height;

                        if (width > height) {
                            if (width > MAX_SIZE) {
                                height = Math.round(height * (MAX_SIZE / width));
                                width = MAX_SIZE;
                            }
                        } else {
                            if (height > MAX_SIZE) {
                                width = Math.round(width * (MAX_SIZE / height));
                                height = MAX_SIZE;
                            }
                        }

                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);

                        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
                        selectedAvatarValue = compressedDataUrl;
                        updatePreview(compressedDataUrl);

                        // Clear preset selections
                        if (presetsWrap) {
                            presetsWrap.querySelectorAll('.preset-avatar-btn').forEach(b => b.classList.remove('selected'));
                        }
                    };
                    img.src = evt.target.result;
                };
                reader.readAsDataURL(file);
            });
        }

        // Cinema Emoji Presets
        if (presetsWrap) {
            presetsWrap.addEventListener('click', (e) => {
                const btn = e.target.closest('.preset-avatar-btn');
                if (!btn) return;
                const emoji = btn.getAttribute('data-preset');
                selectedAvatarValue = emoji;
                updatePreview(emoji);

                presetsWrap.querySelectorAll('.preset-avatar-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
            });
        }

        // Save Profile Form Submission
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const nameInput = document.getElementById('profileEditName');
                const phoneInput = document.getElementById('profileEditPhone');
                const alertEl = document.getElementById('editProfileAlert');
                const saveBtn = document.getElementById('saveProfileBtn');

                const name = nameInput.value.trim();
                const phone = phoneInput.value.trim();
                const token = localStorage.getItem('cinepass_token');

                if (!name) {
                    if (alertEl) {
                        alertEl.textContent = 'Name cannot be empty';
                        alertEl.className = 'alert alert-error';
                        alertEl.classList.remove('hidden');
                    }
                    return;
                }

                if (saveBtn) {
                    saveBtn.disabled = true;
                    saveBtn.innerHTML = '<span>⏳ Saving...</span>';
                }

                try {
                    const res = await fetch('/api/auth/profile', {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            name,
                            phone,
                            avatar: selectedAvatarValue
                        })
                    });

                    const data = await res.json();

                    if (!res.ok || !data.success) {
                        throw new Error(data.message || 'Failed to update profile.');
                    }

                    // Update localStorage
                    const user = data.user || {};
                    const currentLocalUser = JSON.parse(localStorage.getItem('cinepass_user') || '{}');
                    const updatedLocalUser = { ...currentLocalUser, ...user };
                    localStorage.setItem('cinepass_user', JSON.stringify(updatedLocalUser));

                    // Update Navbar immediately
                    initUserProfile();

                    // Close modal and show success toast
                    closeModal();
                    showSuccessToast('✓ Profile updated successfully!');

                } catch (err) {
                    console.error('Error saving profile:', err);
                    if (alertEl) {
                        alertEl.textContent = err.message || 'Error updating profile';
                        alertEl.className = 'alert alert-error';
                        alertEl.classList.remove('hidden');
                    }
                } finally {
                    if (saveBtn) {
                        saveBtn.disabled = false;
                        saveBtn.innerHTML = '<span>✓ Save Changes</span>';
                    }
                }
            });
        }
    }

    function updatePreview(val) {
        const previewEl = document.getElementById('editAvatarPreviewContent');
        if (!previewEl) return;
        previewEl.innerHTML = formatAvatarContent(val, 'U');
    }

    /**
     * Open and prefill Edit Profile Modal
     */
    function openEditProfileModal() {
        ensureEditProfileModal();
        const modal = document.getElementById('editProfileModal');
        if (!modal) return;

        const userJson = localStorage.getItem('cinepass_user');
        if (!userJson) {
            alert('Please sign in to edit your profile.');
            return;
        }

        const user = JSON.parse(userJson);
        const nameInput = document.getElementById('profileEditName');
        const phoneInput = document.getElementById('profileEditPhone');
        const emailInput = document.getElementById('profileEditEmail');
        const alertEl = document.getElementById('editProfileAlert');

        if (nameInput) nameInput.value = user.name || '';
        if (phoneInput) phoneInput.value = user.phone || '';
        if (emailInput) emailInput.value = user.email || '';
        if (alertEl) alertEl.classList.add('hidden');

        selectedAvatarValue = user.avatar || null;
        updatePreview(selectedAvatarValue);

        // Highlight preset if matching
        const presetsWrap = document.getElementById('cinemaPresetsWrap');
        if (presetsWrap) {
            presetsWrap.querySelectorAll('.preset-avatar-btn').forEach(b => {
                b.classList.toggle('selected', b.getAttribute('data-preset') === selectedAvatarValue);
            });
        }

        modal.classList.add('active');
        modal.style.display = 'flex';
    }

    function showSuccessToast(message) {
        let toast = document.getElementById('cinepassToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'cinepassToast';
            toast.style.cssText = `
                position: fixed;
                bottom: 30px;
                right: 30px;
                background: linear-gradient(135deg, #00c853, #00b0ff);
                color: #fff;
                padding: 14px 24px;
                border-radius: 50px;
                font-weight: 600;
                font-size: 0.95rem;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
                z-index: 9999;
                transition: opacity 0.3s ease, transform 0.3s ease;
                display: flex;
                align-items: center;
                gap: 10px;
            `;
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';
        }, 3200);
    }

    function escapeHtml(str) {
        if (!str && str !== 0) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
})();
