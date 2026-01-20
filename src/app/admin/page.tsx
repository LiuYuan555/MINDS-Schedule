'use client';

import { useState, useEffect } from 'react';
import { useUser, SignInButton, useClerk } from '@clerk/nextjs';
import { Event, Registration } from '@/types';
import { categoryColors } from '@/data/events';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, startOfWeek, endOfWeek, addMonths, subMonths, isToday, isSameMonth, subWeeks, isWithinInterval, differenceInDays } from 'date-fns';
import WaitlistManager from '@/components/WaitlistManager';
import EventFormModal from '@/components/EventFormModal';
import UserManagement from '@/components/UserManagement';

type TabType = 'events' | 'attendance' | 'calendar' | 'users' | 'statistics';

function StatisticsDashboard({ events, registrations }: { events: Event[]; registrations: Registration[] }) {
  const [selectedWeek, setSelectedWeek] = useState(0); // 0 = current week, -1 = last week, etc.
  
  // Filter to only include past events for statistics
  const pastEvents = events.filter(e => e.eventStatus === 'past');
  const pastEventIds = new Set(pastEvents.map(e => e.id));
  const pastRegistrations = registrations.filter(r => pastEventIds.has(r.eventId));
  
  const today = new Date();
  
  // Calculate week ranges
  const getWeekRange = (weeksAgo: number) => {
    const start = startOfWeek(subWeeks(today, -weeksAgo), { weekStartsOn: 1 });
    const end = endOfWeek(subWeeks(today, -weeksAgo), { weekStartsOn: 1 });
    return { start, end };
  };
  
  const currentWeek = getWeekRange(selectedWeek);
  const previousWeek = getWeekRange(selectedWeek - 1);
  
  // Filter data by week (using only past events)
  const getWeekEvents = (weekRange: { start: Date; end: Date }) => {
    return pastEvents.filter(e => {
      const eventDate = parseISO(e.date);
      return isWithinInterval(eventDate, weekRange);
    });
  };
  
  const getWeekRegistrations = (weekRange: { start: Date; end: Date }) => {
    return pastRegistrations.filter(r => {
      const event = pastEvents.find(e => e.id === r.eventId);
      if (!event) return false;
      const eventDate = parseISO(event.date);
      return isWithinInterval(eventDate, weekRange);
    });
  };
  
  const currentWeekEvents = getWeekEvents(currentWeek);
  const previousWeekEvents = getWeekEvents(previousWeek);
  const currentWeekRegs = getWeekRegistrations(currentWeek);
  const previousWeekRegs = getWeekRegistrations(previousWeek);
  
  // Calculate metrics
  const calculateMetrics = (weekEvents: Event[], weekRegs: Registration[]) => {
    const totalEvents = weekEvents.length;
    const totalRegistrations = weekRegs.filter(r => r.status !== 'cancelled').length;
    const attended = weekRegs.filter(r => r.status === 'attended').length;
    const cancelled = weekRegs.filter(r => r.status === 'cancelled').length;
    const totalCapacity = weekEvents.reduce((sum, e) => sum + (e.capacity || 0), 0);
    
    const attendanceRate = totalRegistrations > 0 ? (attended / totalRegistrations) * 100 : 0;
    const cancellationRate = (totalRegistrations + cancelled) > 0 ? (cancelled / (totalRegistrations + cancelled)) * 100 : 0;
    const fillRate = totalCapacity > 0 ? (totalRegistrations / totalCapacity) * 100 : 0;
    
    const participants = weekRegs.filter(r => r.registrationType === 'participant' && r.status !== 'cancelled').length;
    const volunteers = weekRegs.filter(r => r.registrationType === 'volunteer' && r.status !== 'cancelled').length;
    const caregiverRegistrations = weekRegs.filter(r => r.isCaregiver && r.status !== 'cancelled').length;
    const selfRegistrations = weekRegs.filter(r => !r.isCaregiver && r.status !== 'cancelled').length;
    
    return {
      totalEvents,
      totalRegistrations,
      attended,
      cancelled,
      attendanceRate,
      cancellationRate,
      fillRate,
      participants,
      volunteers,
      caregiverRegistrations,
      selfRegistrations,
    };
  };
  
  const currentMetrics = calculateMetrics(currentWeekEvents, currentWeekRegs);
  const previousMetrics = calculateMetrics(previousWeekEvents, previousWeekRegs);
  
  // Calculate change percentages
  const getChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };
  
  // Top performing events (by fill rate) - using only past events
  const eventPerformance = pastEvents
    .map(e => {
      const eventRegs = pastRegistrations.filter(r => r.eventId === e.id);
      const activeRegs = eventRegs.filter(r => r.status !== 'cancelled').length;
      const attended = eventRegs.filter(r => r.status === 'attended').length;
      const cancelled = eventRegs.filter(r => r.status === 'cancelled').length;
      const fillRate = e.capacity ? (activeRegs / e.capacity) * 100 : 0;
      const attendanceRate = activeRegs > 0 ? (attended / activeRegs) * 100 : 0;
      const cancellationRate = (activeRegs + cancelled) > 0 ? (cancelled / (activeRegs + cancelled)) * 100 : 0;
      
      return {
        ...e,
        activeRegs,
        attended,
        cancelled,
        fillRate,
        attendanceRate,
        cancellationRate,
      };
    })
    .sort((a, b) => b.fillRate - a.fillRate);
  
  // Category performance (using only past events)
  const categoryStats = Object.keys(categoryColors).map(category => {
    const catEvents = pastEvents.filter(e => e.category === category);
    const catRegs = pastRegistrations.filter(r => {
      const event = pastEvents.find(e => e.id === r.eventId);
      return event?.category === category;
    });
    const activeRegs = catRegs.filter(r => r.status !== 'cancelled').length;
    const attended = catRegs.filter(r => r.status === 'attended').length;
    const totalCapacity = catEvents.reduce((sum, e) => sum + (e.capacity || 0), 0);
    
    return {
      category,
      eventCount: catEvents.length,
      registrations: activeRegs,
      attended,
      fillRate: totalCapacity > 0 ? (activeRegs / totalCapacity) * 100 : 0,
      attendanceRate: activeRegs > 0 ? (attended / activeRegs) * 100 : 0,
    };
  }).filter(c => c.eventCount > 0).sort((a, b) => b.fillRate - a.fillRate);
  
  // Inactive participants (registered but not attended in last 30 days)
  const thirtyDaysAgo = subWeeks(today, 4);
  const recentEvents = pastEvents.filter(e => {
    const eventDate = parseISO(e.date);
    return eventDate >= thirtyDaysAgo && eventDate <= today;
  });
  
  const participantActivity = new Map<string, { name: string; email: string; lastAttended: Date | null; totalRegistrations: number; totalAttended: number }>();
  
  pastRegistrations.forEach(r => {
    const event = pastEvents.find(e => e.id === r.eventId);
    if (!event) return;
    
    const existing = participantActivity.get(r.userId) || {
      name: r.userName,
      email: r.userEmail,
      lastAttended: null,
      totalRegistrations: 0,
      totalAttended: 0,
    };
    
    if (r.status !== 'cancelled') {
      existing.totalRegistrations++;
    }
    
    if (r.status === 'attended') {
      existing.totalAttended++;
      const eventDate = parseISO(event.date);
      if (!existing.lastAttended || eventDate > existing.lastAttended) {
        existing.lastAttended = eventDate;
      }
    }
    
    participantActivity.set(r.userId, existing);
  });
  
  const inactiveParticipants = Array.from(participantActivity.entries())
    .filter(([_, data]) => {
      if (!data.lastAttended) return data.totalRegistrations > 0;
      return differenceInDays(today, data.lastAttended) > 30;
    })
    .map(([userId, data]) => ({ userId, ...data }))
    .sort((a, b) => {
      if (!a.lastAttended) return -1;
      if (!b.lastAttended) return 1;
      return a.lastAttended.getTime() - b.lastAttended.getTime();
    })
    .slice(0, 10);

  // Absent users - registered for past events but didn't attend (status is not 'attended' and not 'cancelled')
  const absentUserData = new Map<string, { 
    name: string; 
    email: string; 
    absentEvents: { eventId: string; eventTitle: string; eventDate: string }[];
    totalRegistrations: number;
    totalAbsent: number;
  }>();

  pastRegistrations.forEach(r => {
    const event = pastEvents.find(e => e.id === r.eventId);
    if (!event) return;
    
    // Only count non-cancelled registrations
    if (r.status === 'cancelled') return;
    
    const existing = absentUserData.get(r.userId) || {
      name: r.userName,
      email: r.userEmail,
      absentEvents: [],
      totalRegistrations: 0,
      totalAbsent: 0,
    };
    
    existing.totalRegistrations++;
    
    // Track users with status explicitly marked as 'absent'
    if (r.status === 'absent') {
      existing.totalAbsent++;
      existing.absentEvents.push({
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.date,
      });
    }
    
    absentUserData.set(r.userId, existing);
  });

  // Users with at least one absence, sorted by absence rate then total absences
  const absentUsers = Array.from(absentUserData.entries())
    .filter(([_, data]) => data.totalAbsent > 0)
    .map(([userId, data]) => ({
      userId,
      ...data,
      absenceRate: data.totalRegistrations > 0 ? (data.totalAbsent / data.totalRegistrations) * 100 : 0,
    }))
    .sort((a, b) => {
      // Sort by absence rate first, then by total absences
      if (b.absenceRate !== a.absenceRate) return b.absenceRate - a.absenceRate;
      return b.totalAbsent - a.totalAbsent;
    })
    .slice(0, 10);

  // Export function
  const exportToCSV = () => {
    const headers = ['Metric', 'This Week', 'Last Week', 'Change %'];
    const rows = [
      ['Total Events', currentMetrics.totalEvents, previousMetrics.totalEvents, getChange(currentMetrics.totalEvents, previousMetrics.totalEvents).toFixed(1)],
      ['Total Registrations', currentMetrics.totalRegistrations, previousMetrics.totalRegistrations, getChange(currentMetrics.totalRegistrations, previousMetrics.totalRegistrations).toFixed(1)],
      ['Attendance Rate %', currentMetrics.attendanceRate.toFixed(1), previousMetrics.attendanceRate.toFixed(1), (currentMetrics.attendanceRate - previousMetrics.attendanceRate).toFixed(1)],
      ['Cancellation Rate %', currentMetrics.cancellationRate.toFixed(1), previousMetrics.cancellationRate.toFixed(1), (currentMetrics.cancellationRate - previousMetrics.cancellationRate).toFixed(1)],
      ['Fill Rate %', currentMetrics.fillRate.toFixed(1), previousMetrics.fillRate.toFixed(1), (currentMetrics.fillRate - previousMetrics.fillRate).toFixed(1)],
      ['Participants', currentMetrics.participants, previousMetrics.participants, getChange(currentMetrics.participants, previousMetrics.participants).toFixed(1)],
      ['Volunteers', currentMetrics.volunteers, previousMetrics.volunteers, getChange(currentMetrics.volunteers, previousMetrics.volunteers).toFixed(1)],
      ['Caregiver Registrations', currentMetrics.caregiverRegistrations, previousMetrics.caregiverRegistrations, getChange(currentMetrics.caregiverRegistrations, previousMetrics.caregiverRegistrations).toFixed(1)],
      ['Self Registrations', currentMetrics.selfRegistrations, previousMetrics.selfRegistrations, getChange(currentMetrics.selfRegistrations, previousMetrics.selfRegistrations).toFixed(1)],
    ];
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `minds-statistics-${format(today, 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const StatCard = ({ title, value, previousValue, suffix = '', invertColors = false }: { title: string; value: number; previousValue: number; suffix?: string; invertColors?: boolean }) => {
    const change = value - previousValue;
    const isPositive = invertColors ? change < 0 : change > 0;
    const isNegative = invertColors ? change > 0 : change < 0;
    
    return (
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <p className="text-sm text-gray-500 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{typeof value === 'number' && value % 1 !== 0 ? value.toFixed(1) : value}{suffix}</p>
        <div className={`text-xs mt-1 flex items-center gap-1 ${isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-500'}`}>
          {change !== 0 && (
            <>
              {isPositive ? '↑' : '↓'}
              {Math.abs(change).toFixed(1)}{suffix}
            </>
          )}
          {change === 0 && '→ No change'}
          <span className="text-gray-400 ml-1">vs last week</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">📊 Statistics Dashboard</h2>
          <p className="text-sm text-gray-500">
            Week of {format(currentWeek.start, 'MMM d')} - {format(currentWeek.end, 'MMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setSelectedWeek(w => w - 1)}
              className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 rounded-md"
            >
              ← Prev
            </button>
            <button
              onClick={() => setSelectedWeek(0)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md ${selectedWeek === 0 ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'}`}
            >
              This Week
            </button>
            <button
              onClick={() => setSelectedWeek(w => w + 1)}
              disabled={selectedWeek >= 0}
              className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <StatCard title="Total Events" value={currentMetrics.totalEvents} previousValue={previousMetrics.totalEvents} />
        <StatCard title="Registrations" value={currentMetrics.totalRegistrations} previousValue={previousMetrics.totalRegistrations} />
        <StatCard title="Attendance Rate" value={currentMetrics.attendanceRate} previousValue={previousMetrics.attendanceRate} suffix="%" />
        <StatCard title="Cancellation Rate" value={currentMetrics.cancellationRate} previousValue={previousMetrics.cancellationRate} suffix="%" invertColors />
        <StatCard title="Fill Rate" value={currentMetrics.fillRate} previousValue={previousMetrics.fillRate} suffix="%" />
      </div>

      {/* Participant Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">👥 Registration Types</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Participants</span>
                <span className="font-medium text-gray-800">{currentMetrics.participants}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${currentMetrics.totalRegistrations > 0 ? (currentMetrics.participants / currentMetrics.totalRegistrations) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Volunteers</span>
                <span className="font-medium text-gray-800">{currentMetrics.volunteers}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${currentMetrics.totalRegistrations > 0 ? (currentMetrics.volunteers / currentMetrics.totalRegistrations) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">🤝 Caregiver vs Self-Registered</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Self-Registered</span>
                <span className="font-medium text-gray-800">{currentMetrics.selfRegistrations}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500 rounded-full transition-all"
                  style={{ width: `${currentMetrics.totalRegistrations > 0 ? (currentMetrics.selfRegistrations / currentMetrics.totalRegistrations) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Caregiver-Registered</span>
                <span className="font-medium text-gray-800">{currentMetrics.caregiverRegistrations}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-orange-500 rounded-full transition-all"
                  style={{ width: `${currentMetrics.totalRegistrations > 0 ? (currentMetrics.caregiverRegistrations / currentMetrics.totalRegistrations) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Events & Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Events */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">🏆 Top Events by Fill Rate</h3>
          {eventPerformance.length === 0 ? (
            <p className="text-gray-500 text-sm">No past events yet.</p>
          ) : (
            <div className="space-y-3">
              {eventPerformance.slice(0, 5).map((event, idx) => (
                <div key={event.id} className="flex items-center gap-3">
                  <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                    idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                    idx === 1 ? 'bg-gray-100 text-gray-700' :
                    idx === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-50 text-gray-500'
                  }`}>
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{event.title}</p>
                    <p className="text-xs text-gray-500">{format(parseISO(event.date), 'MMM d')} • {event.activeRegs}/{event.capacity || '∞'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-blue-600">{event.fillRate.toFixed(0)}%</p>
                    <p className="text-xs text-gray-500">fill rate</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category Performance */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">📁 Category Performance</h3>
          {categoryStats.length === 0 ? (
            <p className="text-gray-500 text-sm">No category data yet.</p>
          ) : (
            <div className="space-y-3">
              {categoryStats.slice(0, 5).map((cat) => (
                <div key={cat.category} className="flex items-center gap-3">
                  <span className={`px-2 py-1 text-xs rounded-full ${categoryColors[cat.category]}`}>
                    {cat.category}
                  </span>
                  <div className="flex-1">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${Math.min(cat.fillRate, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right w-20">
                    <p className="font-semibold text-gray-800">{cat.fillRate.toFixed(0)}%</p>
                    <p className="text-xs text-gray-500">{cat.eventCount} events</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Inactive Participants */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-4">⚠️ Participants to Re-engage (No attendance in 30+ days)</h3>
        {inactiveParticipants.length === 0 ? (
          <p className="text-gray-500 text-sm">All participants are active! 🎉</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Name</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Email</th>
                  <th className="text-center py-2 px-3 font-medium text-gray-600">Total Registrations</th>
                  <th className="text-center py-2 px-3 font-medium text-gray-600">Total Attended</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Last Attended</th>
                </tr>
              </thead>
              <tbody>
                {inactiveParticipants.map((p) => (
                  <tr key={p.userId} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-3 font-medium text-gray-800">{p.name}</td>
                    <td className="py-2 px-3 text-gray-600">{p.email}</td>
                    <td className="py-2 px-3 text-center">{p.totalRegistrations}</td>
                    <td className="py-2 px-3 text-center">{p.totalAttended}</td>
                    <td className="py-2 px-3">
                      {p.lastAttended ? (
                        <span className="text-red-600">{format(p.lastAttended, 'MMM d, yyyy')} ({differenceInDays(today, p.lastAttended)} days ago)</span>
                      ) : (
                        <span className="text-orange-600">Never attended</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Absent Users - Registered but didn't attend */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-4">🚫 Absent Users (Registered but didn&apos;t attend)</h3>
        {absentUsers.length === 0 ? (
          <p className="text-gray-500 text-sm">No absences recorded for past events! 🎉</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Name</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Email</th>
                  <th className="text-center py-2 px-3 font-medium text-gray-600">Absences</th>
                  <th className="text-center py-2 px-3 font-medium text-gray-600">Total Registrations</th>
                  <th className="text-center py-2 px-3 font-medium text-gray-600">Absence Rate</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Missed Events</th>
                </tr>
              </thead>
              <tbody>
                {absentUsers.map((u) => (
                  <tr key={u.userId} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-3 font-medium text-gray-800">{u.name}</td>
                    <td className="py-2 px-3 text-gray-600">{u.email}</td>
                    <td className="py-2 px-3 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-700 font-semibold text-xs">
                        {u.totalAbsent}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">{u.totalRegistrations}</td>
                    <td className="py-2 px-3 text-center">
                      <span className={`font-medium ${
                        u.absenceRate >= 75 ? 'text-red-600' :
                        u.absenceRate >= 50 ? 'text-orange-600' :
                        u.absenceRate >= 25 ? 'text-yellow-600' :
                        'text-gray-600'
                      }`}>
                        {u.absenceRate.toFixed(0)}%
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {u.absentEvents.slice(0, 3).map((event, idx) => (
                          <span 
                            key={`${event.eventId}-${idx}`}
                            className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded truncate max-w-[120px]"
                            title={`${event.eventTitle} - ${format(parseISO(event.eventDate), 'MMM d, yyyy')}`}
                          >
                            {event.eventTitle}
                          </span>
                        ))}
                        {u.absentEvents.length > 3 && (
                          <span className="inline-block px-2 py-0.5 bg-gray-200 text-gray-500 text-xs rounded">
                            +{u.absentEvents.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  
  // Check if user has admin role
  const isAdmin = user?.publicMetadata?.role === 'admin';
  
  const [activeTab, setActiveTab] = useState<TabType>('calendar');
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [removalHistory, setRemovalHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [expandedEventIds, setExpandedEventIds] = useState<Set<string>>(new Set());
  const [selectedEventForWaitlist, setSelectedEventForWaitlist] = useState<Event | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedDateForNewEvent, setSelectedDateForNewEvent] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [calendarView, setCalendarView] = useState<'month' | 'week'>('month');
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null);
  const [eventsFilter, setEventsFilter] = useState<'upcoming' | 'past'>('upcoming');
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [attendanceCategoryFilter, setAttendanceCategoryFilter] = useState<string>('all');
  const [attendanceSortBy, setAttendanceSortBy] = useState<'date' | 'category' | 'name'>('date');
  const [attendanceSortOrder, setAttendanceSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch data when user is authenticated and is admin
  useEffect(() => {
    if (isLoaded && isSignedIn && isAdmin) {
      fetchEvents();
      fetchRegistrations();
    }
  }, [isLoaded, isSignedIn, isAdmin]);

  // Fetch removal history when events are expanded
  useEffect(() => {
    const fetchAllRemovalHistories = async () => {
      if (expandedEventIds.size === 0) {
        setRemovalHistory([]);
        return;
      }
      
      const allHistories: any[] = [];
      for (const eventId of expandedEventIds) {
        try {
          const history = await fetchRemovalHistory(eventId);
          if (history && history.length > 0) {
            allHistories.push(...history.map((h: any) => ({ ...h, eventId })));
          }
        } catch {
          // Ignore errors for individual fetches
        }
      }
      setRemovalHistory(allHistories);
    };
    
    fetchAllRemovalHistories();
  }, [expandedEventIds]);

  // Auto-dismiss messages after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

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

  const fetchRemovalHistory = async (eventId?: string): Promise<any[]> => {
    try {
      const url = eventId 
        ? `/api/registrations/history?eventId=${eventId}`
        : '/api/registrations/history';
      const response = await fetch(url);
      
      if (!response.ok) {
        return [];
      }
      
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching removal history:', error);
      return [];
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
        if (registration.eventId && expandedEventIds.has(registration.eventId)) {
          fetchRemovalHistory(registration.eventId);
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
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEventsForDay = (day: Date) => {
    return events.filter((event) => event.eventStatus !== 'past' && isSameDay(parseISO(event.date), day));
  };

  // Loading state
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Not signed in - show sign in prompt
  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">MINDS Staff Portal</h1>
          <p className="text-gray-500 text-sm mb-6">Please sign in to access the admin dashboard</p>
          <SignInButton mode="modal">
            <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors font-medium">
              Sign In
            </button>
          </SignInButton>
          <div className="mt-6">
            <a href="/" className="text-blue-600 hover:text-blue-800 text-sm font-medium">← Back to Calendar</a>
          </div>
        </div>
      </div>
    );
  }

  // Signed in but not admin - show access denied
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h1>
          <p className="text-gray-500 text-sm mb-2">You don&apos;t have permission to access the admin dashboard.</p>
          <p className="text-gray-400 text-xs mb-6">Signed in as: {user?.emailAddresses[0]?.emailAddress}</p>
          <div className="flex flex-col gap-3">
            <a href="/" className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors font-medium">
              Go to Home Page
            </a>
            <button 
              onClick={() => signOut()}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-200 transition-colors font-medium"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Admin user - show dashboard
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-800">MINDS Admin</h1>
              <div className="hidden sm:flex items-center bg-gray-100 rounded-lg p-1">
                {(['calendar', 'events', 'attendance', 'statistics', 'users'] as TabType[]).map((tab) => (
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
                    {tab === 'statistics' && '📊 Statistics'}
                    {tab === 'users' && '👤 Users'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 hidden sm:block">
                {user?.firstName || user?.emailAddresses[0]?.emailAddress}
              </span>
              <a href="/" className="text-gray-600 hover:text-gray-800 text-sm font-medium hidden sm:block">
                View Public Site →
              </a>
              <button onClick={() => signOut()} className="text-red-600 hover:text-red-800 text-sm font-medium">
                Logout
              </button>
            </div>
          </div>
          
          {/* Mobile tabs */}
          <div className="sm:hidden pb-3 flex gap-2 overflow-x-auto">
            {(['calendar', 'events', 'attendance', 'statistics', 'users'] as TabType[]).map((tab) => (
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
                {tab === 'statistics' && '📊'}
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setEventsFilter('upcoming')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      eventsFilter === 'upcoming'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Upcoming ({events.filter(e => e.eventStatus !== 'past').length})
                  </button>
                  <button
                    onClick={() => setEventsFilter('past')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      eventsFilter === 'past'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    Past ({events.filter(e => e.eventStatus === 'past').length})
                  </button>
                </div>
              </div>
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
            ) : events.filter(e => eventsFilter === 'upcoming' ? e.eventStatus !== 'past' : e.eventStatus === 'past').length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-500">{eventsFilter === 'upcoming' ? 'No upcoming events found. Create your first event!' : 'No past events found.'}</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {events
                  .filter(e => eventsFilter === 'upcoming' ? e.eventStatus !== 'past' : e.eventStatus === 'past')
                  .sort((a, b) => eventsFilter === 'upcoming' 
                    ? new Date(a.date).getTime() - new Date(b.date).getTime()
                    : new Date(b.date).getTime() - new Date(a.date).getTime())
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
            
            {/* Filters and Sorting */}
            <div className="mb-6 space-y-4">
              {/* Filter Row */}
              <div className="flex flex-wrap items-center gap-4">
                {/* Time Period Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Time:</span>
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setAttendanceFilter('all')}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                        attendanceFilter === 'all'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setAttendanceFilter('upcoming')}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                        attendanceFilter === 'upcoming'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      Upcoming
                    </button>
                    <button
                      onClick={() => setAttendanceFilter('past')}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                        attendanceFilter === 'past'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      Past
                    </button>
                  </div>
                </div>

                {/* Category Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Category:</span>
                  <select
                    value={attendanceCategoryFilter}
                    onChange={(e) => setAttendanceCategoryFilter(e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                  >
                    <option value="all">All Categories</option>
                    {Array.from(new Set(events.map(e => e.category))).sort().map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                {/* Sort Options */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Sort by:</span>
                  <select
                    value={attendanceSortBy}
                    onChange={(e) => setAttendanceSortBy(e.target.value as 'date' | 'category' | 'name')}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                  >
                    <option value="date">Date</option>
                    <option value="category">Category</option>
                    <option value="name">Event Name</option>
                  </select>
                  <button
                    onClick={() => setAttendanceSortOrder(attendanceSortOrder === 'asc' ? 'desc' : 'asc')}
                    className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    title={attendanceSortOrder === 'asc' ? 'Ascending' : 'Descending'}
                  >
                    {attendanceSortOrder === 'asc' ? (
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Expand/Collapse All */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const filteredEvents = events.filter(e => {
                      const timeMatch = attendanceFilter === 'all' || 
                        (attendanceFilter === 'upcoming' && e.eventStatus !== 'past') ||
                        (attendanceFilter === 'past' && e.eventStatus === 'past');
                      const categoryMatch = attendanceCategoryFilter === 'all' || e.category === attendanceCategoryFilter;
                      return timeMatch && categoryMatch;
                    });
                    setExpandedEventIds(new Set(filteredEvents.map(e => e.id)));
                  }}
                  className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  Expand All
                </button>
                <button
                  onClick={() => setExpandedEventIds(new Set())}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Collapse All
                </button>
              </div>
            </div>

            {/* Events List */}
            <div className="space-y-4">
              {(() => {
                const filteredEvents = events
                  .filter(e => {
                    const timeMatch = attendanceFilter === 'all' || 
                      (attendanceFilter === 'upcoming' && e.eventStatus !== 'past') ||
                      (attendanceFilter === 'past' && e.eventStatus === 'past');
                    const categoryMatch = attendanceCategoryFilter === 'all' || e.category === attendanceCategoryFilter;
                    return timeMatch && categoryMatch;
                  })
                  .sort((a, b) => {
                    const multiplier = attendanceSortOrder === 'asc' ? 1 : -1;
                    if (attendanceSortBy === 'date') {
                      return multiplier * (new Date(a.date).getTime() - new Date(b.date).getTime());
                    }
                    if (attendanceSortBy === 'category') {
                      const catCompare = a.category.localeCompare(b.category);
                      if (catCompare !== 0) return multiplier * catCompare;
                      return new Date(b.date).getTime() - new Date(a.date).getTime();
                    }
                    if (attendanceSortBy === 'name') {
                      return multiplier * a.title.localeCompare(b.title);
                    }
                    return 0;
                  });

                if (filteredEvents.length === 0) {
                  return (
                    <div className="text-center py-12 text-gray-500">
                      <p>No events match your filters.</p>
                    </div>
                  );
                }

                return filteredEvents.map(event => {
                  const eventRegs = getEventRegistrations(event.id);
                  const activeRegs = eventRegs.filter(r => r.status !== 'cancelled');
                  const attended = activeRegs.filter(r => r.status === 'attended').length;
                  const participants = activeRegs.filter(r => r.registrationType === 'participant').length;
                  const volunteers = activeRegs.filter(r => r.registrationType === 'volunteer').length;
                  const isExpanded = expandedEventIds.has(event.id);

                  return (
                    <div key={event.id} className="border border-gray-200 rounded-xl overflow-hidden">
                      {/* Event Header - Clickable */}
                      <button
                        onClick={() => {
                          const newSet = new Set(expandedEventIds);
                          if (isExpanded) {
                            newSet.delete(event.id);
                          } else {
                            newSet.add(event.id);
                          }
                          setExpandedEventIds(newSet);
                        }}
                        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-3 h-3 rounded-full ${
                            event.eventStatus === 'past' ? 'bg-gray-400' : 'bg-green-500'
                          }`} />
                          <div>
                            <h3 className="font-semibold text-gray-800">{event.title}</h3>
                            <p className="text-sm text-gray-600">
                              {format(parseISO(event.date), 'EEEE, MMM d, yyyy')} • {event.time}
                              <span className="ml-2 px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full text-xs">
                                {event.category}
                              </span>
                              {event.eventStatus === 'past' && (
                                <span className="ml-2 px-2 py-0.5 bg-gray-300 text-gray-700 rounded-full text-xs">
                                  Past
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {/* Quick Stats */}
                          <div className="flex items-center gap-3 text-sm">
                            <span className="text-blue-600 font-medium">{activeRegs.length} registered</span>
                            <span className="text-green-600 font-medium">{attended} attended</span>
                            <span className="text-purple-600">{participants} participants</span>
                            <span className="text-orange-600">{volunteers} volunteers</span>
                          </div>
                          <svg 
                            className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="p-4 bg-white">
                          {eventRegs.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">No registrations for this event.</p>
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
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {/* Statistics Tab */}
        {activeTab === 'statistics' && (
          <StatisticsDashboard events={events} registrations={registrations} />
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
