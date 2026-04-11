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

/** §5 — application answer payload */
export type CircleApplyAnswer = {
  question_id: string;
  answer: string;
};

/** Nested Razorpay order payload from apply / accept-offer */
export type CircleRazorpayOrderPayload = {
  payment?: { id?: string };
  orderId?: string;
  amount?: number;
  currency?: string;
  key?: string;
};

export type ApplyToEventData = {
  application: { id: string; status: string } & Record<string, unknown>;
  payment?: CircleRazorpayOrderPayload;
  waitlisted?: boolean;
  waitlist_position?: number;
};

export type CircleApplicationUser = {
  id: string;
  username?: string | null;
  email?: string | null;
  verification_tier?: number;
};

export type CircleApplicationAnswerRow = {
  id?: string;
  answer?: string;
  question?: { question_text?: string };
};

export type CircleApplicationPaymentRow = {
  id?: string;
  amount?: string;
  status?: string;
};

/** Host list row — §5.2 */
export type CircleEventApplicationRow = {
  id: string;
  status: string;
  waitlist_position?: number | null;
  ticket_id?: string | null;
  is_checked_in?: boolean;
  user?: CircleApplicationUser;
  answers?: CircleApplicationAnswerRow[];
  payment?: CircleApplicationPaymentRow;
};

export type SelectApplicationsData = {
  selected: number;
  rejected: number;
};

export type CancelApplicationData = {
  application: { id: string; status: string };
  refund?: {
    eligible?: boolean;
    percentage?: number;
    amount?: number;
    reason?: string;
  };
};

export type UninviteApplicationData = {
  message?: string;
  refunded?: boolean;
};

export type CircleMyApplication = {
  id: string;
  status: string;
  ticket_id?: string | null;
  event?: {
    id: string;
    title: string;
    host?: { username?: string | null };
  };
  payment?: CircleApplicationPaymentRow & { id?: string };
};

export type WaitlistPositionData = {
  position: number;
  totalWaitlisted: number;
  status: string;
};

export type AcceptOfferData = {
  application: { id: string; status: string };
  payment?: CircleRazorpayOrderPayload;
};

/** §6.1 */
export type CirclePaymentDetails = {
  id: string;
  application_id?: string;
  razorpay_order_id?: string | null;
  razorpay_payment_id?: string | null;
  amount: string;
  status: string;
  refund_id?: string | null;
  refund_amount?: string | null;
  paid_at?: string | null;
};

/** §8 */
export type CheckinGenerateData = {
  otp: string;
  expiresInSeconds: number;
  message: string;
};

export type CheckinVerifyData = {
  user: {
    id: string;
    username?: string;
    avatar_url?: string | null;
  };
  checked_in_at: string;
};

export type CheckinAttendee = {
  applicationId: string;
  user: {
    id: string;
    username?: string;
    avatar_url?: string | null;
  };
  isCheckedIn: boolean;
  checkedInAt?: string | null;
};

export type CheckinEventStatusData = {
  total: number;
  checkedIn: number;
  pending: number;
  attendees: CheckinAttendee[];
};
