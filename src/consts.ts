import type { Site, Metadata, Socials } from "@types";

export const SITE: Site = {
  NAME: "Jin Choi",
  EMAIL: "jinchoi595@gmail.com",
  NUM_POSTS_ON_HOMEPAGE: 3,
  NUM_WORKS_ON_HOMEPAGE: 1,
  NUM_PROJECTS_ON_HOMEPAGE: 3,
};

export const HOME: Metadata = {
  TITLE: "Jin Choi",
  DESCRIPTION: "Personal site of Jin Choi: data scientist focused on machine learning, underwriting models, and practical analytics systems.",
};

export const BLOG: Metadata = {
  TITLE: "Blog",
  DESCRIPTION: "Notes on machine learning, analytics, and projects I am learning from.",
};

export const WORK: Metadata = {
  TITLE: "Work",
  DESCRIPTION: "Selected data science, analytics, and operations experience.",
};

export const PROJECTS: Metadata = {
  TITLE: "Projects",
  DESCRIPTION: "Selected machine learning and analytics projects.",
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
