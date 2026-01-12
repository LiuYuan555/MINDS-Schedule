'use client';

import { useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  parseISO,
} from 'date-fns';
import { Event } from '@/types';
import { categoryColors } from '@/data/events';

interface CalendarProps {
  events: Event[];
  onEventClick: (event: Event) => void;
}

export default function Calendar({ events, onEventClick }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-xl font-semibold text-gray-800">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <div className="grid grid-cols-7 mb-2">
        {days.map((day) => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const currentDay = day;
        const dayEvents = events.filter((event) =>
          isSameDay(parseISO(event.date), currentDay)
        );

        days.push(
          <div
            key={day.toString()}
            className={`min-h-[100px] border border-gray-100 p-1 ${
              !isSameMonth(day, monthStart)
                ? 'bg-gray-50 text-gray-400'
                : 'bg-white'
            }`}
          >
            <span
              className={`text-sm font-medium ${
                isSameDay(day, new Date())
                  ? 'bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center'
                  : ''
              }`}
            >
              {format(day, 'd')}
            </span>
            <div className="mt-1 space-y-1">
              {dayEvents.slice(0, 2).map((event) => (
                <button
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  className={`w-full text-left text-xs p-1 rounded truncate border ${
                    categoryColors[event.category] || 'bg-gray-100 text-gray-800'
                  } hover:opacity-80 transition-opacity`}
                >
                  {event.title}
                </button>
              ))}
              {dayEvents.length > 2 && (
                <div className="text-xs text-gray-500 pl-1">
                  +{dayEvents.length - 2} more
                </div>
              )}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7">
          {days}
        </div>
      );
      days = [];
    }
    return <div className="border border-gray-200 rounded-lg overflow-hidden">{rows}</div>;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      {renderHeader()}
      {renderDays()}
      {renderCells()}
    </div>
  );
}
