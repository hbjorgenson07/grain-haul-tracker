export interface Profile {
  id: string;
  full_name: string;
  role: 'admin' | 'driver';
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Truck {
  id: string;
  name: string;
  license_plate: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Location {
  id: string;
  name: string;
  type: 'field' | 'elevator' | 'bin_site' | 'processing' | 'other';
  is_active: boolean;
  created_at: string;
}

export interface CropType {
  id: string;
  name: string;
  is_active: boolean;
}

export interface Session {
  id: string;
  driver_id: string;
  truck_id: string;
  crop_type_id: string | null;
  started_at: string;
  ended_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  session_id: string;
  driver_id: string;
  truck_id: string;
  activity_type: string;
  location_id: string | null;
  timestamp: string;
  notes: string | null;
  created_at: string;
}

// Joined types for queries
export interface SessionWithDetails extends Session {
  truck: Truck;
  crop_type: CropType | null;
  driver: Profile;
  activity_logs?: ActivityLog[];
}

export interface ActivityLogWithDetails extends ActivityLog {
  location: Location | null;
}

export interface TripSummary {
  session_id: string;
  trip_number: number;
  origin_location: string | null;
  destination_location: string | null;
  loading_duration_minutes: number | null;
  travel_duration_minutes: number | null;
  unloading_duration_minutes: number | null;
  return_duration_minutes: number | null;
}
