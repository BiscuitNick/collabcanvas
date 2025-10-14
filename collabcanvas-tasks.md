# CollabCanvas MVP - Task List by Pull Request

**Project Timeline:** 24 hours  
**Total PRs:** 8 pull requests

---

## Project File Structure

```
collabcanvas/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   ├── canvas/
│   │   │   ├── Canvas.tsx
│   │   │   ├── Rectangle.tsx
│   │   │   └── CanvasControls.tsx
│   │   ├── multiplayer/
│   │   │   ├── Cursor.tsx
│   │   │   ├── CursorLayer.tsx
│   │   │   └── PresenceList.tsx
│   │   └── layout/
│   │       ├── Header.tsx
│   │       └── Layout.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useShapes.ts
│   │   ├── useCursors.ts
│   │   └── usePresence.ts
│   ├── store/
│   │   └── canvasStore.ts
│   ├── types/
│   │   └── index.ts
│   ├── lib/
│   │   ├── firebase.ts
│   │   └── utils.ts
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   └── CanvasPage.tsx
│   ├── __tests__/
│   │   ├── utils.test.ts
│   │   ├── canvasStore.test.ts
│   │   ├── Rectangle.test.tsx
│   │   └── integration/
│   │       ├── auth.test.tsx
│   │       └── rectangleSync.test.tsx
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env.local
├── .gitignore
├── firebase.json
├── .firebaserc
├── firestore.rules
├── database.rules.json
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

---

## PR #1: Project Setup & Deployment Pipeline

**Goal:** Initialize project, install dependencies, deploy "Hello World"

**Branch:** `feature/project-setup`

### High-Level Tasks:
- [x] Initialize Vite + React + TypeScript project
- [x] Install and configure all dependencies
- [x] Set up Tailwind CSS
- [x] Deploy to Vercel (already working)
- [x] Create Firebase project
- [x] Configure Firebase services (Auth + Firestore + Realtime DB)

### Subtasks:

#### 1.1 Initialize Vite Project
- [x] Run `npm create vite@latest collabcanvas -- --template react-ts`
- [x] Navigate to project directory
- [x] Run `npm install`
- [x] Test dev server with `npm run dev`

**Files Created:**
- `package.json`
- `vite.config.ts`
- `tsconfig.json`
- `index.html`
- `src/main.tsx`
- `src/App.tsx`
- `src/App.css`
- `src/index.css`

#### 1.2 Install Core Dependencies
- [x] Run `npm install firebase`
- [x] Run `npm install konva react-konva`
- [x] Run `npm install react-router-dom`
- [x] Run `npm install zustand`

**Files Modified:**
- `package.json`

#### 1.3 Install Dev Dependencies & Testing Tools
- [x] Run `npm install -D tailwindcss postcss autoprefixer`
- [x] Run `npm install -D @types/node`
- [x] Run `npm install -D vitest @vitest/ui`
- [x] Run `npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event`
- [x] Run `npm install -D jsdom`

**Files Modified:**
- `package.json`

#### 1.4 Configure Tailwind CSS
- [x] Run `npx tailwindcss init -p`
- [x] Configure `tailwind.config.js` content paths
- [x] Add Tailwind directives to `src/index.css`
- [x] Test Tailwind by adding utility classes to App.tsx

**Files Created:**
- `tailwind.config.js`
- `postcss.config.js`

**Files Modified:**
- `src/index.css`
- `src/App.tsx`

#### 1.5 Create Firebase Project
- [x] Go to Firebase Console (https://console.firebase.google.com)
- [x] Click "Add project"
- [x] Name project "collabcanvas" (or similar)
- [x] Disable Google Analytics (optional for MVP)
- [x] Create project

**External:** Firebase Console

#### 1.6 Set Up Firebase Services
- [x] In Firebase Console, add web app
- [x] Copy Firebase config object
- [x] Enable Authentication (Email/Password)
- [x] Enable Firestore Database (Start in test mode)
- [x] Enable Realtime Database (Start in test mode)

**External:** Firebase Console

#### 1.7 Configure Firebase in Project (Optional - for rules management)
- [x] Install Firebase CLI: `npm install -g firebase-tools` (optional)
- [x] Run `firebase login` (optional)
- [x] Run `firebase init` (select Firestore, Realtime Database only) (optional)
- [x] Select existing project (optional)

**Files Created (Optional):**
- `.firebaserc`
- `firebase.json`
- `firestore.rules`
- `firestore.indexes.json`
- `database.rules.json`

#### 1.8 Create Firebase Config File
- [x] Create `src/lib/firebase.ts`
- [x] Add Firebase config from console
- [x] Initialize Firebase app
- [x] Export auth, firestore, and realtimeDb instances

**Files Created:**
- `src/lib/firebase.ts`

#### 1.9 Create Environment Variables
- [x] Create `.env.local` file
- [x] Add Firebase config as environment variables
- [x] Update `.gitignore` to exclude `.env.local`

**Files Created:**
- `.env.local`

**Files Modified:**
- `.gitignore`

#### 1.10 Create Simple "Hello World" App
- [x] Clean up default Vite content in `App.tsx`
- [x] Create simple "CollabCanvas - Coming Soon" message
- [x] Add basic Tailwind styling

**Files Modified:**
- `src/App.tsx`
- `src/App.css` (can delete most/all)

#### 1.11 Vercel Deployment (Already Complete)
- [x] Deploy to Vercel
- [x] Verify deployed URL works
- [x] "Hello World" app is live

**External:** Vercel (Complete)

#### 1.12 Update README
- [x] Update `README.md` with CollabCanvas project info
- [x] Add project title and description
- [x] Add setup instructions
- [x] Add Vercel deployed URL

**Files Created:**
- `README.md`

#### 1.13 Configure Vitest
- [x] Create `vitest.config.ts`
- [x] Configure jsdom environment
- [x] Set up test globals
- [x] Add test scripts to package.json (`test`, `test:ui`)
- [x] Create basic test example to verify setup

**Files Created:**
- `vitest.config.ts`
- `src/__tests__/setup.ts` (test setup with Firebase mocks)
- `src/__tests__/example.test.ts` (example tests to verify Vitest works)

**Files Modified:**
- `package.json`

### Files Summary for PR #1:
**Created:**
- All initial Vite files
- `src/lib/firebase.ts`
- `.env.local`
- `tailwind.config.ts`
- `vitest.config.ts`
- `src/__tests__/setup.test.ts`

**Modified:**
- `package.json`
- `.gitignore`
- `src/index.css`
- `src/App.tsx`
- `README.md`

**Optional (if using Firebase CLI):**
- `.firebaserc`
- `firebase.json`
- `firestore.rules`
- `database.rules.json`

---

## PR #2: Authentication System

**Goal:** Working Google authentication functionality

**Branch:** `feature/authentication`

### High-Level Tasks:
- [x] Create type definitions
- [x] Set up authentication hook
- [x] Create Google sign-in component
- [x] Create login page
- [x] Create canvas page placeholder
- [x] Set up routing
- [x] Test authentication flow

### Subtasks:

#### 2.1 Firebase Console Setup
- [x] Enable Authentication in Firebase Console
- [x] Configure Google provider
- [x] Set up user display name requirements
- [x] Verify `.env` file exists with Firebase config
- [x] Test Firebase connection

**External:** Firebase Console

#### 2.2 Create Type Definitions
- [x] Create `src/types/index.ts`
- [x] Define `User` type
- [x] Define `AuthHookReturn` type for useAuth hook
- [x] Export all types

**Files Created:**
- `src/types/index.ts`

#### 2.3 Create Auth Hook
- [x] Create `src/hooks/useAuth.ts`
- [x] Implement `useAuth` hook with Firebase Auth
- [x] Add `onAuthStateChanged` listener
- [x] Implement `loginWithGoogle` function
- [x] Implement `logout` function
- [x] Handle loading state
- [x] Handle error state (network, validation, Firebase errors)

**Files Created:**
- `src/hooks/useAuth.ts`

#### 2.4 Create Google Sign-In Component
- [x] Create `src/components/auth/GoogleSignIn.tsx`
- [x] Add Google sign-in button
- [x] Handle Google authentication
- [x] Display error messages
- [x] Add loading state (disable button, update styling)
- [x] Style with Tailwind

**Files Created:**
- `src/components/auth/GoogleSignIn.tsx`

#### 2.5 Create Login Page
- [x] Create `src/pages/LoginPage.tsx`
- [x] Import and render GoogleSignIn component
- [x] Add page title
- [x] Add layout wrapper
- [x] Style with Tailwind

**Files Created:**
- `src/pages/LoginPage.tsx`

#### 2.6 Create Canvas Page Placeholder
- [x] Create `src/pages/CanvasPage.tsx`
- [x] Add simple "Canvas Coming Soon" message
- [x] Add logout button
- [x] Style with Tailwind

**Files Created:**
- `src/pages/CanvasPage.tsx`

#### 2.7 Set Up Routing
- [x] Update `src/App.tsx` to use BrowserRouter
- [x] Create route for `/login`
- [x] Create route for `/canvas`
- [x] Add redirect logic (authenticated users to canvas, unauthenticated to login)
- [x] Add loading state while checking auth

**Files Modified:**
- `src/App.tsx`

#### 2.8 Create Firebase Security Rules
- [x] Create `firestore.rules` file
- [x] Add rules to require authentication for all operations
- [x] Create `database.rules.json` file
- [x] Add rules to require authentication for all operations
- [x] Deploy rules: `firebase deploy --only firestore:rules,database`

**Files Created:**
- `firestore.rules`
- `database.rules.json`

#### 2.9 Test Authentication
- [x] Test Google sign-in with new user
- [x] Test Google sign-in with existing user
- [x] Test logout
- [x] Test redirect behavior
- [x] Test staying logged in after refresh
- [x] Test with multiple accounts

**External:** Browser testing

#### 2.10 Write Integration Tests for Authentication
- [x] Create `src/__tests__/integration/auth.test.tsx`
- [x] Mock Firebase Auth functions
- [x] Test: User can sign in with Google successfully
- [x] Test: User can sign out successfully
- [x] Test: Error handling for authentication errors
- [x] Test: Auth state persists correctly
- [x] Run tests: `npm run test`

**Files Created:**
- `src/__tests__/integration/auth.test.tsx`

**Test Coverage:**
```typescript
// Example test structure:
describe('Authentication Flow', () => {
  it('should sign in with Google successfully', () => {...})
  it('should sign out successfully', () => {...})
  it('should handle authentication errors', () => {...})
  it('should redirect to canvas after successful sign in', () => {...})
  it('should redirect to login after sign out', () => {...})
})
```

### Files Summary for PR #2:
**Created:**
- `src/types/index.ts`
- `src/hooks/useAuth.ts`
- `src/components/auth/GoogleSignIn.tsx`
- `src/pages/LoginPage.tsx`
- `src/pages/CanvasPage.tsx`
- `src/__tests__/integration/auth.test.tsx`
- `firestore.rules`
- `database.rules.json`

**Modified:**
- `src/App.tsx`

---

## PR #3: Basic Canvas with Pan & Zoom

**Goal:** Single-user canvas with pan and zoom working

**Branch:** `feature/canvas-base`

### High-Level Tasks:
- [x] Set up Konva Stage
- [x] Implement pan functionality
- [x] Implement zoom functionality
- [x] Create canvas layout
- [x] Add mobile support
- [x] Add error handling

### Subtasks:

#### 3.1 Create Canvas Store
- [x] Create `src/store/canvasStore.ts`
- [x] Set up Zustand store
- [x] Add stage position state (x, y) - initial: {x: 0, y: 0}
- [x] Add stage scale state - initial: 1
- [x] Add shapes array (empty for now)
- [x] Add interaction state (isPanning, isZooming)
- [x] Add actions to update position and scale
- [x] Add actions to set interaction states

**Files Created:**
- `src/store/canvasStore.ts`

#### 3.2 Update Type Definitions
- [x] Open `src/types/index.ts`
- [x] Add `Rectangle` type (id, x, y, width, height, fill, createdBy, etc.)
- [x] Add `StageConfig` type
- [x] Add `InteractionState` type (isPanning, isZooming)
- [x] Export new types

**Files Modified:**
- `src/types/index.ts`

#### 3.3 Create Canvas Component
- [x] Create `src/components/canvas/Canvas.tsx`
- [x] Import Konva Stage and Layer
- [x] Set up Stage with 5000x5000px workspace
- [x] Set stage to fill container with padding and border
- [x] Add empty Layer for shapes (to be used later)
- [x] Connect to canvas store for position/scale
- [x] Add error boundary wrapper
- [x] Implement canvas bounds (center at 0,0, limit panning to 5000px)

**Files Created:**
- `src/components/canvas/Canvas.tsx`

#### 3.4 Implement Pan Functionality
- [x] In `Canvas.tsx`, make Stage draggable
- [x] Add `onDragStart` handler (set isPanning to true, disable zoom)
- [x] Add `onDragEnd` handler (set isPanning to false, enable zoom)
- [x] Update store with new position
- [x] Test pan by clicking and dragging background

**Files Modified:**
- `src/components/canvas/Canvas.tsx`

#### 3.5 Implement Zoom Functionality
- [x] In `Canvas.tsx`, add wheel event listener
- [x] Calculate new scale using exponential zoom (scale * 1.1^delta)
- [x] Zoom toward mouse cursor position using Konva's getPointerPosition
- [x] Clamp zoom between 0.1x and 3x
- [x] Disable pan while zooming (set isZooming state)
- [x] Update store with new scale
- [x] Test zoom with mouse wheel

**Files Modified:**
- `src/components/canvas/Canvas.tsx`

#### 3.6 Create Canvas Controls Component
- [x] Create `src/components/canvas/CanvasControls.tsx`
- [x] Add "Reset View" button (reset pan/zoom to initial state)
- [x] Add zoom indicator (show current zoom %)
- [x] Add zoom in/out buttons with keyboard shortcuts
- [x] Add zoom input field for specific zoom values
- [x] Add pan X and Y coordinate controls
- [x] Style with Tailwind

**Files Created:**
- `src/components/canvas/CanvasControls.tsx`

#### 3.7 Create Layout Component
- [x] Create `src/components/layout/Layout.tsx`
- [x] Add header with logo and user info
- [x] Add logout button
- [x] Add main content area with proper padding
- [x] Style with Tailwind

**Files Created:**
- `src/components/layout/Layout.tsx`

#### 3.8 Create Header Component
- [x] Create `src/components/layout/Header.tsx`
- [x] Display "CollabCanvas" title
- [x] Display current user's name
- [x] Add logout button
- [x] Style with Tailwind

**Files Created:**
- `src/components/layout/Header.tsx`

#### 3.9 Update Canvas Page
- [x] Open `src/pages/CanvasPage.tsx`
- [x] Remove placeholder content
- [x] Import and render Layout
- [x] Import and render Canvas inside Layout
- [x] Import and render CanvasControls
- [x] Ensure canvas fills available space with padding

**Files Modified:**
- `src/pages/CanvasPage.tsx`

#### 3.10 Add Canvas Styling
- [x] Update `src/index.css` if needed
- [x] Set canvas container to fill viewport with padding (e.g., 20px)
- [x] Add border around canvas for clarity
- [x] Set background color for canvas
- [x] Ensure no scrollbars on canvas container
- [x] Make canvas responsive to viewport changes

**Files Modified:**
- `src/index.css`

#### 3.11 Add Mobile Support
- [x] Add touch event handlers for pan (touchstart, touchmove, touchend)
- [x] Add pinch-to-zoom gesture support using touch events
- [x] Test on mobile devices
- [x] Ensure touch events don't conflict with mouse events
- [x] Add touch-specific styling and interactions

**Files Modified:**
- `src/components/canvas/Canvas.tsx`

#### 3.12 Add Error Handling
- [x] Add try-catch blocks around canvas operations
- [x] Handle Konva initialization errors
- [x] Add fallback UI if canvas fails to load
- [x] Log errors to console for debugging
- [x] Add error boundary component for canvas

**Files Modified:**
- `src/components/canvas/Canvas.tsx`

#### 3.13 Add Keyboard Shortcuts
- [x] Add keyboard shortcuts (Ctrl+Plus, Ctrl+Minus for zoom)
- [ ] Add spacebar for temporary pan mode
- [x] Add Escape to reset view
- [x] Ensure shortcuts don't conflict with browser defaults

**Files Modified:**
- `src/components/canvas/Canvas.tsx`
- `src/components/canvas/CanvasControls.tsx`

#### 3.14 Write Unit Tests for Canvas Store
- [x] Create `src/__tests__/canvasStore.test.ts`
- [x] Test: Initial state is correct (blank canvas)
- [x] Test: updatePosition updates x and y correctly
- [x] Test: updateScale updates scale correctly
- [x] Test: Scale is clamped to min/max bounds
- [x] Test: addShape adds shape to array
- [x] Test: Interaction states work correctly
- [x] Run tests: `npm run test`

**Files Created:**
- `src/__tests__/canvasStore.test.ts`

**Test Coverage:**
```typescript
// Example test structure:
describe('Canvas Store', () => {
  it('should initialize with blank canvas state', () => {...})
  it('should update stage position', () => {...})
  it('should update stage scale', () => {...})
  it('should clamp scale within bounds', () => {...})
  it('should add shapes to array', () => {...})
  it('should manage interaction states', () => {...})
})
```

### Files Summary for PR #3:
**Created:**
- `src/store/canvasStore.ts`
- `src/components/canvas/Canvas.tsx`
- `src/components/canvas/CanvasControls.tsx`
- `src/components/layout/Layout.tsx`
- `src/components/layout/Header.tsx`
- `src/__tests__/canvasStore.test.ts`

**Modified:**
- `src/types/index.ts`
- `src/pages/CanvasPage.tsx`
- `src/index.css`

---

## PR #4: Rectangle Creation & Local Manipulation

**Goal:** Create and move rectangles locally (no sync yet)

**Branch:** `feature/rectangles-local`

### High-Level Tasks:
- [ ] Create Rectangle component
- [ ] Add "Create Rectangle" button
- [ ] Implement rectangle creation
- [ ] Implement click-to-select
- [ ] Implement drag-to-move
- [ ] Test functionality

### Subtasks:

#### 4.1 Create Utils File
- [ ] Create `src/lib/utils.ts`
- [ ] Add `generateId()` function (use crypto.randomUUID or similar)
- [ ] Add `getRandomColor()` function (return from predefined palette)
- [ ] Add `getUserColor()` function (deterministic color from userId)

**Files Created:**
- `src/lib/utils.ts`

#### 4.2 Update Canvas Store
- [ ] Open `src/store/canvasStore.ts`
- [ ] Add shapes array to state
- [ ] Add selectedShapeId to state
- [ ] Add `addShape` action
- [ ] Add `updateShape` action
- [ ] Add `selectShape` action
- [ ] Add `deselectShape` action

**Files Modified:**
- `src/store/canvasStore.ts`

#### 4.3 Create Rectangle Component
- [ ] Create `src/components/canvas/Rectangle.tsx`
- [ ] Import Konva Rect and Transformer
- [ ] Render Konva Rect with props (x, y, width, height, fill)
- [ ] Add click handler to select rectangle
- [ ] Add drag handler to move rectangle
- [ ] Add dragEnd handler to update position in store
- [ ] Style rectangle (solid fill, no stroke by default)

**Files Created:**
- `src/components/canvas/Rectangle.tsx`

#### 4.4 Update Canvas Component
- [ ] Open `src/components/canvas/Canvas.tsx`
- [ ] Import Rectangle component
- [ ] Get shapes from store
- [ ] Map over shapes and render Rectangle for each
- [ ] Pass shape data as props to Rectangle
- [ ] Add click handler on Stage to deselect when clicking background

**Files Modified:**
- `src/components/canvas/Canvas.tsx`

#### 4.5 Add Create Rectangle Button
- [ ] Open `src/components/canvas/CanvasControls.tsx`
- [ ] Add "Add Rectangle" button
- [ ] Add click handler to create new rectangle
- [ ] New rectangle should appear at viewport center
- [ ] Use default size (100x80px)
- [ ] Use random color from palette
- [ ] Update store with new shape

**Files Modified:**
- `src/components/canvas/CanvasControls.tsx`

#### 4.6 Implement Rectangle Selection
- [ ] Verify click handler in Rectangle.tsx updates selectedShapeId in store
- [ ] Verify Stage click handler deselects
- [ ] Test clicking different rectangles
- [ ] Test clicking background to deselect

**Files Modified:**
- (Already implemented in previous steps)

#### 4.7 Implement Rectangle Movement
- [ ] Verify drag handlers work in Rectangle.tsx
- [ ] Ensure dragging updates shape position in store
- [ ] Test dragging multiple rectangles
- [ ] Ensure smooth dragging (60 FPS)

**Files Modified:**
- (Already implemented in previous steps)

#### 4.8 Calculate Viewport Center
- [ ] In `CanvasControls.tsx`, add function to calculate viewport center
- [ ] Account for current pan and zoom
- [ ] Use Stage position and scale from store
- [ ] Place new rectangles at calculated center

**Files Modified:**
- `src/components/canvas/CanvasControls.tsx`

#### 4.9 Test Rectangle Functionality
- [ ] Create multiple rectangles
- [ ] Verify each appears at viewport center
- [ ] Verify each has random color
- [ ] Test clicking to select
- [ ] Test dragging to move
- [ ] Test clicking background to deselect
- [ ] Verify 60 FPS during dragging

**External:** Browser testing

#### 4.10 Write Unit Tests for Utils
- [ ] Create `src/__tests__/utils.test.ts`
- [ ] Test: generateId() returns unique IDs
- [ ] Test: getRandomColor() returns valid hex colors
- [ ] Test: getRandomColor() returns colors from palette
- [ ] Test: getUserColor() returns consistent color for same userId
- [ ] Test: getUserColor() returns different colors for different userIds
- [ ] Run tests: `npm run test`

**Files Created:**
- `src/__tests__/utils.test.ts`

**Test Coverage:**
```typescript
// Example test structure:
describe('Utils', () => {
  describe('generateId', () => {
    it('should generate unique IDs', () => {...})
    it('should return string type', () => {...})
  })
  
  describe('getRandomColor', () => {
    it('should return valid hex color', () => {...})
    it('should return color from predefined palette', () => {...})
  })
  
  describe('getUserColor', () => {
    it('should return consistent color for same userId', () => {...})
    it('should return different colors for different userIds', () => {...})
  })
})
```

#### 4.11 Write Component Tests for Rectangle
- [ ] Create `src/__tests__/Rectangle.test.tsx`
- [ ] Test: Rectangle renders with correct props
- [ ] Test: Rectangle responds to click (selection)
- [ ] Test: Rectangle can be dragged
- [ ] Test: dragEnd callback is called with correct position
- [ ] Run tests: `npm run test`

**Files Created:**
- `src/__tests__/Rectangle.test.tsx`

**Test Coverage:**
```typescript
// Example test structure:
describe('Rectangle Component', () => {
  it('should render rectangle with correct dimensions', () => {...})
  it('should render rectangle with correct color', () => {...})
  it('should call onSelect when clicked', () => {...})
  it('should update position when dragged', () => {...})
  it('should call onDragEnd with new position', () => {...})
})
```

### Files Summary for PR #4:
**Created:**
- `src/lib/utils.ts`
- `src/components/canvas/Rectangle.tsx`
- `src/__tests__/utils.test.ts`
- `src/__tests__/Rectangle.test.tsx`

**Modified:**
- `src/store/canvasStore.ts`
- `src/components/canvas/Canvas.tsx`
- `src/components/canvas/CanvasControls.tsx`

---

## PR #5: Real-Time Rectangle Synchronization

**Goal:** Sync rectangle creation and movement across all users

**Branch:** `feature/realtime-sync`

### High-Level Tasks:
- [ ] Create shapes hook for Firestore
- [ ] Sync rectangle creation to Firestore
- [ ] Sync rectangle movement to Firestore
- [ ] Listen to Firestore changes
- [ ] Test multi-user sync

### Subtasks:

#### 5.1 Update Firestore Rules
- [ ] Open `firestore.rules`
- [ ] Add rules for `/shapes/{shapeId}` collection
- [ ] Allow read if authenticated
- [ ] Allow create if authenticated
- [ ] Allow update if authenticated
- [ ] Allow delete if authenticated
- [ ] Deploy rules: `firebase deploy --only firestore:rules`

**Files Modified:**
- `firestore.rules`

#### 5.2 Create Shapes Hook
- [ ] Create `src/hooks/useShapes.ts`
- [ ] Import firestore from firebase config
- [ ] Create `useShapes` hook
- [ ] Implement `createShape` function (adds to Firestore)
- [ ] Implement `updateShape` function (updates in Firestore)
- [ ] Implement real-time listener with `onSnapshot`
- [ ] Parse Firestore data to Rectangle type
- [ ] Handle errors
- [ ] Clean up listener on unmount

**Files Created:**
- `src/hooks/useShapes.ts`

#### 5.3 Update Canvas Store for Firestore
- [ ] Open `src/store/canvasStore.ts`
- [ ] Modify `addShape` to accept shape without calling Firestore directly
- [ ] Modify `updateShape` to accept shape without calling Firestore directly
- [ ] Store will now be updated from Firestore listener, not directly

**Files Modified:**
- `src/store/canvasStore.ts`

#### 5.4 Integrate Shapes Hook in Canvas
- [ ] Open `src/pages/CanvasPage.tsx`
- [ ] Import and call `useShapes()` hook
- [ ] Pass `createShape` function to CanvasControls
- [ ] Pass `updateShape` function to Canvas
- [ ] Hook will automatically update store when Firestore changes

**Files Modified:**
- `src/pages/CanvasPage.tsx`

#### 5.5 Update Canvas Controls for Firestore
- [ ] Open `src/components/canvas/CanvasControls.tsx`
- [ ] Accept `createShape` function as prop
- [ ] Update "Add Rectangle" button handler to call `createShape`
- [ ] Include userId (from auth) in shape data
- [ ] Include timestamps

**Files Modified:**
- `src/components/canvas/CanvasControls.tsx`

#### 5.6 Update Rectangle for Firestore
- [ ] Open `src/components/canvas/Rectangle.tsx`
- [ ] Accept `updateShape` function as prop
- [ ] Update dragEnd handler to call `updateShape` with new position
- [ ] Ensure only final position is sent (not intermediate drag positions)

**Files Modified:**
- `src/components/canvas/Rectangle.tsx`

#### 5.7 Update Canvas to Pass Props
- [ ] Open `src/components/canvas/Canvas.tsx`
- [ ] Accept `updateShape` function as prop from parent
- [ ] Pass `updateShape` to each Rectangle component

**Files Modified:**
- `src/components/canvas/Canvas.tsx`

#### 5.8 Handle Optimistic Updates
- [ ] In `useShapes.ts`, consider implementing optimistic updates
- [ ] Update local state immediately, then sync to Firestore
- [ ] Handle potential conflicts (last write wins)

**Files Modified:**
- `src/hooks/useShapes.ts`

#### 5.9 Test Firestore Sync
- [ ] Open app in two browser windows
- [ ] Log in as different users in each
- [ ] Create rectangle in Window 1
- [ ] Verify it appears in Window 2 within 100ms
- [ ] Move rectangle in Window 2
- [ ] Verify it moves in Window 1 within 100ms
- [ ] Test with 3+ windows
- [ ] Verify Firestore console shows data

**External:** Browser testing, Firestore Console

#### 5.10 Test Persistence
- [ ] Create several rectangles
- [ ] Close all browser windows
- [ ] Open app again
- [ ] Verify all rectangles are still present

**External:** Browser testing

#### 5.11 Write Integration Tests for Rectangle Sync
- [ ] Create `src/__tests__/integration/rectangleSync.test.tsx`
- [ ] Mock Firestore functions
- [ ] Test: createShape writes to Firestore with correct data
- [ ] Test: updateShape updates Firestore document
- [ ] Test: Firestore listener updates local state when data changes
- [ ] Test: Multiple shape creations are handled correctly
- [ ] Test: Shape updates include correct timestamps
- [ ] Run tests: `npm run test`

**Files Created:**
- `src/__tests__/integration/rectangleSync.test.tsx`

**Test Coverage:**
```typescript
// Example test structure:
describe('Rectangle Synchronization', () => {
  it('should create shape in Firestore with correct structure', () => {...})
  it('should update shape position in Firestore', () => {...})
  it('should sync Firestore changes to local state', () => {...})
  it('should handle multiple simultaneous shape creations', () => {...})
  it('should include userId in created shapes', () => {...})
  it('should include timestamps in shape data', () => {...})
  it('should handle Firestore errors gracefully', () => {...})
})
```

### Files Summary for PR #5:
**Created:**
- `src/hooks/useShapes.ts`
- `src/__tests__/integration/rectangleSync.test.tsx`

**Modified:**
- `firestore.rules`
- `src/store/canvasStore.ts`
- `src/pages/CanvasPage.tsx`
- `src/components/canvas/CanvasControls.tsx`
- `src/components/canvas/Rectangle.tsx`
- `src/components/canvas/Canvas.tsx`

---

## PR #6: Multiplayer Cursors

**Goal:** Show other users' cursors in real-time

**Branch:** `feature/multiplayer-cursors`

### High-Level Tasks:
- [ ] Create cursors hook for Realtime Database
- [ ] Track local cursor position
- [ ] Broadcast cursor to Realtime Database
- [ ] Listen to other users' cursors
- [ ] Render cursor components
- [ ] Test cursor sync

### Subtasks:

#### 6.1 Update Realtime Database Rules
- [ ] Open `database.rules.json`
- [ ] Add rules for `/cursors` path
- [ ] Allow read if authenticated
- [ ] Allow write if authenticated
- [ ] Deploy rules: `firebase deploy --only database`

**Files Modified:**
- `database.rules.json`

#### 6.2 Update Type Definitions
- [ ] Open `src/types/index.ts`
- [ ] Add `Cursor` type (userId, userName, x, y, color, lastUpdated)
- [ ] Export Cursor type

**Files Modified:**
- `src/types/index.ts`

#### 6.3 Create Cursors Hook
- [ ] Create `src/hooks/useCursors.ts`
- [ ] Import realtimeDb from firebase config
- [ ] Create `useCursors` hook
- [ ] Accept current user data as param
- [ ] Implement cursor position tracking with throttle (100ms)
- [ ] Implement `updateCursor` function (writes to Realtime DB)
- [ ] Implement real-time listener for all cursors
- [ ] Filter out own cursor
- [ ] Clean up on unmount
- [ ] Remove own cursor on unmount

**Files Created:**
- `src/hooks/useCursors.ts`

#### 6.4 Create Cursor Component
- [ ] Create `src/components/multiplayer/Cursor.tsx`
- [ ] Accept cursor data as props (x, y, userName, color)
- [ ] Render cursor icon (SVG or emoji)
- [ ] Render username label below cursor
- [ ] Position using absolute positioning
- [ ] Style with user color
- [ ] Use CSS transform for smooth movement

**Files Created:**
- `src/components/multiplayer/Cursor.tsx`

#### 6.5 Create Cursor Layer Component
- [ ] Create `src/components/multiplayer/CursorLayer.tsx`
- [ ] Accept array of cursors as props
- [ ] Map over cursors and render Cursor component for each
- [ ] Position layer over canvas
- [ ] Ensure cursors don't block canvas interactions (pointer-events: none on layer, auto on cursors)

**Files Created:**
- `src/components/multiplayer/CursorLayer.tsx`

#### 6.6 Integrate Cursors in Canvas Page
- [ ] Open `src/pages/CanvasPage.tsx`
- [ ] Import and call `useCursors()` hook
- [ ] Get current user from auth
- [ ] Pass user data to useCursors
- [ ] Get cursors array from hook
- [ ] Render CursorLayer component
- [ ] Pass cursors to CursorLayer

**Files Modified:**
- `src/pages/CanvasPage.tsx`

#### 6.7 Track Mouse Position on Canvas
- [ ] Open `src/components/canvas/Canvas.tsx`
- [ ] Add mousemove event listener to Stage
- [ ] Get pointer position in canvas coordinates (use Konva's getPointerPosition)
- [ ] Pass position to parent component
- [ ] Parent should call updateCursor from useCursors hook

**Files Modified:**
- `src/components/canvas/Canvas.tsx`
- `src/pages/CanvasPage.tsx`

#### 6.8 Throttle Cursor Updates
- [ ] In `useCursors.ts`, implement throttle function
- [ ] Throttle cursor updates to 100ms
- [ ] Ensure smooth cursor rendering despite throttling
- [ ] Use requestAnimationFrame or CSS transitions for smoothness

**Files Modified:**
- `src/hooks/useCursors.ts`

#### 6.9 Assign User Colors
- [ ] In `src/lib/utils.ts`, verify `getUserColor` function exists
- [ ] Function should return consistent color for each userId
- [ ] Use simple hash of userId to pick from color palette
- [ ] Test that same user always gets same color

**Files Modified:**
- `src/lib/utils.ts` (if needed)

#### 6.10 Test Cursor Sync
- [ ] Open app in two browser windows
- [ ] Log in as different users
- [ ] Move mouse in Window 1
- [ ] Verify cursor appears in Window 2
- [ ] Verify cursor moves smoothly (<100ms latency)
- [ ] Verify username label is visible
- [ ] Verify colors are different for each user
- [ ] Test with 3+ users

**External:** Browser testing, Realtime Database Console

#### 6.11 Test Cursor Cleanup
- [ ] Open multiple windows
- [ ] Close one window
- [ ] Verify cursor disappears from other windows
- [ ] Check Realtime Database console to verify data removed

**External:** Browser testing

### Files Summary for PR #6:
**Created:**
- `src/hooks/useCursors.ts`
- `src/components/multiplayer/Cursor.tsx`
- `src/components/multiplayer/CursorLayer.tsx`

**Modified:**
- `database.rules.json`
- `src/types/index.ts`
- `src/pages/CanvasPage.tsx`
- `src/components/canvas/Canvas.tsx`
- `src/lib/utils.ts` (if needed)

---

## PR #7: Presence System

**Goal:** Show list of currently online users

**Branch:** `feature/presence-system`

### High-Level Tasks:
- [ ] Create presence hook for Realtime Database
- [ ] Write user presence on mount
- [ ] Auto-remove presence on disconnect
- [ ] Create presence list UI component
- [ ] Test presence tracking

### Subtasks:

#### 7.1 Update Type Definitions
- [ ] Open `src/types/index.ts`
- [ ] Add `PresenceUser` type (userId, userName, color, joinedAt)
- [ ] Export PresenceUser type

**Files Modified:**
- `src/types/index.ts`

#### 7.2 Create Presence Hook
- [ ] Create `src/hooks/usePresence.ts`
- [ ] Import realtimeDb from firebase config
- [ ] Create `usePresence` hook
- [ ] Accept current user data as param
- [ ] Write user to `/presence/{userId}` on mount
- [ ] Set up `onDisconnect().remove()` for auto-cleanup
- [ ] Listen to all users in `/presence`
- [ ] Return array of online users
- [ ] Clean up listener on unmount

**Files Created:**
- `src/hooks/usePresence.ts`

#### 7.3 Create Presence List Component
- [ ] Create `src/components/multiplayer/PresenceList.tsx`
- [ ] Accept array of users as props
- [ ] Display user count (e.g., "3 users online")
- [ ] List each user's name
- [ ] Show color indicator dot next to each name
- [ ] Style with Tailwind
- [ ] Make it compact and unobtrusive

**Files Created:**
- `src/components/multiplayer/PresenceList.tsx`

#### 7.4 Integrate Presence in Canvas Page
- [ ] Open `src/pages/CanvasPage.tsx`
- [ ] Import and call `usePresence()` hook
- [ ] Pass current user data to hook
- [ ] Get presence array from hook
- [ ] Render PresenceList component in Layout
- [ ] Position in header or sidebar

**Files Modified:**
- `src/pages/CanvasPage.tsx`

#### 7.5 Update Layout for Presence
- [ ] Open `src/components/layout/Layout.tsx`
- [ ] Accept presence list as prop (or render it directly in CanvasPage)
- [ ] Add space in header or sidebar for PresenceList
- [ ] Ensure it doesn't obstruct canvas

**Files Modified:**
- `src/components/layout/Layout.tsx`

#### 7.6 Test Presence Tracking
- [ ] Open app in two browser windows
- [ ] Log in as different users
- [ ] Verify both users appear in presence list
- [ ] Verify user count is accurate
- [ ] Close one window
- [ ] Verify presence list updates (within 10 seconds)
- [ ] Verify user count decrements
- [ ] Test with 3+ users

**External:** Browser testing, Realtime Database Console

#### 7.7 Test Presence Persistence
- [ ] Refresh browser
- [ ] Verify user reappears in presence list
- [ ] Verify no duplicate entries
- [ ] Check Realtime Database console for data integrity

**External:** Browser testing

### Files Summary for PR #7:
**Created:**
- `src/hooks/usePresence.ts`
- `src/components/multiplayer/PresenceList.tsx`

**Modified:**
- `src/types/index.ts`
- `src/pages/CanvasPage.tsx`
- `src/components/layout/Layout.tsx`

---

## PR #8: Final Testing, Polish & Documentation

**Goal:** Verify all MVP requirements, fix bugs, prepare for submission

**Branch:** `feature/final-polish`

### High-Level Tasks:
- [ ] Run full MVP checklist
- [ ] Cross-browser testing
- [ ] Performance testing
- [ ] Bug fixes
- [ ] Documentation updates
- [ ] Final deployment

### Subtasks:

#### 8.1 Run MVP Checklist - Authentication
- [ ] Test: Create new account with email/password
- [ ] Test: Login with created account
- [ ] Test: Stay logged in after browser refresh
- [ ] Test: Logout functionality
- [ ] Fix any auth issues

**External:** Browser testing

#### 8.2 Run MVP Checklist - Canvas Workspace
- [ ] Test: Pan by clicking and dragging background
- [ ] Test: Zoom with mouse wheel
- [ ] Test: Smooth pan at 60 FPS (use dev tools)
- [ ] Test: Smooth zoom at 60 FPS
- [ ] Test: Canvas feels spacious (5000x5000px)
- [ ] Fix any canvas issues

**External:** Browser testing

#### 8.3 Run MVP Checklist - Rectangles
- [ ] Test: Create rectangle with button
- [ ] Test: Click to select rectangle
- [ ] Test: Drag to move rectangle
- [ ] Test: Create multiple rectangles
- [ ] Test: Each rectangle has different color
- [ ] Fix any rectangle issues

**External:** Browser testing

#### 8.4 Run MVP Checklist - Real-Time Sync
- [ ] Open 2 browser windows with different users
- [ ] Test: Create rectangle in Window 1, appears in Window 2 (<100ms)
- [ ] Test: Move rectangle in Window 2, updates in Window 1 (<100ms)
- [ ] Test: Simultaneous edits (last write wins)
- [ ] Test: System handles 2+ users without crashes
- [ ] Fix any sync issues

**External:** Browser testing

#### 8.5 Run MVP Checklist - Multiplayer Cursors
- [ ] Open 2 browser windows with different users
- [ ] Test: Move mouse in Window 1, cursor appears in Window 2
- [ ] Test: Cursor moves smoothly (<100ms latency)
- [ ] Test: Username label is visible on cursor
- [ ] Test: Each user has different cursor color
- [ ] Test: Own cursor is hidden (only see others)
- [ ] Fix any cursor issues

**External:** Browser testing

#### 8.6 Run MVP Checklist - Presence
- [ ] Open 2 browser windows with different users
- [ ] Test: Both users appear in presence list
- [ ] Test: User count is accurate
- [ ] Close Window 2
- [ ] Test: Window 1 shows updated list (within 10 seconds)
- [ ] Test: User count decrements
- [ ] Fix any presence issues

**External:** Browser testing

#### 8.7 Run MVP Checklist - Persistence
- [ ] Create several rectangles
- [ ] Refresh browser
- [ ] Test: All rectangles still present
- [ ] Close all windows
- [ ] Open app again
- [ ] Test: All rectangles still present
- [ ] Fix any persistence issues

**External:** Browser testing

#### 8.8 Run MVP Checklist - Deployment
- [ ] Verify app is deployed to public URL
- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari (if on Mac)
- [ ] Test with 2+ concurrent users
- [ ] Verify no CORS errors
- [ ] Fix any deployment issues

**External:** Browser testing, multiple browsers

#### 8.9 Performance Testing
- [ ] Open browser dev tools Performance tab
- [ ] Record while panning canvas
- [ ] Verify 60 FPS maintained
- [ ] Record while zooming canvas
- [ ] Verify 60 FPS maintained
- [ ] Record while dragging rectangles
- [ ] Verify 60 FPS maintained
- [ ] Record with 2+ users editing simultaneously
- [ ] Verify performance doesn't degrade
- [ ] Fix any performance issues

**External:** Browser dev tools

#### 8.10 Cross-Browser Testing
- [ ] Test full workflow in Chrome
- [ ] Test full workflow in Firefox
- [ ] Test full workflow in Safari (if available)
- [ ] Document any browser-specific issues
- [ ] Fix critical cross-browser bugs

**External:** Multiple browsers

#### 8.11 Add Loading States
- [ ] Add loading spinner while checking auth state
- [ ] Add loading state while fetching initial shapes
- [ ] Add loading state during login/register
- [ ] Ensure no blank screens during loading

**Files Modified:**
- `src/App.tsx`
- `src/pages/CanvasPage.tsx`
- `src/components/auth/LoginForm.tsx`
- `src/components/auth/RegisterForm.tsx`

#### 8.12 Error Handling Improvements
- [ ] Add error boundaries (optional for MVP)
- [ ] Improve error messages in auth forms
- [ ] Add console.error for debugging
- [ ] Handle Firestore/Realtime DB errors gracefully

**Files Modified:**
- `src/hooks/useShapes.ts`
- `src/hooks/useCursors.ts`
- `src/hooks/usePresence.ts`
- `src/components/auth/LoginForm.tsx`
- `src/components/auth/RegisterForm.tsx`

#### 8.13 Update README
- [ ] Open `README.md`
- [ ] Add detailed setup instructions
- [ ] Add Firebase configuration steps
- [ ] Add deployment instructions
- [ ] Add link to deployed app
- [ ] Add demo video link (to be recorded)
- [ ] Add tech stack description
- [ ] Add MVP features list
- [ ] Add known limitations

**Files Modified:**
- `README.md`

#### 8.14 Add Code Comments
- [ ] Add JSDoc comments to complex functions
- [ ] Add inline comments for tricky logic
- [ ] Document Firebase structure in comments
- [ ] Add README sections explaining architecture

**Files Modified:**
- Multiple files (add comments where needed)

#### 8.15 Clean Up Code
- [ ] Remove console.logs (or keep for debugging)
- [ ] Remove unused imports
- [ ] Remove unused components/files
- [ ] Format code consistently
- [ ] Run ESLint (if configured)

**Files Modified:**
- Multiple files

#### 8.16 Test Edge Cases
- [ ] Test: Very fast rectangle creation (10+ clicks)
- [ ] Test: Very fast rectangle movements
- [ ] Test: Creating 50+ rectangles
- [ ] Test: Zooming in/out to extremes
- [ ] Test: Panning to canvas edges
- [ ] Test: Rapidly joining/leaving (refresh spam)
- [ ] Fix any edge case bugs

**External:** Browser testing

#### 8.17 Record Demo Video
- [ ] Open deployed app
- [ ] Record 2-3 minute demo video
- [ ] Show login/register
- [ ] Show creating rectangles
- [ ] Show moving rectangles
- [ ] Open second browser window
- [ ] Show real-time sync between users
- [ ] Show multiplayer cursors
- [ ] Show presence list
- [ ] Show persistence (refresh browser)
- [ ] Upload video (YouTube, Loom, etc.)
- [ ] Add link to README

**External:** Screen recording software

#### 8.18 Final Deployment
- [ ] Run `npm run build`
- [ ] Fix any build errors
- [ ] Run `firebase deploy`
- [ ] Verify deployed app works
- [ ] Test full workflow on deployed app
- [ ] Update README with final deployed URL

**External:** Firebase Hosting

#### 8.19 Create Submission Checklist
- [ ] Verify GitHub repository is public
- [ ] Verify README has setup instructions
- [ ] Verify README has deployed link
- [ ] Verify demo video is recorded and linked
- [ ] Verify all MVP requirements are met
- [ ] Prepare for submission

**External:** GitHub

#### 8.20 Final Code Review
- [ ] Review all code for quality
- [ ] Ensure consistent coding style
- [ ] Verify no sensitive data (API keys) in repo
- [ ] Verify .env.local is in .gitignore
- [ ] Check for any TODO comments
- [ ] Make final commit

**Files Modified:**
- Multiple files (final review)

### Files Summary for PR #8:
**Created:**
- None (polish only)

**Modified:**
- `README.md`
- `src/App.tsx`
- `src/pages/CanvasPage.tsx`
- `src/components/auth/LoginForm.tsx`
- `src/components/auth/RegisterForm.tsx`
- `src/hooks/useShapes.ts`
- `src/hooks/useCursors.ts`
- `src/hooks/usePresence.ts`
- Multiple files (cleanup, comments, bug fixes)

---

## Summary by Pull Request

| PR # | Branch | Goal | Files Created | Files Modified | Tests Added | Est. Time |
|------|--------|------|---------------|----------------|-------------|-----------|
| 1 | feature/project-setup | Project setup & deployment | 17+ | 4 | 1 setup test | 3-4 hrs |
| 2 | feature/authentication | Auth system | 8 | 3 | 1 integration | 4-5 hrs | ✅ COMPLETE |
| 3 | feature/canvas-base | Canvas with pan/zoom | 6 | 3 | 1 unit | 3-4 hrs |
| 4 | feature/rectangles-local | Local rectangle manipulation | 4 | 3 | 2 (unit + component) | 3-4 hrs |
| 5 | feature/realtime-sync | Firestore sync | 2 | 6 | 1 integration | 4-5 hrs |
| 6 | feature/multiplayer-cursors | Cursor sync | 3 | 5 | None | 3-4 hrs |
| 7 | feature/presence-system | Presence tracking | 2 | 3 | None | 2-3 hrs |
| 8 | feature/final-polish | Testing & polish | 0 | 10+ | Manual testing | 3-4 hrs |

**Total Estimated Time:** 25-33 hours (includes test writing time)

**Total Tests:** 6 automated test files
- 1 setup verification test
- 2 integration tests (auth, rectangle sync)
- 3 unit/component tests (utils, canvasStore, Rectangle)

---

## Quick Reference: File Creation Order

1. **PR #1 (Setup):**
   - All Vite scaffolding
   - `src/lib/firebase.ts`
   - Firebase config files
   - Tailwind config
   - Vitest config + setup test

2. **PR #2 (Auth):**
   - Firebase Console setup (Google provider)
   - `src/types/index.ts`
   - `src/hooks/useAuth.ts`
   - Google sign-in component (GoogleSignIn)
   - Page components (LoginPage, CanvasPage placeholder)
   - Security rules (firestore.rules, database.rules.json)
   - Integration test for auth

3. **PR #3 (Canvas):**
   - `src/store/canvasStore.ts`
   - `src/components/canvas/Canvas.tsx`
   - `src/components/canvas/CanvasControls.tsx`
   - Layout components
   - Unit test for canvasStore

4. **PR #4 (Rectangles):**
   - `src/lib/utils.ts`
   - `src/components/canvas/Rectangle.tsx`
   - Unit test for utils
   - Component test for Rectangle

5. **PR #5 (Sync):**
   - `src/hooks/useShapes.ts`
   - Integration test for rectangle sync

6. **PR #6 (Cursors):**
   - `src/hooks/useCursors.ts`
   - `src/components/multiplayer/Cursor.tsx`
   - `src/components/multiplayer/CursorLayer.tsx`

7. **PR #7 (Presence):**
   - `src/hooks/usePresence.ts`
   - `src/components/multiplayer/PresenceList.tsx`

8. **PR #8 (Polish):**
   - No new files, only modifications

---

## Testing Strategy Overview

### PRs with Automated Tests:

**PR #1 - Setup Test**
- Verifies Vitest is configured correctly
- Simple assertion to confirm test environment works

**PR #2 - Authentication Integration Test**
- Mocks Firebase Auth
- Tests full auth flow (register, login, logout)
- Verifies redirects and state management
- **Purpose:** Catch auth logic errors early

**PR #3 - Canvas Store Unit Test**
- Tests Zustand store in isolation
- Verifies pan/zoom state management
- Tests bounds and constraints
- **Purpose:** Verify core state logic before UI integration

**PR #4 - Utils & Rectangle Tests**
- **Utils Test:** Validates helper functions (ID generation, color assignment)
- **Rectangle Test:** Tests component rendering and interaction
- **Purpose:** Catch logic errors in utilities and core component

**PR #5 - Rectangle Sync Integration Test**
- Mocks Firestore operations
- Tests real-time sync logic
- Verifies data structure and timestamps
- **Purpose:** Most critical test - validates multiplayer functionality

### PRs without Automated Tests:

**PR #6 - Cursors:** Complex real-time interaction, better tested manually with multiple browser windows

**PR #7 - Presence:** Real-time database cleanup, better tested with actual disconnects

**PR #8 - Polish:** Manual testing phase for full system validation

### Why These Tests?

1. **PR #2 (Auth):** Authentication bugs break the entire app - catch them early
2. **PR #3 (Store):** State management is foundational - unit test ensures it works
3. **PR #4 (Utils/Rectangle):** Pure functions are easy to test and catch edge cases
4. **PR #5 (Sync):** Most complex feature - integration test validates Firestore logic

### Running Tests:

```bash
# Run all tests
npm run test

