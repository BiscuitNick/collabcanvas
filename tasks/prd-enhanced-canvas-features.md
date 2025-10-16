# Product Requirements Document: Enhanced Canvas Features

## Introduction/Overview

This PRD outlines the enhancement of CollabCanvas from a rectangle-only collaborative canvas to a full-featured design tool with multiple shape types, improved UI/UX, and advanced real-time synchronization. The goal is to transform the current MVP into a professional-grade collaborative design platform while maintaining backward compatibility and performance standards.

## Goals

1. **Expand Shape Capabilities**: Add text and circle shapes with full editing capabilities
2. **Improve User Experience**: Implement full-screen canvas with floating UI components and contextual interactions
3. **Enhance Real-time Collaboration**: Optimize synchronization using Firebase RTDB for active sessions and Firestore for persistence
4. **Add Professional Features**: Include gridlines, undo/redo, and advanced visual feedback
5. **Maintain Performance**: Ensure 60 FPS performance with expanded feature set
6. **Preserve Backward Compatibility**: Ensure existing rectangle-only canvases continue to work

## User Stories

### Primary User: Designer/Collaborator
- As a designer, I want to create text shapes with customizable fonts and styles so that I can add labels and annotations to my designs
- As a designer, I want to create circle shapes that I can resize and style so that I can build more diverse designs
- As a designer, I want to see a full-screen canvas with floating UI so that I have maximum workspace for my designs
- As a designer, I want to see gridlines that scale with zoom so that I can align elements precisely
- As a designer, I want to undo and redo my actions so that I can experiment without fear of losing work
- As a designer, I want to see real-time updates from other users so that we can collaborate effectively
- As a designer, I want visual feedback (cursor changes) so that I understand what actions I can perform

### Secondary User: Evaluator/Tester
- As an evaluator, I want to test the new features with multiple users to ensure real-time sync works correctly
- As an evaluator, I want to verify that existing canvases still work after the update
- As an evaluator, I want to test performance with many shapes to ensure 60 FPS is maintained

## Functional Requirements

### 1. Shape Management
1.1. The system must support three shape types: rectangles, circles, and text
1.2. Users must be able to create shapes by clicking toolbar icons then clicking on canvas
1.3. All shapes must support click-to-select functionality
1.4. All shapes must support drag-to-move functionality
1.5. Rectangles and circles must support resize handles (no rotation for circles)
1.6. Text shapes must support inline editing (click to edit)
1.7. Text shapes must support font selection from 5 most popular fonts
1.8. Text shapes must support font size, color, and style changes
1.9. All shapes must have properties panel for detailed editing

### 2. User Interface
2.1. The canvas must be full-screen with floating UI components
2.2. A collapsible properties pane must be positioned on the left by default
2.3. Users must be able to move the properties pane to the right side
2.4. The properties pane must show when an object is selected
2.5. The properties pane must show when AI agent is active
2.6. A top bar must contain user avatar, zoom dropdown, and share button
2.7. Zoom controls must be positioned in the opposite corner from the properties pane
2.8. A bottom toolbar must contain shape creation tools (rectangle, circle, text, AI)
2.9. The UI must provide contextual cursor changes (grab hand for pan, pointer for shapes, etc.)

### 3. Real-time Synchronization
3.1. Shape positions during editing must sync to RTDB immediately
3.2. Shape changes must persist to Firestore when editing stops
3.3. Other users must see shape movements in real-time via RTDB
3.4. Resize operations must update at the end of resize, not during
3.5. Selected shapes must be locked to the editing user until deselected or disconnected
3.6. The system must handle user disconnection and lock cleanup
3.7. Existing Firestore documents must remain compatible with new features

### 4. Visual Enhancements
4.1. Toggleable gridlines must display as vertical and horizontal lines forming squares
4.2. Gridlines must scale with zoom level (smaller when zoomed out, bigger when zoomed in)
4.3. Smooth animations must be provided when panning to different elements
4.4. Visual feedback must be provided for all interactive elements
4.5. Contextual cursors must change based on current action (pan, select, resize, etc.)

