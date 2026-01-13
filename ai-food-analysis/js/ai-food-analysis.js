// AI Food Analysis - Intro Flow and Image Analysis
// Intro flow controller and basic functionality without AI backend

(function() {
    'use strict';

    // Intro Flow State
    let currentScreen = 1;
    const totalScreens = 2;

    // DOM Elements - Intro Flow
    const introFlow = document.getElementById('intro-flow');
    const mainContent = document.getElementById('main-content');
    const introButtons = document.querySelectorAll('.intro-button');

    // DOM Elements - Food Analysis
    const imageInput = document.getElementById('food-image-input');
    const imagePreview = document.getElementById('image-preview');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const removeImageButton = document.getElementById('remove-image');
    const analyzeButton = document.getElementById('analyze-button');
    const ingredientStep = document.getElementById('ingredient-step');
    const ingredientList = document.getElementById('ingredient-list');
    const addIngredientButton = document.getElementById('add-ingredient-button');
    const calculateResultsButton = document.getElementById('calculate-results-button');
    const skipCalculateButton = document.getElementById('skip-calculate-button');
    const resultsContainer = document.getElementById('results-container');
    const shareSaveButtons = document.getElementById('share-save-buttons');
    const shareButton = document.getElementById('share-button');
    const saveImageButton = document.getElementById('save-image-button');
    const resultsCard = document.querySelector('.results-card');
    const resetSection = document.getElementById('reset-section');
    const resetButton = document.getElementById('reset-button');

    // AI analysis results storage
    let currentIngredients = [];
    let aiMacros = null; // Store macros from AI response

    // Result value elements
    const caloriesValue = document.getElementById('calories-value');
    const proteinValue = document.getElementById('protein-value');
    const carbsValue = document.getElementById('carbs-value');
    const fatValue = document.getElementById('fat-value');

    // Helper text element
    const imageReadyText = document.getElementById('image-ready-text');

    // Intro Flow Functions
    function showScreen(screenNumber) {
        // Hide all screens
        const allScreens = document.querySelectorAll('.intro-screen');
        allScreens.forEach(screen => {
            screen.classList.remove('active');
        });

        // Show target screen
        const targetScreen = document.querySelector(`[data-screen="${screenNumber}"]`);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }
    }

    function nextScreen() {
        if (currentScreen === 1) {
            currentScreen++;
            showScreen(2);
        } else if (currentScreen === 2) {
            // Go directly to upload screen
            startAnalysis();
        }
    }

    function startAnalysis() {
        // Hide intro flow
        if (introFlow) {
            introFlow.style.display = 'none';
        }
        // Show main content
        if (mainContent) {
            mainContent.style.display = 'block';
        }
        // Reset state - hide ingredient step and results
        if (ingredientStep) {
            ingredientStep.style.display = 'none';
        }
        if (resultsContainer) {
            resultsContainer.style.display = 'none';
        }
        // Disable analyze button initially
        if (analyzeButton) {
            analyzeButton.disabled = true;
        }
    }

    // Intro Flow Event Listeners
    introButtons.forEach(button => {
        button.addEventListener('click', function() {
            const action = this.getAttribute('data-action');
            
            if (action === 'next') {
                nextScreen();
            } else if (action === 'start') {
                startAnalysis();
            }
        });
    });

    // Food Analysis Functions
    function initFoodAnalysis() {
        if (!imageInput) return;

        // Handle image selection
        imageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            
            if (file) {
                // Validate file type
                if (!file.type.startsWith('image/')) {
                    alert('Please select an image file.');
                    return;
                }

                // Create preview
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    if (imagePreview) {
                        imagePreview.src = e.target.result;
                    }
                    if (imagePreviewContainer) {
                        imagePreviewContainer.style.display = 'block';
                    }
                    if (imageReadyText) {
                        imageReadyText.style.display = 'block';
                    }
                    if (analyzeButton) {
                        analyzeButton.disabled = false;
                    }
                };

                reader.readAsDataURL(file);
            }
        });

        // Reset function (reusable)
        function resetToInitialState() {
            if (imageInput) imageInput.value = '';
            if (imagePreview) imagePreview.src = '';
            if (imagePreviewContainer) imagePreviewContainer.style.display = 'none';
            if (imageReadyText) imageReadyText.style.display = 'none';
            if (analyzeButton) {
                analyzeButton.disabled = true;
                analyzeButton.textContent = 'Analyze Food';
            }
            if (ingredientStep) ingredientStep.style.display = 'none';
            if (resultsContainer) resultsContainer.style.display = 'none';
            if (shareSaveButtons) shareSaveButtons.style.display = 'none';
            if (resetSection) resetSection.style.display = 'none';
            currentIngredients = [];
            aiMacros = null;
            
            // Remove any error messages
            const errorMessage = document.getElementById('analysis-error');
            if (errorMessage) {
                errorMessage.remove();
            }
            
            // Scroll back to top of upload section
            if (imageInput) {
                imageInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

        // Handle remove image
        if (removeImageButton) {
            removeImageButton.addEventListener('click', resetToInitialState);
        }

        // Handle reset button
        if (resetButton) {
            resetButton.addEventListener('click', resetToInitialState);
        }

        // Handle share button (Web Share API)
        if (shareButton) {
            // Hide share button if Web Share API not available
            if (!navigator.share) {
                shareButton.style.display = 'none';
            } else {
                shareButton.addEventListener('click', function() {
                    const shareData = {
                        title: 'AI Food Analysis',
                        text: 'I analyzed my meal with Muskle Originals.\nConsistency beats perfection.',
                        url: window.location.href
                    };

                    navigator.share(shareData).catch(function(err) {
                        // User cancelled or error occurred - silently fail
                        console.log('Share cancelled or failed:', err);
                    });
                });
            }
        }

        // Handle save image button
        if (saveImageButton && resultsCard) {
            saveImageButton.addEventListener('click', function() {
                // Check if html2canvas is available
                if (typeof html2canvas === 'undefined') {
                    alert('Image saving is not available. Please use screenshot instead.');
                    return;
                }

                // Show loading state
                const originalText = saveImageButton.textContent;
                saveImageButton.textContent = 'Saving...';
                saveImageButton.disabled = true;

                // Convert card to image
                html2canvas(resultsCard, {
                    backgroundColor: '#ffffff',
                    scale: 2,
                    logging: false,
                    useCORS: true
                }).then(function(canvas) {
                    // Convert canvas to blob
                    canvas.toBlob(function(blob) {
                        // Create download link
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = 'ai-food-analysis-result.png';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);

                        // Reset button
                        saveImageButton.textContent = originalText;
                        saveImageButton.disabled = false;
                    }, 'image/png');
                }).catch(function(err) {
                    console.error('Error saving image:', err);
                    alert('Unable to save image. Please use screenshot instead.');
                    saveImageButton.textContent = originalText;
                    saveImageButton.disabled = false;
                });
            });
        }

        // Ingredient Management Functions
        function renderIngredientList() {
            if (!ingredientList) return;
            
            ingredientList.innerHTML = '';
            
            currentIngredients.forEach(function(ingredient, index) {
                const li = document.createElement('li');
                li.className = 'ingredient-item';
                
                const input = document.createElement('input');
                input.type = 'text';
                input.value = ingredient;
                input.placeholder = 'Ingredient name';
                input.addEventListener('input', function() {
                    currentIngredients[index] = this.value.trim();
                });
                
                const removeBtn = document.createElement('button');
                removeBtn.className = 'ingredient-remove';
                removeBtn.textContent = '×';
                removeBtn.setAttribute('aria-label', 'Remove ingredient');
                removeBtn.addEventListener('click', function() {
                    currentIngredients.splice(index, 1);
                    renderIngredientList();
                });
                
                li.appendChild(input);
                li.appendChild(removeBtn);
                ingredientList.appendChild(li);
            });
        }

        function addIngredient() {
            if (!currentIngredients) {
                currentIngredients = [];
            }
            currentIngredients.push('');
            renderIngredientList();
            
            // Focus on the new input
            const newInput = ingredientList.lastElementChild.querySelector('input');
            if (newInput) {
                newInput.focus();
            }
        }

        function showResults() {
            // Hide ingredient step
            if (ingredientStep) {
                ingredientStep.style.display = 'none';
            }
            
            // Show results with AI data (or fallback if macros not available)
            if (aiMacros) {
                if (caloriesValue) {
                    caloriesValue.textContent = aiMacros.calories + ' kcal';
                }
                if (proteinValue) {
                    proteinValue.textContent = aiMacros.protein + ' g';
                }
                if (carbsValue) {
                    carbsValue.textContent = aiMacros.carbs + ' g';
                }
                if (fatValue) {
                    fatValue.textContent = aiMacros.fat + ' g';
                }
            } else {
                // Fallback (should not happen in normal flow)
                if (caloriesValue) caloriesValue.textContent = '-';
                if (proteinValue) proteinValue.textContent = '-';
                if (carbsValue) carbsValue.textContent = '-';
                if (fatValue) fatValue.textContent = '-';
            }

            // Show results container
            if (resultsContainer) {
                resultsContainer.style.display = 'block';
                
                // Show share/save buttons
                if (shareSaveButtons) {
                    shareSaveButtons.style.display = 'flex';
                }
                
                // Show reset button
                if (resetSection) {
                    resetSection.style.display = 'block';
                }
                
                // Scroll to results card (center it on screen)
                setTimeout(function() {
                    resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
            }
        }

        // Handle analyze button
        if (analyzeButton) {
            analyzeButton.addEventListener('click', async function() {
                if (!imagePreview || !imagePreview.src) {
                    return;
                }

                // Get the image file
                const file = imageInput.files[0];
                if (!file) {
                    return;
                }

                // Show loading state
                const originalButtonText = analyzeButton.textContent;
                analyzeButton.disabled = true;
                analyzeButton.textContent = 'Analyzing your meal…';

                // Hide any previous error messages
                const errorMessage = document.getElementById('analysis-error');
                if (errorMessage) {
                    errorMessage.remove();
                }

                try {
                    // Convert image to base64
                    const imageBase64 = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            resolve(e.target.result);
                        };
                        reader.onerror = reject;
                        reader.readAsDataURL(file);
                    });

                    // Call API
                    const response = await fetch('/api/analyze', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            image: imageBase64
                        })
                    });

                    const data = await response.json();

                    // Handle errors
                    if (!response.ok) {
                        throw new Error(data.error || 'Unable to analyze image. Please try again.');
                    }

                    // Check for rate limit
                    if (response.status === 429) {
                        throw new Error(data.error || "Sorry — you've reached today's limit (3). Come back tomorrow.");
                    }

                    // Success - set ingredients and macros from AI response
                    if (data.ingredients && Array.isArray(data.ingredients)) {
                        currentIngredients = [...data.ingredients];
                    } else {
                        throw new Error('Invalid response from server.');
                    }

                    if (data.macros) {
                        aiMacros = data.macros;
                    } else {
                        throw new Error('Nutrition data not available.');
                    }

                    // Render ingredient list
                    renderIngredientList();
                    
                    // Show ingredient step
                    if (ingredientStep) {
                        ingredientStep.style.display = 'block';
                        
                        // Scroll to ingredient step
                        setTimeout(function() {
                            ingredientStep.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }, 100);
                    }

                } catch (error) {
                    // Show error message
                    const errorDiv = document.createElement('div');
                    errorDiv.id = 'analysis-error';
                    errorDiv.style.cssText = 'text-align: center; color: #ff6b6b; margin-top: 1rem; padding: 1rem; background-color: rgba(255, 107, 107, 0.1); border-radius: 4px;';
                    errorDiv.textContent = error.message || 'Unable to analyze image. Please try again.';
                    
                    // Insert error message after analyze button
                    if (analyzeButton.parentElement) {
                        analyzeButton.parentElement.appendChild(errorDiv);
                    }

                    // Scroll to error
                    setTimeout(function() {
                        errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 100);
                } finally {
                    // Reset button state
                    analyzeButton.disabled = false;
                    analyzeButton.textContent = originalButtonText;
                }
            });
        }

        // Handle add ingredient button
        if (addIngredientButton) {
            addIngredientButton.addEventListener('click', addIngredient);
        }

        // Handle calculate results button
        if (calculateResultsButton) {
            calculateResultsButton.addEventListener('click', function() {
                // Filter out empty ingredients
                currentIngredients = currentIngredients.filter(function(ing) {
                    return ing.trim() !== '';
                });
                showResults();
            });
        }

        // Handle skip and calculate button
        if (skipCalculateButton) {
            skipCalculateButton.addEventListener('click', function() {
                // Use original detected ingredients (no filtering)
                showResults();
            });
        }
    }

    // Initialize intro flow
    showScreen(1);

    // Initialize food analysis (will be available after intro)
    initFoodAnalysis();

})();

