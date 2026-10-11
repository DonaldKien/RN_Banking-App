import { router } from "expo-router";
import { useState } from "react";

import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { FormScreen } from "@/components/ui/form-screen";
import { Icon } from "@/components/ui/icon";
import { SearchableDropdown } from "@/components/ui/searchable-dropdown";
import { Tabs } from "@/components/ui/tabs";
import { TextField } from "@/components/ui/text-field";
import { AccountLookupStatus } from "@/features/recipients/account-lookup-status";
import { recipientSelected } from "@/features/transfer/transfer-slice";
import { useTheme } from "@/hooks/use-theme";
import {
  ACCOUNT_NUMBER_MAX_LENGTH,
  digitsOnly,
  isValidAccountNumber,
  normaliseMalaysianMobile,
} from "@/lib/identifiers";
import { BANKS, DUITNOW_LABEL, findBank } from "@/services/api/banks";
import type { RecipientType } from "@/services/api/types";
import { useAppDispatch } from "@/store";

const RECIPIENT_TYPES = [
  { value: "BANK_ACCOUNT", label: "Bank account" },
  { value: "DUITNOW_MOBILE", label: "Mobile number" },
] as const;

const BANK_OPTIONS = BANKS.map((bank) => ({ value: bank.code, label: bank.shortName, description: bank.name }));

// Placeholder until the bank's name check is wired up.
const PLACEHOLDER_HOLDER_NAME = "AISYAH BINTI AHMAD";

/** Add a recipient by bank account or DuitNow mobile number. */
const NewRecipientScreen = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const [recipientType, setRecipientType] = useState<RecipientType>("BANK_ACCOUNT");
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [mobile, setMobile] = useState("");

  const accountId =
    recipientType === "BANK_ACCOUNT"
      ? bankCode && isValidAccountNumber(accountNumber)
        ? accountNumber
        : null
      : normaliseMalaysianMobile(mobile);
  const notFound = accountId !== null && accountId.endsWith("0000");

  const saveRecipient = () => {
    if (!accountId || notFound) return;
    dispatch(
      recipientSelected({
        id: `new:${recipientType}:${accountId}`,
        name: PLACEHOLDER_HOLDER_NAME,
        type: recipientType,
        accountId,
        bankCode: recipientType === "BANK_ACCOUNT" ? bankCode : undefined,
        bankName: recipientType === "DUITNOW_MOBILE" ? DUITNOW_LABEL : (findBank(bankCode)?.shortName ?? ""),
      }),
    );
    router.dismissTo("/transfer");
  };

  return (
    <FormScreen
      footer={<Button title="Continue" onPress={saveRecipient} testID="confirm-recipient" />}>
      <Tabs options={RECIPIENT_TYPES} value={recipientType} onChange={setRecipientType} />

      {recipientType === "BANK_ACCOUNT" ? (
        <>
          <SearchableDropdown
            label="Bank"
            icon="bank"
            placeholder="Choose a bank"
            searchPlaceholder="Search bank name"
            emptyMessage="No bank matches your search."
            options={BANK_OPTIONS}
            value={bankCode}
            onChange={setBankCode}
          />
          <TextField
            label="Account number"
            placeholder="e.g. 1234 5678 9012"
            value={accountNumber}
            onChangeText={(text) => setAccountNumber(digitsOnly(text))}
            keyboardType="number-pad"
            maxLength={ACCOUNT_NUMBER_MAX_LENGTH}
            helper={bankCode ? undefined : "Choose a bank first."}
          />
        </>
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

      <AccountLookupStatus
        isChecking={false}
        verifiedName={accountId && !notFound ? PLACEHOLDER_HOLDER_NAME : null}
        error={notFound ? "Account not found. Double-check the number and the bank you selected." : null}
      />

      <ThemedText variant="caption" color="textTertiary" align="center">
        Demo tip: numbers ending in 0000 simulate an unknown account.
      </ThemedText>
    </FormScreen>
  );
};

export default NewRecipientScreen;
