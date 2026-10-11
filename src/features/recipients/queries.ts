import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import { getRecentRecipients, getSavedRecipients, lookupAccount } from "@/services/api/bank-api";
import type { AccountLookupRequest, AccountLookupResult, Recipient } from "@/services/api/types";

// Return types are written out so TypeScript doesn't have to infer them through
// the whole API/HTTP chain (which VS Code can mistake for a circular reference).

export const useSavedRecipients = (): UseQueryResult<Recipient[]> => {
  return useQuery({
    queryKey: queryKeys.recipients.saved,
    queryFn: getSavedRecipients,
    staleTime: 5 * 60_000,
  });
};

export const useRecentRecipients = (): UseQueryResult<Recipient[]> => {
  return useQuery({ queryKey: queryKeys.recipients.recent, queryFn: () => getRecentRecipients(10) });
};

/**
 * Name enquiry for a manually entered recipient. Disabled until the input is
 * well-formed; results are cached so re-typing the same number is instant.
 */
export const useAccountLookup = (request: AccountLookupRequest | null): UseQueryResult<AccountLookupResult> => {
  return useQuery({
    queryKey: queryKeys.recipients.lookup(request ?? { type: "BANK_ACCOUNT", accountId: "" }),
    queryFn: () => lookupAccount(request!),
    enabled: request !== null,
    staleTime: 10 * 60_000,
    retry: false,
  });
};
