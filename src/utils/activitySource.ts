import defaultActivities from '@/static/activities.json';
import { Activity } from '@/utils/utils';

export const getActivitiesData = (): Activity[] => {
  if (
    typeof window !== 'undefined' &&
    (window as any).__ACTIVITIES__ &&
    Array.isArray((window as any).__ACTIVITIES__) &&
    (window as any).__ACTIVITIES__.length > 0
  ) {
    return (window as any).__ACTIVITIES__ as Activity[];
  }
  return defaultActivities as Activity[];
};
