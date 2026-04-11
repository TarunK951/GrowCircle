/** Sidebar social platforms: stable ids for persisted “linked” state (demo). */
export type SocialPlatform = {
  id: string;
  label: string;
  href: string;
};

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  { id: "linkedin", label: "LinkedIn", href: "https://www.linkedin.com/" },
  { id: "instagram", label: "Instagram", href: "https://www.instagram.com/" },
  { id: "youtube", label: "YouTube", href: "https://www.youtube.com/" },
  { id: "x", label: "X", href: "https://x.com/" },
  { id: "discord", label: "Discord", href: "https://discord.com/" },
  { id: "whatsapp", label: "WhatsApp", href: "https://www.whatsapp.com/" },
  { id: "telegram", label: "Telegram", href: "https://telegram.org/" },
];

/** @deprecated use SOCIAL_PLATFORMS */
export const SOCIAL_LINKS = SOCIAL_PLATFORMS.map(({ label, href }) => ({
  label,
  href,
}));

export function emptySocialConnections(): Record<string, boolean> {
  return Object.fromEntries(SOCIAL_PLATFORMS.map((p) => [p.id, false]));
}
