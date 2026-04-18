const DOC_ID_PATTERN = /^[a-zA-Z0-9_-]{20,}$/;

export function extractGoogleDocId(input: string): string {
  const value = input.trim();

  if (DOC_ID_PATTERN.test(value)) {
    return value;
  }

  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error("Enter a valid Google Docs URL.");
  }

  if (!url.hostname.endsWith("docs.google.com")) {
    throw new Error("Enter a Google Docs URL.");
  }

  const match = url.pathname.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);

  if (!match?.[1]) {
    throw new Error("Could not find a Google Doc ID in that URL.");
  }

  return match[1];
}
