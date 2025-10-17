# Enhanced Canvas Features PRD - Text and Image Content

**Project:** CollabCanvas - Enhanced Canvas Content System  
**Timeline:** Phase 2 Implementation  
**Goal:** Add Text and Image content types to the canvas, replacing "Shapes" terminology with "Content"

---

## Executive Summary

This PRD outlines the implementation of enhanced canvas content types, specifically Text and Image elements, while refactoring the existing system to use "Content" terminology instead of "Shapes". The current system supports Rectangle and Circle shapes, and we will expand this to include Text content and prepare for Image content.

## Content Hierarchy

```
Content
├── Shapes
│   ├── Rectangle
│   └── Circle
├── Text
└── Image (Future)
```

## User Stories

### Primary User: Content Creator
- As a content creator, I want to add text to my canvas so that I can create labels, annotations, and descriptions
- As a content creator, I want to format text with different fonts, sizes, and styles so that I can create visually appealing content
- As a content creator, I want to edit text in-place so that I can quickly modify content without switching modes
- As a content creator, I want to see text properties in the toolbar so that I can easily adjust formatting
- As a content creator, I want text to wrap within a defined area so that I can create structured layouts

### Secondary User: Collaborator
- As a collaborator, I want to see text content in real-time so that I can work with others on text-based content
- As a collaborator, I want to edit text that others have created so that we can collaborate on content together
- As a collaborator, I want to see text formatting changes instantly so that I can understand the current state

---

## Feature Requirements

### 1. Terminology Migration: Shapes → Content

#### 1.1 Database Schema Update
**Implementation:** Firestore collection migration

**Must Have:**
- Rename Firestore collection from `/shapes` to `/content`
- Maintain backward compatibility with existing data
- Update all database queries and listeners
- Migrate existing shape data to new schema

**Acceptance Criteria:**
- Existing rectangles and circles continue to work
- New content types use updated schema
- No data loss during migration
- All real-time sync continues to work

**Technical Details:**
- Create migration script for existing data
- Update Firestore security rules
- Maintain type compatibility for existing shapes
- Add content type field to all existing records

#### 1.2 Code Refactoring
**Implementation:** Systematic renaming across codebase

**Must Have:**
- Rename all "shape" references to "content" where appropriate
- Update component names and file names
- Update TypeScript interfaces and types
- Update UI text and labels

**Acceptance Criteria:**
- All code uses consistent "content" terminology
- Existing functionality remains unchanged
- Type safety maintained throughout
- No breaking changes to public APIs

**Technical Details:**
- Update `Shape` type to `Content`
- Rename `useShapes` hook to `useContent`
- Update component props and interfaces
- Maintain backward compatibility

### 2. Text Content Implementation

#### 2.1 Text Tool Integration
**Implementation:** Text tool in toolbar with properties panel

**Must Have:**
- Text tool button in main toolbar
- Text tool selection state management
- Properties panel for text formatting
- Font family, style, size, and color controls

**Acceptance Criteria:**
- Text tool can be selected from toolbar
- Properties panel shows when text tool is selected
- All text properties are adjustable
- Changes apply to new text being created

**Technical Details:**
- Add text tool to `ShapeCreationForm`
- Create text properties panel component
- Implement font selection dropdown
- Add font size slider/input
- Add color picker for text fill

#### 2.2 Text Creation and Editing
**Implementation:** Click-to-create with immediate editing

**Must Have:**
- Click on canvas to create text at cursor position
- Text appears immediately with "hello world" placeholder (selected by default)
- User can immediately start typing to replace placeholder text
- Real-time text rendering as user types
- Click outside to finish editing
- Click existing text with hand/selection tool to edit
- Text tool selection persists after creating text

**Acceptance Criteria:**
- Text appears immediately at click position with placeholder selected
- User can immediately start typing to replace placeholder text
- Text updates in real-time as user types
- Editing mode can be exited by clicking outside
- Existing text can be edited by clicking with hand/selection tool
- Text tool remains selected after creating text

