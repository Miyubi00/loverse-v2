export interface ShowcaseTemplate {
  slug: string;
  name: string;
  category: "Basic" | "RSVP";
  image: string;
  imageSrcSet: string;
}

const previewImage = (slug: string) => ({
  image: `/previews/${slug}.webp`,
  imageSrcSet: `/previews/${slug}-240.webp 240w, /previews/${slug}-400.webp 400w, /previews/${slug}.webp 512w`,
});

export const SHOWCASE_TEMPLATES: ShowcaseTemplate[] = [
  {
    slug: "rustic-floral",
    name: "Rustic Floral",
    category: "Basic",
    ...previewImage("rustic-floral"),
  },
  {
    slug: "modern-dark",
    name: "Modern Dark",
    category: "Basic",
    ...previewImage("modern-dark"),
  },
  {
    slug: "motion-flow",
    name: "Motion Flow",
    category: "RSVP",
    ...previewImage("motion-flow"),
  },
  {
    slug: "sakura-breeze",
    name: "Sakura Breeze",
    category: "RSVP",
    ...previewImage("sakura-breeze"),
  },
  {
    slug: "emerald-royale",
    name: "Emerald Royale",
    category: "RSVP",
    ...previewImage("emerald-royale"),
  },
];
