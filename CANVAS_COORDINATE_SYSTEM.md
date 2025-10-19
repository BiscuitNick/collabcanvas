# Canvas Coordinate System Documentation

## Table of Contents
1. [Overview](#overview)
2. [Coordinate System Fundamentals](#coordinate-system-fundamentals)
3. [Coordinate Transformations](#coordinate-transformations)
4. [Mouse Event Handling](#mouse-event-handling)
5. [Panning](#panning)
6. [Zooming](#zooming)
7. [Pan-to-Content Functionality](#pan-to-content-functionality)
8. [Animation System](#animation-system)
9. [Touch Events](#touch-events)

---

## Overview

CollabCanvas uses a **center-origin coordinate system** where the canvas center is at `(0, 0)`. This differs from the traditional top-left origin system used by most graphics libraries.

### Key Concepts
- **Viewport**: The visible area of the browser window (screen space)
- **Canvas Space**: The infinite 2D plane where content is placed (center is 0,0)
- **Stage Position**: The offset of the canvas relative to the viewport
- **Stage Scale**: The zoom level (1.0 = 100%, 2.0 = 200%, 0.5 = 50%)

---

## Coordinate System Fundamentals

### Canvas Coordinates vs Viewport Coordinates

```
Viewport (Screen Space)          Canvas Space
┌─────────────────┐
│ (0,0)           │              (-∞, -∞)
│                 │                  ↑
│                 │                  │
│     [View]      │         ←────(0,0)────→
│                 │                  │
│                 │                  ↓
└─────────────────┘              (+∞, +∞)
```

### The Transform Equation

The fundamental equation relating viewport coordinates to canvas coordinates:

```javascript
// Viewport to Canvas (what you see → where it is on canvas)
canvasX = (viewportX - stagePosition.x) / stageScale
canvasY = (viewportY - stagePosition.y) / stageScale

// Canvas to Viewport (where it is on canvas → what you see)
viewportX = stagePosition.x + (canvasX * stageScale)
viewportY = stagePosition.y + (canvasY * stageScale)
```

### Example

Given:
- Stage Position: `(400, 300)`
- Stage Scale: `1.5` (150% zoom)
- Viewport Point: `(500, 400)` (mouse position)

Calculate Canvas Point:
```javascript
canvasX = (500 - 400) / 1.5 = 66.67
canvasY = (400 - 300) / 1.5 = 66.67
// Canvas coordinate: (66.67, 66.67)
```

---

## Coordinate Transformations

### Using Konva's Transform API

```javascript
const stage = stageRef.current;
const pointer = stage.getPointerPosition(); // Viewport coordinates

// Get transform matrix and invert it
const transform = stage.getAbsoluteTransform().copy().invert();

// Transform viewport point to canvas coordinates
const canvasPoint = transform.point({ x: pointer.x, y: pointer.y });
```

**Implementation:** `src/components/canvas/hooks/useInteractionHandling.ts:160-161`

---

## Mouse Event Handling

### Click Events

```javascript
const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
  const stage = e.target.getStage();
  const pointerPosition = stage.getPointerPosition(); // Viewport coords

  // Convert to canvas coordinates
  const transform = stage.getAbsoluteTransform().copy().invert();
  const canvasPoint = transform.point({
    x: pointerPosition.x,
    y: pointerPosition.y
  });

  // Now canvasPoint contains the actual canvas coordinates
  console.log('Clicked at canvas position:', canvasPoint);
};
```

**Implementation:** `src/components/canvas/hooks/useInteractionHandling.ts:146-193`

### Mouse Move Events

```javascript
const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
  const stage = e.target.getStage();
  const pointer = stage.getPointerPosition();

  if (pointer) {
    const transform = stage.getAbsoluteTransform().copy().invert();
    const canvasPoint = transform.point({ x: pointer.x, y: pointer.y });

    // Update cursor position in canvas coordinates
    onMouseMove(canvasPoint.x, canvasPoint.y, width, height);
  }
};
```

**Implementation:** `src/components/canvas/hooks/useInteractionHandling.ts:195-207`

---

## Panning

### Manual Panning (Dragging)

When the user drags the canvas, Konva's built-in dragging updates the stage position:

```javascript
const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
  const stage = e.target.getStage();

  // Update the store with new position (instant, no animation)
  updatePosition(stage.x(), stage.y());
};
```

**Implementation:** `src/components/canvas/hooks/useInteractionHandling.ts:70-76`

### Programmatic Panning (Instant)

Used when users edit X/Y coordinates directly:

```javascript
const handleXChange = (value: number) => {
  const viewportWidth = window.innerWidth;

  // Calculate stage position to show this canvas X at viewport center
  // viewportCenter = stagePosition + canvasPoint * scale
  // stagePosition = viewportCenter - canvasPoint * scale
  const newStageX = (viewportWidth / 2) - (value * stageScale);

  updatePosition(newStageX, stagePosition.y); // Instant jump
};
```

**Implementation:** `src/components/layout/PositionWidget.tsx:45-55`

### Animated Panning

Used for user-triggered navigation (layers panel, reset view):

```javascript
const handlePanToContent = (x: number, y: number) => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Calculate stage position to center content on viewport
  const desiredX = (viewportWidth / 2) - (x * stageScale);
  const desiredY = (viewportHeight / 2) - (y * stageScale);

  updatePositionAnimated(desiredX, desiredY); // Smooth animation
};
```

**Implementation:** `src/components/layout/FullScreenLayout.tsx:252-261`

---

## Zooming

### Zoom-to-Point (Mouse Wheel)

The most complex transformation - zooms while keeping the point under the cursor stationary:

```javascript
const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
  const pointer = stage.getPointerPosition(); // Where the mouse is
  const oldScale = stageScale;
  const newScale = calculateNewScale(e.evt.deltaY);

  // Step 1: Find what canvas point is currently under the pointer
  // Canvas point = (viewport point - stage position) / old scale
  const canvasPointX = (pointer.x - stagePosition.x) / oldScale;
  const canvasPointY = (pointer.y - stagePosition.y) / oldScale;

  // Step 2: Calculate new stage position to keep that canvas point
  // under the pointer after scaling
  // viewport point = stage position + canvas point * new scale
  // stage position = viewport point - canvas point * new scale
  const newStageX = pointer.x - (canvasPointX * newScale);
  const newStageY = pointer.y - (canvasPointY * newScale);

  updateScale(newScale);
  updatePosition(newStageX, newStageY);
};
```

**Why this works:**
1. We identify the canvas coordinate under the mouse cursor
2. We apply the new scale
3. We reposition the stage so that same canvas coordinate is still under the cursor

**Implementation:** `src/components/canvas/hooks/useInteractionHandling.ts:107-144`

### Zoom Levels

- **Minimum:** 5% (0.05)
- **Maximum:** 300% (3.0)
- **Default:** 100% (1.0)

Zoom steps are adaptive based on current zoom level (see `getZoomStep` in `src/lib/utils.ts`).

---

## Pan-to-Content Functionality

### Clicking Content in Layers Panel

When a user clicks a content item in the layers panel, the canvas smoothly pans to center that content:

```javascript
// In DraggablePropertiesPane.tsx
const handleHeaderClick = (shapeId: string) => {
  const shape = content.find(c => c.id === shapeId);
  if (shape && onPanToContent) {
    onPanToContent(shape.x, shape.y); // Triggers animated pan
  }
};
```

**Implementation:** `src/components/layout/DraggablePropertiesPane.tsx:42-57`

### Reset View

Centers the canvas on origin (0,0) at 100% zoom:

```javascript
const handleResetPosition = () => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Position stage so (0,0) is at viewport center
  const centerX = viewportWidth / 2;
  const centerY = viewportHeight / 2;

  updatePositionAnimated(centerX, centerY); // Smooth animation
  updateScale(1); // Reset to 100%
};
```

**Implementation:** `src/components/layout/PositionWidget.tsx:87-97`

---

## Animation System

### Overview

The animation system uses `requestAnimationFrame` for smooth 60fps animations with cubic easing.

### Animation Control Flow

```javascript
// 1. User triggers animated pan
updatePositionAnimated(targetX, targetY);

// 2. Store updates state
set({
  stagePosition: { x: targetX, y: targetY },
  shouldAnimatePan: true
});

// 3. useSmoothPanning hook detects change
useEffect(() => {
  if (shouldAnimate) {
    // Start animation
    animateToPosition(targetX, targetY);
  } else {
    // Jump instantly
    stage.x(targetX);
    stage.y(targetY);
  }
}, [targetX, targetY, shouldAnimate]);
```

### Animation vs Instant Updates

| Action | Method | Animated? |
|--------|--------|-----------|
| Click layer item | `updatePositionAnimated()` | ✅ Yes (300ms) |
| Reset view button | `updatePositionAnimated()` | ✅ Yes (300ms) |
| Drag canvas | `updatePosition()` | ❌ No |
| Edit X/Y input | `updatePosition()` | ❌ No |
| Zoom (wheel) | `updatePosition()` | ❌ No |

### Easing Function

```javascript
const EASING_FUNCTION = (t: number): number => {
  // Cubic ease-out for smooth deceleration
  return 1 - Math.pow(1 - t, 3);
};
```

**Implementation:** `src/components/canvas/hooks/useSmoothPanning.ts:14-17`

---

## Touch Events

### Pinch-to-Zoom (Two Fingers)

```javascript
const handleTouchMove = (e: Konva.KonvaEventObject<TouchEvent>) => {
  const touches = e.evt.touches;

  if (touches.length === 2) { // Two fingers
    const distance = getTouchDistance(touches);
    const center = getTouchCenter(touches);

    // Calculate scale change
    const scaleBy = distance / lastTouchDistance;
    const newScale = stageScale * scaleBy;

    // Apply zoom centered at pinch center
    const stageCenter = { x: center.x - rect.left, y: center.y - rect.top };
    const mousePointTo = {
      x: (stageCenter.x - stagePosition.x) / stageScale,
      y: (stageCenter.y - stagePosition.y) / stageScale
    };

    const newPos = {
      x: stageCenter.x - mousePointTo.x * newScale,
      y: stageCenter.y - mousePointTo.y * newScale
    };

    updateScale(newScale);
    updatePosition(newPos.x, newPos.y);
  }
};
```

**Implementation:** `src/components/canvas/hooks/useInteractionHandling.ts:241-277`

### Single-Finger Pan

```javascript
if (touches.length === 1 && isPanning) {
  const touch = touches[0];
  const stage = e.target.getStage();
  const rect = stage.container().getBoundingClientRect();

  // Update position based on touch location
  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;

  updatePosition(x, y);
}
```

**Implementation:** `src/components/canvas/hooks/useInteractionHandling.ts:244-253`

---

## Quick Reference

### Common Operations

**Get viewport center in canvas coordinates:**
```javascript
const viewportCenterX = (window.innerWidth / 2 - stagePosition.x) / stageScale;
const viewportCenterY = (window.innerHeight / 2 - stagePosition.y) / stageScale;
```

**Center canvas point at viewport center:**
```javascript
const newStageX = (window.innerWidth / 2) - (canvasX * stageScale);
const newStageY = (window.innerHeight / 2) - (canvasY * stageScale);
updatePosition(newStageX, newStageY);
```

**Convert mouse position to canvas coordinates:**
```javascript
const transform = stage.getAbsoluteTransform().copy().invert();
const canvasPoint = transform.point({ x: mouseX, y: mouseY });
```

---

## File Reference

| Component | File Path | Responsibility |
|-----------|-----------|----------------|
| Canvas Store | `src/store/canvasStore.ts` | State management for position/scale |
| Interaction Handling | `src/components/canvas/hooks/useInteractionHandling.ts` | Mouse/touch events, zoom, pan |
| Smooth Panning | `src/components/canvas/hooks/useSmoothPanning.ts` | Animation system |
| Position Widget | `src/components/layout/PositionWidget.tsx` | X/Y/Zoom controls |
| Layers Panel | `src/components/layout/DraggablePropertiesPane.tsx` | Pan-to-content |
| Canvas Component | `src/components/canvas/Canvas.tsx` | Main canvas rendering |

---

## Debugging Tips

1. **Check coordinate transformations:**
   ```javascript
   console.log('Viewport:', pointer.x, pointer.y);
   console.log('Canvas:', canvasPoint.x, canvasPoint.y);
   console.log('Stage pos:', stagePosition.x, stagePosition.y);
   console.log('Scale:', stageScale);
   ```

2. **Verify stage position is controlled by hook:**
   - The Stage component should NOT have `x` or `y` props
   - Position is controlled entirely by `useSmoothPanning`

3. **Test animation flag:**
   ```javascript
   console.log('Should animate:', shouldAnimatePan);
   ```

4. **Common issues:**
   - Content not centered: Check if canvas coordinates are truly center-origin
   - Zoom jumping: Verify canvas point calculation in zoom logic
   - Animation not working: Ensure `shouldAnimatePan` is being set correctly
