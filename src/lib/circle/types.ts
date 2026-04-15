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
  /** OAuth-only users may have `null` until a phone is linked. */
  phone: string | null;
  username?: string | null;
  email?: string | null;
  dob?: string | null;
  avatar_url?: string | null;
  verification_tier?: number;
  is_profile_complete?: boolean;
  is_globally_banned?: boolean;
  created_at?: string;
  /** Extended fields from `GET /users/me` (snake_case on wire). */
  bio?: string | null;
  city?: string | null;
  dietary_preference?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  email_verified?: boolean;
  google_id?: string | null;
  last_active_at?: string | null;
  profile_completion_score?: number;
  updated_at?: string | null;
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
  /** Some list endpoints send a single label */
  category?: string;
  categories?: string[];
  max_capacity: number;
  price: string | number;
  event_date: string;
  /** Optional; may mirror or complement `event_date` depending on backend. */
  start_time?: string | null;
  end_time?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  /** IANA timezone name when API returns it */
  timezone?: string;
  /** Free-form labels; shape varies by backend — normalize in mapper */
  tags?: string[] | string | null;
  location?: string;
  /** Slug: indoor_venue, outdoor, online, etc. */
  location_type?: string;
  locationType?: string;
  slug?: string;
  cover_image_url?: string | null;
  /** Some backends emit camelCase only */
  coverImageUrl?: string | null;
  image_urls?: string[];
  imageUrls?: string[];
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
  /** Filled seats / applications count — snake or camel per backend */
  spots_taken?: number;
  spotsTaken?: number;
  registered_count?: number;
  /** Long-form fields when API returns them */
  more_about?: string;
  moreAbout?: string;
  whats_included?: string[];
  whatsIncluded?: string[];
  guest_suggestions?: string[];
  guestSuggestions?: string[];
  allowed_and_notes?: string;
  allowedAndNotes?: string;
  house_rules?: { dos?: string[]; donts?: string[] };
  houseRules?: { dos?: string[]; donts?: string[] };
  /** Overall rules paragraph (separate from `house_rules` bullets). */
  event_rules?: string;
  eventRules?: string;
  faqs?: { q: string; a: string }[];
  refund_policy?: string;
  refundPolicy?: string;
  terms_required?: boolean;
  termsRequired?: boolean;
  contact_email?: string | null;
  contact_phone?: string | null;
  registration_opens_at?: string | null;
  registration_closes_at?: string | null;
  tax_percentage?: string | number | null;
  /** ISO 4217 (e.g. INR) when API returns it */
  currency?: string | null;
  commission_override?: number | string | null;
  /** Present on list/detail rows from production API */
  host_id?: string | null;
  is_featured?: boolean;
  created_at?: string;
  updated_at?: string | null;
  deleted_at?: string | null;
};

/**
 * Wire payload for POST /events — snake_case keys as sent to Circle API.
 * Aligns with host wizard and backend contract.
 */
export type CircleEventCreateBody = {
  title: string;
  description: string;
  max_capacity: number;
  /** Major currency units (e.g. 499 for ₹499) */
  price: number;
  event_date: string;
  location: string;
  timezone?: string;
  start_time?: string | null;
  end_time?: string | null;
  category?: string;
  tags?: string[];
  cover_image_url?: string | null;
  image_urls?: string[];
  contact_email?: string | null;
  contact_phone?: string | null;
  visibility?: string;
  waitlist_enabled?: boolean;
  min_age?: number;
  min_verification_tier?: number;
  terms_required?: boolean;
  refund_policy?: string;
  refund_full_before_hours?: number;
  refund_partial_before_hours?: number;
  refund_partial_percentage?: number;
  registration_opens_at?: string | null;
  registration_closes_at?: string | null;
  faqs?: { q: string; a: string }[];
  more_about?: string;
  whats_included?: string[];
  guest_suggestions?: string[];
  allowed_and_notes?: string;
  house_rules?: { dos: string[]; donts: string[] };
  event_rules?: string;
  location_type?: string;
  currency?: string;
  tax_percentage?: number;
  latitude?: number;
  longitude?: number;
};

/** Wire payload for PUT /events/:id — partial update */
export type CircleEventUpdateBody = Partial<CircleEventCreateBody>;

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

/** §9 — ticket detail */
export type CircleTicketEventSummary = {
  id?: string;
  title?: string;
  event_date?: string;
  location?: string;
};

export type CircleTicketAttendeeSummary = {
  id?: string;
  username?: string | null;
};

export type CircleTicketDetail = {
  ticket_id: string;
  qr_code_token?: string | null;
  event?: CircleTicketEventSummary;
  attendee?: CircleTicketAttendeeSummary;
  status: string;
  is_checked_in?: boolean;
  checked_in_at?: string | null;
};

export type CircleTicketQrData = {
  qr_code: string;
};

/** §9.3 public verify — same shape as detail subset */
export type CircleTicketVerifyPublic = {
  ticket_id: string;
  event?: CircleTicketEventSummary;
  attendee?: CircleTicketAttendeeSummary;
  status: string;
  is_checked_in?: boolean;
  checked_in_at?: string | null;
};

/** §11 */
export type CircleApiNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown> | null;
  is_read: boolean;
  is_email_sent?: boolean;
  created_at: string;
};

export type CircleUnreadCountData = {
  count: number;
};

/** §12 */
export type CircleReportTargetType = "user" | "host" | "event";

export type CircleSubmitReportBody = {
  target_type: CircleReportTargetType;
  target_id: string;
  event_id?: string;
  reason: string;
  description?: string;
};

export type CircleReportRow = {
  id: string;
  target_type: string;
  target_id: string;
  event_id?: string | null;
  reason?: string;
  description?: string | null;
  status?: string;
  created_at?: string;
};

