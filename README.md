# FOCF Distributions Event Scheduler

Function that determines if a scheduled distribution has a registration period
that begins today.

```js
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
      // . . .
    }
  }

  return {};
}
```

## Workflow Overview

1. Create a distribution schedule for a given program on [Retool][retool]
2. [n8n Workflow][n8n] pulls distribution schedules from Airtable daily
3. For any scheduled events for which registrations open today, the workflow
   creates an entry in the Airtable distributions sheet.

[retool]: https://helpkitchen.retool.com/apps/83848872-ec0e-11ec-a8da-d710f2e7f319/FOCF/Distribution%20Scheduler
[n8n]: https://n8n.dokku.helpkitchen.org/workflow/42
