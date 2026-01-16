'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUser } from '@clerk/nextjs';
import { UserStatus } from '@/types';

interface AccessControlContextType {
  isLoading: boolean;
  canAccess: boolean;
  userStatus: UserStatus | null;
  statusMessage: string;
  refetchStatus: () => Promise<void>;
}

const AccessControlContext = createContext<AccessControlContextType>({
  isLoading: true,
  canAccess: false,
  userStatus: null,
  statusMessage: '',
  refetchStatus: async () => {},
});

export function useAccessControl() {
  return useContext(AccessControlContext);
}

interface AccessControlProviderProps {
  children: ReactNode;
}

export function AccessControlProvider({ children }: AccessControlProviderProps) {
  const { user, isLoaded } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [canAccess, setCanAccess] = useState(false);
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [statusMessage, setStatusMessage] = useState('');

  const checkAndRegisterUser = async () => {
    if (!user) {
      setIsLoading(false);
      setCanAccess(false);
      return;
    }

    try {
      // First check if user exists and their status
      const statusRes = await fetch(`/api/user/status?userId=${user.id}`);
      const statusData = await statusRes.json();

      if (!statusData.exists) {
        // User doesn't exist - register them with pending status
        const registerRes = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            userName: user.fullName || user.firstName || '',
            userEmail: user.emailAddresses[0]?.emailAddress || '',
            userPhone: user.phoneNumbers?.[0]?.phoneNumber || '',
          }),
        });

        const registerData = await registerRes.json();
        setUserStatus(registerData.user?.status || 'pending');
        setCanAccess(false);
        setStatusMessage('Your account is pending approval. Please wait for an administrator to approve your access.');
      } else {
        setUserStatus(statusData.status);
        setCanAccess(statusData.canAccess);
        setStatusMessage(statusData.message || '');
      }
    } catch (error) {
      console.error('Error checking user access:', error);
      setCanAccess(false);
      setStatusMessage('Error checking access status. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded) {
      checkAndRegisterUser();
    }
  }, [user, isLoaded]);

  const refetchStatus = async () => {
    setIsLoading(true);
    await checkAndRegisterUser();
  };

  return (
    <AccessControlContext.Provider value={{ isLoading, canAccess, userStatus, statusMessage, refetchStatus }}>
      {children}
    </AccessControlContext.Provider>
  );
}

// Component to show when user doesn't have access
export function AccessDeniedPage() {
  const { userStatus, statusMessage } = useAccessControl();
  const { user } = useUser();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center bg-yellow-100">
          {userStatus === 'pending' ? (
            <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          )}
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          {userStatus === 'pending' ? 'Account Pending Approval' : 'Access Restricted'}
        </h1>
        
        <p className="text-gray-600 mb-6">{statusMessage}</p>

        {user && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-gray-500 mb-1">Signed in as:</p>
            <p className="font-medium text-gray-800">{user.fullName || user.firstName}</p>
            <p className="text-sm text-gray-600">{user.emailAddresses[0]?.emailAddress}</p>
          </div>
        )}

        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            {userStatus === 'pending' 
              ? 'An administrator will review your request shortly.'
              : 'Please contact an administrator if you believe this is an error.'}
          </p>
          <a 
            href="mailto:admin@minds.org.sg" 
            className="inline-block text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Contact Support →
          </a>
        </div>
      </div>
    </div>
  );
}
