import { MyTasks } from "./my-tasks";

/** The caller's case workflow steps. The intake twin is at `/leads/my-tasks`. */
export function MyTasksPage() {
  return (
    <MyTasks
      source="workflow"
      heading="My Tasks"
      description="Track and manage your assigned workflow steps"
      emptyText="No case workflow steps match this filter."
      reviewQueuePath="/cases/review-queue"
    />
  );
}
