/**
 * Formats an ISO date string to a human-readable representation: "20 Oct 2026"
 * @param {string|Date} date
 * @returns {string}
 */
export function formatDate(date) {
  if (!date) return 'N/A';
  // Parse date safely handling ISO strings or YYYY-MM-DD
  const dateStr = typeof date === 'string' ? date.split('T')[0] : date;
  const parts = typeof dateStr === 'string' && dateStr.includes('-') ? dateStr.split('-') : null;
  
  const d = parts && parts.length === 3
    ? new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10))
    : new Date(date);

  if (isNaN(d.getTime())) return 'N/A';

  return d.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Formats an ISO date-time string to readable: "20 Oct 2026, 04:30 PM"
 * @param {string|Date} date
 * @returns {string}
 */
export function formatDateTime(date) {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'N/A';

  return d.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Calculates inclusive calendar duration in days between two dates: "1 day", "3 days"
 * @param {string|Date} startDate
 * @param {string|Date} endDate
 * @returns {string}
 */
export function calculateDuration(startDate, endDate) {
  if (!startDate || !endDate) return 'N/A';

  const sStr = typeof startDate === 'string' ? startDate.split('T')[0] : startDate;
  const eStr = typeof endDate === 'string' ? endDate.split('T')[0] : endDate;

  const sParts = typeof sStr === 'string' && sStr.includes('-') ? sStr.split('-') : null;
  const eParts = typeof eStr === 'string' && eStr.includes('-') ? eStr.split('-') : null;

  const start = sParts
    ? new Date(parseInt(sParts[0], 10), parseInt(sParts[1], 10) - 1, parseInt(sParts[2], 10))
    : new Date(startDate);
  const end = eParts
    ? new Date(parseInt(eParts[0], 10), parseInt(eParts[1], 10) - 1, parseInt(eParts[2], 10))
    : new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'N/A';

  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;

  if (diffDays <= 0) return '0 days';
  return `${diffDays} day${diffDays === 1 ? '' : 's'}`;
}

/**
 * Sanitizes backend API errors into user-friendly messages without leaking Java/DB internals.
 * @param {any} error
 * @param {string} fallbackMsg
 * @returns {string}
 */
export function getFriendlyErrorMessage(error, fallbackMsg = 'Something went wrong. Please try again.') {
  if (!error) return fallbackMsg;

  // Network or timeout errors
  if (!error.response) {
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return 'Request timed out. Please check your connection and try again.';
    }
    return 'Unable to connect to server. Please check your network connection.';
  }

  const { status, data } = error.response;
  const serverMsg = typeof data?.message === 'string' ? data.message.trim() : '';

  // If server provided a clean, readable message (not a stack trace or exception name)
  const isCleanServerMsg =
    serverMsg &&
    !serverMsg.includes('Exception') &&
    !serverMsg.includes('org.springframework') &&
    !serverMsg.includes('com.mongodb') &&
    !serverMsg.includes('Internal Server Error') &&
    serverMsg.length < 150;

  switch (status) {
    case 400:
      return isCleanServerMsg ? serverMsg : 'Please check the entered details.';
    case 401:
      return 'Your session has expired. Please login again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return isCleanServerMsg ? serverMsg : 'The requested record was not found.';
    case 409:
      return isCleanServerMsg ? serverMsg : 'This action conflicts with the current record state.';
    case 500:
    case 502:
    case 503:
      return 'Something went wrong on the server. Please try again.';
    default:
      return isCleanServerMsg ? serverMsg : fallbackMsg;
  }
}

/**
 * Truncates text safely with an ellipsis.
 * @param {string} text
 * @param {number} length
 * @returns {string}
 */
export function truncate(text, length = 30) {
  if (!text) return '';
  return text.length > length ? `${text.substring(0, length)}...` : text;
}
