# CollabCanvas MVP - Product Requirements Document

**Project Timeline:** 24 hours to MVP (Tuesday deadline)  
**Goal:** Build a real-time collaborative canvas with multiplayer features

**Tech Stack:** Firebase + React + Konva.js  
**Shape Type:** Rectangles only

---

## User Stories

### Primary User: Designer/Collaborator
- As a designer, I want to **create an account and log in** so that my work is associated with my identity
- As a designer, I want to **see a large canvas workspace** so that I can create designs without feeling constrained
- As a designer, I want to **pan and zoom the canvas smoothly** so that I can navigate my workspace efficiently
- As a designer, I want to **create rectangles on the canvas** so that I can build simple designs
- As a designer, I want to **click and drag rectangles to move them** so that I can arrange my design
- As a designer, I want to **see other users' cursors in real-time with their names** so that I know where they're working
- As a designer, I want to **see who else is currently online** so that I know who I'm collaborating with
- As a designer, I want to **see changes made by other users instantly** so that we can work together without conflicts
- As a designer, I want to **refresh my browser and see my work still there** so that I don't lose progress

### Secondary User: Evaluator/Tester
- As an evaluator, I want to **open the app in multiple browser windows** to simulate multiple users
- As an evaluator, I want to **see consistent state across all connections** to verify sync works correctly
- As an evaluator, I want to **test performance with rapid changes** to ensure the system is robust

---

## Key Features Required for MVP

### 1. Authentication System
**Implementation:** Firebase Authentication

**Must Have:**
- User registration with email/password
- User login
- Persistent sessions
- User display names for multiplayer cursors

**Acceptance Criteria:**
- Users can create accounts via Firebase Auth
- Users can log in and stay logged in across refreshes
- Each user has an identifiable name shown to others

**Technical Details:**
- Use Firebase Auth SDK
- Store user display name in Firebase Auth profile
- Use Firebase Auth state observer for session management

---

### 2. Canvas Workspace
**Implementation:** React + Konva.js

**Must Have:**
- Large canvas area (5000x5000px workspace)
- Smooth pan functionality (click and drag background)
- Smooth zoom functionality (mouse wheel)
- 60 FPS performance during interactions

**Acceptance Criteria:**
- Canvas feels spacious and navigable
- Pan/zoom is smooth with no lag or jitter
- Performance maintains 60 FPS during all interactions
- Pan works by clicking/dragging canvas background
- Zoom centers on mouse cursor position

**Technical Details:**
- Use Konva.Stage for canvas container
- Use Konva.Layer for shapes layer
- Implement pan with stage.draggable()
- Implement zoom with wheel event listener
- Set stage size to 5000x5000px

---

### 3. Rectangle Creation & Manipulation
**Implementation:** Konva.Rect + Firestore sync

**Must Have:**
- Create rectangles by clicking a "Add Rectangle" button
- Click to select rectangle
- Drag to move selected rectangle
- Each rectangle has a solid fill color
- Delete selected rectangle
- Reset canvas to clear all shapes and reset view

**Acceptance Criteria:**
- User can create rectangles with single button click
- Rectangles appear at a default position (e.g., center of viewport)
- User can select rectangles by clicking them
- User can move selected rectangles by dragging
- Each rectangle has a random or predetermined color
- User can delete selected rectangle with confirmation
- User can reset entire canvas with confirmation (clears all shapes, resets view)

**Technical Details:**
- Rectangles spawn at current viewport center
- Default size: 100x80px
- Random colors from predefined palette
- Use Konva click and drag events
- Optimistic updates (update local immediately, sync to Firebase after)

---

### 4. Real-Time Synchronization
**Implementation:** Firestore with real-time listeners

**Must Have:**
- Broadcast rectangle creation to all users
- Broadcast rectangle movements to all users
- Sync latency <100ms for all updates
- Cursor updates throttled to 50ms for smooth movement
- Handle 2+ concurrent users
- "Last write wins" conflict resolution

