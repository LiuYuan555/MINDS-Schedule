'use client';

import { useState, useEffect } from 'react';
import { useUser, SignInButton, SignUpButton } from '@clerk/nextjs';
import Calendar from '@/components/Calendar';
import EventList from '@/components/EventList';
import SignUpModal, { SignUpFormData } from '@/components/SignUpModal';
import { Event, ViewMode } from '@/types';
import { startOfWeek, endOfWeek, parseISO, isWithinInterval } from 'date-fns';

export default function Home() {
  const { user, isLoaded } = useUser();
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userWeeklyRegistrations, setUserWeeklyRegistrations] = useState(0);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState<Event[]>([]);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserWeeklyRegistrations();
    }
  }, [user]);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events');
      const data = await response.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserWeeklyRegistrations = async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/registrations?userId=${user.id}`);
      const data = await response.json();
      
      // Count registrations for current week
      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(now, { weekStartsOn: 0 });
      
      const weeklyCount = (data.registrations || []).filter((reg: { registeredAt: string; registrationType: string; status: string }) => {
        const regDate = parseISO(reg.registeredAt);
        return reg.registrationType === 'participant' && 
               reg.status !== 'cancelled' &&
               isWithinInterval(regDate, { start: weekStart, end: weekEnd });
      }).length;
      
      setUserWeeklyRegistrations(weeklyCount);
    } catch (error) {
      console.error('Error fetching registrations:', error);
    }
  };

  const handleEventClick = (event: Event) => {
    if (!user) {
      // User will see Sign In button in header
      return;
    }
    
    // In multi-select mode, toggle event selection
    if (multiSelectMode) {
      setSelectedEvents(prev => {
        const isSelected = prev.some(e => e.id === event.id);
        if (isSelected) {
          return prev.filter(e => e.id !== event.id);
        } else {
          return [...prev, event];
        }
      });
    } else {
      // Normal mode - open single event modal
      setSelectedEvent(event);
    }
  };

  const handleCloseModal = () => {
    setSelectedEvent(null);
  };

  const handleSignUp = async (formData: SignUpFormData) => {
    if (!selectedEvent) return;
    if (!user) {
      throw new Error('You must be logged in to register');
    }

    const response = await fetch('/api/registrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId: selectedEvent.id,
        eventTitle: selectedEvent.title,
        userId: user.id,
        userName: formData.name,
        userEmail: formData.email,
        userPhone: formData.phone,
        registrationType: 'participant',
        isCaregiver: formData.isCaregiver,
        participantName: formData.participantName,
        dietaryRequirements: formData.dietaryRequirements,
        specialNeeds: formData.specialNeeds,
        needsWheelchairAccess: formData.needsWheelchairAccess,
        hasCaregiverAccompanying: formData.hasCaregiverAccompanying,
        caregiverName: formData.caregiverName,
        caregiverPhone: formData.caregiverPhone,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to register');
    }

    // Refresh events to show updated counts
    await fetchEvents();

    // Update weekly registration count
    if (user) {
      setUserWeeklyRegistrations(prev => prev + 1);
    }
  };

  const handleBulkSignUp = async (formData: SignUpFormData) => {
    if (!user) {
      throw new Error('You must be logged in to register');
    }

    // Register for all selected events
    const registrationPromises = selectedEvents.map(event =>
      fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          eventTitle: event.title,
          userId: user.id,
          userName: formData.name,
          userEmail: formData.email,
          userPhone: formData.phone,
          registrationType: 'participant',
          isCaregiver: formData.isCaregiver,
          participantName: formData.participantName,
          dietaryRequirements: formData.dietaryRequirements,
          specialNeeds: formData.specialNeeds,
          needsWheelchairAccess: formData.needsWheelchairAccess,
          hasCaregiverAccompanying: formData.hasCaregiverAccompanying,
          caregiverName: formData.caregiverName,
          caregiverPhone: formData.caregiverPhone,
        }),
      })
    );

    const results = await Promise.allSettled(registrationPromises);
    
    // Check for any failures
    const failures = results.filter(r => r.status === 'rejected');
    if (failures.length > 0) {
      throw new Error(`Failed to register for ${failures.length} event(s)`);
    }

    // Refresh events to show updated counts
    await fetchEvents();

    // Update weekly registration count
    if (user) {
      setUserWeeklyRegistrations(prev => prev + selectedEvents.length);
    }

    // Clear selection and exit multi-select mode
    setSelectedEvents([]);
    setMultiSelectMode(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* View Toggle & Nav */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg w-fit">
              <button
                onClick={() => setViewMode('calendar')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'calendar'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Calendar
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                List
              </button>
            </div>

            {/* Multi-Select Toggle Button (only for logged in users in calendar view) */}
            {user && viewMode === 'calendar' && (
              <button
                onClick={() => {
                  setMultiSelectMode(!multiSelectMode);
                  setSelectedEvents([]);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  multiSelectMode
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                {multiSelectMode ? 'Cancel Multi-Select' : 'Multi-Select'}
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="flex gap-4 text-sm">
            <a href="/volunteer" className="text-green-600 hover:text-green-800 font-medium">
              Volunteer Portal
            </a>
            <a href="/admin" className="text-gray-600 hover:text-gray-800">
              Staff Login
            </a>
          </nav>
        </div>

        {/* Sign in prompt for non-authenticated users */}
        {isLoaded && !user && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 text-sm">
              Please sign in to register for events.{' '}
              <SignInButton mode="modal">
                <button className="text-blue-600 hover:underline font-medium">Sign In</button>
              </SignInButton>
              {' '}or{' '}
              <SignUpButton mode="modal">
                <button className="text-blue-600 hover:underline font-medium">Create an Account</button>
              </SignUpButton>
            </p>
          </div>
        )}

        {/* Multi-select indicator and actions */}
        {multiSelectMode && selectedEvents.length > 0 && (
          <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-blue-900">
                  {selectedEvents.length} event{selectedEvents.length !== 1 ? 's' : ''} selected
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  Click "Register for Selected Events" to sign up for all at once
                </p>
              </div>
              <button
                onClick={() => setSelectedEvent({ id: 'bulk', title: 'Multiple Events' } as Event)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Register for Selected Events
              </button>
            </div>
          </div>
        )}

        {/* Multi-select mode indicator */}
        {multiSelectMode && selectedEvents.length === 0 && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
            <p className="text-purple-800 text-sm">
              <strong>Multi-Select Mode:</strong> Click on events in the calendar to select multiple events for registration.
            </p>
          </div>
        )}

        {/* Events */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading events...</p>
          </div>
        ) : viewMode === 'calendar' ? (
          <Calendar 
            events={events} 
            onEventClick={handleEventClick}
            multiSelectMode={multiSelectMode}
            selectedEvents={selectedEvents}
          />
        ) : (
          <EventList events={events} onEventClick={handleEventClick} />
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-500 text-sm">
            <p>© 2026 MINDS Singapore. Movement for the Intellectually Disabled of Singapore.</p>
            <p className="mt-1">
              For enquiries, contact us at{' '}
              <a href="mailto:info@minds.org.sg" className="text-blue-600 hover:underline">
                info@minds.org.sg
              </a>
            </p>
          </div>
        </div>
      </footer>

      {/* Sign Up Modal */}
      {selectedEvent && selectedEvent.id !== 'bulk' && (
        <SignUpModal
          event={selectedEvent}
          onClose={handleCloseModal}
          onSubmit={handleSignUp}
        />
      )}

      {/* Bulk Sign Up Modal */}
      {selectedEvent && selectedEvent.id === 'bulk' && selectedEvents.length > 0 && (
        <SignUpModal
          event={selectedEvents[0]} // Use first event for form structure
          events={selectedEvents} // Pass all selected events
          onClose={handleCloseModal}
          onSubmit={handleBulkSignUp}
          isBulkRegistration={true}
        />
      )}
    </div>
  );
}
