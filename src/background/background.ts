import { CalendarService } from '../services/CalendarService';
import type { UserAccount } from '../types/auth';

console.log('Background service worker started');

// Create alarm if not exists
// Create or update alarm
chrome.alarms.create('refresh', { periodInMinutes: 1 });

async function updateBadge(forceRefresh = false) {
  try {
    const result = await chrome.storage.local.get('accounts');
    const accounts = (result.accounts as UserAccount[]) || [];

    if (accounts.length === 0) {
      chrome.action.setBadgeText({ text: '' });
      return;
    }

    // Use loadInitialEvents with forceRefresh option
    const events = await CalendarService.loadInitialEvents(accounts, forceRefresh);

    const now = Date.now();

    // Filter for primary events only
    const primaryEvents = events.filter((e) => e.isPrimary);

    // Check for ongoing events (timed only)
    const ongoingEvent = primaryEvents.find((e) => {
      if (!e.start.dateTime || !e.end.dateTime) return false; // Skip all-day events
      const start = new Date(e.start.dateTime).getTime();
      const end = new Date(e.end.dateTime).getTime();
      return start <= now && end > now;
    });

    if (ongoingEvent) {
      chrome.action.setBadgeText({ text: 'Now' });
      chrome.action.setBadgeBackgroundColor({ color: '#d93025' }); // Red
      return;
    }

    // Find the next upcoming event
    const nextEvent = primaryEvents
      .map((e) => ({
        ...e,
        startTime: new Date(e.start.dateTime || e.start.date || 0).getTime(),
      }))
      .filter((e) => e.startTime > now)
      .sort((a, b) => a.startTime - b.startTime)[0];

    if (nextEvent) {
      const diffMs = nextEvent.startTime - now;
      const diffMins = Math.ceil(diffMs / (1000 * 60));

      let text = '';
      if (diffMins < 60) {
        text = `${diffMins}m`;
      } else if (diffMins < 24 * 60) {
        const hours = Math.round(diffMins / 60);
        text = `${hours}h`;
      } else {
        const days = Math.round(diffMins / (60 * 24));
        text = `${days}d`;
      }

      chrome.action.setBadgeText({ text });

      // Use calendar color
      if (nextEvent.accountColor) {
        chrome.action.setBadgeBackgroundColor({ color: nextEvent.accountColor });
      } else {
        chrome.action.setBadgeBackgroundColor({ color: '#1a73e8' }); // Fallback Blue
      }
    } else {
      chrome.action.setBadgeText({ text: '' });
    }
  } catch (error) {
    console.error('Error updating badge:', error);
  }
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'refresh') {
    updateBadge(false); // Use cached data, let CalendarService handle expiration
  }
});

// Update on startup
updateBadge(false);

// Listen for storage changes (e.g. account added)
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.accounts) {
    updateBadge();
  }
});