# Run tests in watch mode (during development)
npm run test -- --watch

# Run tests with UI
npm run test:ui

# Run specific test file
npm run test src/__tests__/utils.test.ts

# Run tests with coverage
npm run test -- --coverage
```

---

## Git Workflow

For each PR:

```bash
# Create branch
git checkout -b <branch-name>

# Make changes, commit frequently
git add .
git commit -m "Descriptive message"

# Push to GitHub
git push origin <branch-name>

# Create PR on GitHub, merge when complete
# After merging, checkout main and pull
git checkout main
git pull origin main

# Start next PR
git checkout -b <next-branch-name>
```

---

## Testing Checklist (Use Throughout)

After each PR, verify:
- [ ] Code builds without errors (`npm run build`)
- [ ] App runs locally without errors (`npm run dev`)
- [ ] **All automated tests pass (`npm run test`)**
- [ ] Firebase rules deployed if changed (`firebase deploy --only firestore:rules,database`)
- [ ] New features work as expected
- [ ] No regressions in existing features
- [ ] No console errors in browser
- [ ] Can deploy to Firebase Hosting

---

## Test Files and What They Verify

### `src/__tests__/setup.test.ts` (PR #1)
```typescript
// Verifies test environment works
describe('Test Setup', () => {
  it('should run tests successfully', () => {
    expect(true).toBe(true)
  })
})
```

### `src/__tests__/integration/auth.test.tsx` (PR #2)
- ✅ User registration works
- ✅ User login works
- ✅ Invalid credentials are rejected
- ✅ Auth state persists
- ✅ Redirects work correctly
- **Catches:** Auth flow bugs, routing issues

### `src/__tests__/canvasStore.test.ts` (PR #3)
- ✅ Store initializes correctly
- ✅ Pan updates position
- ✅ Zoom updates scale
- ✅ Scale is bounded (0.1x - 3x)
- ✅ Shapes array updates
- **Catches:** State management bugs, bounds errors

### `src/__tests__/utils.test.ts` (PR #4)
- ✅ generateId() creates unique IDs
- ✅ getRandomColor() returns valid colors
- ✅ getUserColor() is consistent per user
- **Catches:** ID collisions, invalid colors

### `src/__tests__/Rectangle.test.tsx` (PR #4)
- ✅ Rectangle renders with props
- ✅ Selection works on click
- ✅ Dragging works
- ✅ Callbacks fire correctly
- **Catches:** Component rendering issues, event handling bugs

### `src/__tests__/integration/rectangleSync.test.tsx` (PR #5)
- ✅ Firestore writes have correct structure
- ✅ Updates propagate correctly
- ✅ Listeners update state
- ✅ Timestamps are included
- ✅ userId is included
- **Catches:** Sync bugs, data structure errors, critical multiplayer issues
- [ ] App runs locally without errors (`npm run dev`)
- [ ] Firebase rules deployed if changed (`firebase deploy --only firestore:rules,database`)
- [ ] New features work as expected
- [ ] No regressions in existing features
- [ ] No console errors in browser
- [ ] Can deploy to Firebase Hosting

---

## Critical Notes

1. **Firebase Setup (PR #1):** Don't commit `.env.local` with real API keys. Add to `.gitignore`.

2. **Testing Setup (PR #1):** Verify test command works before moving on. Run `npm run test` to confirm Vitest is configured correctly.

3. **Authentication (PR #2):** Test with multiple accounts to ensure proper user isolation. Run integration tests before moving to PR #3.

4. **Canvas Performance (PR #3):** Test pan/zoom extensively. 60 FPS is critical. Unit tests verify state logic, but manual testing confirms performance.

5. **Rectangle Logic (PR #4):** Run utils and Rectangle tests to catch edge cases before integration. These tests prevent bugs from reaching Firestore.

6. **Firestore Sync (PR #5):** This is the hardest part. Integration tests validate logic, but test thoroughly with multiple browser windows. Tests catch structure errors, manual testing catches timing issues.

7. **Cursor Throttling (PR #6):** 100ms throttle is important to avoid hitting Firebase limits. No automated tests here - validate manually with network tab.

8. **Presence Cleanup (PR #7):** Test `onDisconnect()` by closing tabs, not just logging out. Manual testing is more reliable than mocking.

9. **Final Testing (PR #8):** Run ALL automated tests one final time. Then run through ENTIRE MVP checklist before considering done.

10. **Test-Driven Development:** When possible, write tests BEFORE implementing features (especially for utils and store). This catches bugs earlier.

11. **Deployment:** Deploy early and often to catch deployment issues quickly. Tests only validate local logic.

---

## Debugging with Tests

### When a Test Fails:

1. **Read the error message carefully** - It tells you what's wrong
2. **Run just that test** - `npm run test -- specificTest.test.ts`
3. **Add console.logs in the test** - See what values you're actually getting
4. **Check your mocks** - Firebase mocks can be tricky
5. **Verify test isolation** - Each test should be independent
6. **Run tests in watch mode** - `npm run test -- --watch`

### Common Test Issues:

**Problem:** "Cannot find module 'firebase'"  
**Solution:** Check that Firebase is properly mocked in test setup

**Problem:** "TypeError: Cannot read property 'x' of undefined"  
**Solution:** Component may need initial props or store state

**Problem:** "Test timeout"  
**Solution:** Async operation not completing - check promises/await

**Problem:** Tests pass but app doesn't work  
**Solution:** Tests validate logic but not real Firebase - do manual testing

### Using Tests During Development:

```bash
# Terminal 1: Run dev server
npm run dev

