/**
 * Orchestrates "authenticate, then submit" for the review screen.
 *
 * Security properties:
 * - Every submission requires a fresh authentication; approvals are never
 *   cached or reused across attempts.
 * - The submit call is only reachable from a successful authentication
 *   (device auth or verified PIN), so there is no code path that sends money
 *   without the user's explicit approval.
 * - The idempotency key is fixed for the draft, so retries after a timeout
 *   can't double-charge.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { randomUUID } from "expo-crypto";
import { useEffect, useState } from "react";

import { useAuthCapability } from "@/features/auth/queries";
import { authenticateWithDevice, type AuthCapability } from "@/features/auth/device-auth";
import { scenarioConsumed, selectTransferScenario } from "@/features/demo/demo-slice";
import { haptics } from "@/lib/haptics";
import { formatMoney } from "@/lib/money";
import { queryKeys } from "@/lib/query-keys";
import { submitTransfer, verifyPin } from "@/services/api/bank-api";
import { isApiError } from "@/services/api/errors";
import type {
  Account,
  MockScenario,
  TransferAuthorization,
  TransferReceipt,
  TransferRequest,
} from "@/services/api/types";
import { useAppDispatch, useAppSelector, useAppStore } from "@/store";

import { describeTransferError, type TransferErrorDescription } from "./transfer-errors";
import {
  attemptPrepared,
  selectAmountSen,
  selectIdempotencyKey,
  selectNote,
  selectRecipient,
} from "./transfer-slice";

export type ConfirmPhase =
  | { name: "idle" }
  | { name: "authenticating" }
  | { name: "pin"; reason: string }
  | { name: "submitting" }
  | { name: "failed"; error: TransferErrorDescription };

const useSubmitTransferMutation = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: ({ request, scenario }: { request: TransferRequest; scenario: MockScenario }) =>
      submitTransfer(request, { scenario }),
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
    onError: (error) => {
      if (!isApiError(error)) return;

      // The balance we validated against was out of date; fetch the real one.
      if (error.code === "INSUFFICIENT_FUNDS" || error.code === "DAILY_LIMIT_EXCEEDED") {
        void queryClient.invalidateQueries({ queryKey: queryKeys.account });
      }

      // A timeout means we don't know whether the transfer went through: the
      // server may have processed it. Refresh everything a transfer changes,
      // so the balance and history are right even if the user doesn't retry.
      if (error.code === "TIMEOUT") {
        void queryClient.invalidateQueries({ queryKey: queryKeys.account });
        void queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
        void queryClient.invalidateQueries({ queryKey: queryKeys.recipients.recent });
      }
    },
    onSettled: () => {
      dispatch(scenarioConsumed());
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

  const capabilityQuery = useAuthCapability();
  const submitMutation = useSubmitTransferMutation();

  const [phase, setPhase] = useState<ConfirmPhase>({ name: "idle" });
  /** Short, non-blocking feedback such as "Authentication cancelled". */
  const [notice, setNotice] = useState<string | null>(null);

  // One idempotency key per draft; kept across retries, reset by any edit.
  useEffect(() => {
    if (!idempotencyKey) dispatch(attemptPrepared(randomUUID()));
  }, [dispatch, idempotencyKey]);

  const busy = phase.name === "authenticating" || phase.name === "submitting";

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
    // Never leave the screen stuck in "authenticating" / "pin" if the draft is incomplete.
    if (!recipient || amount === null) {
      setPhase({ name: "idle" });
      setNotice("This transfer is missing details. Go back and check the recipient and amount.");
      return;
    }

    const idempotencyKey = getIdempotencyKey();
    setPhase({ name: "submitting" });
    try {
      const receipt = await submitMutation.mutateAsync({
        request: { idempotencyKey, recipient, amount, note: note.trim() || undefined, authorization },
        // Read at call time so the latest demo setting applies.
        scenario: selectTransferScenario(store.getState()),
      });
      haptics.success();
      onSuccess(receipt);
    } catch (error) {
      haptics.error();
      setPhase({ name: "failed", error: describeTransferError(error) });
    }
  };

  const confirm = async () => {
    const capability: AuthCapability | undefined = capabilityQuery.data;
    if (busy || !capability || !recipient || amount === null) return;
    setNotice(null);

    if (capability.method === "pin") {
      setPhase({ name: "pin", reason: "Enter your 6-digit transaction PIN to approve this transfer." });
      return;
    }

    setPhase({ name: "authenticating" });
    const outcome = await authenticateWithDevice(capability, {
      message: `Send ${formatMoney(amount)}`,
      subtitle: `to ${recipient.name}`,
    });

    switch (outcome.status) {
      case "success":
        // Production: this would be a server challenge signed by a biometric-bound key.
        await submit({ method: capability.method, assertion: `${capability.method}:${Date.now()}` });
        break;
      case "cancelled":
        setPhase({ name: "idle" });
        setNotice("Transfer not sent — authentication was cancelled.");
        break;
      case "fallback":
        setPhase({ name: "pin", reason: outcome.message });
        break;
      case "failed":
        haptics.error();
        setPhase({ name: "idle" });
        setNotice(outcome.message);
        break;
    }
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

  const switchToPin = () => {
    setNotice(null);
    setPhase({ name: "pin", reason: "Enter your 6-digit transaction PIN to approve this transfer." });
  };

  const dismissPin = () => {
    setPhase({ name: "idle" });
    setNotice("Transfer not sent — PIN entry was cancelled.");
  };

  const clearError = () => {
    setPhase({ name: "idle" });
  };

  return {
    phase,
    notice,
    busy,
    capability: capabilityQuery.data,
    capabilityLoading: capabilityQuery.isPending,
    confirm,
    confirmWithPin,
    switchToPin,
    dismissPin,
    clearError,
  };
};
