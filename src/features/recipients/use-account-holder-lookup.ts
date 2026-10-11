import { DEBOUNCE_MS } from "@/constants/debounce";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

import { toLookupRequest } from "./new-recipient-form";
import { useAccountLookup } from "./queries";

export interface AccountHolderLookup {
  /** True while waiting for typing to stop, or while asking the bank. */
  isChecking: boolean;
  /** The account holder's registered name, once the bank has confirmed it. */
  verifiedName: string | null;
  /** Why the check failed (e.g. account not found), if it did. */
  error: unknown;
  /** Ask the bank again after a failure. */
  retry: () => void;
}

/**
 * Name enquiry for the new-recipient form: as soon as the entered details are
 * complete and the user has stopped typing, asks the bank who owns the
 * account, so the user can check they're paying the right person.
 *
 * @param formValues The form's current values (can be incomplete).
 */
export const useAccountHolderLookup = (formValues: unknown): AccountHolderLookup => {
  // 1. Only complete, valid details can be checked.
  const request = toLookupRequest(formValues);

  // 2. Wait until typing stops. We debounce a text key rather than the
  //    request itself, because `request` is a new object on every render.
  const requestKey = request ? JSON.stringify(request) : null;
  const debouncedKey = useDebouncedValue(requestKey, DEBOUNCE_MS.accountLookup);
  const hasStoppedTyping = debouncedKey === requestKey;

  // 3. Ask the bank (only once typing has stopped).
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
