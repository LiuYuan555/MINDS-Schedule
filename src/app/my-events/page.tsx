'use client';

import { useState, useEffect } from 'react';
import { useUser, SignInButton } from '@clerk/nextjs';
import { format, parseISO, isPast } from 'date-fns';
import { Event, Registration, MembershipType, MEMBERSHIP_LABELS } from '@/types';
import { categoryColors } from '@/data/events';

interface RegistrationWithEvent extends Registration {
  event?: Event;
}

export default function MyEventsPage() {
  const { user, isLoaded } = useUser();
  const [registrations, setRegistrations] = useState<RegistrationWithEvent[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const [membershipType, setMembershipType] = useState<MembershipType>('adhoc');
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [isUpdatingMembership, setIsUpdatingMembership] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
      fetchMembership();
    } else if (isLoaded) {
      setIsLoading(false);
    }
  }, [user, isLoaded]);

  const fetchData = async () => {
    try {
      const [eventsRes, registrationsRes] = await Promise.all([
        fetch('/api/events'),
        fetch(`/api/registrations?userId=${user?.id}`),
      ]);

      const eventsData = await eventsRes.json();
      const registrationsData = await registrationsRes.json();

      setEvents(eventsData.events || []);
      
      const regsWithEvents = (registrationsData.registrations || []).map((reg: Registration) => {
        const event = (eventsData.events || []).find((e: Event) => e.id === reg.eventId);
        return { ...reg, event };
      });

      setRegistrations(regsWithEvents);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMembership = async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/user/membership?userId=${user.id}`);
      const data = await response.json();
      setMembershipType(data.membershipType || 'adhoc');
    } catch (error) {
      console.error('Error fetching membership:', error);
    }
  };

  const handleMembershipChange = async (newType: MembershipType) => {
    if (!user) return;
    setIsUpdatingMembership(true);
    try {
      const response = await fetch('/api/user/membership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userName: user.fullName,
          userEmail: user.emailAddresses[0]?.emailAddress,
          membershipType: newType,
        }),
      });

      if (response.ok) {
        setMembershipType(newType);
        setShowMembershipModal(false);
        alert('Membership updated successfully!');
      } else {
        alert('Failed to update membership. Please try again.');
      }
    } catch (error) {
      console.error('Error updating membership:', error);
      alert('Failed to update membership. Please try again.');
    } finally {
      setIsUpdatingMembership(false);
    }
  };

  const handleCancelRegistration = async (registrationId: string) => {
    if (!confirm('Are you sure you want to cancel this registration?')) return;

    setCancellingId(registrationId);
    try {
      const response = await fetch('/api/registrations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId, status: 'cancelled' }),
      });

      if (response.ok) {
        setRegistrations(registrations.map(reg => 
          reg.id === registrationId ? { ...reg, status: 'cancelled' } : reg
        ));
        alert('Registration cancelled successfully.');
      } else {
        alert('Failed to cancel registration. Please try again.');
      }
    } catch (error) {
      console.error('Error cancelling registration:', error);
      alert('Failed to cancel registration. Please try again.');
    } finally {
      setCancellingId(null);
    }
  };

  const filteredRegistrations = registrations.filter(reg => {
    const status = reg.status as string;
    if (status === 'cancelled') return filter === 'all';
    if (!reg.event) return false;
    
    const eventDate = parseISO(reg.event.date);
    const isEventPast = isPast(eventDate);

    if (filter === 'upcoming') return !isEventPast && status !== 'cancelled';
    if (filter === 'past') return isEventPast && status !== 'cancelled';
    return true;
  });

  const sortedRegistrations = [...filteredRegistrations].sort((a, b) => {
    if (!a.event || !b.event) return 0;
    return parseISO(a.event.date).getTime() - parseISO(b.event.date).getTime();
  });

  // Show sign-in prompt if not authenticated
  if (isLoaded && !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-blue-600">My Events</h1>
              <a href="/" className="text-blue-600 hover:text-blue-800 text-sm">
                ← Back to Calendar
              </a>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="text-6xl mb-4">🔐</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Sign in to view your events</h2>
            <p className="text-gray-600 mb-6">You need to be signed in to see your registered events.</p>
            <SignInButton mode="modal">
              <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                Sign In
              </button>
            </SignInButton>
          </div>
        </main>
      </div>
    );
  }

  const membershipDescriptions: Record<MembershipType, string> = {
    adhoc: 'Register for events as needed, no weekly limit',
    once_weekly: 'Register for up to 1 event per week',
    twice_weekly: 'Register for up to 2 events per week',
    three_plus_weekly: 'Register for 3 or more events per week, no limit',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-blue-600">My Events</h1>
              <p className="text-gray-600 text-sm mt-1">View and manage your event registrations</p>
            </div>
            <a href="/" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              ← Back to Calendar
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Membership Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Membership Type</h2>
              <p className="text-blue-600 font-medium">{MEMBERSHIP_LABELS[membershipType]}</p>
              <p className="text-sm text-gray-500 mt-1">{membershipDescriptions[membershipType]}</p>
            </div>
            <button
              onClick={() => setShowMembershipModal(true)}
              className="px-4 py-2 text-sm text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Change Membership
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-sm font-medium text-gray-700">Show:</span>
          <div className="flex gap-2">
            {(['upcoming', 'past', 'all'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                  filter === tab
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab === 'upcoming' && 'Upcoming'}
                {tab === 'past' && 'Past'}
                {tab === 'all' && 'All'}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-2xl font-bold text-blue-600">
              {registrations.filter(r => (r.status as string) !== 'cancelled').length}
            </p>
            <p className="text-sm text-gray-600">Total Registrations</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-2xl font-bold text-green-600">
              {registrations.filter(r => (r.status as string) !== 'cancelled' && r.event && !isPast(parseISO(r.event.date))).length}
            </p>
            <p className="text-sm text-gray-600">Upcoming Events</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-2xl font-bold text-gray-600">
              {registrations.filter(r => r.status === 'attended').length}
            </p>
            <p className="text-sm text-gray-600">Attended</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-2xl font-bold text-red-600">
              {registrations.filter(r => (r.status as string) === 'cancelled').length}
            </p>
            <p className="text-sm text-gray-600">Cancelled</p>
          </div>
        </div>

        {/* Registrations List */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {filter === 'upcoming' && 'Upcoming Events'}
            {filter === 'past' && 'Past Events'}
            {filter === 'all' && 'All Registrations'}
          </h2>

          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading your events...</p>
            </div>
          ) : sortedRegistrations.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">📅</div>
              <p className="text-gray-500 mb-4">
                {filter === 'upcoming' && "You don't have any upcoming events."}
                {filter === 'past' && "You don't have any past events."}
                {filter === 'all' && "You haven't registered for any events yet."}
              </p>
              <a
                href="/"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Browse Events
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedRegistrations.map((reg) => {
                if (!reg.event) return null;
                
                const eventDate = parseISO(reg.event.date);
                const isEventPast = isPast(eventDate);
                const isCancelled = (reg.status as string) === 'cancelled';

                return (
                  <div
                    key={reg.id}
                    className={`flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg transition-colors ${
                      isCancelled
                        ? 'border-red-200 bg-red-50'
                        : isEventPast
                        ? 'border-gray-200 bg-gray-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex gap-4 flex-grow">
                      <div className="flex-shrink-0 w-16 text-center">
                        <div className={`${isCancelled ? 'bg-red-400' : isEventPast ? 'bg-gray-400' : 'bg-blue-600'} text-white rounded-t-lg py-1 text-xs font-medium`}>
                          {format(eventDate, 'MMM')}
                        </div>
                        <div className={`${isCancelled ? 'bg-red-50 text-red-600' : isEventPast ? 'bg-gray-100 text-gray-600' : 'bg-blue-50 text-blue-600'} rounded-b-lg py-2 text-2xl font-bold`}>
                          {format(eventDate, 'd')}
                        </div>
                      </div>
                      <div className="flex-grow">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className={`font-semibold ${isCancelled ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                            {reg.event.title}
                          </h3>
                          <span className={`text-xs px-2 py-1 rounded-full border ${categoryColors[reg.event.category]}`}>
                            {reg.event.category}
                          </span>
                          {isCancelled && (
                            <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">
                              Cancelled
                            </span>
                          )}
                          {reg.status === 'attended' && (
                            <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                              ✓ Attended
                            </span>
                          )}
                          {!isCancelled && isEventPast && reg.status !== 'attended' && (
                            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                              Past Event
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-1">{reg.event.description}</p>
                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                          <span>🕐 {reg.event.time}{reg.event.endTime ? ` - ${reg.event.endTime}` : ''}</span>
                          <span>📍 {reg.event.location}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          Registered on {format(parseISO(reg.registeredAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="mt-4 md:mt-0 md:ml-4 flex flex-col items-end gap-2">
                      {!isCancelled && !isEventPast && (
                        <button
                          onClick={() => handleCancelRegistration(reg.id)}
                          disabled={cancellingId === reg.id}
                          className="px-4 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          {cancellingId === reg.id ? 'Cancelling...' : 'Cancel Registration'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} MINDS Singapore. Movement for the Intellectually Disabled of Singapore.</p>
          </div>
        </div>
      </footer>

      {/* Membership Change Modal */}
      {showMembershipModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Change Membership Type</h2>
            <div className="space-y-3">
              {(Object.keys(MEMBERSHIP_LABELS) as MembershipType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => handleMembershipChange(type)}
                  disabled={isUpdatingMembership}
                  className={`w-full p-4 text-left rounded-lg border transition-colors disabled:opacity-50 ${
                    membershipType === type
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <p className="font-medium text-gray-800">{MEMBERSHIP_LABELS[type]}</p>
                  <p className="text-sm text-gray-500">{membershipDescriptions[type]}</p>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowMembershipModal(false)}
              disabled={isUpdatingMembership}
              className="w-full mt-4 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
