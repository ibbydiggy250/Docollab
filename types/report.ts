import type { Contributor } from "./contributor";

export interface Report {
  id: string;
  user_id: string;
  doc_title: string;
  doc_url: string;
  google_doc_id: string;
  total_revisions: number;
  total_collaborators: number;
  overall_summary: string | null;
  created_at: string;
  contributors?: Contributor[];
}
