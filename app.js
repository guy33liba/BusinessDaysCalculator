const form = document.querySelector('#businessDaysForm');
const startDateInput = document.querySelector('#startDate');
const endDateInput = document.querySelector('#endDate');
const countrySelect = document.querySelector('#country');
const excludeWeekendsInput = document.querySelector('#excludeWeekends');
const excludeHolidaysInput = document.querySelector('#excludeHolidays');
const formError = document.querySelector('#formError');
const businessDaysResult = document.querySelector('#businessDaysResult');
const calendarDaysResult = document.querySelector('#calendarDaysResult');
const weekendDaysResult = document.querySelector('#weekendDaysResult');
const holidayDaysResult = document.querySelector('#holidayDaysResult');
const resultRange = document.querySelector('#resultRange');
const copyButton = document.querySelector('#copyButton');
const resetButton = document.querySelector('#resetButton');
const resultsPanel = document.querySelector('#resultsPanel');

let lastResultText = '';

const DAY_MS = 86400000;

function toUtcDate(value) {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date, days) {
  return new Date(date.getTime() + days * DAY_MS);
}

function nthWeekday(year, monthIndex, weekday, nth) {
  const first = new Date(Date.UTC(year, monthIndex, 1));
  const offset = (weekday - first.getUTCDay() + 7) % 7;
  return new Date(Date.UTC(year, monthIndex, 1 + offset + (nth - 1) * 7));
}

function lastWeekday(year, monthIndex, weekday) {
  const last = new Date(Date.UTC(year, monthIndex + 1, 0));
  const offset = (last.getUTCDay() - weekday + 7) % 7;
  return new Date(Date.UTC(year, monthIndex, last.getUTCDate() - offset));
}

function observedNextMonday(date) {
  const day = date.getUTCDay();
  if (day === 6) return addDays(date, 2);
  if (day === 0) return addDays(date, 1);
  return date;
}

function observedUsFederal(date) {
  const day = date.getUTCDay();
  if (day === 6) return addDays(date, -1);
  if (day === 0) return addDays(date, 1);
  return date;
}

function easterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

function holidayDatesForYear(country, year) {
  const dates = [];
  const push = (date) => dates.push(dateKey(date));

  if (country === 'US') {
    push(observedUsFederal(new Date(Date.UTC(year, 0, 1))));
    push(nthWeekday(year, 0, 1, 3));
    push(nthWeekday(year, 1, 1, 3));
    push(lastWeekday(year, 4, 1));
    push(observedUsFederal(new Date(Date.UTC(year, 5, 19))));
    push(observedUsFederal(new Date(Date.UTC(year, 6, 4))));
    push(nthWeekday(year, 8, 1, 1));
    push(nthWeekday(year, 9, 1, 2));
    push(observedUsFederal(new Date(Date.UTC(year, 10, 11))));
    push(nthWeekday(year, 10, 4, 4));
    push(observedUsFederal(new Date(Date.UTC(year, 11, 25))));
  }

  if (country === 'GB') {
    push(observedNextMonday(new Date(Date.UTC(year, 0, 1))));
    const easter = easterSunday(year);
    push(addDays(easter, -2));
    push(addDays(easter, 1));
    push(nthWeekday(year, 4, 1, 1));
    push(lastWeekday(year, 4, 1));
    push(lastWeekday(year, 7, 1));
    const christmas = new Date(Date.UTC(year, 11, 25));
    const boxing = new Date(Date.UTC(year, 11, 26));
    if (christmas.getUTCDay() === 6) {
      push(addDays(christmas, 2));
      push(addDays(boxing, 2));
    } else if (christmas.getUTCDay() === 0) {
      push(addDays(christmas, 2));
      push(addDays(boxing, 1));
    } else {
      push(christmas);
      push(boxing);
    }
  }

  if (country === 'CA') {
    push(observedNextMonday(new Date(Date.UTC(year, 0, 1))));
    const easter = easterSunday(year);
    push(addDays(easter, -2));
    const may24 = new Date(Date.UTC(year, 4, 24));
    push(addDays(may24, -((may24.getUTCDay() + 6) % 7)));
    push(observedNextMonday(new Date(Date.UTC(year, 6, 1))));
    push(nthWeekday(year, 8, 1, 1));
    push(nthWeekday(year, 9, 1, 2));
    push(observedNextMonday(new Date(Date.UTC(year, 11, 25))));
  }

  if (country === 'AU') {
    push(observedNextMonday(new Date(Date.UTC(year, 0, 1))));
    push(observedNextMonday(new Date(Date.UTC(year, 0, 26))));
    const easter = easterSunday(year);
    push(addDays(easter, -2));
    push(addDays(easter, 1));
    push(new Date(Date.UTC(year, 3, 25)));
    push(nthWeekday(year, 5, 1, 2));
    const christmas = new Date(Date.UTC(year, 11, 25));
    const boxing = new Date(Date.UTC(year, 11, 26));
    if (christmas.getUTCDay() === 6) {
      push(addDays(christmas, 2));
      push(addDays(boxing, 2));
    } else if (christmas.getUTCDay() === 0) {
      push(addDays(christmas, 2));
      push(addDays(boxing, 1));
    } else {
      push(christmas);
      push(boxing);
    }
  }

  return dates;
}

