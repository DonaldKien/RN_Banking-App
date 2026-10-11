import { router } from "expo-router";
import { useState } from "react";

import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { FormScreen } from "@/components/ui/form-screen";
import { TextField } from "@/components/ui/text-field";
import { useAccount } from "@/features/account/queries";
import { AmountInput } from "@/features/transfer/amount-input";
import { RecipientField } from "@/features/transfer/recipient-field";
import {
  amountChanged,
  noteChanged,
  selectAmountSen,
  selectAmountText,
  selectNote,
  selectRecipient,
} from "@/features/transfer/transfer-slice";
import { hasErrors, validateTransfer } from "@/features/transfer/validation";
import { haptics } from "@/lib/haptics";
import { TRANSFER_LIMITS } from "@/services/api/limits";
import { useAppDispatch, useAppSelector } from "@/store";

/** Step 1 of the transfer flow: who, how much, and an optional note. */
const TransferFormScreen = () => {
  const dispatch = useAppDispatch();
  const recipient = useAppSelector(selectRecipient);
  const amountText = useAppSelector(selectAmountText);
  const amount = useAppSelector(selectAmountSen);
  const note = useAppSelector(selectNote);
  const account = useAccount();

  // Errors for untouched fields appear only after the first "Review" press,
  // so the form doesn't greet the user with red text.
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const errors = validateTransfer({
    recipient,
    amount,
    note,
    balance: account.data?.balance,
    dailyRemaining: account.data ? account.data.dailyLimit - account.data.dailyUsed : undefined,
    ownAccountNumber: account.data?.accountNumber,
  });

  const visibleErrors = {
    recipient: submitAttempted ? errors.recipient : undefined,
    // Amount errors (e.g. exceeding the balance) are shown live while typing.
    amount: submitAttempted || amountText !== "" ? errors.amount : undefined,
    note: errors.note,
  };

  const review = () => {
    setSubmitAttempted(true);
    if (hasErrors(errors) || !account.data) {
      haptics.error();
      return;
    }
    router.push("/transfer/review");
  };

  return (
    <FormScreen
      footer={
        <Button
          testID="review-transfer"
          title="Review transfer"
          onPress={review}
          loading={account.isPending}
          disabled={!account.data && account.isError}
        />
      }>
      {account.isError && !account.data && (
        <Banner
          tone="danger"
          title="Couldn't load your balance"
          message="We need your latest balance before you can transfer."
          actionLabel="Try again"
          onAction={() => void account.refetch()}
        />
      )}

      <RecipientField
        recipient={recipient}
        error={visibleErrors.recipient}
        onPress={() => router.push("/transfer/recipients")}
      />

      <AmountInput
        value={amountText}
        onChangeText={(text) => dispatch(amountChanged(text))}
        amount={amount}
        balance={account.data?.balance}
        error={visibleErrors.amount}
      />

      <TextField
        label="Note (optional)"
        placeholder="What's it for?"
        value={note}
        onChangeText={(text) => dispatch(noteChanged(text))}
        maxLength={TRANSFER_LIMITS.noteMaxLength}
        showCounter
        error={visibleErrors.note}
        returnKeyType="done"
        submitBehavior="blurAndSubmit"
        onSubmitEditing={review}
      />
    </FormScreen>
  );
};

export default TransferFormScreen;
