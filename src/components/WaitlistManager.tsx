'use client';

import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { Event, Registration } from '@/types';

interface WaitlistManagerProps {
  event: Event;
  onClose: () => void;
  onRefresh: () => void;
}

export default function WaitlistManager({ event, onClose, onRefresh }: WaitlistManagerProps) {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [waitlist, setWaitlist] = useState<Registration[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [promoting, setPromoting] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [approving, setApproving] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);

  // Helper function to get the display name (participant name if caregiver, otherwise user name)
  const getDisplayName = (registration: Registration): string => {
    return registration.isCaregiver && registration.participantName 
      ? registration.participantName 
      : registration.userName;
  };

  // Helper function to safely format dates
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      const date = parseISO(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return format(date, 'MMM d, yyyy h:mm a');
    } catch {
      return 'N/A';
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [event.id]);

  const fetchRegistrations = async () => {
    try {
      const response = await fetch(`/api/registrations?eventId=${event.id}`);
      const data = await response.json();
      
      const allRegs = data.registrations || [];
      
      // Separate into three categories:
      // 1. Registered participants (status='registered')
      // 2. Approved waitlist (status='waitlist' AND has waitlistPosition)
      // 3. Pending requests (status='waitlist' AND no waitlistPosition)
      const registered = allRegs.filter((r: Registration) => 
        r.status === 'registered' && r.registrationType === 'participant'
      );
      const approved = allRegs.filter((r: Registration) => 
        r.status === 'waitlist' && 
        r.registrationType === 'participant' &&
        r.waitlistPosition !== undefined
      ).sort((a: Registration, b: Registration) => 
        (a.waitlistPosition || 0) - (b.waitlistPosition || 0)
      );
      const pending = allRegs.filter((r: Registration) => 
        r.status === 'waitlist' && 
        r.registrationType === 'participant' &&
        r.waitlistPosition === undefined
      );
      
      setRegistrations(registered);
      setWaitlist(approved);
      setPendingRequests(pending);
    } catch (error) {
      console.error('Error fetching registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteFromWaitlist = async (registration: Registration) => {
    if (!confirm(`Promote ${getDisplayName(registration)} from waitlist to registered?`)) {
      return;
    }

    setPromoting(registration.id);
    try {
      const response = await fetch('/api/registrations/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId: registration.id,
          eventId: event.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to promote from waitlist');
      }

      await fetchRegistrations();
      onRefresh();
      alert(`${getDisplayName(registration)} has been promoted from the waitlist!`);
    } catch (error) {
      console.error('Error promoting from waitlist:', error);
      alert('Failed to promote from waitlist. Please try again.');
    } finally {
      setPromoting(null);
    }
  };

  const handleCancelRegistration = async (registration: Registration) => {
    if (!confirm(`Cancel registration for ${getDisplayName(registration)}? This will open a spot and allow promoting someone from the waitlist.`)) {
      return;
    }

    setCancelling(registration.id);
    try {
      const response = await fetch(`/api/registrations/${registration.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Cancel registration error:', errorData);
        throw new Error(errorData.error || 'Failed to cancel registration');
      }

      await fetchRegistrations();
      onRefresh();
      alert(`Registration for ${getDisplayName(registration)} has been cancelled. You can now promote someone from the waitlist.`);
    } catch (error) {
      console.error('Error cancelling registration:', error);
      alert('Failed to cancel registration. Please try again.');
    } finally {
      setCancelling(null);
    }
  };

  const handleApproveRequest = async (registration: Registration) => {
    if (!confirm(`Add ${getDisplayName(registration)} to the waitlist?`)) {
      return;
    }

    setApproving(registration.id);
    try {
      // Calculate next waitlist position
      const nextPosition = waitlist.length + 1;
      
      const response = await fetch('/api/registrations/approve-waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId: registration.id,
          eventId: event.id,
          waitlistPosition: nextPosition,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve waitlist request');
      }

      await fetchRegistrations();
      onRefresh();
      alert(`${getDisplayName(registration)} has been added to the waitlist at position ${nextPosition}!`);
    } catch (error) {
      console.error('Error approving waitlist request:', error);
      alert('Failed to approve request. Please try again.');
    } finally {
      setApproving(null);
    }
  };

  const handleRejectRequest = async (registration: Registration) => {
    if (!confirm(`Reject waitlist request from ${getDisplayName(registration)}?`)) {
      return;
    }

    setRejecting(registration.id);
    try {
      const response = await fetch('/api/registrations/reject-waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId: registration.id,
          eventId: event.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject waitlist request');
      }

      await fetchRegistrations();
      onRefresh();
      alert(`Waitlist request from ${getDisplayName(registration)} has been rejected.`);
    } catch (error) {
      console.error('Error rejecting waitlist request:', error);
      alert('Failed to reject request. Please try again.');
    } finally {
      setRejecting(null);
    }
  };

  const spotsAvailable = event.capacity ? event.capacity - registrations.length : 0;
  const canPromote = spotsAvailable > 0 && waitlist.length > 0;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl p-6">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">Waitlist Management</h2>
            <p className="text-sm text-gray-600 mt-1">{event.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Capacity Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-900">{event.capacity || 'N/A'}</div>
                <div className="text-xs text-blue-700">Total Capacity</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-900">{registrations.length}</div>
                <div className="text-xs text-green-700">Registered</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-900">{waitlist.length}</div>
                <div className="text-xs text-yellow-700">On Waitlist</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-900">{pendingRequests.length}</div>
                <div className="text-xs text-purple-700">Pending Requests</div>
              </div>
            </div>
            {spotsAvailable > 0 && (
              <div className="mt-3 text-center text-sm font-medium text-green-700">
                {spotsAvailable} {spotsAvailable === 1 ? 'spot' : 'spots'} available for promotion
              </div>
            )}
          </div>

          {/* Registered Participants */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Registered Participants ({registrations.length})
            </h3>
            {registrations.length === 0 ? (
              <p className="text-gray-500 text-sm">No registered participants yet.</p>
            ) : (
              <div className="space-y-2">
                {registrations.map((reg) => (
                  <div key={reg.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{getDisplayName(reg)}</div>
                      <div className="text-sm text-gray-500">{reg.userEmail} • {reg.userPhone}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        Registered: {formatDate(reg.registeredAt)}
                      </div>
                    </div>
                    <button
                      onClick={() => handleCancelRegistration(reg)}
                      disabled={cancelling === reg.id}
                      className="ml-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 text-sm font-medium"
                    >
                      {cancelling === reg.id ? 'Cancelling...' : 'Cancel'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Waitlist */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Waitlist ({waitlist.length})
            </h3>
            {!canPromote && waitlist.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                <p className="text-sm text-yellow-800">
                  Event is at full capacity. Cancel a registration to promote someone from the waitlist.
                </p>
              </div>
            )}
            {waitlist.length === 0 ? (
              <p className="text-gray-500 text-sm">No one on the waitlist.</p>
            ) : (
              <div className="space-y-2">
                {waitlist.map((reg, index) => (
                  <div key={reg.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex-shrink-0 w-8 h-8 bg-yellow-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{getDisplayName(reg)}</div>
                        <div className="text-sm text-gray-600">{reg.userEmail} • {reg.userPhone}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Joined waitlist: {formatDate(reg.registeredAt)}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handlePromoteFromWaitlist(reg)}
                      disabled={!canPromote || promoting === reg.id}
                      className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      {promoting === reg.id ? 'Promoting...' : 'Promote'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Requests */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Pending Waitlist Requests ({pendingRequests.length})
            </h3>
            {pendingRequests.length === 0 ? (
              <p className="text-gray-500 text-sm">No pending requests.</p>
            ) : (
              <div className="space-y-2">
                {pendingRequests.map((reg) => (
                  <div key={reg.id} className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{getDisplayName(reg)}</div>
                      <div className="text-sm text-gray-500">{reg.userEmail} • {reg.userPhone}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        Requested: {formatDate(reg.registeredAt)}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveRequest(reg)}
                        disabled={approving === reg.id}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                      >
                        {approving === reg.id ? 'Approving...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleRejectRequest(reg)}
                        disabled={rejecting === reg.id}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                      >
                        {rejecting === reg.id ? 'Rejecting...' : 'Reject'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
