import { normaliseSearchText } from "@/lib/format";
import type { Recipient } from "@/services/api/types";

export type RecipientListRow =
  | { type: "header"; key: string; label: string }
  | { type: "recipient"; key: string; recipient: Recipient };

const RECENT_LIMIT = 5;

const identity = (recipient: Recipient): string => {
  return `${recipient.type}:${recipient.accountId}`;
};

export const matchesRecipient = (recipient: Recipient, query: string): boolean => {
  if (!query) return true;
  if (normaliseSearchText(recipient.name).includes(query)) return true;
  const digits = query.replace(/\D/g, "");
  return digits.length >= 3 && recipient.accountId.includes(digits);
};

/** Sectioned rows; a search collapses them into one de-duplicated result list. */
export const buildRecipientRows = (
  saved: readonly Recipient[],
  recent: readonly Recipient[],
  query: string,
): { rows: RecipientListRow[]; stickyHeaderIndices: number[] } => {
  const rows: RecipientListRow[] = [];
  const stickyHeaderIndices: number[] = [];

  const addSection = (id: string, label: string, recipients: readonly Recipient[]) => {
    if (recipients.length === 0) return;
    stickyHeaderIndices.push(rows.length);
    rows.push({ type: "header", key: `header:${id}`, label });
    for (const recipient of recipients) {
      rows.push({ type: "recipient", key: `${id}:${recipient.id}`, recipient });
    }
  };

  if (query) {
    const seen = new Set<string>();
    const results = [...recent, ...saved].filter((recipient) => {
      const key = identity(recipient);
      if (seen.has(key) || !matchesRecipient(recipient, query)) return false;
      seen.add(key);
      return true;
    });
    addSection("results", `${results.length} result${results.length === 1 ? "" : "s"}`, results);
    return { rows, stickyHeaderIndices };
  }

  addSection("recent", "Recent", recent.slice(0, RECENT_LIMIT));
  addSection("favourites", "Favourites", saved.filter((r) => r.isFavourite));
  addSection("all", "All recipients", saved);
  return { rows, stickyHeaderIndices };
};
