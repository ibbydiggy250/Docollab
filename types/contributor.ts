export interface ContributorAnalysis {
  contributor_name: string;
  contributor_email?: string;
  contribution_percent: number;
  originality_score: number;
  significance_score: number;
  writing_quality_score: number;
  summary: string;
  raw_text_added: string;
}

export interface Contributor extends ContributorAnalysis {
  id: string;
  report_id: string;
  created_at: string;
}
