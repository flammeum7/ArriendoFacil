const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');

dayjs.extend(utc);

function toUtc(date) {
  return dayjs.utc(date).startOf('day');
}

// Ciclo N (0-indexado) desde la fecha de inicio del contrato.
// Ej: inicio 15/09 -> ciclo 0: [15/09, 14/10], vencimiento = 15/09 + offset días.
function getCycle(startDate, cycleIndex, dueDayOffset) {
  const start = toUtc(startDate).add(cycleIndex, 'month');
  const end = toUtc(startDate)
    .add(cycleIndex + 1, 'month')
    .subtract(1, 'day');
  const due = start.add(dueDayOffset, 'day');
  return {
    periodStart: start.toDate(),
    periodEnd: end.toDate(),
    dueDate: due.toDate(),
  };
}

// Índice del ciclo vigente en la fecha "ref" (meses completos transcurridos).
function getCurrentCycleIndex(startDate, ref = new Date()) {
  const start = toUtc(startDate);
  const now = toUtc(ref);
  if (now.isBefore(start)) return -1;
  return now.diff(start, 'month');
}

module.exports = { getCycle, getCurrentCycleIndex };
