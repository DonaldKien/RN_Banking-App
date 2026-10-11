/**
 * Orchestrates "approve, then submit" for the review screen.
 *
 * Security properties:
 * - The submit call is only reachable from a verified PIN, so there is no
 *   code path that sends money without the user's explicit approval.
 * - The idempotency key is fixed for the draft, so retries after a timeout
 *   can't double-charge.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { randomUUID } from "expo-crypto";
import { useEffect, useState } from "react";

import { haptics } from "@/lib/haptics";
import { queryKeys } from "@/lib/query-keys";
import { submitTransfer, verifyPin } from "@/services/api/bank-api";
import type { Account, TransferAuthorization, TransferReceipt, TransferRequest } from "@/services/api/types";
import { useAppDispatch, useAppSelector, useAppStore } from "@/store";

import {
  attemptPrepared,
  selectAmountSen,
  selectIdempotencyKey,
  selectNote,
  selectRecipient,
} from "./transfer-slice";

export type ConfirmPhase = { name: "idle" } | { name: "pin"; reason: string } | { name: "submitting" };

const useSubmitTransferMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: TransferRequest) => submitTransfer(request),
    onSuccess: (receipt) => {
      // Seed caches with server-confirmed data so the receipt and the new
      // balance render immediately, then refresh everything that changed.
      queryClient.setQueryData(queryKeys.transactions.detail(receipt.transaction.id), receipt.transaction);
      queryClient.setQueryData<Account>(queryKeys.account, (account) =>
        account ? { ...account, balance: receipt.balanceAfter } : account,
      );
      void queryClient.invalidateQueries({ queryKey: queryKeys.account });
      void queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.recipients.recent });
    },
  });
};

export const useConfirmTransfer = ({ onSuccess }: { onSuccess: (receipt: TransferReceipt) => void }) => {
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const recipient = useAppSelector(selectRecipient);
  const amount = useAppSelector(selectAmountSen);
  const note = useAppSelector(selectNote);
  const idempotencyKey = useAppSelector(selectIdempotencyKey);

  const submitMutation = useSubmitTransferMutation();

  const [phase, setPhase] = useState<ConfirmPhase>({ name: "idle" });
  /** Short, non-blocking feedback such as "PIN entry was cancelled". */
  const [notice, setNotice] = useState<string | null>(null);

  // One idempotency key per draft; kept across retries, reset by any edit.
  useEffect(() => {
    if (!idempotencyKey) dispatch(attemptPrepared(randomUUID()));
  }, [dispatch, idempotencyKey]);

  const busy = phase.name === "submitting";

  /**
   * The draft's idempotency key. Normally created by the effect above; if the
   * user confirms before that effect has run, create it right here instead of
   * failing.
   */
  const getIdempotencyKey = (): string => {
    const existing = selectIdempotencyKey(store.getState());
    if (existing) return existing;
    const key = randomUUID();
    dispatch(attemptPrepared(key));
    return key;
  };

  const submit = async (authorization: TransferAuthorization) => {
    if (!recipient || amount === null) {
      setPhase({ name: "idle" });
      setNotice("This transfer is missing details. Go back and check the recipient and amount.");
      return;
    }

    const idempotencyKey = getIdempotencyKey();
    setPhase({ name: "submitting" });
    try {
      const receipt = await submitMutation.mutateAsync({
        idempotencyKey,
        recipient,
        amount,
        note: note.trim() || undefined,
        authorization,
      });
      haptics.success();
      onSuccess(receipt);
    } catch {
      haptics.error();
      setPhase({ name: "idle" });
      setNotice("Your transfer wasn't completed. Please try again.");
    }
  };

  const confirm = () => {
    if (busy || !recipient || amount === null) return;
    setNotice(null);
    setPhase({ name: "pin", reason: "Enter your 6-digit transaction PIN to approve this transfer." });
  };

  /**
   * Verifies the PIN; throws so the PIN pad can show inline errors. Called
   * directly rather than via `useMutation`, which would keep the PIN in the
   * mutation cache as `variables`.
   */
  const confirmWithPin = async (pin: string) => {
    const { token } = await verifyPin(pin);
    await submit({ method: "pin", token });
  };

  const dismissPin = () => {
    setPhase({ name: "idle" });
    setNotice("Transfer not sent — PIN entry was cancelled.");
  };

  return {
    phase,
    notice,
    busy,
    confirm,
    confirmWithPin,
    dismissPin,
  };
};
