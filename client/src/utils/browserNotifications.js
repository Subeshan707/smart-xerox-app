export const getBrowserNotificationPermission = () => {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
};

export const requestBrowserNotifications = async () => {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.requestPermission();
};

export const showBrowserNotification = ({ title, body }) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  try {
    new Notification(title || 'Smart Xerox', {
      body,
      icon: '/icons/icon-192x192.svg',
      badge: '/icons/icon-96x96.svg',
      tag: `smart-xerox-${Date.now()}`,
    });
  } catch {
    // Browser notifications are best-effort and can be blocked by the OS.
  }
};

export const playNotificationSound = () => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  try {
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, context.currentTime);
    oscillator.frequency.setValueAtTime(660, context.currentTime + 0.12);

    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.35);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.36);
    oscillator.onended = () => context.close();
  } catch {
    // Sound can be blocked until the user interacts with the page.
  }
};

export const notifyUser = ({ title = 'Smart Xerox', message, type = 'info' }) => {
  if (!message) return;
  playNotificationSound();
  showBrowserNotification({ title, body: message });
  return { type, message };
};
