/**
 * CinePass Premium - Main Homepage JavaScript
 * Powers dynamic movies catalog, category tabs, filtering, theatres,
 * coupons, hero banner showcase, and user authentication.
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const movieGrid = document.getElementById('moviesGrid');
    const searchInput = document.getElementById('movieSearchInput');
    const loadingSpinner = document.getElementById('moviesLoading');
    const errorAlert = document.getElementById('moviesError');
    const noMoviesEl = document.getElementById('noMoviesFound');
    const resetSearchBtn = document.getElementById('resetSearchBtn');
    const filterChips = document.querySelectorAll('.filter-chip');
    const categoryTabs = document.querySelectorAll('.category-tab-btn');
    const sortSelect = document.getElementById('sortSelect');
    const languageSelect = document.getElementById('languageFilterSelect');
    const citySelect = document.getElementById('citySelect');
    const theatresGrid = document.getElementById('theatresGrid');
    const offersGrid = document.getElementById('offersGrid');
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');

    // Auth Elements
    const openAuthModalBtn = document.getElementById('openAuthModalBtn');
    const authModal = document.getElementById('authModal');
    const closeAuthModalBtn = document.getElementById('closeAuthModalBtn');
    const tabLoginBtn = document.getElementById('tabLoginBtn');
    const tabRegisterBtn = document.getElementById('tabRegisterBtn');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const authAlert = document.getElementById('authAlert');
    const userNavActions = document.getElementById('userNavActions');

    // State Variables
    let allMovies = [];
    let currentGenre = 'all';
    let currentStatus = 'NOW_SHOWING';
    let currentSort = 'rating';
    let currentLang = 'all';
    let currentCity = 'Mumbai';

    // Mobile Navigation Toggle
    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
    }

    // Initialize Page
    checkUserAuthStatus();
    fetchMovies();
    fetchTheatres(currentCity);
    fetchOffers();

    // City Selector Change
    if (citySelect) {
        citySelect.addEventListener('change', (e) => {
            currentCity = e.target.value;
            fetchTheatres(currentCity);
        });
    }

    // Category Tabs: Now Showing vs Coming Soon
    categoryTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            categoryTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentStatus = tab.getAttribute('data-status') || 'NOW_SHOWING';
            applyFilters();
        });
    });

    // Genre Filter Pills
    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            filterChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentGenre = chip.getAttribute('data-genre') || 'all';
            applyFilters();
        });
    });

    // Search Input (Real-time debounced filtering)
    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                applyFilters();
            }, 180);
        });
    }

    // Language Dropdown
    if (languageSelect) {
        languageSelect.addEventListener('change', (e) => {
            currentLang = e.target.value;
            applyFilters();
        });
    }

    // Sort Dropdown
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            applyFilters();
        });
    }

    // Reset Search & Filters Button
    if (resetSearchBtn) {
        resetSearchBtn.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            currentGenre = 'all';
            currentLang = 'all';
            if (languageSelect) languageSelect.value = 'all';
            filterChips.forEach(c => c.classList.toggle('active', c.getAttribute('data-genre') === 'all'));
            applyFilters();
        });
    }

    /**
     * Fetch all movies from backend API
     */
    async function fetchMovies() {
        showLoading(true);
        hideError();

        try {
            const response = await fetch('/api/movies');
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Failed to load movies.');
            }

            allMovies = Array.isArray(data.data) ? data.data : [];
            showLoading(false);

            // Update Hero Banner with Top Rated Movie
            if (allMovies.length > 0) {
                const topMovie = allMovies[0];
                updateHeroBanner(topMovie);
            }

            applyFilters();
        } catch (error) {
            console.error('Error fetching movies:', error);
            showLoading(false);
            showError(error.message || 'Could not connect to the movie database.');
        }
    }

    /**
     * Update Hero Banner Showcase
     */
    function updateHeroBanner(movie) {
        const titleEl = document.getElementById('heroMovieTitle');
        const genreEl = document.getElementById('heroMovieGenre');
        const durEl = document.getElementById('heroMovieDuration');
        const langEl = document.getElementById('heroMovieLang');
        const descEl = document.getElementById('heroMovieDesc');
        const bookBtn = document.getElementById('heroBookBtn');
        const heroBanner = document.getElementById('heroBanner');

        if (titleEl) titleEl.textContent = movie.title;
        if (genreEl) genreEl.textContent = movie.genre;
        if (durEl) durEl.textContent = `${Math.floor(movie.duration_minutes / 60)}h ${movie.duration_minutes % 60}m`;
        if (langEl) langEl.textContent = `${movie.language} • IMAX 3D`;
        if (descEl) descEl.textContent = movie.description || '';
        if (bookBtn) bookBtn.href = `movie.html?id=${movie.movie_id}`;

        if (heroBanner && movie.banner_url) {
            heroBanner.style.backgroundImage = `linear-gradient(0deg, #0b0c10 10%, rgba(11, 12, 16, 0.5) 60%, rgba(11, 12, 16, 0.2) 100%), url('${movie.banner_url}')`;
        }
    }

    /**
     * Apply client-side multi-parameter filters & sorting
     */
    function applyFilters() {
        const searchTerm = (searchInput ? searchInput.value : '').trim().toLowerCase();

        let filtered = allMovies.filter(movie => {
            // Status match (Now Showing vs Coming Soon)
            const movieStatus = movie.release_status || 'NOW_SHOWING';
            if (movieStatus !== currentStatus) return false;

            // Search match
            const matchesSearch = !searchTerm ||
                (movie.title && movie.title.toLowerCase().includes(searchTerm)) ||
                (movie.genre && movie.genre.toLowerCase().includes(searchTerm)) ||
                (movie.language && movie.language.toLowerCase().includes(searchTerm)) ||
                (movie.description && movie.description.toLowerCase().includes(searchTerm));

            // Genre match
            const matchesGenre = currentGenre === 'all' || 
                (movie.genre && movie.genre.toLowerCase().includes(currentGenre.toLowerCase()));

            // Language match
            const matchesLang = currentLang === 'all' ||
                (movie.language && movie.language.toLowerCase() === currentLang.toLowerCase());

            return matchesSearch && matchesGenre && matchesLang;
        });

        // Sorting
        filtered.sort((a, b) => {
            if (currentSort === 'rating') {
                return parseFloat(b.rating || 0) - parseFloat(a.rating || 0);
            } else if (currentSort === 'popularity') {
                return (b.votes_count || 0) - (a.votes_count || 0);
            } else if (currentSort === 'latest') {
                return new Date(b.release_date || 0) - new Date(a.release_date || 0);
            } else if (currentSort === 'title_asc') {
                return a.title.localeCompare(b.title);
            }
            return 0;
        });

        renderMovies(filtered);
    }

    /**
     * Render movie cards into grid
     */
    function renderMovies(movies) {
        if (!movieGrid) return;

        movieGrid.innerHTML = '';

        if (!movies || movies.length === 0) {
            movieGrid.style.display = 'none';
            if (noMoviesEl) noMoviesEl.classList.remove('hidden');
            return;
        }

        if (noMoviesEl) noMoviesEl.classList.add('hidden');
        movieGrid.style.display = 'grid';

        movies.forEach(movie => {
            const card = document.createElement('article');
            card.className = 'movie-card';

            const posterSrc = movie.poster_url || '/images/posters/the-dark-knight.svg';
            const durationFormatted = `${Math.floor(movie.duration_minutes / 60)}h ${movie.duration_minutes % 60}m`;
            const isComingSoon = movie.release_status === 'COMING_SOON';
            const ratingDisplay = movie.rating ? parseFloat(movie.rating).toFixed(1) : '4.5';

            // Check if movie is currently in watchlist
            let inWatchlist = false;
            try {
                const localList = JSON.parse(localStorage.getItem('cinepass_watchlist') || '[]');
                if (localList.includes(movie.movie_id)) inWatchlist = true;
            } catch (e) {}

            card.innerHTML = `
                <div class="movie-poster-wrapper">
                    <img 
                        src="${escapeHtml(posterSrc)}" 
                        alt="${escapeHtml(movie.title)} Poster" 
                        class="movie-poster" 
                        loading="lazy"
                        onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'300\\' height=\\'420\\' viewBox=\\'0 0 300 420\\'><rect fill=\\'%231a1a2e\\' width=\\'300\\' height=\\'420\\'/><text fill=\\'%23b0b0b0\\' font-family=\\'sans-serif\\' font-size=\\'16\\' dy=\\'6\\' font-weight=\\'bold\\' x=\\'50%25\\' y=\\'50%25\\' text-anchor=\\'middle\\'>🎬 ${escapeHtml(movie.title)}</text></svg>';"
                    >
                    <span class="badge badge-language">${escapeHtml(movie.language)}</span>
                    <span class="badge-release-status ${isComingSoon ? 'coming-soon' : ''}">
                        ${isComingSoon ? 'COMING SOON' : 'NOW SHOWING'}
                    </span>
                    <div class="card-rating-badge">
                        <span class="star-icon">★</span>
                        <span>${ratingDisplay}</span>
                    </div>
                </div>
                <div class="movie-card-content">
                    <h3 class="movie-title" title="${escapeHtml(movie.title)}">${escapeHtml(movie.title)}</h3>
                    <div class="movie-metadata">
                        <span class="badge badge-genre">${escapeHtml(movie.genre)}</span>
                        <span class="movie-duration">⏱ ${durationFormatted}</span>
                    </div>
                    <div class="movie-card-footer" style="display: flex; gap: 8px;">
                        <a href="movie.html?id=${movie.movie_id}" class="btn ${isComingSoon ? 'btn-secondary' : 'btn-primary'}" style="flex: 1; text-align: center;">
                            <span>${isComingSoon ? 'View Details' : 'Book Tickets'}</span>
                        </a>
                        <button type="button" class="btn btn-secondary home-watchlist-btn" data-id="${movie.movie_id}" title="${inWatchlist ? 'In Watchlist (Click to Remove)' : 'Add to Watchlist'}" style="padding: 0 12px; font-size: 1.15rem; border: 1px solid var(--border-color); ${inWatchlist ? 'color: #ff4757; border-color: rgba(255, 71, 87, 0.4); background: rgba(255, 71, 87, 0.12);' : ''}">
                            <span>${inWatchlist ? '❤️' : '🤍'}</span>
                        </button>
                    </div>
                </div>
            `;

            // Bind quick 1-click watchlist toggle
            const wlBtn = card.querySelector('.home-watchlist-btn');
            if (wlBtn) {
                wlBtn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const mId = movie.movie_id;
                    let localList = [];
                    try { localList = JSON.parse(localStorage.getItem('cinepass_watchlist') || '[]'); } catch (err) {}
                    const isSaved = localList.includes(mId);
                    const userTok = localStorage.getItem('cinepass_token');

                    if (isSaved) {
                        localList = localList.filter(id => id !== mId);
                        if (userTok) {
                            try {
                                await fetch(`/api/watchlist/${mId}`, {
                                    method: 'DELETE',
                                    headers: { 'Authorization': `Bearer ${userTok}` }
                                });
                            } catch (err) {}
                        }
                        wlBtn.innerHTML = '<span>🤍</span>';
                        wlBtn.style.color = '';
                        wlBtn.style.background = '';
                        wlBtn.style.borderColor = 'var(--border-color)';
                        wlBtn.title = 'Add to Watchlist';
                    } else {
                        localList.push(mId);
                        if (userTok) {
                            try {
                                await fetch('/api/watchlist', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${userTok}`
                                    },
                                    body: JSON.stringify({ movie_id: mId })
                                });
                            } catch (err) {}
                        }
                        wlBtn.innerHTML = '<span>❤️</span>';
                        wlBtn.style.color = '#ff4757';
                        wlBtn.style.background = 'rgba(255, 71, 87, 0.12)';
                        wlBtn.style.borderColor = 'rgba(255, 71, 87, 0.4)';
                        wlBtn.title = 'In Watchlist (Click to Remove)';
                    }
                    localStorage.setItem('cinepass_watchlist', JSON.stringify(localList));
                });
            }

            movieGrid.appendChild(card);
        });
    }

    /**
     * Fetch theatres filtered by city
     */
    async function fetchTheatres(city) {
        if (!theatresGrid) return;
        try {
            const url = city && city !== 'all' ? `/api/theatres?city=${encodeURIComponent(city)}` : '/api/theatres';
            const res = await fetch(url);
            const data = await res.json();
            if (data.success && Array.isArray(data.data)) {
                renderTheatres(data.data);
            }
        } catch (e) {
            console.error('Error fetching theatres:', e);
        }
    }

    /**
     * Render theatres cards
     */
    function renderTheatres(theatres) {
        theatresGrid.innerHTML = '';
        if (theatres.length === 0) {
            theatresGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">No theatres listed for ${escapeHtml(currentCity)} currently.</p>`;
            return;
        }

        theatres.forEach(t => {
            const card = document.createElement('div');
            card.className = 'theatre-card';
            card.innerHTML = `
                <div>
                    <h4 class="theatre-card-title">${escapeHtml(t.name)}</h4>
                    <p class="theatre-card-location">📍 ${escapeHtml(t.address)}, ${escapeHtml(t.city)}</p>
                </div>
                <div class="theatre-card-footer">
                    <span>🎞️ ${t.total_screens} Screens Available</span>
                    <a href="#movies" class="btn btn-secondary" style="padding: 6px 14px; font-size: 0.8rem;">Browse Shows</a>
                </div>
            `;
            theatresGrid.appendChild(card);
        });
    }

    /**
     * Fetch active coupons & offers
     */
    async function fetchOffers() {
        if (!offersGrid) return;
        try {
            const res = await fetch('/api/coupons');
            const data = await res.json();
            if (data.success && Array.isArray(data.data)) {
                renderOffers(data.data);
            }
        } catch (e) {
            console.error('Error fetching offers:', e);
        }
    }

    /**
     * Render coupons cards
     */
    function renderOffers(coupons) {
        offersGrid.innerHTML = '';
        coupons.forEach(c => {
            const card = document.createElement('div');
            card.className = 'offer-card';
            card.innerHTML = `
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <span class="offer-code-pill" title="Click to copy code" data-code="${escapeHtml(c.code)}">
                            ${escapeHtml(c.code)} 📋
                        </span>
                        <span style="font-size: 0.82rem; color: #00e676; font-weight: 700;">${c.discount_percent}% OFF</span>
                    </div>
                    <p style="font-size: 0.92rem; color: #eee; margin-bottom: 8px;">${escapeHtml(c.description)}</p>
                    <p style="font-size: 0.78rem; color: var(--text-muted);">Min. order: ₹${parseFloat(c.min_amount).toFixed(0)} • Max discount: ₹${parseFloat(c.max_discount).toFixed(0)}</p>
                </div>
                <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 14px;">
                    Expires on: ${new Date(c.expiry_date).toLocaleDateString()}
                </div>
            `;

            // Click-to-copy code handler
            const pill = card.querySelector('.offer-code-pill');
            pill.addEventListener('click', () => {
                navigator.clipboard.writeText(c.code);
                pill.textContent = 'COPIED! ✓';
                setTimeout(() => { pill.textContent = `${c.code} 📋`; }, 1600);
            });

            offersGrid.appendChild(card);
        });
    }

    // ==========================================================================
    // User Authentication Modal Handlers
    // ==========================================================================
    function checkUserAuthStatus() {
        const token = localStorage.getItem('cinepass_token');
        const userJson = localStorage.getItem('cinepass_user');

        if (token && userJson && userNavActions) {
            // Delegate to profile.js for the full profile pill + dropdown (Edit Profile, etc.)
            if (window.cinepassProfile && typeof window.cinepassProfile.init === 'function') {
                window.cinepassProfile.init();
                return;
            }
            // Fallback if profile.js didn't load
            try {
                const user = JSON.parse(userJson);
                userNavActions.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 0.9rem; font-weight: 600; color: #fff;">👤 ${escapeHtml(user.name.split(' ')[0])}</span>
                        <button class="btn btn-secondary" id="logoutBtn" style="padding: 6px 14px; font-size: 0.82rem;">Sign Out</button>
                    </div>
                `;
                document.getElementById('logoutBtn').addEventListener('click', handleLogout);
                return;
            } catch (e) {}
        }

        if (userNavActions) {
            userNavActions.innerHTML = `
                <button class="btn btn-primary btn-auth-nav" id="openAuthModalBtn">
                    <span>Sign In</span>
                </button>
            `;
            document.getElementById('openAuthModalBtn').addEventListener('click', () => {
                if (authModal) authModal.style.display = 'flex';
            });
        }
    }

    function handleLogout() {
        localStorage.removeItem('cinepass_token');
        localStorage.removeItem('cinepass_user');
        window.location.reload();
    }

    if (closeAuthModalBtn && authModal) {
        closeAuthModalBtn.addEventListener('click', () => { authModal.style.display = 'none'; });
        authModal.addEventListener('click', (e) => {
            if (e.target === authModal) authModal.style.display = 'none';
        });
    }

    if (tabLoginBtn && tabRegisterBtn && loginForm && registerForm) {
        tabLoginBtn.addEventListener('click', () => {
            tabLoginBtn.classList.add('active');
            tabRegisterBtn.classList.remove('active');
            loginForm.classList.remove('hidden');
            registerForm.classList.add('hidden');
            if (authAlert) authAlert.className = 'alert hidden';
        });

        tabRegisterBtn.addEventListener('click', () => {
            tabRegisterBtn.classList.add('active');
            tabLoginBtn.classList.remove('active');
            registerForm.classList.remove('hidden');
            loginForm.classList.add('hidden');
            if (authAlert) authAlert.className = 'alert hidden';
        });
    }

    // Submit Login
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;

            try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await res.json();
                if (!res.ok || !data.success) throw new Error(data.message || 'Login failed');

                localStorage.setItem('cinepass_token', data.token);
                localStorage.setItem('cinepass_user', JSON.stringify(data.user));
                if (authModal) authModal.style.display = 'none';
                checkUserAuthStatus();
            } catch (err) {
                if (authAlert) {
                    authAlert.className = 'alert alert-error';
                    authAlert.textContent = err.message;
                }
            }
        });
    }

    // Submit Registration
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('regName').value.trim();
            const email = document.getElementById('regEmail').value.trim();
            const phone = document.getElementById('regPhone').value.trim();
            const password = document.getElementById('regPassword').value;

            try {
                const res = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, phone, password })
                });
                const data = await res.json();
                if (!res.ok || !data.success) throw new Error(data.message || 'Registration failed');

                localStorage.setItem('cinepass_token', data.token);
                localStorage.setItem('cinepass_user', JSON.stringify(data.user));
                if (authModal) authModal.style.display = 'none';
                checkUserAuthStatus();
            } catch (err) {
                if (authAlert) {
                    authAlert.className = 'alert alert-error';
                    authAlert.textContent = err.message;
                }
            }
        });
    }

    function showLoading(show) {
        if (loadingSpinner) loadingSpinner.style.display = show ? 'flex' : 'none';
    }

    function showError(message) {
        if (errorAlert) {
            errorAlert.querySelector('span').textContent = message;
            errorAlert.classList.remove('hidden');
        }
    }

    function hideError() {
        if (errorAlert) errorAlert.classList.add('hidden');
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
});
