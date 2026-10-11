import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { Controller, useForm, useWatch, type Control } from "react-hook-form";

import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { FormScreen } from "@/components/ui/form-screen";
import { Icon } from "@/components/ui/icon";
import { SearchableDropdown } from "@/components/ui/searchable-dropdown";
import { Tabs } from "@/components/ui/tabs";
import { TextField } from "@/components/ui/text-field";
import { AccountLookupStatus } from "@/features/recipients/account-lookup-status";
import {
  NEW_RECIPIENT_DEFAULTS,
  newRecipientSchema,
  toRecipient,
  type NewRecipientFormValues,
} from "@/features/recipients/new-recipient-form";
import { useAccountHolderLookup } from "@/features/recipients/use-account-holder-lookup";
import { recipientSelected } from "@/features/transfer/transfer-slice";
import { useTheme } from "@/hooks/use-theme";
import { haptics } from "@/lib/haptics";
import { ACCOUNT_NUMBER_MAX_LENGTH, digitsOnly } from "@/lib/identifiers";
import { BANKS } from "@/services/api/banks";
import type { AccountLookupRequest } from "@/services/api/types";
import { useAppDispatch } from "@/store";

type NewRecipientControl = Control<NewRecipientFormValues, unknown, AccountLookupRequest>;

const RECIPIENT_TYPES = [
  { value: "BANK_ACCOUNT", label: "Bank account" },
  { value: "DUITNOW_MOBILE", label: "Mobile number" },
] as const;

const BANK_OPTIONS = BANKS.map((bank) => ({ value: bank.code, label: bank.shortName, description: bank.name }));

/** Add a recipient by bank account or DuitNow mobile, verified by the bank's name check. */
const NewRecipientScreen = () => {
  const dispatch = useAppDispatch();

  const { control, handleSubmit, clearErrors } = useForm<NewRecipientFormValues, unknown, AccountLookupRequest>({
    resolver: zodResolver(newRecipientSchema),
    defaultValues: NEW_RECIPIENT_DEFAULTS,
    mode: "onTouched",
  });

  const formValues = useWatch({ control });
  const recipientType = formValues.type ?? "BANK_ACCOUNT";
  const hasChosenBank = Boolean(formValues.bankCode);

  const accountHolder = useAccountHolderLookup(formValues);

  const saveRecipient = (validRequest: AccountLookupRequest) => {
    // Not verified yet: the status below already explains why.
    if (!accountHolder.verifiedName) {
      if (!accountHolder.isChecking) haptics.error();
      return;
    }

    haptics.selection();
    dispatch(recipientSelected(toRecipient(validRequest, accountHolder.verifiedName)));
    router.dismissTo("/transfer");
  };

  return (
    <FormScreen
      footer={<Button title="Continue" onPress={handleSubmit(saveRecipient)} testID="confirm-recipient" />}>
      <RecipientTypeTabs control={control} onTypeChange={() => clearErrors()} />

      {recipientType === "BANK_ACCOUNT" ? (
        <BankAccountFields control={control} hasChosenBank={hasChosenBank} />
      ) : (
        <MobileNumberField control={control} />
      )}

      <AccountLookupStatus
        isChecking={accountHolder.isChecking}
        verifiedName={accountHolder.verifiedName}
        error={accountHolder.error}
        onRetry={accountHolder.retry}
      />

      <ThemedText variant="caption" color="textTertiary" align="center">
        Demo tip: numbers ending in 0000 simulate an unknown account.
      </ThemedText>
    </FormScreen>
  );
};

export default NewRecipientScreen;

const RecipientTypeTabs = ({ control, onTypeChange }: { control: NewRecipientControl; onTypeChange: () => void }) => (
  <Controller
    control={control}
    name="type"
    render={({ field }) => (
      <Tabs
        options={RECIPIENT_TYPES}
        value={field.value}
        onChange={(nextType) => {
          field.onChange(nextType);
          onTypeChange();
        }}
      />
    )}
  />
);

const BankAccountFields = ({ control, hasChosenBank }: { control: NewRecipientControl; hasChosenBank: boolean }) => (
  <>
    <Controller
      control={control}
      name="bankCode"
      render={({ field, fieldState }) => (
        <SearchableDropdown
          testID="bank-dropdown"
          label="Bank"
          icon="bank"
          placeholder="Choose a bank"
          searchPlaceholder="Search bank name"
          emptyMessage="No bank matches your search."
          options={BANK_OPTIONS}
          value={field.value}
          onChange={field.onChange}
          onBlur={field.onBlur}
          error={fieldState.error?.message}
        />
      )}
    />

    <Controller
      control={control}
      name="accountNumber"
      render={({ field, fieldState }) => (
        <TextField
          ref={field.ref}
          label="Account number"
          placeholder="e.g. 1234 5678 9012"
          value={field.value}
          onChangeText={(text) => field.onChange(digitsOnly(text))}
          onBlur={field.onBlur}
          keyboardType="number-pad"
          maxLength={ACCOUNT_NUMBER_MAX_LENGTH}
          error={fieldState.error?.message}
          helper={hasChosenBank ? undefined : "Choose a bank first."}
        />
      )}
    />
  </>
);

const MobileNumberField = ({ control }: { control: NewRecipientControl }) => {
  const theme = useTheme();
  return (
    <Controller
      control={control}
      name="mobile"
      render={({ field, fieldState }) => (
        <TextField
          ref={field.ref}
          label="Mobile number"
          placeholder="012-345 6789"
          value={field.value}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          keyboardType="phone-pad"
          autoComplete="tel"
          maxLength={16}
          error={fieldState.error?.message}
          helper="We'll send to the bank account linked to this number via DuitNow."
          leading={<Icon name="phone" size={18} color={theme.textTertiary} />}
        />
      )}
    />
  );
};
