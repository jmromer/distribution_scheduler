// Input:
//   This node accepts a distribution schedule
//
// Output:
//   A JSON object represening a new row in the Distributions Airtable sheet, if
//   one should be added today.
//
const { DateTime } = require("luxon");
const toString = (date) => date.toFormat("yyyy-MM-dd");
const fromString = (string) => DateTime.fromFormat(string, "yyyy-MM-dd").setZone("America/New_York");

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
      currDistributionDate = nextDistributionDate(currDistributionDate, fields);
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

function nextDistributionDate(distributionDate, { repeat, repeat_monthly }) {
  switch (repeat) {
    case "daily":
      return distributionDate.plus({ days: 1 });
    case "weekly":
      return distributionDate.plus({ days: 7 });
    case "biweekly":
      return distributionDate.plus({ days: 14 });
    case "monthly":
      if (!repeat_monthly) { return distributionDate.plus({ months: 1 }); }
      return monthlyRecurrence(distributionDate, ...repeat_monthly.split(" "));
  }
}

// Handle 'second monday', 'last day', etc
function monthlyRecurrence(distributionDate, targetOccurrence, targetDay) {
  const occurrences = { first: 1, second: 2, third: 3, fourth: 4, last: 1 };
  const weekdays = { monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 7 };
  const targetOccurNum = occurrences[targetOccurrence];
  const targetWDayNum = weekdays[targetDay];

  let currDayOccurrence = 0;
  let currDate = distributionDate.startOf("month").plus({ month: 1 });

  if (targetOccurrence === "last") {
    currDate = currDate.endOf("month");
    while (currDayOccurrence <= targetOccurNum) {
      for (let currWDay = currDate.weekday; currWDay > 0; currWDay--) {
        if (!targetWDayNum || currDate.weekday === targetWDayNum) { currDayOccurrence += 1 }
        if (currDayOccurrence === targetOccurNum && (!targetWDayNum || currDate.weekday === targetWDayNum)) { return currDate; }
        currDate = currDate.minus({ day: 1 });
      }
    }
  } else {
    while (currDayOccurrence <= targetOccurNum) {
      for (let currWDay = currDate.weekday; currWDay < 8; currWDay++) {
        if (!targetWDayNum || currDate.weekday === targetWDayNum) { currDayOccurrence += 1 }
        if (currDayOccurrence === targetOccurNum && (!targetWDayNum || currDate.weekday === targetWDayNum)) { return currDate; }
        currDate = currDate.plus({ day: 1 });
      }
    }
  }
}

// Is today a day on which a distribution event should be created for the
// item (a schedule record) being processed?
//
// Return the provided schedule item if the schedule has a distribution event
// scheduled `registration_period` days from today, where `registration_period`
// is a positive integer.
function run(item) {
  const today = toString(DateTime.now().setZone("America/New_York"));

  for (let registrationDate of scheduledRegistrationDates(input, today)) {
    if (registrationDate === today) { return item; }
  }
}

module.exports = {
  scheduledRegistrationDates,
}
