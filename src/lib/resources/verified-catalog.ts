/**
 * Verified public educational resources.
 * Official sources only. No invented titles, prices, or affiliations.
 * Last verification: 2026-11-16.
 */

export type CatalogItem = {
  id: string;
  title: string;
  provider: string;
  url: string;
  resource_type: "course" | "book" | "ebook" | "tutorial" | "documentation" | "video";
  subject: string;
  level: "beginner" | "intermediate" | "advanced" | "all";
  language: string;
  pricing_type:
    | "completely_free"
    | "free_with_conditions"
    | "free_audit"
    | "freemium"
    | "paid";
  has_certificate: boolean;
  description: string;
  verified_at: string;
};

export const VERIFIED_COURSES: CatalogItem[] = [
  {
    id: "ka-math",
    title: "Khan Academy — Mathematics",
    provider: "Khan Academy",
    url: "https://www.khanacademy.org/math",
    resource_type: "course",
    subject: "Mathematics",
    level: "all",
    language: "en",
    pricing_type: "completely_free",
    has_certificate: false,
    description:
      "Free math from arithmetic through calculus, with practice and videos.",
    verified_at: "2026-11-16",
  },
  {
    id: "fcc-responsive",
    title: "Responsive Web Design Certification",
    provider: "freeCodeCamp",
    url: "https://www.freecodecamp.org/learn/2022/responsive-web-design/",
    resource_type: "course",
    subject: "Programming",
    level: "beginner",
    language: "en",
    pricing_type: "completely_free",
    has_certificate: true,
    description:
      "Free HTML, CSS, and responsive design curriculum with projects and certification.",
    verified_at: "2026-11-16",
  },
  {
    id: "fcc-js",
    title: "JavaScript Algorithms and Data Structures",
    provider: "freeCodeCamp",
    url: "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures-v8/",
    resource_type: "course",
    subject: "Programming",
    level: "beginner",
    language: "en",
    pricing_type: "completely_free",
    has_certificate: true,
    description:
      "Free JavaScript fundamentals, algorithms, and data structures path.",
    verified_at: "2026-11-16",
  },
  {
    id: "mit-ocw-intro-cs",
    title: "Introduction to Computer Science and Programming in Python",
    provider: "MIT OpenCourseWare",
    url: "https://ocw.mit.edu/courses/6-0001-introduction-to-computer-science-and-programming-in-python-fall-2016/",
    resource_type: "course",
    subject: "Computer Science",
    level: "beginner",
    language: "en",
    pricing_type: "completely_free",
    has_certificate: false,
    description:
      "MIT OCW intro to CS using Python. Lectures, assignments, and exams freely available.",
    verified_at: "2026-11-16",
  },
  {
    id: "coursera-ml-audit",
    title: "Machine Learning (Andrew Ng)",
    provider: "Coursera / Stanford",
    url: "https://www.coursera.org/learn/machine-learning",
    resource_type: "course",
    subject: "AI and Machine Learning",
    level: "intermediate",
    language: "en",
    pricing_type: "free_audit",
    has_certificate: true,
    description:
      "Classic ML course. Audit for free; certificate requires payment. Verify current audit terms on Coursera.",
    verified_at: "2026-11-16",
  },
  {
    id: "edx-cs50",
    title: "CS50's Introduction to Computer Science",
    provider: "edX / Harvard",
    url: "https://www.edx.org/learn/computer-science/harvard-university-cs50-s-introduction-to-computer-science",
    resource_type: "course",
    subject: "Computer Science",
    level: "beginner",
    language: "en",
    pricing_type: "free_audit",
    has_certificate: true,
    description:
      "Harvard CS50. Free to audit; verified certificate is paid. Check edX for current terms.",
    verified_at: "2026-11-16",
  },
  {
    id: "swayam-portal",
    title: "SWAYAM — Government of India Online Courses",
    provider: "SWAYAM / MoE India",
    url: "https://swayam.gov.in/",
    resource_type: "course",
    subject: "Higher Education",
    level: "all",
    language: "en",
    pricing_type: "completely_free",
    has_certificate: true,
    description:
      "National platform for free higher-education courses from Indian universities and institutions.",
    verified_at: "2026-11-16",
  },
  {
    id: "nptel-portal",
    title: "NPTEL — IIT / IISc Online Courses",
    provider: "NPTEL",
    url: "https://nptel.ac.in/courses",
    resource_type: "course",
    subject: "Engineering",
    level: "all",
    language: "en",
    pricing_type: "completely_free",
    has_certificate: true,
    description:
      "Free courses from IITs and IISc. Certificate via optional paid exam. Search catalogue for current offerings.",
    verified_at: "2026-11-16",
  },
  {
    id: "ncert-textbooks",
    title: "NCERT Textbooks (School Education)",
    provider: "NCERT / India",
    url: "https://ncert.nic.in/textbook.php",
    resource_type: "course",
    subject: "School Education",
    level: "all",
    language: "en",
    pricing_type: "completely_free",
    has_certificate: false,
    description:
      "Official free digital textbooks for Indian school curriculum (Classes 1–12).",
    verified_at: "2026-11-16",
  },
  {
    id: "diksha-portal",
    title: "DIKSHA — Digital Infrastructure for Knowledge Sharing",
    provider: "DIKSHA / MoE India",
    url: "https://diksha.gov.in/",
    resource_type: "course",
    subject: "School Education",
    level: "all",
    language: "en",
    pricing_type: "completely_free",
    has_certificate: false,
    description:
      "National school platform: digital textbooks, videos, quizzes, multi-language resources.",
    verified_at: "2026-11-16",
  },
];

