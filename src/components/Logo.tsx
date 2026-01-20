'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Logo component with hidden admin access
 * Click the logo 5 times rapidly (within 2 seconds) to access the admin panel
 * Single clicks navigate to the home page as normal
 */
export function LogoWithHiddenAccess() {
  const router = useRouter();
  const clickCount = useRef(0);
  const lastClickTime = useRef(0);
  
  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const now = Date.now();
    
    // Reset count if more than 2 seconds since last click
    if (now - lastClickTime.current > 2000) {
      clickCount.current = 0;
    }
    
    lastClickTime.current = now;
    clickCount.current += 1;
    
    // After 5 rapid clicks, redirect to admin
    if (clickCount.current >= 5) {
      clickCount.current = 0;
      router.push('/admin');
    } else {
      // Normal click - go to home
      router.push('/');
    }
  };
  
  return (
    <button 
      onClick={handleLogoClick}
      className="text-xl font-bold text-blue-600 hover:text-blue-700 transition-colors"
    >
      MINDS Singapore
    </button>
  );
}
