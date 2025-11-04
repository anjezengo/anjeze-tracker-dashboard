/**
 * Supabase client configuration
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type definitions for our tables
export type TrackerRow = {
  id: number;
  sr_no: string | null;
  year: string | null;
  date: string | null;
  project: string | null;
  sub_project: string | null;
  institute: string | null;
  type_of_institution: string | null;
  quantity: string | null;
  no_of_beneficiaries: string | null;
  amount: string | null;
  remarks: string | null;
  project_canon: string | null;
  sub_project_canon: string | null;
  institute_canon: string | null;
  type_of_institution_canon: string | null;
  remarks_canon: string | null;
  year_start: number | null;
  year_end: number | null;
  year_label: string | null;
  date_iso: string | null;
  quantity_num: number | null;
  no_of_beneficiaries_num: number | null;
  amount_num: number | null;
  created_at: string;
};

export type FactsCleanRow = {
  id: number;
  sr_no: string | null;
  project: string | null;
  sub_project: string | null;
  institute: string | null;
  type_of_institution: string | null;
  remarks: string | null;
  year_start: number | null;
  year_end: number | null;
  year_label: string | null;
  date: string | null;
  quantity: number | null;
  beneficiaries: number | null;
  amount: number | null;
  created_at: string;
};

export type AssetRow = {
  sub_project_canon: string;
  image_url: string | null;
  description: string | null;
  created_at: string;
};