export const VERIFIED_BOOKS: CatalogItem[] = [
  {
    id: "think-python",
    title: "Think Python 2e",
    provider: "Green Tea Press / Allen B. Downey",
    url: "https://greenteapress.com/wp/think-python-2e/",
    resource_type: "ebook",
    subject: "Programming",
    level: "beginner",
    language: "en",
    pricing_type: "completely_free",
    has_certificate: false,
    description: "Free open textbook introducing Python. PDF and HTML from the author.",
    verified_at: "2026-11-16",
  },
  {
    id: "openstax-college-algebra",
    title: "College Algebra",
    provider: "OpenStax",
    url: "https://openstax.org/details/books/college-algebra-2e",
    resource_type: "ebook",
    subject: "Mathematics",
    level: "beginner",
    language: "en",
    pricing_type: "completely_free",
    has_certificate: false,
    description: "Peer-reviewed open textbook. Free PDF and web view.",
    verified_at: "2026-11-16",
  },
  {
    id: "openstax-physics",
    title: "University Physics Volume 1",
    provider: "OpenStax",
    url: "https://openstax.org/details/books/university-physics-volume-1",
    resource_type: "ebook",
    subject: "Physics",
    level: "intermediate",
    language: "en",
    pricing_type: "completely_free",
    has_certificate: false,
    description: "OpenStax university physics. Free digital access for calculus-based intro physics.",
    verified_at: "2026-11-16",
  },
  {
    id: "ncert-class12-physics",
    title: "NCERT Physics Class 12",
    provider: "NCERT",
    url: "https://ncert.nic.in/textbook.php?leph1=0-15",
    resource_type: "ebook",
    subject: "Physics",
    level: "intermediate",
    language: "en",
    pricing_type: "completely_free",
    has_certificate: false,
    description: "Official NCERT Class 12 Physics textbooks, free digital download.",
    verified_at: "2026-11-16",
  },
  {
    id: "dive-into-deep-learning",
    title: "Dive into Deep Learning",
    provider: "d2l.ai",
    url: "https://d2l.ai/",
    resource_type: "ebook",
    subject: "AI and Machine Learning",
    level: "intermediate",
    language: "en",
    pricing_type: "completely_free",
    has_certificate: false,
    description: "Interactive open book on deep learning with code. Free online.",
    verified_at: "2026-11-16",
  },
  {
    id: "python-data-science-handbook",
    title: "Python Data Science Handbook",
    provider: "Jake VanderPlas",
    url: "https://jakevdp.github.io/PythonDataScienceHandbook/",
    resource_type: "ebook",
    subject: "Data Science",
    level: "intermediate",
    language: "en",
    pricing_type: "completely_free",
    has_certificate: false,
    description: "Free online edition covering NumPy, Pandas, Matplotlib, Scikit-Learn.",
    verified_at: "2026-11-16",
  },
];

export function getCatalogCourses(filters?: {
  subject?: string;
  level?: string;
  pricing?: string;
  q?: string;
}): CatalogItem[] {
  let items = [...VERIFIED_COURSES];
  if (filters?.subject) {
    const s = filters.subject.toLowerCase();
    items = items.filter((i) => i.subject.toLowerCase().includes(s));
  }
  if (filters?.level && filters.level !== "all") {
    items = items.filter((i) => i.level === filters.level || i.level === "all");
  }
  if (filters?.pricing) {
    items = items.filter((i) => i.pricing_type === filters.pricing);
  }
  if (filters?.q) {
    const q = filters.q.toLowerCase();
    items = items.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.provider.toLowerCase().includes(q) ||
        i.subject.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q)
    );
  }
  return items;
}

export function getCatalogBooks(filters?: {
  subject?: string;
  level?: string;
  pricing?: string;
  q?: string;
}): CatalogItem[] {
  let items = [...VERIFIED_BOOKS];
  if (filters?.subject) {
    const s = filters.subject.toLowerCase();
    items = items.filter((i) => i.subject.toLowerCase().includes(s));
  }
  if (filters?.level && filters.level !== "all") {
    items = items.filter((i) => i.level === filters.level || i.level === "all");
  }
  if (filters?.pricing) {
    items = items.filter((i) => i.pricing_type === filters.pricing);
  }
  if (filters?.q) {
    const q = filters.q.toLowerCase();
    items = items.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.provider.toLowerCase().includes(q) ||
        i.subject.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q)
    );
  }
  return items;
}
