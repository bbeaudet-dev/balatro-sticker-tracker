# Balatro Sticker Tracker - Refactoring Plan

## Current State

- `main.js` is ~1700 lines and handles multiple concerns
- Single file architecture is becoming unmaintainable
- Mixed responsibilities (joker tracking, naneinf, navigation, API calls)

## Refactoring Strategy: Modular Vanilla JS

### Phase 1: Foundation (Current)

✅ **Completed:**

- Created modular directory structure
- Extracted shared constants and utilities
- Created navigation module
- Created naneinf tracker module
- Created modular HTML template

### Phase 2: Extract Completionist Modules

**Next Steps:**

- Extract joker data management to `js/completionist/joker-data.js`
- Extract board management to `js/completionist/board-management.js`
- Extract game tracking to `js/completionist/game-tracking.js`
- Extract UI rendering to `js/completionist/ui-renderer.js`

### Phase 3: Extract Core Modules

- Extract API calls to `js/core/api.js`
- Extract authentication to `js/core/auth.js`
- Create main app initialization in `js/core/app.js`

### Phase 4: Cleanup

- Remove functions from `main.js` as they're extracted
- Update HTML to use modular version
- Add proper error handling
- Add JSDoc documentation

## File Structure

```
/js/
├── core/
│   ├── app.js              # Main application initialization
│   ├── navigation.js       # Tab switching (✅ Done)
│   ├── api.js             # Server communication
│   └── auth.js            # Authentication logic
├── completionist/
│   ├── joker-data.js      # Joker data management
│   ├── board-management.js # Board selection/creation
│   ├── game-tracking.js   # Recent games functionality
│   └── ui-renderer.js     # UI rendering functions
├── naneinf/
│   ├── naneinf-tracker.js # naneinf progress tracking (✅ Done)
│   └── naneinf-games.js   # naneinf game management
└── shared/
    ├── constants.js       # Shared constants (✅ Done)
    └── utils.js          # Utility functions (✅ Done)
```

## Benefits of This Approach

### ✅ **Advantages:**

- **Minimal Disruption**: Keep existing functionality working
- **Gradual Migration**: Can extract modules one at a time
- **No Build Process**: Still works with simple HTTP server
- **Easy Testing**: Each module can be tested independently
- **Better Organization**: Clear separation of concerns
- **Maintainable**: Much easier to find and modify specific functionality

### ❌ **Trade-offs:**

- Still vanilla JS (no modern framework benefits)
- Manual module management
- No automatic bundling/optimization

## Alternative: React Migration

### Would Require:

- **Complete Rewrite**: ~80% of existing code
- **Build Process**: Webpack/Vite setup
- **State Management**: Redux/Zustand for complex state
- **Component Architecture**: Breaking down into React components
- **Deployment Changes**: Build step in CI/CD

### Timeline Estimate:

- **Modular Vanilla JS**: 2-3 days
- **React Migration**: 2-3 weeks

## Recommendation

**Go with Modular Vanilla JS** for these reasons:

1. **Faster Implementation**: Get benefits quickly
2. **Lower Risk**: Existing functionality stays intact
3. **Team Familiarity**: No new framework to learn
4. **Future Flexibility**: Can still migrate to React later if needed

## Next Steps

1. **Test Current Modular Setup**: Verify `index-modular.html` works
2. **Extract Completionist Modules**: Break down the remaining `main.js` functions
3. **Update HTML**: Switch to modular version
4. **Add Documentation**: JSDoc comments for all functions
5. **Consider React Later**: If the app grows significantly more complex

## Testing the Modular Version

To test the current modular setup:

```bash
# Serve the modular version
python3 -m http.server 8000
# Visit: http://localhost:8000/index-modular.html
```

The modular version should work with the naneinf functionality while keeping the existing completionist functionality intact.
