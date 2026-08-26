import { MyTasks } from "../my-tasks/my-tasks";

/** The caller's intake checklist steps. The case twin is at `/cases/my-tasks`. */
export function MyLeadsTasks() {
  return (
    <MyTasks
      source="pipeline"
      heading="My Tasks"
      description="Track and manage your assigned intake tasks"
      emptyText="No intake tasks match this filter."
      reviewQueuePath="/leads/review-queue"
    />
  );
}
