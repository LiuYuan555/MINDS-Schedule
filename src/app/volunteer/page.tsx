'use client';

import { useState, useEffect } from 'react';
import { Event } from '@/types';
import { categoryColors } from '@/data/events';
import { useAuth } from '@/context/AuthContext';
import { format, parseISO } from 'date-fns';

export default function VolunteerPage() {
  const { user, login, register, logout } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [myRegistrations, setMyRegistrations] = useState<string[]>([]);
  const [filter, setFilter] = useState<'all' | 'needs-volunteers'>('needs-volunteers');
  
  // Form states
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    skills: [] as string[],
    availability: [] as string[],
    emergencyContact: '',
    emergencyPhone: '',
  });
  const [formError, setFormError] = useState('');

  const skillOptions = ['First Aid', 'Teaching', 'Sports', 'Arts & Crafts', 'Music', 'Cooking', 'IT Skills', 'Languages', 'Driving', 'Photography'];
  const availabilityOptions = ['Weekday Mornings', 'Weekday Afternoons', 'Weekday Evenings', 'Weekend Mornings', 'Weekend Afternoons', 'Weekend Evenings'];

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const success = await login(loginData.email, loginData.password);
    if (success) {
      setShowLoginForm(false);
      setLoginData({ email: '', password: '' });
    } else {
      setFormError('Invalid email or password');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const success = await register({
      ...registerData,
      role: 'volunteer',
    });
    if (success) {
      setShowRegisterForm(false);
      setRegisterData({
        name: '',
        email: '',
        phone: '',
        password: '',
        skills: [],
        availability: [],
        emergencyContact: '',
        emergencyPhone: '',
      });
    } else {
      setFormError('Registration failed. Email may already be in use.');
    }
  };

  const handleVolunteerSignup = async (event: Event) => {
    if (!user) {
      setShowLoginForm(true);
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
          userName: user.name,
          userEmail: user.email,
          userPhone: user.phone,
          registrationType: 'volunteer',
        }),
      });

      if (response.ok) {
        setMyRegistrations([...myRegistrations, event.id]);
        // Refresh events to show updated volunteer counts
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
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-green-600">MINDS Volunteer Portal</h1>
              <p className="text-gray-600 text-sm mt-1">Make a difference in someone&apos;s life</p>
            </div>
            <div className="flex items-center gap-4">
              <a href="/" className="text-blue-600 hover:text-blue-800 text-sm">
                ← Back to Calendar
              </a>
              {user ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">Welcome, {user.name}</span>
                  <button
                    onClick={logout}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowLoginForm(true)}
                    className="px-4 py-2 text-sm text-green-600 border border-green-600 rounded-lg hover:bg-green-50"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => setShowRegisterForm(true)}
                    className="px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700"
                  >
                    Register
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section for New Volunteers */}
        {!user && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-green-800 mb-2">Welcome to MINDS Volunteer Portal!</h2>
            <p className="text-green-700 mb-4">
              Thank you for your interest in volunteering with MINDS Singapore. Our volunteers play a crucial role 
              in supporting people with intellectual disabilities and their families.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="bg-white rounded-lg p-4">
                <div className="text-2xl mb-2">📋</div>
                <h3 className="font-medium text-gray-800">1. Register</h3>
                <p className="text-sm text-gray-600">Create your volunteer account with your skills and availability</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="text-2xl mb-2">🔍</div>
                <h3 className="font-medium text-gray-800">2. Browse Events</h3>
                <p className="text-sm text-gray-600">Find events that match your interests and schedule</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="text-2xl mb-2">✅</div>
                <h3 className="font-medium text-gray-800">3. Sign Up</h3>
                <p className="text-sm text-gray-600">Register for events and make a difference</p>
              </div>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="flex items-center gap-4 mb-6">
          <span className="text-sm font-medium text-gray-700">Show:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('needs-volunteers')}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                filter === 'needs-volunteers'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Needs Volunteers
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                filter === 'all'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Events
            </button>
          </div>
        </div>

        {/* Events List */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {filter === 'needs-volunteers' ? 'Events Needing Volunteers' : 'All Upcoming Events'}
          </h2>

          {isLoading ? (
            <p className="text-gray-500">Loading events...</p>
          ) : sortedEvents.length === 0 ? (
            <p className="text-gray-500">No events found.</p>
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
                              Not wheelchair accessible
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 md:mt-0 md:ml-4 flex flex-col items-end gap-2">
                      <div className={`text-sm font-medium ${spotsLeft > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                        {spotsLeft > 0 ? `${spotsLeft} volunteer spots left` : 'Fully staffed'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {currentVolunteers}/{volunteersNeeded} volunteers
                      </div>
                      {isRegistered ? (
                        <span className="px-4 py-2 text-sm text-green-600 bg-green-100 rounded-lg">
                          ✓ Registered
                        </span>
                      ) : spotsLeft > 0 ? (
                        <button
                          onClick={() => handleVolunteerSignup(event)}
                          className="px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Volunteer
                        </button>
                      ) : (
                        <span className="px-4 py-2 text-sm text-gray-500 bg-gray-100 rounded-lg">
                          Full
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

      {/* Login Modal */}
      {showLoginForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Volunteer Login</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              {formError && (
                <div className="bg-red-100 text-red-800 p-3 rounded-lg text-sm">{formError}</div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-black"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowLoginForm(false); setFormError(''); }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Login
                </button>
              </div>
              <p className="text-center text-sm text-gray-600">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setShowLoginForm(false); setShowRegisterForm(true); setFormError(''); }}
                  className="text-green-600 hover:underline"
                >
                  Register here
                </button>
              </p>
            </form>
          </div>
        </div>
      )}

      {/* Register Modal */}
      {showRegisterForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Volunteer Registration</h2>
            <form onSubmit={handleRegister} className="space-y-4">
              {formError && (
                <div className="bg-red-100 text-red-800 p-3 rounded-lg text-sm">{formError}</div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={registerData.name}
                    onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input
                    type="tel"
                    required
                    pattern="[0-9]*"
                    value={registerData.phone}
                    onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value.replace(/[^0-9]/g, '') })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Name</label>
                  <input
                    type="text"
                    value={registerData.emergencyContact}
                    onChange={(e) => setRegisterData({ ...registerData, emergencyContact: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Phone</label>
                  <input
                    type="tel"
                    pattern="[0-9]*"
                    value={registerData.emergencyPhone}
                    onChange={(e) => setRegisterData({ ...registerData, emergencyPhone: e.target.value.replace(/[^0-9]/g, '') })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Skills (select all that apply)</label>
                <div className="flex flex-wrap gap-2">
                  {skillOptions.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => {
                        const skills = registerData.skills.includes(skill)
                          ? registerData.skills.filter((s) => s !== skill)
                          : [...registerData.skills, skill];
                        setRegisterData({ ...registerData, skills });
                      }}
                      className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                        registerData.skills.includes(skill)
                          ? 'bg-green-600 text-white border-green-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-green-500'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Availability (select all that apply)</label>
                <div className="flex flex-wrap gap-2">
                  {availabilityOptions.map((avail) => (
                    <button
                      key={avail}
                      type="button"
                      onClick={() => {
                        const availability = registerData.availability.includes(avail)
                          ? registerData.availability.filter((a) => a !== avail)
                          : [...registerData.availability, avail];
                        setRegisterData({ ...registerData, availability });
                      }}
                      className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                        registerData.availability.includes(avail)
                          ? 'bg-green-600 text-white border-green-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-green-500'
                      }`}
                    >
                      {avail}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowRegisterForm(false); setFormError(''); }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
