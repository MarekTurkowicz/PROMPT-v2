export type UserRole = "pm" | "member" | "viewer" | "admin";

export interface UserProfile {
  role: UserRole;
  phone?: string;
  avatar_url?: string;
}

export interface AppUser {
  id: number;
  first_name?: string;
  last_name?: string;
  email: string;
  profile?: UserProfile;
  tasks_count?: number;
  done_tasks_count?: number;
}

export interface MeUser {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  is_staff: boolean;
  role: UserRole;
}

export interface CreateUserPayload {
  email: string;
  first_name?: string;
  last_name?: string;
  password: string;
  role?: UserRole;
  phone?: string;
  avatar_url?: string;
}

export interface UpdateUserPayload {
  email?: string;
  first_name?: string;
  last_name?: string;
  password?: string;
  role?: UserRole;
  phone?: string;
  avatar_url?: string;
}
