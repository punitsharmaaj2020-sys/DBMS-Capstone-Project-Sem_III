/**
 * Movie Ticket Booking System - Home Page JavaScript
 * Handles fetching, filtering, and displaying movie listings
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements with fallback selectors
    const movieGrid = document.getElementById('moviesGrid') || document.getElementById('movie-grid');
    const searchInput = document.getElementById('movieSearchInput') || document.getElementById('movie-search') || document.querySelector('.search-input');
    const loadingSpinner = document.getElementById('moviesLoading') || document.querySelector('.loading-container');
    const errorAlert = document.getElementById('moviesError') || document.querySelector('.alert-error');
    const noMoviesEl = document.getElementById('noMoviesFound') || document.querySelector('.empty-state');
    const resetSearchBtn = document.getElementById('resetSearchBtn');
    const filterChips = document.querySelectorAll('.filter-chip');

    let allMovies = [];
    let currentGenre = 'all';

    // Fetch and display movies on load
    fetchMovies();

    // Search input event listener (case-insensitive filtering)
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            applyFilters();
        });
    }

    // Reset search button
    if (resetSearchBtn) {
        resetSearchBtn.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            currentGenre = 'all';
            filterChips.forEach(chip => {
                if (chip.getAttribute('data-genre') === 'all') {
                    chip.classList.add('active');
                } else {
                    chip.classList.remove('active');
                }
            });
            applyFilters();
        });
    }

    // Genre filter pills support
    if (filterChips && filterChips.length > 0) {
        filterChips.forEach(chip => {
            chip.addEventListener('click', () => {
                filterChips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                currentGenre = chip.getAttribute('data-genre') || 'all';
                applyFilters();
            });
        });
    }

    /**
     * Fetch all movies from the backend API
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
            renderMovies(allMovies);
        } catch (error) {
            console.error('Error fetching movies:', error);
            showLoading(false);
            showError(error.message || 'Could not connect to the movie database. Please make sure the server and MySQL are running.');
        }
    }

    /**
     * Apply both search text and genre filter
     */
    function applyFilters() {
        const searchTerm = (searchInput ? searchInput.value : '').trim().toLowerCase();

        const filtered = allMovies.filter(movie => {
            const matchesSearch = !searchTerm ||
                (movie.title && movie.title.toLowerCase().includes(searchTerm)) ||
                (movie.genre && movie.genre.toLowerCase().includes(searchTerm)) ||
                (movie.language && movie.language.toLowerCase().includes(searchTerm));

            const matchesGenre = currentGenre === 'all' || 
                (movie.genre && movie.genre.toLowerCase().includes(currentGenre.toLowerCase()));

            return matchesSearch && matchesGenre;
        });

        renderMovies(filtered);
    }

    /**
     * Render movie cards into the grid
     * @param {Array} movies 
     */
    function renderMovies(movies) {
        if (!movieGrid) return;

        movieGrid.innerHTML = '';

        if (!movies || movies.length === 0) {
            movieGrid.style.display = 'none';
            if (noMoviesEl) {
                noMoviesEl.classList.remove('hidden');
                noMoviesEl.style.display = 'block';
            }
            return;
        }

        if (noMoviesEl) {
            noMoviesEl.classList.add('hidden');
            noMoviesEl.style.display = 'none';
        }

        movieGrid.style.display = 'grid';

        movies.forEach(movie => {
            const card = document.createElement('div');
            card.className = 'movie-card';
            card.setAttribute('role', 'button');
            card.setAttribute('tabindex', '0');
            card.setAttribute('aria-label', `Book tickets for ${movie.title}`);

            const fallbackPoster = 'https://placehold.co/300x450/1a1a2e/e94560?text=No+Poster';
            const posterSrc = movie.poster_url || fallbackPoster;

            card.innerHTML = `
                <div class="movie-poster">
                    <img src="${escapeHtml(posterSrc)}" alt="${escapeHtml(movie.title)}" onerror="this.src='${fallbackPoster}'">
                </div>
                <div class="movie-info">
                    <h3 class="movie-title">${escapeHtml(movie.title)}</h3>
                    <p class="movie-meta">${escapeHtml(movie.genre || '')} • ${movie.duration_minutes || 0} min</p>
                    <span class="language-badge">${escapeHtml(movie.language || 'English')}</span>
                </div>
            `;

            const navigate = () => {
                window.location.href = `/movie?id=${movie.movie_id}`;
            };

            card.addEventListener('click', navigate);
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate();
                }
            });

            movieGrid.appendChild(card);
        });
    }

    /**
     * Show/Hide loading spinner
     * @param {boolean} isLoading 
     */
    function showLoading(isLoading) {
        if (loadingSpinner) {
            loadingSpinner.style.display = isLoading ? 'flex' : 'none';
            if (isLoading) {
                loadingSpinner.classList.remove('hidden');
            } else {
                loadingSpinner.classList.add('hidden');
            }
        }
        if (isLoading && movieGrid) {
            movieGrid.style.display = 'none';
        }
    }

    /**
     * Display error alert message
     * @param {string} msg 
     */
    function showError(msg) {
        if (errorAlert) {
            errorAlert.textContent = msg;
            errorAlert.classList.remove('hidden');
            errorAlert.style.display = 'block';
        }
        if (movieGrid) {
            movieGrid.style.display = 'none';
        }
        if (noMoviesEl) {
            noMoviesEl.style.display = 'none';
        }
    }

    /**
     * Hide error alert message
     */
    function hideError() {
        if (errorAlert) {
            errorAlert.classList.add('hidden');
            errorAlert.style.display = 'none';
        }
    }

    /**
     * Sanitize string for HTML insertion
     * @param {string} str 
     * @returns {string}
     */
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
