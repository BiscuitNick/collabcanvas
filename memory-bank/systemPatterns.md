# System Patterns: CollabCanvas Architecture

## Overall Architecture

### Client-Server Pattern
- **Client:** React SPA with Konva.js canvas rendering
- **Server:** Firebase backend (Auth + Firestore + Realtime DB)
- **Communication:** Real-time listeners and optimistic updates

### Component Hierarchy
```
App
├── LoginPage (unauthenticated)
│   ├── GoogleSignIn
│   └── EmailSignIn
└── CanvasPage (authenticated)
    ├── Layout
    │   ├── LeftColumn
    │   │   ├── AuthControls
    │   │   ├── CanvasControls
    │   │   ├── ShapePropertiesPanel
    │   │   └── UsersShapesPanel
    │   └── Canvas
    │       ├── Konva Stage
    │       ├── Rectangle components
    │       └── Cursor components
    └── ErrorBoundary
```

## State Management Patterns

### Zustand Store Pattern
- **Centralized state** in `canvasStore.ts`
- **Actions** for state updates
- **Selectors** for computed values
- **Immer integration** for immutable updates

```typescript
// Store structure
interface CanvasState {
  // Canvas view state
  stagePosition: { x: number; y: number }
  stageScale: number
  
  // Shape state
  shapes: Rectangle[]
  selectedShapeId: string | null
  
  // Interaction state
  isPanning: boolean
  isZooming: boolean
  isDraggingShape: boolean
}
```

### Custom Hooks Pattern
- **useAuth** - Authentication state and methods
- **useShapes** - Firestore integration for shapes
- **useCursors** - Realtime DB integration for cursors
- **usePresence** - User presence tracking

## Data Flow Patterns

### Real-time Synchronization
1. **Optimistic Updates** - Update UI immediately
2. **Firebase Write** - Send changes to backend
3. **Real-time Listener** - Receive updates from other users
4. **Conflict Resolution** - Last write wins with timestamps

### Authentication Flow
1. **User Signs In** - Google or email/password
2. **Auth State Change** - useAuth hook updates
3. **Protected Route** - Redirect to canvas if authenticated
4. **User Context** - Available throughout app

### Shape Management Flow
1. **User Action** - Click "Add Rectangle" or drag shape
2. **Local Update** - Update Zustand store immediately
3. **Firebase Sync** - Send to Firestore with debouncing
4. **Real-time Broadcast** - Other users receive updates
5. **UI Update** - All clients update their canvas

## Performance Patterns

### Canvas Rendering
- **Single Konva Layer** - All shapes on one layer for performance
- **Viewport Culling** - Only render visible shapes
- **Throttled Updates** - Limit update frequency to prevent lag
- **RequestAnimationFrame** - Smooth animations

### Real-time Updates
- **Debounced Writes** - 300ms delay for shape updates
- **Throttled Cursors** - 100ms delay for cursor updates
- **Batch Operations** - Group multiple updates together
- **Connection State** - Handle offline/online transitions

### Memory Management
- **Cleanup on Unmount** - Remove Firebase listeners
- **Garbage Collection** - Clear unused references
- **Event Listener Cleanup** - Remove DOM event listeners

## Error Handling Patterns

### Error Boundaries
- **Canvas Error Boundary** - Catch Konva rendering errors
- **App Error Boundary** - Catch React component errors
- **Graceful Degradation** - Show fallback UI on errors

### Firebase Error Handling
- **Network Errors** - Retry with exponential backoff
- **Permission Errors** - Show user-friendly messages
- **Validation Errors** - Validate data before sending
- **Offline Support** - Queue updates for when online

### User Feedback
- **Loading States** - Show spinners during operations
- **Error Messages** - Clear, actionable error text
- **Success Feedback** - Confirm successful operations
- **Progress Indicators** - Show sync status

## Security Patterns

### Authentication
- **Firebase Auth** - Secure user authentication
- **Protected Routes** - Require authentication for canvas
- **Session Management** - Automatic token refresh
- **Logout Cleanup** - Clear sensitive data on logout

### Data Security
- **Firestore Rules** - Server-side validation
- **User Isolation** - Users can only access their own data
- **Input Validation** - Client and server-side validation
- **HTTPS Only** - Secure data transmission

### CORS and CSP
- **CORS Configuration** - Proper cross-origin setup
- **Content Security Policy** - Prevent XSS attacks
- **Environment Variables** - Keep secrets out of code

## Testing Patterns

### Unit Testing
- **Pure Functions** - Test utils and store actions
- **Component Testing** - Test React components in isolation
- **Mock Dependencies** - Mock Firebase and external APIs
- **Test Coverage** - Focus on critical business logic

### Integration Testing
- **Firebase Integration** - Test real Firebase operations
- **Multi-user Testing** - Test with multiple browser windows
- **Performance Testing** - Validate 60 FPS requirement
- **Cross-browser Testing** - Ensure compatibility

### Test Structure
```typescript
// Test file organization
src/__tests__/
├── setup.ts              // Test configuration
├── utils.test.ts         // Utility functions
├── canvasStore.test.ts   // State management
├── Rectangle.test.tsx    // Component tests
└── integration/
    ├── auth.test.tsx     // Authentication flow
    └── rectangleSync.test.tsx // Real-time sync
```

## Deployment Patterns

### Build Process
- **Vite Build** - Fast, optimized production builds
- **TypeScript Compilation** - Type checking and compilation
- **Asset Optimization** - Minification and compression
- **Environment Variables** - Secure configuration

### Deployment Strategy
- **Vercel Hosting** - Automatic deployments from main branch
- **Firebase Backend** - Separate backend deployment
- **CDN Distribution** - Global content delivery
- **HTTPS Enforcement** - Secure connections only

### Monitoring
- **Error Tracking** - Monitor client-side errors
- **Performance Monitoring** - Track FPS and latency
- **Usage Analytics** - Understand user behavior
- **Uptime Monitoring** - Ensure service availability

## Code Organization Patterns

### File Structure
```
src/
├── components/           # React components
│   ├── auth/            # Authentication components
│   ├── canvas/          # Canvas and shape components
│   ├── multiplayer/     # Cursor and presence components
│   └── layout/          # Layout components
├── hooks/               # Custom React hooks
├── lib/                 # Utilities and configuration
├── pages/               # Page components
├── store/               # Zustand state management
├── types/               # TypeScript type definitions
└── __tests__/           # Test files
```

### Import Patterns
- **Absolute Imports** - Use `src/` prefix for clarity
- **Barrel Exports** - Re-export from index files
- **Type Imports** - Separate type and value imports
- **Dependency Order** - External → Internal → Relative

### Naming Conventions
- **Components** - PascalCase (e.g., `Rectangle`)
- **Hooks** - camelCase starting with 'use' (e.g., `useAuth`)
- **Files** - kebab-case for components, camelCase for utilities
- **Types** - PascalCase with descriptive names (e.g., `Rectangle`)

## Scalability Patterns

### Horizontal Scaling
- **Stateless Client** - No server-side session state
- **Firebase Scaling** - Automatic backend scaling
- **CDN Distribution** - Global content delivery
- **Load Balancing** - Vercel handles traffic distribution

### Performance Scaling
- **Canvas Optimization** - Konva.js handles large object counts
- **Viewport Culling** - Only render visible elements
- **Lazy Loading** - Load components on demand
- **Memory Management** - Proper cleanup and garbage collection

### Feature Scaling
- **Modular Architecture** - Easy to add new features
- **Plugin System** - Extensible shape types
- **Configuration** - Environment-based settings
- **Feature Flags** - Toggle features without deployment
