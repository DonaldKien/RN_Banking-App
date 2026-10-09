import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormScreen } from "@/components/ui/form-screen";
import { ThemedText } from "@/components/themed-text";
import { RecipientField } from "@/features/transfer/recipient-field";

const TransferFormScreen = () => {
  return (
    <FormScreen footer={<Button title="Review transfer" onPress={() => {}} />}>
      <RecipientField recipient={null} onPress={() => {}} />

      <Card>
        <ThemedText variant="captionStrong" color="textSecondary">
          Amount
        </ThemedText>
      </Card>

      <Card>
        <ThemedText variant="captionStrong" color="textSecondary">
          Note (optional)
        </ThemedText>
      </Card>
    </FormScreen>
  );
};

export default TransferFormScreen;
