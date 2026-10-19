/**
 * Calendar math on yyyy-mm-dd day strings. Days are treated as plain dates
 * (UTC midnight) so the result never depends on the viewer's time zone; the
 * server decides which Malmö day "today" is.
 */

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

export interface DayRange {
  from: string;
  to: string;
}

function toDate(day: string) {
  return new Date(`${day}T00:00:00Z`);
}

function toDay(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function isDay(value: unknown): value is string {
  return typeof value === "string" && DAY_RE.test(value) && !Number.isNaN(toDate(value).getTime());
}

export function addDays(day: string, days: number) {
  const date = toDate(day);
  date.setUTCDate(date.getUTCDate() + days);
  return toDay(date);
}

/** 0 = Monday … 6 = Sunday */
export function weekday(day: string) {
  return (toDate(day).getUTCDay() + 6) % 7;
}

/** First day of the month containing `day`. */
export function monthStart(day: string) {
  return `${day.slice(0, 7)}-01`;
}

export function addMonths(day: string, months: number) {
  const date = toDate(monthStart(day));
  date.setUTCMonth(date.getUTCMonth() + months);
  return toDay(date);
}

/** Monday-first grid of whole weeks covering the month that contains `day`. */
export function monthGrid(day: string) {
  const first = monthStart(day);
  const start = addDays(first, -weekday(first));
  const next = addMonths(first, 1);
  const days: string[] = [];
  for (let d = start; d < next || weekday(d) !== 0; d = addDays(d, 1)) days.push(d);
  return days;
}

/** Order two days into a range. */
export function toRange(a: string, b: string): DayRange {
  return a <= b ? { from: a, to: b } : { from: b, to: a };
}

export function inRange(day: string, range: DayRange) {
  return day >= range.from && day <= range.to;
}

/** Number of days in a range, both ends included. */
export function rangeLength(range: DayRange) {
  return Math.round((toDate(range.to).getTime() - toDate(range.from).getTime()) / 86_400_000) + 1;
}

/** The coming (or current) Saturday and Sunday, or just Sunday on a Sunday. */
export function weekend(today: string): DayRange {
  const wd = weekday(today);
  if (wd === 6) return { from: today, to: today };
  return { from: addDays(today, 5 - wd), to: addDays(today, 6 - wd) };
}

// Hand-rolled rather than Intl so server and browser render identical text
// (ICU versions differ, e.g. "Fri 9 Oct" vs "Fri, 9 Oct", which breaks hydration).
const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
/** Column headings for Monday-first month grids. */
export const WEEKDAYS_SHORT = WEEKDAYS.map((d) => d.slice(0, 3));
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** Full English weekday and month names of a day, plus the day of the month. */
export function dayNames(day: string) {
  return { weekday: WEEKDAYS[weekday(day)], day: Number(day.slice(8)), month: MONTHS[Number(day.slice(5, 7)) - 1] };
}

export function formatMonth(day: string) {
  return `${dayNames(day).month} ${day.slice(0, 4)}`;
}

/** "Fri 9 Oct". */
export function formatShort(day: string) {
  const p = dayNames(day);
  return `${p.weekday.slice(0, 3)} ${p.day} ${p.month.slice(0, 3)}`;
}

/** "9 Oct". */
export function formatDayMonth(day: string) {
  const p = dayNames(day);
  return `${p.day} ${p.month.slice(0, 3)}`;
}

/** "Friday 9 October" for one day, "Fri 9 Oct – Sun 11 Oct" for a range. */
export function formatRange(range: DayRange) {
  if (range.from === range.to) return formatDay(range.from);
  return `${formatShort(range.from)} – ${formatShort(range.to)}`;
}

export function formatDay(day: string) {
  const p = dayNames(day);
  return `${p.weekday} ${p.day} ${p.month}`;
}