### 5. Advanced Features
5.1. Undo functionality must allow users to reverse their last action
5.2. Redo functionality must allow users to restore undone actions
5.3. AI agent must be accessible from the bottom toolbar
5.4. AI agent interface must display in the properties pane
5.5. The system must maintain 60 FPS performance with all features enabled
5.6. No maximum limit on number of shapes per canvas

### 6. Backward Compatibility
6.1. Existing rectangle-only canvases must continue to work without modification
6.2. New features must use a separate Firestore collection to prevent deployed app compatibility issues
6.3. Enhanced shapes must be stored in `/shapes-v2` collection while maintaining `/shapes` for existing rectangles
6.4. Migration path must be provided for users to access new features
6.5. Existing API endpoints must remain functional
6.6. The system must detect document version and handle both old and new formats gracefully

## Non-Goals (Out of Scope)

- Multi-select functionality (added to backlog)
- Advanced AI capabilities beyond basic interface
- Shape grouping or layering
- Export/save as image functionality
- Mobile responsive design (desktop-first)
- Shape rotation for circles
- Advanced text formatting (bold, italic, underline)
- Custom font uploads
- Shape templates or presets
- Advanced collaboration features (comments, annotations)

## Design Considerations

### UI Layout
- Full-screen canvas with floating components similar to Figma/design tools
- Collapsible properties pane (left by default, movable to right)
- Top bar with user controls and zoom
- Bottom toolbar with shape creation tools
- Contextual cursors for different interaction modes

### Visual Design
- Clean, minimalist interface with white/light gray theme
- Gridlines that scale with zoom level
- Smooth animations for panning and interactions
- Clear visual feedback for all interactive elements

### Typography
- Support for 5 most popular fonts (Arial, Helvetica, Times New Roman, Georgia, Verdana)
- Font size, color, and style controls
- Inline text editing capability

## Technical Considerations

### Architecture
- Maintain existing React + TypeScript + Konva.js + Firebase stack
- Implement dual synchronization: RTDB for active sessions, Firestore for persistence
- Use existing Zustand store with extensions for new features
- Maintain existing custom hooks pattern

### Performance
- Target 60 FPS performance with all features
- Implement viewport culling for large numbers of shapes
- Use throttling and debouncing for real-time updates
- Optimize Konva.js rendering for multiple shape types

### Data Structure
- Extend existing shape types to support circles and text
- Use separate Firestore collection (`/shapes-v2`) for enhanced shapes
- Maintain existing `/shapes` collection for backward compatibility
- Implement proper locking mechanism for shape editing
- Use RTDB for real-time position updates
- Add document version detection to handle both formats

### Synchronization Strategy
- RTDB: Active editing positions, cursor positions, selection states
- Firestore: Persistent shape data, user presence, final positions
- Conflict resolution: Last write wins with timestamp comparison
- Lock management: Prevent concurrent editing of same shape

## Success Metrics

### Technical Metrics
- Maintain 60 FPS during all interactions
- Real-time updates appear within 100ms
- No performance degradation with 100+ shapes
- Backward compatibility maintained for existing canvases

### User Experience Metrics
- Users can create and edit all three shape types intuitively
- Properties pane provides clear editing controls
- Gridlines improve alignment accuracy
- Undo/redo functionality reduces user frustration

### Collaboration Metrics
- Real-time sync works smoothly with multiple users
- Shape locking prevents conflicts during editing
- Users can collaborate effectively with new features
- No data loss during synchronization

## Open Questions

1. **Font Selection UI**: Should font selection be a dropdown, modal, or inline selector?
2. **Gridline Spacing**: What should be the default grid spacing (e.g., 20px, 50px)?
3. **Animation Duration**: How long should pan-to-element animations take?
4. **Lock Timeout**: How long should a shape remain locked if user disconnects unexpectedly?
5. **Undo History**: How many actions should be stored in undo/redo history?
6. **AI Interface**: Should AI agent have a chat interface or command-based interface?
7. **Error Handling**: How should the system handle RTDB/Firestore sync conflicts?
8. **Migration Strategy**: Should there be a one-time migration for existing users to access new features?

---

**Document Version**: 1.0  
**Created**: December 2024  
**Status**: Ready for Implementation  
**Estimated Effort**: 3-4 weeks development time
