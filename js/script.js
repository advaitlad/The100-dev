// Use the categories data from the external file
let gameCategories = window.gameData;

// Global variables
let currentCategory = 'area';
let currentScore = 0;
let chancesLeft = 5;
let guessedCountries = [];
let foundHundredth = false;
let hundredthRankedItem;
let targetScore = 500; // Default target score
let hasReachedTarget = false;

// Global DOM element references
let guessInput, submitButton, chanceSpan, scoreSpan, guessesList;
let gameOverDiv, finalScoreSpan, playAgainButton, tilesWrapper;
let sidePanel, categoriesToggle, categoriesList, categorySearch;
let profileToggle, loginModal, profileModal;

let selectedCategoryIndex = -1;

// Global variables for modal event listeners
let tutorialEscapeListener;
let profileEscapeListener;
let loginEscapeListener;

// Add refresh warning with custom modal
let isRefreshConfirmationShown = false;

// Function to check if game is in progress
function isGameInProgress() {
    return chancesLeft > 0 && chancesLeft < 5 || guessedCountries.length > 0;
}

// Listen for key combinations that might trigger refresh
document.addEventListener('keydown', function(e) {
    // Detect Ctrl/Cmd + R or F5
    if ((e.ctrlKey || e.metaKey) && e.key === 'r' || e.key === 'F5') {
        if (isGameInProgress() && !isRefreshConfirmationShown) {
            e.preventDefault();
            showRefreshConfirmation();
        }
    }
});

// Initialize DOM elements
function initializeDOMElements() {
    // Get DOM element references
    guessInput = document.getElementById('guess-input');
    submitButton = document.getElementById('submit-guess');
    chanceSpan = document.getElementById('chances');
    scoreSpan = document.getElementById('score');
    guessesList = document.getElementById('guesses-list');
    gameOverDiv = document.getElementById('game-over');
    finalScoreSpan = document.getElementById('final-score');
    playAgainButton = document.getElementById('play-again');
    tilesWrapper = document.querySelector('.tiles-wrapper');
    sidePanel = document.querySelector('.side-panel');
    categoriesToggle = document.getElementById('categories-toggle');
    categoriesList = document.querySelector('.categories-list');
    categorySearch = document.getElementById('category-search');
    profileToggle = document.getElementById('profile-toggle');
    loginModal = document.getElementById('login-modal');
    profileModal = document.getElementById('profile-modal');

    // Initialize game elements after DOM elements are available
    if (!tilesWrapper) {
        console.error('Tiles wrapper not found');
        return;
    }
    
    // Initialize tiles first
    initializeTiles();
    
    // Then initialize categories
    initializeCategoriesList();
    
    // Add event listeners
    submitButton?.addEventListener('click', () => {
        const guess = guessInput.value.trim();
        if (!guess) return;
        
        const result = checkGuess(guess);
        updateUI(guess, result);
        guessInput.value = '';
    });

    // Add event listener for categories close button
    const closeCategoriesBtn = document.querySelector('.close-side-panel');
    closeCategoriesBtn?.addEventListener('click', () => {
        sidePanel?.classList.remove('active');
        document.querySelector('.game-container')?.classList.remove('side-panel-active');
        document.querySelector('.overlay')?.remove();
    });

    guessInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            submitButton?.click();
        }
    });

    // Tutorial modal events
    const tutorialBtn = document.getElementById('tutorial-btn');
    tutorialBtn?.addEventListener('click', () => {
        // Check if game over modal is visible
        const gameOverModal = document.getElementById('game-over');
        if (gameOverModal && !gameOverModal.classList.contains('hidden')) {
            shakeGameOverModal();
            return;
        }

        closeModalsExcept('tutorial');
        
        const tutorialModal = document.getElementById('tutorial-modal');
        const overlay = document.createElement('div');
        overlay.className = 'overlay active';
        document.body.appendChild(overlay);

        tutorialModal?.classList.remove('hidden');

        overlay.addEventListener('click', () => {
            tutorialModal?.classList.add('hidden');
            overlay.remove();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                tutorialModal?.classList.add('hidden');
                overlay.remove();
            }
        });
    });

    const closeTutorialBtn = document.getElementById('close-tutorial');
    closeTutorialBtn?.addEventListener('click', closeTutorialModal);

    // Add event listener for the 'x' close button
    const closeTutorialXBtn = document.getElementById('close-tutorial-x');
    closeTutorialXBtn?.addEventListener('click', closeTutorialModal);

    // Side panel events
    categoriesToggle?.addEventListener('click', () => {
        // Check if game over modal is visible
        const gameOverModal = document.getElementById('game-over');
        if (gameOverModal && !gameOverModal.classList.contains('hidden')) {
            shakeGameOverModal();
            return;
        }

        closeModalsExcept('categories');
        
        const sidePanel = document.querySelector('.side-panel');
        const gameContainer = document.querySelector('.game-container');
        
        if (sidePanel && gameContainer) {
            sidePanel.classList.add('active');
            gameContainer.classList.add('side-panel-active');
            
            const overlay = document.createElement('div');
            overlay.className = 'overlay active';
            document.body.appendChild(overlay);
            
            overlay.addEventListener('click', () => {
                sidePanel.classList.remove('active');
                gameContainer.classList.remove('side-panel-active');
                overlay.remove();
            });
            
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    sidePanel.classList.remove('active');
                    gameContainer.classList.remove('side-panel-active');
                    overlay.remove();
                }
            });
        }
    });

    // Category search
    categorySearch?.addEventListener('input', filterCategories);
    categorySearch?.addEventListener('keydown', handleCategoryKeyboard);

    // Remove the profile toggle event listener since it's handled in auth.js
    // profileToggle?.addEventListener('click', () => {
    //     if (window.userManager?.currentUser) {
    //         showProfileModal();
    //     } else {
    //         showLoginModal();
    //     }
    // });
}

// Wait for DOM to be ready before initializing
document.addEventListener('DOMContentLoaded', () => {
    // Function to check if game data is loaded
    const checkGameData = () => {
        if (window.gameData) {
            // Game data is loaded, initialize the game
            gameCategories = window.gameData;
            initializeDOMElements();
        } else {
            // Game data not loaded yet, retry after a short delay
            console.log('Waiting for game data to load...');
            setTimeout(checkGameData, 100);
        }
    };

    // Start checking for game data
    checkGameData();
});

// Add function to show refresh confirmation modal
function showRefreshConfirmation() {
    const refreshConfirmModal = document.getElementById('refresh-confirm-modal');
    if (!refreshConfirmModal || isRefreshConfirmationShown) return;

    isRefreshConfirmationShown = true;
    
    // Close all other modals first
    closeAllModals();
    
    // Show the refresh confirmation modal
    refreshConfirmModal.classList.remove('hidden');
    
    // Add event listeners
    const confirmBtn = document.getElementById('confirm-refresh');
    const cancelBtn = document.getElementById('cancel-refresh');
    
    const confirmHandler = () => {
        refreshConfirmModal.classList.add('hidden');
        isRefreshConfirmationShown = false;
        window.location.reload();
        cleanup();
    };
    
    const cancelHandler = () => {
        refreshConfirmModal.classList.add('hidden');
        isRefreshConfirmationShown = false;
        cleanup();
    };

    // Add keyboard support
    const keyHandler = (e) => {
        if (e.key === 'Enter') {
            confirmHandler();
        } else if (e.key === 'Escape') {
            cancelHandler();
        }
    };
    
    // Cleanup function to remove all event listeners
    const cleanup = () => {
        confirmBtn?.removeEventListener('click', confirmHandler);
        cancelBtn?.removeEventListener('click', cancelHandler);
        document.removeEventListener('keydown', keyHandler);
    };
    
    confirmBtn?.addEventListener('click', confirmHandler);
    cancelBtn?.addEventListener('click', cancelHandler);
    document.addEventListener('keydown', keyHandler);
}

