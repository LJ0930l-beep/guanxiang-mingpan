/**
 * Versioned whole-chart report: a readable, sectioned narrative assembled
 * from the saved payload's own facts at computation time.  The report rides
 * inside the payload snapshot, so a saved record always shows the report as
 * it was generated; upgrading rules produces a new chart, never a rewrite of
 * history.  Sections stay on the structural-tendency level of the 2026-09-08
 * charter and must avoid deterministic-event wording.
 */
export const CHART_REPORT_VERSION = 'chart-report-v1' as const;

export interface ChartReportSection {
  id: string;
  heading: string;
  paragraphs: string[];
}

export interface ChartReport {
  version: typeof CHART_REPORT_VERSION;
  title: string;
  summary: string;
  sections: ChartReportSection[];
}