function buildHolidaySet(country, startYear, endYear) {
  if (country === 'NONE') return new Set();
  const holidays = new Set();
  for (let year = startYear - 1; year <= endYear + 1; year += 1) {
    holidayDatesForYear(country, year).forEach((key) => holidays.add(key));
  }
  return holidays;
}

function calculateRange(start, end, excludeWeekends, excludeHolidays, country) {
  const calendarDays = Math.floor((end - start) / DAY_MS) + 1;
  const holidays = buildHolidaySet(country, start.getUTCFullYear(), end.getUTCFullYear());
  let weekendDays = 0;
  let holidayDays = 0;
  let businessDays = 0;

  for (let cursor = start; cursor <= end; cursor = addDays(cursor, 1)) {
    const isWeekend = cursor.getUTCDay() === 0 || cursor.getUTCDay() === 6;
    const isHoliday = holidays.has(dateKey(cursor));

    if (isWeekend) weekendDays += 1;

    const weekendExcluded = excludeWeekends && isWeekend;
    const holidayExcluded = excludeHolidays && isHoliday && !weekendExcluded;

    if (holidayExcluded) holidayDays += 1;
    if (!weekendExcluded && !holidayExcluded) businessDays += 1;
  }

  return { businessDays, calendarDays, weekendDays, holidayDays };
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  }).format(date);
}

function showError(message) {
  formError.textContent = message;
}

function clearError() {
  formError.textContent = '';
}

function resetResults() {
  businessDaysResult.textContent = '—';
  calendarDaysResult.textContent = '—';
  weekendDaysResult.textContent = '—';
  holidayDaysResult.textContent = '—';
  resultRange.textContent = 'Enter two dates to calculate.';
  copyButton.disabled = true;
  lastResultText = '';
}

function renderResult(result, start, end) {
  businessDaysResult.textContent = result.businessDays.toLocaleString();
  calendarDaysResult.textContent = result.calendarDays.toLocaleString();
  weekendDaysResult.textContent = result.weekendDays.toLocaleString();
  holidayDaysResult.textContent = result.holidayDays.toLocaleString();
  resultRange.textContent = `${formatDate(start)} – ${formatDate(end)}`;
  copyButton.disabled = false;
  lastResultText = `${result.businessDays} Business Days | ${result.calendarDays} Calendar Days | ${result.weekendDays} Weekend Days | ${result.holidayDays} Holidays Excluded`;
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  clearError();

  const start = toUtcDate(startDateInput.value);
  const end = toUtcDate(endDateInput.value);

  if (!start || !end) {
    showError('Choose both a start date and an end date.');
    return;
  }

  if (end < start) {
    showError('End Date must be on or after Start Date.');
    endDateInput.focus();
    return;
  }

  const result = calculateRange(
    start,
    end,
    excludeWeekendsInput.checked,
    excludeHolidaysInput.checked,
    countrySelect.value
  );

  renderResult(result, start, end);
  resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

resetButton.addEventListener('click', () => {
  form.reset();
  excludeWeekendsInput.checked = true;
  excludeHolidaysInput.checked = true;
  countrySelect.value = 'US';
  clearError();
  resetResults();
  startDateInput.focus();
});

copyButton.addEventListener('click', async () => {
  if (!lastResultText) return;
  try {
    await navigator.clipboard.writeText(lastResultText);
    const original = copyButton.textContent;
    copyButton.textContent = 'Copied';
    window.setTimeout(() => { copyButton.textContent = original; }, 1200);
  } catch {
    showError('Could not copy automatically. Please copy the result manually.');
  }
});

countrySelect.addEventListener('change', () => {
  if (countrySelect.value === 'NONE') excludeHolidaysInput.checked = false;
});

resetResults();

(() => {
  if (window.__FREE_TOOLS_WIDGET_LOADER__) return;
  window.__FREE_TOOLS_WIDGET_LOADER__ = true;
  const script = document.createElement('script');
  script.src = 'https://appointments-schedule.netlify.app/tools-widget.js';
  script.defer = true;
  document.head.append(script);
})();