function initializeTiles() {
    const tilesWrapper = document.querySelector('.tiles-wrapper');
    if (!tilesWrapper) {
        console.error('Tiles wrapper not found');
        return;
    }
    
    tilesWrapper.innerHTML = '';
    tilesWrapper.style.transform = 'translateY(0)'; // Reset scroll position
    
    for (let i = 100; i >= 1; i--) {
        const tile = document.createElement('div');
        tile.className = 'country-tile';
        tile.dataset.position = i;
        tile.innerHTML = `
            <span class="position">#${i}</span>
            <span class="name">🔒</span>
            <span class="area">—</span>
        `;
        tilesWrapper.appendChild(tile);
    }
}

function checkGuess(guess) {
    // Check if gameCategories and current category exist
    if (!gameCategories || !gameCategories[currentCategory]) {
        console.error('Category data not found:', currentCategory);
        return { 
            score: 0, 
            message: "Error: Category data not found" 
        };
    }

    // Check if category data exists
    if (!gameCategories[currentCategory].data) {
        console.error('Category data is undefined for:', currentCategory);
        return { 
            score: 0, 
            message: "Error: Category data is undefined" 
        };
    }

    const categoryData = gameCategories[currentCategory].data.slice(0, 100); // Only check first 100 items
    
    // Find matching item using our new checkAnswer function
    const matchIndex = categoryData.findIndex(item => 
        checkAnswer(guess, item.name)
    );

    if (matchIndex === -1) {
        return { 
            score: 0, 
            message: currentCategory === 'spotify' ? 
                "This song is not in the top 100!" : 
                "This is not in the top 100!" 
        };
    }

    const position = matchIndex + 1;
    const score = position;
    
    return {
        score,
        position,
        message: `Position: ${position}! ${score} points!`
    };
}

function updateUI(guess, result) {
    // Check for duplicate guess first
    const normalizedCurrentGuess = normalizeGuess(guess);
    const isDuplicate = guessedCountries.some(previousGuess => 
        normalizeGuess(previousGuess) === normalizedCurrentGuess
    );

    if (isDuplicate) {
        showPopup('duplicate');
        return;
    }

    // Add the guess to guessedCountries list
    guessedCountries.push(normalizedCurrentGuess);

    // Decrease chances and update UI
    chancesLeft--;
    console.log('Chances left after decrement:', chancesLeft); // Debug log
    chanceSpan.textContent = chancesLeft;

    if (result.position) {
        // Correct guess - reveal tile with animation
        revealTile(result.position);
        
        const listItem = document.createElement('li');
        const progressBar = document.createElement('div');
        progressBar.className = 'guess-progress';
        progressBar.style.background = getColorForScore(result.score);
        
        listItem.innerHTML = `
            <span>${guess}</span>
            <span>${result.score} points</span>
        `;
        
        listItem.appendChild(progressBar);
        guessesList.prepend(listItem);
        
        // Animate progress bar
        setTimeout(() => {
            progressBar.style.width = `${result.score}%`;
        }, 50);

        // Update score with animation
        const oldScore = currentScore;
        currentScore += result.score;
        animateScore(oldScore, currentScore);

        // Check if this is the 100th ranked item
        if (result.position === 100) {
            foundHundredth = true;
            
            // Set the hundredthRankedItem
            if (gameCategories[currentCategory]?.data) {
                hundredthRankedItem = gameCategories[currentCategory].data[99];
            }
            
            // Disable input during celebration
            guessInput.disabled = true;
            submitButton.disabled = true;
            
            // Wait for tile reveal and score animations
            setTimeout(() => {
                showHundredthCelebration();
            }, 1000);
            
            // Don't proceed with game over check - it will be handled after celebration
            return;
        }
    } else {
        // Incorrect guess - add to list with 0 points
        const listItem = document.createElement('li');
        const progressBar = document.createElement('div');
        progressBar.className = 'guess-progress';
        progressBar.style.background = getColorForScore(0);
        
        listItem.innerHTML = `
            <span>${guess}</span>
            <span>0 points</span>
        `;
        
        listItem.appendChild(progressBar);
        guessesList.prepend(listItem);
        
        // Show the "not in top 100" popup
        showPopup('notTop100');
    }

    // Show hints if the game is still going and we haven't found the 100th
    if (!foundHundredth) {
        const hints = getHundredthRankHint(guess);
        if (hints) {
            showHintsPopup(hints);
        }
    }

    // Get current score and target score
    const categoryData = gameCategories?.[currentCategory];
    const categoryTargetScore = categoryData?.targetScore || targetScore;
    const hasReachedTargetScore = currentScore >= categoryTargetScore;

    // Check if game is over
    if (chancesLeft === 0) {
        // Disable input during animations
        guessInput.disabled = true;
        submitButton.disabled = true;
        
        // If target score was just reached on last chance, let the celebration popup handle game over
        // Otherwise, follow normal game over flow
        if (hasReachedTargetScore && currentScore - result.score < categoryTargetScore) {
            // Target score was just reached on last chance - celebration popup will handle game over
            return;
        } else {
            // Either target score wasn't reached, or it was reached earlier - follow normal game over flow
            setTimeout(() => {
                showGameOver();
            }, result.position ? 2000 : 1000);
        }
    }
}

function formatValue(value, unit) {
    if (unit.includes('billion')) {
        return value.toFixed(3) + ' billion';
    } else if (unit.includes('million')) {
        return value.toFixed(1) + ' million';
    }
    return value.toLocaleString() + ' ' + unit;
}

