// ========== GLOBAL STATE ==========
let currentUser = null;
let allRestaurants = [];
let allReviews = [];
let currentFilter = 'all';
let currentCityFilter = 'all';
let searchQuery = '';
let selectedRating = 0;
let uploadedImages = [];
let selectedRestaurantId = null;

// ========== FIREBASE REFERENCES ==========
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();

// ========== SAMPLE PAKISTAN RESTAURANTS ==========
const sampleRestaurants = [
    {
        name: "Monal Restaurant",
        city: "Islamabad",
        cuisine: "Desi",
        priceRange: "₨₨₨",
        image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800",
        location: "Pir Sohawa Road"
    },
    {
        name: "Street 1 Cafe",
        city: "Islamabad",
        cuisine: "Cafe",
        priceRange: "₨₨",
        image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800",
        location: "F-7 Markaz"
    },
    {
        name: "Butt Karahi",
        city: "Lahore",
        cuisine: "BBQ",
        priceRange: "₨₨",
        image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=800",
        location: "Lakshmi Chowk"
    },
    {
        name: "Cafe Aylanto",
        city: "Lahore",
        cuisine: "Italian",
        priceRange: "₨₨₨",
        image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800",
        location: "MM Alam Road"
    },
    {
        name: "Kolachi Restaurant",
        city: "Karachi",
        cuisine: "Desi",
        priceRange: "₨₨",
        image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800",
        location: "Do Darya"
    },
    {
        name: "BBQ Tonight",
        city: "Karachi",
        cuisine: "BBQ",
        priceRange: "₨₨",
        image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800",
        location: "Multiple Locations"
    },
    {
        name: "Savour Foods",
        city: "Islamabad",
        cuisine: "Fast Food",
        priceRange: "₨",
        image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800",
        location: "Multiple Locations"
    },
    {
        name: "Khiva Restaurant",
        city: "Islamabad",
        cuisine: "Desi",
        priceRange: "₨₨",
        image: "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800",
        location: "F-10 Markaz"
    },
    {
        name: "Andaaz Restaurant",
        city: "Lahore",
        cuisine: "Desi",
        priceRange: "₨₨₨",
        image: "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800",
        location: "Pearl Continental Hotel"
    },
    {
        name: "Attock Food Street",
        city: "Attock",
        cuisine: "Street Food",
        priceRange: "₨",
        image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800",
        location: "City Center"
    },
    {
        name: "Port Grand",
        city: "Karachi",
        cuisine: "Desi",
        priceRange: "₨₨",
        image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800",
        location: "Native Jetty Bridge"
    },
    {
        name: "Salt'n Pepper",
        city: "Lahore",
        cuisine: "Fast Food",
        priceRange: "₨₨",
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800",
        location: "Multiple Locations"
    }
];

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('FoodSpot Pakistan initialized');
    
    // Check auth state
    auth.onAuthStateChanged(user => {
        if (user) {
            loadUserData(user);
        } else {
            showAuthScreen();
        }
    });
    
    // Initialize sample data if needed
    initializeSampleData();
});

// ========== AUTH FUNCTIONS ==========
let isSignUp = false;

function toggleAuth() {
    isSignUp = !isSignUp;
    document.getElementById('signupFields').classList.toggle('hidden', !isSignUp);
    document.getElementById('authBtnText').textContent = isSignUp ? 'Sign Up' : 'Sign In';
    document.querySelector('.subtitle').textContent = isSignUp 
        ? 'Join Pakistan\'s Foodie Community' 
        : 'Discover Authentic Restaurant Reviews';
    document.getElementById('authToggleText').textContent = isSignUp 
        ? 'Already have an account? ' 
        : "Don't have an account? ";
    document.getElementById('authToggleLink').textContent = isSignUp ? 'Sign In' : 'Sign Up';
}

