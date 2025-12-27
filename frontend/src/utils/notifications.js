import toast from 'react-hot-toast';

/**
 * Custom notification service
 * Usage:
 *   notify.success('Operation completed!')
 *   notify.error('Something went wrong')
 *   notify.info('Here is some information')
 *   notify('Default notification')
 */

const notify = (message, type = 'default') => {
  const options = {
    duration: 4000,
    position: 'top-right',
    style: {
      background: '#fff',
      color: '#333',
      padding: '16px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    },
  };

  switch (type) {
    case 'success':
      return toast.success(message, {
        ...options,
        icon: '✓',
        style: {
          ...options.style,
          borderLeft: '4px solid #10b981',
        },
      });

    case 'error':
      return toast.error(message, {
        ...options,
        icon: '✕',
        style: {
          ...options.style,
          borderLeft: '4px solid #ef4444',
        },
      });

    case 'info':
      return toast(message, {
        ...options,
        icon: 'ℹ',
        style: {
          ...options.style,
          borderLeft: '4px solid #3b82f6',
        },
      });

    case 'warning':
      return toast(message, {
        ...options,
        icon: '⚠',
        style: {
          ...options.style,
          borderLeft: '4px solid #f59e0b',
        },
      });

    default:
      return toast(message, options);
  }
};

// Convenience methods
notify.success = (message) => notify(message, 'success');
notify.error = (message) => notify(message, 'error');
notify.info = (message) => notify(message, 'info');
notify.warning = (message) => notify(message, 'warning');

// Promise-based notifications for async operations
notify.promise = (promise, messages) => {
  return toast.promise(promise, {
    loading: messages.loading || 'Loading...',
    success: messages.success || 'Success!',
    error: messages.error || 'Error occurred',
  });
};

export default notify;
