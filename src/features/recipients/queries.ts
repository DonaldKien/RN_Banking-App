import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import { getRecentRecipients, getSavedRecipients } from "@/services/api/bank-api";
import type { Recipient } from "@/services/api/types";

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

