export type ActivityStatus = 'ongoing' | 'upcoming' | 'completed';

export interface Activity {
  id: string;
  title: string;
  description: string;
  category: string;
  status: ActivityStatus;
  date: string;
  time: string;
  location: string;
  max_capacity?: number;
  speaker?: string;
  tags?: string[];
  registrations_count?: number;
  created_at?: string;
}

export interface Registration {
  id: string;
  activity_id: string;
  student_email: string;
  registered_at: string;
}

export interface AdminActivityWithRegistrations extends Activity {
  registrations: Registration[];
}

export interface RegisterPayload {
  activityId: string;
  email: string;
}

export interface RegisterResponse {
  success: boolean;
  message?: string;
  registration?: Registration;
  error?: string;
}

export interface AdminAuthResponse {
  success: boolean;
  token?: string;
  expiresAt?: number;
  error?: string;
}
