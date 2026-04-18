export const GOOGLE_AUTH_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/drive.metadata.readonly",
  "https://www.googleapis.com/auth/drive.activity.readonly",
  "https://www.googleapis.com/auth/documents.readonly"
];

export const GOOGLE_AUTH_SCOPE_PARAM = GOOGLE_AUTH_SCOPES.join(" ");
