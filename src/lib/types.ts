export type SocialLink = { label: string; url: string };

export type PublicSessionSpeaker = {
  name: string;
  slug: string;
  role: string;
};

export type PublicSession = {
  id: string;
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  room: string;
  category: string;
  isBreak: boolean;
  isSample: boolean;
  speakers: PublicSessionSpeaker[];
};

export type FormState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
};

export type AdminIdentity = {
  id: string;
  email: string;
  name: string;
  role: "OWNER" | "ADMIN" | "EDITOR";
};
