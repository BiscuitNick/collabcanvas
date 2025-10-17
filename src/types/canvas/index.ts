
// Base content interface with common properties
export interface BaseContent {
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
  // Content type and version for enhanced content
  type: ContentType;
  version: ContentVersion;
}

// Content type enum
export const ContentType = {
  RECTANGLE: 'rectangle',
  CIRCLE: 'circle',
  IMAGE: 'image',
} as const;

export type ContentType = (typeof ContentType)[keyof typeof ContentType];

// Content version enum for backward compatibility
export const ContentVersion = {
  V1: 'v1', // Original rectangles
  V2: 'v2', // Enhanced content with new features
} as const;

export type ContentVersion = (typeof ContentVersion)[keyof typeof ContentVersion];

// Rectangle content type for canvas with Firestore integration (backward compatible)
export interface RectangleContent extends BaseContent {
  type: typeof ContentType.RECTANGLE;
  width: number;
  height: number;
  rotation: number;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  // Corner radius for rounded rectangles
  cornerRadius?: number;
}

// Circle content type for enhanced content
export interface CircleContent extends BaseContent {
  type: typeof ContentType.CIRCLE;
  radius: number;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
}


// Image content type for future implementation
export interface ImageContent extends BaseContent {
  type: typeof ContentType.IMAGE;
  src: string;
  width: number;
  height: number;
  alt?: string;
  // Future: crop, filters, etc.
}


// Union type for all content
export type Content = RectangleContent | CircleContent | ImageContent;

// Type guards for content type checking
export const isRectangleContent = (content: Content): content is RectangleContent => content.type === ContentType.RECTANGLE;

export const isCircleContent = (content: Content): content is CircleContent => content.type === ContentType.CIRCLE;


export const isImageContent = (content: Content): content is ImageContent => content.type === ContentType.IMAGE;


// Enhanced content properties for properties panel
export interface ContentProperties {
  // Common properties
  id: string;
  x: number;
  y: number;
  fill: string;
  // Content-specific properties
  width?: number;
  height?: number;
  radius?: number;
  rotation?: number;
  cornerRadius?: number;
  stroke?: string;
  strokeWidth?: number;
  // Image properties
  src?: string;
  alt?: string;
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

// Content creation options
export interface ContentCreationOptions {
  type: ContentType;
  x: number;
  y: number;
  // Default properties for each content type
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
  image?: {
    src: string;
    width: number;
    height: number;
    alt?: string;
  };
}


// Default values for content creation
export const DEFAULT_CONTENT_VALUES = {
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
  image: {
    src: '',
    width: 100,
    height: 100,
    alt: 'Image',
  },
} as const;

// Legacy exports for backward compatibility during migration
export type Shape = Content;
export type Rectangle = RectangleContent;
export type Circle = CircleContent;
export const ShapeType = ContentType;
export type ShapeType = ContentType;
export const ShapeVersion = ContentVersion;
export type ShapeVersion = ContentVersion;
export const isRectangle = isRectangleContent;
export const isCircle = isCircleContent;
export const DEFAULT_SHAPE_VALUES = DEFAULT_CONTENT_VALUES;

