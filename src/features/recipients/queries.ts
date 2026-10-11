import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import { getRecentRecipients, getSavedRecipients, lookupAccount } from "@/services/api/bank-api";
import type { AccountLookupRequest, AccountLookupResult, Recipient } from "@/services/api/types";

// Explicit return types: inferring through the API chain makes VS Code report a false cycle.

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

export const useAccountLookup = (request: AccountLookupRequest | null): UseQueryResult<AccountLookupResult> => {
  return useQuery({
    queryKey: queryKeys.recipients.lookup(request ?? { type: "BANK_ACCOUNT", accountId: "" }),
    queryFn: () => lookupAccount(request!),
    enabled: request !== null,
    staleTime: 10 * 60_000,
    retry: false,
  });
};
