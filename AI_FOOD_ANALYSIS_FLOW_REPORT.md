# AI Food Analysis — Start → Results Logic Report

**Date:** 2026-01-27  
**Purpose:** Map the complete user flow and identify result rendering source

---

## A. Current Flow Summary

### Step-by-Step User Journey

**Step 1: Page Load (Initial State)**
- **Visible:** `#intro-flow` (intro screens container)
- **Active Screen:** `[data-screen="1"]` (Welcome screen)
- **Hidden:** `#main-content` (style="display: none;")
- **JS Function:** `showScreen(1)` called on page load
- **Location:** `ai-food-analysis/js/ai-food-analysis.js:377`

**Step 2: Intro Flow Navigation**
- **Screen 1 → Screen 2:** Click "Get Started" button
  - Button: `.intro-button[data-action="next"]`
  - JS Function: `nextScreen()` → `showScreen(2)`
  - Location: `ai-food-analysis/js/ai-food-analysis.js:71-79, 97-98`
  
- **Screen 2 → Screen 3:** Click "Continue" button
  - Button: `.intro-button[data-action="next"]`
  - JS Function: `nextScreen()` → `showScreen(3)`
  - Location: `ai-food-analysis/js/ai-food-analysis.js:71-79, 97-98`

- **Screen 3 → Main Content:** Click "Get Started" button
  - Button: `.intro-button[data-action="start"]`
  - JS Function: `startAnalysis()`
  - Actions:
    - Hides: `#intro-flow` (style.display = 'none')
    - Shows: `#main-content` (style.display = 'block')
  - Location: `ai-food-analysis/js/ai-food-analysis.js:81-90, 100`

**Step 3: Choose Photo**
- **Trigger:** User clicks file input or "Choose Photo" label
- **Element:** `#food-image-input` (hidden file input)
- **JS Handler:** `imageInput.addEventListener('change', ...)`
- **Location:** `ai-food-analysis/js/ai-food-analysis.js:110-140`
- **Actions:**
  - Validates file type
  - Creates FileReader
  - Sets `#image-preview.src` to data URL
  - Shows `#image-preview-container` (display: block)
  - Shows `#image-ready-text` (display: block)
  - Enables `#analyze-button` (disabled = false)

**Step 4: Preview Photo**
- **Visible:** `#image-preview-container` (display: block)
- **Contains:** 
  - `#image-preview` (img element with data URL)
  - `#image-ready-text` ("Image ready for analysis")
  - `#remove-image` button
- **State:** `#analyze-button` is now enabled

**Step 5: Click "Analyze Food"**
- **Trigger:** User clicks `#analyze-button`
- **JS Handler:** `analyzeButton.addEventListener('click', ...)`
- **Location:** `ai-food-analysis/js/ai-food-analysis.js:327-348`
- **Actions:**
  - Validates image exists
  - Initializes `currentIngredients = ['Chicken', 'Rice', 'Vegetables']`
  - Calls `renderIngredientList()` (dynamically creates ingredient inputs)
  - Shows `#ingredient-step` (display: block)
  - Scrolls to ingredient step

**Step 6: Ingredient Confirmation Step**
- **Visible:** `#ingredient-step` (display: block)
- **Contains:**
  - `.ingredient-card` with title "Detected ingredients"
  - `#ingredient-list` (dynamically populated by `renderIngredientList()`)
  - `#add-ingredient-button` (adds new ingredient input)
  - `#calculate-results-button` (filters empty ingredients, calls `showResults()`)
  - `#skip-calculate-button` (uses original ingredients, calls `showResults()`)
- **JS Functions:**
  - `renderIngredientList()` - Creates editable ingredient inputs
  - `addIngredient()` - Adds new empty ingredient input
  - Location: `ai-food-analysis/js/ai-food-analysis.js:239-283`

**Step 7: Click "Calculate results" or "Skip and calculate"**
- **Trigger:** User clicks either button
- **JS Handlers:**
  - `#calculate-results-button` → Filters empty ingredients → `showResults()`
  - `#skip-calculate-button` → Uses original ingredients → `showResults()`
- **Location:** `ai-food-analysis/js/ai-food-analysis.js:357-373`

