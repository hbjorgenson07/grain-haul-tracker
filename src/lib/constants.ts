export const ACTIVITY_TYPES = [
  'shift_start',
  'arrived_at_field',
  'loading',
  'loaded_leaving',
  'arrived_at_destination',
  'unloading',
  'finished_unloading',
  'return_trip',
  'shift_end',
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  shift_start: 'Start Shift',
  arrived_at_field: 'Arrived at Field',
  loading: 'Loading Grain',
  loaded_leaving: 'Loaded / Leaving',
  arrived_at_destination: 'Arrived at Destination',
  unloading: 'Unloading',
  finished_unloading: 'Finished Unloading',
  return_trip: 'Return Trip',
  shift_end: 'End Shift',
};

export const ACTIVITY_COLORS: Record<ActivityType, string> = {
  shift_start: 'bg-green-600',
  arrived_at_field: 'bg-blue-600',
  loading: 'bg-orange-500',
  loaded_leaving: 'bg-green-600',
  arrived_at_destination: 'bg-blue-600',
  unloading: 'bg-orange-500',
  finished_unloading: 'bg-green-600',
  return_trip: 'bg-green-600',
  shift_end: 'bg-red-600',
};

export const LOCATION_TYPES = [
  'field',
  'elevator',
  'bin_site',
  'plant',
  'other',
] as const;

export type LocationType = (typeof LOCATION_TYPES)[number];

export const SOURCE_TYPES = ['field', 'storage'] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];
export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  field: 'Harvest (Field)',
  storage: 'From Storage (Bins)',
};

export const DESTINATION_TYPES = ['bins', 'elevator', 'plant'] as const;
export type DestinationType = (typeof DESTINATION_TYPES)[number];
export const DESTINATION_TYPE_LABELS: Record<DestinationType, string> = {
  bins: 'Main Shop Bins',
  elevator: 'Elevator',
  plant: 'Plant',
};

export const ROLES = ['admin', 'driver'] as const;
export type Role = (typeof ROLES)[number];

// Driver workflow state machine: current activity → next expected activity
export const NEXT_ACTIVITY: Record<ActivityType, ActivityType | null> = {
  shift_start: 'arrived_at_field',
  arrived_at_field: 'loading',
  loading: 'loaded_leaving',
  loaded_leaving: 'arrived_at_destination',
  arrived_at_destination: 'unloading',
  unloading: 'finished_unloading',
  finished_unloading: 'return_trip',
  return_trip: 'arrived_at_field',
  shift_end: null,
};

// Activities that require a location selection
export const LOCATION_REQUIRED_ACTIVITIES: ActivityType[] = [
  'arrived_at_field',
  'arrived_at_destination',
];