function revealTile(position) {
    const categoryData = gameCategories[currentCategory].data;
    const country = categoryData[position - 1];
    // Calculate the reversed index since tiles are displayed in reverse order
    const reversedIndex = 100 - position;
    const tile = tilesWrapper?.children[reversedIndex];
    
    // Guard clause - if tile doesn't exist, log error and return
    if (!tile) {
        console.error(`Tile at position ${position} not found`);
        return;
    }
    
    tile.className = 'country-tile revealed success-animation';
    
    const value = formatValue(country.value, gameCategories[currentCategory].unit);
    
    tile.innerHTML = `
        <span class="position">#${position}</span>
        <span class="name">${country.name}</span>
        <span class="area">${value}</span>
    `;
    
    setTimeout(() => {
        tile.classList.remove('success-animation');
    }, 1500);
    
    // Scroll the tile into view with smooth animation
    tile.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function getColorForScore(score) {
    if (score === 0) {
        return 'rgba(220, 0, 0, 0.8)'; // Increased opacity for wrong guesses
    }
    
    // Adjust color scale with increased opacity and adjusted brightness
    if (score <= 33) {
        // Red range - darker and more visible
        const brightness = 25 + (score * 1);
        return `hsla(0, 100%, ${brightness}%, 0.8)`;
    } else if (score <= 66) {
        // Red through yellow - more saturated
        const hue = (score - 33) * (60 / 33); // 0 to 60 (red to yellow)
        return `hsla(${hue}, 100%, 45%, 0.8)`;
    } else {
        // Yellow to green - darker and more saturated
        const hue = 60 + ((score - 66) * (60 / 34)); // 60 to 120 (yellow to green)
        return `hsla(${hue}, 100%, 45%, 0.8)`;
    }
}

function showPopup(type) {
    const popupId = type === 'invalid' ? 'invalid-popup' : 
                    type === 'notTop100' ? 'popup' :
                    'duplicate-popup';
    
    const popup = document.getElementById(popupId);
    popup.classList.remove('hidden');
    
    // Remove the popup after animation completes
    setTimeout(() => {
        popup.classList.add('hidden');
    }, 2000);
}

function animateScore(startScore, endScore) {
    const duration = 1000; // 1 second animation
    const steps = 60; // 60 steps for smooth animation
    const increment = (endScore - startScore) / steps;
    let currentStep = 0;
    
    // Clear any existing animation interval
    if (window.scoreAnimationInterval) {
        clearInterval(window.scoreAnimationInterval);
    }
    
    window.scoreAnimationInterval = setInterval(() => {
        currentStep++;
        const currentValue = Math.round(startScore + (increment * currentStep));
        
        // Update score display
        if (scoreSpan) {
            scoreSpan.textContent = currentValue;
        }
        
        // Update trophy fill
        updateTrophyFill(currentValue);
        
        if (currentStep >= steps) {
            clearInterval(window.scoreAnimationInterval);
            if (scoreSpan) {
                scoreSpan.textContent = endScore; // Ensure we end on the exact number
            }
            updateTrophyFill(endScore); // Ensure final fill is exact
            window.scoreAnimationInterval = null;
        }
    }, duration / steps);
}

async function showGameOver() {
    // Create game over div if it doesn't exist
    if (!gameOverDiv) {
        gameOverDiv = document.createElement('div');
        gameOverDiv.id = 'game-over';
        document.body.appendChild(gameOverDiv);
    }

    // Set game over content immediately but keep it hidden
    gameOverDiv.innerHTML = `
        <div class="game-over-header">
            <h2>Game Over!</h2>
            <button class="close-game-over-btn" aria-label="Close game over screen">&times;</button>
        </div>
        <div class="final-score-container">
            <div class="final-score-label">FINAL SCORE</div>
            <div class="final-score-value">${currentScore}</div>
        </div>
        <p class="play-again-text">Want to try again?</p>
        <div class="game-over-buttons">
            <button class="game-over-btn show-answers-btn">Show Answers</button>
            <button class="game-over-btn play-again-btn">Yes, Play Again</button>
            <button class="game-over-btn no-play-btn">No, Thanks</button>
        </div>
    `;

    // Create overlay but keep it hidden initially
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    document.body.appendChild(overlay);

    // Add a small delay to ensure all animations are complete
    await new Promise(resolve => setTimeout(resolve, 500));

    // Show overlay and game over screen
    overlay.classList.add('active');
    gameOverDiv.classList.remove('hidden');

    // Save game results if user is logged in and userManager exists
    if (window.userManager?.currentUser) {
        try {
            // Prepare game results
            const gameResults = [];
            const guessList = guessesList?.children || [];
            Array.from(guessList).forEach(li => {
                const nameSpan = li.querySelector('span:first-child');
                const scoreSpan = li.querySelector('span:last-child');
                if (nameSpan && scoreSpan) {
                    gameResults.push({
                        name: nameSpan.textContent,
                        score: parseInt(scoreSpan.textContent.split(' ')[0]) || 0
                    });
                }
            });

            console.log('Updating streak and saving game results...');
            
            // First update the streak
            await window.userManager.updateStreak()
                .catch(error => {
                    console.error('Error updating streak:', error);
                    throw error; // Re-throw to handle in outer catch
                });
                
            console.log('Streak updated successfully');

            // Then save the game result
            await window.userManager.saveGameResult(currentCategory, currentScore, gameResults)
                .catch(error => {
                    console.error('Error saving game result:', error);
                    throw error; // Re-throw to handle in outer catch
                });
                
            console.log('Game results saved successfully');

        } catch (error) {
            console.error('Error in game over operations:', error);
            // Continue with the game over screen even if saving fails
        }
    }

    // Function to handle closing the game over screen
    const closeGameOver = () => {
        // Remove all overlays
        document.querySelectorAll('.overlay').forEach(overlay => {
            if (overlay && overlay.parentNode) {
                overlay.remove();
            }
        });
        
        if (gameOverDiv) {
            gameOverDiv.classList.add('hidden');
        }
        // Create floating play again button
        createFloatingPlayAgainButton();
    };

    // Add keyboard support
    const handleKeydown = (e) => {
        if (e.key === 'Escape' && !gameOverDiv.classList.contains('hidden')) {
            closeGameOver();
            document.removeEventListener('keydown', handleKeydown);
        }
    };
    document.addEventListener('keydown', handleKeydown);

    // Add event listeners for buttons
    const closeBtn = document.querySelector('.close-game-over-btn');
    const showAnswersBtn = document.querySelector('.show-answers-btn');
    const playAgainBtn = document.querySelector('.play-again-btn');
    const noPlayBtn = document.querySelector('.no-play-btn');

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            closeGameOver();
            document.removeEventListener('keydown', handleKeydown);
        });
    }
    
    if (showAnswersBtn) {
        showAnswersBtn.addEventListener('click', () => showAllAnswers(true));
    }
    
    if (playAgainBtn) {
        playAgainBtn.addEventListener('click', () => {
            // Remove all overlays, modals and floating buttons
            document.querySelectorAll('.overlay, .answers-modal, .game-over, .floating-buttons-container').forEach(element => {
                if (element && element.parentNode) {
                    element.remove();
                }
            });
            
            // Hide game over screen
            if (gameOverDiv) {
                gameOverDiv.classList.add('hidden');
            }
            
            resetGame();
        });
    }

    if (noPlayBtn) {
        noPlayBtn.addEventListener('click', closeGameOver);
    }
}

function createFloatingPlayAgainButton() {
    // Remove any existing floating buttons
    const existingContainer = document.querySelector('.floating-buttons-container');
    if (existingContainer) {
        existingContainer.remove();
    }

    // Create container for floating buttons
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'floating-buttons-container';
    
    // Create show answers button
    const showAnswersBtn = document.createElement('button');
    showAnswersBtn.id = 'floating-show-answers';
    showAnswersBtn.className = 'floating-btn show-answers-btn';
    showAnswersBtn.innerHTML = '<i class="fas fa-list"></i> Show Answers';
    
    // Create play again button
    const playAgainBtn = document.createElement('button');
    playAgainBtn.id = 'floating-play-again';
    playAgainBtn.className = 'floating-btn play-again-btn';
    playAgainBtn.innerHTML = '<i class="fas fa-redo"></i> Play Again';
    
    // Add click events
    showAnswersBtn.addEventListener('click', () => {
        // Remove the floating buttons before showing answers
        buttonsContainer.remove();
        showAllAnswers(false); // Explicitly pass false to indicate not from game over
    });
    
    playAgainBtn.addEventListener('click', () => {
        buttonsContainer.remove();
        resetGame();
    });

    // Add buttons to container
    buttonsContainer.appendChild(showAnswersBtn);
    buttonsContainer.appendChild(playAgainBtn);

    // Add container to body
    document.body.appendChild(buttonsContainer);
}

