const tk = require("timekeeper");
const { DateTime } = require("luxon");

const node = require("./schedule_item");

afterEach(() => tk.reset());

// #scheduledRegistrationDates
it("not repeating: returns a single registration date", () => {
  let item = buildSchedule({ date: '2022-06-15', registration_period: 3, repeat: "never" });
  let registrationDates = node.scheduledRegistrationDates(item);
  expect(registrationDates).toEqual(["2022-06-12"]);
});

it("repeating daily: returns a list of dates on which registration opens", () => {
  // ending after n times
  let item = buildSchedule({ date: '2022-06-15', registration_period: 5, repeat: "daily", repeat_end: "after", repeat_end_after: 10 });
  let registrationDates = node.scheduledRegistrationDates(item);
  expect(registrationDates).toEqual([
    "2022-06-10", "2022-06-11", "2022-06-12", "2022-06-13", "2022-06-14",
    "2022-06-15", "2022-06-16", "2022-06-17", "2022-06-18", "2022-06-19",
  ]);

  item = buildSchedule({ date: '2022-06-15', registration_period: 5, repeat: "daily", repeat_end: "after", repeat_end_after: 5 });
  registrationDates = node.scheduledRegistrationDates(item);
  expect(registrationDates).toEqual(["2022-06-10", "2022-06-11", "2022-06-12", "2022-06-13", "2022-06-14"]);

  // ending on a date
  item = buildSchedule({ date: '2022-06-15', registration_period: 5, repeat: "daily", repeat_end: "on_date", repeat_end_on_date: "2022-06-17", });
  registrationDates = node.scheduledRegistrationDates(item);
  expect(registrationDates).toEqual(["2022-06-10", "2022-06-11", "2022-06-12"]);

  // no defined ending
  let today = freezeDate('2022-06-20');
  item = buildSchedule({ date: '2022-06-15', registration_period: 5, repeat: "daily", repeat_end: "never", });
  registrationDates = node.scheduledRegistrationDates(item, today);
  expect(registrationDates.length).toEqual(16);
  expect(registrationDates[0]).toEqual("2022-06-10");
  expect(registrationDates[15]).toEqual("2022-06-25");
});

it("repeating weekly: returns a list of dates on which registration opens", () => {
  let item = buildSchedule({ date: '2022-06-08', registration_period: 7, repeat: "weekly", repeat_end: "after", repeat_end_after: 3 });
  let registrationDates = node.scheduledRegistrationDates(item);
  expect(registrationDates).toEqual(["2022-06-01", "2022-06-08", "2022-06-15"]);

  item = buildSchedule({ date: '2022-06-08', registration_period: 7, repeat: "weekly", repeat_end: "after", repeat_end_after: 1 });
  registrationDates = node.scheduledRegistrationDates(item);
  expect(registrationDates).toEqual(["2022-06-01"]);
});

it("repeating biweekly: returns a list of dates on which registration opens", () => {
  let item = buildSchedule({ date: '2022-06-08', registration_period: 7, repeat: "biweekly", repeat_end: "after", repeat_end_after: 3 });
  let registrationDates = node.scheduledRegistrationDates(item);
  expect(registrationDates).toEqual(["2022-06-01", "2022-06-15", "2022-06-29"]);

  item = buildSchedule({ date: '2022-06-08', registration_period: 7, repeat: "biweekly", repeat_end: "after", repeat_end_after: 1 });
  registrationDates = node.scheduledRegistrationDates(item);
  expect(registrationDates).toEqual(["2022-06-01"]);
});

it("repeating monthly: returns a list of dates on which registration opens", () => {
  let item = buildSchedule({ date: '2022-06-08', registration_period: 7, repeat: "monthly", repeat_end: "after", repeat_end_after: 3 });
  let registrationDates = node.scheduledRegistrationDates(item);
  expect(registrationDates).toEqual(["2022-06-01", "2022-07-01", "2022-08-01"]);

  item = buildSchedule({ date: '2022-06-08', registration_period: 7, repeat: "monthly", repeat_end: "after", repeat_end_after: 1 });
  registrationDates = node.scheduledRegistrationDates(item);
  expect(registrationDates).toEqual(["2022-06-01"]);
});

// it("repeating monthly (nth weekday): returns a list of dates on which registration opens", () => {
//   let item = buildSchedule({ date: '2022-06-08', registration_period: 7, repeat: "monthly", repeat_end: "after", repeat_end_after: 3, monthly_repeat: "third wednesday" });
//   let registrationDates = node.scheduledRegistrationDates(item);
//   expect(registrationDates).toEqual(["2022-06-01", "2022-07-01", "2022-08-01"]);
// });

// it("repeating monthly (nth day): returns a list of dates on which registration opens", () => {
// });

const freezeDate = (dateString) => {
  tk.freeze(dateString);
  return dateString;
}

const buildSchedule = fields => {
  return {
    id: "recklvKSxYpBO1uic",
    createdTime: "2022-06-17T12:41:08.000Z",
    fields: {
      "id": 18,
      "program_record_id": ["recqTIajb3BBJR8Bl"],
      "date": fields.date,
      "registration_period": fields.registration_period,
      "repeat": fields.repeat,
      "repeat_end": fields.repeat_end,
      "repeat_end_after": fields.repeat_end_after,
      "repeat_end_on_date": fields.repeat_end_on_date,
      "repeat_monthly": fields.repeat_monthly,
      "start_time": "10:00",
      "end_time": "13:00",
      "program_id": ["recqTIajb3BBJR8Bl"],
      "org_name": ["Help Kitchen"],
      "program_name": ["Bill's Program"]
    }
  };
};
