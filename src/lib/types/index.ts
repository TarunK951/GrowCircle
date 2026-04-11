export type City = {
  id: string;
  name: string;
  slug: string;
};

export type MeetEvent = {
  id: string;
  title: string;
  description: string;
  cityId: string;
  startsAt: string;
  hostUserId: string;
  capacity: number;
  category: string;
  image: string;
  priceCents: number;
  venueName?: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  cityId: string;
  interests: string[];
  verified: boolean;
};

export type Booking = {
  id: string;
  userId: string;
  eventId: string;
  status: "confirmed" | "pending" | "cancelled";
  createdAt: string;
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