function showAllAnswers(fromGameOver = false) {
    // Hide game over screen
    if (gameOverDiv) {
        gameOverDiv.classList.add('hidden');
    }
    
    // Remove any existing overlays first
    document.querySelectorAll('.overlay').forEach(overlay => {
        if (overlay && overlay.parentNode) {
            overlay.remove();
        }
    });
    
    // Create answers modal
    const answersModal = document.createElement('div');
    answersModal.className = 'answers-modal';
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'overlay active';
    
    // Get current category data (limit to top 100 and reverse for descending order)
    const categoryData = gameCategories[currentCategory]?.data?.slice(0, 100).reverse() || [];
    const categoryUnit = gameCategories[currentCategory]?.unit || '';
    const categoryTitle = gameCategories[currentCategory]?.title || 'Results';
    
    answersModal.innerHTML = `
        <div class="answers-content">
            <h2>${categoryTitle}</h2>
            <div class="answers-tiles-container">
                ${categoryData.map((item, index) => {
                    const position = 100 - index; // This will go from 100 down to 1
                    const formattedValue = formatValue(item.value, categoryUnit);
                    return `
                        <div class="answer-tile">
                            <span class="position">#${position}</span>
                            <span class="name">${item.name}</span>
                            <span class="area">${formattedValue}</span>
                        </div>
                    `;
                }).join('')}
            </div>
            <button id="close-answers" class="close-answers-btn">Close</button>
        </div>
    `;
    
    document.body.appendChild(overlay);
    document.body.appendChild(answersModal);
    
    // Function to close answers modal
    const closeAnswersModal = () => {
        // Remove all overlays first
        document.querySelectorAll('.overlay').forEach(overlay => {
            if (overlay && overlay.parentNode) {
                overlay.remove();
            }
        });

        if (answersModal && answersModal.parentNode) {
            answersModal.remove();
        }

        if (fromGameOver && gameOverDiv) {
            // If we came from game over, show it again
            gameOverDiv.classList.remove('hidden');
            const gameOverOverlay = document.createElement('div');
            gameOverOverlay.className = 'overlay active';
            document.body.appendChild(gameOverOverlay);
        } else {
            // If we came from floating buttons, recreate them
            createFloatingPlayAgainButton();
        }
    };
    
    // Add event listeners for closing
    const closeButton = document.getElementById('close-answers');
    if (closeButton) {
        closeButton.addEventListener('click', closeAnswersModal);
    }
    
    overlay.addEventListener('click', closeAnswersModal);
    
    // Add escape key listener
    const escapeListener = (e) => {
        if (e.key === 'Escape') {
            closeAnswersModal();
            document.removeEventListener('keydown', escapeListener);
        }
    };
    document.addEventListener('keydown', escapeListener);
}

function resetGame() {
    // Create and dispatch reset event
    const resetEvent = new CustomEvent('resetGame', {
        detail: { preserveTiles: false }
    });
    document.dispatchEvent(resetEvent);
    
    // Reset game state variables
    currentScore = 0;
    chancesLeft = 5;
    guessedCountries = [];
    foundHundredth = false;
    hasReachedTarget = false;
    
    // Reset trophy fill
    updateTrophyFill(0);
    
    // Initialize tiles for the new category
    initializeTiles();
    
    // Enable input and submit button
    const guessInput = document.getElementById('guess-input');
    const submitButton = document.getElementById('submit-guess');
    
    if (guessInput) {
        guessInput.value = '';
        guessInput.disabled = false;
    }
    
    if (submitButton) {
        submitButton.disabled = false;
    }
}

function isGameInProgress() {
    return chancesLeft < 5 && chancesLeft > 0 && guessedCountries.length > 0;
}

function showConfirmationDialog(callback) {
    const overlay = document.createElement('div');
    overlay.className = 'overlay active';
    
    const confirmDialog = document.createElement('div');
    confirmDialog.className = 'confirm-dialog';
    confirmDialog.innerHTML = `
        <h3>End Current Game?</h3>
        <p>Switching categories will end your current game. Are you sure?</p>
        <div class="confirm-buttons">
            <button class="confirm-btn cancel">Cancel</button>
            <button class="confirm-btn confirm">Switch Category</button>
        </div>
    `;
    
    document.body.appendChild(overlay);
    document.body.appendChild(confirmDialog);
    
    const closeDialog = () => {
        overlay.remove();
        confirmDialog.remove();
    };
    
    confirmDialog.querySelector('.cancel').addEventListener('click', () => {
        closeDialog();
        callback(false);
    });
    
    confirmDialog.querySelector('.confirm').addEventListener('click', () => {
        closeDialog();
        callback(true);
    });
    
    // Close on overlay click
    overlay.addEventListener('click', () => {
        closeDialog();
        callback(false);
    });
    
    // Close on Escape key
    const escapeListener = (e) => {
        if (e.key === 'Escape') {
            closeDialog();
            callback(false);
            document.removeEventListener('keydown', escapeListener);
        }
    };
    document.addEventListener('keydown', escapeListener);
}

// Function to close all active modals
function closeAllModals() {
    // Close tutorial modal if it's open
    const tutorialModal = document.getElementById('tutorial-modal');
    if (tutorialModal && !tutorialModal.classList.contains('hidden')) {
        closeTutorialModal();
    }

    // Close profile modal if it's open
    const profileModal = document.getElementById('profile-modal');
    if (profileModal && !profileModal.classList.contains('hidden')) {
        closeProfileModal();
    }

    // Close login modal if it's open
    const loginModal = document.getElementById('login-modal');
    if (loginModal && !loginModal.classList.contains('hidden')) {
        closeLoginModal();
    }

    // Close signup modal if it's open
    const signupModal = document.getElementById('signup-modal');
    if (signupModal && !signupModal.classList.contains('hidden')) {
        if (typeof closeSignupModal === 'function') {
            closeSignupModal();
        } else {
            signupModal.classList.add('hidden');
        }
    }

    // Close categories panel if it's open
    const sidePanel = document.querySelector('.side-panel');
    if (sidePanel && sidePanel.classList.contains('active')) {
        sidePanel.classList.remove('active');
        document.querySelector('.game-container').classList.remove('side-panel-active');
    }

    // Remove any existing overlays
    const existingOverlays = document.querySelectorAll('.overlay');
    existingOverlays.forEach(overlay => overlay.remove());
}

function toggleSidePanel() {
    // Check if game over modal is visible
    const gameOverModal = document.getElementById('game-over');
    if (gameOverModal && !gameOverModal.classList.contains('hidden')) {
        shakeGameOverModal();
        return; // Don't open categories if game over is showing
    }

    const sidePanel = document.querySelector('.side-panel');
    sidePanel?.classList.toggle('active');
    
    // Add overlay if opening
    if (sidePanel?.classList.contains('active')) {
        const overlay = document.createElement('div');
        overlay.className = 'overlay active';
        document.body.appendChild(overlay);
        
        // Close on overlay click
        overlay.addEventListener('click', () => {
            sidePanel.classList.remove('active');
            overlay.remove();
        });
    } else {
        // Remove overlay if closing
        const overlay = document.querySelector('.overlay');
        overlay?.remove();
    }
}

function initializeCategoriesList() {
    const categoriesContainer = document.getElementById('categories-container');
    if (!categoriesContainer) return;

    categoriesContainer.innerHTML = '';

    // Sort categories into locked and unlocked groups
    const sortedCategories = sortCategories(Object.entries(gameCategories).map(([key, category]) => ({
        ...category,
        key: key, // Add the key to the category object
        name: category.title || key,
        icon: getCategoryIcon(key)
    })));

    sortedCategories.forEach((category) => {
        const item = createCategoryItem(category);
        item.setAttribute('tabindex', '0');
        item.dataset.categoryKey = category.key; // Store the category key in the DOM

        item.addEventListener('click', () => {
            if (category.key !== currentCategory) {
                handleCategorySelection(category.key);
            }
        });

        categoriesContainer.appendChild(item);
    });
}