/** §13 — blacklists */
export type CircleBlacklistRow = {
  id: string;
  user_id: string;
  event_id?: string | null;
  reason?: string | null;
  created_at?: string;
};

export type CircleCreateBlacklistBody = {
  user_id: string;
  event_id: string;
  reason: string;
};

/** §14 — media */
export type CircleMediaUploadUrlBody = {
  fileName: string;
  fileType?: string;
  contentType?: string;
  folder?: string;
};

export type CircleMediaUploadUrlData = {
  uploadUrl: string;
  publicUrl: string;
  fileKey: string;
  /** Backward-compat keys returned by older backend builds */
  fileUrl?: string;
  key?: string;
};

/** Send at least one of `key` or `fileKey`; `deleteMedia` duplicates to both for backend compatibility. */
export type CircleMediaDeleteBody = {
  key?: string;
  fileKey?: string;
};

/** §15 — settlements */
export type CircleSettlementRow = {
  id: string;
  event_id: string;
  total_collected?: string;
  total_refunded?: string;
  platform_fee?: string;
  net_amount?: string;
  status?: string;
  settled_at?: string | null;
};

/** §16 — admin */
export type CircleAdminDashboardStats = {
  totalUsers?: number;
  totalEvents?: number;
  totalApplications?: number;
  totalRevenue?: number;
  pendingSettlements?: number;
  totalSettled?: number;
  pendingReports?: number;
};

export type CircleAdminUserRow = {
  id: string;
  phone?: string;
  username?: string | null;
  email?: string | null;
  verification_tier?: number;
  is_globally_banned?: boolean;
};

export type CirclePresetQuestionAdmin = {
  id: string;
  question_text: string;
  question_type: string;
  options?: string[] | null;
  is_base?: boolean;
};

export type CirclePresetQuestionCreateBody = {
  question_text: string;
  question_type: string;
  options?: string[];
  is_base?: boolean;
};

export type CircleAdminReportReviewBody = {
  status: "reviewed" | "resolved" | "dismissed";
  admin_notes?: string;
};

export type CircleAuditLogRow = {
  id: string;
  actor_id?: string;
  action?: string;
  target_type?: string;
  target_id?: string;
  metadata?: Record<string, unknown>;
  ip_address?: string | null;
  created_at?: string;
};

/** Admin audit logs — `data` contains logs + meta */
export type CircleAdminAuditLogsData = {
  logs: CircleAuditLogRow[];
  meta: CircleListMeta;
};

/** Saved events list row — backend may return full event or id-only */
export type CircleSavedEventRow = CircleEvent | { id: string };

export type CircleToggleSavedData = {
  saved: boolean;
};

export type CircleNotificationPreferenceRow = {
  notification_type: string;
  email_enabled?: boolean;
  push_enabled?: boolean;
  in_app_enabled?: boolean;
};

export type CirclePaymentHistoryRow = {
  id: string;
  amount?: string | number;
  status?: string;
  created_at?: string;
  event_id?: string;
  application_id?: string;
  [key: string]: unknown;
};

export type CircleBookingSummaryData = {
  event?: {
    id?: string;
    title?: string;
    event_date?: string;
    location?: string;
    host?: { id?: string; username?: string | null; avatar_url?: string | null };
  };
  ticketPrice?: number;
  taxAmount?: number;
  subtotal?: number;
  total?: number;
  refundPolicyText?: string;
  currency?: string;
};

export type CircleHostProfile = {
  display_name?: string | null;
  bio?: string | null;
  category?: string | null;
  city?: string | null;
  social_instagram?: string | null;
  social_twitter?: string | null;
  social_youtube?: string | null;
  social_linkedin?: string | null;
  social_website?: string | null;
};

export type CircleHostOnboardingData = {
  currentStep?: number;
  completionPercentage?: number;
  missing?: string[];
  isComplete?: boolean;
};

export type CircleHostDashboardData = {
  totalEvents?: number;
  upcomingEvents?: number;
  completedEvents?: number;
  cancelledEvents?: number;
  totalRevenue?: number;
  totalRefunds?: number;
  netIncome?: number;
  pendingPayouts?: number;
  settledPayouts?: number;
  averageRating?: number;
  totalRatings?: number;
  unreadNotifications?: number;
};

export type CircleHostRevenuePoint = { date: string; revenue: number };

export type CircleRatingSubmitBody = {
  event_id: string;
  rating: number;
  comment?: string;
};

/** GET /ratings/host/:hostId/summary (public) */
export type CircleRatingHostSummary = {
  averageRating?: number;
  totalRatings?: number;
  distribution?: Record<string, number>;
};

export type CircleSupportTicket = {
  id: string;
  category?: string;
  subject?: string;
  description?: string;
  status?: string;
  priority?: string;
  created_at?: string;
  event_id?: string | null;
};

export type CircleSupportTicketCreateBody = {
  category: string;
  subject: string;
  description: string;
  event_id?: string;
  priority?: string;
};

export type CircleDisputeRow = {
  id: string;
  type?: string;
  status?: string;
  description?: string;
  respondent_id?: string;
  event_id?: string | null;
  created_at?: string;
};

export type CircleDisputeCreateBody = {
  respondent_id: string;
  type: string;
  description: string;
  event_id?: string;
  evidence_urls?: string[];
};

export type CirclePayoutAccount = {
  id: string;
  account_type?: string;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  account_holder_name?: string;
  upi_id?: string;
  is_primary?: boolean;
};

export type CirclePayoutAccountCreateBody = {
  account_type: "bank" | "upi" | "razorpay";
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  account_holder_name?: string;
  upi_id?: string;
};

/** Health (root `/health`, not under `/api`) */
export type CircleHealthData = {
  status: string;
  timestamp?: string;
};
