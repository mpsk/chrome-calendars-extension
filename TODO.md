TODO:

1. turn on/off event types within calendar profile, like in "Button for Google calendar", and keep it in sync with the extension settings after reload

2. Fix countdown timer in background task via setInterval (setTimeout), not via fetch all as now

3. batch events loading for
  - calendar.v3.CalendarList.List
  - calendar.v3.Events.List

  https://developers.google.com/workspace/calendar/api/guides/batch