**Step 8: Results Display**
- **JS Function:** `showResults()`
- **Location:** `ai-food-analysis/js/ai-food-analysis.js:285-324`
- **Actions:**
  1. Hides `#ingredient-step` (display: none)
  2. Populates nutrition values:
     - `#calories-value.textContent = "620 kcal"`
     - `#protein-value.textContent = "42 g"`
     - `#carbs-value.textContent = "55 g"`
     - `#fat-value.textContent = "18 g"`
  3. Shows `#results-container` (display: block)
  4. Shows `#share-save-buttons` (display: flex)
  5. Shows `#reset-section` (display: block)
  6. Scrolls to results container

---

## B. DOM Visibility Table

| Element Selector | Default State | When Shown | When Hidden | JS Function |
|----------------|---------------|------------|-------------|-------------|
| `#intro-flow` | `display: block` (CSS) | Page load | `startAnalysis()` sets `display: 'none'` | `startAnalysis()` |
| `[data-screen="1"]` | `class="active"` | Page load | `nextScreen()` removes `active` | `showScreen()` |
| `[data-screen="2"]` | No `active` class | `nextScreen()` adds `active` | `nextScreen()` removes `active` | `showScreen()` |
| `[data-screen="3"]` | No `active` class | `nextScreen()` adds `active` | `startAnalysis()` hides parent | `showScreen()` |
| `#main-content` | `style="display: none;"` | `startAnalysis()` sets `display: 'block'` | Initial state | `startAnalysis()` |
| `#image-preview-container` | `style="display: none;"` | File selected, `display: 'block'` | `resetToInitialState()` | FileReader onload |
| `#analyze-button` | `disabled` attribute | File selected, `disabled = false` | `resetToInitialState()` sets `disabled = true` | FileReader onload |
| `#ingredient-step` | `style="display: none;"` | `#analyze-button` clicked | `showResults()` sets `display: 'none'` | Analyze button handler |
| `#results-container` | `style="display: none;"` | `showResults()` sets `display: 'block'` | `resetToInitialState()` | `showResults()` |
| `#share-save-buttons` | `style="display: none;"` | `showResults()` sets `display: 'flex'` | `resetToInitialState()` | `showResults()` |
| `#reset-section` | `style="display: none;"` | `showResults()` sets `display: 'block'` | `resetToInitialState()` | `showResults()` |

---

## C. Result Rendering Source

### Where the Results Card Comes From

**Answer: The results card HTML is HARDCODED in `index.html`**

**Location:** `ai-food-analysis/index.html:192-216`

```html
<div id="results-container" class="results-container" style="display: none;">
    <div class="results-card">
        <h2 class="results-card-title">AI Food Analysis</h2>
        <div class="results-grid">
            <div class="result-item">
                <div class="result-label">Calories</div>
                <div class="result-value" id="calories-value">-</div>
            </div>
            <!-- ... Protein, Carbs, Fat ... -->
        </div>
        <p class="results-disclaimer">Estimates only. Consistency beats perfection.</p>
        <p class="results-mascot">Powered by Bear Strength 🐻</p>
        <p class="results-brand">MUSKLE ORIGINALS</p>
    </div>
    <!-- ... share buttons, reset button ... -->
</div>
```

### What JS Code Writes Values into DOM

**Location:** `ai-food-analysis/js/ai-food-analysis.js:285-303`

```javascript
function showResults() {
    // ... hides ingredient step ...
    
    // Populates nutrition values:
    if (caloriesValue) {
        caloriesValue.textContent = mockResults.calories + ' kcal';
    }
    if (proteinValue) {
        proteinValue.textContent = mockResults.protein + ' g';
    }
    if (carbsValue) {
        carbsValue.textContent = mockResults.carbs + ' g';
    }
    if (fatValue) {
        fatValue.textContent = mockResults.fat + ' g';
    }
    
    // Shows results container
    if (resultsContainer) {
        resultsContainer.style.display = 'block';
        // ... shows buttons ...
    }
}
```

**DOM Element IDs Used:**
- `#calories-value` (line 198 in HTML, line 40 in JS)
- `#protein-value` (line 202 in HTML, line 41 in JS)
- `#carbs-value` (line 206 in HTML, line 42 in JS)
- `#fat-value` (line 210 in HTML, line 43 in JS)

**Data Source:**
- `mockResults` object (lines 46-51 in JS)
- Values: `{ calories: 620, protein: 42, carbs: 55, fat: 18 }`

### Visibility Control

