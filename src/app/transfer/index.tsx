import { router } from "expo-router";

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
import { useAppDispatch, useAppSelector } from "@/store";

const NOTE_MAX_LENGTH = 140;

const TransferFormScreen = () => {
  const dispatch = useAppDispatch();
  const recipient = useAppSelector(selectRecipient);
  const amountText = useAppSelector(selectAmountText);
  const amount = useAppSelector(selectAmountSen);
  const note = useAppSelector(selectNote);
  const account = useAccount();

  const review = () => {
    router.push("/transfer/review");
  };

  return (
    <FormScreen footer={<Button testID="review-transfer" title="Review transfer" onPress={review} />}>
      <RecipientField recipient={recipient} onPress={() => router.push("/transfer/recipients")} />

      <AmountInput
        value={amountText}
        onChangeText={(text) => dispatch(amountChanged(text))}
        amount={amount}
        balance={account.data?.balance}
      />

      <TextField
        label="Note (optional)"
        placeholder="What's it for?"
        value={note}
        onChangeText={(text) => dispatch(noteChanged(text))}
        maxLength={NOTE_MAX_LENGTH}
        showCounter
        returnKeyType="done"
        submitBehavior="blurAndSubmit"
        onSubmitEditing={review}
      />
    </FormScreen>
  );
};

export default TransferFormScreen;
