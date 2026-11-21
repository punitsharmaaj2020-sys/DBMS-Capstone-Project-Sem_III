/**
 * CinePass Premium - My Bookings & Watchlist Manager
 * Powers:
 * - Reservation lookup by customer email
 * - Detailed booking cards with seat information
 * - Digital ticket viewing & PDF printing modal
 * - Safe booking cancellation & seat restoration
 * - Personal movie watchlist (syncs with MySQL & local storage)
 * - Dynamic tab navigation (?tab=watchlist support)
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements - Bookings
    const searchForm = document.getElementById('bookingSearchForm');
    const emailInput = document.getElementById('searchEmail');
    const searchBtn = document.getElementById('searchBtn');
    const alertEl = document.getElementById('bookingsAlert');
    const loadingEl = document.getElementById('bookingsLoading');
    const resultsSection = document.getElementById('bookingsResults');
    const resultsSummary = document.getElementById('resultsSummaryText');
    const bookingsList = document.getElementById('bookingsList');
    const noBookingsEl = document.getElementById('noBookingsFound');

    // DOM Elements - Tabs
    const tabBookingsBtn = document.getElementById('tabBookingsBtn');
    const tabWatchlistBtn = document.getElementById('tabWatchlistBtn');
    const bookingsTabContainer = document.getElementById('bookingsTabContainer');
    const watchlistTabContainer = document.getElementById('watchlistTabContainer');

    // DOM Elements - Watchlist
    const watchlistGrid = document.getElementById('watchlistGrid');
    const noWatchlistFound = document.getElementById('noWatchlistFound');

    // DOM Elements - Ticket Modal
    const ticketModal = document.getElementById('ticketModal');
    const closeTicketModalBtn = document.getElementById('closeTicketModalBtn');

    // Mobile Navigation Toggle
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');
    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
    }

    let currentEmail = '';
    const userToken = localStorage.getItem('cinepass_token');
    const userJson = localStorage.getItem('cinepass_user');

    // Tab Switching Logic
    if (tabBookingsBtn && tabWatchlistBtn) {
        tabBookingsBtn.addEventListener('click', () => switchTab('bookings'));
        tabWatchlistBtn.addEventListener('click', () => switchTab('watchlist'));
    }

    function switchTab(tabName) {
        if (tabName === 'watchlist') {
            tabBookingsBtn.classList.remove('active');
            tabWatchlistBtn.classList.add('active');
            if (bookingsTabContainer) bookingsTabContainer.classList.add('hidden');
            if (watchlistTabContainer) watchlistTabContainer.classList.remove('hidden');
            loadWatchlist();
        } else {
            tabWatchlistBtn.classList.remove('active');
            tabBookingsBtn.classList.add('active');
            if (watchlistTabContainer) watchlistTabContainer.classList.add('hidden');
            if (bookingsTabContainer) bookingsTabContainer.classList.remove('hidden');
        }
    }

    // Check URL parameters (e.g. ?tab=watchlist or ?email=...)
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    const emailParam = urlParams.get('email');

    if (tabParam === 'watchlist') {
        switchTab('watchlist');
    } else {
        // Prefill email if provided in URL or if user is logged in
        if (emailParam) {
            if (emailInput) emailInput.value = emailParam.trim();
            searchBookings(emailParam.trim());
        } else if (userJson) {
            try {
                const u = JSON.parse(userJson);
                if (u.email && emailInput) {
                    emailInput.value = u.email;
                    searchBookings(u.email);
                }
            } catch (e) {}
        }
    }

    // Search form submission
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = (emailInput ? emailInput.value : '').trim();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!email || !emailRegex.test(email)) {
                showAlert('Please enter a valid email address (e.g., akshat@example.com).', 'error');
                if (emailInput) emailInput.focus();
                return;
            }

            searchBookings(email);
        });
    }

    // ==========================================================================
    // 1. Fetch & Render Bookings
    // ==========================================================================
    async function searchBookings(email) {
        currentEmail = email;
        hideAlert();
        showLoading(true);

        if (resultsSection) resultsSection.classList.remove('hidden');
        if (noBookingsEl) noBookingsEl.classList.add('hidden');
        if (bookingsList) bookingsList.innerHTML = '';

        try {
            const res = await fetch(`/api/bookings?email=${encodeURIComponent(email)}`);
            const data = await res.json();

            showLoading(false);

            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Failed to retrieve bookings.');
            }

            const bookings = Array.isArray(data.data) ? data.data : [];
            renderBookings(bookings);

        } catch (error) {
            console.error('Error fetching bookings:', error);
            showLoading(false);
            showAlert(error.message || 'An error occurred while fetching your bookings.', 'error');
        }
    }

    function renderBookings(bookings) {
        if (!bookingsList) return;
        bookingsList.innerHTML = '';

        if (!bookings || bookings.length === 0) {
            if (noBookingsEl) noBookingsEl.classList.remove('hidden');
            if (resultsSummary) {
                resultsSummary.textContent = `No reservations found for ${escapeHtml(currentEmail)}`;
            }
            return;
        }

        if (noBookingsEl) noBookingsEl.classList.add('hidden');
        if (resultsSummary) {
            resultsSummary.textContent = `Found ${bookings.length} reservation${bookings.length > 1 ? 's' : ''} for ${escapeHtml(currentEmail)}`;
        }

        bookings.forEach(b => {
            const card = document.createElement('div');
            card.className = 'booking-item-card';

            const bookingId = b.booking_id;
            const refCode = b.booking_reference || `BK-${String(bookingId).padStart(6, '0')}`;
            const isConfirmed = (b.booking_status || 'CONFIRMED').toUpperCase() === 'CONFIRMED';
            const statusClass = isConfirmed ? 'confirmed' : 'cancelled';
            const statusText = isConfirmed ? 'CONFIRMED &amp; PAID' : 'CANCELLED &amp; REFUNDED';

            const showDate = formatDate(b.show_date);
            const showTime = formatTime(b.show_time);
            const bookingDate = formatDateTime(b.booking_date);
            const totalFormatted = `₹${parseFloat(b.total_amount).toFixed(2)}`;
            const seatList = b.seat_numbers || `${b.number_of_tickets} Seat(s)`;

            card.innerHTML = `
                <div class="booking-item-header">
                    <div>
                        <span class="booking-id-tag">#${escapeHtml(refCode)}</span>
                        <h3 style="font-size: 1.3rem; font-weight: 700; color: #fff; margin-top: 4px;">
                            ${escapeHtml(b.movie_title || 'Movie Title')}
                        </h3>
                    </div>
                    <span class="status-badge ${statusClass}">
                        ${isConfirmed ? '✓' : '✗'} ${statusText}
                    </span>
                </div>

                <div class="booking-item-details">
                    <div class="detail-block">
                        <label>Cinema &amp; Screen</label>
                        <span>${escapeHtml(b.theatre_name || 'CinePass Grand')}${b.screen_name ? ` (${escapeHtml(b.screen_name)})` : ''}</span>
                    </div>
                    <div class="detail-block">
                        <label>Show Date &amp; Time</label>
                        <span>📅 ${showDate} at ${showTime}</span>
                    </div>
                    <div class="detail-block">
                        <label>Reserved Seats</label>
                        <span style="color: var(--accent-red); font-weight: 700;">🪑 ${escapeHtml(seatList)}</span>
                    </div>
                    <div class="detail-block">
                        <label>Total Amount</label>
                        <span style="font-size: 1.15rem; font-weight: 700; color: #00e676;">${totalFormatted}</span>
                    </div>
                    <div class="detail-block">
                        <label>Customer Name</label>
                        <span>👤 ${escapeHtml(b.customer_name || 'Customer')}</span>
                    </div>
                    <div class="detail-block">
                        <label>Booked On</label>
                        <span style="color: var(--text-muted); font-size: 0.88rem;">${bookingDate}</span>
                    </div>
                </div>

                <div class="booking-item-footer">
                    <div style="font-size: 0.85rem; color: var(--text-muted);">
                        ${b.transaction_id ? `Txn ID: <code>${escapeHtml(b.transaction_id)}</code>` : ''}
                    </div>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button type="button" class="btn btn-primary btn-sm view-ticket-btn" data-id="${bookingId}">
                            <span>🖨️ View &amp; Print E-Ticket</span>
                        </button>
                        ${isConfirmed ? `
                        <button type="button" class="btn btn-outline-danger btn-sm cancel-btn" data-id="${bookingId}" style="border: 1px solid #ff4757; color: #ff4757; background: transparent; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 600;">
                            <span>Cancel Booking</span>
                        </button>
                        ` : ''}
                    </div>
                </div>
            `;

            // Bind View Ticket Button
            const viewTicketBtn = card.querySelector('.view-ticket-btn');
            if (viewTicketBtn) {
                viewTicketBtn.addEventListener('click', () => openTicketModal(b));
            }

            // Bind Cancel Button
            const cancelBtn = card.querySelector('.cancel-btn');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => handleCancellation(b));
            }

            bookingsList.appendChild(card);
        });
    }

    // ==========================================================================
    // 2. Cancellation Workflow
    // ==========================================================================
    async function handleCancellation(booking) {
        const refCode = booking.booking_reference || `#BK-${booking.booking_id}`;
        const confirmed = window.confirm(
            `Are you sure you want to cancel reservation ${refCode} for "${booking.movie_title}"?\n\n` +
            `• All seats [${booking.seat_numbers}] will be released back to other cinema goers.\n` +
            `• A simulated refund of ₹${parseFloat(booking.total_amount).toFixed(2)} will be initiated.\n\n` +
            `This action cannot be undone.`
        );

        if (!confirmed) return;

        showLoading(true);
        try {
            const res = await fetch(`/api/bookings/${booking.booking_id}/cancel`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await res.json();
            showLoading(false);

            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Cancellation failed.');
            }

            showAlert(`✓ Booking ${refCode} has been cancelled successfully. Eligible seats have been released.`, 'success');
            if (currentEmail) {
                searchBookings(currentEmail);
            }
        } catch (err) {
            showLoading(false);
            console.error('Cancellation error:', err);
            showAlert(err.message || 'Unable to cancel booking at this time.', 'error');
        }
    }

    // ==========================================================================
    // 3. Digital Ticket Modal
    // ==========================================================================
    function openTicketModal(b) {
        if (!ticketModal) return;

        const ticketRefCode = document.getElementById('ticketRefCode');
        const ticketPosterImg = document.getElementById('ticketPosterImg');
        const ticketMovieTitle = document.getElementById('ticketMovieTitle');
        const ticketTheatreName = document.getElementById('ticketTheatreName');
        const ticketScreenName = document.getElementById('ticketScreenName');
        const ticketShowDate = document.getElementById('ticketShowDate');
        const ticketShowTime = document.getElementById('ticketShowTime');
        const ticketSeatsList = document.getElementById('ticketSeatsList');
        const ticketCustomerName = document.getElementById('ticketCustomerName');
        const ticketStatusBadge = document.getElementById('ticketStatusBadge');
        const ticketTotalAmount = document.getElementById('ticketTotalAmount');

        const refCode = b.booking_reference || `BK-${String(b.booking_id).padStart(6, '0')}`;
        if (ticketRefCode) ticketRefCode.textContent = `#${refCode}`;
        if (ticketPosterImg) ticketPosterImg.src = b.poster_url || '/images/posters/the-dark-knight.svg';
        if (ticketMovieTitle) ticketMovieTitle.textContent = b.movie_title || 'Movie';
        if (ticketTheatreName) ticketTheatreName.textContent = b.theatre_name || 'CinePass Grand Multiplex';
        if (ticketScreenName) ticketScreenName.textContent = b.screen_name || 'Audi 1 - IMAX';
        if (ticketShowDate) ticketShowDate.textContent = formatDate(b.show_date);
        if (ticketShowTime) ticketShowTime.textContent = formatTime(b.show_time);
        if (ticketSeatsList) ticketSeatsList.textContent = b.seat_numbers || 'Reserved';
        if (ticketCustomerName) ticketCustomerName.textContent = b.customer_name || 'Customer';

        const isConfirmed = (b.booking_status || 'CONFIRMED').toUpperCase() === 'CONFIRMED';
        if (ticketStatusBadge) {
            ticketStatusBadge.textContent = isConfirmed ? 'CONFIRMED & PAID' : 'CANCELLED & REFUNDED';
            ticketStatusBadge.style.color = isConfirmed ? '#00e676' : '#ff4757';
        }
        if (ticketTotalAmount) {
            ticketTotalAmount.textContent = `₹${parseFloat(b.total_amount).toFixed(2)}`;
        }

        ticketModal.classList.add('active');
        ticketModal.style.display = 'flex';
    }

    if (closeTicketModalBtn && ticketModal) {
        closeTicketModalBtn.addEventListener('click', () => {
            ticketModal.classList.remove('active');
            ticketModal.style.display = 'none';
        });
        ticketModal.addEventListener('click', (e) => {
            if (e.target === ticketModal) {
                ticketModal.classList.remove('active');
                ticketModal.style.display = 'none';
            }
        });
    }

    // ==========================================================================
    // 4. Watchlist Logic
    // ==========================================================================
    async function loadWatchlist() {
        if (!watchlistGrid) return;
        watchlistGrid.innerHTML = '';
        if (noWatchlistFound) noWatchlistFound.classList.add('hidden');

        let watchlistMovies = [];

        // 1. Try fetching from MySQL if user has token
        if (userToken) {
            try {
                const res = await fetch('/api/watchlist', {
                    headers: { 'Authorization': `Bearer ${userToken}` }
                });
                const data = await res.json();
                if (data.success && Array.isArray(data.data)) {
                    watchlistMovies = data.data;
                }
            } catch (e) {
                console.warn('Error fetching server watchlist:', e);
            }
        }

        // 2. Also merge with local guest watchlist
        const localListJson = localStorage.getItem('cinepass_watchlist');
        let localIds = [];
        if (localListJson) {
            try {
                localIds = JSON.parse(localListJson);
            } catch (e) {}
        }

        // If local movies exist and aren't in watchlistMovies, fetch them from /api/movies
        if (localIds.length > 0) {
            try {
                const res = await fetch('/api/movies');
                const data = await res.json();
                if (data.success && Array.isArray(data.data)) {
                    localIds.forEach(id => {
                        const match = data.data.find(m => String(m.movie_id) === String(id));
                        if (match && !watchlistMovies.some(wm => String(wm.movie_id) === String(match.movie_id))) {
                            watchlistMovies.push(match);
                        }
                    });
                }
            } catch (e) {}
        }

        // Render Watchlist
        if (!watchlistMovies || watchlistMovies.length === 0) {
            if (noWatchlistFound) noWatchlistFound.classList.remove('hidden');
            return;
        }

        watchlistMovies.forEach(movie => {
            const card = document.createElement('article');
            card.className = 'movie-card';

            const posterSrc = movie.poster_url || '/images/posters/the-dark-knight.svg';
            const duration = movie.duration_minutes ? `${Math.floor(movie.duration_minutes / 60)}h ${movie.duration_minutes % 60}m` : '2h 15m';
            const rating = movie.rating ? parseFloat(movie.rating).toFixed(1) : '4.8';

            card.innerHTML = `
                <div class="movie-poster-wrapper">
                    <img src="${escapeHtml(posterSrc)}" alt="${escapeHtml(movie.title)}" class="movie-poster" loading="lazy">
                    <span class="movie-rating-badge">★ ${rating}</span>
                </div>
                <div class="movie-card-body">
                    <div class="movie-card-genre">${escapeHtml(movie.genre || 'Action')} • ${escapeHtml(movie.language || 'English')}</div>
                    <h3 class="movie-card-title">${escapeHtml(movie.title)}</h3>
                    <div style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 12px;">⏱ ${duration}</div>
                    <div style="display: flex; gap: 8px;">
                        <a href="movie.html?id=${movie.movie_id}" class="btn btn-primary btn-sm" style="flex: 2; text-align: center;">
                            🎟️ Book Tickets
                        </a>
                        <button type="button" class="btn btn-secondary btn-sm remove-watchlist-btn" data-id="${movie.movie_id}" title="Remove from Watchlist" style="flex: 1;">
                            ✕
                        </button>
                    </div>
                </div>
            `;

            const removeBtn = card.querySelector('.remove-watchlist-btn');
            if (removeBtn) {
                removeBtn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    await removeFromWatchlist(movie.movie_id);
                });
            }

            watchlistGrid.appendChild(card);
        });
    }

    async function removeFromWatchlist(movieId) {
        // Remove from MySQL
        if (userToken) {
            try {
                await fetch(`/api/watchlist/${movieId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${userToken}` }
                });
            } catch (e) {}
        }

        // Remove from local storage
        const localListJson = localStorage.getItem('cinepass_watchlist');
        if (localListJson) {
            try {
                let ids = JSON.parse(localListJson);
                ids = ids.filter(id => String(id) !== String(movieId));
                localStorage.setItem('cinepass_watchlist', JSON.stringify(ids));
            } catch (e) {}
        }

        loadWatchlist();
    }

    // ==========================================================================
    // 5. Utility Functions
    // ==========================================================================
    function showLoading(isLoading) {
        if (loadingEl) {
            loadingEl.style.display = isLoading ? 'flex' : 'none';
            if (isLoading) loadingEl.classList.remove('hidden');
            else loadingEl.classList.add('hidden');
        }
        if (searchBtn) {
            searchBtn.disabled = isLoading;
            searchBtn.textContent = isLoading ? 'Searching...' : 'Search Bookings';
        }
    }

    function showAlert(msg, type = 'error') {
        if (alertEl) {
            alertEl.textContent = msg;
            alertEl.className = `alert alert-${type === 'error' ? 'error' : 'success'}`;
            alertEl.classList.remove('hidden');
            alertEl.style.display = 'block';
            alertEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    function hideAlert() {
        if (alertEl) {
            alertEl.classList.add('hidden');
            alertEl.style.display = 'none';
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

    function formatDateTime(dateTimeStr) {
        if (!dateTimeStr) return '';
        const d = new Date(dateTimeStr);
        if (isNaN(d.getTime())) return String(dateTimeStr);
        return d.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
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
