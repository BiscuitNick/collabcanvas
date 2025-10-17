import React, { useRef, useEffect, useState, memo } from 'react';
import { Text as KonvaText, Transformer } from 'react-konva';
import Konva from 'konva';
import type { Text } from '../../types';
import { MIN_SHAPE_SIZE, MAX_SHAPE_SIZE } from '../../lib/constants';
import { useShapeInteraction } from './hooks/useShapeInteraction';
import InlineTextEditor from './InlineTextEditor';

interface TextProps {
  shape: Text;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<Text>) => void;
  onDragMove?: (x: number, y: number) => void;
  onDragEnd: (x: number, y: number) => void;
  onDragStart: () => void;
  onDragEndCallback: () => void;
  currentUserId?: string;
}

const TextComponent: React.FC<TextProps> = memo(
  ({
    shape,
    isSelected,
    onSelect,
    onUpdate,
    onDragMove,
    onDragEnd,
    onDragStart,
    onDragEndCallback,
    currentUserId,
  }) => {
    const textRef = useRef<Konva.Text>(null);
    const transformerRef = useRef<Konva.Transformer>(null);
    const [isEditing, setIsEditing] = useState(false);

    const isLockedByOther = shape.lockedByUserId && shape.lockedByUserId !== currentUserId;

    const { handleDragStart, handleDragMove, handleDragEnd, handleTransformEnd } = useShapeInteraction({
      shape,
      onDragMove,
      onDragEnd,
      onDragStart,
      onDragEndCallback,
      onUpdate,
    });

    useEffect(() => {
      if (isSelected && transformerRef.current && textRef.current) {
        try {
          transformerRef.current.nodes([textRef.current]);
          transformerRef.current.getLayer()?.batchDraw();
        } catch (error: unknown) {
          console.warn('Transformer setup failed:', error);
        }
      }
    }, [isSelected]);

    const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
      e.cancelBubble = true;
      if (e.evt?.detail === 2) {
        if (!isLockedByOther) {
          setIsEditing(true);
        }
      } else {
        if (isLockedByOther) {
          console.log('👁️ Viewing locked text details:', shape.lockedByUserName);
        }
        onSelect();
      }
    };

    const handleTextChange = (newText: string) => {
      onUpdate({ text: newText });
    };

    const handleEditEnd = () => {
      setIsEditing(false);
    };

    return (
      <>
        <KonvaText
          ref={textRef}
          x={shape.x}
          y={shape.y}
          width={shape.width}
          height={shape.height}
          text={shape.text}
          fontSize={shape.fontSize}
          fontFamily={shape.fontFamily}
          fontStyle={shape.fontStyle}
          fill={shape.fill}
          align={shape.textAlign}
          verticalAlign={shape.verticalAlign}
          wrap="word"
          shadowColor="rgba(0, 0, 0, 0.1)"
          shadowBlur={4}
          shadowOffset={{ x: 2, y: 2 }}
          shadowOpacity={0.3}
          draggable={isSelected && !isLockedByOther && !isEditing}
          onClick={handleClick}
          onTap={handleClick}
          onDragStart={isSelected && !isLockedByOther && !isEditing ? handleDragStart : undefined}
          onDragMove={isSelected && !isLockedByOther && !isEditing ? handleDragMove : undefined}
          onDragEnd={isSelected && !isLockedByOther && !isEditing ? handleDragEnd : undefined}
          onTransformStart={isSelected && !isLockedByOther && !isEditing ? () => {} : undefined}
          onTransformEnd={isSelected && !isLockedByOther && !isEditing ? () => textRef.current && handleTransformEnd(textRef.current) : undefined}
          onMouseEnter={(e: Konva.KonvaEventObject<MouseEvent>) => {
            try {
              const container = e.target.getStage()?.container();
              if (container) {
                container.style.cursor = isLockedByOther ? 'not-allowed' : isEditing ? 'text' : 'pointer';
              }
            } catch {
              // ignore
            }
          }}
          onMouseLeave={(e: Konva.KonvaEventObject<MouseEvent>) => {
            try {
              const container = e.target.getStage()?.container();
              if (container) {
                container.style.cursor = 'default';
              }
            } catch {
              // ignore
            }
          }}
        />
        {isSelected && !isLockedByOther && !isEditing && (
          <Transformer
            ref={transformerRef}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < MIN_SHAPE_SIZE || newBox.height < MIN_SHAPE_SIZE) {
                return oldBox;
              }
              if (newBox.width > MAX_SHAPE_SIZE || newBox.height > MAX_SHAPE_SIZE) {
                return oldBox;
              }
              return newBox;
            }}
            keepRatio={false}
            enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'top-center', 'bottom-center', 'left-center', 'right-center']}
            anchorSize={8}
            anchorStroke="#007AFF"
            anchorFill="#FFFFFF"
            anchorStrokeWidth={2}
            borderStroke={isLockedByOther ? shape.lockedByUserColor || '#FF0000' : '#007AFF'}
            borderStrokeWidth={isLockedByOther ? Math.min(20, ((shape.width + shape.height) / 2) * 0.1) : 2}
            borderDash={[5, 5]}
            rotateEnabled={false}
          />
        )}
        {isEditing && <InlineTextEditor shape={shape} onTextChange={handleTextChange} onEditEnd={handleEditEnd} />}
      </>
    );
  }
);

TextComponent.displayName = 'TextComponent';

export default TextComponent;