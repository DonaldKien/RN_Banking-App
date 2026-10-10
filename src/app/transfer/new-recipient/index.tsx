import { useState } from "react";

import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { FormScreen } from "@/components/ui/form-screen";
import { Icon } from "@/components/ui/icon";
import { Tabs } from "@/components/ui/tabs";
import { TextField } from "@/components/ui/text-field";
import { useTheme } from "@/hooks/use-theme";
import { ACCOUNT_NUMBER_MAX_LENGTH, digitsOnly } from "@/lib/identifiers";
import type { RecipientType } from "@/services/api/types";

const RECIPIENT_TYPES = [
  { value: "BANK_ACCOUNT", label: "Bank account" },
  { value: "DUITNOW_MOBILE", label: "Mobile number" },
] as const;

/** Add a recipient by bank account or DuitNow mobile number. */
const NewRecipientScreen = () => {
  const theme = useTheme();
  const [recipientType, setRecipientType] = useState<RecipientType>("BANK_ACCOUNT");
  const [accountNumber, setAccountNumber] = useState("");
  const [mobile, setMobile] = useState("");

  return (
    <FormScreen footer={<Button title="Continue" onPress={() => {}} />}>
      <Tabs options={RECIPIENT_TYPES} value={recipientType} onChange={setRecipientType} />

      {recipientType === "BANK_ACCOUNT" ? (
        <TextField
          label="Account number"
          placeholder="e.g. 1234 5678 9012"
          value={accountNumber}
          onChangeText={(text) => setAccountNumber(digitsOnly(text))}
          keyboardType="number-pad"
          maxLength={ACCOUNT_NUMBER_MAX_LENGTH}
        />
      ) : (
        <TextField
          label="Mobile number"
          placeholder="012-345 6789"
          value={mobile}
          onChangeText={setMobile}
          keyboardType="phone-pad"
          autoComplete="tel"
          maxLength={16}
          helper="We'll send to the bank account linked to this number via DuitNow."
          leading={<Icon name="phone" size={18} color={theme.textTertiary} />}
        />
      )}

      <ThemedText variant="caption" color="textTertiary" align="center">
        Demo tip: numbers ending in 0000 simulate an unknown account.
      </ThemedText>
    </FormScreen>
  );
};

export default NewRecipientScreen;
