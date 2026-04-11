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
