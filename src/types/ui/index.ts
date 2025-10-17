
import { FontFamily, FontStyle } from '../canvas';

// Interaction state type
export interface InteractionState {
  isPanning: boolean;
  isZooming: boolean;
  isDraggingShape: boolean;
  isResizingShape: boolean;
  isEditingText: boolean;
}

// UI state for enhanced features
export interface UIState {
  // Properties pane state
  propertiesPaneVisible: boolean;
  propertiesPanePosition: 'left' | 'right';
  selectedShapeId: string | null;

  // Gridlines state
  gridlinesVisible: boolean;
  gridlinesSpacing: number;

  // AI agent state
  aiAgentActive: boolean;

  // Undo/redo state
  canUndo: boolean;
  canRedo: boolean;
}

// Cursor context type for different interaction modes
export const CursorContext = {
  DEFAULT: 'default',
  GRAB: 'grab',
  GRABBING: 'grabbing',
  POINTER: 'pointer',
  RESIZE: 'nw-resize', // Generic resize cursor
  RESIZE_NW: 'nw-resize',
  RESIZE_NE: 'ne-resize',
  RESIZE_SW: 'sw-resize',
  RESIZE_SE: 'se-resize',
  RESIZE_N: 'n-resize',
  RESIZE_S: 's-resize',
  RESIZE_W: 'w-resize',
  RESIZE_E: 'e-resize',
  ROTATE: 'grab', // Rotation cursor
  ZOOM: 'zoom-in', // Zoom cursor
  TEXT: 'text',
  NOT_ALLOWED: 'not-allowed',
  WAIT: 'wait',
  CROSSHAIR: 'crosshair',
} as const;

export type CursorContext = (typeof CursorContext)[keyof typeof CursorContext];

// Animation configuration
export interface AnimationConfig {
  duration: number;
  easing: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
  delay?: number;
}

// Gridlines configuration
export interface GridlinesConfig {
  visible: boolean;
  spacing: number;
  color: string;
  opacity: number;
  strokeWidth: number;
}

// Font configuration for text shapes
export interface FontConfig {
  family: FontFamily;
  size: number;
  style: FontStyle;
  color: string;
}
