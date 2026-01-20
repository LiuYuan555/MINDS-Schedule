'use client';

import { format, parseISO } from 'date-fns';
import { Event } from '@/types';
import { categoryColors } from '@/data/events';

interface EventListProps {
  events: Event[];
  onEventClick: (event: Event) => void;
}

export default function EventList({ events, onEventClick }: EventListProps) {
  const sortedEvents = [...events].sort(
    (a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime()
  );

  const groupedEvents = sortedEvents.reduce((groups, event) => {
    const monthYear = format(parseISO(event.date), 'MMMM yyyy');
    if (!groups[monthYear]) {
      groups[monthYear] = [];
    }
    groups[monthYear].push(event);
    return groups;
  }, {} as Record<string, Event[]>);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Upcoming Events</h2>
      <div className="space-y-8">
        {Object.entries(groupedEvents).map(([monthYear, monthEvents]) => (
          <div key={monthYear}>
            <h3 className="text-lg font-medium text-gray-700 mb-4 pb-2 border-b border-gray-200">
              {monthYear}
            </h3>
            <div className="space-y-4">
              {monthEvents.map((event) => (
                <div
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  className="flex gap-4 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                >
                  {/* Date Box */}
                  <div className="flex-shrink-0 w-16 text-center">
                    <div className="bg-blue-600 text-white rounded-t-lg py-1 text-xs font-medium">
                      {format(parseISO(event.date), 'MMM')}
                    </div>
                    <div className="bg-blue-50 text-blue-600 rounded-b-lg py-2 text-2xl font-bold">
                      {format(parseISO(event.date), 'd')}
                    </div>
                  </div>

                  {/* Event Details */}
                  <div className="flex-grow min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-800 truncate">
                          {event.title}
                        </h4>
                        {event.isRecurring && (
                          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded flex-shrink-0">
                            🔄 Recurring
                          </span>
                        )}
                      </div>
                      <span
                        className={`flex-shrink-0 text-xs px-2 py-1 rounded-full border ${
                          categoryColors[event.category] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {event.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {event.description}
                    </p>
                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{event.time}{event.endTime ? ` - ${event.endTime}` : ''}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="truncate">{event.location}</span>
                      </div>
                      {event.capacity !== undefined && (
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <span>
                            {event.currentSignups ?? 0}/{event.capacity} spots
                          </span>
                        </div>
                      )}
                      {event.capacity !== undefined && event.currentSignups !== undefined && event.currentSignups >= event.capacity && (
                        <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full font-medium">
                          ⚠️ Full - Waitlist available
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
