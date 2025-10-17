
import React from 'react';
import type { Text } from '../../types';

interface InlineTextEditorProps {
  shape: Text;
  onTextChange: (newText: string) => void;
  onEditEnd: () => void;
}

const InlineTextEditor: React.FC<InlineTextEditorProps> = ({ shape, onTextChange, onEditEnd }) => {
  return (
    <div
      style={{
        position: 'absolute',
        left: shape.x,
        top: shape.y,
        width: shape.width,
        height: shape.height,
        zIndex: 1000,
        pointerEvents: 'all',
      }}
    >
      <textarea
        value={shape.text}
        onChange={(e) => onTextChange(e.target.value)}
        onBlur={onEditEnd}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onEditEnd();
          }
          if (e.key === 'Escape') {
            onEditEnd();
          }
        }}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          outline: 'none',
          background: 'transparent',
          fontSize: `${shape.fontSize}px`,
          fontFamily: shape.fontFamily,
          fontStyle: shape.fontStyle,
          color: shape.fill,
          textAlign: shape.textAlign as React.CSSProperties['textAlign'],
          resize: 'none',
          padding: '4px',
        }}
        autoFocus
      />
    </div>
  );
};

export default InlineTextEditor;
