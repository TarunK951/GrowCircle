export type City = {
  id: string;
  name: string;
  slug: string;
};

export type EventFaq = {
  q: string;
  a: string;
};

export type PreJoinQuestion = {
  id: string;
  prompt: string;
  options: string[];
};

export type MeetEvent = {
  id: string;
  title: string;
  description: string;
  cityId: string;
  /** When set (e.g. API-backed), shown in cards instead of city name lookup. */
  displayLocation?: string;
  startsAt: string;
  hostUserId: string;
  capacity: number;
  /** Legacy single label; keep for seed data. Prefer `categories` when set. */
  category: string;
  /** Up to 3 labels for display and explore filters. */
  categories?: string[];
  image: string;
  priceCents: number;
  venueName?: string;
  /** Street / full address shown with venue. */
  addressLine?: string;
  /** Instant join vs request-to-join (host approves). */
  joinMode?: "open" | "invite";
  /** Listed on explore vs link-only. */
  listingVisibility?: "public" | "private";
  /** Optional share token for host/private links (mock). */
  shareToken?: string;
  /** Booked spots (mock). Used with `capacity` to show availability. */
  spotsTaken?: number;
  /** Longer narrative shown above the image block. */
  moreAbout?: string;
  whatsIncluded?: string[];
  /** What to bring, what’s allowed on site, accessibility, etc. */
  allowedAndNotes?: string;
  houseRules?: {
    dos: string[];
    donts: string[];
  };
  faqs?: EventFaq[];
  /** Shown before “What’s allowed”; short guest tips. */
  guestSuggestions?: string[];
  /** Max 5; each needs ≥2 options for join-time radios. */
  preJoinQuestions?: PreJoinQuestion[];
  /** Host soft-cancelled; meet stays in history but is hidden from Explore. */
  cancelledAt?: string;
  /** Backend slug when synced from Circle API */
  slug?: string;
  /** When set (e.g. Circle API `host.username`), shown on cards instead of seed lookup */
  hostUsername?: string | null;
};

export type User = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  cityId: string;
  interests: string[];
  verified: boolean;
  /** Set when logged in via Circle API — required for paid event applications. */
  isProfileComplete?: boolean;
};

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "attended";

export type Booking = {
  id: string;
  userId: string;
  eventId: string;
  status: BookingStatus;
  createdAt: string;
  /** Pre-join questionnaire answers (question id → selected option). */
  preJoinAnswers?: Record<string, string>;
  /** Set when status is confirmed or attended; host verifies at door. */
  attendanceCode?: string;
  attendedAt?: string;
  cancelledAt?: string;
  refundedAt?: string;
};

export type ChatMessage = {
  id: string;
  threadId: string;
  senderId: string;
  body: string;
  sentAt: string;
};

export type ChatThread = {
  id: string;
  title: string;
  participantIds: string[];
  messages: ChatMessage[];
};

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
};

export type CareersTestimonial = {
  id: string;
  name: string;
  role: string;
  location: string;
  quote: string;
};

export type CareersValue = {
  id: string;
  title: string;
  body: string;
};

export type CareersStat = {
  id: string;
  value: string;
  label: string;
  hint: string;
};

export type CareersJob = {
  id: string;
  title: string;
  team: string;
  location: string;
  type: string;
  href: string;
};

export type CareersLifeItem = {
  id: string;
  label: string;
};

export type CareersContent = {
  hero: {
    eyebrow: string;
    title: string;
    lead: string;
    ctaLabel: string;
  };
  mission: {
    title: string;
    heading: string;
    body: string;
  };
  testimonials: CareersTestimonial[];
  valuesSectionTitle: string;
  valuesHeading: string;
  values: CareersValue[];
  growthSectionTitle: string;
  stats: CareersStat[];
  perksTitle: string;
  perks: string[];
  openPositionsTitle: string;
  jobs: CareersJob[];
  social: {
    title: string;
    body: string;
    linkLabel: string;
    href: string;
  };
  lifeGallery: {
    title: string;
    subtitle: string;
    items: CareersLifeItem[];
  };
};

/** Local-only reviews (persisted in the browser). */
export type GuestReviewWritten = {
  id: string;
  createdAt: string;
  guestName: string;
  eventTitle: string;
  /** 1–5 */
  rating: number;
  comment: string;
};

/** Review you left as an attendee — only allowed for bookings marked `attended`. */
export type AttendeeMeetReview = {
  id: string;
  createdAt: string;
  bookingId: string;
  eventId: string;
  eventTitle: string;
  /** 1–5 */
  rating: number;
  comment: string;
};

export type HostReviewReceived = {
  id: string;
  createdAt: string;
  reviewerName: string;
  eventTitle: string;
  rating: number;
  comment: string;
};
