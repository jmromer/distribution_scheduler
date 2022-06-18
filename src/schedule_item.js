// Input:
//   This node accepts a distribution schedule
//
// Output:
//   A JSON object represening a new row in the Distributions Airtable sheet, if
//   one should be added today.
//
const { DateTime } = require("luxon");
const toString = (date) => date.toFormat('yyyy-MM-dd');
const fromString = (string) => DateTime.fromFormat(string, 'yyyy-MM-dd').setZone("America/New_York");

function scheduledRegistrationDates({ fields }, today = null) {
  const { date, registration_period, repeat } = fields;
  const registrationDates = [];

  let currOccurrence = 0;
  let currDistributionDate = fromString(date);
  let currRegistrationDate = currDistributionDate.minus({ days: registration_period });

  do {
    registrationDates.push(toString(currRegistrationDate));

    if (repeat !== "never") {
      currOccurrence += 1;
      currDistributionDate = currDistributionDate.plus(recurrenceInterval(fields))
      currRegistrationDate = currDistributionDate.minus({ days: registration_period });
    }
  } while (shouldRepeat(currOccurrence, currDistributionDate, currRegistrationDate, today, fields));

  return registrationDates;
}

function shouldRepeat(occurrences, distributionDate, registrationDate, today, fields) {
  const { repeat, repeat_end, repeat_end_after, repeat_end_on_date } = fields;

  if (repeat === "never") { return false; }

  switch (repeat_end) {
    case "never":
      return today && (toString(registrationDate) <= toString(fromString(today).plus({ days: fields.registration_period })));
    case "after":
      return occurrences < repeat_end_after;
    case "on_date":
      return toString(distributionDate) <= repeat_end_on_date;
  }
}

function recurrenceInterval({ repeat, repeat_monthly }) {
  switch (repeat) {
    case 'daily':
      return { days: 1 };
    case 'weekly':
      return { days: 7 };
    case 'biweekly':
      return { days: 14 };
    case 'monthly':
      return monthlyRecurrence(repeat_monthly);
  }
}

// TODO
// Handle 'second monday', 'last day', etc
function monthlyRecurrence(repeat_monthly) {
  if (!repeat_monthly) { return { months: 1 }; }

  const weekdays = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
  const occurrence = { first: 1, second: 2, third: 3, fourth: 4, last: -1 };
  const [interval, day] = repeat_monthly.split(' ');

  return [occurrence[interval], weekdays[day]];
}

// Is today a day on which a distribution event should be created for the
// item (a schedule record) being processed?
//
// Return true if the schedule has a distribution event scheduled
// `registration_period` days from today, where `registration_period` is a
// positive integer.
function hasUpcomingDistribution(input, today) {
  for (let registrationDate of scheduledRegistrationDates(input, today)) {
    if (registrationDate === today) { return true; }
  }
  return false;
}

function run(item) {
  if (hasUpcomingDistribution(item)) {
    return {}
  }
}

module.exports = {
  scheduledRegistrationDates,
}
