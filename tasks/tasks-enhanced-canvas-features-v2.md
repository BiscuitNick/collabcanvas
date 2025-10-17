# Enhanced Canvas Features - Task Breakdown v2

**PRD:** Enhanced Canvas Features - Text and Image Content  
**Timeline:** Phase 2 Implementation  
**Total Tasks:** 12 tasks across 3 phases

---

## Phase 1: Terminology Migration (Shapes → Content)

### Task 1: Update TypeScript Types and Interfaces
**Duration:** 2-3 hours  
**Priority:** High

#### Subtasks:
- [ ] **1.1 Update Base Types**
  - [ ] Rename `BaseShape` to `BaseContent`
  - [ ] Update `ShapeType` to `ContentType`
  - [ ] Update `Shape` union type to `Content`
  - [ ] Update all type guards (`isRectangle` → `isRectangleContent`)

- [ ] **1.2 Update Content-Specific Types**
  - [ ] Rename `Rectangle` to `RectangleContent`
  - [ ] Rename `Circle` to `CircleContent`
  - [ ] Rename `Text` to `TextContent`
  - [ ] Add `ImageContent` interface for future use

- [ ] **1.3 Update Supporting Types**
  - [ ] Update `ShapeCreationOptions` to `ContentCreationOptions`
  - [ ] Update `ShapeProperties` to `ContentProperties`
  - [ ] Update `DEFAULT_SHAPE_VALUES` to `DEFAULT_CONTENT_VALUES`

**Files to Modify:**
- `src/types/canvas/index.ts`

---

### Task 2: Update Store and State Management
**Duration:** 2-3 hours  
**Priority:** High

#### Subtasks:
- [ ] **2.1 Update Canvas Store**
  - [ ] Rename `shapes` to `content` in store state
  - [ ] Update all store actions and selectors
  - [ ] Update store persistence configuration
  - [ ] Update store type definitions

- [ ] **2.2 Update Store Actions**
  - [ ] Rename `addShape` to `addContent`
  - [ ] Rename `updateShape` to `updateContent`
  - [ ] Rename `deleteShape` to `deleteContent`
  - [ ] Update all action implementations

**Files to Modify:**
- `src/store/canvasStore.ts`

---

### Task 3: Update Hooks and Services
**Duration:** 3-4 hours  
**Priority:** High

#### Subtasks:
- [ ] **3.1 Update Content Hooks**
  - [ ] Rename `useShapes` to `useContent`
  - [ ] Update all hook implementations
  - [ ] Update hook return types and interfaces
  - [ ] Update hook documentation

- [ ] **3.2 Update Firestore Integration**
  - [ ] Update Firestore collection references
  - [ ] Update query and listener implementations
  - [ ] Update data transformation functions
  - [ ] Update error handling

- [ ] **3.3 Update Content Locks**
  - [ ] Rename `useShapeLocks` to `useContentLocks`
  - [ ] Update lock management for content types
  - [ ] Update lock conflict resolution

**Files to Modify:**
- `src/hooks/useShapes.ts` → `src/hooks/useContent.ts`
- `src/hooks/useShapeLocks.ts` → `src/hooks/useContentLocks.ts`
- `src/hooks/firestore/useFirestoreSync.ts`

---

### Task 4: Update Components
**Duration:** 4-5 hours  
**Priority:** High

#### Subtasks:
- [ ] **4.1 Update Canvas Components**
  - [ ] Rename `ShapeProperties` to `ContentProperties`
  - [ ] Rename `ShapeCreationForm` to `ContentCreationForm`
  - [ ] Update all component props and interfaces
  - [ ] Update component implementations

- [ ] **4.2 Update Layout Components**
  - [ ] Update `LeftColumn` to use content terminology
  - [ ] Update `UsersShapesPanel` to `UsersContentPanel`
  - [ ] Update all UI text and labels
  - [ ] Update component documentation

- [ ] **4.3 Update Canvas Rendering**
  - [ ] Update `Canvas.tsx` to render content instead of shapes
  - [ ] Update `Rectangle.tsx` and `Circle.tsx` components
  - [ ] Update content selection and manipulation
  - [ ] Update content event handling

**Files to Modify:**
- `src/components/layout/ShapeProperties.tsx` → `ContentProperties.tsx`
- `src/components/layout/ShapeCreationForm.tsx` → `ContentCreationForm.tsx`
- `src/components/layout/LeftColumn.tsx`
- `src/components/layout/UsersShapesPanel.tsx` → `UsersContentPanel.tsx`
- `src/components/canvas/Canvas.tsx`
- `src/components/canvas/Rectangle.tsx`
- `src/components/canvas/Circle.tsx`

---

### Task 5: Update Firestore Schema and Migration
**Duration:** 3-4 hours  
**Priority:** High