function sortCategories(categories) {
    return categories.sort((a, b) => {
        // If user is logged in, only consider today's category for sorting
        if (window.userManager?.currentUser) {
            if (a.isTodaysCategory) return -1;
            if (b.isTodaysCategory) return 1;
            return 0;
        }
        
        // For guest users:
        // First separate unlocked and locked categories
        if (a.locked !== b.locked) {
            return a.locked ? 1 : -1;
        }
        
        // Within locked categories, prioritize today's category
        if (a.locked && b.locked) {
            if (a.isTodaysCategory) return -1;
            if (b.isTodaysCategory) return 1;
        }
        
        // Within unlocked categories, keep original order
        return 0;
    });
}

function createCategoryItem(category) {
    const item = document.createElement('div');
    item.className = 'category-item';
    
    // For guest users, show lock status as is
    // For logged-in users, all categories are unlocked
    const isLocked = window.userManager?.currentUser ? false : category.locked;
    
    if (isLocked) {
        item.classList.add('locked');
    }
    
    if (category.isTodaysCategory) {
        item.classList.add('todays-category');
    }
    
    const icon = document.createElement('div');
    icon.className = 'icon';
    icon.innerHTML = category.icon;
    
    const text = document.createElement('div');
    text.className = 'text';
    text.textContent = category.name;
    
    // Show lock icon based on locked status
    const lockIcon = isLocked ? '<div class="lock-icon"><i class="fas fa-lock"></i></div>' : '';
    
    item.appendChild(icon);
    item.appendChild(text);
    if (lockIcon) {
        item.insertAdjacentHTML('beforeend', lockIcon);
    }
    
    return item;
}

function filterCategories() {
    const searchTerm = categorySearch.value.toLowerCase().trim();
    const categoryItems = document.querySelectorAll('.category-item');
    const noResults = document.getElementById('no-results');
    
    // Reset selection when filter changes
    selectedCategoryIndex = -1;
    
    let hasVisibleCategories = false;
    let visibleItems = [];
    
    categoryItems.forEach(item => {
        const text = item.querySelector('.text');
        if (!text) return;
        
        const categoryName = text.textContent.toLowerCase();
        if (categoryName.includes(searchTerm)) {
            item.style.display = 'flex';
            hasVisibleCategories = true;
            visibleItems.push(item);
        } else {
            item.style.display = 'none';
        }
        
        // Remove any existing selection styling
        item.classList.remove('keyboard-selected');
    });
    
    // Show/hide no results message
    if (searchTerm === '') {
        if (noResults) noResults.classList.add('hidden');
        categoryItems.forEach(item => item.style.display = 'flex');
    } else if (noResults) {
        noResults.classList.toggle('hidden', hasVisibleCategories);
    }
}

// Add keyboard navigation
function handleCategoryKeyboard(e) {
    const visibleItems = Array.from(document.querySelectorAll('.category-item'))
        .filter(item => item.style.display !== 'none');
    
    if (visibleItems.length === 0) return;

    // Remove current selection if exists
    if (selectedCategoryIndex >= 0 && selectedCategoryIndex < visibleItems.length) {
        visibleItems[selectedCategoryIndex].classList.remove('keyboard-selected');
    }

    switch (e.key) {
        case 'ArrowDown':
            e.preventDefault();
            // If no selection, select first item, otherwise move to next
            if (selectedCategoryIndex === -1) {
                selectedCategoryIndex = 0;
            } else {
                selectedCategoryIndex = selectedCategoryIndex < visibleItems.length - 1 ? 
                    selectedCategoryIndex + 1 : 0;
            }
            break;
        case 'ArrowUp':
            e.preventDefault();
            // If no selection, select last item, otherwise move to previous
            if (selectedCategoryIndex === -1) {
                selectedCategoryIndex = visibleItems.length - 1;
            } else {
                selectedCategoryIndex = selectedCategoryIndex > 0 ? 
                    selectedCategoryIndex - 1 : visibleItems.length - 1;
            }
            break;
        case 'Enter':
            if (selectedCategoryIndex >= 0 && selectedCategoryIndex < visibleItems.length) {
                e.preventDefault();
                const selectedItem = visibleItems[selectedCategoryIndex];
                selectedItem.click();
                // Clear the search and close the panel after selection
                categorySearch.value = '';
                filterCategories();
                return;
            } else if (visibleItems.length === 1) {
                // If there's only one visible item, select it even if not keyboard-selected
                e.preventDefault();
                visibleItems[0].click();
                categorySearch.value = '';
                filterCategories();
                return;
            }
            break;
        default:
            return;
    }

    // Apply new selection
    if (selectedCategoryIndex >= 0 && selectedCategoryIndex < visibleItems.length) {
        const selectedItem = visibleItems[selectedCategoryIndex];
        selectedItem.classList.add('keyboard-selected');
        selectedItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function removeAllModals() {
    // Remove all modal-related elements
    document.querySelectorAll('.overlay, .confirm-modal, .confirm-content, .modal-header, .modal-footer, .confirm-dialog').forEach(element => {
        // If the element is still in the DOM, remove it
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
        }
    });
}

async function handleCategorySelection(categoryKey) {
    // Check if category exists in gameCategories
    if (!gameCategories[categoryKey]) {
        console.error('Invalid category key:', categoryKey);
        return;
    }

    // Check if category is locked for guest users
    if (isGuestLockedCategory(categoryKey)) {
        showLoginPrompt();
        return;
    }

    // If it's the same category and not a guest-locked category, no need to do anything
    if (currentCategory === categoryKey) {
        return;
    }

    // If a game is in progress, show confirmation dialog
    if (isGameInProgress()) {
        const shouldSwitch = await showCategoryChangeConfirmation();
        if (!shouldSwitch) {
            return;
        }
    }

    // Switch to the selected category
    switchCategory(categoryKey);

    // Close the side panel
    closeSidePanel();
}

function switchCategory(categoryKey) {
    // Safety check for category existence
    if (!gameCategories || !gameCategories[categoryKey]) {
        console.error('Invalid category key:', categoryKey);
        return;
    }

    // Update current category
    currentCategory = categoryKey;

    // Update category title in UI
    const categoryTitleElement = document.getElementById('current-category');
    if (categoryTitleElement) {
        categoryTitleElement.textContent = gameCategories[categoryKey].title;
    }

    // Reset trophy fill for new category
    updateTrophyFill(0);

    // Reset game state
    resetGame();

    // Refresh categories list
    initializeCategoriesList();
}

function closeSidePanel() {
    const sidePanel = document.querySelector('.side-panel');
    const gameContainer = document.querySelector('.game-container');
    
    if (sidePanel) {
        sidePanel.classList.remove('active');
    }
    
    if (gameContainer) {
        gameContainer.classList.remove('side-panel-active');
    }
    
    // Remove overlay if exists
    const overlay = document.querySelector('.overlay');
    if (overlay) {
        overlay.remove();
    }
}

// Helper function to show login prompt
function showLoginPrompt() {
    // Remove any existing modals
    removeAllModals();

    // Create and show login prompt modal
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.style.zIndex = '1000';

    const loginPrompt = document.createElement('div');
    loginPrompt.className = 'confirm-modal';
    loginPrompt.style.zIndex = '1001';
    loginPrompt.innerHTML = `
        <div class="confirm-content">
            <div class="modal-header">
                <div class="warning-icon">
                    <i class="fas fa-lock"></i>
                </div>
                <h2>Login Required</h2>
                <p>This category is only available for registered users.</p>
            </div>
            <div class="modal-footer">
                <button class="modal-btn cancel">
                    <i class="fas fa-times"></i>
                    Maybe Later
                </button>
                <button class="modal-btn confirm">
                    <i class="fas fa-sign-in-alt"></i>
                    Login / Sign Up
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(loginPrompt);

    // Add event listeners
    const cancelBtn = loginPrompt.querySelector('.cancel');
    const confirmBtn = loginPrompt.querySelector('.confirm');

    cancelBtn.addEventListener('click', removeAllModals);
    confirmBtn.addEventListener('click', () => {
        removeAllModals();
        const loginModal = document.getElementById('login-modal');
        if (loginModal) {
            loginModal.classList.remove('hidden');
            const loginOverlay = document.createElement('div');
            loginOverlay.className = 'overlay active';
            document.body.appendChild(loginOverlay);
        }
    });
}

// Helper function to show category change confirmation
function showCategoryChangeConfirmation() {
    return new Promise((resolve) => {
        // Remove any existing modals
        removeAllModals();

        // Create confirmation modal
        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        overlay.style.zIndex = '1000';

        const confirmModal = document.createElement('div');
        confirmModal.className = 'confirm-modal';
        confirmModal.style.zIndex = '1001';
        confirmModal.innerHTML = `
            <div class="confirm-content">
                <div class="modal-header">
                    <div class="warning-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h2>Switch Category?</h2>
                    <p>Starting a new category will reset your current game progress.</p>
                </div>
                <div class="modal-footer">
                    <button class="modal-btn cancel">
                        <i class="fas fa-times"></i>
                        Continue Playing
                    </button>
                    <button class="modal-btn confirm">
                        <i class="fas fa-check"></i>
                        Switch Category
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        document.body.appendChild(confirmModal);

        // Add event listeners
        const cancelBtn = confirmModal.querySelector('.cancel');
        const confirmBtn = confirmModal.querySelector('.confirm');

        const handleResponse = (result) => {
            removeAllModals();
            resolve(result);
        };

        cancelBtn.addEventListener('click', () => handleResponse(false));
        confirmBtn.addEventListener('click', () => handleResponse(true));
        overlay.addEventListener('click', () => handleResponse(false));

        // Add keyboard support
        const handleKeydown = (e) => {
            if (e.key === 'Escape') {
                handleResponse(false);
                document.removeEventListener('keydown', handleKeydown);
            }
        };
        document.addEventListener('keydown', handleKeydown);
    });
}

