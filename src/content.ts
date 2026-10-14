import {
  Target,
  PanelsTopLeft,
  Bot,
  MessagesSquare,
  CalendarCheck,
  DatabaseZap,
  BellRing,
  Megaphone,
  UserCheck,
  type LucideIcon,
} from "lucide-react";

/** Source copy lives here (from "Franchise Engine - All Content.docx"). */

export const CTA = "Build Your Franchise Engine";

export const NAV_LINKS = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "What You Get", href: "#features" },
  { label: "Watch", href: "#video" },
];

export type Feature = { title: string; text: string; icon: LucideIcon };

export const FEATURES: Feature[] = [
  {
    title: "Targeted Franchise Advertising",
    text: "Reach your ideal franchise prospects through tailored campaigns across Meta and LinkedIn.",
    icon: Target,
  },
  {
    title: "Dynamic Landing Pages",
    text: "Give every interested prospect a focused, brand-specific experience built to drive action.",
    icon: PanelsTopLeft,
  },
  {
    title: "AI Assistant, Lily",
    text: "Lily engages prospects instantly, answers franchise questions, and builds confidence around your opportunity.",
    icon: Bot,
  },
  {
    title: "Intelligent Prospect Engagement",
    text: "Keep conversations moving with immediate, informed responses, even when your team isn't available.",
    icon: MessagesSquare,
  },
  {
    title: "Automated Meeting Booking",
    text: "When a prospect is ready, Lily guides them to book a meeting with your team.",
    icon: CalendarCheck,
  },
  {
    title: "Real-Time CRM Updates",
    text: "Once a meeting is booked, prospect information and relevant details are automatically added to your CRM.",
    icon: DatabaseZap,
  },
  {
    title: "Automated Lead Nurturing",
    text: "Lily sends three timely reminders before the meeting, each providing useful information and keeping the prospect engaged.",
    icon: BellRing,
  },
];

export const STEPS = [
  { tag: "AD", icon: Megaphone, title: "Reach the Right Prospects", text: "Target your ideal franchise profile across Meta and LinkedIn." },
  { tag: "LANDING PAGE", icon: PanelsTopLeft, title: "Capture Their Interest", text: "Send prospects to a dynamic page built around your franchise opportunity." },
  { tag: "LILY", icon: Bot, title: "Start the Conversation", text: "Lily instantly engages prospects and answers their franchise questions." },
  { tag: "QUALIFY", icon: UserCheck, title: "Understand Their Intent", text: "Lily learns about the prospect and helps move genuine interest forward." },
  { tag: "BOOKED CALL", icon: CalendarCheck, title: "Turn Interest Into Action", text: "Prospects select a convenient time and book a meeting with your team." },
  { tag: "CRM", icon: DatabaseZap, title: "Keep Your Team Informed", text: "Prospect details and conversation data are automatically updated in your CRM." },
  { tag: "NURTURE", icon: BellRing, title: "Stay Connected Until the Meeting", text: "Three timely reminders keep prospects informed, engaged, and prepared." },
] as const;

/** Fictional sample conversations, used only to demonstrate the Lily UI. */
export type Scenario = {
  chip: string;
  question: string;
  answer: string;
  qualify: string;
  reply: string;
};

export const SCENARIOS: Scenario[] = [
  {
    chip: "What does the franchise process look like?",
    question: "What does the franchise process look like?",
    answer:
      "Happy to walk you through it. In short: you learn about the opportunity, get your questions answered, then speak with the franchise team about fit and next steps.",
    qualify: "To point you in the right direction, which best describes you?",
    reply: "I’m exploring my first franchise.",
  },
  {
    chip: "What support do franchisees receive?",
    question: "What kind of support do franchisees receive?",
    answer:
      "Support depends on the franchise brand, so the team is best placed to speak to specifics. I can answer general questions here and connect you with them for the details.",
    qualify: "Are you looking at a single location, or more than one?",
    reply: "Possibly more than one.",
  },
  {
    chip: "Can I speak with someone on the team?",
    question: "I’d like to speak with someone on the team.",
    answer: "Of course, I can help with that right now.",
    qualify: "When are you hoping to get started?",
    reply: "Within the next few months.",
  },
];
