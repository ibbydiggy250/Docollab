import { z } from "zod";

export const googleDocUrlSchema = z
  .string()
  .trim()
  .min(1, "Paste a Google Docs URL to analyze.")
  .url("Enter a valid URL.")
  .refine((value) => {
    try {
      const url = new URL(value);
      return url.hostname.endsWith("docs.google.com") && url.pathname.includes("/document/d/");
    } catch {
      return false;
    }
  }, "Enter a valid Google Docs document URL.");
