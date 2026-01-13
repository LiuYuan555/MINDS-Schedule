'use client';

import { useState, useEffect } from 'react';
import Calendar from '@/components/Calendar';
import EventList from '@/components/EventList';
import SignUpModal, { SignUpFormData } from '@/components/SignUpModal';
import { Event, ViewMode, MembershipType, MEMBERSHIP_LABELS } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { startOfWeek, endOfWeek, parseISO, isWithinInterval } from 'date-fns';

export default function Home() {
  const { user, login, register, logout, updateMembership } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [userWeeklyRegistrations, setUserWeeklyRegistrations] = useState(0);
  
  // Form states
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    membershipType: 'adhoc' as MembershipType,
  });
  const [formError, setFormError] = useState('');

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
      setShowLoginModal(true);
      return;
    }
    setSelectedEvent(event);
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const success = await login(loginData.email, loginData.password);
    if (success) {
      setShowLoginModal(false);
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
      role: 'participant',
    });
    if (success) {
      setShowRegisterModal(false);
      setRegisterData({
        name: '',
        email: '',
        phone: '',
        password: '',
        membershipType: 'adhoc',
      });
    } else {
      setFormError('Registration failed. Email may already be in use.');
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
            
            <div className="flex items-center gap-4">
              {/* Navigation Links */}
              <nav className="flex gap-4 text-sm">
                <a href="/volunteer" className="text-green-600 hover:text-green-800 font-medium">
                  Volunteer Portal
                </a>
                <a href="/admin" className="text-gray-600 hover:text-gray-800">
                  Staff Login
                </a>
              </nav>

              {/* User Auth */}
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-800">{user.name}</p>
                    {user.membershipType && (
                      <button
                        onClick={() => setShowMembershipModal(true)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        {MEMBERSHIP_LABELS[user.membershipType as MembershipType]}
                      </button>
                    )}
                  </div>
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
                    onClick={() => setShowLoginModal(true)}
                    className="px-4 py-2 text-sm text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => setShowRegisterModal(true)}
                    className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    Register
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2 mt-4 bg-gray-100 p-1 rounded-lg w-fit">
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
          userWeeklyRegistrations={userWeeklyRegistrations}
        />
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Login</h2>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowLoginModal(false); setFormError(''); }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Login
                </button>
              </div>
              <p className="text-center text-sm text-gray-600">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setShowLoginModal(false); setShowRegisterModal(true); setFormError(''); }}
                  className="text-blue-600 hover:underline"
                >
                  Register here
                </button>
              </p>
            </form>
          </div>
        </div>
      )}

      {/* Register Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Create Account</h2>
            <form onSubmit={handleRegister} className="space-y-4">
              {formError && (
                <div className="bg-red-100 text-red-800 p-3 rounded-lg text-sm">{formError}</div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={registerData.name}
                  onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Membership Type *</label>
                <select
                  value={registerData.membershipType}
                  onChange={(e) => setRegisterData({ ...registerData, membershipType: e.target.value as MembershipType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
                >
                  <option value="adhoc">Ad-hoc Engagement (No limit)</option>
                  <option value="once_weekly">Once a Week (1 event/week)</option>
                  <option value="twice_weekly">Twice a Week (2 events/week)</option>
                  <option value="three_plus_weekly">3 or More Times a Week (No limit)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  This determines how many events you can register for per week.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowRegisterModal(false); setFormError(''); }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Membership Change Modal */}
      {showMembershipModal && user && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Change Membership Type</h2>
            <div className="space-y-3">
              {(Object.keys(MEMBERSHIP_LABELS) as MembershipType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    updateMembership(type);
                    setShowMembershipModal(false);
                  }}
                  className={`w-full p-4 text-left rounded-lg border transition-colors ${
                    user.membershipType === type
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <p className="font-medium text-gray-800">{MEMBERSHIP_LABELS[type]}</p>
                  <p className="text-sm text-gray-500">
                    {type === 'adhoc' && 'Register for events as needed, no weekly limit'}
                    {type === 'once_weekly' && 'Register for up to 1 event per week'}
                    {type === 'twice_weekly' && 'Register for up to 2 events per week'}
                    {type === 'three_plus_weekly' && 'Register for 3 or more events per week'}
                  </p>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowMembershipModal(false)}
              className="w-full mt-4 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
