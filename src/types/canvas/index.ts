
// Base shape interface with common properties
export interface BaseShape {
  id: string;
  x: number;
  y: number;
  createdBy: string;
  createdAt: number | Date; // Firestore Timestamp can be Date object too
  updatedAt: number | Date; // Firestore Timestamp can be Date object too
  syncStatus?: SyncStatus; // Local sync state
  // Visual properties
  opacity?: number; // 0-1, default 1
  rotation?: number; // degrees, default 0
  // Collaborative locking (optional)
  lockedByUserId?: string | null;
  lockedByUserName?: string | null;
  lockedByUserColor?: string | null;
  lockedAt?: number | Date | null;
  // Shape type and version for enhanced shapes
  type: ShapeType;
  version: ShapeVersion;
}

// Shape type enum
export const ShapeType = {
  RECTANGLE: 'rectangle',
  CIRCLE: 'circle',
  TEXT: 'text',
} as const;

export type ShapeType = (typeof ShapeType)[keyof typeof ShapeType];

// Shape version enum for backward compatibility
export const ShapeVersion = {
  V1: 'v1', // Original rectangles
  V2: 'v2', // Enhanced shapes with new features
} as const;

export type ShapeVersion = (typeof ShapeVersion)[keyof typeof ShapeVersion];

// Rectangle type for canvas with Firestore integration (backward compatible)
export interface Rectangle extends BaseShape {
  type: typeof ShapeType.RECTANGLE;
  width: number;
  height: number;
  rotation: number;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  // Corner radius for rounded rectangles
  cornerRadius?: number;
}

// Circle type for enhanced shapes
export interface Circle extends BaseShape {
  type: typeof ShapeType.CIRCLE;
  radius: number;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
}

// Text type for enhanced shapes
export interface Text extends BaseShape {
  type: typeof ShapeType.TEXT;
  text: string;
  fontSize: number;
  fontFamily: FontFamily;
  fontStyle: FontStyle;
  fill: string;
  width: number; // Text box width for wrapping
  height: number; // Text box height
  textAlign: TextAlign;
  verticalAlign: VerticalAlign;
}

// Font family enum with 5 most popular fonts
export const FontFamily = {
  ARIAL: 'Arial',
  HELVETICA: 'Helvetica',
  TIMES_NEW_ROMAN: 'Times New Roman',
  GEORGIA: 'Georgia',
  VERDANA: 'Verdana',
} as const;

export type FontFamily = (typeof FontFamily)[keyof typeof FontFamily];

// Font style enum
export const FontStyle = {
  NORMAL: 'normal',
  BOLD: 'bold',
  ITALIC: 'italic',
  BOLD_ITALIC: 'bold italic',
} as const;

export type FontStyle = (typeof FontStyle)[keyof typeof FontStyle];

// Text alignment enum
export const TextAlign = {
  LEFT: 'left',
  CENTER: 'center',
  RIGHT: 'right',
  JUSTIFY: 'justify',
} as const;

export type TextAlign = (typeof TextAlign)[keyof typeof TextAlign];

// Vertical alignment enum
export const VerticalAlign = {
  TOP: 'top',
  MIDDLE: 'middle',
  BOTTOM: 'bottom',
} as const;

export type VerticalAlign = (typeof VerticalAlign)[keyof typeof VerticalAlign];

// Union type for all shapes
export type Shape = Rectangle | Circle | Text;

// Type guards for shape type checking
export const isRectangle = (shape: Shape): shape is Rectangle => shape.type === ShapeType.RECTANGLE;

export const isCircle = (shape: Shape): shape is Circle => shape.type === ShapeType.CIRCLE;

export const isText = (shape: Shape): shape is Text => shape.type === ShapeType.TEXT;

// Enhanced shape properties for properties panel
export interface ShapeProperties {
  // Common properties
  id: string;
  x: number;
  y: number;
  fill: string;
  // Shape-specific properties
  width?: number;
  height?: number;
  radius?: number;
  rotation?: number;
  cornerRadius?: number;
  stroke?: string;
  strokeWidth?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: FontFamily;
  fontStyle?: FontStyle;
  textAlign?: TextAlign;
  verticalAlign?: VerticalAlign;
}

// Sync status enum
export const SyncStatus = {
  SYNCED: 'synced',
  PENDING: 'pending',
  CONFLICT: 'conflict',
  ERROR: 'error',
} as const;

export type SyncStatus = (typeof SyncStatus)[keyof typeof SyncStatus];

// Cursor type for multiplayer cursors
export interface Cursor {
  userId: string;
  userName: string;
  x: number;
  y: number;
  color: string;
  lastUpdated: number;
  isVisible?: boolean; // Whether cursor is within current viewport
  isCurrentUser?: boolean; // Whether this is the current user's cursor
}

// Presence user type for online users
export interface PresenceUser {
  userId: string;
  userName: string;
  color: string;
  joinedAt: number | Date; // Firestore Timestamp can be Date object too
  lastSeen?: number | Date; // Firestore Timestamp can be Date object too
}

// Stage configuration type
export interface StageConfig {
  x: number;
  y: number;
  scale: number;
}

// Shape creation options
export interface ShapeCreationOptions {
  type: ShapeType;
  x: number;
  y: number;
  // Default properties for each shape type
  rectangle?: {
    width: number;
    height: number;
    fill: string;
    cornerRadius?: number;
  };
  circle?: {
    radius: number;
    fill: string;
    stroke?: string;
    strokeWidth?: number;
  };
  text?: {
    text: string;
    fontSize: number;
    fontFamily: FontFamily;
    fontStyle: FontStyle;
    fill: string;
    width: number;
    height: number;
    textAlign: TextAlign;
    verticalAlign: VerticalAlign;
  };
}

// Default values for shape creation
export const DEFAULT_SHAPE_VALUES = {
  rectangle: {
    width: 100,
    height: 60,
    fill: '#3b82f6',
    stroke: '#1e40af',
    strokeWidth: 2,
    opacity: 1,
    rotation: 0,
  },
  circle: {
    radius: 50,
    fill: '#10b981',
    stroke: '#047857',
    strokeWidth: 2,
    opacity: 1,
    rotation: 0,
  },
  text: {
    text: 'Text',
    fontSize: 16,
    fontFamily: 'Arial' as FontFamily,
    fontStyle: 'normal' as FontStyle,
    textAlign: 'left' as TextAlign,
    verticalAlign: 'top' as VerticalAlign,
    fill: '#000000',
    stroke: '#000000',
    strokeWidth: 0,
    opacity: 1,
    rotation: 0,
  },
} as const;
