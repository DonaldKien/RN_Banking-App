import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormScreen } from "@/components/ui/form-screen";
import { ThemedText } from "@/components/themed-text";
import { SAMPLE_ACCOUNT } from "@/constants/sample-data";
import { AmountInput } from "@/features/transfer/amount-input";
import { RecipientField } from "@/features/transfer/recipient-field";
import { amountTextToSen, sanitizeAmountInput } from "@/lib/money";

const TransferFormScreen = () => {
  const [amountText, setAmountText] = useState("");
  const amount = amountTextToSen(amountText);

  return (
    <FormScreen footer={<Button title="Review transfer" onPress={() => {}} />}>
      <RecipientField recipient={null} onPress={() => {}} />

      <AmountInput
        value={amountText}
        onChangeText={(text) => setAmountText(sanitizeAmountInput(text))}
        amount={amount}
        balance={SAMPLE_ACCOUNT.balance}
      />

      <Card>
        <ThemedText variant="captionStrong" color="textSecondary">
          Note (optional)
        </ThemedText>
      </Card>
    </FormScreen>
  );
};

export default TransferFormScreen;
