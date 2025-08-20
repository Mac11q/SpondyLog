'use strict';

function getTodayId(tz, date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  });
  const parts = formatter.formatToParts(date).reduce((acc, p) => ({ ...acc, [p.type]: p.value }), {});
  return `${parseInt(parts.year)}-${parseInt(parts.month)}-${parseInt(parts.day)}`;
}

function saveDefault(state, metric, value, now = new Date(), tz = 'UTC') {
  state.settings.defaultLevels[metric] = value;
  if (value > 0) {
    const todayId = getTodayId(tz, now);
    state.settings.defaultStartDates[metric] = todayId;
    state.settings.defaultTimeZones[metric] = tz;
    const data = state[metric];
    const cur = data[todayId];
    if (cur === undefined || cur === null || cur === 0) {
      data[todayId] = value;
    }
  } else {
    state.settings.defaultStartDates[metric] = null;
    state.settings.defaultTimeZones[metric] = null;
  }
}

function dailyMaterialization(state, now = new Date(), tz = 'UTC') {
  const todayId = getTodayId(tz, now);
  const today = todayId;
  ['pain', 'stiffness'].forEach(metric => {
    const level = state.settings.defaultLevels[metric];
    const start = state.settings.defaultStartDates[metric];
    if (level > 0 && start && start <= today) {
      const data = state[metric];
      const cur = data[todayId];
      const skipped = state.defaultSkipDates[metric] && state.defaultSkipDates[metric][todayId];
      if ((cur === undefined || cur === null || cur === 0) && !skipped) {
        data[todayId] = level;
      }
    }
  });
}

function resetDay(state, dateId, metrics = ['pain', 'stiffness']) {
  metrics.forEach(metric => {
    const data = state[metric];
    delete data[dateId];
    if (!state.defaultSkipDates[metric]) state.defaultSkipDates[metric] = {};
    state.defaultSkipDates[metric][dateId] = true;
  });
}

function saveManual(state, dateId, metric, value) {
  if (value > 0) {
    state[metric][dateId] = value;
  } else {
    delete state[metric][dateId];
  }
}

module.exports = { getTodayId, saveDefault, dailyMaterialization, resetDay, saveManual };
