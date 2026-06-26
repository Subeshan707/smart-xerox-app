/**
 * Format paise to INR currency string
 * @param {number} paise - Amount in paise (smallest unit)
 * @returns {string} Formatted currency string like "₹12.50"
 */
export function formatCurrency(paise) {
  const rupees = (paise || 0) / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rupees);
}

/**
 * Format a date to readable string
 * @param {string|Date} date
 * @param {string} format - 'short' | 'long' | 'date-only' | 'time-only'
 */
export function formatDate(date, format = 'short') {
  if (!date) return '';
  const d = new Date(date);

  switch (format) {
    case 'long':
      return d.toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    case 'date-only':
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    case 'time-only':
      return d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    case 'short':
    default:
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
  }
}

/**
 * Format time string "14:30" to "2:30 PM"
 */
export function formatTime(timeStr) {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(minutes).padStart(2, '0')} ${period}`;
}

/**
 * Relative time: "2 minutes ago", "in 5 minutes"
 */
export function formatRelativeTime(date) {
  if (!date) return '';
  const now = new Date();
  const d = new Date(date);
  const diffMs = now - d;
  const diffMin = Math.floor(Math.abs(diffMs) / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  const isFuture = diffMs < 0;
  const prefix = isFuture ? 'in ' : '';
  const suffix = isFuture ? '' : ' ago';

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${prefix}${diffMin}m${suffix}`;
  if (diffHr < 24) return `${prefix}${diffHr}h${suffix}`;
  if (diffDays < 7) return `${prefix}${diffDays}d${suffix}`;
  return formatDate(date, 'date-only');
}

/**
 * Truncate text
 */
export function truncate(text, maxLength = 30) {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Get greeting based on time of day
 */
export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return { text: 'Good Morning', emoji: '🌅' };
  if (hour < 17) return { text: 'Good Afternoon', emoji: '☀️' };
  if (hour < 21) return { text: 'Good Evening', emoji: '🌆' };
  return { text: 'Good Night', emoji: '🌙' };
}