# Terminal 2: Run tests in watch mode
npm run test -- --watch

# Terminal 3: Your code editor
# Make changes, tests auto-run, see results immediately
```

---

## Test Coverage Goals

You don't need 100% coverage for MVP, but aim for:

- ✅ **Critical paths tested:** Auth, sync, core state management
- ✅ **Pure functions tested:** Utils, store actions
- ✅ **Complex components tested:** Rectangle (has interactions)
- ⚠️ **UI components optional:** Layout, Header (mostly visual)
- ⚠️ **Real-time features optional:** Cursors, Presence (better manual testing)

**Why this strategy:**
- Tests catch logic bugs early (before they reach browser)
- Real-time features need manual testing with actual connections
- Focus testing effort where it provides most value
- 24-hour deadline means strategic test coverage, not exhaustive

---

## When to Skip Tests

Skip automated tests when:
- Feature requires real network connections (cursors, presence)
- Feature is primarily visual (layout, styling)
- Manual testing is faster and more reliable
- Time constraint is critical (use tests strategically)

**But always:**
- Test critical business logic (auth, data sync)
- Test pure functions (easy wins)
- Test complex interactions (rectangles)

---

## Continuous Integration (Optional, Post-MVP)

If time permits after MVP, consider:
```bash
# Add GitHub Actions workflow
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run test
```

This runs tests automatically on every PR. **Not required for MVP**, but good practice.

---

## Recommended Commit Message Format

```
[PR#] Category: Brief description

Detailed description if needed

- Bullet point changes
- Another change
```

Example:
```
[PR2] Auth: Add login and register pages

- Created LoginForm and RegisterForm components
- Set up Firebase Authentication
- Added routing for auth pages
- Tested with multiple user accounts
```

---

## Emergency Debugging Checklist

If something breaks:

1. **Run tests first** - `npm run test` (if tests fail, fix tests first)
2. **Check browser console** - Look for errors
3. **Check Firebase console** - Verify data structure
4. **Check network tab** - See if API calls are failing
5. **Check security rules** - Ensure they allow your operations
6. **Check authentication** - Ensure user is logged in
7. **Run specific test** - `npm run test -- failing.test.ts`
8. **Add test for bug** - Write test that reproduces issue, then fix
9. **Simplify** - Comment out code until you find the issue
10. **Console.log everything** - Add logging to understand flow
11. **Test in incognito** - Rule out cache/extension issues

### Test-First Debugging:

When you encounter a bug:
```bash
# 1. Write a test that reproduces the bug
# 2. Verify the test fails
npm run test

# 3. Fix the bug
# 4. Verify the test now passes
npm run test

# 5. Test won't allow regression
```

---

## Success Criteria

Before submitting:
✅ All 8 PRs merged to main
✅ **All automated tests passing (`npm run test`)**
✅ App deployed and publicly accessible
✅ All MVP checklist items verified
✅ Demo video recorded
✅ README updated with setup instructions
✅ No critical bugs in deployed version
✅ Works in Chrome, Firefox, and Safari
✅ 2+ users can collaborate without issues

**Testing Validation:**
✅ 6 test files created and passing
✅ Auth flow validated by integration test
✅ Store logic validated by unit test
✅ Utils validated by unit test
✅ Rectangle component validated by component test
✅ Firestore sync validated by integration test

**You've got this! 🚀**

---

## Appendix: Sample Test Code

### Example: Utils Test (`src/__tests__/utils.test.ts`)

```typescript
import { describe, it, expect } from 'vitest'
import { generateId, getRandomColor, getUserColor } from '../lib/utils'

describe('Utils', () => {
  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId()
      const id2 = generateId()
      expect(id1).not.toBe(id2)
    })

    it('should return string type', () => {
      const id = generateId()
      expect(typeof id).toBe('string')
    })
  })

  describe('getRandomColor', () => {
    it('should return valid hex color', () => {
      const color = getRandomColor()
      expect(color).toMatch(/^#[0-9A-F]{6}$/i)
    })
  })

  describe('getUserColor', () => {
    it('should return consistent color for same userId', () => {
      const userId = 'user123'
      const color1 = getUserColor(userId)
      const color2 = getUserColor(userId)
      expect(color1).toBe(color2)
    })

    it('should return different colors for different userIds', () => {
      const color1 = getUserColor('user1')
      const color2 = getUserColor('user2')
      expect(color1).not.toBe(color2)
    })
  })
})
```

### Example: Canvas Store Test (`src/__tests__/canvasStore.test.ts`)

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { useCanvasStore } from '../store/canvasStore'

describe('Canvas Store', () => {
  beforeEach(() => {
    // Reset store before each test
    useCanvasStore.setState({
      stagePosition: { x: 0, y: 0 },
      stageScale: 1,
      shapes: [],
      selectedShapeId: null,
    })
  })

  it('should initialize with default state', () => {
    const state = useCanvasStore.getState()
    expect(state.stagePosition).toEqual({ x: 0, y: 0 })
    expect(state.stageScale).toBe(1)
    expect(state.shapes).toEqual([])
  })

  it('should update stage position', () => {
    useCanvasStore.getState().updatePosition(100, 200)
    const state = useCanvasStore.getState()
    expect(state.stagePosition).toEqual({ x: 100, y: 200 })
  })

  it('should update stage scale', () => {
    useCanvasStore.getState().updateScale(1.5)
    const state = useCanvasStore.getState()
    expect(state.stageScale).toBe(1.5)
  })

  it('should clamp scale within bounds', () => {
    // Too small
    useCanvasStore.getState().updateScale(0.05)
    expect(useCanvasStore.getState().stageScale).toBe(0.1)

    // Too large
    useCanvasStore.getState().updateScale(5)
    expect(useCanvasStore.getState().stageScale).toBe(3)
  })

  it('should add shapes to array', () => {
    const shape = {
      id: '1',
      x: 100,
      y: 100,
      width: 100,
      height: 80,
      fill: '#FF0000',
      createdBy: 'user1',
    }
    
    useCanvasStore.getState().addShape(shape)
    const state = useCanvasStore.getState()
    expect(state.shapes).toHaveLength(1)
    expect(state.shapes[0]).toEqual(shape)
  })
})
```

