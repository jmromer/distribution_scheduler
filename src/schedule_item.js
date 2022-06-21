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

class Schedule {
  constructor(fields, today = null) {
    this.today = today;
    this.fields = fields;
    this.date = fields.date;
    this.registration_period = fields.registration_period;
    this.repeat = fields.repeat;
    this.repeat_end = fields.repeat_end;
    this.repeat_end_after = fields.repeat_end_after;
    this.repeat_end_on_date = fields.repeat_end_on_date;
    this.repeat_monthly = fields.repeat_monthly;
    this.is_recurring = this.repeat !== "never";
    this.events = [];
  }

  registrationDates() {
    return this.distributionEvents().map(e => e.registration);
  }

  distributionEvents() {
    if (this.events.length) { return this.events; }

    let currOccurrence = 0;
    let currDistributionDate = fromString(this.date);
    let currRegistrationDate = currDistributionDate.minus({ days: this.registration_period });

    do {
      this.events.push({ registration: toString(currRegistrationDate), distribution: toString(currDistributionDate) });
      if (this.is_recurring) {
        currOccurrence += 1;
        currDistributionDate = this.nextDistributionDate(currDistributionDate);
        currRegistrationDate = currDistributionDate.minus({ days: this.registration_period });
      }
    } while (this.shouldRepeat(currOccurrence, currDistributionDate, currRegistrationDate));

    return this.events;
  }

  shouldRepeat(occurrencesSoFar, distributionDate, registrationDate) {
    if (!this.is_recurring) { return false; }

    switch (this.repeat_end) {
      case "never":
        return this.today && (toString(registrationDate) <= toString(fromString(this.today).plus({ days: this.registration_period })));
      case "after":
        return occurrencesSoFar < this.repeat_end_after;
      case "on_date":
        return toString(distributionDate) <= this.repeat_end_on_date;
    }
  }

  nextDistributionDate(distributionDate) {
    switch (this.repeat) {
      case "daily":
        return distributionDate.plus({ days: 1 });
      case "weekly":
        return distributionDate.plus({ days: 7 });
      case "biweekly":
        return distributionDate.plus({ days: 14 });
      case "monthly":
        if (!this.repeat_monthly) { return distributionDate.plus({ months: 1 }); }
        return this.monthlyRecurrence(distributionDate, ...this.repeat_monthly.split(" "));
    }
  }

  // Handle 'second monday', 'last day', etc
  monthlyRecurrence(distributionDate, targetOccurrence, targetDay) {
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
}

// Is today a day on which a distribution event should be created for the
// item (a schedule record) being processed?
//
// Return the provided schedule item if the schedule has a distribution event
// scheduled `registration_period` days from today, where `registration_period`
// is a positive integer.
function run({ fields }) {
  const today = toString(DateTime.now().setZone("America/New_York"));
  const schedule = new Schedule(fields, today);

  for (let distributionEvent of schedule.distributionEvents()) {
    if (distributionEvent.registration === today) {
      const { program_record_id, start_time, end_time, program_id, org_name, program_name, registration_period } = fields
      return {
        program_record_id,
        date: distributionEvent.distribution,
        registration_period,
        start_time,
        end_time,
      };
    }
  }

  return {};
}

module.exports = { Schedule }