function isGuestLockedCategory(category) {
    // If user is logged in, categories are never locked
    if (window.userManager?.currentUser) {
        return false;
    }
    // Return true if the category is locked and user is not logged in
    return gameCategories[category]?.locked === true;
}

function getCategoryIcon(category) {
    const icons = {
        area: '<i class="fas fa-ruler-combined"></i>',
        population: '<i class="fas fa-users"></i>',
        instagram: '<i class="fab fa-instagram"></i>',
        spotify: '<i class="fab fa-spotify"></i>',
        spotifyArtists: '<i class="fab fa-spotify"></i>',
        netflix: '<i class="fas fa-film"></i>',
        mobileApps: '<i class="fas fa-mobile-alt"></i>'
    };
    return icons[category] || '<i class="fas fa-globe"></i>';
}

function closeTutorialModal() {
    const tutorialModal = document.getElementById('tutorial-modal');
    if (tutorialModal) {
        tutorialModal.classList.add('hidden');
        tutorialModal.scrollTop = 0;
    }
    const overlay = document.querySelector('.overlay');
    if (overlay) overlay.remove();
    // Remove escape key listener
    if (tutorialEscapeListener) {
        document.removeEventListener('keydown', tutorialEscapeListener);
    }
}

// Close profile modal function
function closeProfileModal() {
    if (profileModal) {
        profileModal.classList.add('hidden');
    }
    const overlay = document.querySelector('.overlay');
    if (overlay) overlay.remove();
    // Remove escape key listener
    if (profileEscapeListener) {
        document.removeEventListener('keydown', profileEscapeListener);
    }
}

// Close login modal function
function closeLoginModal() {
    if (loginModal) {
        loginModal.classList.add('hidden');
    }
    const overlay = document.querySelector('.overlay');
    if (overlay) overlay.remove();
    // Remove escape key listener
    if (loginEscapeListener) {
        document.removeEventListener('keydown', loginEscapeListener);
    }
}

// Add event listener for game reset
document.addEventListener('resetGame', (event) => {
    // Reset game state variables
    currentScore = 0;
    chancesLeft = 5;
    guessedCountries = [];
    foundHundredth = false;
    
    // Reset score and chances display
    const scoreSpan = document.getElementById('score');
    const chanceSpan = document.getElementById('chances');
    if (scoreSpan) scoreSpan.textContent = '0';
    if (chanceSpan) chanceSpan.textContent = '5';
    
    // Clear guesses list
    const guessesList = document.getElementById('guesses-list');
    if (guessesList) guessesList.innerHTML = '';
    
    // Only reinitialize tiles if preserveTiles flag is not set
    if (!event.detail?.preserveTiles) {
        initializeTiles();
    }

    // Clear input field
    const guessInput = document.getElementById('guess-input');
    if (guessInput) {
        guessInput.value = '';
        guessInput.disabled = false;
    }

    // Enable submit button
    const submitButton = document.getElementById('submit-guess');
    if (submitButton) submitButton.disabled = false;

    // Hide game over modal if visible
    const gameOverModal = document.getElementById('game-over');
    if (gameOverModal) gameOverModal.classList.add('hidden');

    // Reset any popups
    const popups = document.querySelectorAll('.popup');
    popups.forEach(popup => popup.classList.add('hidden'));
});

// Add this to handle auth state changes to update category locks
document.addEventListener('DOMContentLoaded', () => {
    if (window.userManager) {
        const originalUpdateUI = window.userManager.updateUI;
        window.userManager.updateUI = function() {
            originalUpdateUI.call(this);
            initializeCategoriesList(); // Refresh categories when auth state changes
        };
    }
});

function updateTutorialButtonPosition() {
    const profileButton = document.querySelector('.profile-toggle');
    const tutorialButton = document.querySelector('.tutorial-btn');
    
    if (profileButton && tutorialButton) {
        const profileRect = profileButton.getBoundingClientRect();
        const newRight = window.innerWidth - profileRect.left + 10; // 10px gap
        tutorialButton.style.right = `${newRight}px`;
    }
}

// Add resize and mutation observers to handle dynamic updates
window.addEventListener('resize', updateTutorialButtonPosition);

// Create a MutationObserver to watch for changes in the profile button content
const profileButton = document.querySelector('.profile-toggle');
if (profileButton) {
    const observer = new MutationObserver(updateTutorialButtonPosition);
    observer.observe(profileButton, { 
        childList: true, 
        characterData: true, 
        subtree: true 
    });
}

// Initial position update
document.addEventListener('DOMContentLoaded', () => {
    updateTutorialButtonPosition();
});

function shakeGameOverModal() {
    const gameOverModal = document.getElementById('game-over');
    if (!gameOverModal) return;

    // Remove any existing animation classes
    gameOverModal.classList.remove('shake-animation');
    
    // Force a browser reflow to restart the animation
    void gameOverModal.offsetWidth;
    
    // Add the animation class
    gameOverModal.classList.add('shake-animation');
    
    // Remove the class after animation completes
    setTimeout(() => {
        gameOverModal.classList.remove('shake-animation');
    }, 300); // Match the animation duration
}

// Add this function at the top level
function isAnyModalOpen() {
    const tutorialModal = document.getElementById('tutorial-modal');
    const sidePanel = document.querySelector('.side-panel');
    const gameOverModal = document.getElementById('game-over');
    return (
        (tutorialModal && !tutorialModal.classList.contains('hidden')) ||
        (sidePanel && sidePanel.classList.contains('active')) ||
        (gameOverModal && !gameOverModal.classList.contains('hidden'))
    );
}