### Example: Rectangle Component Test (`src/__tests__/Rectangle.test.tsx`)

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { Rectangle } from '../components/canvas/Rectangle'

describe('Rectangle Component', () => {
  const mockShape = {
    id: '1',
    x: 100,
    y: 100,
    width: 100,
    height: 80,
    fill: '#FF0000',
    createdBy: 'user1',
  }

  it('should call onSelect when clicked', () => {
    const onSelect = vi.fn()
    const { container } = render(
      <Rectangle
        shape={mockShape}
        isSelected={false}
        onSelect={onSelect}
        onDragEnd={vi.fn()}
      />
    )
    
    const rect = container.querySelector('rect')
    fireEvent.click(rect!)
    expect(onSelect).toHaveBeenCalledWith('1')
  })

  it('should call onDragEnd with new position', () => {
    const onDragEnd = vi.fn()
    const { container } = render(
      <Rectangle
        shape={mockShape}
        isSelected={false}
        onSelect={vi.fn()}
        onDragEnd={onDragEnd}
      />
    )
    
    const rect = container.querySelector('rect')
    fireEvent.dragEnd(rect!, { target: { x: () => 200, y: () => 200 } })
    expect(onDragEnd).toHaveBeenCalledWith('1', 200, 200)
  })
})
```

These are simplified examples - actual tests may need more setup for Konva and Firebase mocks.