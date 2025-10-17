# Task List: Text Implementation

## Task 1: Create Text Shape Data Structure
**Goal:** Define and implement TextShape interface

**Subtasks:**
- [ ] 1.1: Add `TextShape` interface to types file
- [ ] 1.2: Add text validation (min 0 chars, max 5000 chars)
- [ ] 1.3: Create factory function `createTextShape(x, y)` with defaults
- [ ] 1.4: Update Firestore security rules to allow TextShape type
- [ ] 1.5: Test Firestore write/read with TextShape structure

---

## Task 2: Build Text Toolbar Button
**Goal:** Add text creation trigger

**Subtasks:**
- [ ] 2.1: Add "Text" button to Toolbar component
  - Icon: Letter "T" or text icon
  - Position: after Circle button
  - Active state when text tool selected
- [ ] 2.2: Add text tool to tool selection state
  - Tool types: 'hand' | 'selection' | 'rectangle' | 'circle' | 'text'
- [ ] 2.3: Implement text creation handler
  - Calculate viewport center position
  - Create TextShape with default properties
  - Add to local shapes state
  - Write to Firestore
  - Broadcast to RTDB
  - Immediately enter edit mode with caret visible
- [ ] 2.4: Test text creation flow
  - Click button → text appears at center
  - Text is immediately editable
  - Other users see new text appear

---

## Task 3: Create TextShape Canvas Component
**Goal:** Render text on Konva canvas

**Subtasks:**
- [ ] 3.1: Create `TextShape.tsx` component
  - Render Konva.Text with shape properties
  - Apply fontSize, fontFamily, fontStyle, fill
  - Handle x, y, rotation transforms
- [ ] 3.2: Add click handler for selection
  - Only active when Selection tool enabled
  - Set selectedShapeId on click
  - Show transform handles
- [ ] 3.3: Add double-click handler for edit mode
  - Call `enterEditMode(shape.id, shape.text)`
  - Prevent when Hand tool active
- [ ] 3.4: Make text draggable when selected
  - Enable draggable when selected AND not editing
  - Broadcast position to RTDB during drag
  - Write final position to Firestore on dragEnd
- [ ] 3.5: Integrate with Shapes layer
  - Add TextShape components to Content layer
  - Render after rectangles/circles (z-index)
  - Filter shapes by type === 'text'

---

## Task 4: Implement Inline Text Editor
**Goal:** HTML overlay for editing text content

**Subtasks:**
- [ ] 4.1: Create edit mode state management
  - State: `editingTextId`, `editingText`
  - Functions: `enterEditMode`, `exitEditMode`
- [ ] 4.2: Calculate text position on screen
  - Convert Konva coordinates to screen coordinates
  - Account for canvas pan/zoom/rotation
  - Position HTML input exactly over Konva text
- [ ] 4.3: Create `TextEditor.tsx` overlay component
  - Render textarea absolutely positioned
  - Match font properties (size, family, color)
  - Show border to indicate edit mode
  - Auto-focus with caret visible
- [ ] 4.4: Handle text input changes
  - Update local `editingText` state on change
  - Throttle broadcast to RTDB (200ms)
  - Don't update Firestore yet (wait for commit)
- [ ] 4.5: Handle edit mode exit
  - Blur event → commit changes
  - Enter key (without Shift) → commit changes
  - Escape key → cancel changes (revert to original)
  - Update Firestore on commit
  - Clear RTDB liveUpdate
  - Remove from activeEdits
- [ ] 4.6: Broadcast active editing state
  - Write to RTDB `/activeEdits/{shapeId}` on edit start
  - Include userId, userName, type: 'editing-text'
  - Remove on edit end
- [ ] 4.7: Handle edge cases
  - Another user starts editing same text → show lock indicator
  - Canvas pan/zoom during edit → reposition overlay
  - Text selection (Cmd+A, triple-click, etc.)
  - Empty text allowed (min 0 chars)

---

## Task 5: Add Text Transform Handles
**Goal:** Allow resize and rotation of text shapes

