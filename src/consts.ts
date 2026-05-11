import type { Site, Metadata, Socials } from "@types";

export const SITE: Site = {
  NAME: "Alex Rivera",
  EMAIL: "hello@example.com",
  NUM_POSTS_ON_HOMEPAGE: 3,
  NUM_WORKS_ON_HOMEPAGE: 2,
  NUM_PROJECTS_ON_HOMEPAGE: 3,
};

export const HOME: Metadata = {
  TITLE: "Software Engineer",
  DESCRIPTION: "Personal site of Alex Rivera: software engineer, designer, and tinkerer.",
};

export const BLOG: Metadata = {
  TITLE: "Blog",
  DESCRIPTION: "Essays and notes on engineering, design, and the work behind the work.",
};

export const WORK: Metadata = {
  TITLE: "Work",
  DESCRIPTION: "Selected professional experience.",
};

export const PROJECTS: Metadata = {
  TITLE: "Projects",
  DESCRIPTION: "A selection of experiments, tools, and small product ideas.",
};

export const SOCIALS: Socials = [
  { 
    NAME: "GitHub",
    HREF: "https://github.com/choijin",
  },
  { 
    NAME: "LinkedIn",
    HREF: "https://www.linkedin.com/in/jinchoi300/",
  }
];
