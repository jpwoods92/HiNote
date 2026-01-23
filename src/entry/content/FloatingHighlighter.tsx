import React, { useEffect, useState } from 'react';
import { highlightManager } from './HighlightManager';

export const FloatingHighlighter: React.FC = () => {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      
      // Validation: Collapsed or empty
      if (!selection || selection.isCollapsed || !selection.toString().trim()) {
        setPosition(null);
        return;
      }

      // Validation: Inside input/textarea
      const anchorNode = selection.anchorNode;
      const element = anchorNode?.nodeType === Node.ELEMENT_NODE 
        ? anchorNode as HTMLElement 
        : anchorNode?.parentElement;
        
      if (element && (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.isContentEditable)) {
        setPosition(null);
        return;
      }

      // Calculate Position
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      // Show button above the selection, centered
      setPosition({
        x: rect.left + (rect.width / 2),
        y: rect.top + window.scrollY - 40 // 40px above
      });
    };

    // Listen to mouseup to settle the selection
    document.addEventListener('mouseup', handleSelectionChange);
    document.addEventListener('keyup', handleSelectionChange); // For keyboard selection

    return () => {
      document.removeEventListener('mouseup', handleSelectionChange);
      document.removeEventListener('keyup', handleSelectionChange);
    };
  }, []);

  if (!position) return null;

  return (
    <button
      onClick={async () => {
        await highlightManager.createHighlight();
        setPosition(null);
      }}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        transform: 'translateX(-50%)',
        zIndex: 99999,
        padding: '8px 16px',
        backgroundColor: '#333',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
        fontWeight: 'bold',
        fontSize: '14px'
      }}
    >
      Highlight
    </button>
  );
};
