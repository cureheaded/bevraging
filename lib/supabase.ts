import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error(
    "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
}

export const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export type Employee = {
  id: string;
  name: string;
  email: string;
  login_code: string;
  mail_sent_at: string | null;
  created_at: string;
};

export type ResponseRow = {
  id: string;
  login_code: string;
  answers: SurveyAnswers;
  submitted_at: string;
  updated_at: string;
};

export type SurveyAnswers = {
  floorPreference: string[];
  floorMustAvoid: string[];
  scheduleStyle: "long_stretch" | "short_stretch" | "no_preference" | "other";
  scheduleStyleOther?: string;
  shiftPreference: "early" | "late" | "mix" | "no_preference";
  weekendsPerMonth: "as_few_as_possible" | "no_preference" | "extra_ok";
  comments?: string;
};