async function handleAuth() {
    const email = document.getElementById('emailInput').value.trim();
    const password = document.getElementById('passwordInput').value.trim();
    const name = document.getElementById('nameInput').value.trim();
    const city = document.getElementById('cityInput').value;

    if (!email || !password) {
        showToast('Please fill in all fields', 'error');
        return;
    }

    if (isSignUp && (!name || !city)) {
        showToast('Please enter your name and city', 'error');
        return;
    }

    const authBtn = document.getElementById('authBtn');
    authBtn.disabled = true;
    authBtn.innerHTML = '<span>Please wait...</span>';

    try {
        if (isSignUp) {
            // Sign up
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Save user profile to Firestore
            await db.collection('users').doc(user.uid).set({
                name: name,
                email: email,
                city: city,
                trustScore: 0,
                reviewsCount: 0,
                verificationsGiven: 0,
                badges: [],
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            showToast('Welcome to FoodSpot Pakistan! 🎉', 'success');
        } else {
            // Sign in
            await auth.signInWithEmailAndPassword(email, password);
            showToast('Welcome back! 🍽️', 'success');
        }
    } catch (error) {
        console.error('Auth error:', error);
        showToast(error.message, 'error');
        authBtn.disabled = false;
        authBtn.innerHTML = '<span id="authBtnText">' + (isSignUp ? 'Sign Up' : 'Sign In') + '</span>';
    }
}

async function loadUserData(user) {
    try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (userDoc.exists) {
            currentUser = {
                uid: user.uid,
                email: user.email,
                ...userDoc.data()
            };
            
            showApp();
            await loadRestaurants();
            await loadReviews();
        } else {
            // User document doesn't exist, sign out
            await auth.signOut();
            showToast('User data not found. Please sign up again.', 'error');
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        showToast('Error loading user data', 'error');
    }
}

function logout() {
    if (confirm('Are you sure you want to sign out?')) {
        auth.signOut().then(() => {
            currentUser = null;
            allRestaurants = [];
            allReviews = [];
            showAuthScreen();
            showToast('Signed out successfully', 'success');
        });
    }
}

function showAuthScreen() {
    document.getElementById('authScreen').classList.remove('hidden');
    document.getElementById('appScreen').classList.add('hidden');
}

function showApp() {
    document.getElementById('authScreen').classList.add('hidden');
    document.getElementById('appScreen').classList.remove('hidden');
    
    // Set user info
    document.getElementById('userName').textContent = currentUser.name;
    document.getElementById('userAvatar').textContent = currentUser.name.charAt(0).toUpperCase();
}

// ========== USER MENU ==========
function toggleUserMenu() {
    const menu = document.getElementById('userMenu');
    menu.classList.toggle('hidden');
}

// Close menu when clicking outside
document.addEventListener('click', function(e) {
    const menu = document.getElementById('userMenu');
    const avatar = document.getElementById('userAvatar');
    if (!menu.contains(e.target) && !avatar.contains(e.target)) {
        menu.classList.add('hidden');
    }
});

function showMyProfile() {
    document.getElementById('userMenu').classList.add('hidden');
    document.getElementById('homeView').classList.add('hidden');
    document.getElementById('detailView').classList.add('hidden');
    
    const profileView = document.getElementById('profileView');
    profileView.classList.remove('hidden');
    
    const userReviews = allReviews.filter(r => r.userId === currentUser.uid);
    
    profileView.innerHTML = `
        <div class="detail-view">
            <div class="detail-info">
                <div style="text-align: center; margin-bottom: 32px;">
                    <div class="reviewer-avatar" style="width: 100px; height: 100px; font-size: 3rem; margin: 0 auto 16px;">
                        ${currentUser.name.charAt(0).toUpperCase()}
                    </div>
                    <h2 class="detail-title">${currentUser.name}</h2>
                    <p style="color: #888;">${currentUser.email}</p>
                    <p style="color: var(--gold); margin-top: 8px;">📍 ${currentUser.city}</p>
                </div>
                
                <div class="detail-stats">
                    <div class="stat-item">
                        <div class="stat-value">${currentUser.reviewsCount || 0}</div>
                        <div class="stat-label">Reviews</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${currentUser.trustScore || 0}</div>
                        <div class="stat-label">Trust Score</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${currentUser.verificationsGiven || 0}</div>
                        <div class="stat-label">Verifications</div>
                    </div>
                </div>
                
                <button class="btn btn-secondary" onclick="backToHome()" style="margin-top: 24px;">
                    ← Back to Home
                </button>
            </div>
        </div>
        
        <div class="reviews-section">
            <h2 class="section-title">My Reviews (${userReviews.length})</h2>
            <div class="review-list">
                ${userReviews.length > 0 ? userReviews.map(review => {
                    const restaurant = allRestaurants.find(r => r.id === review.restaurantId);
                    return renderReviewCard(review, restaurant);
                }).join('') : `
                    <div class="empty-state">
                        <div class="emoji">📝</div>
                        <h3>No reviews yet</h3>
                        <p>Start reviewing restaurants to build your foodie profile!</p>
                    </div>
                `}
            </div>
        </div>
    `;
}

function showMyReviews() {
    showMyProfile();
}

function backToHome() {
    document.getElementById('profileView').classList.add('hidden');
    document.getElementById('detailView').classList.add('hidden');
    document.getElementById('homeView').classList.remove('hidden');
}

// ========== DATA INITIALIZATION ==========
async function initializeSampleData() {
    try {
        const restaurantsSnapshot = await db.collection('restaurants').limit(1).get();
        
        if (restaurantsSnapshot.empty) {
            console.log('Initializing sample restaurants...');
            
            for (const restaurant of sampleRestaurants) {
                await db.collection('restaurants').add({
                    ...restaurant,
                    avgRating: 0,
                    reviewsCount: 0,
                    verificationBreakdown: { fresh: 0, verified: 0, trusted: 0 },
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
            
            console.log('Sample restaurants added!');
        }
    } catch (error) {
        console.error('Error initializing data:', error);
    }
}

async function loadRestaurants() {
    try {
        const snapshot = await db.collection('restaurants').get();
        allRestaurants = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        renderRestaurants();
    } catch (error) {
        console.error('Error loading restaurants:', error);
        showToast('Error loading restaurants', 'error');
    }
}

async function loadReviews() {
    try {
        const snapshot = await db.collection('reviews').get();
        allReviews = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error loading reviews:', error);
    }
}

// ========== RESTAURANT RENDERING ==========
function renderRestaurants() {
    const grid = document.getElementById('restaurantGrid');
    const filtered = getFilteredRestaurants();

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <div class="emoji">🔍</div>
                <h3>No restaurants found</h3>
                <p>Try adjusting your filters or search</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = filtered.map(restaurant => {
        const reviews = allReviews.filter(r => r.restaurantId === restaurant.id);
        const trustedCount = reviews.filter(r => r.verificationLevel === 2).length;
        
        return `
            <div class="restaurant-card" onclick="showRestaurantDetail('${restaurant.id}')">
                <img src="${restaurant.image}" alt="${restaurant.name}" class="restaurant-image" 
                     onerror="this.src='https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800'">
                <div class="restaurant-content">
                    <div class="restaurant-header">
                        <div>
                            <div class="restaurant-name">${restaurant.name}</div>
                            <div class="restaurant-meta">
                                <div class="meta-item">${getCuisineEmoji(restaurant.cuisine)} ${restaurant.cuisine}</div>
                                <div class="meta-item">${restaurant.priceRange}</div>
                                <div class="meta-item">📍 ${restaurant.city}</div>
                            </div>
                        </div>
                    </div>
                    <div style="margin-top: 12px; display: flex; align-items: center; gap: 12px;">
                        ${restaurant.avgRating > 0 ? `
                            <span class="rating-badge">⭐ ${restaurant.avgRating.toFixed(1)}</span>
                        ` : '<span style="color: #888; font-size: 0.9rem;">No ratings yet</span>'}
                        ${trustedCount > 0 ? `
                            <span class="verification-badge badge-trusted">
                                🏆 ${trustedCount} Trusted
                            </span>
                        ` : ''}
                    </div>
                    <div class="restaurant-meta" style="margin-top: 12px;">
                        <div class="meta-item">💬 ${restaurant.reviewsCount || 0} reviews</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function getFilteredRestaurants() {
    let filtered = allRestaurants;

    if (currentFilter !== 'all') {
        filtered = filtered.filter(r => r.cuisine === currentFilter);
    }

    if (currentCityFilter !== 'all') {
        filtered = filtered.filter(r => r.city === currentCityFilter);
    }

    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(r => 
            r.name.toLowerCase().includes(query) ||
            r.cuisine.toLowerCase().includes(query) ||
            r.city.toLowerCase().includes(query)
        );
    }

    return filtered;
}

function setFilter(filter, el) {
    currentFilter = filter;
    document.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    renderRestaurants();
}

function filterRestaurants() {
    searchQuery = document.getElementById('searchInput').value;
    currentCityFilter = document.getElementById('cityFilter').value;
    renderRestaurants();
}

function getCuisineEmoji(cuisine) {
    const emojis = {
        'Desi': '🍛',
        'BBQ': '🍖',
        'Fast Food': '🍔',
        'Chinese': '🥡',
        'Italian': '🍝',
        'Turkish': '🥙',
        'Arabic': '🍢',
        'Cafe': '☕',
        'Street Food': '🌮'
    };
    return emojis[cuisine] || '🍴';
}

// ========== RESTAURANT DETAIL ==========
async function showRestaurantDetail(restaurantId) {
    selectedRestaurantId = restaurantId;
    const restaurant = allRestaurants.find(r => r.id === restaurantId);
    if (!restaurant) return;

    document.getElementById('homeView').classList.add('hidden');
    document.getElementById('profileView').classList.add('hidden');
    
    const detailView = document.getElementById('detailView');
    detailView.classList.remove('hidden');

    const reviews = allReviews.filter(r => r.restaurantId === restaurantId);
    const freshReviews = reviews.filter(r => r.verificationLevel === 0);
    const verifiedReviews = reviews.filter(r => r.verificationLevel === 1);
    const trustedReviews = reviews.filter(r => r.verificationLevel === 2);

    detailView.innerHTML = `
        <div class="detail-view">
            <div class="detail-header">
                <img src="${restaurant.image}" alt="${restaurant.name}" class="detail-image"
                     onerror="this.src='https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800'">
                <button class="back-btn" onclick="closeRestaurantDetail()">← Back</button>
            </div>
            <div class="detail-info">
                <div class="detail-title">${restaurant.name}</div>
                <div class="restaurant-meta" style="margin-bottom: 8px;">
                    <div class="meta-item">${getCuisineEmoji(restaurant.cuisine)} ${restaurant.cuisine}</div>
                    <div class="meta-item">${restaurant.priceRange}</div>
                    <div class="meta-item">📍 ${restaurant.city}</div>
                </div>
                <p style="color: #888;">${restaurant.location || ''}</p>
                
                <div class="detail-stats">
                    <div class="stat-item">
                        <div class="stat-value">${restaurant.avgRating > 0 ? restaurant.avgRating.toFixed(1) : 'N/A'}</div>
                        <div class="stat-label">Rating</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${restaurant.reviewsCount || 0}</div>
                        <div class="stat-label">Reviews</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${trustedReviews.length}</div>
                        <div class="stat-label">Trusted</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${verifiedReviews.length}</div>
                        <div class="stat-label">Verified</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="reviews-section">
            <div class="section-header">
                <h2 class="section-title">Reviews (${reviews.length})</h2>
                <button class="btn btn-primary" onclick="openAddReviewModal('${restaurantId}')" 
                        style="width: auto; padding: 10px 20px;">
                    + Write Review
                </button>
            </div>
            
            <div class="review-tabs">
                <button class="review-tab active" onclick="showReviewTab('all', this, '${restaurantId}')">
                    All (${reviews.length})
                </button>
                <button class="review-tab" onclick="showReviewTab('trusted', this, '${restaurantId}')">
                    🏆 Highly Trusted (${trustedReviews.length})
                </button>
                <button class="review-tab" onclick="showReviewTab('verified', this, '${restaurantId}')">
                    ✅ Verified (${verifiedReviews.length})
                </button>
                <button class="review-tab" onclick="showReviewTab('fresh', this, '${restaurantId}')">
                    🆕 Fresh (${freshReviews.length})
                </button>
            </div>
            
            <div class="review-list" id="reviewList">
                ${renderReviewsList(reviews, 'all')}
            </div>
        </div>
    `;
}

function showReviewTab(tab, el, restaurantId) {
    document.querySelectorAll('.review-tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    
    const reviews = allReviews.filter(r => r.restaurantId === restaurantId);
    document.getElementById('reviewList').innerHTML = renderReviewsList(reviews, tab);
}

function renderReviewsList(reviews, filter) {
    let filteredReviews = reviews;
    
    if (filter === 'fresh') filteredReviews = reviews.filter(r => r.verificationLevel === 0);
    if (filter === 'verified') filteredReviews = reviews.filter(r => r.verificationLevel === 1);
    if (filter === 'trusted') filteredReviews = reviews.filter(r => r.verificationLevel === 2);
    
    if (filteredReviews.length === 0) {
        return `
            <div class="empty-state">
                <div class="emoji">📝</div>
                <h3>No reviews in this category yet</h3>
                <p>Be the first to review!</p>
            </div>
        `;
    }
    
    return filteredReviews.map(review => renderReviewCard(review)).join('');
}

function renderReviewCard(review, restaurantOverride = null) {
    const restaurant = restaurantOverride || allRestaurants.find(r => r.id === review.restaurantId);
    const verificationBadge = getVerificationBadge(review.verificationLevel, review.verificationCount || 0);
    const isMyReview = review.userId === currentUser.uid;
    const hasVerified = review.verifiedBy && review.verifiedBy.includes(currentUser.uid);
    
    return `
        <div class="review-card">
            <div class="review-header">
                <div class="reviewer-info">
                    <div class="reviewer-avatar">${review.userName ? review.userName.charAt(0).toUpperCase() : 'U'}</div>
                    <div>
                        <div class="reviewer-name">${review.userName || 'Anonymous'}</div>
                        <div class="review-date">${formatDate(review.createdAt)}</div>
                    </div>
                </div>
                ${verificationBadge}
            </div>
            ${restaurantOverride ? `
                <div style="margin-bottom: 12px;">
                    <strong style="color: var(--gold);">${restaurant.name}</strong>
                    <span style="color: #888; margin-left: 8px;">${restaurant.city}</span>
                </div>
            ` : ''}
            <div class="review-rating">
                ${renderStars(review.rating)}
            </div>
            <div class="review-text">${review.text}</div>
            ${review.images && review.images.length > 0 ? `
                <div class="review-images">
                    ${review.images.map(img => `
                        <img src="${img}" class="review-image" onclick="showLightbox('${img}')" 
                             alt="Review photo" onerror="this.style.display='none'">
                    `).join('')}
                </div>
            ` : ''}
            ${!isMyReview ? `
                <div class="review-actions">
                    <button class="verify-btn ${hasVerified ? 'verified' : ''}" 
                            onclick="verifyReview('${review.id}')" 
                            ${hasVerified ? 'disabled' : ''}>
                        ${hasVerified ? '✓ You Verified' : '✓ Verify This Review'}
                    </button>
                    <span class="verify-count">
                        ${review.verificationCount || 0} ${(review.verificationCount || 0) === 1 ? 'verification' : 'verifications'}
                    </span>
                </div>
            ` : ''}
        </div>
    `;
}

function getVerificationBadge(level, count) {
    if (level === 2) {
        return `<span class="verification-badge badge-trusted">🏆 Highly Trusted (${count})</span>`;
    } else if (level === 1) {
        return `<span class="verification-badge badge-verified">✅ Verified (${count})</span>`;
    } else {
        return `<span class="verification-badge badge-fresh">🆕 Fresh</span>`;
    }
}

function renderStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        stars += `<span class="star ${i <= rating ? '' : 'empty'}">★</span>`;
    }
    return stars;
}

function formatDate(timestamp) {
    if (!timestamp) return 'Recently';
    
    let date;
    if (timestamp.toDate) {
        date = timestamp.toDate();
    } else if (timestamp.seconds) {
        date = new Date(timestamp.seconds * 1000);
    } else {
        date = new Date(timestamp);
    }
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function closeRestaurantDetail() {
    document.getElementById('detailView').classList.add('hidden');
    document.getElementById('homeView').classList.remove('hidden');
    selectedRestaurantId = null;
}

// ========== VERIFY REVIEW ==========
async function verifyReview(reviewId) {
    try {
        const review = allReviews.find(r => r.id === reviewId);
        if (!review) return;
        
        // Check if user already verified
        if (review.verifiedBy && review.verifiedBy.includes(currentUser.uid)) {
            showToast('You already verified this review', 'error');
            return;
        }
        
        // Update review
        const verifiedBy = review.verifiedBy || [];
        verifiedBy.push(currentUser.uid);
        const verificationCount = verifiedBy.length;
        
        let verificationLevel = 0;
        if (verificationCount >= 3) verificationLevel = 2; // Highly Trusted
        else if (verificationCount >= 1) verificationLevel = 1; // Verified
        
        await db.collection('reviews').doc(reviewId).update({
            verifiedBy: verifiedBy,
            verificationCount: verificationCount,
            verificationLevel: verificationLevel
        });
        
        // Update user's verification count
        await db.collection('users').doc(currentUser.uid).update({
            verificationsGiven: firebase.firestore.FieldValue.increment(1),
            trustScore: firebase.firestore.FieldValue.increment(5)
        });
        
        currentUser.verificationsGiven = (currentUser.verificationsGiven || 0) + 1;
        currentUser.trustScore = (currentUser.trustScore || 0) + 5;
        
        // Reload data
        await loadReviews();
        
        showToast('Review verified! +5 trust score', 'success');
        
        // Refresh detail view
        if (selectedRestaurantId) {
            showRestaurantDetail(selectedRestaurantId);
        }
    } catch (error) {
        console.error('Error verifying review:', error);
        showToast('Error verifying review', 'error');
    }
}

// ========== ADD REVIEW MODAL ==========
function openAddReviewModal(restaurantId = null) {
    selectedRating = 0;
    uploadedImages = [];
    
    document.getElementById('addReviewModal').classList.remove('hidden');
    
    // Reset form
    document.getElementById('reviewText').value = '';
    document.getElementById('imagePreviewGrid').innerHTML = '';
    document.getElementById('imagePreviewGrid').classList.add('hidden');
    document.getElementById('uploadPrompt').classList.remove('hidden');
    renderRatingInput();
    
    if (restaurantId) {
        const restaurant = allRestaurants.find(r => r.id === restaurantId);
        if (restaurant) {
            document.getElementById('restaurantName').value = restaurant.name;
            document.getElementById('restaurantCity').value = restaurant.city;
            document.getElementById('cuisineType').value = restaurant.cuisine;
            document.getElementById('priceRange').value = restaurant.priceRange;
            
            // Disable fields
            document.getElementById('restaurantName').disabled = true;
            document.getElementById('restaurantCity').disabled = true;
            document.getElementById('cuisineType').disabled = true;
            document.getElementById('priceRange').disabled = true;
        }
    } else {
        // Enable all fields for new restaurant
        document.getElementById('restaurantName').value = '';
        document.getElementById('restaurantCity').value = '';
        document.getElementById('cuisineType').value = 'Desi';
        document.getElementById('priceRange').value = '₨₨';
        
        document.getElementById('restaurantName').disabled = false;
        document.getElementById('restaurantCity').disabled = false;
        document.getElementById('cuisineType').disabled = false;
        document.getElementById('priceRange').disabled = false;
    }
}

function closeAddReviewModal() {
    document.getElementById('addReviewModal').classList.add('hidden');
    selectedRating = 0;
    uploadedImages = [];
}

function closeModalOnOverlay(event) {
    if (event.target.id === 'addReviewModal') {
        closeAddReviewModal();
    }
}

function renderRatingInput() {
    const container = document.getElementById('ratingInput');
    container.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('span');
        star.className = `rating-star ${i <= selectedRating ? 'active' : ''}`;
        star.textContent = '★';
        star.onclick = () => selectRating(i);
        container.appendChild(star);
    }
}

function selectRating(rating) {
    selectedRating = rating;
    renderRatingInput();
}

// ========== IMAGE UPLOAD ==========
function handleFileSelect(event) {
    const files = Array.from(event.target.files);
    
    if (uploadedImages.length + files.length > 5) {
        showToast('Maximum 5 photos allowed', 'error');
        return;
    }
    
    files.forEach(file => {
        if (file.size > 5 * 1024 * 1024) {
            showToast('File too large. Max 5MB per photo', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            uploadedImages.push({
                file: file,
                dataUrl: e.target.result
            });
            renderImagePreviews();
        };
        reader.readAsDataURL(file);
    });
}

function renderImagePreviews() {
    const grid = document.getElementById('imagePreviewGrid');
    const uploadArea = document.getElementById('uploadArea');
    
    if (uploadedImages.length > 0) {
        uploadArea.classList.add('has-images');
        document.getElementById('uploadPrompt').classList.add('hidden');
        grid.classList.remove('hidden');
        
        grid.innerHTML = uploadedImages.map((img, index) => `
            <div class="image-preview">
                <img src="${img.dataUrl}" alt="Preview">
                <button class="remove-btn" onclick="removeImage(${index})">×</button>
            </div>
        `).join('');
    } else {
        uploadArea.classList.remove('has-images');
        document.getElementById('uploadPrompt').classList.remove('hidden');
        grid.classList.add('hidden');
    }
}

function removeImage(index) {
    uploadedImages.splice(index, 1);
    renderImagePreviews();
}

// ========== SUBMIT REVIEW ==========
async function submitReview() {
    const restaurantName = document.getElementById('restaurantName').value.trim();
    const restaurantCity = document.getElementById('restaurantCity').value;
    const cuisine = document.getElementById('cuisineType').value;
    const priceRange = document.getElementById('priceRange').value;
    const reviewText = document.getElementById('reviewText').value.trim();

    if (!restaurantName || !restaurantCity || !reviewText) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    if (selectedRating === 0) {
        showToast('Please select a rating', 'error');
        return;
    }

    const submitBtn = event.target;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
        // Find or create restaurant
        let restaurant = allRestaurants.find(r => 
            r.name.toLowerCase() === restaurantName.toLowerCase() && 
            r.city === restaurantCity
        );

        if (!restaurant) {
            // Create new restaurant
            const restaurantRef = await db.collection('restaurants').add({
                name: restaurantName,
                city: restaurantCity,
                cuisine: cuisine,
                priceRange: priceRange,
                image: getDefaultImage(cuisine),
                avgRating: selectedRating,
                reviewsCount: 1,
                verificationBreakdown: { fresh: 1, verified: 0, trusted: 0 },
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            restaurant = {
                id: restaurantRef.id,
                name: restaurantName,
                city: restaurantCity,
                cuisine: cuisine,
                priceRange: priceRange,
                avgRating: selectedRating,
                reviewsCount: 1
            };
            
            allRestaurants.push(restaurant);
        } else {
            // Update existing restaurant stats
            const reviews = allReviews.filter(r => r.restaurantId === restaurant.id);
            const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0) + selectedRating;
            const newAvgRating = totalRating / (reviews.length + 1);
            
            await db.collection('restaurants').doc(restaurant.id).update({
                avgRating: newAvgRating,
                reviewsCount: firebase.firestore.FieldValue.increment(1),
                'verificationBreakdown.fresh': firebase.firestore.FieldValue.increment(1)
            });
            
            restaurant.avgRating = newAvgRating;
            restaurant.reviewsCount = (restaurant.reviewsCount || 0) + 1;
        }

        // Upload images
        const imageUrls = [];
        for (const img of uploadedImages) {
            try {
                const imageRef = storage.ref().child(`reviews/${currentUser.uid}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`);
                await imageRef.putString(img.dataUrl, 'data_url');
                const url = await imageRef.getDownloadURL();
                imageUrls.push(url);
            } catch (imgError) {
                console.error('Error uploading image:', imgError);
            }
        }

        // Create review
        const reviewData = {
            restaurantId: restaurant.id,
            restaurantName: restaurant.name,
            userId: currentUser.uid,
            userName: currentUser.name,
            rating: selectedRating,
            text: reviewText,
            images: imageUrls,
            verificationLevel: 0, // Fresh
            verifiedBy: [],
            verificationCount: 0,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        const reviewRef = await db.collection('reviews').add(reviewData);
        
        allReviews.unshift({
            id: reviewRef.id,
            ...reviewData,
            createdAt: new Date()
        });

        // Update user stats
        await db.collection('users').doc(currentUser.uid).update({
            reviewsCount: firebase.firestore.FieldValue.increment(1),
            trustScore: firebase.firestore.FieldValue.increment(10)
        });
        
        currentUser.reviewsCount = (currentUser.reviewsCount || 0) + 1;
        currentUser.trustScore = (currentUser.trustScore || 0) + 10;

        closeAddReviewModal();
        showToast('Review posted successfully! 🎉', 'success');
        
        // Refresh view
        if (selectedRestaurantId) {
            await loadRestaurants();
            showRestaurantDetail(selectedRestaurantId);
        } else {
            await loadRestaurants();
            renderRestaurants();
        }
        
    } catch (error) {
        console.error('Error submitting review:', error);
        showToast('Error submitting review: ' + error.message, 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Review';
    }
}

function getDefaultImage(cuisine) {
    const images = {
        'Desi': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
        'BBQ': 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800',
        'Fast Food': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
        'Chinese': 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=800',
        'Italian': 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
        'Cafe': 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800'
    };
    return images[cuisine] || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800';
}

// ========== IMAGE LIGHTBOX ==========
function showLightbox(imageSrc) {
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.innerHTML = `<img src="${imageSrc}" alt="Full size image">`;
    lightbox.onclick = () => lightbox.remove();
    document.body.appendChild(lightbox);
}

// ========== TOAST NOTIFICATIONS ==========
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}