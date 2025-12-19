'use client';

import { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

export default function DatePicker({ value, onChange, minDate, maxDate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const firstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isDateSelectable = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Create a copy of the date and set to same time for fair comparison
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    // Don't allow dates before today
    if (checkDate < today) return false;

    if (maxDate) {
      const maxDateCopy = new Date(maxDate);
      maxDateCopy.setHours(23, 59, 59, 999);
      if (date > maxDateCopy) return false;
    }

    return true;
  };

  const handleDateClick = (day) => {
    // Create date in local timezone to avoid timezone offset issues
    const newDate = new Date();
    newDate.setFullYear(currentDate.getFullYear(), currentDate.getMonth(), day);
    newDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues

    if (isDateSelectable(newDate)) {
      setSelectedDate(newDate);
      // Format date as YYYY-MM-DD in local timezone
      const year = newDate.getFullYear();
      const month = String(newDate.getMonth() + 1).padStart(2, '0');
      const date = String(newDate.getDate()).padStart(2, '0');
      onChange(`${year}-${month}-${date}`);
      setIsOpen(false);
    }
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleTodayClick = () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
    if (isDateSelectable(today)) {
      setSelectedDate(today);
      // Format date as YYYY-MM-DD in local timezone
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const date = String(today.getDate()).padStart(2, '0');
      onChange(`${year}-${month}-${date}`);
      setIsOpen(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  useEffect(() => {
    if (value) {
      setSelectedDate(new Date(value));
    }
  }, [value]);

  useEffect(() => {
    if (isOpen) {
      const updateDropdownPosition = () => {
        const button = document.getElementById('date-picker-button');
        const modal = document.querySelector('[role="dialog"]');

        if (button) {
          const buttonRect = button.getBoundingClientRect();
          const modalRect = modal ? modal.getBoundingClientRect() : null;

          // Position above button by default
        let top = buttonRect.top - 320; // Position above button (320px is approximately calendar height)
        let left = buttonRect.left;

        // If not enough space above, position below instead
        const viewportHeight = window.innerHeight;
        if (top < 20) { // If too close to top
          top = buttonRect.bottom + 8; // Position below button
        }

        // Adjust for modal boundaries
        if (modalRect) {
            // Ensure calendar doesn't go outside modal horizontally
            if (left + 320 > modalRect.right) {
              left = modalRect.right - 320 - 8;
            }
            if (left < modalRect.left) {
              left = modalRect.left + 8;
            }

            // Ensure calendar doesn't go above modal
            if (top < modalRect.top + 8) {
              top = buttonRect.bottom + 8; // Position below button instead
            }
          }

          setDropdownPosition({ top, left });
        }
      };

      updateDropdownPosition();
      window.addEventListener('resize', updateDropdownPosition);
      window.addEventListener('scroll', updateDropdownPosition, true);

      return () => {
        window.removeEventListener('resize', updateDropdownPosition);
        window.removeEventListener('scroll', updateDropdownPosition, true);
      };
    }
  }, [isOpen]);

  const renderCalendarDays = () => {
    const days = [];
    const totalDays = daysInMonth(currentDate);
    const startDay = firstDayOfMonth(currentDate);
    const today = new Date();

    // Empty cells for days before month starts
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    // Days of the month
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
      const isToday = date.toDateString() === today.toDateString();
      const isSelectable = isDateSelectable(date);

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(day)}
          disabled={!isSelectable}
          className={`
            p-2 text-sm rounded-lg transition-colors
            ${isSelected
              ? 'bg-red-600 text-white font-semibold'
              : isSelectable
                ? 'text-gray-300 hover:bg-gray-700'
                : 'text-gray-600 cursor-not-allowed'
            }
            ${isToday && !isSelected ? 'border border-red-500' : ''}
          `}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  return (
    <div className="relative">
      {/* Input Field */}
      <button
        id="date-picker-button"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-left flex items-center justify-between"
      >
        <span className={selectedDate ? 'text-white' : 'text-gray-400'}>
          {selectedDate ? formatDate(selectedDate) : 'Select target date'}
        </span>
        <Calendar className="w-4 h-4 text-gray-400" />
      </button>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div
          className="fixed z-[9999] w-80 bg-gray-800 border border-gray-600 rounded-lg shadow-xl"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with month/year and navigation */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <button
              onClick={handlePreviousMonth}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-400" />
            </button>
            <h3 className="text-white font-medium">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <button
              onClick={handleNextMonth}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 gap-1 p-2 border-b border-gray-700">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-gray-400 py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1 p-2">
            {renderCalendarDays()}
          </div>

          {/* Footer with Today button */}
          <div className="flex justify-end p-3 border-t border-gray-700">
            <button
              onClick={handleTodayClick}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Today
            </button>
          </div>
        </div>
      )}

      {/* Overlay to close calendar when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[9998]"
          onClick={() => setIsOpen(false)}
          style={{ pointerEvents: 'auto' }}
        />
      )}
    </div>
  );
}