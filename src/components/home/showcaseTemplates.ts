export interface ShowcaseTemplate {
  slug: string;
  name: string;
  category: "Basic" | "RSVP";
  image: string;
}

export const SHOWCASE_TEMPLATES: ShowcaseTemplate[] = [
  {
    slug: "rustic-floral",
    name: "Rustic Floral",
    category: "Basic",
    image: "/previews/rustic-floral.webp",
  },
  {
    slug: "modern-dark",
    name: "Modern Dark",
    category: "Basic",
    image: "/previews/modern-dark.webp",
  },
  {
    slug: "motion-flow",
    name: "Motion Flow",
    category: "RSVP",
    image: "/previews/motion-flow.webp",
  },
  {
    slug: "sakura-breeze",
    name: "Sakura Breeze",
    category: "RSVP",
    image: "/previews/sakura-breeze.webp",
  },
  {
    slug: "emerald-royale",
    name: "Emerald Royale",
    category: "RSVP",
    image: "/previews/emerald-royale.webp",
  },
];
