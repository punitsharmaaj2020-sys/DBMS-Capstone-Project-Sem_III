/**
 * Movie Ticket Booking System - Movie Details & Showtimes JavaScript
 * Handles loading movie info, available shows, ticket selection, price calculation,
 * form validation, booking submission, and receipt confirmation.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Get Movie ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const movieId = urlParams.get('id');

    if (!movieId) {
        window.location.href = '/';
        return;
    }

    // State
    let currentMovie = null;
    let selectedShow = null;
    let availableShows = [];

    // DOM Elements - Details
    const loadingEl = document.getElementById('movieDetailsLoading');
    const errorAlert = document.getElementById('movieDetailsError');
    const contentEl = document.getElementById('movieDetailsContent');
    const posterImg = document.getElementById('moviePoster');
    const titleEl = document.getElementById('movieTitle');
    const genreEl = document.getElementById('movieGenre');
    const durationEl = document.getElementById('movieDuration');
    const languageEl = document.getElementById('movieLanguage');
    const releaseDateEl = document.getElementById('movieReleaseDate');
    const descriptionEl = document.getElementById('movieDescription');

    // DOM Elements - Shows
    const showsSection = document.getElementById('showsSection');
    const showsLoading = document.getElementById('showsLoading');
    const showsList = document.getElementById('showsList');
    const noShowsMessage = document.getElementById('noShowsMessage');

    // DOM Elements - Booking Form
    const bookingSection = document.getElementById('bookingSection');
    const bookingForm = document.getElementById('bookingForm');
    const bookingAlert = document.getElementById('bookingAlert');
    const selectedShowBanner = document.getElementById('selectedShowBanner');
    const bannerMovieTitle = document.getElementById('bannerMovieTitle');
    const bannerShowDetails = document.getElementById('bannerShowDetails');
    const bannerPricePerTicket = document.getElementById('bannerPricePerTicket');
    const selectedShowIdInput = document.getElementById('selectedShowId');
    const customerNameInput = document.getElementById('customerName');
    const customerEmailInput = document.getElementById('customerEmail');
    const ticketCountSelect = document.getElementById('ticketCount');
    const calcTicketPrice = document.getElementById('calcTicketPrice');
    const calcTicketQty = document.getElementById('calcTicketQty');
    const calcTotalAmount = document.getElementById('calcTotalAmount');
    const bookNowBtn = document.getElementById('bookNowBtn');

    // DOM Elements - Modal
    const successModal = document.getElementById('bookingSuccessModal');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const confirmBookingId = document.getElementById('confirmBookingId');
    const confirmMovieTitle = document.getElementById('confirmMovieTitle');
    const confirmShowTime = document.getElementById('confirmShowTime');
    const confirmTicketsCount = document.getElementById('confirmTicketsCount');
    const confirmCustomerName = document.getElementById('confirmCustomerName');
    const confirmCustomerEmail = document.getElementById('confirmCustomerEmail');
    const confirmTotalAmount = document.getElementById('confirmTotalAmount');
    const btnViewBookings = document.getElementById('btnViewBookings');

    // Initialize Page
    init();

    async function init() {
        showDetailsLoading(true);
        hideDetailsError();

        try {
            // Fetch movie details and shows concurrently
            const [movieRes, showsRes] = await Promise.all([
                fetch(`/api/movies/${encodeURIComponent(movieId)}`),
                fetch(`/api/shows/movie/${encodeURIComponent(movieId)}`)
            ]);

            const movieData = await movieRes.json();
            const showsData = await showsRes.json();

            if (!movieRes.ok || !movieData.success || !movieData.data) {
                throw new Error(movieData.message || 'Movie not found.');
            }

            currentMovie = movieData.data;
            renderMovieDetails(currentMovie);

            if (showsRes.ok && showsData.success && Array.isArray(showsData.data)) {
                availableShows = showsData.data;
                renderShows(availableShows);
            } else {
                renderShows([]);
            }

            showDetailsLoading(false);
            if (contentEl) contentEl.classList.remove('hidden');
            if (showsSection) showsSection.classList.remove('hidden');

        } catch (error) {
            console.error('Error loading movie details:', error);
            showDetailsLoading(false);
            showDetailsError(error.message || 'Failed to load movie details.');
        }
    }

    /**
     * Render Movie details column
     */
    function renderMovieDetails(movie) {
        document.title = `${movie.title} - MovieBook`;

        if (titleEl) titleEl.textContent = movie.title;
        if (genreEl) genreEl.textContent = movie.genre || 'Action';
        if (durationEl) durationEl.textContent = `⏱ ${movie.duration_minutes || 0} mins`;
        if (languageEl) languageEl.textContent = movie.language || 'English';
        if (releaseDateEl) {
            releaseDateEl.textContent = movie.release_date ? `📅 Released: ${formatDate(movie.release_date)}` : '';
            if (!movie.release_date) releaseDateEl.style.display = 'none';
        }
        if (descriptionEl) descriptionEl.textContent = movie.description || 'No description available for this movie.';

        if (posterImg) {
            const fallback = 'https://placehold.co/300x450/1a1a2e/e94560?text=No+Poster';
            posterImg.src = movie.poster_url || fallback;
            posterImg.alt = movie.title;
            posterImg.onerror = function() {
                this.onerror = null;
                this.src = fallback;
            };
        }
    }

    /**
     * Render shows cards
     */
    function renderShows(shows) {
        if (!showsList) return;
        showsList.innerHTML = '';

        if (!shows || shows.length === 0) {
            if (noShowsMessage) {
                noShowsMessage.classList.remove('hidden');
                noShowsMessage.style.display = 'block';
            }
            showsList.style.display = 'none';
            return;
        }

        if (noShowsMessage) {
            noShowsMessage.classList.add('hidden');
            noShowsMessage.style.display = 'none';
        }
        showsList.style.display = 'grid';

        shows.forEach(show => {
            const isSoldOut = Number(show.available_seats) <= 0;
            const card = document.createElement('div');
            card.className = `show-card ${isSoldOut ? 'sold-out' : ''}`;
            card.dataset.showId = show.show_id;

            const formattedDate = formatDate(show.show_date);
            const formattedTime = formatTime(show.show_time);
            const formattedPrice = formatCurrency(show.ticket_price);

            card.innerHTML = `
                <div class="show-date">${escapeHtml(formattedDate)}</div>
                <div class="show-time">${escapeHtml(formattedTime)}</div>
                <div class="show-price">${formattedPrice} <span style="font-size:0.75rem; color:var(--text-secondary); font-weight:normal;">/ ticket</span></div>
                <div class="show-seats ${isSoldOut ? 'text-danger' : 'text-success'}">
                    ${isSoldOut ? 'Sold Out' : `Seats: ${show.available_seats} / ${show.total_seats}`}
                </div>
                <button type="button" class="btn ${isSoldOut ? 'btn-secondary' : 'btn-primary'} select-show-btn" ${isSoldOut ? 'disabled' : ''}>
                    ${isSoldOut ? 'Sold Out' : 'Select Show'}
                </button>
            `;

            if (!isSoldOut) {
                const selectBtn = card.querySelector('.select-show-btn');
                const handleSelect = () => {
                    // Remove selected state from other cards
                    document.querySelectorAll('.show-card').forEach(c => c.classList.remove('selected'));
                    card.classList.add('selected');
                    selectShow(show);
                };

                selectBtn.addEventListener('click', handleSelect);
                card.addEventListener('click', (e) => {
                    if (e.target !== selectBtn) {
                        handleSelect();
                    }
                });
            }

            showsList.appendChild(card);
        });
    }

    /**
     * Handle show selection
     */
    function selectShow(show) {
        selectedShow = show;

        if (selectedShowIdInput) selectedShowIdInput.value = show.show_id;
        if (bannerMovieTitle && currentMovie) bannerMovieTitle.textContent = currentMovie.title;
        if (bannerShowDetails) {
            bannerShowDetails.textContent = `Date: ${formatDate(show.show_date)} | Time: ${formatTime(show.show_time)} | Available: ${show.available_seats} seats`;
        }
        if (bannerPricePerTicket) {
            bannerPricePerTicket.textContent = formatCurrency(show.ticket_price);
        }

        // Adjust ticketCount options dynamically up to available_seats (max 10)
        if (ticketCountSelect) {
            const maxAllowed = Math.min(10, Math.max(1, Number(show.available_seats)));
            const currentVal = parseInt(ticketCountSelect.value, 10) || 1;
            ticketCountSelect.innerHTML = '';
            for (let i = 1; i <= maxAllowed; i++) {
                const opt = document.createElement('option');
                opt.value = i;
                opt.textContent = `${i} Ticket${i > 1 ? 's' : ''}`;
                if (i === Math.min(currentVal, maxAllowed)) {
                    opt.selected = true;
                }
                ticketCountSelect.appendChild(opt);
            }
        }

        updateTotal();

        // Reveal booking section & scroll smoothly
        if (bookingSection) {
            bookingSection.classList.remove('hidden');
            bookingSection.style.display = 'block';
            bookingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    /**
     * Recalculate price breakdown
     */
    function updateTotal() {
        if (!selectedShow) return;

        const ticketQty = parseInt(ticketCountSelect ? ticketCountSelect.value : 1, 10) || 1;
        const price = Number(selectedShow.ticket_price) || 0;
        const total = price * ticketQty;

        if (calcTicketPrice) calcTicketPrice.textContent = formatCurrency(price);
        if (calcTicketQty) calcTicketQty.textContent = ticketQty;
        if (calcTotalAmount) calcTotalAmount.textContent = formatCurrency(total);
    }

    // Ticket count change event
    if (ticketCountSelect) {
        ticketCountSelect.addEventListener('change', updateTotal);
    }

    /**
     * Booking form submit handler
     */
    if (bookingForm) {
        bookingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideBookingAlert();

            if (!selectedShow) {
                showBookingAlert('Please select a showtime first.', 'error');
                return;
            }

            const customerName = (customerNameInput ? customerNameInput.value : '').trim();
            const customerEmail = (customerEmailInput ? customerEmailInput.value : '').trim();
            const ticketCount = parseInt(ticketCountSelect ? ticketCountSelect.value : 1, 10);

            // Validations
            if (!customerName) {
                showBookingAlert('Please enter your full name.', 'error');
                if (customerNameInput) customerNameInput.focus();
                return;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!customerEmail || !emailRegex.test(customerEmail)) {
                showBookingAlert('Please enter a valid email address.', 'error');
                if (customerEmailInput) customerEmailInput.focus();
                return;
            }

            if (isNaN(ticketCount) || ticketCount < 1 || ticketCount > 10) {
                showBookingAlert('Please select between 1 and 10 tickets.', 'error');
                return;
            }

            if (ticketCount > Number(selectedShow.available_seats)) {
                showBookingAlert(`Only ${selectedShow.available_seats} seats are currently available for this show.`, 'error');
                return;
            }

            // Set button loading state
            setButtonLoading(bookNowBtn, true, 'Booking Tickets...');

            try {
                const response = await fetch('/api/bookings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        customer_name: customerName,
                        email: customerEmail,
                        show_id: selectedShow.show_id,
                        number_of_tickets: ticketCount
                    })
                });

                const result = await response.json();

                if (!response.ok || !result.success) {
                    throw new Error(result.message || 'Booking failed. Please try again.');
                }

                // Update local show availability
                selectedShow.available_seats -= ticketCount;

                // Open Confirmation Modal with details
                const booking = result.data || {};
                showBookingConfirmation(booking, customerName, customerEmail, ticketCount);

                // Re-render shows to reflect decreased seat count
                renderShows(availableShows);

            } catch (error) {
                console.error('Booking submission error:', error);
                showBookingAlert(error.message || 'An unexpected error occurred while booking. Please try again.', 'error');
            } finally {
                setButtonLoading(bookNowBtn, false, 'Confirm & Book Tickets Now');
            }
        });
    }

    /**
     * Show booking confirmation details modal
     */
    function showBookingConfirmation(booking, name, email, ticketCount) {
        if (bookingSection) {
            bookingSection.style.display = 'none';
        }

        const bookingId = booking.booking_id || booking.id || 'N/A';
        const totalPaid = booking.total_amount || (Number(selectedShow.ticket_price) * ticketCount);

        if (confirmBookingId) confirmBookingId.textContent = `#BK${bookingId}`;
        if (confirmMovieTitle && currentMovie) confirmMovieTitle.textContent = currentMovie.title;
        if (confirmShowTime && selectedShow) {
            confirmShowTime.textContent = `${formatDate(selectedShow.show_date)} at ${formatTime(selectedShow.show_time)}`;
        }
        if (confirmTicketsCount) confirmTicketsCount.textContent = `${ticketCount} Ticket${ticketCount > 1 ? 's' : ''}`;
        if (confirmCustomerName) confirmCustomerName.textContent = name;
        if (confirmCustomerEmail) confirmCustomerEmail.textContent = email;
        if (confirmTotalAmount) confirmTotalAmount.textContent = formatCurrency(totalPaid);

        if (btnViewBookings) {
            btnViewBookings.href = `bookings.html?email=${encodeURIComponent(email)}`;
        }

        if (successModal) {
            successModal.classList.add('active');
            successModal.style.display = 'flex';
        }
    }

    // Modal Close Handlers
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', () => {
            if (successModal) {
                successModal.classList.remove('active');
                successModal.style.display = 'none';
            }
        });
    }

    if (successModal) {
        successModal.addEventListener('click', (e) => {
            if (e.target === successModal) {
                successModal.classList.remove('active');
                successModal.style.display = 'none';
            }
        });
    }

    /**
     * Helpers: Loading, Errors, and Formatters
     */
    function showDetailsLoading(isLoading) {
        if (loadingEl) {
            loadingEl.style.display = isLoading ? 'flex' : 'none';
            if (isLoading) loadingEl.classList.remove('hidden');
            else loadingEl.classList.add('hidden');
        }
    }

    function showDetailsError(msg) {
        if (errorAlert) {
            errorAlert.textContent = msg;
            errorAlert.classList.remove('hidden');
            errorAlert.style.display = 'block';
        }
    }

    function hideDetailsError() {
        if (errorAlert) {
            errorAlert.classList.add('hidden');
            errorAlert.style.display = 'none';
        }
    }

    function showBookingAlert(msg, type = 'error') {
        if (bookingAlert) {
            bookingAlert.textContent = msg;
            bookingAlert.className = `alert alert-${type === 'error' ? 'error' : 'success'}`;
            bookingAlert.classList.remove('hidden');
            bookingAlert.style.display = 'block';
        }
    }

    function hideBookingAlert() {
        if (bookingAlert) {
            bookingAlert.classList.add('hidden');
            bookingAlert.style.display = 'none';
        }
    }

    function setButtonLoading(btn, isLoading, text) {
        if (!btn) return;
        btn.disabled = isLoading;
        btn.innerHTML = isLoading 
            ? `<span class="spinner" style="width:16px;height:16px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:8px;"></span>${text}` 
            : `<span>${text}</span>`;
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
