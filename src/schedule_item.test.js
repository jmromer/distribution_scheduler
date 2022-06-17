// Docs:
// https://docs.n8n.io/nodes/n8n-nodes-base.functionItem
// https://github.com/moment/luxon
// https://jmespath.org

const tk = require("timekeeper");
const { DateTime } = require("luxon");
const node = require("./schedule_item");

const freezeDate = (dateString) => {
  const date = new Date(`${dateString}T00:00:00.000-04:00`).toISOString().split('T')[0];
  tk.freeze(date);
  return date;
}

afterEach(() => tk.reset());

test("returns true if registration opens today for the event being scheduled", () => {
  const today = freezeDate('2022-06-14');
  const item = {
    id: "recklvKSxYpBO1uic",
    createdTime: "2022-06-17T12:41:08.000Z",
    fields: {
      "id": 18,
      "program_record_id": ["recqTIajb3BBJR8Bl"],
      "date": "2022-06-17",
      "repeat": "daily",
      "start_time": "10:00",
      "end_time": "13:00",
      "repeat_end": "after",
      "repeat_end_after": 3,
      "registration_period": 3,
      "program_id": ["recqTIajb3BBJR8Bl"],
      "org_name": ["Help Kitchen"],
      "program_name": ["Bill's Program"]
    }
  };
  expect(node.hasUpcomingDistribution(item, today)).toEqual(true);
});