**Technical Details:**
- Implement text input handling on canvas
- Create text editing state management
- Add keyboard event handling
- Implement text selection and cursor positioning
- Add escape key to cancel editing

#### 2.3 Text Properties and Formatting
**Implementation:** Comprehensive text formatting system

**Must Have:**
- Text content editing field in properties panel
- Font family selection (Arial, Helvetica, Times New Roman, Georgia, Verdana)
- Font style selection (Normal, Bold, Italic, Bold Italic)
- Font size adjustment (8px - 72px)
- Text color (fill) selection
- Text alignment (Left, Center, Right, Justify)
- Vertical alignment (Top, Middle, Bottom)

**Acceptance Criteria:**
- Text content can be edited from properties panel
- All text properties are adjustable
- Changes apply to selected text content
- Properties persist when creating new text
- Default values are sensible and consistent

**Technical Details:**
- Create text properties component
- Implement font loading and rendering
- Add text measurement utilities
- Create alignment calculation functions
- Single-line text only (no wrapping)

#### 2.4 Text Rendering and Performance
**Implementation:** Optimized text rendering with Konva

**Must Have:**
- Smooth text rendering at 60 FPS
- Text selection and highlighting
- Cursor positioning and blinking
- Text wrapping within defined bounds
- Real-time updates during editing

**Acceptance Criteria:**
- Text renders smoothly during typing
- Selection highlighting works correctly
- Cursor blinks at correct position
- Text wraps properly within bounds
- Performance remains at 60 FPS

**Technical Details:**
- Use Konva Text component for rendering
- Implement custom text input handling
- Add text measurement and positioning
- Create text selection system
- Optimize re-rendering during editing

### 3. Real-time Text Synchronization

#### 3.1 Text Content Sync
**Implementation:** Firestore integration for text content

**Must Have:**
- Text content syncs across all users in real-time
- Text editing state is properly managed
- Conflict resolution for simultaneous edits
- Optimistic updates for smooth editing

**Acceptance Criteria:**
- Text appears on all users' canvases immediately
- Multiple users can edit different text elements
- Simultaneous edits are handled gracefully
- No data loss during conflicts

**Technical Details:**
- Extend existing sync system for text content
- Implement text-specific conflict resolution
- Add text editing state management
- Create text content validation

#### 3.2 Text Editing State Management
**Implementation:** Collaborative text editing system

**Must Have:**
- Only one user can edit a text element at a time
- Visual indication when text is being edited by another user
- Lock mechanism for text editing
- Automatic lock release when editing is complete

**Acceptance Criteria:**
- Text editing locks prevent conflicts
- Users can see when text is being edited
- Locks are released when editing is complete
- System handles user disconnections gracefully

**Technical Details:**
- Extend existing locking system for text
- Add text editing state to content schema
- Implement lock acquisition and release
- Add visual indicators for locked text

### 4. Fix Layers Panel Editing

#### 4.1 Layers Panel Content Editing
**Implementation:** Enable editing all content types from layers panel

**Must Have:**
- All content types (Rectangle, Circle, Text) editable from layers panel
- Properties panel updates when content is selected from layers
- Real-time updates when content is modified from layers panel
- Consistent editing experience across all content types

**Acceptance Criteria:**
- Clicking content in layers panel selects it on canvas
- Properties panel shows correct content properties
- Changes in properties panel update content immediately
- All content types work consistently in layers panel

**Technical Details:**
- Fix layers panel click handlers
- Ensure properties panel updates for all content types
- Add content selection synchronization
- Implement consistent editing workflow

### 5. Future Image Content Preparation

#### 4.1 Image Content Schema
**Implementation:** Database schema for future image content

**Must Have:**
- Image content type definition
- Image-specific properties (src, width, height, alt)
- Image upload and storage preparation
- Image rendering placeholder

**Acceptance Criteria:**
- Image content type is defined
- Schema supports future image features
- No breaking changes to existing system
- Ready for image implementation

**Technical Details:**
- Add Image interface to content types
- Create image-specific properties
- Add image content to type guards
- Prepare image rendering infrastructure