#### Subtasks:
- [ ] **5.1 Create Migration Script**
  - [ ] Create script to rename `/shapes` to `/content`
  - [ ] Add content type field to existing records
  - [ ] Preserve all existing data
  - [ ] Add rollback capability

- [ ] **5.2 Update Firestore Rules**
  - [ ] Update security rules for content collection
  - [ ] Add rules for new content types
  - [ ] Test rules with existing data
  - [ ] Deploy updated rules

- [ ] **5.3 Test Migration**
  - [ ] Test migration with existing data
  - [ ] Verify all existing functionality works
  - [ ] Test real-time sync after migration
  - [ ] Verify no data loss

**Files to Create:**
- `scripts/migrate-shapes-to-content.js`
- `firestore-migration-rules.json`

**Files to Modify:**
- `firestore.rules`

---

## Phase 2: Text Content Implementation

### Task 3.0: Create Text Content Types
**Duration:** 1-2 hours  
**Priority:** High

#### Subtasks:
- [ ] **3.0.1 Define Text Content Interface**
  - [ ] Create `TextContent` interface with all required properties
  - [ ] Add text-specific properties (text, fontSize, fontFamily, etc.)
  - [ ] Add text editing state properties (isEditing, editedBy)
  - [ ] Add text validation functions

- [ ] **3.0.2 Add Text Content to Union Types**
  - [ ] Update `Content` union type to include `TextContent`
  - [ ] Add text content type guards (`isTextContent`)
  - [ ] Update content creation options for text
  - [ ] Add text default values to `DEFAULT_CONTENT_VALUES`

- [ ] **3.0.3 Update Content Type System**
  - [ ] Add `TEXT` to `ContentType` enum
  - [ ] Update content type checking throughout codebase
  - [ ] Add text content to content factory functions
  - [ ] Update content validation

**Files to Modify:**
- `src/types/canvas/index.ts`

---

### Task 3.1: Create Text Tool and Properties Panel
**Duration:** 3-4 hours  
**Priority:** High

#### Subtasks:
- [ ] **3.1.1 Create Text Tool Button**
  - [ ] Add text tool as PRIMARY tool in main toolbar (not subtool under Shapes)
  - [ ] Implement text tool selection state
  - [ ] Add text tool visual feedback
  - [ ] Update toolbar layout to show text as primary tool

- [ ] **3.1.2 Create Text Properties Panel**
  - [ ] Create `TextProperties.tsx` component
  - [ ] Add text content editing field
  - [ ] Add font family dropdown
  - [ ] Add font style selection
  - [ ] Add font size input/slider
  - [ ] Add text color picker
  - [ ] Add text alignment controls

- [ ] **3.1.3 Integrate with Content Creation Form**
  - [ ] Update `ContentCreationForm` for text
  - [ ] Add text-specific form fields
  - [ ] Implement text property persistence
  - [ ] Add text validation

**Files to Create:**
- `src/components/canvas/TextProperties.tsx`

**Files to Modify:**
- `src/components/layout/LeftColumn.tsx`
- `src/components/layout/ContentCreationForm.tsx`

---

### Task 3.2: Create Text Rendering Component
**Duration:** 4-5 hours  
**Priority:** High

#### Subtasks:
- [ ] **3.2.1 Create Text Content Component**
  - [ ] Create `TextContent.tsx` component
  - [ ] Implement Konva Text rendering
  - [ ] Add text selection and highlighting
  - [ ] Add text manipulation (move, resize)

- [ ] **3.2.2 Implement Text Editing**
  - [ ] Create `TextEditor.tsx` component
  - [ ] Implement in-place text editing with "hello world" placeholder
  - [ ] Add blinking cursor
  - [ ] Add text selection within editing
  - [ ] Add keyboard navigation

- [ ] **3.2.3 Add Text Styling**
  - [ ] Implement font family rendering
  - [ ] Add font style support (bold, italic)
  - [ ] Add text alignment
  - [ ] Add text wrapping
  - [ ] Add text color and effects

**Files to Create:**
- `src/components/canvas/TextContent.tsx`
- `src/components/canvas/TextEditor.tsx`

---

### Task 3.3: Implement Text Creation and Editing
**Duration:** 4-5 hours  
**Priority:** High

#### Subtasks:
- [ ] **3.3.1 Add Text Creation to Canvas**
  - [ ] Update `Canvas.tsx` for text creation
  - [ ] Implement click-to-create text with "hello world" placeholder (selected by default)
  - [ ] Add text creation state management
  - [ ] Add text positioning logic
  - [ ] Ensure text tool selection persists after creating text

- [ ] **3.3.2 Implement Text Editing Mode**
  - [ ] Add text editing state to store
  - [ ] Implement click with hand/selection tool to edit
  - [ ] Add click-outside to finish editing
  - [ ] Add escape key to cancel editing
  - [ ] Allow user to immediately start typing to replace placeholder