**Acceptance Criteria:**
- When User A creates a rectangle, User B sees it within 100ms
- When User A moves a rectangle, User B sees it move within 100ms
- System handles simultaneous edits without crashing
- State is consistent across all connected clients

**Technical Details:**
- Firestore collection: `/shapes`
- Use Firestore `onSnapshot()` for real-time updates
- Debounce movement updates (send position after drag ends)
- Use Firestore server timestamp for conflict resolution

**Data Structure:**
```typescript
interface Rectangle {
  id: string;              // auto-generated Firestore doc ID
  x: number;               // position X
  y: number;               // position Y
  width: number;           // default: 100
  height: number;          // default: 80
  fill: string;            // hex color code
  createdBy: string;       // user ID
  createdAt: Timestamp;    // Firestore server timestamp
  updatedAt: Timestamp;    // Firestore server timestamp
}
```

---

### 5. Multiplayer Cursors
**Implementation:** Firebase Realtime Database

**Must Have:**
- Show cursor position for each connected user at their last click or drag end position
- Display username label near cursor
- Smooth cursor movement (no jittering)
- Different color per user
- Hide your own cursor (only show others)

**Acceptance Criteria:**
- Each user sees all other users' cursors at their last interaction point
- Cursors update when users click or finish dragging shapes
- Names are clearly visible next to cursors
- Each cursor has a distinct color
- Cursors update at minimum 10fps (throttled to 100ms)

**Technical Details:**
- Use Firebase Realtime Database (not Firestore) for lower latency
- Database path: `/cursors/{userId}`
- Update cursor position on click events and drag end events
- Throttle cursor position updates to every 100ms
- Use CSS transform for smooth cursor rendering
- Assign user colors deterministically (hash userId to color)

**Data Structure:**
```typescript
interface Cursor {
  userId: string;
  userName: string;
  x: number;              // canvas coordinates
  y: number;              // canvas coordinates
  color: string;          // hex color
  lastUpdated: number;    // timestamp
}
```

---

### 6. Presence Awareness
**Implementation:** Firebase Realtime Database with onDisconnect()

**Must Have:**
- List of currently connected users
- Real-time updates when users join/leave
- Visual indicator in UI (e.g., sidebar or header)
- Show user count

**Acceptance Criteria:**
- Users can see who else is currently in the session
- List updates immediately when someone joins or leaves
- Disconnected users are removed from presence list within 10 seconds

**Technical Details:**
- Database path: `/presence/{userId}`
- Use `onDisconnect().remove()` for automatic cleanup
- Display online users in a fixed UI element
- Show user name and color indicator

**Data Structure:**
```typescript
interface PresenceUser {
  userId: string;
  userName: string;
  color: string;
  joinedAt: number;       // timestamp
}
```

---

### 7. State Persistence
**Implementation:** Firestore for shapes, Realtime DB for ephemeral data

**Must Have:**
- Canvas rectangles save to Firestore
- State persists when all users disconnect
- State loads correctly when users reconnect
- Automatic save (no manual save button needed)

**Acceptance Criteria:**
- All users can leave, then return to see their rectangles
- No data loss on browser refresh
- Canvas state is consistent across disconnects/reconnects
- Loading state shows while fetching initial data

**Technical Details:**
- Shapes persist in Firestore (permanent storage)
- Cursors/presence in Realtime DB (ephemeral, cleared on disconnect)
- Load all shapes on canvas mount
- Show loading spinner until initial data loads

---

### 8. Deployment
**Implementation:** Firebase Hosting

**Must Have:**
- Publicly accessible URL
- Works across different browsers
- Supports 2+ concurrent users
- HTTPS enabled
- Fast global CDN

**Acceptance Criteria:**
- App is deployed and accessible via Firebase URL
- Works in Chrome, Firefox, Safari
- Can handle 2+ simultaneous users without degradation
- No CORS or security issues

