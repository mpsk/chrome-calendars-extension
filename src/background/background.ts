import { CalendarService } from '../services/CalendarService';
import type { UserAccount } from '../types/auth';

console.log("Background service worker started");

// Create alarm if not exists
chrome.alarms.get("refresh", (alarm) => {
  if (!alarm) {
    chrome.alarms.create("refresh", { periodInMinutes: 15 });
  }
});

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
    const primaryEvents = events.filter(e => e.isPrimary);
    
    // Find the next upcoming event
    const nextEvent = primaryEvents
      .map(e => ({
        ...e,
        startTime: new Date(e.start.dateTime || e.start.date || 0).getTime()
      }))
      .filter(e => e.startTime > now)
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
      
      // Color coding?
      // < 15m: Red
      // < 1h: Orange
      // > 1h: Blue
      if (diffMins <= 15) {
        chrome.action.setBadgeBackgroundColor({ color: '#d93025' }); // Red
      } else if (diffMins < 60) {
        chrome.action.setBadgeBackgroundColor({ color: '#f29900' }); // Orange
      } else {
        chrome.action.setBadgeBackgroundColor({ color: '#1a73e8' }); // Blue
      }
    } else {
      chrome.action.setBadgeText({ text: '' });
    }

  } catch (error) {
    console.error('Error updating badge:', error);
  }
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "refresh") {
    updateBadge(true); // Force refresh on alarm
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
