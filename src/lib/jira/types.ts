export interface JiraIssue {
  readonly key: string;
  readonly summary: string;
  readonly url: string;
  readonly status?: string;
  readonly issueType?: string;
}

export interface JiraConnection {
  readonly id: string;
  readonly teamId: string;
  readonly cloudId: string;
  readonly siteUrl: string;
  readonly siteName: string;
  readonly connectedBy: string;
  readonly connectedAt: string;
}

export interface JiraSearchResult {
  readonly issues: ReadonlyArray<JiraIssue>;
}
