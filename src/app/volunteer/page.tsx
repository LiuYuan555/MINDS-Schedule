'use client';

import { useState, useEffect } from 'react';
import { useUser, SignInButton } from '@clerk/nextjs';
import { Event } from '@/types';
import { categoryColors } from '@/data/events';
import { format, parseISO } from 'date-fns';
import { useLanguage, LanguageToggle } from '@/components/LanguageProvider';

export default function VolunteerPage() {
  const { user, isLoaded } = useUser();
  const { t } = useLanguage();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [myRegistrations, setMyRegistrations] = useState<string[]>([]);
  const [filter, setFilter] = useState<'all' | 'needs-volunteers'>('needs-volunteers');

  useEffect(() => {
    fetchEvents();
    if (user) {
      fetchMyRegistrations();
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

  const fetchMyRegistrations = async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/registrations?userId=${user.id}`);
      const data = await response.json();
      setMyRegistrations(data.registrations?.filter((r: { registrationType: string }) => r.registrationType === 'volunteer').map((r: { eventId: string }) => r.eventId) || []);
    } catch (error) {
      console.error('Error fetching registrations:', error);
    }
  };

  const handleVolunteerSignup = async (event: Event) => {
    if (!user) {
      return;
    }

    try {
      const response = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          eventTitle: event.title,
          userId: user.id,
          userName: user.fullName || '',
          userEmail: user.emailAddresses[0]?.emailAddress || '',
          userPhone: '',
          registrationType: 'volunteer',
        }),
      });

      if (response.ok) {
        setMyRegistrations([...myRegistrations, event.id]);
        await fetchEvents();
        alert('Successfully registered as a volunteer!');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to register');
      }
    } catch (error) {
      console.error('Error registering:', error);
      alert('Failed to register');
    }
  };

  const filteredEvents = events.filter((event) => {
    if (filter === 'needs-volunteers') {
      return event.volunteersNeeded && event.currentVolunteers !== undefined && event.currentVolunteers < event.volunteersNeeded;
    }
    return true;
  });

  const sortedEvents = [...filteredEvents].sort((a, b) => 
    parseISO(a.date).getTime() - parseISO(b.date).getTime()
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Title Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-green-600">{t('volunteerPortal', 'title')}</h1>
              <p className="text-gray-600 text-sm mt-1">{t('volunteerPortal', 'subtitle')}</p>
            </div>
            <div className="flex items-center gap-4">
              <LanguageToggle />
              <a href="/" className="text-blue-600 hover:text-blue-800 text-sm">
                {t('common', 'backToCalendar')}
              </a>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section for New Volunteers */}
        {isLoaded && !user && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-green-800 mb-2">{t('volunteerPortal', 'welcomeTitle')}</h2>
            <p className="text-green-700 mb-4">
              {t('volunteerPortal', 'welcomeText')}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="bg-white rounded-lg p-4">
                <div className="text-2xl mb-2">📋</div>
                <h3 className="font-medium text-gray-800">{t('volunteerPortal', 'step1Title')}</h3>
                <p className="text-sm text-gray-600">{t('volunteerPortal', 'step1Text')}</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="text-2xl mb-2">🔍</div>
                <h3 className="font-medium text-gray-800">{t('volunteerPortal', 'step2Title')}</h3>
                <p className="text-sm text-gray-600">{t('volunteerPortal', 'step2Text')}</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="text-2xl mb-2">✅</div>
                <h3 className="font-medium text-gray-800">{t('volunteerPortal', 'step3Title')}</h3>
                <p className="text-sm text-gray-600">{t('volunteerPortal', 'step3Text')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="flex items-center gap-4 mb-6">
          <span className="text-sm font-medium text-gray-700">{t('common', 'show')}:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('needs-volunteers')}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                filter === 'needs-volunteers'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t('volunteerPortal', 'needsVolunteers')}
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                filter === 'all'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t('volunteerPortal', 'allEvents')}
            </button>
          </div>
        </div>

        {/* Events List */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {filter === 'needs-volunteers' ? t('volunteerPortal', 'eventsNeedingVolunteers') : t('volunteerPortal', 'allUpcomingEvents')}
          </h2>

          {isLoading ? (
            <p className="text-gray-500">{t('common', 'loading')}</p>
          ) : sortedEvents.length === 0 ? (
            <p className="text-gray-500">{t('volunteerPortal', 'noEventsFound')}</p>
          ) : (
            <div className="space-y-4">
              {sortedEvents.map((event) => {
                const volunteersNeeded = event.volunteersNeeded || 0;
                const currentVolunteers = event.currentVolunteers || 0;
                const spotsLeft = volunteersNeeded - currentVolunteers;
                const isRegistered = myRegistrations.includes(event.id);

                return (
                  <div
                    key={event.id}
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-green-300 transition-colors"
                  >
                    <div className="flex gap-4 flex-grow">
                      <div className="flex-shrink-0 w-16 text-center">
                        <div className="bg-green-600 text-white rounded-t-lg py-1 text-xs font-medium">
                          {format(parseISO(event.date), 'MMM')}
                        </div>
                        <div className="bg-green-50 text-green-600 rounded-b-lg py-2 text-2xl font-bold">
                          {format(parseISO(event.date), 'd')}
                        </div>
                      </div>
                      <div className="flex-grow">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-800">{event.title}</h3>
                          <span className={`text-xs px-2 py-1 rounded-full border ${categoryColors[event.category]}`}>
                            {event.category}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">{event.description}</p>
                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                          <span>🕐 {event.time}{event.endTime ? ` - ${event.endTime}` : ''}</span>
                          <span>📍 {event.location}</span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {!event.wheelchairAccessible && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                              {t('volunteerPortal', 'notWheelchairAccessible')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 md:mt-0 md:ml-4 flex flex-col items-end gap-2">
                      <div className={`text-sm font-medium ${spotsLeft > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                        {spotsLeft > 0 ? `${spotsLeft} ${t('volunteerPortal', 'volunteerSpotsLeft')}` : t('volunteerPortal', 'fullyStaffed')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {currentVolunteers}/{volunteersNeeded} {t('volunteerPortal', 'volunteers')}
                      </div>
                      {isRegistered ? (
                        <span className="px-4 py-2 text-sm text-green-600 bg-green-100 rounded-lg">
                          ✓ {t('common', 'registered')}
                        </span>
                      ) : spotsLeft > 0 ? (
                        user ? (
                          <button
                            onClick={() => handleVolunteerSignup(event)}
                            className="px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                          >
                            {t('common', 'volunteer')}
                          </button>
                        ) : (
                          <SignInButton mode="modal">
                            <button className="px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors">
                              {t('volunteerPortal', 'signInToVolunteer')}
                            </button>
                          </SignInButton>
                        )
                      ) : (
                        <span className="px-4 py-2 text-sm text-gray-500 bg-gray-100 rounded-lg">
                          {t('common', 'full')}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
