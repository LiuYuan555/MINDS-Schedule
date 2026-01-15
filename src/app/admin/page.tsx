'use client';

import { useState, useEffect } from 'react';
import { Event, Registration } from '@/types';
import { categoryColors } from '@/data/events';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import WaitlistManager from '@/components/WaitlistManager';

const categories = [
  'Workshop',
  'Outdoor Activity',
  'Fitness',
  'Life Skills',
  'Social',
  'Education',
  'Support Group',
  'Sports',
  'Festive',
  'Employment',
];

const skillLevels = ['all', 'beginner', 'intermediate', 'advanced'];

type TabType = 'events' | 'attendance' | 'calendar';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('events');

  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [removalHistory, setRemovalHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [selectedEventForAttendance, setSelectedEventForAttendance] = useState<string | null>(null);
  const [selectedEventForWaitlist, setSelectedEventForWaitlist] = useState<Event | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    endTime: '',
    location: '',
    category: 'Workshop',
    capacity: '0',
    wheelchairAccessible: true,
    caregiverRequired: false,
    caregiverPaymentRequired: false,
    caregiverPaymentAmount: '',
    ageRestriction: '',
    skillLevel: 'all',
    volunteersNeeded: '0',
    isRecurring: false,
    recurringDates: [] as string[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
        // Silently fail if RemovalHistory sheet doesn't exist yet
        setRemovalHistory([]);
      });
    } else {
      setRemovalHistory([]);
    }
  }, [selectedEventForAttendance]);

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
        // If RemovalHistory sheet doesn't exist, just set empty array
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
        // Remove from local state
        setRegistrations(registrations.filter((r) => r.id !== registration.id));
        // Refresh removal history
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

  // Time options for dropdowns
  const hourOptions = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minuteOptions = ['00', '10', '20', '30', '40', '50'];

  // Helper function to get the display name (participant name if caregiver, otherwise user name)
  const getDisplayName = (registration: Registration): string => {
    return registration.isCaregiver && registration.participantName 
      ? registration.participantName 
      : registration.userName;
  };

  // Convert 12-hour format (e.g., "10:00 AM") to 24-hour format (e.g., "10:00")
  const convertTo24Hour = (time: string) => {
    if (!time) return '';
    
    // Trim whitespace
    time = time.trim();
    
    // If already in 24-hour format (no AM/PM), return as is
    if (!time.includes('AM') && !time.includes('PM')) {
      return time;
    }
    
    // Parse 12-hour format - handle with or without space
    let timePart, meridiem;
    if (time.includes(' ')) {
      [timePart, meridiem] = time.split(' ');
    } else {
      // No space between time and AM/PM
      if (time.includes('AM')) {
        timePart = time.replace('AM', '');
        meridiem = 'AM';
      } else {
        timePart = time.replace('PM', '');
        meridiem = 'PM';
      }
    }
    
    const [hours, minutes] = timePart.split(':');
    let hour = parseInt(hours);
    
    if (meridiem === 'PM' && hour !== 12) {
      hour += 12;
    } else if (meridiem === 'AM' && hour === 12) {
      hour = 0;
    }
    
    return `${hour.toString().padStart(2, '0')}:${minutes || '00'}`;
  };

  const getTimeHour = (time: string) => {
    const time24 = convertTo24Hour(time);
    if (!time24) return '';
    const hour = time24.split(':')[0];
    // Ensure hour is padded to 2 digits (e.g., "2" -> "02")
    return hour.padStart(2, '0');
  };
  
  const getTimeMinute = (time: string) => {
    const time24 = convertTo24Hour(time);
    if (!time24) return '';
    const parts = time24.split(':');
    // Round minutes to nearest 10-minute interval for dropdown
    const minute = parts[1] ? parts[1].substring(0, 2) : '';
    const roundedMinute = Math.floor(parseInt(minute || '0') / 10) * 10;
    return roundedMinute.toString().padStart(2, '0');
  };

  const handleTimeChange = (field: 'time' | 'endTime', part: 'hour' | 'minute', value: string) => {
    const currentTime = convertTo24Hour(formData[field]) || '00:00';
    const [currentHour, currentMinute] = currentTime.split(':');
    const newTime = part === 'hour' 
      ? `${value}:${currentMinute || '00'}`
      : `${currentHour || '00'}:${value}`;
    setFormData({ ...formData, [field]: newTime });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: '',
      time: '',
      endTime: '',
      location: '',
      category: 'Workshop',
      capacity: '0',
      wheelchairAccessible: true,
      caregiverRequired: false,
      caregiverPaymentRequired: false,
      caregiverPaymentAmount: '',
      ageRestriction: '',
      skillLevel: 'all',
      volunteersNeeded: '0',
      isRecurring: false,
      recurringDates: [],
    });
    setEditingEvent(null);
    setShowForm(false);
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      endTime: event.endTime || '',
      location: event.location,
      category: event.category,
      capacity: event.capacity?.toString() || '0',
      wheelchairAccessible: event.wheelchairAccessible ?? true,
      caregiverRequired: event.caregiverRequired ?? false,
      caregiverPaymentRequired: event.caregiverPaymentRequired ?? false,
      caregiverPaymentAmount: event.caregiverPaymentAmount?.toString() || '',
      ageRestriction: event.ageRestriction || '',
      skillLevel: event.skillLevel || 'all',
      volunteersNeeded: event.volunteersNeeded?.toString() || '0',
      isRecurring: false,
      recurringDates: [],
    });
    setShowForm(true);
    setActiveTab('events');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    // Validate that start time is before end time
    if (formData.endTime && formData.time >= formData.endTime) {
      setMessage({ type: 'error', text: 'Start time must be earlier than end time.' });
      setIsSubmitting(false);
      return;
    }

    // Validate recurring dates if recurring is enabled
    if (formData.isRecurring && formData.recurringDates.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one date for recurring event.' });
      setIsSubmitting(false);
      return;
    }

    try {
      const isEditing = editingEvent !== null;
      const url = '/api/events';
      const method = isEditing ? 'PUT' : 'POST';
      
      const payload = {
        ...formData,
        capacity: formData.capacity !== '' ? parseInt(formData.capacity, 10) : 0,
        caregiverPaymentAmount: formData.caregiverPaymentAmount ? parseInt(formData.caregiverPaymentAmount, 10) : undefined,
        volunteersNeeded: formData.volunteersNeeded !== '' ? parseInt(formData.volunteersNeeded, 10) : 0,
        ...(isEditing && { id: editingEvent.id }),
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(isEditing ? 'Failed to update event' : 'Failed to add event');
      }

      const data = await response.json();
      
      if (isEditing) {
        setEvents(events.map((ev) => (ev.id === editingEvent.id ? { ...ev, ...data.event } : ev)));
        setMessage({ type: 'success', text: 'Event updated successfully!' });
      } else {
        // Handle both single and recurring events
        if (data.events) {
          // Multiple recurring events created
          setEvents([...events, ...data.events]);
          setMessage({ type: 'success', text: `${data.events.length} recurring events created successfully!` });
        } else {
          // Single event created
          setEvents([...events, data.event]);
          setMessage({ type: 'success', text: 'Event added successfully!' });
        }
      }
      
      resetForm();
    } catch (error) {
      console.error('Error saving event:', error);
      setMessage({ type: 'error', text: editingEvent ? 'Failed to update event.' : 'Failed to add event.' });
    } finally {
      setIsSubmitting(false);
    }
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

  const getEventRegistrations = (eventId: string) => {
    return registrations.filter((r) => r.eventId === eventId);
  };

  // Calendar view helpers
  const monthStart = startOfMonth(calendarMonth);
  const monthEnd = endOfMonth(calendarMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getEventsForDay = (day: Date) => {
    return events.filter((event) => isSameDay(parseISO(event.date), day));
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-blue-600">MINDS Staff Portal</h1>
            <p className="text-gray-600 text-sm mt-1">Enter password to access admin panel</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            {authError && <div className="bg-red-100 text-red-800 p-3 rounded-lg text-sm">{authError}</div>}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                required
              />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700">
              Login
            </button>
          </form>
          <div className="mt-6 text-center">
            <a href="/" className="text-blue-600 hover:text-blue-800 text-sm">← Back to Calendar</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-blue-600">MINDS Staff Portal</h1>
              <p className="text-gray-600 text-sm mt-1">Event Management & Attendance Tracking</p>
            </div>
            <div className="flex items-center gap-4">
              <a href="/" className="text-blue-600 hover:text-blue-800 text-sm font-medium">← Back to Calendar</a>
              <button onClick={handleLogout} className="text-red-600 hover:text-red-800 text-sm font-medium">Logout</button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            {(['events', 'attendance', 'calendar'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab === 'events' && '📅 Events'}
                {tab === 'attendance' && '✓ Attendance'}
                {tab === 'calendar' && '📆 Calendar View'}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message.text}
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <>
            {!showForm && (
              <div className="mb-6">
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  + Add New Event
                </button>
              </div>
            )}

            {showForm && (
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">{editingEvent ? 'Edit Event' : 'Add New Event'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                      <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                      <select required value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black">
                        {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                      <input type="date" required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Time * (24hr)</label>
                      <div className="flex gap-2">
                        <select required value={getTimeHour(formData.time)} onChange={(e) => handleTimeChange('time', 'hour', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black">
                          <option value="">HH</option>
                          {hourOptions.map((h) => <option key={h} value={h}>{h}</option>)}
                        </select>
                        <span className="flex items-center text-gray-500">:</span>
                        <select required value={getTimeMinute(formData.time)} onChange={(e) => handleTimeChange('time', 'minute', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black">
                          <option value="">MM</option>
                          {minuteOptions.map((m) => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Time (24hr)</label>
                      <div className="flex gap-2">
                        <select value={getTimeHour(formData.endTime)} onChange={(e) => handleTimeChange('endTime', 'hour', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black">
                          <option value="">HH</option>
                          {hourOptions.map((h) => <option key={h} value={h}>{h}</option>)}
                        </select>
                        <span className="flex items-center text-gray-500">:</span>
                        <select value={getTimeMinute(formData.endTime)} onChange={(e) => handleTimeChange('endTime', 'minute', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black">
                          <option value="">MM</option>
                          {minuteOptions.map((m) => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                      <input type="text" required value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                      <input type="number" min="0" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Volunteers Needed</label>
                      <input type="number" min="0" value={formData.volunteersNeeded} onChange={(e) => setFormData({ ...formData, volunteersNeeded: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Skill Level</label>
                      <select value={formData.skillLevel} onChange={(e) => setFormData({ ...formData, skillLevel: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black">
                        {skillLevels.map((level) => <option key={level} value={level}>{level === 'all' ? 'All Levels' : level.charAt(0).toUpperCase() + level.slice(1)}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Age Restriction</label>
                      <input type="text" value={formData.ageRestriction} onChange={(e) => setFormData({ ...formData, ageRestriction: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black" placeholder="e.g., 18+" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Caregiver Fee ($)</label>
                      <input type="number" value={formData.caregiverPaymentAmount} onChange={(e) => setFormData({ ...formData, caregiverPaymentAmount: e.target.value })}
                        disabled={!formData.caregiverPaymentRequired}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black disabled:bg-gray-100" />
                    </div>
                  </div>

                  {/* Checkboxes */}
                  <div className="flex flex-wrap gap-6 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={formData.wheelchairAccessible} onChange={(e) => setFormData({ ...formData, wheelchairAccessible: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded" />
                      <span className="text-sm text-gray-700">♿ Wheelchair Accessible</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={formData.caregiverRequired} onChange={(e) => setFormData({ ...formData, caregiverRequired: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded" />
                      <span className="text-sm text-gray-700">👥 Caregiver Required</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={formData.caregiverPaymentRequired} onChange={(e) => setFormData({ ...formData, caregiverPaymentRequired: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded" />
                      <span className="text-sm text-gray-700">💰 Caregiver Payment Required</span>
                    </label>
                    {!editingEvent && (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={formData.isRecurring} onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked, recurringDates: e.target.checked ? [] : [] })}
                          className="w-4 h-4 text-blue-600 rounded" />
                        <span className="text-sm text-gray-700">🔄 Create Recurring Event</span>
                      </label>
                    )}
                  </div>

                  {/* Recurring Dates Section */}
                  {formData.isRecurring && !editingEvent && (
                    <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-gray-800 mb-2">📅 Select Recurring Dates</h3>
                      <p className="text-xs text-gray-600 mb-3">All events will share the same time, location, capacity, and other settings.</p>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Add Date:</label>
                        <div className="flex gap-2 mb-3">
                          <input 
                            type="date" 
                            id="recurring-date-input"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                            onChange={(e) => {
                              const date = e.target.value;
                              if (date && !formData.recurringDates.includes(date)) {
                                setFormData({ ...formData, recurringDates: [...formData.recurringDates, date].sort() });
                                e.target.value = '';
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                              }
                            }}
                          />
                          <button 
                            type="button"
                            onClick={() => {
                              const input = document.getElementById('recurring-date-input') as HTMLInputElement;
                              const date = input.value;
                              if (date && !formData.recurringDates.includes(date)) {
                                setFormData({ ...formData, recurringDates: [...formData.recurringDates, date].sort() });
                                input.value = '';
                              }
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            Add
                          </button>
                        </div>
                        {formData.recurringDates.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Selected Dates ({formData.recurringDates.length}):</p>
                            <div className="flex flex-wrap gap-2">
                              {formData.recurringDates.map((date) => (
                                <div key={date} className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-1.5">
                                  <span className="text-sm text-gray-700">{format(parseISO(date), 'MMM dd, yyyy')}</span>
                                  <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, recurringDates: formData.recurringDates.filter(d => d !== date) })}
                                    className="text-red-600 hover:text-red-800 text-sm font-bold"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                    <textarea required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black" />
                  </div>

                  <div className="flex justify-end gap-3">
                    <button type="button" onClick={resetForm} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                    <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                      {isSubmitting ? 'Saving...' : editingEvent ? 'Update Event' : 'Add Event'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Events List */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">All Events ({events.length})</h2>
              {isLoading ? (
                <p className="text-gray-500">Loading events...</p>
              ) : events.length === 0 ? (
                <p className="text-gray-500">No events found.</p>
              ) : (
                <div className="space-y-4">
                  {events.map((event) => (
                    <div key={event.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-grow">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-800">{event.title}</h3>
                            <span className={`text-xs px-2 py-1 rounded-full border ${categoryColors[event.category]}`}>{event.category}</span>
                            {event.isRecurring && <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">🔄 Recurring</span>}
                            {event.wheelchairAccessible && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">♿</span>}
                            {event.caregiverRequired && <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">👥 Caregiver</span>}
                            {event.caregiverPaymentRequired && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">💰 ${event.caregiverPaymentAmount}</span>}
                          </div>
                          <p className="text-sm text-gray-600">{event.date} • {event.time}{event.endTime ? ` - ${event.endTime}` : ''} • {event.location}</p>
                          <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                            <span>Participants: {event.currentSignups || 0}/{event.capacity ?? 0}</span>
                            <span>Volunteers: {event.currentVolunteers || 0}/{event.volunteersNeeded || 0}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setSelectedEventForWaitlist(event)} className="text-purple-600 hover:text-purple-800 text-sm font-medium">
                            Manage Waitlist
                          </button>
                          <button onClick={() => handleEdit(event)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Edit</button>
                          <button onClick={() => handleDelete(event.id)} className="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
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
                className="w-full md:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
              >
                <option value="">-- Select an event --</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title} - {event.date}
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
                        <div className="bg-blue-50 rounded-lg p-4 text-center">
                          <p className="text-2xl font-bold text-blue-600">{activeRegs.length}</p>
                          <p className="text-sm text-gray-600">Active Registrations</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4 text-center">
                          <p className="text-2xl font-bold text-green-600">{attended}</p>
                          <p className="text-sm text-gray-600">Attended</p>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-4 text-center">
                          <p className="text-2xl font-bold text-purple-600">{participants.length}</p>
                          <p className="text-sm text-gray-600">Participants</p>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-4 text-center">
                          <p className="text-2xl font-bold text-orange-600">{volunteers.length}</p>
                          <p className="text-sm text-gray-600">Volunteers</p>
                        </div>
                        <div className="bg-red-50 rounded-lg p-4 text-center">
                          <p className="text-2xl font-bold text-red-600">{cancelled}</p>
                          <p className="text-sm text-gray-600">Cancelled</p>
                        </div>
                      </div>

                      {/* Registrations List */}
                      {eventRegs.length === 0 ? (
                        <p className="text-gray-500">No registrations for this event.</p>
                      ) : (
                        <div className="space-y-3">
                          {eventRegs.map((reg) => (
                            <div key={reg.id} className={`flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg gap-4 ${reg.status === 'cancelled' ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className={`font-medium ${reg.status === 'cancelled' ? 'text-gray-500 line-through' : 'text-gray-800'}`}>{getDisplayName(reg)}</p>
                                  {reg.isCaregiver && (
                                    <span className="text-xs px-2 py-1 rounded bg-indigo-100 text-indigo-800" title={`Caregiver: ${reg.userName}`}>
                                      👤 Caregiver
                                    </span>
                                  )}
                                  <span className={`text-xs px-2 py-1 rounded ${reg.registrationType === 'volunteer' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                    {reg.registrationType}
                                  </span>
                                  {reg.status === 'cancelled' && (
                                    <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-800">Cancelled</span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600">{reg.userEmail} • {reg.userPhone}</p>
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
                                  className={`px-3 py-2 border rounded-lg text-sm ${
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
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">
                      Removal History
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="space-y-3">
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
                                  <p className="text-sm text-gray-600 mt-1">
                                    👥 Caregiver: {removal.userName}
                                  </p>
                                )}
                                <p className="text-sm text-gray-600 mt-1">
                                  {removal.userEmail} • {removal.userPhone}
                                </p>
                                {removal.reason && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    <span className="font-medium">Reason:</span> {removal.reason}
                                  </p>
                                )}
                              </div>
                              <div className="text-right ml-4">
                                <p className="text-sm text-gray-600">
                                  Removed by: <span className="font-medium">{removal.removedBy}</span>
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(removal.removedAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Calendar View Tab */}
        {activeTab === 'calendar' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-800">
                {format(calendarMonth, 'MMMM yyyy')}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))}
                  className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  ← Prev
                </button>
                <button
                  onClick={() => setCalendarMonth(new Date())}
                  className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Today
                </button>
                <button
                  onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))}
                  className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Next →
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 border-b">
                  {day}
                </div>
              ))}
              
              {/* Empty cells for days before month starts */}
              {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="p-2 min-h-[100px] bg-gray-50"></div>
              ))}
              
              {/* Days of the month */}
              {daysInMonth.map((day) => {
                const dayEvents = getEventsForDay(day);
                const isToday = isSameDay(day, new Date());
                
                return (
                  <div
                    key={day.toISOString()}
                    className={`p-2 min-h-[100px] border ${isToday ? 'bg-blue-50 border-blue-200' : 'border-gray-100'}`}
                  >
                    <p className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                      {format(day, 'd')}
                    </p>
                    <div className="mt-1 space-y-1">
                      {dayEvents.slice(0, 3).map((event) => {
                        const regs = getEventRegistrations(event.id).filter(r => r.status !== 'cancelled');
                        return (
                          <div
                            key={event.id}
                            className={`text-xs p-1 rounded truncate cursor-pointer ${categoryColors[event.category]?.replace('border-', 'border-l-2 border-l-')}`}
                            title={`${event.title} - ${regs.length} registered`}
                            onClick={() => { setSelectedEventForAttendance(event.id); setActiveTab('attendance'); }}
                          >
                            {event.title}
                            <span className="ml-1 text-gray-500">({regs.length})</span>
                          </div>
                        );
                      })}
                      {dayEvents.length > 3 && (
                        <p className="text-xs text-gray-500">+{dayEvents.length - 3} more</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Waitlist Manager Modal */}
      {selectedEventForWaitlist && (
        <WaitlistManager
          event={selectedEventForWaitlist}
          onClose={() => setSelectedEventForWaitlist(null)}
          onRefresh={fetchEvents}
        />
      )}
    </div>
  );
}
