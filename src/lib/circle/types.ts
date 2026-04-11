/** API envelope used across Circle endpoints */
export type CircleEnvelope<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

export type CircleAuthUser = {
  id: string;
  phone: string;
  username?: string | null;
  email?: string | null;
  verification_tier?: number;
  is_profile_complete?: boolean;
};

export type VerifyOtpData = {
  accessToken: string;
  refreshToken: string;
  isNewUser?: boolean;
  isProfileComplete?: boolean;
  user: CircleAuthUser;
};

export type CircleProfile = {
  id: string;
  phone: string;
  username?: string | null;
  email?: string | null;
  dob?: string | null;
  avatar_url?: string | null;
  verification_tier?: number;
  is_profile_complete?: boolean;
  is_globally_banned?: boolean;
  created_at?: string;
};

export type CircleEventHost = {
  id: string;
  username?: string | null;
  avatar_url?: string | null;
};

export type CircleEventQuestion = {
  id: string;
  question_text: string;
  question_type: string;
  options?: string[] | null;
  is_required?: boolean;
  is_base?: boolean;
  sort_order?: number;
};

export type CircleEvent = {
  id: string;
  title: string;
  description?: string;
  max_capacity: number;
  price: string;
  event_date: string;
  location?: string;
  slug?: string;
  cover_image_url?: string | null;
  status?: string;
  visibility?: string;
  min_age?: number;
  min_verification_tier?: number;
  waitlist_enabled?: boolean;
  refund_full_before_hours?: number;
  refund_partial_before_hours?: number;
  refund_partial_percentage?: number;
  host?: CircleEventHost;
  questions?: CircleEventQuestion[];
};

export type CircleListMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type CircleEventQuestionInput = {
  question_text: string;
  question_type: string;
  is_required?: boolean;
  sort_order?: number;
  options?: string[];
};

export type CircleBroadcastBody = {
  subject: string;
  message: string;
  targetStatuses?: string[];
};
