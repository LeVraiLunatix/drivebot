import type { SVGProps } from "react";

const base = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

type P = SVGProps<SVGSVGElement>;

export const IconHome = (p: P) => (
  <svg {...base} {...p}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></svg>
);
export const IconSettings = (p: P) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 7 19.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 5 13.6H4.9a2 2 0 1 1 0-4H5a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 12 4.6V4a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9" /></svg>
);
export const IconWave = (p: P) => (
  <svg {...base} {...p}><path d="M3 12h4l2-6 4 12 2-6h6" /></svg>
);
export const IconMessage = (p: P) => (
  <svg {...base} {...p}><path d="M4 5h16v11H8l-4 4z" /><path d="M8 9h8M8 12h5" /></svg>
);
export const IconShield = (p: P) => (
  <svg {...base} {...p}><path d="M12 3l7 3v5c0 4.4-3 8.3-7 9.5C8 19.3 5 15.4 5 11V6z" /><path d="m9 12 2 2 4-4" /></svg>
);
export const IconLogout = (p: P) => (
  <svg {...base} {...p}><path d="M15 12H4" /><path d="m11 8-4 4 4 4" /><path d="M9 4h9a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H9" /></svg>
);
export const IconUsers = (p: P) => (
  <svg {...base} {...p}><circle cx="9" cy="8" r="3.2" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M16 5.5a3 3 0 0 1 0 5.8" /><path d="M18 20a6 6 0 0 0-3-5.2" /></svg>
);
export const IconHash = (p: P) => (
  <svg {...base} {...p}><path d="M5 9h14M4 15h14M10 4 8 20M16 4l-2 16" /></svg>
);
export const IconTag = (p: P) => (
  <svg {...base} {...p}><path d="M3 12V4h8l9 9-8 8z" /><circle cx="7.5" cy="7.5" r="1.3" /></svg>
);
export const IconBolt = (p: P) => (
  <svg {...base} {...p}><path d="M13 2 4 14h6l-1 8 9-12h-6z" /></svg>
);
export const IconCheck = (p: P) => (
  <svg {...base} {...p}><path d="m5 12 5 5 9-11" /></svg>
);
export const IconArrowLeft = (p: P) => (
  <svg {...base} {...p}><path d="M15 6l-6 6 6 6" /></svg>
);
export const IconSend = (p: P) => (
  <svg {...base} {...p}><path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4z" /></svg>
);
export const IconTrash = (p: P) => (
  <svg {...base} {...p}><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" /></svg>
);
export const IconTicket = (p: P) => (
  <svg {...base} {...p}><path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1-2 2H5a2 2 0 0 1-2-2 2 2 0 0 0 0-4z" /><path d="M13 6v12" strokeDasharray="2 2" /></svg>
);
export const IconVerified = (p: P) => (
  <svg {...base} {...p}><path d="M12 3l2.3 1.6 2.8.1 1 2.6 2.3 1.7-.7 2.7.7 2.7-2.3 1.7-1 2.6-2.8.1L12 21l-2.3-1.6-2.8-.1-1-2.6L3.6 15l.7-2.7-.7-2.7 2.3-1.7 1-2.6 2.8-.1z" /><path d="m9 12 2 2 4-4" /></svg>
);