// Function to close all modals except game over
function closeModalsExcept(exceptModal) {
    // Close tutorial modal if it's not the exception
    if (exceptModal !== 'tutorial') {
        const tutorialModal = document.getElementById('tutorial-modal');
        if (tutorialModal) {
            tutorialModal.classList.add('hidden');
        }
    }

    // Close categories panel if it's not the exception
    if (exceptModal !== 'categories') {
        const sidePanel = document.querySelector('.side-panel');
        const gameContainer = document.querySelector('.game-container');
        if (sidePanel && gameContainer) {
            sidePanel.classList.remove('active');
            gameContainer.classList.remove('side-panel-active');
        }
    }

    // Close login/profile modal if it's not the exception
    if (exceptModal !== 'login') {
        const loginModal = document.getElementById('login-modal');
        const profileModal = document.getElementById('profile-modal');
        if (loginModal) loginModal.classList.add('hidden');
        if (profileModal) profileModal.classList.add('hidden');
    }

    // Remove any existing overlays
    const overlays = document.querySelectorAll('.overlay');
    overlays.forEach(overlay => overlay.remove());
}

// Add this after other utility functions
function normalizeGuess(guess) {
    // Convert to lowercase and trim whitespace
    let normalized = guess.toLowerCase().trim();
    
    // Remove special characters and extra spaces
    normalized = normalized
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, " ")  // Replace punctuation with space
        .replace(/\s+/g, " ")                           // Replace multiple spaces with single space
        .trim();                                        // Trim again after replacements
    
    // Remove leading articles
    normalized = normalized
        .replace(/^the\s+/g, '')     // Remove 'the' from start
        .replace(/^a\s+/g, '')       // Remove 'a' from start
        .replace(/^an\s+/g, '')      // Remove 'an' from start
        .trim();

    // Common alternatives mapping
    const alternatives = {
        // Countries
        "us": "united states",
        "usa": "united states",
        "america": "united states",
        "united states of america": "united states",
        "uk": "united kingdom",
        "gb": "united kingdom",
        "uae": "united arab emirates",
        "holland": "netherlands",
        "burma": "myanmar",
        
        // Artists
        "weeknd": "weeknd",
        "the weeknd": "weeknd",
        "j cole": "j. cole",
        "dr dre": "dr. dre",
        "jayz": "jay-z",
        "jay z": "jay-z",
        
        // Apps
        "whatsapp": "whatsapp messenger",
        "messenger": "facebook messenger",
        "fb messenger": "facebook messenger",
        "ig": "instagram",
        "insta": "instagram",
        "snap": "snapchat",
        "tiktok": "tik tok"
    };
    
    // Return the alternative if it exists, otherwise return the normalized value
    return alternatives[normalized] || normalized;
}

function checkAnswer(guess, correctAnswer) {
    // Normalize both the guess and correct answer
    const normalizedGuess = normalizeGuess(guess);
    const normalizedAnswer = normalizeGuess(correctAnswer);
    
    // 1. Direct match after normalization
    if (normalizedGuess === normalizedAnswer) {
        return true;
    }
    
    // 2. Check for high similarity (for typos)
    const similarity = calculateStringSimilarity(normalizedGuess, normalizedAnswer);
    if (similarity > 0.9) { // Increased threshold for better accuracy
        return true;
    }
    
    // 3. Check for abbreviations
    if (isAbbreviation(normalizedGuess, normalizedAnswer)) {
        return true;
    }
    
    return false;
}