**Technical Details:**
- Use `firebase deploy` for deployment
- Configure `firebase.json` for SPA routing
- Set up proper security rules for Firestore and Realtime DB
- Test deployment before MVP submission

---

## Confirmed Tech Stack

### Backend: Firebase
**Services Used:**
- **Firebase Authentication** - Email/password auth
- **Firestore** - Rectangle data persistence
- **Firebase Realtime Database** - Cursor positions and presence
- **Firebase Hosting** - Deployment and CDN

**Why Firebase:**
- All-in-one solution (auth + database + hosting)
- Real-time sync built-in
- Free tier sufficient for MVP
- Fastest implementation path
- Automatic scaling
- Battle-tested for multiplayer apps

### Frontend: React + Konva.js
**Core Libraries:**
- `react` (v18+) - UI framework
- `react-router-dom` - Routing (login/canvas pages)
- `konva` + `react-konva` - Canvas rendering engine
- `firebase` (v9+) - Firebase SDK
- `zustand` or React Context - Client state management
- `tailwindcss` - Utility-first CSS

**Why Konva.js:**
- High-performance canvas rendering
- Built-in shape primitives (rectangles)
- Easy drag-and-drop functionality
- Event handling system
- React integration via react-konva
- Scales to 500+ objects easily

### Development Tools:
- `vite` - Fast build tool (recommended over CRA)
- `typescript` - Type safety
- `eslint` + `prettier` - Code quality

---

## Explicitly OUT OF SCOPE for MVP

### Features NOT Included:
- ❌ Shape rotation
- ❌ Shape resizing
- ❌ Circles, text, or other shape types (ONLY rectangles)
- ❌ Color picker (rectangles use random preset colors)
- ❌ Lines/connectors
- ❌ Layers panel
- ❌ Undo/redo
- ❌ Copy/paste
- ❌ Multi-select (shift-click)
- ❌ Drag-to-select
- ❌ Delete functionality
- ❌ Keyboard shortcuts
- ❌ Visual selection feedback (borders, highlights)
- ❌ Export/save as image
- ❌ Comments or chat
- ❌ Permissions (everyone can edit everything)
- ❌ Multiple canvases/rooms (single shared canvas only)
- ❌ Mobile responsive design (desktop-first)

### Technical Simplifications:
- **Conflict Resolution:** Last write wins (simple, acceptable per brief)
- **Styling:** Basic/minimal UI (focus on functionality)
- **Error Handling:** Basic console logs acceptable
- **Loading States:** Simple spinners only
- **Form Validation:** Minimal (Firebase handles most)

---

## Data Architecture

**Note:** For MVP, all users share a single canvas. No multi-canvas or rooms functionality.

### Firestore Structure
```
/shapes/{shapeId}
  - id: string
  - x: number
  - y: number
  - width: number
  - height: number
  - fill: string
  - createdBy: string
  - createdAt: Timestamp
  - updatedAt: Timestamp
```

### Realtime Database Structure
```
/cursors/{userId}
  - userId: string
  - userName: string
  - x: number
  - y: number
  - color: string
  - lastUpdated: number

/presence/{userId}
  - userId: string
  - userName: string
  - color: string
  - joinedAt: number
```

