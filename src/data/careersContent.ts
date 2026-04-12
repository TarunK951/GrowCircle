import type { CareersContent } from "@/lib/types";

export const careersContent: CareersContent = {
  hero: {
    eyebrow: "Careers",
    title: "Build better offline social experiences.",
    lead: "Grow Circle helps people discover meaningful in-person connection. Join us to shape the product and the community.",
    ctaLabel: "View open roles",
  },
  mission: {
    title: "Mission",
    heading: "Design technology that gets people out into the real world.",
    body: "We build calm, trustworthy tools that make it easier to host and join local meets. Every release should improve real-life outcomes for our members.",
  },
  testimonials: [
    {
      id: "t1",
      name: "Aarav",
      role: "Product Designer",
      location: "Bengaluru",
      quote: "The team cares about craft and impact equally. We ship quickly, but we never compromise on the member experience.",
    },
    {
      id: "t2",
      name: "Maya",
      role: "Community Ops",
      location: "Mumbai",
      quote: "I love that our work translates directly to people meeting new friends and collaborators in their city.",
    },
  ],
  valuesSectionTitle: "Values",
  valuesHeading: "How we work",
  values: [
    {
      id: "v1",
      title: "Member first",
      body: "Prioritize safety, clarity, and trust in every workflow.",
    },
    {
      id: "v2",
      title: "Bias for shipping",
      body: "Deliver improvements in small iterations and learn from real usage.",
    },
    {
      id: "v3",
      title: "Own outcomes",
      body: "Take responsibility for results, not just output.",
    },
  ],
  growthSectionTitle: "Growth",
  stats: [
    { id: "s1", value: "40+", label: "Cities", hint: "Active discovery and hosting" },
    { id: "s2", value: "12K+", label: "Monthly users", hint: "Across app experiences" },
    { id: "s3", value: "4.8", label: "Host rating", hint: "Average member feedback" },
  ],
  perksTitle: "Benefits",
  perks: [
    "Hybrid collaboration and flexible hours",
    "Learning budget for courses and events",
    "Health coverage and mental wellness support",
  ],
  openPositionsTitle: "Open roles",
  jobs: [
    {
      id: "j1",
      title: "Frontend Engineer",
      team: "Product Engineering",
      location: "Remote / India",
      type: "Full-time",
      href: "/contact",
    },
    {
      id: "j2",
      title: "Community Success Lead",
      team: "Operations",
      location: "Mumbai",
      type: "Full-time",
      href: "/contact",
    },
  ],
  social: {
    title: "Say hello",
    body: "If you do not see a matching role, reach out with your profile and the problem you want to solve.",
    linkLabel: "Contact the team",
    href: "/contact",
  },
  lifeGallery: {
    title: "Life at Grow Circle",
    subtitle: "Small team, big ownership, human-centered culture.",
    items: [
      { id: "l1", label: "Weekly demos" },
      { id: "l2", label: "User research sessions" },
      { id: "l3", label: "Cross-team planning" },
      { id: "l4", label: "Community host workshops" },
    ],
  },
};