- [ ] **3.3.3 Add Text Input Handling**
  - [ ] Implement keyboard event handling
  - [ ] Add text input validation
  - [ ] Add text cursor positioning
  - [ ] Add text selection within editing
  - [ ] Implement single-line text only (no wrapping)

**Files to Modify:**
- `src/components/canvas/Canvas.tsx`
- `src/store/canvasStore.ts`

---

### Task 3.4: Integrate Text with Sync System
**Duration:** 3-4 hours  
**Priority:** High

#### Subtasks:
- [ ] **3.4.1 Update Content Sync for Text**
  - [ ] Extend `useContent` hook for text
  - [ ] Add text-specific sync logic
  - [ ] Implement text conflict resolution
  - [ ] Add text validation

- [ ] **3.4.2 Implement Text Editing Locks**
  - [ ] Extend `useContentLocks` for text
  - [ ] Add text editing state management
  - [ ] Implement text lock acquisition
  - [ ] Add text lock release

- [ ] **3.4.3 Add Text Real-time Updates**
  - [ ] Implement real-time text sync
  - [ ] Add text editing indicators
  - [ ] Add text conflict resolution
  - [ ] Add text error handling

**Files to Modify:**
- `src/hooks/useContent.ts`
- `src/hooks/useContentLocks.ts`
- `src/hooks/firestore/useFirestoreSync.ts`

---

---

### Task 3.5: Fix Layers Panel Editing
**Duration:** 3-4 hours  
**Priority:** High

#### Subtasks:
- [ ] **3.5.1 Fix Layers Panel Click Handlers**
  - [ ] Fix layers panel click handlers for all content types
  - [ ] Ensure content selection works from layers panel
  - [ ] Add content selection synchronization
  - [ ] Test editing all content types from layers panel

- [ ] **3.5.2 Update Properties Panel Integration**
  - [ ] Ensure properties panel updates when content selected from layers
  - [ ] Add content selection synchronization
  - [ ] Implement consistent editing workflow
  - [ ] Add visual feedback for selected content

- [ ] **3.5.3 Test Layers Panel Functionality**
  - [ ] Test clicking content in layers panel selects it on canvas
  - [ ] Test properties panel shows correct content properties
  - [ ] Test changes in properties panel update content immediately
  - [ ] Test all content types work consistently in layers panel

**Files to Modify:**
- `src/components/layout/UsersContentPanel.tsx`
- `src/components/layout/ContentProperties.tsx`
- `src/components/canvas/Canvas.tsx`

---

## Phase 3: Testing and Polish

### Task 3.6: Update Tests
**Duration:** 3-4 hours  
**Priority:** Medium

#### Subtasks:
- [ ] **3.6.1 Update Unit Tests**
  - [ ] Update store tests for content terminology
  - [ ] Update hook tests for content
  - [ ] Update utility function tests
  - [ ] Add text content tests

- [ ] **3.6.2 Update Integration Tests**
  - [ ] Update Firestore sync tests
  - [ ] Update content creation tests
  - [ ] Update content manipulation tests
  - [ ] Add text editing tests

- [ ] **3.6.3 Update Component Tests**
  - [ ] Update component tests for content
  - [ ] Add text component tests
  - [ ] Update property panel tests
  - [ ] Add text editing tests

**Files to Modify:**
- `src/__tests__/canvasStore.test.ts`
- `src/__tests__/integration/rectangleSync.test.tsx`
- `src/__tests__/Rectangle.test.tsx`

---

### Task 3.7: Performance Optimization
**Duration:** 2-3 hours  
**Priority:** Medium

#### Subtasks:
- [ ] **3.7.1 Optimize Text Rendering**
  - [ ] Implement text rendering optimization
  - [ ] Add text caching
  - [ ] Optimize text re-rendering
  - [ ] Add performance monitoring

- [ ] **3.7.2 Optimize Text Editing**
  - [ ] Optimize text input handling
  - [ ] Add text editing performance monitoring
  - [ ] Optimize text selection
  - [ ] Add text editing throttling

**Files to Modify:**
- `src/components/canvas/TextContent.tsx`
- `src/components/canvas/TextEditor.tsx`

---

### Task 3.8: UI/UX Polish
**Duration:** 2-3 hours  
**Priority:** Medium

#### Subtasks:
- [ ] **3.8.1 Polish Text Tool UI**
  - [ ] Improve text tool visual feedback
  - [ ] Add text tool animations
  - [ ] Improve text properties panel
  - [ ] Add text tool help text

- [ ] **3.8.2 Polish Text Editing Experience**
  - [ ] Improve text editing visual feedback
  - [ ] Add text editing animations
  - [ ] Improve text selection
  - [ ] Add text editing shortcuts

