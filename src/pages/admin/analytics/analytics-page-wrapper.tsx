import { ComingSoonPage } from "@/pages/coming-soon";

type AnalyticsPageWrapperProps = {
  title: string;
};

export function AnalyticsPageWrapper({ title }: AnalyticsPageWrapperProps) {
  return <ComingSoonPage title={title} showBack={false} />;
}
