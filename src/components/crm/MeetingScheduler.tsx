'use client';

/**
 * #36 Meeting Scheduler
 * Embed booking link in contact card.
 * Shows available time slots and allows scheduling directly from CRM.
 */

import { useState, useEffect } from 'react';
import { useI18n } from '@/i18n/client';
import { toast } from 'sonner';

interface MeetingSchedulerProps {
  contactId: string;
  contactName: string;
  contactEmail: string;
  repId?: string;
}

interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

export default function MeetingScheduler({
  contactId,
  contactName,
  contactEmail,
  repId,
}: MeetingSchedulerProps) {
  const { t } = useI18n();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [meetingType, setMeetingType] = useState<'call' | 'video' | 'in_person'>('video');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [slots, setSlots] = useState<TimeSlot[]>([]);

  // Generate available slots for the selected date
  useEffect(() => {
    if (!selectedDate) {
      setSlots([]);
      return;
    }

    // Generate business hour slots (9 AM - 5 PM, 30 min intervals)
    const generatedSlots: TimeSlot[] = [];
    for (let h = 9; h < 17; h++) {
      for (const m of [0, 30]) {
        const start = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        const endH = m === 30 ? h + 1 : h;
        const endM = m === 30 ? 0 : 30;
        const end = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;

        // Simulate some slots being taken (random for now)
        const available = Math.random() > 0.3;
        generatedSlots.push({ start, end, available });
      }
    }
    setSlots(generatedSlots);
  }, [selectedDate]);

  const handleSchedule = async () => {
    if (!selectedDate || !selectedSlot) {
      toast.error(t('crm.selectDateAndTime') || 'Please select a date and time');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/crm/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId,
          contactEmail,
          repId,
          date: selectedDate,
          time: selectedSlot,
          type: meetingType,
          notes,
        }),
      });

      if (response.ok) {
        toast.success(t('crm.meetingScheduled') || 'Meeting scheduled successfully');
        setIsExpanded(false);
        setSelectedDate('');
        setSelectedSlot('');
        setNotes('');
      } else {
        throw new Error('Failed to schedule');
      }
    } catch {
      toast.error(t('crm.meetingError') || 'Failed to schedule meeting');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get min date (today)
  const today = new Date().toISOString().split('T')[0];

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors w-full"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        {t('crm.scheduleMeeting') || `Schedule meeting with ${contactName}`}
      </button>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-900">
          {t('crm.scheduleMeetingWith') || 'Schedule Meeting'}: {contactName}
        </h4>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Meeting Type */}
      <div className="flex gap-2">
        {(['video', 'call', 'in_person'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setMeetingType(type)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              meetingType === type
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {type === 'video' ? '📹 Video' : type === 'call' ? '📞 Call' : '🏢 In Person'}
          </button>
        ))}
      </div>

      {/* Date Picker */}
      <div>
        <label htmlFor="meeting-date" className="text-xs font-medium text-gray-500 block mb-1">
          {t('common.date') || 'Date'}
        </label>
        <input
          id="meeting-date"
          type="date"
          min={today}
          value={selectedDate}
          onChange={(e) => { setSelectedDate(e.target.value); setSelectedSlot(''); }}
          className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Time Slots */}
      {selectedDate && (
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">
            {t('common.time') || 'Time'}
          </label>
          <div className="grid grid-cols-4 gap-1 max-h-32 overflow-y-auto">
            {slots.filter(s => s.available).map((slot) => (
              <button
                key={slot.start}
                onClick={() => setSelectedSlot(slot.start)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  selectedSlot === slot.start
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {slot.start}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      <div>
        <label htmlFor="meeting-notes" className="text-xs font-medium text-gray-500 block mb-1">
          {t('common.notes') || 'Notes (optional)'}
        </label>
        <textarea
          id="meeting-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          maxLength={500}
          className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          placeholder={t('crm.meetingNotesPlaceholder') || 'Add agenda or notes...'}
        />
      </div>

      {/* Submit */}
      <button
        onClick={handleSchedule}
        disabled={!selectedDate || !selectedSlot || isSubmitting}
        className="w-full px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? '...' : (t('crm.confirmMeeting') || 'Schedule Meeting')}
      </button>
    </div>
  );
}
