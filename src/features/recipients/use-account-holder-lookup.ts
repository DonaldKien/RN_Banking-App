import { DEBOUNCE_MS } from "@/constants/debounce";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

import { toLookupRequest } from "./new-recipient-form";
import { useAccountLookup } from "./queries";

export interface AccountHolderLookup {
  isChecking: boolean;
  verifiedName: string | null;
  error: unknown;
  retry: () => void;
}

/** Asks the bank who owns the account once the details are complete and typing stops. */
export const useAccountHolderLookup = (formValues: unknown): AccountHolderLookup => {
  const request = toLookupRequest(formValues);

  // Debounce a string key: `request` is a new object on every render.
  const requestKey = request ? JSON.stringify(request) : null;
  const debouncedKey = useDebouncedValue(requestKey, DEBOUNCE_MS.accountLookup);
  const hasStoppedTyping = debouncedKey === requestKey;

  const lookup = useAccountLookup(hasStoppedTyping ? request : null);

  const hasRequest = request !== null;
  const isWaitingForTyping = hasRequest && !hasStoppedTyping;

  return {
    isChecking: isWaitingForTyping || (hasRequest && lookup.isFetching),
    verifiedName: hasRequest && hasStoppedTyping && lookup.isSuccess ? lookup.data.name : null,
    error: hasRequest && hasStoppedTyping && lookup.isError ? lookup.error : null,
    retry: () => {
      void lookup.refetch();
    },
  };
};