**Element that controls results card visibility:**
- `#results-container` (id)
- `.results-container` (class)
- Default: `style="display: none;"` (inline style in HTML)
- Shown by: `resultsContainer.style.display = 'block'` (JS line 307)

---

## D. Static Image Result Analysis

### Check for `.analysis-image-result`

**Finding: `.analysis-image-result` is NOT present in current HTML**

**Search Results:**
- No matches found in `ai-food-analysis/index.html`
- No matches found in `ai-food-analysis/js/ai-food-analysis.js`
- CSS file was not searched, but based on previous context, any CSS for this class would be unused

### Current State

1. **HTML:** Only contains `.results-card` (hardcoded nutrition card)
2. **JS:** Only populates `.results-card` values
3. **No conflict:** There is no `.analysis-image-result` element to conflict with
4. **No duplicate containers:** Only one results container exists (`#results-container`)

### Image Path Verification

**Note:** The static image approach would require:
- Path: `images/Take a photo of your meal (1).png`
- Relative to: `ai-food-analysis/index.html`
- Correct path: `images/Take a photo of your meal (1).png` ✅

---

## E. Fix Recommendation

### Current Architecture

**Results are rendered via:**
1. **HTML:** Hardcoded `.results-card` structure (lines 193-216)
2. **JS:** Populates values via `showResults()` (lines 292-303)
3. **Visibility:** Controlled by `#results-container.style.display`

### Recommended Approach: Replace Results Card with Static Image

**Option 1: Clean HTML Replacement (Recommended)**

**Step 1: Replace HTML Block**
- **File:** `ai-food-analysis/index.html`
- **Lines:** 193-216
- **Replace with:**
```html
<div class="analysis-image-result">
    <img src="images/Take a photo of your meal (1).png" alt="AI food analysis result" />
</div>
```

**Step 2: Remove JS Value Population**
- **File:** `ai-food-analysis/js/ai-food-analysis.js`
- **Lines to remove:** 39-51 (result value elements and mockResults)
- **Lines to modify:** 285-303 (remove value population, keep visibility logic)

**Step 3: Update showResults() Function**
- **File:** `ai-food-analysis/js/ai-food-analysis.js`
- **Function:** `showResults()` (line 285)
- **Change:** Remove lines 292-303 (value population)
- **Keep:** Lines 286-289 (hide ingredient step)
- **Keep:** Lines 305-323 (show results container and buttons)

**Step 4: Update Save Image Button**
- **File:** `ai-food-analysis/js/ai-food-analysis.js`
- **Line:** 193
- **Change:** Replace `resultsCard` with `document.querySelector('.analysis-image-result')`

**Step 5: Add CSS**
- **File:** `ai-food-analysis/css/ai-food-analysis.css`
- **Add after line 412:**
```css
.analysis-image-result {
    display: flex;
    justify-content: center;
    margin: 40px auto;
}

.analysis-image-result img {
    max-width: 100%;
    width: 320px;
    height: auto;
    border-radius: 12px;
}
```

**Step 6: Remove Unused CSS**
- **File:** `ai-food-analysis/css/ai-food-analysis.css`
- **Remove:** Lines 414-481 (all `.results-card` related styles)

### Exact Lines to Change

**HTML Changes:**
- **File:** `ai-food-analysis/index.html`
- **Delete:** Lines 193-216 (entire `.results-card` div)
- **Insert:** Static image div (see Step 1 above)

**JavaScript Changes:**
- **File:** `ai-food-analysis/js/ai-food-analysis.js`
- **Delete:** Lines 39-51 (DOM element references and mockResults)
- **Delete:** Lines 292-303 (value population in showResults)
- **Modify:** Line 31 (change `resultsCard` to `analysisImageResult`)
- **Modify:** Line 193 (update save button handler)

**CSS Changes:**
- **File:** `ai-food-analysis/css/ai-food-analysis.css`
- **Delete:** Lines 414-481 (results-card styles)
- **Add:** Image result styles (see Step 5 above)

---

## Summary

**Current Flow:** Intro screens → Main content → Upload → Preview → Analyze → Ingredient step → Results card (hardcoded HTML + JS populated values)

**Results Source:** Hardcoded HTML structure with JS-populated nutrition values

**Static Image Status:** Not currently implemented, no conflicts present

**Recommended Fix:** Replace `.results-card` HTML block with static image div, remove JS value population, update CSS accordingly.

---

**Report Generated:** 2026-01-27

