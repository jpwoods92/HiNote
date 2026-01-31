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

    const handleMouseUp = () => {
      // We need a small delay for the selection to be stable
      setTimeout(handleSelectionChange, 10);
    }
    
    // Listen to mouseup to settle the selection
    document.addEventListener('mouseup', handleMouseUp);
    
    // Hide on scroll
    const handleScroll = () => setPosition(null);
    document.addEventListener('scroll', handleScroll);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('scroll', handleScroll);
    };
  }, []);


  const handleHighlightClick = async () => {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      await highlightManager.createHighlight("", selection.getRangeAt(0));
    }
    // Hide the button and clear the selection
    setPosition(null);
    selection?.removeAllRanges();
  };

  if (!position) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        transform: 'translateX(-50%)',
        zIndex: 99999,
      }}
      // Prevent mouseup on the button from clearing the selection before it can be used
      onMouseDown={(e) => e.preventDefault()}
    >
      <button
        onClick={() => void handleHighlightClick()}
        style={{
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
    </div>
  );
};
