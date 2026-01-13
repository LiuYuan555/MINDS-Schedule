'use client';

import { useState, useEffect } from 'react';
import Calendar from '@/components/Calendar';
import EventList from '@/components/EventList';
import SignUpModal, { SignUpFormData } from '@/components/SignUpModal';
import { Event, ViewMode } from '@/types';

export default function Home() {
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch events from API on component mount
  useEffect(() => {
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

    fetchEvents();
  }, []);

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
  };

  const handleCloseModal = () => {
    setSelectedEvent(null);
  };

  const handleSignUp = async (formData: SignUpFormData) => {
    if (!selectedEvent) return;

    const response = await fetch('/api/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventId: selectedEvent.id,
        eventTitle: selectedEvent.title,
        ...formData,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to register');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-blue-600">MINDS Singapore</h1>
              <p className="text-gray-600 text-sm mt-1">Events & Activities Schedule</p>
            </div>
            
            {/* View Toggle */}
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
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
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading events...</p>
          </div>
        ) : viewMode === 'calendar' ? (
          <Calendar events={events} onEventClick={handleEventClick} />
        ) : (
          <EventList events={events} onEventClick={handleEventClick} />
        )}
      </main>

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
      {selectedEvent && (
        <SignUpModal
          event={selectedEvent}
          onClose={handleCloseModal}
          onSubmit={handleSignUp}
        />
      )}
    </div>
  );
}
