/**
 * Movie Ticket Booking System - My Bookings JavaScript
 * Handles searching reservations by customer email, displaying booking records,
 * formatting timestamps and currency, and managing ticket cancellations.
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const searchForm = document.getElementById('bookingSearchForm');
    const emailInput = document.getElementById('searchEmail');
    const searchBtn = document.getElementById('searchBtn');
    const alertEl = document.getElementById('bookingsAlert');
    const loadingEl = document.getElementById('bookingsLoading');
    const resultsSection = document.getElementById('bookingsResults');
    const resultsSummary = document.getElementById('resultsSummaryText');
    const bookingsContainer = document.getElementById('bookingsContainer');
    const emptyStateEl = document.getElementById('noBookingsState');

    // Cancel Modal Elements
    const cancelModal = document.getElementById('cancelModal');
    const cancelModalCloseBtn = document.getElementById('cancelModalCloseBtn');
    const dismissCancelBtn = document.getElementById('dismissCancelBtn');
    const confirmCancelBtn = document.getElementById('confirmCancelBtn');
    const modalCancelBookingId = document.getElementById('modalCancelBookingId');
    const modalCancelMovieTitle = document.getElementById('modalCancelMovieTitle');
    const modalCancelShowTime = document.getElementById('modalCancelShowTime');
    const modalCancelTickets = document.getElementById('modalCancelTickets');

    let currentEmail = '';
    let pendingCancelId = null;

    // Check if email was provided in URL query parameters (e.g. ?email=user@example.com)
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email');
    if (emailParam) {
        if (emailInput) emailInput.value = emailParam.trim();
        searchBookings(emailParam.trim());
    }

    // Search form submission handler
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = (emailInput ? emailInput.value : '').trim();

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!email || !emailRegex.test(email)) {
                showAlert('Please enter a valid email address.', 'error');
                if (emailInput) emailInput.focus();
                return;
            }

            searchBookings(email);
        });
    }

    /**
     * Fetch bookings from GET /api/bookings?email=...
     */
    async function searchBookings(email) {
        currentEmail = email;
        hideAlert();
        showLoading(true);

        if (resultsSection) resultsSection.classList.remove('hidden');
        if (emptyStateEl) {
            emptyStateEl.classList.add('hidden');
            emptyStateEl.style.display = 'none';
        }
        if (bookingsContainer) bookingsContainer.innerHTML = '';

        try {
            const response = await fetch(`/api/bookings?email=${encodeURIComponent(email)}`);
            const data = await response.json();

            showLoading(false);

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Failed to retrieve bookings.');
            }

            const bookings = Array.isArray(data.data) ? data.data : [];
            renderBookings(bookings);

        } catch (error) {
            console.error('Error fetching bookings:', error);
            showLoading(false);
            showAlert(error.message || 'An error occurred while fetching your bookings.', 'error');
            if (emptyStateEl) emptyStateEl.style.display = 'none';
        }
    }

    /**
     * Render bookings list / cards
     */
    function renderBookings(bookings) {
        if (!bookingsContainer) return;

        bookingsContainer.innerHTML = '';

        if (!bookings || bookings.length === 0) {
            if (emptyStateEl) {
                emptyStateEl.classList.remove('hidden');
                emptyStateEl.style.display = 'block';
            }
            if (resultsSummary) {
                resultsSummary.textContent = `No reservations found for ${currentEmail}`;
            }
            return;
        }

        if (emptyStateEl) {
            emptyStateEl.classList.add('hidden');
            emptyStateEl.style.display = 'none';
        }

        if (resultsSummary) {
            resultsSummary.textContent = `Found ${bookings.length} reservation${bookings.length > 1 ? 's' : ''} for ${currentEmail}`;
        }

        // Create cards grid
        const listWrapper = document.createElement('div');
        listWrapper.className = 'bookings-list';

        bookings.forEach(b => {
            const card = document.createElement('div');
            card.className = 'booking-card';

            const bookingId = b.booking_id || b.id;
            const isConfirmed = (b.booking_status || 'CONFIRMED').toUpperCase() === 'CONFIRMED';
            const statusClass = isConfirmed ? 'status-confirmed' : 'status-cancelled';
            const statusText = isConfirmed ? 'CONFIRMED' : 'CANCELLED';

            const showDate = formatDate(b.show_date);
            const showTime = formatTime(b.show_time);
            const bookingDate = formatDateTime(b.booking_date);
            const totalFormatted = formatCurrency(b.total_amount);

            card.innerHTML = `
                <div class="booking-card-header">
                    <div>
                        <span class="booking-id-tag">#BK${bookingId}</span>
                        <h3 class="booking-movie-title">${escapeHtml(b.movie_title || currentMovieTitle(b) || 'Cinema Ticket')}</h3>
                    </div>
                    <span class="badge ${statusClass}">${statusText}</span>
                </div>

                <div class="booking-card-body">
                    <div class="booking-info-item">
                        <span class="info-label">Show Date &amp; Time</span>
                        <span class="info-value">📅 ${showDate} at ${showTime}</span>
                    </div>
                    <div class="booking-info-item">
                        <span class="info-label">Tickets</span>
                        <span class="info-value">🎟️ ${b.number_of_tickets} Seat${b.number_of_tickets > 1 ? 's' : ''}</span>
                    </div>
                    <div class="booking-info-item">
                        <span class="info-label">Total Amount</span>
                        <span class="info-value price-highlight">${totalFormatted}</span>
                    </div>
                    <div class="booking-info-item">
                        <span class="info-label">Booked On</span>
                        <span class="info-value text-muted">${bookingDate}</span>
                    </div>
                </div>

                ${isConfirmed ? `
                <div class="booking-card-footer">
                    <button type="button" class="btn btn-outline-danger btn-sm cancel-booking-btn" data-id="${bookingId}">
                        Cancel Booking
                    </button>
                </div>
                ` : `
                <div class="booking-card-footer">
                    <span class="text-muted" style="font-size: 0.85rem;">This booking was cancelled and seats have been restored.</span>
                </div>
                `}
            `;

            // Setup cancel action
            if (isConfirmed) {
                const cancelBtn = card.querySelector('.cancel-booking-btn');
                if (cancelBtn) {
                    cancelBtn.addEventListener('click', () => {
                        promptCancelBooking(b);
                    });
                }
            }

            listWrapper.appendChild(card);
        });

        bookingsContainer.appendChild(listWrapper);
    }

    /**
     * Show confirmation prompt before cancellation
     */
    function promptCancelBooking(booking) {
        pendingCancelId = booking.booking_id || booking.id;

        if (cancelModal) {
            if (modalCancelBookingId) modalCancelBookingId.textContent = `#BK${pendingCancelId}`;
            if (modalCancelMovieTitle) modalCancelMovieTitle.textContent = booking.movie_title || 'Movie';
            if (modalCancelShowTime) modalCancelShowTime.textContent = `${formatDate(booking.show_date)} at ${formatTime(booking.show_time)}`;
            if (modalCancelTickets) modalCancelTickets.textContent = `${booking.number_of_tickets} Ticket(s)`;

            cancelModal.classList.add('active');
            cancelModal.style.display = 'flex';
        } else {
            // Fallback native confirm dialog
            const confirmed = window.confirm('Are you sure you want to cancel this booking? This cannot be undone.');
            if (confirmed) {
                executeCancelBooking(pendingCancelId);
            }
        }
    }

    // Modal Close and Dismiss Handlers
    if (cancelModalCloseBtn) {
        cancelModalCloseBtn.addEventListener('click', closeCancelModal);
    }
    if (dismissCancelBtn) {
        dismissCancelBtn.addEventListener('click', closeCancelModal);
    }
    if (cancelModal) {
        cancelModal.addEventListener('click', (e) => {
            if (e.target === cancelModal) {
                closeCancelModal();
            }
        });
    }

    // Modal Confirmation Button Handler
    if (confirmCancelBtn) {
        confirmCancelBtn.addEventListener('click', () => {
            if (pendingCancelId) {
                executeCancelBooking(pendingCancelId);
            }
        });
    }

    function closeCancelModal() {
        if (cancelModal) {
            cancelModal.classList.remove('active');
            cancelModal.style.display = 'none';
        }
        pendingCancelId = null;
    }

    /**
     * Call PUT /api/bookings/:id/cancel
     */
    async function executeCancelBooking(bookingId) {
        if (!bookingId) return;

        if (confirmCancelBtn) {
            confirmCancelBtn.disabled = true;
            confirmCancelBtn.textContent = 'Cancelling...';
        }

        try {
            const response = await fetch(`/api/bookings/${encodeURIComponent(bookingId)}/cancel`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            closeCancelModal();

            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Failed to cancel reservation.');
            }

            showAlert(result.message || 'Booking cancelled successfully. Seats have been restored.', 'success');

            // Refresh the current search
            if (currentEmail) {
                searchBookings(currentEmail);
            }

        } catch (error) {
            console.error('Cancellation error:', error);
            closeCancelModal();
            showAlert(error.message || 'Failed to cancel booking. Please try again.', 'error');
        } finally {
            if (confirmCancelBtn) {
                confirmCancelBtn.disabled = false;
                confirmCancelBtn.textContent = 'Yes, Cancel Booking';
            }
        }
    }

    /**
     * Helpers
     */
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

    function currentMovieTitle(b) {
        return b.title || b.movie || null;
    }
});
