'use client';

import { ReactNode } from 'react';
import { useUser } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import { AccessControlProvider, useAccessControl, AccessDeniedPage } from './AccessControlProvider';

interface AccessControlWrapperProps {
  children: ReactNode;
}

function AccessControlContent({ children }: AccessControlWrapperProps) {
  const { user, isLoaded } = useUser();
  const { isLoading, canAccess, userStatus } = useAccessControl();
  const pathname = usePathname();

  // Public routes that don't require access control
  const publicRoutes = ['/admin', '/api'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // If it's a public route (like admin), skip access control
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // If user is not signed in, show content normally (Clerk handles auth)
  if (isLoaded && !user) {
    return <>{children}</>;
  }

  // Show loading state while checking access
  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Checking access...</p>
        </div>
      </div>
    );
  }

  // If user is signed in but doesn't have access (pending or restricted)
  if (user && !canAccess && (userStatus === 'pending' || userStatus === 'restricted')) {
    return <AccessDeniedPage />;
  }

  // User has access, show the content
  return <>{children}</>;
}

export function AccessControlWrapper({ children }: AccessControlWrapperProps) {
  return (
    <AccessControlProvider>
      <AccessControlContent>{children}</AccessControlContent>
    </AccessControlProvider>
  );
}
