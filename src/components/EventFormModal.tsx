'use client';

import { useState, useEffect } from 'react';
import { format, parseISO, addDays, addWeeks, addMonths, getDay, setDay, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';
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

const skillLevels = ['all', 'beginner', 'intermediate', 'advanced'];

const DEFAULT_SMS_TEMPLATE = `Hi {name}! You're confirmed for "{event}" on {date} at {time}. Location: {location}. See you there! - MINDS Singapore`;

type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'custom';

interface RecurrenceConfig {
  type: RecurrenceType;
  interval: number; // Every X days/weeks/months
  endType: 'never' | 'after' | 'on';
  endAfterOccurrences: number;
  endOnDate: string;
  weeklyDays: number[]; // 0=Sunday, 1=Monday, etc.
  monthlyType: 'dayOfMonth' | 'dayOfWeek'; // e.g., "15th" vs "3rd Monday"
}

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (eventData: any) => Promise<void>;
  editingEvent?: Event | null;
  initialDate?: string;
}

export default function EventFormModal({ isOpen, onClose, onSubmit, editingEvent, initialDate }: EventFormModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: initialDate || '',
    time: '09:00',
    endTime: '10:00',
    location: '',
    category: 'Workshop',
    capacity: '20',
    wheelchairAccessible: true,
    caregiverRequired: false,
    caregiverPaymentRequired: false,
    caregiverPaymentAmount: '',
    ageRestriction: '',
    skillLevel: 'all',
    volunteersNeeded: '0',
    confirmationMessage: DEFAULT_SMS_TEMPLATE,
  });

  const [recurrence, setRecurrence] = useState<RecurrenceConfig>({
    type: 'none',
    interval: 1,
    endType: 'after',
    endAfterOccurrences: 10,
    endOnDate: '',
    weeklyDays: [],
    monthlyType: 'dayOfMonth',
  });

  const [showRecurrenceOptions, setShowRecurrenceOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewDates, setPreviewDates] = useState<string[]>([]);
  const [activeSection, setActiveSection] = useState<'details' | 'recurrence' | 'options'>('details');

  // Initialize form when editing
  useEffect(() => {
    if (editingEvent) {
      setFormData({
        title: editingEvent.title,
        description: editingEvent.description,
        date: editingEvent.date,
        time: editingEvent.time,
        endTime: editingEvent.endTime || '',
        location: editingEvent.location,
        category: editingEvent.category,
        capacity: editingEvent.capacity?.toString() || '20',
        wheelchairAccessible: editingEvent.wheelchairAccessible ?? true,
        caregiverRequired: editingEvent.caregiverRequired ?? false,
        caregiverPaymentRequired: editingEvent.caregiverPaymentRequired ?? false,
        caregiverPaymentAmount: editingEvent.caregiverPaymentAmount?.toString() || '',
        ageRestriction: editingEvent.ageRestriction || '',
        skillLevel: editingEvent.skillLevel || 'all',
        volunteersNeeded: editingEvent.volunteersNeeded?.toString() || '0',
        confirmationMessage: editingEvent.confirmationMessage || DEFAULT_SMS_TEMPLATE,
      });
      setRecurrence({
        type: 'none',
        interval: 1,
        endType: 'after',
        endAfterOccurrences: 10,
        endOnDate: '',
        weeklyDays: [],
        monthlyType: 'dayOfMonth',
      });
    } else if (initialDate) {
      setFormData(prev => ({ ...prev, date: initialDate }));
    }
  }, [editingEvent, initialDate]);

  // Calculate preview dates when recurrence changes
  useEffect(() => {
    if (recurrence.type === 'none' || !formData.date) {
      setPreviewDates([]);
      return;
    }

    const dates = generateRecurringDates();
    setPreviewDates(dates.slice(0, 12)); // Show max 12 preview dates
  }, [recurrence, formData.date]);

  const generateRecurringDates = (): string[] => {
    if (!formData.date || recurrence.type === 'none') return [];

    const startDate = parseISO(formData.date);
    const dates: string[] = [];
    let currentDate = startDate;
    let count = 0;
    const maxOccurrences = recurrence.endType === 'after' ? recurrence.endAfterOccurrences : 52;
    const endDate = recurrence.endType === 'on' && recurrence.endOnDate ? parseISO(recurrence.endOnDate) : addMonths(startDate, 12);

    while (count < maxOccurrences) {
      if (recurrence.endType === 'on' && currentDate > endDate) break;

      if (recurrence.type === 'daily') {
        dates.push(format(currentDate, 'yyyy-MM-dd'));
        currentDate = addDays(currentDate, recurrence.interval);
      } else if (recurrence.type === 'weekly') {
        if (recurrence.weeklyDays.length === 0) {
          // Default to same day of week
          dates.push(format(currentDate, 'yyyy-MM-dd'));
          currentDate = addWeeks(currentDate, recurrence.interval);
        } else {
          // Multiple days per week
          const weekStart = setDay(currentDate, 0);
          recurrence.weeklyDays.sort((a, b) => a - b).forEach(day => {
            const dayDate = setDay(weekStart, day);
            if (dayDate >= startDate && (recurrence.endType !== 'on' || dayDate <= endDate) && dates.length < maxOccurrences) {
              dates.push(format(dayDate, 'yyyy-MM-dd'));
            }
          });
          currentDate = addWeeks(currentDate, recurrence.interval);
        }
      } else if (recurrence.type === 'monthly') {
        dates.push(format(currentDate, 'yyyy-MM-dd'));
        currentDate = addMonths(currentDate, recurrence.interval);
      } else if (recurrence.type === 'custom') {
        dates.push(format(currentDate, 'yyyy-MM-dd'));
        currentDate = addDays(currentDate, recurrence.interval);
      }

      count++;
      if (count > 100) break; // Safety limit
    }

    return [...new Set(dates)].sort();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const recurringDates = recurrence.type !== 'none' ? generateRecurringDates() : [];
      
      await onSubmit({
        ...formData,
        capacity: formData.capacity ? parseInt(formData.capacity, 10) : 0,
        caregiverPaymentAmount: formData.caregiverPaymentAmount ? parseInt(formData.caregiverPaymentAmount, 10) : undefined,
        volunteersNeeded: formData.volunteersNeeded ? parseInt(formData.volunteersNeeded, 10) : 0,
        isRecurring: recurrence.type !== 'none',
        recurringDates: recurringDates,
        ...(editingEvent && { id: editingEvent.id }),
      });

      onClose();
    } catch (error) {
      console.error('Error saving event:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl my-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            {editingEvent ? 'Edit Event' : 'Create Event'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Section Tabs */}
          <div className="flex border-b border-gray-200 px-6">
            {[
              { id: 'details', label: 'Event Details', icon: '📝' },
              { id: 'recurrence', label: 'Recurrence', icon: '🔄' },
              { id: 'options', label: 'Options', icon: '⚙️' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSection(tab.id as any)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeSection === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {/* Details Section */}
            {activeSection === 'details' && (
              <div className="space-y-5">
                {/* Title */}
                <div>
                  <input
                    type="text"
                    placeholder="Add title"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full text-2xl font-medium text-gray-800 border-0 border-b-2 border-gray-200 focus:border-blue-500 focus:ring-0 outline-none pb-2 placeholder-gray-400"
                  />
                </div>

                {/* Date & Time Row */}
                <div className="flex flex-wrap items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <input
                      type="time"
                      required
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                    />
                    <span className="text-gray-400">to</span>
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                    />
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gray-400 mt-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Add location"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                  />
                </div>

                {/* Category */}
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gray-400 mt-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <div className="flex-1">
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setFormData({ ...formData, category: cat })}
                          className={`text-xs px-2 py-1 rounded-full border transition-all ${
                            formData.category === cat
                              ? categoryColors[cat] + ' ring-2 ring-offset-1 ring-blue-400'
                              : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gray-400 mt-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                  <textarea
                    placeholder="Add description"
                    required
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 resize-none"
                  />
                </div>

                {/* Confirmation Message */}
                <div className="space-y-1">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-gray-400 mt-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">📱 SMS Confirmation Message</label>
                      <textarea
                        placeholder="Add SMS confirmation message"
                        rows={3}
                        value={formData.confirmationMessage}
                        onChange={(e) => setFormData({ ...formData, confirmationMessage: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 resize-none"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Placeholders: <code className="bg-gray-100 px-1 rounded">{'{name}'}</code> <code className="bg-gray-100 px-1 rounded">{'{event}'}</code> <code className="bg-gray-100 px-1 rounded">{'{date}'}</code> <code className="bg-gray-100 px-1 rounded">{'{time}'}</code> <code className="bg-gray-100 px-1 rounded">{'{location}'}</code>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recurrence Section */}
            {activeSection === 'recurrence' && (
              <div className="space-y-5">
                {editingEvent ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800 text-sm">
                      ⚠️ Recurrence settings cannot be changed when editing an existing event. 
                      To create a recurring series, please create a new event.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Recurrence Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Repeat</label>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {[
                          { value: 'none', label: 'Does not repeat' },
                          { value: 'daily', label: 'Daily' },
                          { value: 'weekly', label: 'Weekly' },
                          { value: 'monthly', label: 'Monthly' },
                          { value: 'custom', label: 'Custom' },
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setRecurrence({ ...recurrence, type: option.value as RecurrenceType })}
                            className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                              recurrence.type === option.value
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {recurrence.type !== 'none' && (
                      <>
                        {/* Interval */}
                        <div className="flex items-center gap-3">
                          <label className="text-sm font-medium text-gray-700">Repeat every</label>
                          <input
                            type="number"
                            min="1"
                            max="99"
                            value={recurrence.interval}
                            onChange={(e) => setRecurrence({ ...recurrence, interval: parseInt(e.target.value) || 1 })}
                            className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                          />
                          <span className="text-gray-700">
                            {recurrence.type === 'daily' && (recurrence.interval === 1 ? 'day' : 'days')}
                            {recurrence.type === 'weekly' && (recurrence.interval === 1 ? 'week' : 'weeks')}
                            {recurrence.type === 'monthly' && (recurrence.interval === 1 ? 'month' : 'months')}
                            {recurrence.type === 'custom' && (recurrence.interval === 1 ? 'day' : 'days')}
                          </span>
                        </div>

                        {/* Weekly Day Selection */}
                        {recurrence.type === 'weekly' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Repeat on</label>
                            <div className="flex gap-2">
                              {dayNames.map((day, index) => (
                                <button
                                  key={day}
                                  type="button"
                                  onClick={() => {
                                    const days = recurrence.weeklyDays.includes(index)
                                      ? recurrence.weeklyDays.filter(d => d !== index)
                                      : [...recurrence.weeklyDays, index];
                                    setRecurrence({ ...recurrence, weeklyDays: days });
                                  }}
                                  className={`w-10 h-10 rounded-full text-sm font-medium transition-all ${
                                    recurrence.weeklyDays.includes(index)
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                                >
                                  {day.charAt(0)}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* End Condition */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Ends</label>
                          <div className="space-y-3">
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="radio"
                                name="endType"
                                checked={recurrence.endType === 'never'}
                                onChange={() => setRecurrence({ ...recurrence, endType: 'never' })}
                                className="w-4 h-4 text-blue-600"
                              />
                              <span className="text-gray-700">Never</span>
                            </label>
                            
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="radio"
                                name="endType"
                                checked={recurrence.endType === 'after'}
                                onChange={() => setRecurrence({ ...recurrence, endType: 'after' })}
                                className="w-4 h-4 text-blue-600"
                              />
                              <span className="text-gray-700">After</span>
                              <input
                                type="number"
                                min="1"
                                max="100"
                                value={recurrence.endAfterOccurrences}
                                onChange={(e) => setRecurrence({ ...recurrence, endAfterOccurrences: parseInt(e.target.value) || 1 })}
                                disabled={recurrence.endType !== 'after'}
                                className="w-20 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 disabled:bg-gray-100"
                              />
                              <span className="text-gray-700">occurrences</span>
                            </label>
                            
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="radio"
                                name="endType"
                                checked={recurrence.endType === 'on'}
                                onChange={() => setRecurrence({ ...recurrence, endType: 'on' })}
                                className="w-4 h-4 text-blue-600"
                              />
                              <span className="text-gray-700">On</span>
                              <input
                                type="date"
                                value={recurrence.endOnDate}
                                onChange={(e) => setRecurrence({ ...recurrence, endOnDate: e.target.value })}
                                disabled={recurrence.endType !== 'on'}
                                className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 disabled:bg-gray-100"
                              />
                            </label>
                          </div>
                        </div>

                        {/* Preview */}
                        {previewDates.length > 0 && (
                          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <h4 className="text-sm font-semibold text-blue-800 mb-2">
                              📅 Preview ({previewDates.length}{previewDates.length === 12 ? '+' : ''} events)
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {previewDates.map((date, index) => (
                                <span
                                  key={date}
                                  className="text-xs bg-white text-blue-800 px-2 py-1 rounded-lg border border-blue-200"
                                >
                                  {format(parseISO(date), 'MMM d, yyyy')}
                                </span>
                              ))}
                              {previewDates.length === 12 && (
                                <span className="text-xs text-blue-600 px-2 py-1">...and more</span>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Options Section */}
            {activeSection === 'options' && (
              <div className="space-y-5">
                {/* Capacity & Volunteers */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      👥 Participant Capacity
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                      placeholder="0 = unlimited"
                    />
                    <p className="text-xs text-gray-500 mt-1">Set to 0 for unlimited</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      🙋 Volunteers Needed
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.volunteersNeeded}
                      onChange={(e) => setFormData({ ...formData, volunteersNeeded: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                    />
                  </div>
                </div>

                {/* Skill Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">🎯 Skill Level</label>
                  <div className="flex gap-2">
                    {skillLevels.map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setFormData({ ...formData, skillLevel: level })}
                        className={`px-4 py-2 text-sm rounded-lg border transition-all ${
                          formData.skillLevel === level
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {level === 'all' ? 'All Levels' : level.charAt(0).toUpperCase() + level.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Age Restriction */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    🎂 Age Restriction
                  </label>
                  <input
                    type="text"
                    value={formData.ageRestriction}
                    onChange={(e) => setFormData({ ...formData, ageRestriction: e.target.value })}
                    placeholder="e.g., 18+, 12-18, All ages"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                  />
                </div>

                {/* Toggle Options */}
                <div className="space-y-3 pt-2">
                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">♿</span>
                      <div>
                        <p className="font-medium text-gray-800">Wheelchair Accessible</p>
                        <p className="text-xs text-gray-500">Venue is accessible for wheelchairs</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.wheelchairAccessible}
                      onChange={(e) => setFormData({ ...formData, wheelchairAccessible: e.target.checked })}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">👥</span>
                      <div>
                        <p className="font-medium text-gray-800">Caregiver Required</p>
                        <p className="text-xs text-gray-500">Participants must have a caregiver</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.caregiverRequired}
                      onChange={(e) => setFormData({ ...formData, caregiverRequired: e.target.checked })}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">💰</span>
                      <div>
                        <p className="font-medium text-gray-800">Caregiver Payment Required</p>
                        <p className="text-xs text-gray-500">Caregivers must pay a fee to attend</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.caregiverPaymentRequired}
                      onChange={(e) => setFormData({ ...formData, caregiverPaymentRequired: e.target.checked })}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </label>

                  {formData.caregiverPaymentRequired && (
                    <div className="ml-12 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Caregiver Fee Amount ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.caregiverPaymentAmount}
                        onChange={(e) => setFormData({ ...formData, caregiverPaymentAmount: e.target.value })}
                        placeholder="Enter amount"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </span>
              ) : editingEvent ? (
                'Save Changes'
              ) : recurrence.type !== 'none' ? (
                `Create ${previewDates.length} Events`
              ) : (
                'Create Event'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