function isCommonVariation(guess, answer) {
    // Remove all spaces
    const noSpaceGuess = guess.replace(/\s+/g, '');
    const noSpaceAnswer = answer.replace(/\s+/g, '');
    if (noSpaceGuess === noSpaceAnswer) return true;
    
    // Check for common abbreviations
    if (isAbbreviation(guess, answer)) return true;
    
    // Check for possessive forms
    const noPossessiveGuess = guess.replace(/'s$/, '');
    const noPossessiveAnswer = answer.replace(/'s$/, '');
    if (noPossessiveGuess === noPossessiveAnswer) return true;
    
    return false;
}

function isAbbreviation(guess, answer) {
    // Handle cases like "USA" = "United States of America"
    const guessWords = guess.split(' ');
    const answerWords = answer.split(' ');
    
    // If guess is shorter and might be an abbreviation
    if (guessWords.length === 1 && answerWords.length > 1) {
        // Check if guess matches first letters of answer words
        const abbreviation = answerWords
            .map(word => word[0])
            .join('')
            .toLowerCase();
        
        if (guess === abbreviation) return true;
    }
    
    // Handle cases like "United States" = "USA"
    if (answerWords.length === 1 && guessWords.length > 1) {
        const abbreviation = guessWords
            .map(word => word[0])
            .join('')
            .toLowerCase();
        
        if (answer === abbreviation) return true;
    }
    
    return false;
}

// Add Levenshtein Distance calculation for similarity checking
function calculateStringSimilarity(str1, str2) {
    const track = Array(str2.length + 1).fill(null).map(() =>
        Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i += 1) {
        track[0][i] = i;
    }
    for (let j = 0; j <= str2.length; j += 1) {
        track[j][0] = j;
    }
    
    for (let j = 1; j <= str2.length; j += 1) {
        for (let i = 1; i <= str1.length; i += 1) {
            const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
            track[j][i] = Math.min(
                track[j][i - 1] + 1, // deletion
                track[j - 1][i] + 1, // insertion
                track[j - 1][i - 1] + indicator // substitution
            );
        }
    }
    
    const distance = track[str2.length][str1.length];
    const maxLength = Math.max(str1.length, str2.length);
    return (maxLength - distance) / maxLength;
}

// Update the existing guess handling to use the new check
function handleGuess(guess) {
    if (!guess) return;
    
    // Normalize the guess
    const normalizedGuess = normalizeGuess(guess);
    
    // Check if already guessed
    if (previousGuesses.some(g => normalizeGuess(g.name) === normalizedGuess)) {
        showDuplicatePopup();
        return;
    }
    
    // Find matching item in current category data
    const match = currentCategoryData.find(item => 
        checkAnswer(guess, item.name)
    );
    
    if (match) {
        handleCorrectGuess(match);
    } else {
        handleIncorrectGuess(guess);
    }
}

function showHundredthCelebration() {
    // Get the 100th ranked item if not already set
    if (!hundredthRankedItem && gameCategories[currentCategory]?.data) {
        hundredthRankedItem = gameCategories[currentCategory].data[99];
    }
    
    // Safety check
    if (!hundredthRankedItem) {
        console.error('No hundredthRankedItem found');
        return;
    }
    
    // Create celebration popup
    const celebrationPopup = document.createElement('div');
    celebrationPopup.className = 'celebration-popup';
    celebrationPopup.innerHTML = `
        <div class="celebration-content">
            <div class="celebration-icon">🎯</div>
            <h2>Amazing!</h2>
            <p>You found the 100th ranked item!</p>
            <div class="celebration-item">${hundredthRankedItem.name}</div>
            <div class="celebration-value">${formatValue(hundredthRankedItem.value, gameCategories[currentCategory].unit)}</div>
            <div class="celebration-confetti">🎉 🎊 ✨</div>
        </div>
    `;
    
    // Add to body
    document.body.appendChild(celebrationPopup);
    
    // Add animation class after a small delay to trigger transition
    setTimeout(() => {
        celebrationPopup.classList.add('show');
    }, 50);
    
    // Remove after animation completes
    setTimeout(() => {
        celebrationPopup.classList.remove('show');
        setTimeout(() => {
            celebrationPopup.remove();
            
            // Only show game over if this was the last chance
            if (chancesLeft === 0) {
                showGameOver();
            } else {
                // Re-enable input if we still have chances left
                guessInput.disabled = false;
                submitButton.disabled = false;
                // Focus the input field after re-enabling
                guessInput.focus();
            }
        }, 300); // Wait for fade out animation
    }, 2500);
}

function getHundredthRankHint(guess) {
    // Implementation of getHundredthRankHint function
    // This is a placeholder and should be replaced with the actual implementation
    return "This is a placeholder hint for the 100th ranked item.";
}

function showHintsPopup(hints) {
    // Implementation of showHintsPopup function
    // This is a placeholder and should be replaced with the actual implementation
    console.log("Showing hints:", hints);
}

function showDuplicatePopup() {
    // Implementation of showDuplicatePopup function
    // This is a placeholder and should be replaced with the actual implementation
    console.log("Showing duplicate popup");
}

function handleCorrectGuess(match) {
    // Implementation of handleCorrectGuess function
    // This is a placeholder and should be replaced with the actual implementation
    console.log("Correct guess:", match);
}

function handleIncorrectGuess(guess) {
    // Implementation of handleIncorrectGuess function
    // This is a placeholder and should be replaced with the actual implementation
    console.log("Incorrect guess:", guess);
}

// Add these functions at the top level

function createConfetti(x, y) {
    const colors = ['#ffd700', '#ff0000', '#00ff00', '#0000ff', '#ff00ff', '#00ffff'];
    const confettiCount = 100; // Number of particles per burst
    
    // Create multiple bursts of confetti over time
    for (let burst = 0; burst < 5; burst++) { // Increased from 3 to 5 bursts
        setTimeout(() => {
            for (let i = 0; i < confettiCount; i++) {
                const confetti = document.createElement('div');
                confetti.className = 'confetti-particle';
                
                // Calculate angle and distance for circular burst
                const angle = (i / confettiCount) * 360 * (Math.random() + 0.5); // Random angle spread
                const velocity = 15 + Math.random() * 15; // Random velocity between 15-30
                const rad = angle * Math.PI / 180;
                
                // Calculate end position using polar coordinates
                const xEnd = Math.cos(rad) * velocity * (Math.random() + 0.5) * 20;
                const yEnd = Math.sin(rad) * velocity * (Math.random() + 0.5) * 20;
                
                // Random properties
                const color = colors[Math.floor(Math.random() * colors.length)];
                const rotation = Math.random() * 720 - 360; // Spin between -360 and 360 degrees
                
                confetti.style.setProperty('--color', color);
                confetti.style.setProperty('--x-end', `${xEnd}px`);
                confetti.style.setProperty('--y-end', `${yEnd}px`);
                confetti.style.setProperty('--rotation', `${rotation}deg`);
                
                // Position the confetti at the trophy
                confetti.style.left = `${x}px`;
                confetti.style.top = `${y}px`;
                
                document.body.appendChild(confetti);
                
                // Remove the particle after animation
                setTimeout(() => {
                    confetti.remove();
                }, 2000); // Increased from 1000ms to 2000ms to match new animation duration
            }
        }, burst * 300); // Increased delay between bursts from 150ms to 300ms
    }
}

// Function to show celebration popup when target score is reached
function showTargetReachedPopup() {
    // First remove any existing target reached popup
    const existingPopup = document.querySelector('.target-reached-popup');
    if (existingPopup) {
        existingPopup.remove();
    }

    // Create popup element
    const popup = document.createElement('div');
    popup.className = 'target-reached-popup show';
    
    // Get current category name
    const categoryName = gameCategories[currentCategory]?.title || 'Current Category';
    
    // Check if this is the last chance
    const isLastChance = chancesLeft === 0;
    
    // Create popup content
    const content = `
        <div class="target-reached-content">
            <div class="target-reached-icon">🎉</div>
            <h2>Woohooooo!</h2>
            <p>You beat the target score!</p>
            <div class="target-reached-buttons">
                ${isLastChance ? 
                    `<button class="close-target-popup end-game-btn">End Game</button>` :
                    `<button class="close-target-popup continue-btn">Continue Playing</button>
                     <button class="close-target-popup end-game-btn">End Game Now</button>`
                }
            </div>
        </div>
    `;
    
    popup.innerHTML = content;
    
    // Add to body
    document.body.appendChild(popup);
    
    // Add button click handlers
    const buttons = popup.querySelectorAll('.close-target-popup');
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            popup.remove();
            if (button.classList.contains('end-game-btn')) {
                showGameOver();
            }
        });
    });

    return popup;
}

// Update the updateTrophyFill function to use the popup
function updateTrophyFill(score) {
    const trophy = document.querySelector('.target-trophy');
    if (!trophy) return;

    // Get the target score from the current category or use default
    const categoryData = gameCategories?.[currentCategory];
    const categoryTargetScore = categoryData?.targetScore || targetScore;
    
    // Calculate fill percentage (0-100)
    const fillPercentage = Math.min(Math.floor((score / categoryTargetScore) * 100), 100);
    
    // Round to nearest 10 for our CSS classes
    const roundedFill = Math.floor(fillPercentage / 10) * 10;
    
    // Update the fill level
    trophy.setAttribute('data-fill', roundedFill.toString());

    // Update or create target score display
    let targetScoreLabel = trophy.querySelector('.target-score-label');
    let targetScoreValue = trophy.querySelector('.target-score-value');
    
    if (!targetScoreLabel) {
        targetScoreLabel = document.createElement('div');
        targetScoreLabel.className = 'target-score-label';
        targetScoreLabel.textContent = 'TARGET';
        trophy.appendChild(targetScoreLabel);
    }
    
    if (!targetScoreValue) {
        targetScoreValue = document.createElement('div');
        targetScoreValue.className = 'target-score-value';
        trophy.appendChild(targetScoreValue);
    }
    
    targetScoreValue.textContent = categoryTargetScore;

    // Handle animations based on score percentage
    if (fillPercentage >= 100) {
        // Target reached celebration - only trigger if we haven't celebrated yet
        trophy.classList.remove('near-target');
        if (!hasReachedTarget) {
            hasReachedTarget = true; // Set the flag
            trophy.classList.add('target-reached');
            
            // Get trophy position for confetti
            const rect = trophy.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            
            // If this was the last chance, disable input immediately
            if (chancesLeft === 1) {
                const guessInput = document.getElementById('guess-input');
                const submitButton = document.getElementById('submit-guess');
                if (guessInput) guessInput.disabled = true;
                if (submitButton) submitButton.disabled = true;
            }

            // Sequence the animations:
            // 1. Wait for tile animation (1.5s)
            // 2. Start confetti and wait for it to finish (2s)
            // 3. Show congratulations popup
            setTimeout(() => {
                // Create confetti effect after tile animation
                createConfetti(x, y);
                
                // Wait for confetti animation to play out before showing popup
                setTimeout(() => {
                    showTargetReachedPopup();
                }, 2000); // Wait for confetti animation to complete
                
            }, 1500); // Wait for tile animation to complete
        }
    } else if (fillPercentage >= 80 && fillPercentage < 100) {
        // Near target pulsing
        trophy.classList.remove('target-reached');
        trophy.classList.add('near-target');
        hasReachedTarget = false; // Reset the flag if score drops below target
    } else {
        // Remove all special animations
        trophy.classList.remove('near-target', 'target-reached');
        hasReachedTarget = false; // Reset the flag if score drops below 80%
    }
} 
