/**
 * Movie Ticket Booking System - Admin Panel JavaScript
 * Handles token-based session verification, dashboard analytics,
 * movie CRUD operations, show scheduling, and booking inspection/cancellation.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Top-level containers
    const authChecking = document.getElementById('authChecking');
    const loginSection = document.getElementById('adminLoginSection');
    const dashboardSection = document.getElementById('adminDashboardSection');

    // Login Form Elements
    const loginForm = document.getElementById('adminLoginForm');
    const usernameInput = document.getElementById('adminUsername');
    const passwordInput = document.getElementById('adminPassword');
    const loginBtn = document.getElementById('loginBtn');
    const loginAlert = document.getElementById('loginAlert');

    // Dashboard Header
    const logoutBtn = document.getElementById('logoutBtn');
    const globalAlert = document.getElementById('adminGlobalAlert');
    const adminUserDisplay = document.getElementById('adminUserDisplay');
    const adminAvatarInitial = document.getElementById('adminAvatarInitial');

    // Metric Stats
    const statTotalMovies = document.getElementById('statTotalMovies');
    const statTotalBookings = document.getElementById('statTotalBookings');
    const statTotalRevenue = document.getElementById('statTotalRevenue');
    const statTicketsSold = document.getElementById('statTicketsSold');

    // Tabs
    const tabBtns = document.querySelectorAll('.admin-tab-btn');
    const tabPanes = document.querySelectorAll('.admin-tab-pane');

    // Movies Management
    const addMovieForm = document.getElementById('addMovieForm');
    const addMovieBtn = document.getElementById('addMovieBtn');
    const moviesTableBody = document.getElementById('moviesTableBody');
    const moviesCatalogCount = document.getElementById('moviesCatalogCount');

    // Edit Movie Modal Elements
    const editModal = document.getElementById('editMovieModal');
    const editMovieForm = document.getElementById('editMovieForm');
    const closeEditModalBtn = document.getElementById('closeEditModalBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const saveEditMovieBtn = document.getElementById('saveEditMovieBtn');
    const editMovieId = document.getElementById('editMovieId');
    const editTitle = document.getElementById('editTitle');
    const editGenre = document.getElementById('editGenre');
    const editDuration = document.getElementById('editDuration');
    const editLanguage = document.getElementById('editLanguage');
    const editReleaseDate = document.getElementById('editReleaseDate');
    const editPoster = document.getElementById('editPoster');
    const editDescription = document.getElementById('editDescription');

    // Delete Movie Modal Elements
    const deleteModal = document.getElementById('deleteMovieModal');
    const closeDeleteModalBtn = document.getElementById('closeDeleteModalBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteMovieBtn = document.getElementById('confirmDeleteMovieBtn');
    const deleteMovieTitleDisplay = document.getElementById('deleteMovieTitleDisplay');
    const deleteMovieIdInput = document.getElementById('deleteMovieId');

    // Shows Management
    const addShowForm = document.getElementById('addShowForm');
    const addShowBtn = document.getElementById('addShowBtn');
    const showMovieSelect = document.getElementById('showMovieSelect');
    const filterShowsMovieSelect = document.getElementById('filterShowsMovieSelect');
    const showsTableBody = document.getElementById('showsTableBody');

    // Bookings Management
    const bookingsTableBody = document.getElementById('bookingsTableBody');
    const adminBookingsCount = document.getElementById('adminBookingsCount');

    // In-memory data store for quick access
    let cachedMovies = [];
    let cachedBookings = [];

    // =========================================================================
    // INITIALIZATION & AUTHENTICATION
    // =========================================================================
    checkAuth();

    async function checkAuth() {
        const token = sessionStorage.getItem('adminToken');
        if (!token) {
            showLogin();
            return;
        }

        if (authChecking) authChecking.style.display = 'flex';

        try {
            const res = await adminFetch('/api/admin/verify');
            const data = await res.json();

            if (res.ok && data.success) {
                showDashboard();
                loadDashboard();
            } else {
                showLogin();
            }
        } catch (err) {
            console.warn('Session verification failed:', err.message);
            showLogin();
        } finally {
            if (authChecking) authChecking.style.display = 'none';
        }
    }

    function showLogin() {
        if (authChecking) authChecking.style.display = 'none';
        if (loginSection) {
            loginSection.classList.remove('hidden');
            loginSection.style.display = 'flex';
        }
        if (dashboardSection) {
            dashboardSection.classList.add('hidden');
            dashboardSection.style.display = 'none';
        }
    }

    function showDashboard() {
        if (authChecking) authChecking.style.display = 'none';
        if (loginSection) {
            loginSection.classList.add('hidden');
            loginSection.style.display = 'none';
        }
        if (dashboardSection) {
            dashboardSection.classList.remove('hidden');
            dashboardSection.style.display = 'block';
        }

        const username = sessionStorage.getItem('adminUsername') || 'admin';
        if (adminUserDisplay) adminUserDisplay.textContent = username;
        if (adminAvatarInitial) adminAvatarInitial.textContent = username.charAt(0).toUpperCase();
    }

    // =========================================================================
    // AUTHENTICATED FETCH HELPER
    // =========================================================================
    async function adminFetch(url, options = {}) {
        const token = sessionStorage.getItem('adminToken');
        if (!options.headers) options.headers = {};
        options.headers['Authorization'] = 'Bearer ' + token;
        options.headers['Content-Type'] = 'application/json';

        const response = await fetch(url, options);

        if (response.status === 401) {
            sessionStorage.removeItem('adminToken');
            sessionStorage.removeItem('adminUsername');
            showLogin();
            throw new Error('Session expired. Please log in again.');
        }

        return response;
    }

    // =========================================================================
    // LOGIN FORM HANDLER
    // =========================================================================
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideLoginAlert();

            const username = (usernameInput ? usernameInput.value : '').trim();
            const password = (passwordInput ? passwordInput.value : '').trim();

            if (!username || !password) {
                showLoginAlert('Please enter both username and password.');
                return;
            }

            if (loginBtn) {
                loginBtn.disabled = true;
                loginBtn.textContent = 'Authenticating...';
            }

            try {
                const response = await fetch('/api/admin/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();

                if (!response.ok || !data.success || !data.token) {
                    throw new Error(data.message || 'Invalid administrator credentials.');
                }

                // Store token
                sessionStorage.setItem('adminToken', data.token);
                sessionStorage.setItem('adminUsername', username);

                // Show dashboard and populate data
                showDashboard();
                loadDashboard();

            } catch (err) {
                console.error('Login error:', err);
                showLoginAlert(err.message || 'Login failed. Please verify credentials.');
            } finally {
                if (loginBtn) {
                    loginBtn.disabled = false;
                    loginBtn.textContent = 'Sign In to Dashboard';
                }
            }
        });
    }

    // =========================================================================
    // LOGOUT HANDLER
    // =========================================================================
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await adminFetch('/api/admin/logout', { method: 'POST' });
            } catch (e) {
                // Ignore errors during logout
            } finally {
                sessionStorage.removeItem('adminToken');
                sessionStorage.removeItem('adminUsername');
                showLogin();
                if (loginAlert) {
                    showLoginAlert('You have been logged out successfully.', 'success');
                }
            }
        });
    }

    // =========================================================================
    // TAB SWITCHING
    // =========================================================================
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-selected', 'false');
            });
            tabPanes.forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');
            const targetPaneId = btn.getAttribute('data-tab');
            const targetPane = document.getElementById(targetPaneId);
            if (targetPane) {
                targetPane.classList.add('active');
            }

            // Lazy refresh corresponding tab data
            if (targetPaneId === 'tabShowsPane') {
                loadShowsData();
            } else if (targetPaneId === 'tabBookingsPane') {
                loadBookings();
            } else if (targetPaneId === 'tabMoviesPane') {
                loadMovies();
            }
        });
    });

    // =========================================================================
    // DASHBOARD DATA LOADER
    // =========================================================================
    async function loadDashboard() {
        await Promise.all([
            loadStats(),
            loadMovies(),
            loadBookings()
        ]);
        populateMovieDropdowns();
    }

    /**
     * Fetch & display dashboard metrics
     */
    async function loadStats() {
        try {
            const res = await adminFetch('/api/admin/stats');
            const data = await res.json();

            if (res.ok && data.success && data.data) {
                const s = data.data;
                if (statTotalMovies) statTotalMovies.textContent = s.totalMovies || 0;
                if (statTotalBookings) statTotalBookings.textContent = s.totalBookings || 0;
                if (statTotalRevenue) statTotalRevenue.textContent = formatCurrency(s.totalRevenue || 0);
                if (statTicketsSold) statTicketsSold.textContent = s.totalTicketsSold || 0;
            }
        } catch (err) {
            console.error('Error fetching admin stats:', err);
        }
    }

    // =========================================================================
    // MOVIES MANAGEMENT (CRUD)
    // =========================================================================
    /**
     * Fetch movies catalog and render in admin table
     */
    async function loadMovies() {
        try {
            const res = await adminFetch('/api/admin/movies');
            const data = await res.json();

            if (res.ok && data.success && Array.isArray(data.data)) {
                cachedMovies = data.data;
                renderMoviesTable(cachedMovies);
                populateMovieDropdowns();
            }
        } catch (err) {
            console.error('Error loading admin movies:', err);
            showGlobalAlert('Failed to load movies list: ' + err.message, 'error');
        }
    }

    function renderMoviesTable(movies) {
        if (!moviesTableBody) return;
        moviesTableBody.innerHTML = '';

        if (moviesCatalogCount) {
            moviesCatalogCount.textContent = `${movies.length} Movie${movies.length === 1 ? '' : 's'} in Catalog`;
        }

        if (movies.length === 0) {
            moviesTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-muted" style="padding: 30px;">
                        No movies currently in catalog. Add one using the form above.
                    </td>
                </tr>
            `;
            return;
        }

        movies.forEach(movie => {
            const tr = document.createElement('tr');
            const fallbackPoster = 'https://placehold.co/80x120/1a1a2e/e94560?text=No+Poster';
            const posterSrc = movie.poster_url || fallbackPoster;

            tr.innerHTML = `
                <td>
                    <img src="${escapeHtml(posterSrc)}" alt="${escapeHtml(movie.title)}" 
                         style="width: 44px; height: 60px; object-fit: cover; border-radius: 6px;"
                         onerror="this.src='${fallbackPoster}'">
                </td>
                <td>
                    <strong style="color: #fff; font-size: 0.95rem;">${escapeHtml(movie.title)}</strong>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">ID: #${movie.movie_id}</div>
                </td>
                <td><span class="badge badge-genre">${escapeHtml(movie.genre || '')}</span></td>
                <td>⏱ ${movie.duration_minutes || 0}m</td>
                <td><span class="language-badge" style="position: static;">${escapeHtml(movie.language || 'English')}</span></td>
                <td>${formatDate(movie.release_date)}</td>
                <td style="text-align: right; white-space: nowrap;">
                    <button type="button" class="btn btn-secondary btn-sm edit-movie-btn" style="margin-right: 6px;">
                        ✏️ Edit
                    </button>
                    <button type="button" class="btn btn-outline-danger btn-sm delete-movie-btn">
                        🗑️ Delete
                    </button>
                </td>
            `;

            // Setup buttons
            const editBtn = tr.querySelector('.edit-movie-btn');
            const delBtn = tr.querySelector('.delete-movie-btn');

            if (editBtn) {
                editBtn.addEventListener('click', () => openEditModal(movie));
            }
            if (delBtn) {
                delBtn.addEventListener('click', () => openDeleteModal(movie));
            }

            moviesTableBody.appendChild(tr);
        });
    }

    /**
     * Add Movie Form Submission
     */
    if (addMovieForm) {
        addMovieForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideGlobalAlert();

            const title = (document.getElementById('movieTitle')?.value || '').trim();
            const genre = (document.getElementById('movieGenre')?.value || '').trim();
            const language = (document.getElementById('movieLanguage')?.value || '').trim();
            const duration = parseInt(document.getElementById('movieDuration')?.value, 10);
            const release_date = document.getElementById('movieReleaseDate')?.value || null;
            const poster_url = (document.getElementById('moviePoster')?.value || '').trim();
            const description = (document.getElementById('movieDescription')?.value || '').trim();

            if (!title || !genre || isNaN(duration) || duration <= 0 || !language) {
                showGlobalAlert('Please fill in all required fields. Duration must be a positive number.', 'error');
                return;
            }

            if (addMovieBtn) {
                addMovieBtn.disabled = true;
                addMovieBtn.textContent = 'Adding Movie...';
            }

            try {
                const res = await adminFetch('/api/admin/movies', {
                    method: 'POST',
                    body: JSON.stringify({
                        title,
                        genre,
                        duration_minutes: duration,
                        language,
                        release_date,
                        poster_url,
                        description
                    })
                });

                const data = await res.json();

                if (!res.ok || !data.success) {
                    throw new Error(data.message || 'Failed to add movie.');
                }

                showGlobalAlert(`Movie "${title}" added successfully!`, 'success');
                addMovieForm.reset();

                // Refresh movies list & stats
                await loadMovies();
                loadStats();

            } catch (err) {
                console.error('Error adding movie:', err);
                showGlobalAlert(err.message || 'Error adding movie.', 'error');
            } finally {
                if (addMovieBtn) {
                    addMovieBtn.disabled = false;
                    addMovieBtn.textContent = 'Add Movie to Catalog';
                }
            }
        });
    }

    /**
     * Edit Movie Modal Logic
     */
    function openEditModal(movie) {
        if (!editModal) return;

        if (editMovieId) editMovieId.value = movie.movie_id;
        if (editTitle) editTitle.value = movie.title || '';
        if (editGenre) editGenre.value = movie.genre || '';
        if (editDuration) editDuration.value = movie.duration_minutes || '';
        if (editLanguage) editLanguage.value = movie.language || '';
        if (editReleaseDate) {
            editReleaseDate.value = movie.release_date ? movie.release_date.split('T')[0] : '';
        }
        if (editPoster) editPoster.value = movie.poster_url || '';
        if (editDescription) editDescription.value = movie.description || '';

        editModal.classList.add('active');
        editModal.style.display = 'flex';
    }

    function closeEditModal() {
        if (editModal) {
            editModal.classList.remove('active');
            editModal.style.display = 'none';
        }
    }

    if (closeEditModalBtn) closeEditModalBtn.addEventListener('click', closeEditModal);
    if (cancelEditBtn) cancelEditBtn.addEventListener('click', closeEditModal);
    if (editModal) {
        editModal.addEventListener('click', (e) => {
            if (e.target === editModal) closeEditModal();
        });
    }

    if (editMovieForm) {
        editMovieForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = editMovieId?.value;
            if (!id) return;

            const title = (editTitle?.value || '').trim();
            const genre = (editGenre?.value || '').trim();
            const duration = parseInt(editDuration?.value, 10);
            const language = (editLanguage?.value || '').trim();
            const release_date = editReleaseDate?.value || null;
            const poster_url = (editPoster?.value || '').trim();
            const description = (editDescription?.value || '').trim();

            if (!title || !genre || isNaN(duration) || duration <= 0 || !language) {
                showGlobalAlert('Please fill in all required fields.', 'error');
                return;
            }

            if (saveEditMovieBtn) {
                saveEditMovieBtn.disabled = true;
                saveEditMovieBtn.textContent = 'Saving...';
            }

            try {
                const res = await adminFetch(`/api/admin/movies/${encodeURIComponent(id)}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        title,
                        genre,
                        duration_minutes: duration,
                        language,
                        release_date,
                        poster_url,
                        description
                    })
                });

                const data = await res.json();

                if (!res.ok || !data.success) {
                    throw new Error(data.message || 'Failed to update movie.');
                }

                closeEditModal();
                showGlobalAlert(`Movie "${title}" updated successfully!`, 'success');
                await loadMovies();

            } catch (err) {
                console.error('Error updating movie:', err);
                showGlobalAlert(err.message || 'Error updating movie.', 'error');
            } finally {
                if (saveEditMovieBtn) {
                    saveEditMovieBtn.disabled = false;
                    saveEditMovieBtn.textContent = 'Save Changes';
                }
            }
        });
    }

    /**
     * Delete Movie Modal Logic
     */
    function openDeleteModal(movie) {
        if (!deleteModal) return;
        if (deleteMovieIdInput) deleteMovieIdInput.value = movie.movie_id;
        if (deleteMovieTitleDisplay) deleteMovieTitleDisplay.textContent = `"${movie.title}" (ID: #${movie.movie_id})`;

        deleteModal.classList.add('active');
        deleteModal.style.display = 'flex';
    }

    function closeDeleteModal() {
        if (deleteModal) {
            deleteModal.classList.remove('active');
            deleteModal.style.display = 'none';
        }
    }

    if (closeDeleteModalBtn) closeDeleteModalBtn.addEventListener('click', closeDeleteModal);
    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    if (deleteModal) {
        deleteModal.addEventListener('click', (e) => {
            if (e.target === deleteModal) closeDeleteModal();
        });
    }

    if (confirmDeleteMovieBtn) {
        confirmDeleteMovieBtn.addEventListener('click', async () => {
            const id = deleteMovieIdInput?.value;
            if (!id) return;

            confirmDeleteMovieBtn.disabled = true;
            confirmDeleteMovieBtn.textContent = 'Deleting...';

            try {
                const res = await adminFetch(`/api/admin/movies/${encodeURIComponent(id)}`, {
                    method: 'DELETE'
                });

                const data = await res.json();

                if (!res.ok || !data.success) {
                    throw new Error(data.message || 'Failed to delete movie.');
                }

                closeDeleteModal();
                showGlobalAlert('Movie deleted successfully.', 'success');
                await loadMovies();
                loadStats();

            } catch (err) {
                console.error('Error deleting movie:', err);
                closeDeleteModal();
                showGlobalAlert(err.message || 'Failed to delete movie.', 'error');
            } finally {
                confirmDeleteMovieBtn.disabled = false;
                confirmDeleteMovieBtn.textContent = 'Delete Movie';
            }
        });
    }

    // =========================================================================
    // SHOWS MANAGEMENT
    // =========================================================================
    function populateMovieDropdowns() {
        if (showMovieSelect) {
            const currentVal = showMovieSelect.value;
            showMovieSelect.innerHTML = '<option value="" disabled selected>-- Select a movie --</option>';
            cachedMovies.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m.movie_id;
                opt.textContent = `${m.title} (${m.language || 'English'})`;
                if (String(m.movie_id) === String(currentVal)) opt.selected = true;
                showMovieSelect.appendChild(opt);
            });
        }

        if (filterShowsMovieSelect) {
            const currentFilter = filterShowsMovieSelect.value || 'all';
            filterShowsMovieSelect.innerHTML = '<option value="all">All Movies</option>';
            cachedMovies.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m.movie_id;
                opt.textContent = m.title;
                if (String(m.movie_id) === String(currentFilter)) opt.selected = true;
                filterShowsMovieSelect.appendChild(opt);
            });
        }
    }

    if (filterShowsMovieSelect) {
        filterShowsMovieSelect.addEventListener('change', () => {
            loadShowsData();
        });
    }

    async function loadShowsData() {
        if (!showsTableBody) return;
        showsTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted" style="padding: 24px;">
                    <div class="spinner" style="width: 24px; height: 24px; margin: 0 auto 10px;"></div>
                    Loading scheduled showtimes...
                </td>
            </tr>
        `;

        try {
            const filterVal = filterShowsMovieSelect?.value || 'all';
            let allShows = [];

            if (filterVal === 'all') {
                // Fetch shows for all movies
                const showPromises = cachedMovies.map(m =>
                    fetch(`/api/shows/movie/${m.movie_id}`)
                        .then(r => r.json())
                        .then(d => (d.success && Array.isArray(d.data)) ? d.data.map(s => ({ ...s, movie_title: m.title })) : [])
                        .catch(() => [])
                );

                const nested = await Promise.all(showPromises);
                allShows = nested.flat();
            } else {
                // Fetch for specific movie
                const res = await fetch(`/api/shows/movie/${encodeURIComponent(filterVal)}`);
                const data = await res.json();
                const movie = cachedMovies.find(m => String(m.movie_id) === String(filterVal));
                if (res.ok && data.success && Array.isArray(data.data)) {
                    allShows = data.data.map(s => ({ ...s, movie_title: movie ? movie.title : 'Movie' }));
                }
            }

            renderShowsTable(allShows);

        } catch (err) {
            console.error('Error loading shows:', err);
            showsTableBody.innerHTML = `
                <tr><td colspan="7" class="text-center text-danger" style="padding: 20px;">Failed to load shows: ${escapeHtml(err.message)}</td></tr>
            `;
        }
    }

    function renderShowsTable(shows) {
        if (!showsTableBody) return;
        showsTableBody.innerHTML = '';

        if (!shows || shows.length === 0) {
            showsTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-muted" style="padding: 24px;">
                        No scheduled shows found. Use the form above to add a new showtime.
                    </td>
                </tr>
            `;
            return;
        }

        // Sort shows chronologically
        shows.sort((a, b) => new Date(`${a.show_date} ${a.show_time}`) - new Date(`${b.show_date} ${b.show_time}`));

        shows.forEach(s => {
            const tr = document.createElement('tr');
            const isSoldOut = Number(s.available_seats) <= 0;

            tr.innerHTML = `
                <td><strong>#SH${s.show_id}</strong></td>
                <td><strong style="color: #fff;">${escapeHtml(s.movie_title || 'Movie')}</strong></td>
                <td>${formatDate(s.show_date)}</td>
                <td>${formatTime(s.show_time)}</td>
                <td>${formatCurrency(s.ticket_price)}</td>
                <td>
                    <span style="font-weight: 600; color: ${isSoldOut ? 'var(--status-cancelled)' : '#00e676'}">
                        ${s.available_seats}
                    </span> / ${s.total_seats}
                </td>
                <td>
                    <span class="badge ${isSoldOut ? 'status-cancelled' : 'status-confirmed'}">
                        ${isSoldOut ? 'SOLD OUT' : 'AVAILABLE'}
                    </span>
                </td>
            `;

            showsTableBody.appendChild(tr);
        });
    }

    /**
     * Add Show Form Submission
     */
    if (addShowForm) {
        addShowForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideGlobalAlert();

            const movie_id = showMovieSelect ? parseInt(showMovieSelect.value, 10) : NaN;
            const show_date = document.getElementById('showDate')?.value;
            const show_time = document.getElementById('showTime')?.value;
            const ticket_price = parseFloat(document.getElementById('showPrice')?.value);
            const total_seats = parseInt(document.getElementById('showTotalSeats')?.value, 10);

            if (isNaN(movie_id) || !show_date || !show_time || isNaN(ticket_price) || ticket_price <= 0 || isNaN(total_seats) || total_seats <= 0) {
                showGlobalAlert('Please fill in all fields with valid numbers and select a movie.', 'error');
                return;
            }

            if (addShowBtn) {
                addShowBtn.disabled = true;
                addShowBtn.textContent = 'Scheduling Show...';
            }

            try {
                const res = await adminFetch('/api/admin/shows', {
                    method: 'POST',
                    body: JSON.stringify({
                        movie_id,
                        show_date,
                        show_time,
                        ticket_price,
                        total_seats
                    })
                });

                const data = await res.json();

                if (!res.ok || !data.success) {
                    throw new Error(data.message || 'Failed to schedule show.');
                }

                showGlobalAlert('Showtime scheduled successfully!', 'success');
                addShowForm.reset();
                loadShowsData();

            } catch (err) {
                console.error('Error scheduling show:', err);
                showGlobalAlert(err.message || 'Failed to schedule show.', 'error');
            } finally {
                if (addShowBtn) {
                    addShowBtn.disabled = false;
                    addShowBtn.textContent = 'Schedule Show';
                }
            }
        });
    }

    // =========================================================================
    // BOOKINGS MANAGEMENT
    // =========================================================================
    async function loadBookings() {
        if (!bookingsTableBody) return;
        bookingsTableBody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-muted" style="padding: 24px;">
                    <div class="spinner" style="width: 24px; height: 24px; margin: 0 auto 10px;"></div>
                    Loading all bookings...
                </td>
            </tr>
        `;

        try {
            const res = await adminFetch('/api/admin/bookings');
            const data = await res.json();

            if (res.ok && data.success && Array.isArray(data.data)) {
                cachedBookings = data.data;
                renderBookingsTable(cachedBookings);
            }
        } catch (err) {
            console.error('Error fetching admin bookings:', err);
            bookingsTableBody.innerHTML = `
                <tr><td colspan="9" class="text-center text-danger" style="padding: 20px;">Failed to load bookings: ${escapeHtml(err.message)}</td></tr>
            `;
        }
    }

    function renderBookingsTable(bookings) {
        if (!bookingsTableBody) return;
        bookingsTableBody.innerHTML = '';

        if (adminBookingsCount) {
            adminBookingsCount.textContent = `${bookings.length} Total Reservation${bookings.length === 1 ? '' : 's'}`;
        }

        if (bookings.length === 0) {
            bookingsTableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center text-muted" style="padding: 30px;">
                        No customer bookings found in the database.
                    </td>
                </tr>
            `;
            return;
        }

        bookings.forEach(b => {
            const tr = document.createElement('tr');
            const isConfirmed = (b.booking_status || 'CONFIRMED').toUpperCase() === 'CONFIRMED';
            const statusClass = isConfirmed ? 'status-confirmed' : 'status-cancelled';

            tr.innerHTML = `
                <td><strong>#BK${b.booking_id}</strong></td>
                <td><strong style="color:#fff;">${escapeHtml(b.customer_name)}</strong></td>
                <td>${escapeHtml(b.email)}</td>
                <td>${escapeHtml(b.movie_title || 'Movie')}</td>
                <td>${formatDate(b.show_date)} <span class="text-muted" style="font-size:0.8rem;">(${formatTime(b.show_time)})</span></td>
                <td>🎟️ ${b.number_of_tickets}</td>
                <td><strong style="color: var(--accent-red);">${formatCurrency(b.total_amount)}</strong></td>
                <td><span class="badge ${statusClass}">${b.booking_status}</span></td>
                <td style="text-align: right;">
                    ${isConfirmed ? `
                        <button type="button" class="btn btn-outline-danger btn-sm admin-cancel-booking-btn" data-id="${b.booking_id}">
                            Cancel
                        </button>
                    ` : `
                        <span class="text-muted" style="font-size:0.8rem;">Cancelled</span>
                    `}
                </td>
            `;

            if (isConfirmed) {
                const cancelBtn = tr.querySelector('.admin-cancel-booking-btn');
                if (cancelBtn) {
                    cancelBtn.addEventListener('click', () => {
                        const confirmed = window.confirm(`Are you sure you want to cancel booking #BK${b.booking_id} for ${b.customer_name}?`);
                        if (confirmed) {
                            cancelBookingAsAdmin(b.booking_id);
                        }
                    });
                }
            }

            bookingsTableBody.appendChild(tr);
        });
    }

    async function cancelBookingAsAdmin(bookingId) {
        try {
            const res = await fetch(`/api/bookings/${encodeURIComponent(bookingId)}/cancel`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Failed to cancel booking.');
            }

            showGlobalAlert(`Booking #BK${bookingId} cancelled successfully.`, 'success');
            await loadBookings();
            loadStats();

        } catch (err) {
            console.error('Error cancelling booking:', err);
            showGlobalAlert(err.message || 'Error cancelling booking.', 'error');
        }
    }

    // =========================================================================
    // UI HELPERS & FORMATTERS
    // =========================================================================
    function showLoginAlert(msg, type = 'error') {
        if (loginAlert) {
            loginAlert.textContent = msg;
            loginAlert.className = `alert alert-${type === 'error' ? 'error' : 'success'}`;
            loginAlert.classList.remove('hidden');
            loginAlert.style.display = 'block';
        }
    }

    function hideLoginAlert() {
        if (loginAlert) {
            loginAlert.classList.add('hidden');
            loginAlert.style.display = 'none';
        }
    }

    function showGlobalAlert(msg, type = 'info') {
        if (globalAlert) {
            globalAlert.textContent = msg;
            globalAlert.className = `alert alert-${type}`;
            globalAlert.classList.remove('hidden');
            globalAlert.style.display = 'block';
            globalAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Auto-hide success messages after 5 seconds
            if (type === 'success') {
                setTimeout(() => {
                    hideGlobalAlert();
                }, 5000);
            }
        }
    }

    function hideGlobalAlert() {
        if (globalAlert) {
            globalAlert.classList.add('hidden');
            globalAlert.style.display = 'none';
        }
    }

    function formatDate(dateStr) {
        if (!dateStr) return '';
        const cleanDate = typeof dateStr === 'string' && dateStr.includes('T') ? dateStr.split('T')[0] : String(dateStr);
        const parts = cleanDate.split('-');
        if (parts.length === 3) {
            const year = parseInt(parts[0], 10);
            const monthIndex = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2], 10);
            const d = new Date(year, monthIndex, day);
            return d.toLocaleDateString('en-IN', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: '2-digit'
            });
        }
        const d = new Date(dateStr);
        return isNaN(d) ? String(dateStr) : d.toLocaleDateString('en-IN', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: '2-digit'
        });
    }

    function formatTime(timeStr) {
        if (!timeStr) return '';
        const parts = String(timeStr).split(':');
        if (parts.length >= 2) {
            let hours = parseInt(parts[0], 10);
            const minutes = parts[1].padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12;
            const formattedHours = hours < 10 ? '0' + hours : hours;
            return `${formattedHours}:${minutes} ${ampm}`;
        }
        return String(timeStr);
    }

    function formatCurrency(amount) {
        const num = Number(amount) || 0;
        return '₹' + num.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
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
});
