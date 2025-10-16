# Task List: Enhanced Canvas Features Implementation

Based on PRD: `prd-enhanced-canvas-features.md`

## Relevant Files

- `src/types/index.ts` - Extended type definitions for new shape types (Circle, Text) and enhanced Rectangle
- `src/types/index.test.ts` - Unit tests for new type definitions
- `src/components/canvas/Circle.tsx` - Circle shape component with resize handles
- `src/components/canvas/Circle.test.tsx` - Unit tests for Circle component
- `src/components/canvas/Text.tsx` - Text shape component with inline editing
- `src/components/canvas/Text.test.tsx` - Unit tests for Text component
- `src/components/canvas/ShapeFactory.tsx` - Factory component for rendering different shape types
- `src/components/canvas/ShapeFactory.test.tsx` - Unit tests for ShapeFactory
- `src/components/canvas/Gridlines.tsx` - Gridlines overlay component
- `src/components/canvas/Gridlines.test.tsx` - Unit tests for Gridlines component
- `src/components/layout/PropertiesPane.tsx` - Collapsible properties panel component
- `src/components/layout/PropertiesPane.test.tsx` - Unit tests for PropertiesPane
- `src/components/layout/TopBar.tsx` - Top bar with user controls and zoom
- `src/components/layout/TopBar.test.tsx` - Unit tests for TopBar
- `src/components/layout/BottomToolbar.tsx` - Bottom toolbar with shape creation tools
- `src/components/layout/BottomToolbar.test.tsx` - Unit tests for BottomToolbar
- `src/components/layout/FullScreenLayout.tsx` - Full-screen layout wrapper
- `src/components/layout/FullScreenLayout.test.tsx` - Unit tests for FullScreenLayout
- `src/hooks/useShapesV2.ts` - Enhanced shapes hook with RTDB + Firestore dual sync
- `src/hooks/useShapesV2.test.ts` - Unit tests for useShapesV2 hook
- `src/hooks/useUndoRedo.ts` - Undo/redo functionality hook
- `src/hooks/useUndoRedo.test.ts` - Unit tests for useUndoRedo hook
- `src/hooks/useShapeLocking.ts` - Enhanced shape locking with RTDB
- `src/hooks/useShapeLocking.test.ts` - Unit tests for useShapeLocking hook
- `src/hooks/useCursorContext.ts` - Contextual cursor management hook
- `src/hooks/useCursorContext.test.ts` - Unit tests for useCursorContext hook
- `src/store/canvasStore.ts` - Extended store for new shape types and UI state
- `src/store/canvasStore.test.ts` - Unit tests for extended canvas store
- `src/lib/fonts.ts` - Font management utilities
- `src/lib/fonts.test.ts` - Unit tests for font utilities
- `src/lib/gridlines.ts` - Gridlines calculation utilities
- `src/lib/gridlines.test.ts` - Unit tests for gridlines utilities
- `src/lib/animations.ts` - Animation utilities for smooth transitions
- `src/lib/animations.test.ts` - Unit tests for animation utilities
- `firestore.rules` - Updated security rules for shapes-v2 collection
- `src/__tests__/integration/shapesV2Sync.test.tsx` - Integration tests for new sync system

### Notes

- Unit tests should typically be placed alongside the code files they are testing
- Use `npm run test` to run all tests
- Integration tests focus on RTDB + Firestore synchronization
- Backward compatibility tests ensure existing canvases still work

## Tasks

- [x] 1.0 Extend Shape System for Circles and Text
  - [x] 1.1 Update type definitions to support Circle and Text shapes with enhanced properties
  - [x] 1.2 Create Circle component with resize handles (no rotation) and styling options
  - [x] 1.3 Create Text component with inline editing, font selection, and text formatting
  - [x] 1.4 Create ShapeFactory component to render different shape types dynamically
  - [x] 1.5 Implement font management system with 5 popular fonts (Arial, Helvetica, Times New Roman, Georgia, Verdana)
  - [x] 1.6 Add comprehensive unit tests for all new shape components
  - [x] 1.7 Update existing Rectangle component to work with new shape system

- [ ] 2.0 Implement Full-Screen UI with Floating Components
  - [ ] 2.1 Create FullScreenLayout component with floating UI architecture
  - [ ] 2.2 Build collapsible PropertiesPane component (left by default, movable to right)
  - [ ] 2.3 Implement TopBar with user avatar, zoom dropdown, and share button
  - [ ] 2.4 Create BottomToolbar with shape creation tools (rectangle, circle, text, AI)
  - [ ] 2.5 Add contextual cursor management (grab hand for pan, pointer for shapes, resize cursors)
  - [ ] 2.6 Implement pane positioning logic and state management
  - [ ] 2.7 Add comprehensive unit tests for all layout components

- [ ] 3.0 Enhance Real-time Synchronization with RTDB
  - [ ] 3.1 Create useShapesV2 hook with dual RTDB + Firestore synchronization
  - [ ] 3.2 Implement shape locking system using RTDB for active editing sessions
  - [ ] 3.3 Add real-time position updates via RTDB with Firestore persistence
  - [ ] 3.4 Implement conflict resolution between RTDB and Firestore data
  - [ ] 3.5 Create document version detection for backward compatibility
  - [ ] 3.6 Add proper cleanup and error handling for disconnections
  - [ ] 3.7 Update Firestore security rules for shapes-v2 collection
  - [ ] 3.8 Add comprehensive integration tests for sync system

- [ ] 4.0 Add Visual Enhancements and Professional Features
  - [ ] 4.1 Create Gridlines component with zoom-responsive scaling
  - [ ] 4.2 Implement smooth pan-to-element animations
  - [ ] 4.3 Add visual feedback for all interactive elements (hover, selection, editing states)
  - [ ] 4.4 Create enhanced properties panel with shape-specific controls
  - [ ] 4.5 Implement contextual cursor changes based on interaction mode
  - [ ] 4.6 Add performance optimizations for 60 FPS target
  - [ ] 4.7 Add comprehensive unit tests for visual enhancement components

- [ ] 5.0 Implement Advanced Features (Undo/Redo, AI Agent)
  - [ ] 5.1 Create useUndoRedo hook with action history management
  - [ ] 5.2 Implement undo/redo functionality for all shape operations
  - [ ] 5.3 Create AI agent interface component for properties pane
  - [ ] 5.4 Add AI agent integration to bottom toolbar
  - [ ] 5.5 Implement action history persistence and cleanup
  - [ ] 5.6 Add keyboard shortcuts for undo/redo (Ctrl+Z, Ctrl+Y)
  - [ ] 5.7 Add comprehensive unit tests for advanced features
  - [ ] 5.8 Create migration utilities for existing canvases to access new features