**Subtasks:**
- [ ] 5.1: Extend TransformControls to support text
  - Calculate text bounding box (based on rendered size)
  - Position 8 resize handles around bounding box
  - Position 1 rotation handle above top edge
- [ ] 5.2: Implement text resize
  - Corner handles: resize bounding box
  - Edge handles: resize single dimension
  - Text scales to fit bounding box (fontSize adjusts automatically)
  - OR: Just visual bounding box resize (fontSize stays same) - choose simpler approach
- [ ] 5.3: Implement text rotation
  - Same as rectangle/circle rotation
  - Rotate around text center point
  - Update rotation property on drag
- [ ] 5.4: Handle resize edge case
  - Decide: Does resizing change fontSize OR just bounding box?
  - **Recommendation:** Resizing changes bounding box only for MVP (fontSize stays constant)
  - Future: Scale fontSize proportionally
- [ ] 5.5: Test transform operations
  - Resize text → shape updates
  - Rotate text → shape rotates
  - Live updates visible to other users
  - Final state persists to Firestore

---

## Task 6: Build Text Properties Panel
**Goal:** Edit text properties via sidebar

**Subtasks:**
- [ ] 6.1: Detect when selected shape is text
  - Check `selectedShape?.type === 'text'`
  - Render text-specific property controls
- [ ] 6.2: Add text content input
  - Textarea for multi-line display (even though text is single-line)
  - Value bound to selectedShape.text
  - onChange updates local state + queues Firestore write
  - Debounce Firestore write (300ms)
- [ ] 6.3: Add font family dropdown
  - Options: Arial, Helvetica, Times New Roman, Courier, Georgia
  - Value bound to selectedShape.fontFamily
  - onChange updates immediately
- [ ] 6.4: Add font size input with +/- buttons
  - Number input: range 8-72
  - Increment/decrement buttons (+1, -1)
  - Value bound to selectedShape.fontSize
  - Validate range on input
- [ ] 6.5: Add font style toggle buttons
  - Bold button (B) - toggles bold in fontStyle
  - Italic button (I) - toggles italic in fontStyle
  - Active state styling when enabled
  - Logic: handle all combinations (normal, bold, italic, bold italic)
- [ ] 6.6: Add fill color picker
  - Color input (HTML5 color picker)
  - Value bound to selectedShape.fill
  - onChange updates immediately
- [ ] 6.7: Add common transform properties
  - Position X, Y (number inputs)
  - Rotation (number input, 0-360 degrees)
  - Same as rectangles/circles
- [ ] 6.8: Implement two-way binding
  - Changing property in panel → updates canvas text
  - Selecting different text → panel shows its properties
  - Deselecting text → panel clears/hides
- [ ] 6.9: Sync property changes to Firestore
  - Debounce writes (300ms)
  - Update `updatedAt` timestamp
  - Don't sync during active inline editing

---

## Task 7: Integrate Text with Layers Panel
**Goal:** Show text shapes in layers list

**Subtasks:**
- [ ] 7.1: Add text icon to LayerItem
  - Icon: "T" or text icon
  - Displayed when layer.type === 'text'
- [ ] 7.2: Show text content as layer name
  - Display first 20 chars of text
  - Fallback to "Text" if empty
  - Example: "Hello World..." (truncated with ellipsis)
- [ ] 7.3: Layer click selects text
  - Same behavior as rectangles/circles
  - Updates selectedShapeId
  - Shows transform handles on canvas
- [ ] 7.4: Selected text highlights in layers list
  - Visual indicator when layer is selected
  - Scroll layer into view if needed
- [ ] 7.5: Layers list updates in real-time
  - New text appears in list immediately
  - Text content changes update layer name
  - Deleted text removes from list

---

## Task 8: Test Text Shape with Real-Time Sync
**Goal:** Verify text works in multi-user scenarios

**Subtasks:**
- [ ] 8.1: Test text creation sync
  - User A creates text
  - User B sees text appear immediately
  - Text content, position, style all match
