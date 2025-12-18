'use client';

import PropTypes from 'prop-types';

/**
 * Reusable stat card component for dashboard metrics
 * @param {Object} props - Component props
 * @param {string} props.title - Stat title
 * @param {string|number} props.value - Stat value
 * @param {number} props.change - Percentage change from yesterday
 * @param {React.ReactNode} props.icon - Icon component
 * @param {'red'|'green'|'blue'|'yellow'} props.color - Color theme
 * @param {string} props.subtitle - Optional subtitle text
 */
export default function StatCard({ title, value, change, icon, color = 'red', subtitle }) {
  const colorClasses = {
    red: 'border-red-800',
    green: 'border-green-800',
    blue: 'border-blue-800',
    yellow: 'border-yellow-800'
  };

  const iconColorClasses = {
    red: 'text-red-500',
    green: 'text-green-500',
    blue: 'text-blue-500',
    yellow: 'text-yellow-500'
  };

  return (
    <div className={`stat-card ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
          {subtitle && (
            <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
          )}
          {typeof change === 'number' && (
            <p className={`text-sm mt-2 font-medium ${
              change >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(1)}% from yesterday
            </p>
          )}
        </div>
        <div className={`text-4xl ${iconColorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  change: PropTypes.number,
  icon: PropTypes.node.isRequired,
  color: PropTypes.oneOf(['red', 'green', 'blue', 'yellow']),
  subtitle: PropTypes.string,
};