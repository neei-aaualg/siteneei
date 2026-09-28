import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
  children: React.ReactNode;
  lockScroll?: boolean;
}

let scrollLockCount = 0;
let originalOverflowStyle = '';

export const Portal: React.FC<PortalProps> = ({ children, lockScroll = true }) => {
  useEffect(() => {
    if (!lockScroll || typeof document === 'undefined') return;

    if (scrollLockCount === 0) {
      originalOverflowStyle = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    scrollLockCount++;

    return () => {
      scrollLockCount = Math.max(0, scrollLockCount - 1);
      if (scrollLockCount === 0 && typeof document !== 'undefined') {
        document.body.style.overflow = originalOverflowStyle;
      }
    };
  }, [lockScroll]);

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(children, document.body);
};

export default Portal;