- [ ] 8.2: Test inline editing sync
  - User A edits text inline
  - User B sees live updates while A types (via RTDB)
  - Final text matches after A commits (via Firestore)
- [ ] 8.3: Test properties panel editing sync
  - User A changes font size in panel
  - User B sees text resize in real-time
  - All property changes sync correctly
- [ ] 8.4: Test concurrent editing conflict
  - User A starts editing text inline
  - User B tries to edit same text → blocked with lock indicator
  - User B can edit after A finishes
- [ ] 8.5: Test transform sync
  - User A drags text to new position
  - User B sees smooth movement during drag
  - User A rotates text
  - User B sees rotation update
- [ ] 8.6: Test persistence
  - Users create and edit text
  - All users close browsers
  - Users return → all text is still there
- [ ] 8.7: Test with AI agent
  - AI creates text via command
  - All users see AI-generated text
  - AI can modify text properties

---

## Task 9: Handle Text Edge Cases
**Goal:** Robust text behavior in all scenarios

**Subtasks:**
- [ ] 9.1: Empty text handling
  - Allow empty text (0 characters)
  - Show placeholder or tiny bounding box
  - Don't crash or hide shape
- [ ] 9.2: Very long text handling
  - Limit to 5000 characters
  - Show character count in properties panel
  - Truncate if exceeds limit
- [ ] 9.3: Special characters
  - Support emojis, unicode characters
  - Test with various languages (if time allows)
  - Handle newlines gracefully (strip for single-line)
- [ ] 9.4: Font loading
  - System fonts may not be available on all devices
  - Fallback to safe font if requested font missing
  - Don't crash if font unavailable
- [ ] 9.5: Edit mode edge cases
  - Text edited while another user deletes it → graceful failure
  - Canvas zooms/pans during edit → overlay repositions correctly
  - Text selected while in edit mode → exit edit mode first
- [ ] 9.6: Performance
  - 100+ text shapes → maintain 60 FPS
  - Rapid text editing → no lag or stuttering
  - Large font sizes (72px) → renders correctly

---

## Task 10: Polish Text UX
**Goal:** Make text feel professional and smooth

**Subtasks:**
- [ ] 10.1: Add text creation feedback
  - Button shows active state when text tool selected
  - Cursor changes when text tool active
  - Visual indication that text is in edit mode (border, glow)
- [ ] 10.2: Improve edit mode UX
  - Smooth transition to edit mode (fade in overlay)
  - Clear visual indication of editable area
  - Tooltip or hint: "Press Enter to finish"
- [ ] 10.3: Add keyboard shortcuts
  - T key → select text tool
  - Escape during edit → cancel changes
  - Cmd+Enter → force commit (alternative to blur)
- [ ] 10.4: Properties panel UX
  - Smooth property transitions (fade animations)
  - Disable inputs during active inline edit
  - Show "Editing..." indicator when text is actively edited
- [ ] 10.5: Error handling
  - Firestore write fails → retry or show error message
  - Network disconnects during edit → queue changes for sync
  - Invalid property values → validate and show error

---

## Success Criteria

**Text implementation is complete when:**
- ✅ Users can create text shapes via Toolbar button
- ✅ Text spawns at viewport center with default properties
- ✅ Text immediately enters edit mode with visible caret
- ✅ Double-click text for inline editing
- ✅ Changes sync to other users in real-time during typing
- ✅ Properties panel shows all text controls when text selected
- ✅ All text properties are editable (content, font, size, style, color)
- ✅ Text can be moved, resized, and rotated with handles
- ✅ Text appears in layers panel with correct icon and name
- ✅ Multi-user editing works without conflicts
- ✅ Text persists to Firestore correctly
- ✅ Performance: 100+ text shapes at 60 FPS

---

## Technical Notes

### Font Style Combinations
```
'normal'       → default
'bold'         → bold only
'italic'       → italic only
'bold italic'  → both bold and italic