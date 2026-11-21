/**
 * CinePass Premium - Movie Details & Interactive Seat Booking Logic
 * Manages movie metadata, dynamic dates, theatre showtimes,
 * 8x8 interactive seat selection, coupon discounts, payment simulation,
 * and digital ticket generation.
 */

document.addEventListener('DOMContentLoaded', () => {
    // URL Params
    const urlParams = new URLSearchParams(window.location.search);
    const movieId = urlParams.get('id');

    if (!movieId) {
        showError('No movie selected. Please return to the homepage and select a movie.');
        return;
    }

    // DOM Elements - Movie Details
    const loadingEl = document.getElementById('movieDetailsLoading');
    const errorEl = document.getElementById('movieDetailsError');
    const contentEl = document.getElementById('movieDetailsContent');
    const posterEl = document.getElementById('moviePoster');
    const titleEl = document.getElementById('movieTitle');
    const genreEl = document.getElementById('movieGenre');
    const durationEl = document.getElementById('movieDuration');
    const languageEl = document.getElementById('movieLanguage');
    const releaseStatusEl = document.getElementById('movieReleaseStatus');
    const ratingBadgeEl = document.getElementById('movieRatingBadge');
    const castCrewText = document.getElementById('castCrewText');
    const descEl = document.getElementById('movieDescription');
    const watchlistToggleBtn = document.getElementById('watchlistToggleBtn');

    // DOM Elements - Shows & Theatres
    const showsSection = document.getElementById('showsSection');
    const showsLoading = document.getElementById('showsLoading');
    const theatresShowsList = document.getElementById('theatresShowsList');
    const noShowsMessage = document.getElementById('noShowsMessage');
    const dateFilterBar = document.getElementById('dateFilterBar');
    const citySelect = document.getElementById('citySelect');

    // DOM Elements - Seat Booking Section
    const seatSection = document.getElementById('seatSelectionSection');
    const selectedShowMeta = document.getElementById('selectedShowMetadata');
    const changeShowBtn = document.getElementById('changeShowBtn');
    const seatMapLayout = document.getElementById('seatMapLayout');
    const custNameInput = document.getElementById('custName');
    const custEmailInput = document.getElementById('custEmail');
    const couponInput = document.getElementById('couponInput');
    const applyCouponBtn = document.getElementById('applyCouponBtn');
    const couponMessage = document.getElementById('couponMessage');
    const summarySelectedSeats = document.getElementById('summarySelectedSeats');
    const summarySubtotal = document.getElementById('summarySubtotal');
    const summaryConvenienceFee = document.getElementById('summaryConvenienceFee');
    const discountRow = document.getElementById('discountRow');
    const summaryDiscount = document.getElementById('summaryDiscount');
    const summaryTotalAmount = document.getElementById('summaryTotalAmount');
    const proceedToPayBtn = document.getElementById('proceedToPayBtn');

    // DOM Elements - Payment Modal & Tabs
    const paymentModal = document.getElementById('paymentModal');
    const modalPayableAmount = document.getElementById('modalPayableAmount');
    const cancelPaymentBtn = document.getElementById('cancelPaymentBtn');
    const confirmPaymentSuccessBtn = document.getElementById('confirmPaymentSuccessBtn');
    const paymentTabs = document.querySelectorAll('.payment-tab-btn');
    const tabUpi = document.getElementById('tabContentUpi');
    const tabCard = document.getElementById('tabContentCard');
    const tabNetbanking = document.getElementById('tabContentNetbanking');

    // DOM Elements - Ticket Modal
    const ticketModal = document.getElementById('ticketModal');

    // Reviews Elements
    const reviewsList = document.getElementById('reviewsList');
    const addReviewForm = document.getElementById('addReviewForm');

    // State Variables
    let currentMovie = null;
    let selectedDate = getTodayDateString();
    let selectedCity = 'Mumbai';
    let currentShow = null;
    let availableSeatsData = [];
    let selectedSeatsMap = new Map(); // seat_id -> seatObj
    let appliedCouponData = null;
    let inWatchlist = false;

    // Prefill user details if logged in
    const userJson = localStorage.getItem('cinepass_user');
    const userToken = localStorage.getItem('cinepass_token');
    if (userJson) {
        try {
            const u = JSON.parse(userJson);
            if (custNameInput) custNameInput.value = u.name || '';
            if (custEmailInput) custEmailInput.value = u.email || '';
        } catch (e) {}
    }

    // City selector change
    if (citySelect) {
        citySelect.addEventListener('change', (e) => {
            selectedCity = e.target.value;
            fetchShows();
        });
    }

    // Initialize Page
    initDates();
    fetchMovieDetails();
    fetchReviews();
    checkWatchlistStatus();

    /**
     * Generate Today, Tomorrow, and Next 2 days date pills
     */
    function initDates() {
        if (!dateFilterBar) return;
        dateFilterBar.innerHTML = '';

        for (let i = 0; i < 4; i++) {
            const d = new Date();
            d.setDate(d.getDate() + i);
            const dateStr = d.toISOString().split('T')[0];

            let label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            if (i === 0) label = `Today, ${d.getDate()} ${d.toLocaleDateString('en-US', { month: 'short' })}`;
            if (i === 1) label = `Tomorrow, ${d.getDate()} ${d.toLocaleDateString('en-US', { month: 'short' })}`;

            const chip = document.createElement('button');
            chip.className = `filter-chip ${i === 0 ? 'active' : ''}`;
            chip.textContent = label;
            chip.setAttribute('data-date', dateStr);

            chip.addEventListener('click', () => {
                document.querySelectorAll('#dateFilterBar .filter-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                selectedDate = dateStr;
                fetchShows();
            });

            dateFilterBar.appendChild(chip);
        }
    }

    function getTodayDateString() {
        return new Date().toISOString().split('T')[0];
    }

    /**
     * Fetch movie details from MySQL
     */
    async function fetchMovieDetails() {
        try {
            showLoading(true);
            const res = await fetch(`/api/movies/${movieId}`);
            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Movie not found');
            }

            currentMovie = data.data;
            renderMovieDetails(currentMovie);
            fetchShows();
        } catch (err) {
            console.error('Error loading movie:', err);
            showLoading(false);
            showError(err.message);
        }
    }

    /**
     * Render movie hero details
     */
    function renderMovieDetails(movie) {
        showLoading(false);
        if (contentEl) contentEl.classList.remove('hidden');
        if (showsSection) showsSection.classList.remove('hidden');

        if (posterEl) posterEl.src = movie.poster_url || '/images/posters/the-dark-knight.svg';
        if (titleEl) titleEl.textContent = movie.title;
        if (genreEl) genreEl.textContent = movie.genre;
        if (durationEl) durationEl.textContent = `⏱ ${Math.floor(movie.duration_minutes / 60)}h ${movie.duration_minutes % 60}m`;
        if (languageEl) languageEl.textContent = movie.language;
        if (descEl) descEl.textContent = movie.description || '';
        if (castCrewText) castCrewText.textContent = movie.cast_crew || 'Christopher Nolan Ensemble';
        
        if (ratingBadgeEl) {
            ratingBadgeEl.textContent = `★ ${movie.rating ? parseFloat(movie.rating).toFixed(1) : '4.8'} (${movie.votes_count || 1200} Votes)`;
        }

        if (releaseStatusEl) {
            const isComingSoon = movie.release_status === 'COMING_SOON';
            releaseStatusEl.textContent = isComingSoon ? 'COMING SOON' : 'NOW SHOWING';
            releaseStatusEl.style.color = isComingSoon ? '#ffab00' : '#00e676';
        }

        document.title = `${movie.title} - Book Tickets Online | CinePass`;
    }

    /**
     * Fetch scheduled shows grouped by theatre
     */
    async function fetchShows() {
        if (!theatresShowsList) return;
        theatresShowsList.innerHTML = '';
        if (showsLoading) showsLoading.classList.remove('hidden');
        if (noShowsMessage) noShowsMessage.classList.add('hidden');

        try {
            let url = `/api/shows/movie/${movieId}?date=${selectedDate}`;
            if (selectedCity && selectedCity !== 'all') {
                url += `&city=${encodeURIComponent(selectedCity)}`;
            }

            const res = await fetch(url);
            const data = await res.json();
            if (showsLoading) showsLoading.classList.add('hidden');

            const shows = data.data || [];
            if (shows.length === 0) {
                if (noShowsMessage) noShowsMessage.classList.remove('hidden');
                return;
            }

            renderTheatresShows(shows);
        } catch (e) {
            console.error('Error fetching shows:', e);
            if (showsLoading) showsLoading.classList.add('hidden');
        }
    }

    /**
     * Render Theatres with Showtimes
     */
    function renderTheatresShows(shows) {
        theatresShowsList.innerHTML = '';

        // Group shows by theatre_name
        const groups = {};
        shows.forEach(s => {
            const tName = s.theatre_name || 'CinePass Grand Multiplex';
            if (!groups[tName]) {
                groups[tName] = {
                    theatre_name: tName,
                    city: s.city,
                    address: s.address,
                    shows: []
                };
            }
            groups[tName].shows.push(s);
        });

        Object.values(groups).forEach(group => {
            const theatreCard = document.createElement('div');
            theatreCard.className = 'booking-item-card';
            theatreCard.style.marginBottom = '20px';

            let showPillsHtml = '';
            group.shows.forEach(s => {
                const timeParts = s.show_time.split(':');
                const timeFormatted = `${timeParts[0]}:${timeParts[1]}`;
                const isSelected = currentShow && currentShow.show_id === s.show_id;

                showPillsHtml += `
                    <button type="button" 
                            class="show-time-btn ${isSelected ? 'selected' : ''}" 
                            data-show-id="${s.show_id}"
                            title="Base Price: ₹${parseFloat(s.ticket_price).toFixed(0)} | Available Seats: ${s.available_seats}"
                            style="display: flex; flex-direction: column; align-items: center; padding: 10px 18px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--card-bg); color: #fff; cursor: pointer; transition: var(--transition);">
                        <span style="font-size: 1.05rem; font-weight: 700;">${timeFormatted}</span>
                        <span style="font-size: 0.72rem; color: #00d2d3; text-transform: uppercase; margin-top: 2px;">${escapeHtml(s.screen_name)}</span>
                        <span style="font-size: 0.75rem; color: #f5a623; font-weight: 600; margin-top: 4px;">₹${parseFloat(s.ticket_price).toFixed(0)}</span>
                    </button>
                `;
            });

            theatreCard.innerHTML = `
                <div style="margin-bottom: 16px;">
                    <h3 style="font-size: 1.25rem; font-weight: 700; color: #fff;">🏢 ${escapeHtml(group.theatre_name)}</h3>
                    <p style="font-size: 0.85rem; color: var(--text-muted);">📍 ${escapeHtml(group.address || group.city)}</p>
                </div>
                <div style="display: flex; gap: 14px; flex-wrap: wrap;">
                    ${showPillsHtml}
                </div>
            `;

            // Bind show pill click events
            theatreCard.querySelectorAll('.show-time-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const showId = parseInt(btn.getAttribute('data-show-id'), 10);
                    selectShow(showId);
                });
            });

            theatresShowsList.appendChild(theatreCard);
        });
    }

    /**
     * Select a show and load interactive seat map
     */
    async function selectShow(showId) {
        try {
            // Highlight active show button
            document.querySelectorAll('.show-time-btn').forEach(b => {
                b.style.borderColor = b.getAttribute('data-show-id') === String(showId) ? 'var(--accent-red)' : 'var(--border-color)';
                b.style.background = b.getAttribute('data-show-id') === String(showId) ? 'rgba(233, 69, 96, 0.2)' : 'var(--card-bg)';
            });

            const res = await fetch(`/api/seats/show/${showId}`);
            const data = await res.json();

            if (!res.ok || !data.success) {
                alert(data.message || 'Error loading seat map');
                return;
            }

            currentShow = data.show;
            availableSeatsData = data.seats || [];
            selectedSeatsMap.clear();
            appliedCouponData = null;
            if (discountRow) discountRow.style.display = 'none';
            if (couponMessage) couponMessage.style.display = 'none';

            // Show seat section
            if (seatSection) {
                seatSection.classList.remove('hidden');
                seatSection.scrollIntoView({ behavior: 'smooth' });
            }

            if (selectedShowMeta) {
                selectedShowMeta.textContent = `${currentShow.movie_title} • ${currentShow.theatre_name} (${currentShow.screen_name}) • ${currentShow.show_date} at ${currentShow.show_time}`;
            }

            renderInteractiveSeatMap();
            updateCalculations();

        } catch (e) {
            console.error('Error selecting show:', e);
        }
    }

    if (changeShowBtn) {
        changeShowBtn.addEventListener('click', () => {
            if (seatSection) seatSection.classList.add('hidden');
            if (showsSection) showsSection.scrollIntoView({ behavior: 'smooth' });
        });
    }

    /**
     * Render 8x8 Interactive Cinema Seat Grid
     */
    function renderInteractiveSeatMap() {
        if (!seatMapLayout) return;
        seatMapLayout.innerHTML = '';

        // Group seats by row (A to H)
        const rowMap = {};
        availableSeatsData.forEach(s => {
            const r = s.row;
            if (!rowMap[r]) rowMap[r] = [];
            rowMap[r].push(s);
        });

        // Rows sorted A -> H
        const sortedRows = Object.keys(rowMap).sort();

        sortedRows.forEach(r => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'seat-row';

            // Left row label
            const labelLeft = document.createElement('span');
            labelLeft.className = 'seat-row-label';
            labelLeft.textContent = r;
            rowDiv.appendChild(labelLeft);

            const rowSeats = rowMap[r].sort((a, b) => a.col - b.col);

            rowSeats.forEach((seat, idx) => {
                // Add aisle gap after column 4
                if (idx === 4) {
                    const aisle = document.createElement('div');
                    aisle.className = 'seat-aisle';
                    rowDiv.appendChild(aisle);
                }

                const seatBtn = document.createElement('button');
                seatBtn.type = 'button';
                seatBtn.className = `seat-btn ${seat.tier === 'RECLINER' ? 'tier-recliner' : ''} ${seat.tier === 'PREMIUM' ? 'tier-premium' : ''} ${seat.is_occupied ? 'occupied' : ''}`;
                seatBtn.textContent = seat.seat_number;
                seatBtn.setAttribute('data-seat-id', seat.seat_id);
                seatBtn.title = `Seat ${seat.seat_number} (${seat.tier}) - ₹${seat.price}`;

                if (!seat.is_occupied) {
                    seatBtn.addEventListener('click', () => {
                        toggleSeatSelection(seat, seatBtn);
                    });
                } else {
                    seatBtn.disabled = true;
                }

                rowDiv.appendChild(seatBtn);
            });

            // Right row label
            const labelRight = document.createElement('span');
            labelRight.className = 'seat-row-label';
            labelRight.textContent = r;
            rowDiv.appendChild(labelRight);

            seatMapLayout.appendChild(rowDiv);
        });
    }

    /**
     * Toggle selection of an individual seat
     */
    function toggleSeatSelection(seat, seatBtn) {
        if (selectedSeatsMap.has(seat.seat_id)) {
            selectedSeatsMap.delete(seat.seat_id);
            seatBtn.classList.remove('selected');
        } else {
            if (selectedSeatsMap.size >= 8) {
                alert('Maximum 8 seats can be selected per transaction.');
                return;
            }
            selectedSeatsMap.set(seat.seat_id, seat);
            seatBtn.classList.add('selected');
        }

        updateCalculations();
    }

    /**
     * Calculate and display real-time pricing breakdown
     */
    function updateCalculations() {
        const seats = Array.from(selectedSeatsMap.values());
        const count = seats.length;

        if (count === 0) {
            if (summarySelectedSeats) summarySelectedSeats.textContent = 'None selected (Click seats above)';
            if (summarySubtotal) summarySubtotal.textContent = '₹0.00';
            if (summaryConvenienceFee) summaryConvenienceFee.textContent = '₹0.00';
            if (summaryTotalAmount) summaryTotalAmount.textContent = '₹0.00';
            if (proceedToPayBtn) {
                proceedToPayBtn.disabled = false;
                proceedToPayBtn.innerHTML = '<span>💳 Select Seat(s) Above to Proceed</span>';
                proceedToPayBtn.style.opacity = '0.85';
            }
            return;
        }

        const seatNumbers = seats.map(s => s.seat_number).join(', ');
        const subtotal = seats.reduce((sum, s) => sum + s.price, 0);
        const convenienceFee = count * 25.00;
        let grossAmount = subtotal + convenienceFee;
        let discount = 0.00;

        if (appliedCouponData) {
            discount = appliedCouponData.discount_amount;
        }

        const totalPayable = Math.max(0, grossAmount - discount);

        if (summarySelectedSeats) summarySelectedSeats.textContent = `${seatNumbers} (${count} Seat${count > 1 ? 's' : ''})`;
        if (summarySubtotal) summarySubtotal.textContent = `₹${subtotal.toFixed(2)}`;
        if (summaryConvenienceFee) summaryConvenienceFee.textContent = `₹${convenienceFee.toFixed(2)}`;
        if (summaryTotalAmount) summaryTotalAmount.textContent = `₹${totalPayable.toFixed(2)}`;

        if (proceedToPayBtn) {
            proceedToPayBtn.disabled = false;
            proceedToPayBtn.style.opacity = '1';
            proceedToPayBtn.innerHTML = `<span>💳 Proceed to Pay ₹${totalPayable.toFixed(2)} &amp; Book Tickets &rarr;</span>`;
        }
    }

    /**
     * Apply Coupon Code
     */
    if (applyCouponBtn && couponInput) {
        applyCouponBtn.addEventListener('click', async () => {
            const code = couponInput.value.trim();
            if (!code) {
                alert('Please enter a coupon code.');
                return;
            }

            const seats = Array.from(selectedSeatsMap.values());
            if (seats.length === 0) {
                alert('Please select your seats before applying a coupon.');
                return;
            }

            const subtotal = seats.reduce((sum, s) => sum + s.price, 0) + (seats.length * 25.00);

            try {
                const res = await fetch('/api/coupons/apply', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code, amount: subtotal })
                });

                const data = await res.json();
                if (!res.ok || !data.success) {
                    if (couponMessage) {
                        couponMessage.style.display = 'block';
                        couponMessage.style.color = '#ff4757';
                        couponMessage.textContent = data.message || 'Invalid coupon code';
                    }
                    appliedCouponData = null;
                    if (discountRow) discountRow.style.display = 'none';
                    updateCalculations();
                    return;
                }

                appliedCouponData = data.coupon;
                if (couponMessage) {
                    couponMessage.style.display = 'block';
                    couponMessage.style.color = '#00e676';
                    couponMessage.textContent = data.message;
                }
                if (discountRow && summaryDiscount) {
                    discountRow.style.display = 'flex';
                    summaryDiscount.textContent = `-₹${data.coupon.discount_amount.toFixed(2)}`;
                }
                updateCalculations();
            } catch (err) {
                console.error('Error applying coupon:', err);
            }
        });
    }

    // ==========================================================================
    // Checkout & Payment Workflow
    // ==========================================================================
    // Store the current order ID for verification later
    let currentOrderId = null;

    function openPaymentModal(amountFormatted) {
        if (modalPayableAmount) modalPayableAmount.textContent = amountFormatted;
        if (paymentModal) {
            paymentModal.classList.add('active');
            paymentModal.style.display = 'flex';
        }
    }

    function closePaymentModal() {
        if (paymentModal) {
            paymentModal.classList.remove('active');
            paymentModal.style.display = 'none';
        }
    }

    if (proceedToPayBtn) {
        proceedToPayBtn.addEventListener('click', async () => {
            const name = (custNameInput ? custNameInput.value : '').trim();
            const email = (custEmailInput ? custEmailInput.value : '').trim();

            if (selectedSeatsMap.size === 0) {
                if (seatMapLayout) {
                    seatMapLayout.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    seatMapLayout.style.outline = '3px solid var(--accent-red)';
                    seatMapLayout.style.boxShadow = '0 0 25px rgba(233, 69, 96, 0.8)';
                    setTimeout(() => {
                        seatMapLayout.style.outline = '';
                        seatMapLayout.style.boxShadow = '';
                    }, 2500);
                }
                alert('👉 Please click on at least one seat from the seat layout above first!');
                return;
            }

            if (!name || !email) {
                alert('Please enter your full name and email address to proceed.');
                if (!name && custNameInput) custNameInput.focus();
                else if (custEmailInput) custEmailInput.focus();
                return;
            }

            // Calculate total payable amount from UI
            const totalText = summaryTotalAmount.textContent || '₹0.00';
            const amountNumber = parseFloat(totalText.replace(/[^\d\.]/g, '')) || 0;

            if (amountNumber <= 0) {
                alert('Invalid ticket amount. Please select at least one seat.');
                return;
            }

            proceedToPayBtn.disabled = true;
            proceedToPayBtn.innerHTML = '<span>⏳ Opening Payment Gateway...</span>';

            try {
                // Create Razorpay order (or simulated order) on backend
                const createRes = await fetch('/api/payments/create-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ amount: amountNumber, receipt: 'order_' + Date.now() })
                });
                const createData = await createRes.json();
                if (!createRes.ok || !createData.success) {
                    alert('Failed to initialize payment: ' + (createData.message || 'unknown error'));
                    return;
                }
                currentOrderId = createData.order.id; // store for later verification

                // Show amount in modal and open it
                openPaymentModal(totalText);
            } catch (e) {
                console.error('Error creating payment order:', e);
                alert('Unable to initiate payment at this time.');
            } finally {
                proceedToPayBtn.disabled = false;
                updateCalculations();
            }
        });
    }

    if (cancelPaymentBtn) {
        cancelPaymentBtn.addEventListener('click', closePaymentModal);
    }
    const closePaymentModalX = document.getElementById('closePaymentModalX');
    if (closePaymentModalX) {
        closePaymentModalX.addEventListener('click', closePaymentModal);
    }
    if (paymentModal) {
        paymentModal.addEventListener('click', (e) => {
            if (e.target === paymentModal) closePaymentModal();
        });
    }

    // Payment Tab switching (UPI, Card, Netbanking)
    paymentTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            paymentTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const target = tab.getAttribute('data-tab');
            if (tabUpi) tabUpi.classList.toggle('hidden', target !== 'upi');
            if (tabCard) tabCard.classList.toggle('hidden', target !== 'card');
            if (tabNetbanking) tabNetbanking.classList.toggle('hidden', target !== 'netbanking');
        });
    });

    // Confirm Payment & Book Tickets
    if (confirmPaymentSuccessBtn) {
        confirmPaymentSuccessBtn.addEventListener('click', async () => {
            confirmPaymentSuccessBtn.disabled = true;
            confirmPaymentSuccessBtn.innerHTML = '<span>⏳ Verifying Payment &amp; Booking...</span>';

            const name = custNameInput.value.trim();
            const email = custEmailInput.value.trim();
            const seatIds = Array.from(selectedSeatsMap.keys());
            const couponCode = appliedCouponData ? appliedCouponData.code : null;

            try {
                // 1. Verify Payment on Backend
                const verifyRes = await fetch('/api/payments/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        razorpay_order_id: currentOrderId || ('order_sim_' + Date.now()),
                        razorpay_payment_id: 'pay_test_' + Date.now(),
                        is_simulator: true
                    })
                });

                const verifyData = await verifyRes.json();
                const txnId = (verifyData && verifyData.transaction_id) ? verifyData.transaction_id : ('TXN-SIM-' + Date.now());

                // 2. Execute ACID Booking Transaction in MySQL
                const headers = { 'Content-Type': 'application/json' };
                if (userToken) headers['Authorization'] = `Bearer ${userToken}`;

                const bookingRes = await fetch('/api/bookings', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        customer_name: name,
                        email: email,
                        show_id: currentShow.show_id,
                        seat_ids: seatIds,
                        coupon_code: couponCode,
                        transaction_id: txnId,
                        payment_method: 'RAZORPAY_TEST'
                    })
                });

                const bookingData = await bookingRes.json();

                if (!bookingRes.ok || !bookingData.success) {
                    throw new Error(bookingData.message || 'Booking transaction failed.');
                }

                // Close payment modal
                closePaymentModal();

                // Display Digital Cinema Ticket Modal
                displayDigitalTicket(bookingData.data);

            } catch (err) {
                alert(`Booking Error: ${err.message}`);
            } finally {
                confirmPaymentSuccessBtn.disabled = false;
                confirmPaymentSuccessBtn.innerHTML = '<span>✓ Pay Now (Test Mode)</span>';
            }
        });
    }

    /**
     * Render confirmed Digital Ticket
     */
    function displayDigitalTicket(ticket) {
        const ticketRefCode = document.getElementById('ticketRefCode');
        const ticketPosterImg = document.getElementById('ticketPosterImg');
        const ticketMovieTitle = document.getElementById('ticketMovieTitle');
        const ticketTheatreName = document.getElementById('ticketTheatreName');
        const ticketScreenName = document.getElementById('ticketScreenName');
        const ticketShowDate = document.getElementById('ticketShowDate');
        const ticketShowTime = document.getElementById('ticketShowTime');
        const ticketSeatsList = document.getElementById('ticketSeatsList');
        const ticketCustomerName = document.getElementById('ticketCustomerName');
        const ticketTotalAmount = document.getElementById('ticketTotalAmount');

        if (ticketRefCode) ticketRefCode.textContent = ticket.booking_reference;
        if (ticketPosterImg) ticketPosterImg.src = ticket.poster_url || currentMovie.poster_url;
        if (ticketMovieTitle) ticketMovieTitle.textContent = ticket.movie_title;
        if (ticketTheatreName) ticketTheatreName.textContent = ticket.theatre_name;
        if (ticketScreenName) ticketScreenName.textContent = ticket.screen_name;
        if (ticketShowDate) ticketShowDate.textContent = ticket.show_date;
        if (ticketShowTime) ticketShowTime.textContent = ticket.show_time;
        if (ticketSeatsList) ticketSeatsList.textContent = ticket.seat_numbers;
        if (ticketCustomerName) ticketCustomerName.textContent = ticket.customer_name;
        if (ticketTotalAmount) ticketTotalAmount.textContent = `₹${parseFloat(ticket.total_amount).toFixed(2)}`;

        if (ticketModal) {
            ticketModal.classList.add('active');
            ticketModal.style.display = 'flex';
            ticketModal.addEventListener('click', (e) => {
                if (e.target === ticketModal) {
                    ticketModal.classList.remove('active');
                    ticketModal.style.display = 'none';
                }
            });
        }
    }

    // ==========================================================================
    // Watchlist Logic
    // ==========================================================================
    async function checkWatchlistStatus() {
        if (!watchlistToggleBtn) return;

        // Check local storage watchlist first
        const localListJson = localStorage.getItem('cinepass_watchlist');
        if (localListJson) {
            try {
                const ids = JSON.parse(localListJson);
                if (Array.isArray(ids) && ids.includes(parseInt(movieId, 10))) {
                    inWatchlist = true;
                    updateWatchlistBtn();
                    return;
                }
            } catch (e) {}
        }

        // If user is logged in, check server MySQL database
        if (userToken) {
            try {
                const res = await fetch('/api/watchlist', {
                    headers: { 'Authorization': `Bearer ${userToken}` }
                });
                const data = await res.json();
                if (data.success && Array.isArray(data.data)) {
                    inWatchlist = data.data.some(m => String(m.movie_id) === String(movieId));
                    updateWatchlistBtn();
                }
            } catch (e) {}
        }
    }

    function updateWatchlistBtn() {
        if (!watchlistToggleBtn) return;
        if (inWatchlist) {
            watchlistToggleBtn.innerHTML = '<span>❤️ In Watchlist</span>';
            watchlistToggleBtn.classList.remove('btn-secondary');
            watchlistToggleBtn.classList.add('btn-primary');
        } else {
            watchlistToggleBtn.innerHTML = '<span>+ Add to Watchlist</span>';
            watchlistToggleBtn.classList.remove('btn-primary');
            watchlistToggleBtn.classList.add('btn-secondary');
        }
    }

    if (watchlistToggleBtn) {
        watchlistToggleBtn.addEventListener('click', async () => {
            const mId = parseInt(movieId, 10);

            try {
                if (inWatchlist) {
                    // Remove from server if token present
                    if (userToken) {
                        await fetch(`/api/watchlist/${movieId}`, {
                            method: 'DELETE',
                            headers: { 'Authorization': `Bearer ${userToken}` }
                        });
                    }
                    // Remove from local storage
                    const localListJson = localStorage.getItem('cinepass_watchlist');
                    if (localListJson) {
                        try {
                            let ids = JSON.parse(localListJson);
                            ids = ids.filter(id => id !== mId);
                            localStorage.setItem('cinepass_watchlist', JSON.stringify(ids));
                        } catch (e) {}
                    }
                    inWatchlist = false;
                } else {
                    // Add to server if token present
                    if (userToken) {
                        await fetch('/api/watchlist', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${userToken}`
                            },
                            body: JSON.stringify({ movie_id: mId })
                        });
                    }
                    // Add to local storage
                    let ids = [];
                    const localListJson = localStorage.getItem('cinepass_watchlist');
                    if (localListJson) {
                        try { ids = JSON.parse(localListJson); } catch (e) {}
                    }
                    if (!ids.includes(mId)) ids.push(mId);
                    localStorage.setItem('cinepass_watchlist', JSON.stringify(ids));

                    inWatchlist = true;
                }
                updateWatchlistBtn();
            } catch (e) {
                console.error('Watchlist toggle error:', e);
            }
        });
    }

    // ==========================================================================
    // Customer Reviews & Ratings Logic
    // ==========================================================================
    async function fetchReviews() {
        if (!reviewsList) return;
        try {
            const res = await fetch(`/api/reviews/movie/${movieId}`);
            const data = await res.json();
            if (data.success && Array.isArray(data.data)) {
                renderReviews(data.data);
            }
        } catch (e) {
            console.error('Error fetching reviews:', e);
        }
    }

    function renderReviews(reviews) {
        reviewsList.innerHTML = '';
        if (reviews.length === 0) {
            reviewsList.innerHTML = `<p style="color: var(--text-muted); font-size: 0.9rem;">No reviews submitted yet. Be the first to share your thoughts!</p>`;
            return;
        }

        reviews.forEach(r => {
            const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
            const item = document.createElement('div');
            item.className = 'booking-item-card';
            item.style.padding = '18px';
            item.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <strong style="color: #fff; font-size: 0.95rem;">👤 ${escapeHtml(r.user_name)}</strong>
                    <span style="color: #f5a623; font-weight: 700; font-size: 1rem;">${stars}</span>
                </div>
                <p style="font-size: 0.9rem; color: #ccc; line-height: 1.5;">${escapeHtml(r.review_text)}</p>
                <span style="font-size: 0.75rem; color: var(--text-muted); display: block; margin-top: 8px;">
                    Reviewed on ${new Date(r.created_at).toLocaleDateString()}
                </span>
            `;
            reviewsList.appendChild(item);
        });
    }

    if (addReviewForm) {
        addReviewForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!userToken) {
                alert('Please sign in to post a verified movie review.');
                return;
            }

            const rating = document.getElementById('reviewRatingSelect').value;
            const review_text = document.getElementById('reviewTextInput').value.trim();

            try {
                const res = await fetch('/api/reviews', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${userToken}`
                    },
                    body: JSON.stringify({ movie_id: movieId, rating, review_text })
                });

                const data = await res.json();
                if (!res.ok || !data.success) {
                    throw new Error(data.message || 'Error submitting review');
                }

                alert('Review submitted successfully!');
                document.getElementById('reviewTextInput').value = '';
                fetchReviews();
            } catch (err) {
                alert(err.message);
            }
        });
    }

    function showLoading(show) {
        if (loadingEl) loadingEl.style.display = show ? 'flex' : 'none';
    }

    function showError(msg) {
        if (errorEl) {
            errorEl.querySelector('span').textContent = msg;
            errorEl.classList.remove('hidden');
        }
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