---

## Technical Implementation

### Database Schema Updates

#### Content Collection Structure
```typescript
// Updated content schema
interface BaseContent {
  id: string;
  type: ContentType;
  x: number;
  y: number;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  syncStatus?: SyncStatus;
  // ... other common properties
}

interface TextContent extends BaseContent {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: FontFamily;
  fontStyle: FontStyle;
  fill: string;
  width: number;
  height: number;
  textAlign: TextAlign;
  verticalAlign: VerticalAlign;
  isEditing?: boolean;
  editedBy?: string;
}

interface ImageContent extends BaseContent {
  type: 'image';
  src: string;
  width: number;
  height: number;
  alt?: string;
  // Future: crop, filters, etc.
}
```

### Component Architecture

#### Text Tool Components
```
src/components/canvas/
├── TextContent.tsx          # Text rendering component
├── TextEditor.tsx           # Text editing component
└── TextProperties.tsx       # Text properties panel

src/components/layout/
├── ContentCreationForm.tsx  # Updated from ShapeCreationForm
└── ContentProperties.tsx    # Updated from ShapeProperties
```

#### Content Management
```
src/hooks/
├── useContent.ts            # Updated from useShapes
└── useContentLocks.ts       # Updated from useShapeLocks

src/store/
└── contentStore.ts          # Updated from canvasStore
```

### Migration Strategy

#### Phase 1: Terminology Update
1. Update TypeScript types and interfaces
2. Rename components and files
3. Update Firestore collection name
4. Migrate existing data
5. Update UI text and labels

#### Phase 2: Text Implementation
1. Implement text tool and properties
2. Create text rendering component
3. Add text editing functionality
4. Integrate with sync system
5. Add text-specific features

#### Phase 3: Testing and Polish
1. Test text creation and editing
2. Test real-time synchronization
3. Test performance and optimization
4. Polish UI and UX
5. Prepare for image content

---

## Success Criteria

### Functional Requirements
- ✅ Text tool is available in toolbar
- ✅ Text can be created by clicking on canvas
- ✅ Text editing works in-place with blinking cursor
- ✅ Text properties are adjustable and persistent
- ✅ Text syncs in real-time across users
- ✅ Text editing locks prevent conflicts
- ✅ All existing functionality continues to work

### Performance Requirements
- ✅ 60 FPS maintained during text editing
- ✅ Text rendering is smooth and responsive
- ✅ Real-time sync latency <100ms
- ✅ No memory leaks during text editing

### User Experience Requirements
- ✅ Text creation is intuitive and immediate
- ✅ Text editing feels natural and responsive
- ✅ Properties panel is easy to use
- ✅ Visual feedback is clear and helpful

---

## Risk Assessment

### Technical Risks
- **Text Rendering Performance**: Konva text rendering may impact performance
- **Real-time Sync Complexity**: Text editing state management is complex
- **Migration Complexity**: Updating terminology across entire codebase

### Mitigation Strategies
- **Performance Testing**: Extensive testing with large amounts of text
- **Incremental Implementation**: Implement text features gradually
- **Backward Compatibility**: Maintain compatibility during migration

---

## Future Enhancements

### Text Features
- Rich text formatting (bold, italic, underline)
- Text effects (shadows, outlines, gradients)
- Text animations and transitions
- Text search and replace
- Text templates and styles

### Image Features
- Image upload and management
- Image editing tools (crop, resize, filters)
- Image annotations and markup
- Image galleries and libraries
- Image optimization and compression

### Content Features
- Content grouping and layers
- Content templates and libraries
- Content versioning and history
- Content export and import
- Content collaboration tools

---

## Conclusion

This PRD provides a comprehensive plan for enhancing CollabCanvas with text content and preparing for image content. The phased approach ensures a smooth transition while maintaining existing functionality and performance.

The terminology migration from "Shapes" to "Content" provides a more accurate and extensible foundation for future content types, while the text implementation adds essential functionality for creating rich, collaborative content.

**Ready to begin implementation with Phase 1: Terminology Update.**