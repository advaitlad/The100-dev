// Initialize Firebase
class FirebaseUserManager {
    constructor() {
        this.auth = firebase.auth();
        this.db = firebase.firestore();
        this.currentUser = null;
        this.isGuest = false;
        this.userData = null;
        this.currentStreak = 0;
        this.bestStreak = 0;

        // Add loading state to profile toggle button
        const profileToggle = document.querySelector('.profile-toggle');
        if (profileToggle) {
            profileToggle.classList.add('loading');
            profileToggle.textContent = '';
        }

        this.setupAuthListeners();
    }

    setupAuthListeners() {
        // Use window.auth to ensure we're using the globally initialized Firebase auth
        this.auth.onAuthStateChanged(async (user) => {
            this.currentUser = user;
            
            if (user) {
                console.log('User logged in:', user.uid);
                try {
                    // Get user data from Firestore
                    const doc = await this.db.collection('users').doc(user.uid).get();
                    if (doc.exists) {
                        this.userData = doc.data();
                    } else {
                        // Create new user document if it doesn't exist
                        await this.createNewUser();
                    }
                    this.currentStreak = this.userData.currentStreak || 0;
                    this.bestStreak = this.userData.bestStreak || 0;
                    this.updateUI();
                } catch (error) {
                    console.error('Error loading user data:', error);
                }
            } else {
                console.log('User logged out');
                this.currentUser = null;
                this.userData = null;
                this.currentStreak = 0;
                this.bestStreak = 0;
                this.updateUI();
                
                // Dispatch resetGame event with preserveTiles flag
                const resetEvent = new CustomEvent('resetGame', { 
                    detail: { 
                        preserveTiles: true 
                    } 
                });
                document.dispatchEvent(resetEvent);
            }
            
            // Update UI after auth state change
            this.updateUI();
            
            // Initialize game elements if needed
            if (typeof initializeTiles === 'function') {
                initializeTiles();
            }
            
            // Remove loading state from profile toggle
            const profileToggle = document.querySelector('.profile-toggle');
            if (profileToggle) {
                profileToggle.classList.remove('loading');
            }
        });
    }

