# System Patterns: CollabCanvas Architecture

## Overall Architecture

### Client-Server Architecture
```
Browser (React + Konva) ↔ Firebase (Auth + Firestore + Realtime DB) ↔ Vercel (CDN)
```

### Component Hierarchy
```
App
├── Router
│   ├── LoginPage (Public)
│   └── CanvasPage (Protected)
│       ├── Layout
│       │   ├── LeftColumn (Controls + Auth)
│       │   └── Canvas (Konva Stage)
│       │       ├── Shapes Layer
│       │       └── Cursors Layer
│       └── Hooks (useAuth, useShapes, useCursors, usePresence)
```

## State Management Patterns

### Zustand Store Pattern
```typescript
// Centralized state with actions
const useCanvasStore = create<CanvasState>()(
  persist(
    (set) => ({
      // State
      stagePosition: { x: 0, y: 0 },
      stageScale: 1,
      shapes: [],
      
      // Actions
      updatePosition: (x, y) => set({ stagePosition: { x, y } }),
      addShape: (shape) => set(state => ({ shapes: [...state.shapes, shape] }))
    }),
    { name: 'canvas-store' }
  )
)
```

### Hook-Based Data Fetching
```typescript
// Custom hooks for Firebase integration
const useShapes = () => {
  const [shapes, setShapes] = useState<Shape[]>([])
  
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(firestore, 'shapes'), (snapshot) => {
      setShapes(snapshot.docs.map(doc => doc.data() as Shape))
    })
    return unsubscribe
  }, [])
  
  return { shapes, createShape, updateShape, deleteShape }
}
```

## Real-time Synchronization Patterns

### Firestore for Persistent Data
```typescript
// Shapes collection structure
interface Shape {
  id: string
  x: number
  y: number
  width: number
  height: number
  fill: string
  createdBy: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

// Real-time listener pattern
const unsubscribe = onSnapshot(
  collection(firestore, 'shapes'),
  (snapshot) => {
    const shapes = snapshot.docs.map(doc => doc.data() as Shape)
    setShapes(shapes)
  }
)
```

### Realtime Database for Ephemeral Data
```typescript
// Cursors and presence data
interface Cursor {
  userId: string
  userName: string
  x: number
  y: number
  color: string
  lastUpdated: number
}

// Throttled updates pattern
const throttledUpdateCursor = throttle(
  (x, y) => update(ref(realtimeDb, `cursors/${userId}`), { x, y }),
  100 // 100ms throttle
)
```

## Performance Optimization Patterns

### Throttling and Debouncing
```typescript
// Throttle cursor updates
const throttledUpdateCursor = throttle(updateCursor, 100)

// Debounce shape updates
const debouncedUpdateShape = debounce(updateShape, 300)
```

### Konva Layer Optimization
```typescript
// Single layer for all shapes
<Layer>
  {shapes.map(shape => (
    <Rect key={shape.id} {...shape} />
  ))}
</Layer>
```

### Viewport-Based Filtering
```typescript
// Only render visible cursors
const visibleCursors = cursors.filter(cursor => 
  isCursorInViewport(cursor, viewport)
)
```

## Error Handling Patterns

### Error Boundaries
```typescript
class CanvasErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true }
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback />
    }
    return this.props.children
  }
}
```

### Firebase Error Handling
```typescript
const createShape = async (shape: Shape) => {
  try {
    await addDoc(collection(firestore, 'shapes'), shape)
  } catch (error) {
    console.error('Failed to create shape:', error)
    // Handle error (show notification, retry, etc.)
  }
}
```

## Authentication Patterns

### Protected Routes
```typescript
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  
  if (loading) return <LoadingSpinner />
  return user ? children : <Navigate to="/login" />
}
```

### Auth State Management
```typescript
const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })
    return unsubscribe
  }, [])
  
  return { user, loading, login, logout }
}
```

## Testing Patterns

### Component Testing
```typescript
// Test component behavior in isolation
describe('Rectangle Component', () => {
  it('should call onSelect when clicked', () => {
    const onSelect = vi.fn()
    render(<Rectangle shape={mockShape} onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onSelect).toHaveBeenCalledWith(mockShape.id)
  })
})
```

### Integration Testing
```typescript
// Test Firebase integration with mocks
describe('Shape Synchronization', () => {
  it('should sync shapes across users', async () => {
    const mockDoc = { id: '1', data: () => mockShape }
    mockOnSnapshot.mockImplementation((callback) => {
      callback({ docs: [mockDoc] })
      return () => {}
    })
    
    render(<CanvasPage />)
    expect(screen.getByTestId('shape-1')).toBeInTheDocument()
  })
})
```

## Deployment Patterns

### Environment Configuration
```typescript
// Environment-based configuration
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  // ...
}
```

### Build Optimization
```typescript
// Vite configuration for production
export default defineConfig({
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

## Security Patterns

### Firestore Security Rules
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
  }
}
```

### Input Validation
```typescript
// Validate shape data before saving
const validateShape = (shape: Partial<Shape>): boolean => {
  return (
    typeof shape.x === 'number' &&
    typeof shape.y === 'number' &&
    shape.width > 0 &&
    shape.height > 0
  )
}
```

## Key Design Decisions

### 1. Firebase over Custom Backend
- **Rationale**: Rapid development with built-in real-time features
- **Trade-offs**: Less control, but faster time-to-market

### 2. Konva.js over HTML5 Canvas
- **Rationale**: Better performance and interaction handling
- **Trade-offs**: Additional dependency, but superior UX

### 3. Zustand over Redux
- **Rationale**: Simpler state management for MVP timeline
- **Trade-offs**: Less boilerplate, but fewer dev tools

### 4. Vercel over Firebase Hosting
- **Rationale**: Better developer experience and deployment
- **Trade-offs**: Additional service, but superior DX

### 5. TypeScript throughout
- **Rationale**: Type safety and better development experience
- **Trade-offs**: Additional setup, but fewer runtime errors
