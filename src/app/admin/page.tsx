'use client';

import { useState, useEffect } from 'react';
import { Event, Registration } from '@/types';
import { categoryColors } from '@/data/events';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, startOfWeek, endOfWeek, addMonths, subMonths, isToday, isSameMonth } from 'date-fns';
import WaitlistManager from '@/components/WaitlistManager';
import EventFormModal from '@/components/EventFormModal';
import UserManagement from '@/components/UserManagement';

type TabType = 'events' | 'attendance' | 'calendar' | 'users';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('calendar');

  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [removalHistory, setRemovalHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [selectedEventForAttendance, setSelectedEventForAttendance] = useState<string | null>(null);
  const [selectedEventForWaitlist, setSelectedEventForWaitlist] = useState<Event | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedDateForNewEvent, setSelectedDateForNewEvent] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [calendarView, setCalendarView] = useState<'month' | 'week'>('month');
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null);

  useEffect(() => {
    const storedAuth = localStorage.getItem('adminAuthenticated');
    if (storedAuth === 'true') {
      setIsAuthenticated(true);
      fetchEvents();
      fetchRegistrations();
    }
    setIsCheckingAuth(false);
  }, []);

  // Fetch removal history when event is selected
  useEffect(() => {
    if (selectedEventForAttendance) {
      fetchRemovalHistory(selectedEventForAttendance).catch(() => {
        setRemovalHistory([]);
      });
    } else {
      setRemovalHistory([]);
    }
  }, [selectedEventForAttendance]);

  // Auto-dismiss messages after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        setIsAuthenticated(true);
        localStorage.setItem('adminAuthenticated', 'true');
        fetchEvents();
        fetchRegistrations();
      } else {
        setAuthError('Incorrect password. Please try again.');
      }
    } catch (error) {
      console.error('Auth error:', error);
      setAuthError('An error occurred. Please try again.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('adminAuthenticated');
    setPassword('');
  };

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

  const fetchRegistrations = async () => {
    try {
      const response = await fetch('/api/registrations');
      const data = await response.json();
      setRegistrations(data.registrations || []);
    } catch (error) {
      console.error('Error fetching registrations:', error);
    }
  };

  const fetchRemovalHistory = async (eventId?: string) => {
    try {
      const url = eventId 
        ? `/api/registrations/history?eventId=${eventId}`
        : '/api/registrations/history';
      const response = await fetch(url);
      
      if (!response.ok) {
        setRemovalHistory([]);
        return;
      }
      
      const data = await response.json();
      setRemovalHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching removal history:', error);
      setRemovalHistory([]);
    }
  };

  const handleEventSubmit = async (eventData: any) => {
    const isEditing = editingEvent !== null;
    const url = '/api/events';
    const method = isEditing ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
    });

    if (!response.ok) {
      throw new Error(isEditing ? 'Failed to update event' : 'Failed to add event');
    }

    const data = await response.json();
    
    if (isEditing) {
      setEvents(events.map((ev) => (ev.id === editingEvent.id ? { ...ev, ...data.event } : ev)));
      setMessage({ type: 'success', text: 'Event updated successfully!' });
    } else {
      if (data.events) {
        setEvents([...events, ...data.events]);
        setMessage({ type: 'success', text: `${data.events.length} recurring events created successfully!` });
      } else {
        setEvents([...events, data.event]);
        setMessage({ type: 'success', text: 'Event added successfully!' });
      }
    }
    
    setEditingEvent(null);
    setShowEventModal(false);
    setSelectedDateForNewEvent('');
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setShowEventModal(true);
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const response = await fetch(`/api/events?id=${eventId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete event');
      setEvents(events.filter((event) => event.id !== eventId));
      setMessage({ type: 'success', text: 'Event deleted successfully!' });
    } catch (error) {
      console.error('Error deleting event:', error);
      setMessage({ type: 'error', text: 'Failed to delete event.' });
    }
  };

  const handleCreateEventOnDate = (date: Date) => {
    setSelectedDateForNewEvent(format(date, 'yyyy-MM-dd'));
    setEditingEvent(null);
    setShowEventModal(true);
  };

  const handleAttendanceUpdate = async (registrationId: string, status: string) => {
    try {
      const response = await fetch('/api/registrations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId, status }),
      });

      if (response.ok) {
        setRegistrations(registrations.map((r) => 
          r.id === registrationId ? { ...r, status: status as Registration['status'] } : r
        ));
        setMessage({ type: 'success', text: 'Attendance updated!' });
      }
    } catch (error) {
      console.error('Error updating attendance:', error);
      setMessage({ type: 'error', text: 'Failed to update attendance.' });
    }
  };

  const handleRemoveParticipant = async (registration: Registration) => {
    const displayName = getDisplayName(registration);
    if (!confirm(`Remove ${displayName} from this event?\n\nThis will permanently remove them from the attendance list and log the removal in history.`)) {
      return;
    }

    try {
      const response = await fetch(
        `/api/registrations?registrationId=${registration.id}&removedBy=Staff&reason=Removed by staff`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        setRegistrations(registrations.filter((r) => r.id !== registration.id));
        if (selectedEventForAttendance) {
          fetchRemovalHistory(selectedEventForAttendance);
        }
        setMessage({ type: 'success', text: `${displayName} has been removed from the event.` });
      } else {
        throw new Error('Failed to remove participant');
      }
    } catch (error) {
      console.error('Error removing participant:', error);
      setMessage({ type: 'error', text: 'Failed to remove participant. Please try again.' });
    }
  };

  const getDisplayName = (registration: Registration): string => {
    return registration.isCaregiver && registration.participantName 
      ? registration.participantName 
      : registration.userName;
  };

  const getEventRegistrations = (eventId: string) => {
    return registrations.filter((r) => r.eventId === eventId);
  };

  // Calendar calculations
  const monthStart = startOfMonth(calendarMonth);
  const monthEnd = endOfMonth(calendarMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEventsForDay = (day: Date) => {
    return events.filter((event) => isSameDay(parseISO(event.date), day));
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">MINDS Staff Portal</h1>
            <p className="text-gray-500 text-sm mt-2">Enter password to access admin panel</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            {authError && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {authError}
              </div>
            )}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 transition-shadow"
                placeholder="Enter your password"
                required
              />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors font-medium">
              Sign In
            </button>
          </form>
          <div className="mt-6 text-center">
            <a href="/" className="text-blue-600 hover:text-blue-800 text-sm font-medium">← Back to Calendar</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-800">MINDS Admin</h1>
              <div className="hidden sm:flex items-center bg-gray-100 rounded-lg p-1">
                {(['calendar', 'events', 'attendance', 'users'] as TabType[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                      activeTab === tab 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    {tab === 'calendar' && '📅 Calendar'}
                    {tab === 'events' && '📋 Events'}
                    {tab === 'attendance' && '✓ Attendance'}
                    {tab === 'users' && '👤 Users'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a href="/" className="text-gray-600 hover:text-gray-800 text-sm font-medium hidden sm:block">
                View Public Site →
              </a>
              <button onClick={handleLogout} className="text-red-600 hover:text-red-800 text-sm font-medium">
                Logout
              </button>
            </div>
          </div>
          
          {/* Mobile tabs */}
          <div className="sm:hidden pb-3 flex gap-2 overflow-x-auto">
            {(['calendar', 'events', 'attendance', 'users'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
                  activeTab === tab 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {tab === 'calendar' && '📅'}
                {tab === 'events' && '📋'}
                {tab === 'attendance' && '✓'}
                {tab === 'users' && '👤'}
                <span className="ml-1">{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Toast Message */}
      {message && (
        <div className="fixed top-20 right-4 z-50 animate-slide-in">
          <div className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 ${
            message.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}>
            {message.type === 'success' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            {message.text}
            <button onClick={() => setMessage(null)} className="ml-2 hover:opacity-80">×</button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Calendar Tab - Google Calendar Style */}
        {activeTab === 'calendar' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Calendar Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setCalendarMonth(new Date())}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Today
                </button>
                <div className="flex items-center">
                  <button
                    onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
                <h2 className="text-xl font-semibold text-gray-800">
                  {format(calendarMonth, 'MMMM yyyy')}
                </h2>
              </div>
              <button
                onClick={() => {
                  setEditingEvent(null);
                  setSelectedDateForNewEvent('');
                  setShowEventModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Event
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7">
              {/* Day Headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="px-2 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 bg-gray-50">
                  {day}
                </div>
              ))}
              
              {/* Calendar Days */}
              {calendarDays.map((day, index) => {
                const dayEvents = getEventsForDay(day);
                const isCurrentMonth = isSameMonth(day, calendarMonth);
                const isTodayDate = isToday(day);
                
                return (
                  <div
                    key={index}
                    onClick={() => handleCreateEventOnDate(day)}
                    className={`min-h-[120px] border-b border-r border-gray-200 p-1 cursor-pointer transition-colors hover:bg-blue-50 ${
                      !isCurrentMonth ? 'bg-gray-50' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${
                        isTodayDate 
                          ? 'bg-blue-600 text-white' 
                          : isCurrentMonth 
                            ? 'text-gray-900' 
                            : 'text-gray-400'
                      }`}>
                        {format(day, 'd')}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="text-xs text-gray-400 font-medium">
                          {dayEvents.length}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map((event) => {
                        const regs = getEventRegistrations(event.id).filter(r => r.status !== 'cancelled');
                        const isFull = event.capacity && regs.length >= event.capacity;
                        
                        return (
                          <div
                            key={event.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(event);
                            }}
                            onMouseEnter={() => setHoveredEvent(event.id)}
                            onMouseLeave={() => setHoveredEvent(null)}
                            className={`text-xs px-2 py-1 rounded truncate cursor-pointer transition-all ${
                              categoryColors[event.category]?.replace('border-', 'border-l-2 border-l-') || 'bg-blue-100 text-blue-800'
                            } ${hoveredEvent === event.id ? 'ring-2 ring-blue-400' : ''}`}
                            title={`${event.title} • ${event.time} • ${regs.length}/${event.capacity || '∞'} registered`}
                          >
                            <span className="font-medium">{event.time.substring(0, 5)}</span>
                            <span className="ml-1">{event.title}</span>
                            {isFull && <span className="ml-1">🔴</span>}
                          </div>
                        );
                      })}
                      {dayEvents.length > 3 && (
                        <div 
                          className="text-xs text-blue-600 font-medium px-2 py-0.5 hover:bg-blue-100 rounded cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Could show a popup with all events
                          }}
                        >
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex flex-wrap gap-3 text-xs">
                <span className="text-gray-500 font-medium">Categories:</span>
                {Object.entries(categoryColors).slice(0, 6).map(([category, colors]) => (
                  <span key={category} className={`px-2 py-1 rounded ${colors}`}>
                    {category}
                  </span>
                ))}
                <span className="text-gray-400">...</span>
              </div>
            </div>
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">All Events ({events.length})</h2>
              <button
                onClick={() => {
                  setEditingEvent(null);
                  setSelectedDateForNewEvent('');
                  setShowEventModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Event
              </button>
            </div>

            {isLoading ? (
              <div className="bg-white rounded-xl p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading events...</p>
              </div>
            ) : events.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-500">No events found. Create your first event!</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {events
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((event) => {
                    const regs = getEventRegistrations(event.id).filter(r => r.status !== 'cancelled');
                    const isPast = new Date(event.date) < new Date();
                    
                    return (
                      <div 
                        key={event.id} 
                        className={`bg-white rounded-xl shadow-sm overflow-hidden border-l-4 ${
                          isPast ? 'opacity-60' : ''
                        }`}
                        style={{ borderLeftColor: categoryColors[event.category]?.includes('blue') ? '#3b82f6' : 
                                                  categoryColors[event.category]?.includes('green') ? '#22c55e' :
                                                  categoryColors[event.category]?.includes('purple') ? '#a855f7' :
                                                  categoryColors[event.category]?.includes('orange') ? '#f97316' :
                                                  categoryColors[event.category]?.includes('pink') ? '#ec4899' :
                                                  categoryColors[event.category]?.includes('cyan') ? '#06b6d4' :
                                                  categoryColors[event.category]?.includes('red') ? '#ef4444' :
                                                  categoryColors[event.category]?.includes('yellow') ? '#eab308' :
                                                  categoryColors[event.category]?.includes('indigo') ? '#6366f1' :
                                                  categoryColors[event.category]?.includes('teal') ? '#14b8a6' : '#6b7280' }}
                      >
                        <div className="p-4">
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="flex-grow">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <h3 className="font-semibold text-gray-800 text-lg">{event.title}</h3>
                                <span className={`text-xs px-2 py-1 rounded-full border ${categoryColors[event.category]}`}>
                                  {event.category}
                                </span>
                                {event.isRecurring && <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">🔄 Recurring</span>}
                                {isPast && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">Past</span>}
                              </div>
                              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  {format(parseISO(event.date), 'EEE, MMM d, yyyy')}
                                </span>
                                <span className="flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {event.time}{event.endTime ? ` - ${event.endTime}` : ''}
                                </span>
                                <span className="flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  </svg>
                                  {event.location}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2 mt-3">
                                {event.wheelchairAccessible && (
                                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">♿ Accessible</span>
                                )}
                                {event.caregiverRequired && (
                                  <span className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded-full">👥 Caregiver Required</span>
                                )}
                                {event.caregiverPaymentRequired && (
                                  <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full">💰 ${event.caregiverPaymentAmount}</span>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-4 mt-3 text-sm">
                                <span className={`font-medium ${regs.length >= (event.capacity || 0) && event.capacity ? 'text-red-600' : 'text-gray-700'}`}>
                                  👥 {regs.length}/{event.capacity || '∞'} Participants
                                </span>
                                <span className="text-gray-700">
                                  🙋 {event.currentVolunteers || 0}/{event.volunteersNeeded || 0} Volunteers
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setSelectedEventForWaitlist(event)}
                                className="px-3 py-2 text-purple-600 hover:bg-purple-50 rounded-lg text-sm font-medium transition-colors"
                              >
                                Waitlist
                              </button>
                              <button
                                onClick={() => handleEdit(event)}
                                className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-medium transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(event.id)}
                                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Attendance Tracking</h2>
            
            {/* Event Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Event</label>
              <select
                value={selectedEventForAttendance || ''}
                onChange={(e) => setSelectedEventForAttendance(e.target.value || null)}
                className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
              >
                <option value="">-- Select an event --</option>
                {events
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.title} - {format(parseISO(event.date), 'MMM d, yyyy')}
                    </option>
                  ))}
              </select>
            </div>

            {selectedEventForAttendance && (
              <>
                {(() => {
                  const eventRegs = getEventRegistrations(selectedEventForAttendance);
                  const activeRegs = eventRegs.filter((r) => r.status !== 'cancelled');
                  const participants = activeRegs.filter((r) => r.registrationType === 'participant');
                  const volunteers = activeRegs.filter((r) => r.registrationType === 'volunteer');
                  const attended = activeRegs.filter((r) => r.status === 'attended').length;
                  const cancelled = eventRegs.filter((r) => r.status === 'cancelled').length;

                  return (
                    <>
                      {/* Summary Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                        <div className="bg-blue-50 rounded-xl p-4 text-center">
                          <p className="text-2xl font-bold text-blue-600">{activeRegs.length}</p>
                          <p className="text-sm text-gray-600">Active</p>
                        </div>
                        <div className="bg-green-50 rounded-xl p-4 text-center">
                          <p className="text-2xl font-bold text-green-600">{attended}</p>
                          <p className="text-sm text-gray-600">Attended</p>
                        </div>
                        <div className="bg-purple-50 rounded-xl p-4 text-center">
                          <p className="text-2xl font-bold text-purple-600">{participants.length}</p>
                          <p className="text-sm text-gray-600">Participants</p>
                        </div>
                        <div className="bg-orange-50 rounded-xl p-4 text-center">
                          <p className="text-2xl font-bold text-orange-600">{volunteers.length}</p>
                          <p className="text-sm text-gray-600">Volunteers</p>
                        </div>
                        <div className="bg-red-50 rounded-xl p-4 text-center">
                          <p className="text-2xl font-bold text-red-600">{cancelled}</p>
                          <p className="text-sm text-gray-600">Cancelled</p>
                        </div>
                      </div>

                      {/* Registrations List */}
                      {eventRegs.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No registrations for this event.</p>
                      ) : (
                        <div className="space-y-3">
                          {eventRegs.map((reg) => (
                            <div key={reg.id} className={`flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-xl gap-4 transition-colors ${
                              reg.status === 'cancelled' ? 'border-red-200 bg-red-50' : 'border-gray-200 hover:bg-gray-50'
                            }`}>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className={`font-medium ${reg.status === 'cancelled' ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                                    {getDisplayName(reg)}
                                  </p>
                                  {reg.isCaregiver && (
                                    <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-800">
                                      👤 Caregiver
                                    </span>
                                  )}
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    reg.registrationType === 'volunteer' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {reg.registrationType}
                                  </span>
                                  {reg.status === 'cancelled' && (
                                    <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">Cancelled</span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{reg.userEmail} • {reg.userPhone}</p>
                                {reg.isCaregiver && (
                                  <p className="text-xs text-indigo-600 mt-1">👥 Caregiver: {reg.userName}</p>
                                )}
                                {reg.needsWheelchairAccess && <p className="text-xs text-blue-600 mt-1">♿ Needs wheelchair access</p>}
                                {reg.hasCaregiverAccompanying && <p className="text-xs text-orange-600 mt-1">👥 Caregiver: {reg.caregiverName}</p>}
                                {reg.dietaryRequirements && <p className="text-xs text-gray-500 mt-1">🍽️ {reg.dietaryRequirements}</p>}
                              </div>
                              <div className="flex items-center gap-2">
                                <select
                                  value={reg.status}
                                  onChange={(e) => handleAttendanceUpdate(reg.id, e.target.value)}
                                  disabled={reg.status === 'cancelled'}
                                  className={`px-3 py-2 border rounded-lg text-sm font-medium ${
                                    reg.status === 'attended' ? 'bg-green-100 border-green-300 text-green-800' :
                                    reg.status === 'absent' ? 'bg-red-100 border-red-300 text-red-800' :
                                    reg.status === 'cancelled' ? 'bg-red-100 border-red-300 text-red-800' :
                                    'bg-gray-100 border-gray-300 text-gray-800'
                                  }`}
                                >
                                  <option value="registered">Registered</option>
                                  <option value="attended">Attended</option>
                                  <option value="absent">Absent</option>
                                  <option value="cancelled">Cancelled</option>
                                </select>
                                {reg.status !== 'cancelled' && (
                                  <button
                                    onClick={() => handleRemoveParticipant(reg)}
                                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}

                {/* Removal History Section */}
                {removalHistory.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Removal History</h3>
                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                      {removalHistory.map((removal: any, index: number) => {
                        const displayName = removal.isCaregiver && removal.participantName 
                          ? removal.participantName 
                          : removal.userName;
                        
                        return (
                          <div key={index} className="flex items-start justify-between bg-white p-4 rounded-lg border border-gray-200">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">{displayName}</span>
                                {removal.isCaregiver && (
                                  <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                                    👤 Caregiver
                                  </span>
                                )}
                              </div>
                              {removal.isCaregiver && removal.participantName && (
                                <p className="text-sm text-gray-600 mt-1">👥 Caregiver: {removal.userName}</p>
                              )}
                              <p className="text-sm text-gray-600 mt-1">{removal.userEmail} • {removal.userPhone}</p>
                              {removal.reason && (
                                <p className="text-sm text-gray-600 mt-1"><span className="font-medium">Reason:</span> {removal.reason}</p>
                              )}
                            </div>
                            <div className="text-right ml-4">
                              <p className="text-sm text-gray-600">Removed by: <span className="font-medium">{removal.removedBy}</span></p>
                              <p className="text-xs text-gray-500 mt-1">{new Date(removal.removedAt).toLocaleString()}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <UserManagement />
          </div>
        )}
      </main>

      {/* Event Form Modal */}
      <EventFormModal
        isOpen={showEventModal}
        onClose={() => {
          setShowEventModal(false);
          setEditingEvent(null);
          setSelectedDateForNewEvent('');
        }}
        onSubmit={handleEventSubmit}
        editingEvent={editingEvent}
        initialDate={selectedDateForNewEvent}
      />

      {/* Waitlist Manager Modal */}
      {selectedEventForWaitlist && (
        <WaitlistManager
          event={selectedEventForWaitlist}
          onClose={() => setSelectedEventForWaitlist(null)}
          onRefresh={fetchEvents}
        />
      )}

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
