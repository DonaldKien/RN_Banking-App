import { router } from "expo-router";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { FormScreen } from "@/components/ui/form-screen";
import { TextField } from "@/components/ui/text-field";
import { SAMPLE_ACCOUNT } from "@/constants/sample-data";
import { AmountInput } from "@/features/transfer/amount-input";
import { RecipientField } from "@/features/transfer/recipient-field";
import { amountTextToSen, sanitizeAmountInput } from "@/lib/money";

const NOTE_MAX_LENGTH = 140;

const TransferFormScreen = () => {
  const [amountText, setAmountText] = useState("");
  const amount = amountTextToSen(amountText);
  const [note, setNote] = useState("");

  const review = () => {
    router.push("/transfer/review");
  };

  return (
    <FormScreen footer={<Button testID="review-transfer" title="Review transfer" onPress={review} />}>
      <RecipientField recipient={null} onPress={() => router.push("/transfer/recipients")} />

      <AmountInput
        value={amountText}
        onChangeText={(text) => setAmountText(sanitizeAmountInput(text))}
        amount={amount}
        balance={SAMPLE_ACCOUNT.balance}
      />

      <TextField
        label="Note (optional)"
        placeholder="What's it for?"
        value={note}
        onChangeText={setNote}
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
