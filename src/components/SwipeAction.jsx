import React, { useState, useRef, useEffect } from 'react';

/**
 * SwipeAction component
 * Provides horizontal swipe functionality for list items.
 * 
 * Props:
 * - children: The content of the item
 * - onSwipeLeft: Callback when swiped far left (Delete)
 * - onSwipeRight: Callback when swiped far right (Edit)
 * - leftAction: Component to show behind when swiping left
 * - rightAction: Component to show behind when swiping right
 * - threshold: Distance to trigger action (default 100)
 */
const SwipeAction = ({ 
  children, 
  onSwipeLeft, 
  onSwipeRight, 
  leftAction, 
  rightAction, 
  threshold = 80 
}) => {
  const [translateX, setTranslateX] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const touchStart = useRef({ x: 0, y: 0 });
  const isSwiping = useRef(false);
  const currentTranslateX = useRef(0);

  const onStart = (x, y) => {
    touchStart.current = { x, y };
    isSwiping.current = false;
    setIsAnimating(false);
  };

  const onMove = (x, y, e) => {
    const deltaX = x - touchStart.current.x;
    const deltaY = y - touchStart.current.y;

    if (!isSwiping.current) {
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
        isSwiping.current = true;
        setIsDragging(true);
      } else if (Math.abs(deltaY) > 10) {
        return;
      }
    }

    if (isSwiping.current) {
      if (e.cancelable) e.preventDefault();
      let newX = deltaX;
      if (deltaX > 0 && !onSwipeRight) newX = deltaX * 0.2;
      if (deltaX < 0 && !onSwipeLeft) newX = deltaX * 0.2;
      setTranslateX(newX);
      currentTranslateX.current = newX;
    }
  };

  const onEnd = () => {
    setIsDragging(false);
    if (!isSwiping.current) return;
    setIsAnimating(true);
    const finalX = currentTranslateX.current;
    
    console.log(`Swipe end: finalX=${finalX}, threshold=${threshold}`);

    if (finalX < -threshold && onSwipeLeft) {
      console.log("Triggering onSwipeLeft via threshold");
      handleTriggerLeft();
    } else if (finalX > threshold && onSwipeRight) {
      console.log("Triggering onSwipeRight via threshold");
      handleTriggerRight();
    } else {
      console.log("Springing back");
      setTranslateX(0);
      currentTranslateX.current = 0;
    }
    isSwiping.current = false;
  };

  const handleTriggerLeft = () => {
    setTranslateX(-window.innerWidth);
    currentTranslateX.current = -window.innerWidth;
    setTimeout(() => {
      onSwipeLeft?.();
      setTranslateX(0);
      currentTranslateX.current = 0;
    }, 300);
  };

  const handleTriggerRight = () => {
    setTranslateX(0);
    currentTranslateX.current = 0;
    onSwipeRight?.();
  };

  const onTouchStart = (e) => onStart(e.touches[0].clientX, e.touches[0].clientY);
  const onTouchMove = (e) => onMove(e.touches[0].clientX, e.touches[0].clientY, e);
  const onTouchEnd = onEnd;

  const onMouseDown = (e) => {
    if (e.button !== 0) return; // Only left click
    onStart(e.clientX, e.clientY);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const onMouseMove = (e) => onMove(e.clientX, e.clientY, e);
  const onMouseUp = () => {
    onEnd();
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  };

  return (
    <div style={{ position: 'relative', overflow: 'hidden', width: '100%', userSelect: 'none' }}>
      {/* Background Actions */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 0,
      }}>
        {/* Right Action (revealed when swiping right) - EDIT */}
        <div 
          onClick={handleTriggerRight}
          style={{
            height: '100%',
            width: Math.max(0, translateX),
            background: 'var(--color-primary-glass, #18524A22)',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 20,
            opacity: translateX > 20 ? 1 : 0,
            transition: 'opacity 0.2s',
            borderRadius: '24px 0 0 24px',
            cursor: 'pointer'
          }}
        >
          {rightAction}
        </div>

        {/* Left Action (revealed when swiping left) - DELETE */}
        <div 
          onClick={handleTriggerLeft}
          style={{
            height: '100%',
            width: Math.max(0, -translateX),
            background: 'rgba(239, 68, 68, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingRight: 20,
            opacity: translateX < -20 ? 1 : 0,
            transition: 'opacity 0.2s',
            borderRadius: '0 24px 24px 0',
            marginLeft: 'auto',
            cursor: 'pointer'
          }}
        >
          {leftAction}
        </div>
      </div>

      {/* Main Content */}
      <div 
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isAnimating ? 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' : 'none',
          background: 'var(--color-surface)',
          position: 'relative',
          zIndex: 1,
          width: '100%',
          cursor: isDragging ? 'grabbing' : 'pointer',
          touchAction: 'pan-y'
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default SwipeAction;
