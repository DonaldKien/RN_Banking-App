/**
 * Authenticate-then-submit for the review screen. Every attempt needs fresh
 * authentication, submit is only reachable after it, and the idempotency key
 * is fixed per draft so retries can't double-charge.
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
      // Show the receipt and new balance immediately, then refresh.
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

      // Our cached balance was stale.
      if (error.code === "INSUFFICIENT_FUNDS" || error.code === "DAILY_LIMIT_EXCEEDED") {
        void queryClient.invalidateQueries({ queryKey: queryKeys.account });
      }

      // The server may have processed it, so refresh as if it succeeded.
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
  const [notice, setNotice] = useState<string | null>(null);

  // One key per draft: kept across retries, cleared by any edit.
  useEffect(() => {
    if (!idempotencyKey) dispatch(attemptPrepared(randomUUID()));
  }, [dispatch, idempotencyKey]);

  const busy = phase.name === "authenticating" || phase.name === "submitting";

  // In case the user confirms before the effect above has run.
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
        request: { idempotencyKey, recipient, amount, note: note.trim() || undefined, authorization },
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
        // Production: sign a server challenge with a biometric-bound key instead.
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

  // Throws so the PIN pad can show the error. Not a useMutation: that would cache the PIN.
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
