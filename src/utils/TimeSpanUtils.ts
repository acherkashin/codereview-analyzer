// https://stackoverflow.com/questions/14297625/work-with-a-time-span-in-javascript
export interface TimeSpan {
  years: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
  _years: number;
  _days: number;
  _hours: number;
  _minutes: number;
  _seconds: number;
  _milliseconds: number;
}

export function timeSince(when: Date, since: Date = new Date()): TimeSpan {
  // this ignores months
  const obj: TimeSpan = {} as any;
  obj._milliseconds = since.valueOf() - when.valueOf();
  obj.milliseconds = obj._milliseconds % 1000;
  obj._seconds = (obj._milliseconds - obj.milliseconds) / 1000;
  obj.seconds = obj._seconds % 60;
  obj._minutes = (obj._seconds - obj.seconds) / 60;
  obj.minutes = obj._minutes % 60;
  obj._hours = (obj._minutes - obj.minutes) / 60;
  obj.hours = obj._hours % 24;
  obj._days = (obj._hours - obj.hours) / 24;
  obj.days = obj._days % 365;
  // finally
  obj.years = (obj._days - obj.days) / 365;
  return obj;
}

export function timeSinceString({ days, hours }: TimeSpan): string {
  return `${days} ${days === 1 ? 'day' : 'days'}, ${hours} ${hours === 1 ? 'hour' : 'hours'}`;
}