**Files to Modify:**
- `src/components/layout/LeftColumn.tsx`
- `src/components/canvas/TextEditor.tsx`
- `src/components/canvas/TextProperties.tsx`

---

### Task 3.9: Documentation Update
**Duration:** 1-2 hours  
**Priority:** Low

#### Subtasks:
- [ ] **3.9.1 Update Code Documentation**
  - [ ] Update component documentation
  - [ ] Update hook documentation
  - [ ] Update type documentation
  - [ ] Add text content examples

- [ ] **3.9.2 Update User Documentation**
  - [ ] Update README for content terminology
  - [ ] Add text tool usage instructions
  - [ ] Update setup instructions
  - [ ] Add text content examples

**Files to Modify:**
- `README.md`
- `FIREBASE_SETUP_GUIDE.md`
- `memory-bank/` files

---

### Task 3.10: Prepare for Image Content
**Duration:** 1-2 hours  
**Priority:** Low

#### Subtasks:
- [ ] **3.10.1 Add Image Content Types**
  - [ ] Create `ImageContent` interface
  - [ ] Add image content to union types
  - [ ] Add image content type guards
  - [ ] Add image default values

- [ ] **3.10.2 Prepare Image Infrastructure**
  - [ ] Add image content to store
  - [ ] Add image content to sync system
  - [ ] Add image content to properties panel
  - [ ] Add image content placeholders

**Files to Modify:**
- `src/types/canvas/index.ts`
- `src/store/canvasStore.ts`
- `src/components/layout/ContentProperties.tsx`

---

## Implementation Timeline

### Week 1: Phase 1 (Terminology Migration)
- **Days 1-2:** Tasks 1-2 (Types and Store)
- **Days 3-4:** Tasks 3-4 (Hooks and Components)
- **Day 5:** Task 5 (Firestore Migration)

### Week 2: Phase 2 (Text Implementation)
- **Days 1-2:** Tasks 3.0-3.1 (Text Types and Tool)
- **Days 3-4:** Tasks 3.2-3.3 (Text Rendering and Editing)
- **Day 5:** Task 3.4 (Text Sync Integration)

### Week 2.5: Layers Panel Fix
- **Day 1:** Task 3.5 (Fix Layers Panel Editing)

### Week 3: Phase 3 (Testing and Polish)
- **Days 1-2:** Tasks 3.6-3.7 (Tests and Performance)
- **Days 3-4:** Tasks 3.8-3.9 (UI Polish and Documentation)
- **Day 5:** Task 3.10 (Image Preparation)

---

## Success Criteria

### Phase 1 Success
- ✅ All "shape" terminology updated to "content"
- ✅ Existing functionality continues to work
- ✅ Firestore migration completed successfully
- ✅ No data loss during migration

### Phase 2 Success
- ✅ Text tool is functional and intuitive
- ✅ Text editing works with "hello world" placeholder
- ✅ Text properties are adjustable and persistent
- ✅ Text syncs in real-time across users
- ✅ Layers panel editing works for all content types

### Phase 3 Success
- ✅ All tests pass
- ✅ Performance maintains 60 FPS
- ✅ UI/UX is polished and intuitive
- ✅ Documentation is updated and complete

---

## Risk Mitigation

### Technical Risks
- **Migration Complexity**: Incremental approach with rollback capability
- **Text Rendering Performance**: Extensive testing and optimization
- **Real-time Sync Complexity**: Gradual implementation with testing
- **Layers Panel Complexity**: Focus on fixing existing functionality first

### Mitigation Strategies
- **Comprehensive Testing**: Test each phase thoroughly
- **Backward Compatibility**: Maintain compatibility throughout
- **Performance Monitoring**: Monitor performance continuously
- **User Feedback**: Gather feedback during development

---

## Questions for Clarification

1. **Text Placeholder**: Should the "hello world" placeholder be selected by default so users can immediately start typing to replace it?

2. **Text Editing Mode**: When editing text from the properties panel, should it also enter the in-place editing mode on the canvas?

3. **Text Tool Persistence**: Should the text tool stay selected after creating text, or should it return to the selection tool?

4. **Layers Panel Priority**: Should we fix the layers panel editing issue before implementing text, or can we do it in parallel?

5. **Text Wrapping**: Should text support automatic word wrapping within a defined width, or should it be single-line only for the initial implementation?

---

## Next Steps

1. **Review and Approve Updated PRD** - Confirm requirements and approach
2. **Begin Phase 1** - Start with terminology migration
3. **Set up Development Environment** - Ensure all tools are ready
4. **Create Development Branch** - `feature/content-migration`
5. **Begin Implementation** - Start with Task 1

**Ready to begin implementation! 🚀**
