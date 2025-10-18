# Technical Context: CollabCanvas

## Technology Stack

### Frontend Technologies
- **React 19.1.1** - UI framework with latest features
- **TypeScript 5.9.3** - Type safety and developer experience
- **Vite 7.1.7** - Fast build tool and dev server
- **Tailwind CSS 4.1.14** - Utility-first CSS framework
- **Zustand 5.0.8** - Lightweight state management

### Canvas and Graphics
- **Konva 10.0.2** - High-performance 2D canvas library
- **react-konva 19.0.10** - React bindings for Konva

### Backend and Database
- **Firebase 12.4.0** - Backend-as-a-Service
  - **Firebase Auth** - User authentication
  - **Firestore** - Document database for shapes
  - **Realtime Database** - Real-time cursors and presence
- **Vercel** - Frontend deployment and CDN

### Development Tools
- **Vitest 3.2.4** - Test runner and framework
- **Testing Library** - Component testing utilities
- **ESLint 9.36.0** - Code linting
- **PostCSS 8.5.6** - CSS processing

## Project Structure

```
collabcanvas/
├── src/
│   ├── components/          # React components
│   │   ├── auth/           # Authentication components
│   │   ├── canvas/         # Canvas and shape components
│   │   ├── multiplayer/    # Cursor and presence components
│   │   ├── layout/         # Layout components
│   │   └── ui/             # Reusable UI components
│   ├── hooks/              # Custom React hooks
│   │   ├── firestore/      # Firestore-specific hooks
│   │   ├── useAuth.ts      # Authentication hook
│   │   ├── useShapes.ts    # Shape management hook
│   │   ├── useCursors.ts   # Cursor tracking hook
│   │   └── usePresence.ts  # User presence hook
│   ├── lib/                # Utilities and configuration
│   │   ├── firebase.ts     # Firebase configuration
│   │   ├── utils.ts        # Utility functions
│   │   ├── constants.ts    # Application constants
│   │   └── config.ts       # Environment configuration
│   ├── pages/              # Page components
│   │   ├── LoginPage.tsx   # Authentication page
│   │   └── CanvasPage.tsx  # Main canvas page
│   ├── store/              # State management
│   │   └── canvasStore.ts  # Zustand store
│   ├── types/              # TypeScript type definitions
│   │   ├── auth/           # Authentication types
│   │   ├── canvas/         # Canvas and shape types
│   │   └── ui/             # UI component types
│   └── __tests__/          # Test files
│       ├── integration/    # Integration tests
│       └── *.test.ts       # Unit and component tests
├── public/                 # Static assets
├── functions/              # Firebase Cloud Functions (Python)
├── memory-bank/            # Project documentation
└── Configuration files
```

## Development Environment

### Prerequisites
- **Node.js 18+** - JavaScript runtime
- **npm** - Package manager
- **Firebase CLI** - Firebase deployment tools
- **Git** - Version control

### Environment Variables
```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com/
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id
```

### Development Commands
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Run tests with UI
npm run test:ui

# Lint code
npm run lint

# Preview production build
npm run preview
```

## Firebase Configuration

### Project Setup
1. **Firebase Project**: `collabcanvas` (or similar)
2. **Authentication**: Google + Email/Password providers
3. **Firestore**: Document database for shapes
4. **Realtime Database**: Cursors and presence data
5. **Hosting**: Vercel (not Firebase Hosting)

### Security Rules

#### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /shapes/{shapeId} {
      allow read, write: if request.auth != null;
    }
    match /cursors/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /presence/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

#### Realtime Database Rules
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

## Performance Considerations

### Canvas Performance
- **Target**: 60 FPS during interactions
- **Optimization**: Single Konva layer for all shapes
- **Throttling**: Cursor updates throttled to 100ms
- **Debouncing**: Shape updates debounced to 300ms

### Memory Management
- **Cleanup**: Proper cleanup of Firebase listeners
- **Pagination**: Not implemented (shapes array grows indefinitely)
- **Garbage Collection**: Automatic cleanup on component unmount

### Network Optimization
- **Throttling**: Prevents excessive API calls
- **Batching**: Firestore batch writes for multiple operations
- **Offline Support**: Pending updates queue for offline operations

## Testing Strategy

### Test Types
1. **Unit Tests** - Individual functions and components
2. **Integration Tests** - Firebase integration and hooks
3. **Component Tests** - React component behavior
4. **Manual Tests** - Real-time features and cross-browser

### Test Files
- `setup.test.ts` - Test environment verification
- `utils.test.ts` - Utility function tests
- `canvasStore.test.ts` - State management tests
- `Rectangle.test.tsx` - Component tests
- `auth.test.tsx` - Authentication integration tests
- `rectangleSync.test.tsx` - Firestore sync tests

### Test Commands
```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run specific test file
npm run test src/__tests__/utils.test.ts
```

## Deployment Configuration

### Vercel Deployment
- **Platform**: Vercel
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**: Configured in Vercel dashboard
- **Custom Domain**: Available through Vercel

### Build Configuration
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          konva: ['konva', 'react-konva'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore']
        }
      }
    }
  }
})
```

## Browser Support

### Supported Browsers
- **Chrome** 90+ - Primary target
- **Firefox** 88+ - Full support
- **Safari** 14+ - Full support
- **Edge** 90+ - Full support

### Mobile Support
- **iOS Safari** 14+ - Basic support
- **Chrome Mobile** 90+ - Full support
- **Responsive Design** - Tailwind CSS responsive utilities

## Security Considerations

### Authentication
- **Firebase Auth** - Secure authentication
- **JWT Tokens** - Automatic token management
- **Session Persistence** - Zustand persistence middleware

### Data Security
- **Firestore Rules** - Server-side validation
- **Input Validation** - Client-side validation
- **HTTPS Only** - All communications encrypted

### Privacy
- **No Data Collection** - No analytics or tracking
- **Local Storage** - Minimal data stored locally
- **Firebase Security** - Google's security infrastructure

## Monitoring and Debugging

### Development Tools
- **React DevTools** - Component inspection
- **Firebase Console** - Database and auth monitoring
- **Browser DevTools** - Performance and network monitoring
- **Vite DevTools** - Build and dependency analysis

### Error Handling
- **Error Boundaries** - React error boundaries
- **Console Logging** - Development logging
- **User Feedback** - Error messages and notifications

## Future Technical Considerations

### Scalability
- **Firebase Limits** - Monitor usage and costs
- **CDN Optimization** - Vercel's global CDN
- **Database Indexing** - Firestore composite indexes

### Performance Improvements
- **Code Splitting** - Lazy loading of components
- **Image Optimization** - If images are added
- **Caching Strategy** - Service worker implementation

### Feature Additions
- **WebRTC** - Peer-to-peer communication
- **WebSockets** - Alternative to Firebase Realtime DB
- **PWA Support** - Progressive Web App features