    async loadUserData() {
        if (!this.currentUser) {
            this.userData = null;
            this.updateUI();
            return;
        }

        try {
            const userDoc = await this.db.collection('users').doc(this.currentUser.uid).get();
        if (userDoc.exists) {
            this.userData = userDoc.data();
            this.updateUI();
        } else {
                // Create new user document if it doesn't exist
            await this.createNewUser();
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            // Still update UI even if there's an error
            this.updateUI();
        }
    }

    async createNewUser() {
        const userData = {
            username: this.currentUser.email.split('@')[0],
            email: this.currentUser.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
            stats: {
                gamesPlayed: 0,
                highScore: 0,
                currentStreak: 0,  // Initialize at 0
                bestStreak: 0,     // Initialize at 0
                categoryStats: {}
            },
            gameHistory: []
        };

        await this.db.collection('users').doc(this.currentUser.uid).set(userData);
        this.userData = userData;
        this.updateUI();
    }

    async signup(email, password, username) {
        try {
            console.log('Starting signup process...', { email, username });
            
            // Check if Firebase is properly initialized
            if (!this.auth || !this.db) {
                console.error('Firebase not properly initialized:', { 
                    auth: !!this.auth, 
                    db: !!this.db 
                });
                throw new Error('Firebase initialization error');
            }

            // Create auth user first
            console.log('Creating auth user...');
            let userCredential;
            try {
                userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
                console.log('User credential created:', userCredential);
            } catch (authError) {
                console.error('Auth creation error:', {
                    code: authError.code,
                    message: authError.message
                });
                throw authError;
            }

            if (!userCredential || !userCredential.user) {
                console.error('No user credential created');
                throw new Error('Failed to create user credential');
            }

            const user = userCredential.user;
            console.log('Auth user created:', user.uid);

            // Now check username uniqueness
            try {
                const usernameQuery = await this.db.collection('users')
                    .where('username', '==', username)
                    .get();
                
                if (!usernameQuery.empty) {
                    // Delete the auth user since username is taken
                    await user.delete();
                    throw { code: 'username-taken', message: 'This username is already taken' };
                }
            } catch (dbError) {
                if (dbError.code === 'username-taken') {
                    throw dbError;
                }
                console.error('Error during username check:', dbError);
                // Delete the auth user if username check fails
                await user.delete();
                throw dbError;
            }

            // Create user document in Firestore
            const userData = {
                username: username,
                email: email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                stats: {
                    gamesPlayed: 0,
                    highScore: 0,
                    currentStreak: 0,
                    bestStreak: 0,
                    categoryStats: {}
                },
                gameHistory: []
            };

            try {
                await this.db.collection('users').doc(user.uid).set(userData);
                console.log('User document created successfully');
            } catch (firestoreError) {
                console.error('Firestore document creation error:', firestoreError);
                // If Firestore fails, delete the auth user
                await user.delete().catch(deleteError => {
                    console.error('Failed to delete auth user after Firestore error:', deleteError);
                });
                throw firestoreError;
            }

            this.currentUser = user;
            this.userData = userData;
            this.updateUI();
            return true;
        } catch (error) {
            console.error('Detailed signup error:', {
                code: error.code,
                message: error.message,
                fullError: error
            });
            throw error;
        }
    }

    async login(identifier, password) {
        try {
            console.log('Starting login process with identifier:', identifier);
            let email = identifier;
            
            // If identifier doesn't look like an email, treat it as a username
            if (!identifier.includes('@')) {
                console.log('Identifier appears to be a username, looking up email...');
                try {
                    // Query Firestore to get the email for this username
                    const usersRef = this.db.collection('users');
                    const querySnapshot = await usersRef
                        .where('username', '==', identifier.toLowerCase().trim())
                        .get();
                    
                    if (querySnapshot.empty) {
                        console.log('No user found with username:', identifier);
                        throw new Error('Invalid username or password.');
                    }
                    
                    email = querySnapshot.docs[0].data().email;
                    console.log('Found email for username:', email);
                } catch (error) {
                    console.error('Error during username lookup:', error);
                    throw new Error('Invalid username or password.');
                }
            }
            
            // Now login with email
            console.log('Attempting login with email:', email);
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            console.log('Login successful, user:', userCredential.user.uid);
            
            this.currentUser = userCredential.user;
            
            // Update last login time
            if (this.currentUser) {
                await this.db.collection('users').doc(this.currentUser.uid).update({
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                }).catch(error => {
                    console.warn('Failed to update last login time:', error);
                });
                
                // Load user data
            await this.loadUserData();
            }
            
            return true;
        } catch (error) {
            console.error('Login error:', error);
            
            // Handle specific error cases
            if (error.code === 'auth/wrong-password' || 
                error.code === 'auth/user-not-found' ||
                error.code === 'auth/invalid-login-credentials') {
                throw new Error('Invalid username/email or password.');
            } else if (error.code === 'auth/too-many-requests') {
                throw new Error('Too many failed attempts. Please try again later.');
            } else if (error.code === 'auth/invalid-email') {
                throw new Error('Invalid email format.');
            }
            
            // For any other errors
            throw new Error(error.message || 'Error during login. Please try again.');
        }
    }

    async logout() {
        try {
            // Handle logout
            await this.auth.signOut();
            this.currentUser = null;
            this.userData = null;
            
            // Reset UI elements
            const usernameDisplay = document.getElementById('username-display');
            if (usernameDisplay) {
                usernameDisplay.textContent = 'Guest';
            }

            // Dispatch resetGame event with forceReset flag
            const resetEvent = new CustomEvent('resetGame', { 
                detail: { 
                    forceReset: true,
                    reinitializeTiles: true  // Add flag to reinitialize tiles
                } 
            });
            document.dispatchEvent(resetEvent);
            
            return true;
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    }
    async saveGameResult(category, score, guesses) {
        if (!this.currentUser) {
            console.log('No user logged in, skipping game save');
            return;
        }

        try {
            // Get the current user document
            const userRef = this.db.collection('users').doc(this.currentUser.uid);
            const userDoc = await userRef.get();

            if (!userDoc.exists) {
                console.error('User document not found');
                return;
            }

            // Format the game result
        const gameResult = {
                category: category || 'unknown',
                score: parseInt(score) || 0,
                guesses: Array.isArray(guesses) ? guesses : [],
                date: new Date().toISOString()
            };

            // Get existing user data
            const userData = userDoc.data();

            // Ensure stats object exists
            const stats = userData.stats || {};
            const categoryStats = stats.categoryStats || {};
            const currentCategoryStats = categoryStats[category] || { highScore: 0, gamesPlayed: 0 };

            // Prepare the update object
            const updateData = {
                stats: {
                    ...stats,
                    gamesPlayed: (stats.gamesPlayed || 0) + 1,
                    highScore: Math.max(stats.highScore || 0, score),
                    categoryStats: {
                        ...categoryStats,
                        [category]: {
                            highScore: Math.max(currentCategoryStats.highScore || 0, score),
                            gamesPlayed: (currentCategoryStats.gamesPlayed || 0) + 1
                        }
                    }
                }
            };

            // Add game to history using arrayUnion
            await userRef.update({
                ...updateData,
                gameHistory: firebase.firestore.FieldValue.arrayUnion(gameResult)
            });

            console.log('Game result saved successfully');
            
            // Update local data
            this.userData = {
                ...userData,
                ...updateData,
                gameHistory: [...(userData.gameHistory || []), gameResult]
            };
        this.updateUI();

        } catch (error) {
            console.error('Error saving game result:', error);
            // Don't throw the error - we want to fail gracefully
        }
    }

    updateUI() {
        const profileToggle = document.getElementById('profile-toggle');
        const toggleHTML = this.currentUser ? 
            `<i class="fas fa-user"></i>
             <span>${this.userData?.username || this.currentUser.email}</span>` :
            `<i class="fas fa-user"></i>
             <span>Login</span>`;

        if (profileToggle) profileToggle.innerHTML = toggleHTML;

        // Enable the guess input and submit button
        const guessInput = document.getElementById('guess-input');
        const submitButton = document.getElementById('submit-guess');
        if (guessInput) {
            guessInput.disabled = false;
            guessInput.value = '';
        }
        if (submitButton) {
            submitButton.disabled = false;
        }

        // Update profile stats if user is logged in
        if (this.currentUser && this.userData) {
            this.updateProfileStats();
        }
    }

    updateProfileStats() {
        if (!this.userData || !this.userData.stats) return;

        const stats = this.userData.stats;
        
        // Update games played
        const gamesPlayedElement = document.getElementById('games-played');
        if (gamesPlayedElement) {
            gamesPlayedElement.textContent = stats.gamesPlayed || 0;
        }

        // Update high score and its category
        const highScoreElement = document.getElementById('high-score');
        const highScoreCategoryElement = document.getElementById('high-score-category');
        
        if (highScoreElement && stats.categoryStats) {
            let highestScoreCategory = '';
            let highestScore = 0;
            
            Object.entries(stats.categoryStats).forEach(([category, catStats]) => {
                if (catStats.highScore > highestScore) {
                    highestScore = catStats.highScore;
                    highestScoreCategory = category;
                }
            });

            // Update high score
            highScoreElement.textContent = highestScore;

            // Update category name
            if (highScoreCategoryElement) {
                if (highestScore > 0 && highestScoreCategory) {
                    // Get category data from window.gameData
                    const categoryData = window.gameData || {};
                    const categoryInfo = categoryData[highestScoreCategory];
                    
                    if (categoryInfo) {
                        highScoreCategoryElement.textContent = `in ${categoryInfo.title}`;
                    } else {
                        highScoreCategoryElement.textContent = `in ${highestScoreCategory}`;
                    }
                    highScoreCategoryElement.style.display = 'block';
                } else {
                    highScoreCategoryElement.textContent = '';
                    highScoreCategoryElement.style.display = 'none';
                }
            }
        } else if (highScoreElement) {
            highScoreElement.textContent = '0';
            if (highScoreCategoryElement) {
                highScoreCategoryElement.textContent = '';
            }
        }

        // Update streaks
        const currentStreakElement = document.getElementById('current-streak');
        const bestStreakElement = document.getElementById('best-streak');
        
        if (currentStreakElement) {
            currentStreakElement.textContent = stats.currentStreak || 0;
        }
        if (bestStreakElement) {
            bestStreakElement.textContent = stats.bestStreak || 0;
        }
    }

    async updateStreak() {
        if (!this.currentUser) {
            console.log('No user logged in, skipping streak update');
            return;
        }

        try {
            // Get the current user document
            const userRef = this.db.collection('users').doc(this.currentUser.uid);
            const userDoc = await userRef.get();

            if (!userDoc.exists) {
                console.error('User document not found');
                return;
            }

            const userData = userDoc.data();
            
            // Get dates in user's local timezone
            const now = new Date();
            console.log('Current time:', now.toLocaleString());
            
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            
            // Get the last played date
            let lastPlayedDate = null;
            if (userData.lastPlayedDate) {
                lastPlayedDate = new Date(userData.lastPlayedDate);
                console.log('Last played time:', lastPlayedDate.toLocaleString());
            }

            // Initialize stats if they don't exist
            const currentStats = userData.stats || {};
            let currentStreak = currentStats.currentStreak || 0;
            let bestStreak = currentStats.bestStreak || 0;

            if (!lastPlayedDate) {
                // First time playing
                currentStreak = 1;
                bestStreak = 1;
                console.log('First time playing - setting streak to 1');
            } else {
                // Convert last played date to start of that day in local timezone
                const lastPlayedStart = new Date(
                    lastPlayedDate.getFullYear(),
                    lastPlayedDate.getMonth(),
                    lastPlayedDate.getDate()
                );
                
                // Calculate days between last play and now
                const diffInDays = Math.floor((todayStart - lastPlayedStart) / (1000 * 60 * 60 * 24));
                
                console.log('Streak calculation details:');
                console.log('- Last played (exact):', lastPlayedDate.toLocaleString());
                console.log('- Last played (day start):', lastPlayedStart.toLocaleString());
                console.log('- Current time (exact):', now.toLocaleString());
                console.log('- Current day start:', todayStart.toLocaleString());
                console.log('- Days difference:', diffInDays);
                console.log('- Current streak before update:', currentStreak);

                if (diffInDays === 0) {
                    // Same day, keep current streak
                    console.log('Same day play - keeping streak at:', currentStreak);
                } else if (diffInDays === 1) {
                    // Consecutive day
                    currentStreak++;
                    bestStreak = Math.max(bestStreak, currentStreak);
                    console.log('Consecutive day - increasing streak to:', currentStreak);
                } else {
                    // More than one day gap, reset streak
                    currentStreak = 1;
                    console.log('Gap in play - resetting streak to 1');
                }
            }

            // Create a complete stats object that preserves existing stats
            const updatedStats = {
                ...currentStats,
                currentStreak: currentStreak,
                bestStreak: bestStreak,
                gamesPlayed: (currentStats.gamesPlayed || 0) + 1,
                highScore: currentStats.highScore || 0,
                categoryStats: currentStats.categoryStats || {}
            };

            // Update the document with the complete stats object
            await userRef.update({
                lastPlayedDate: now.toISOString(),
                stats: updatedStats
            });

            console.log('Streak updated successfully:', { currentStreak, bestStreak });

            // Update local data
            userData.stats = updatedStats;
            userData.lastPlayedDate = now.toISOString();
            this.userData = userData;
            this.updateUI();

        } catch (error) {
            console.error('Error updating streak:', error);
            // Don't throw the error - we want to fail gracefully
        }
    }

    playAsGuest() {
        this.isGuest = true;
        this.currentUser = null;
        this.updateUI();
    }

    async checkUserData() {
        if (!this.currentUser) {
            console.log('No user logged in');
            return;
        }
        
        try {
            const userDoc = await this.db.collection('users').doc(this.currentUser.uid).get();
            if (userDoc.exists) {
                console.log('User data:', userDoc.data());
            } else {
                console.log('No user document found');
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    }

    async deleteAccount(password) {
        if (!this.currentUser) {
            throw new Error('No user logged in');
        }

        try {
            // Re-authenticate user before deletion
            const credential = firebase.auth.EmailAuthProvider.credential(
                this.currentUser.email,
                password
            );
            await this.currentUser.reauthenticateWithCredential(credential);

            // First delete the user document from Firestore
            await this.db.collection('users').doc(this.currentUser.uid).delete();

            // Then delete the user authentication account
            await this.currentUser.delete();

            // Clear local data
            this.currentUser = null;
            this.userData = null;

            // Update UI
            const usernameDisplay = document.getElementById('username-display');
            if (usernameDisplay) {
                usernameDisplay.textContent = 'Guest';
            }

            // Hide profile modal
            const profileModal = document.getElementById('profile-modal');
            if (profileModal) {
                profileModal.classList.add('hidden');
            }

            // Remove overlay
            const overlay = document.querySelector('.overlay');
            if (overlay) overlay.remove();

            return true;
        } catch (error) {
            console.error('Delete account error:', error);
            throw error;
        }
    }

    async checkAndUpdateStreak() {
        if (!this.currentUser || !this.userData?.lastPlayedDate) return;

        const lastPlayed = new Date(this.userData.lastPlayedDate);
        const currentDate = new Date();
        
        // Reset time part to compare just the dates
        lastPlayed.setHours(0, 0, 0, 0);
        currentDate.setHours(0, 0, 0, 0);
        
        const diffTime = currentDate - lastPlayed;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        // If more than 1 day has passed, reset streak to 0
        if (diffDays > 1) {
            const userRef = this.db.collection('users').doc(this.currentUser.uid);
            await userRef.update({
                'stats.currentStreak': 0
            });
            
            this.userData.stats.currentStreak = 0;
            this.updateUI();
        }
    }
}

// Initialize after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.userManager = new FirebaseUserManager();
});