### Firebase Security Rules (Firestore)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /shapes/{shapeId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      allow delete: if request.auth != null;
    }
  }
}
```

### Firebase Security Rules (Realtime Database)
```json
{
  "rules": {
    "cursors": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "presence": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

## Critical Performance Optimizations

### 1. Cursor Update Throttling
```typescript
// Throttle cursor updates to max 10/second
const CURSOR_THROTTLE_MS = 100;
const throttledUpdateCursor = throttle(
  (x, y) => updateCursorInDatabase(x, y),
  CURSOR_THROTTLE_MS
);
```

### 2. Shape Movement Debouncing
```typescript
// Only sync final position after drag ends
onDragEnd={(e) => {
  const shape = e.target;
  updateShapePosition(shape.id(), shape.x(), shape.y());
}}
```

### 3. Konva Layer Optimization
```typescript
// Use single layer for all rectangles
<Layer>
  {rectangles.map(rect => (
    <Rect key={rect.id} {...rect} />
  ))}
</Layer>
```

### 4. Firestore Batch Writes
```typescript
// If creating multiple rectangles, use batch
const batch = firestore.batch();
// ... add operations
await batch.commit();
```

---

## Development Timeline (24 Hours)

### Phase 1: Foundation (Hours 0-3)
**Goal:** Project setup and deployment pipeline

- [ ] Initialize Vite + React + TypeScript project
- [ ] Install dependencies (firebase, konva, react-konva, tailwind)
- [ ] Create Firebase project in console
- [ ] Set up Firebase config in app
- [ ] Create basic "Hello World" page
- [ ] Deploy to Firebase Hosting
- [ ] Verify public URL works

**Output:** Deployed "Hello World" app

---

### Phase 2: Authentication (Hours 3-6)
**Goal:** Working login/register system

- [ ] Create Login page component
- [ ] Create Register page component
- [ ] Implement Firebase Auth email/password signup
- [ ] Implement Firebase Auth login
- [ ] Add auth state observer
- [ ] Create protected route for canvas
- [ ] Add logout functionality
- [ ] Test with multiple user accounts

**Output:** Users can register, login, and access protected canvas route

---

### Phase 3: Basic Canvas (Hours 6-10)
**Goal:** Single-user canvas with rectangles

- [ ] Create Canvas page component
- [ ] Set up Konva Stage (5000x5000px)
- [ ] Implement pan (draggable stage)
- [ ] Implement zoom (wheel event)
- [ ] Add "Create Rectangle" button
- [ ] Implement rectangle creation (appears at viewport center)
- [ ] Add click-to-select rectangle
- [ ] Add drag-to-move rectangle
- [ ] Test performance (should be 60 FPS)

**Output:** Functional single-user canvas with rectangles

---

### Phase 4: Real-Time Sync (Hours 10-15)
**Goal:** Multi-user rectangle synchronization

- [ ] Design Firestore collection structure
- [ ] Implement Firestore security rules
- [ ] Create rectangle in Firestore on "Create Rectangle" click
- [ ] Load all rectangles from Firestore on mount
- [ ] Set up Firestore `onSnapshot` listener for live updates
- [ ] Update Firestore when rectangle is moved
- [ ] Handle optimistic UI updates
- [ ] Test with 2 browser windows
- [ ] Verify rectangles sync in <100ms
- [ ] Test simultaneous edits (last write wins)

**Output:** Rectangles sync across multiple users in real-time

---

### Phase 5: Multiplayer Cursors (Hours 15-19)
**Goal:** See other users' cursors at their last interaction point

- [ ] Design Realtime Database structure for cursors
- [ ] Track click and drag end events on canvas
- [ ] Throttle cursor updates (100ms)
- [ ] Write cursor position to Realtime DB
- [ ] Listen to other users' cursor positions
- [ ] Render cursor components for each user
- [ ] Add username labels to cursors
- [ ] Assign colors to users (deterministic hash)
- [ ] Hide own cursor (show only others)
- [ ] Test cursor latency (<100ms target)

**Output:** Real-time multiplayer cursors with names

---

### Phase 6: Presence System (Hours 19-21)
**Goal:** Show who's online

- [ ] Design Realtime Database structure for presence
- [ ] Write user to presence on canvas mount
- [ ] Use `onDisconnect().remove()` for auto-cleanup
- [ ] Listen to presence changes
- [ ] Create online users list UI component
- [ ] Display user count and names
- [ ] Show user colors in presence list
- [ ] Test join/leave detection
- [ ] Verify disconnected users removed within 10 seconds

**Output:** Online users list showing who's in the canvas

---

### Phase 7: Testing & Polish (Hours 21-24)
**Goal:** Verify all MVP requirements and fix bugs

- [ ] Test all MVP requirements checklist (see below)
- [ ] Open 2+ browser windows and test collaboration
- [ ] Test in Chrome, Firefox, and Safari
- [ ] Fix any critical bugs
- [ ] Add loading states where missing
- [ ] Verify deployment is stable
- [ ] Test authentication flow
- [ ] Test persistence (refresh browser)
- [ ] Verify 60 FPS during interactions
- [ ] Record 2-minute demo video
- [ ] Prepare for submission

**Output:** Fully functional MVP ready for submission

---

## MVP Requirements Checklist

Before submission, verify ALL items:

### Authentication ✓
- [ ] User can create account with email/password
- [ ] User can log in
- [ ] User stays logged in after refresh

### Canvas Workspace ✓
- [ ] Canvas has pan functionality (click + drag)
- [ ] Canvas has zoom functionality (mouse wheel)
- [ ] Pan and zoom are smooth (60 FPS)
- [ ] Canvas feels spacious (5000x5000px workspace)

### Rectangle Creation & Manipulation ✓
- [ ] User can create rectangles (via button)
- [ ] User can click to select rectangles
- [ ] User can drag to move rectangles

### Real-Time Synchronization ✓
- [ ] Two users see each other's rectangles immediately
- [ ] Rectangle creation syncs across users (<100ms)
- [ ] Rectangle movement syncs across users (<100ms)
- [ ] System handles 2+ concurrent users

### Multiplayer Cursors ✓
- [ ] Each user sees other users' cursors at their last interaction point
- [ ] Cursors update when users click or finish dragging shapes
- [ ] Username labels are visible on cursors
- [ ] Each user has a different cursor color

### Presence Awareness ✓
- [ ] Can see list of currently online users
- [ ] List updates when users join
- [ ] List updates when users leave
- [ ] User count is accurate

### State Persistence ✓
- [ ] Canvas state persists after browser refresh
- [ ] All rectangles still present after all users disconnect
- [ ] State loads correctly when users reconnect

### Deployment ✓
- [ ] App is deployed to public URL
- [ ] Works in Chrome
- [ ] Works in Firefox
- [ ] Works in Safari
- [ ] Can handle 2+ concurrent users

---

## Quick Start Commands

### Initial Setup
```bash
# Create Vite project
npm create vite@latest collabcanvas -- --template react-ts

# Install dependencies
cd collabcanvas
npm install firebase konva react-konva
npm install -D tailwindcss postcss autoprefixer

# Initialize Tailwind
npx tailwindcss init -p

# Install Firebase CLI
npm install -g firebase-tools
firebase login
firebase init
```

### Development
```bash
npm run dev          # Start dev server
npm run build        # Build for production
firebase deploy      # Deploy to Firebase Hosting
```

### Firebase Configuration
```typescript
// src/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  // Your config from Firebase console
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const realtimeDb = getDatabase(app);
```

---

## Success Criteria

**MVP is successful if:**
1. ✅ All checklist items above are complete
2. ✅ App is deployed and publicly accessible
3. ✅ 2+ users can collaborate simultaneously without issues
4. ✅ Performance maintains 60 FPS during interactions
5. ✅ Real-time sync works with <100ms latency
6. ✅ State persists across disconnects

**MVP fails if:**
- ❌ Real-time sync is broken or unreliable
- ❌ Performance drops below 30 FPS
- ❌ Authentication doesn't work
- ❌ State is lost on refresh
- ❌ App is not deployed

---

## Next Steps

1. ✅ **Review this PRD** - Confirm all decisions
2. 🚀 **Create Firebase project** - Set up in console
3. 🚀 **Initialize React project** - Use Vite
4. 🚀 **Deploy "Hello World"** - Verify pipeline works
5. 🚀 **Start Phase 1** - Begin 24-hour sprint!

**Remember:** The MVP is about proving the collaborative infrastructure works. Keep rectangles simple. Focus on real-time sync quality. Ship something that works perfectly with limited features rather than something feature-rich that breaks under load.

**You've got this! 🎨✨**