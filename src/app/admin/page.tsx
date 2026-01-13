'use client';

import { useState, useEffect } from 'react';
import { Event } from '@/types';
import { categoryColors } from '@/data/events';

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

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    endTime: '',
    location: '',
    category: 'Workshop',
    capacity: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Check if already authenticated on mount
  useEffect(() => {
    const storedAuth = localStorage.getItem('adminAuthenticated');
    if (storedAuth === 'true') {
      setIsAuthenticated(true);
      fetchEvents();
    }
    setIsCheckingAuth(false);
  }, []);

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

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: '',
      time: '',
      endTime: '',
      location: '',
      category: 'Workshop',
      capacity: '',
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
      capacity: event.capacity?.toString() || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const isEditing = editingEvent !== null;
      const url = '/api/events';
      const method = isEditing ? 'PUT' : 'POST';
      
      const payload = {
        ...formData,
        capacity: formData.capacity ? parseInt(formData.capacity, 10) : undefined,
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
        setEvents([...events, data.event]);
        setMessage({ type: 'success', text: 'Event added successfully!' });
      }
      
      resetForm();
    } catch (error) {
      console.error('Error saving event:', error);
      setMessage({ type: 'error', text: editingEvent ? 'Failed to update event. Please try again.' : 'Failed to add event. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const response = await fetch(`/api/events?id=${eventId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      setEvents(events.filter((event) => event.id !== eventId));
      setMessage({ type: 'success', text: 'Event deleted successfully!' });
    } catch (error) {
      console.error('Error deleting event:', error);
      setMessage({ type: 'error', text: 'Failed to delete event. Please try again.' });
    }
  };

  // Show loading state while checking auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-blue-600">MINDS Admin</h1>
            <p className="text-gray-600 text-sm mt-1">Enter password to access admin panel</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {authError && (
              <div className="bg-red-100 text-red-800 p-3 rounded-lg text-sm">
                {authError}
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-black"
                placeholder="Enter admin password"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Login
            </button>
          </form>

          <div className="mt-6 text-center">
            <a href="/" className="text-blue-600 hover:text-blue-800 text-sm">
              ← Back to Calendar
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated admin view
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-blue-600">MINDS Admin</h1>
              <p className="text-gray-600 text-sm mt-1">Manage Events</p>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="/"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                ← Back to Calendar
              </a>
              <button
                onClick={handleLogout}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Add Event Button */}
        <div className="mb-6">
          <button
            onClick={() => {
              if (showForm) {
                resetForm();
              } else {
                setShowForm(true);
              }
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showForm ? 'Cancel' : '+ Add New Event'}
          </button>
        </div>

        {/* Add/Edit Event Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {editingEvent ? 'Edit Event' : 'Add New Event'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-black"
                    placeholder="Event title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-black"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-black"
                    placeholder="Event location"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-black"
                    placeholder="e.g., 10:00 AM"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="text"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-black"
                    placeholder="e.g., 12:00 PM"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capacity
                  </label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-black"
                    placeholder="Maximum participants"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-black"
                  placeholder="Event description"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingEvent ? 'Update Event' : 'Add Event'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Events List */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">All Events</h2>
          
          {isLoading ? (
            <p className="text-gray-500">Loading events...</p>
          ) : events.length === 0 ? (
            <p className="text-gray-500">No events found. Add your first event!</p>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex-grow">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-800">{event.title}</h3>
                      <span
                        className={`text-xs px-2 py-1 rounded-full border ${
                          categoryColors[event.category] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {event.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {event.date} • {event.time}
                      {event.endTime ? ` - ${event.endTime}` : ''} • {event.location}
                    </p>
                    {event.capacity && (
                      <p className="text-sm text-gray-500 mt-1">
                        Capacity: {event.currentSignups || 0}/{event.capacity}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(event)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(event.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
