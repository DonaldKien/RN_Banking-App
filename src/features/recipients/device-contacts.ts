/**
 * Access to the phone's address book, used to pay contacts via DuitNow
 * (mobile number as the payment proxy).
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Contact,
  ContactField,
  ContactsSortOrder,
  getPermissionsAsync,
  requestPermissionsAsync,
} from "expo-contacts";
import { Platform } from "react-native";

import { normaliseMalaysianMobile } from "@/lib/identifiers";
import { queryKeys } from "@/lib/query-keys";
import { DUITNOW_LABEL } from "@/services/api/banks";
import type { Recipient } from "@/services/api/types";

export type ContactsAccess =
  | { status: "granted"; limited: boolean }
  | { status: "undetermined" }
  | { status: "denied"; canAskAgain: boolean }
  | { status: "unavailable" };

/** One row per phone number, so a contact with two numbers yields two rows. */
export interface DeviceContactEntry {
  key: string;
  name: string;
  phoneLabel: string;
  rawPhone: string;
  /** `null` when the number can't be used for DuitNow (e.g. not a Malaysian mobile). */
  recipient: Recipient | null;
}

const readContactsAccess = async (): Promise<ContactsAccess> => {
  if (Platform.OS === "web") return { status: "unavailable" };
  const response = await getPermissionsAsync();
  if (response.status === "granted") {
    return { status: "granted", limited: response.accessPrivileges === "limited" };
  }
  if (response.status === "undetermined") return { status: "undetermined" };
  return { status: "denied", canAskAgain: response.canAskAgain };
};

const loadContacts = async (): Promise<DeviceContactEntry[]> => {
  // getAllDetails fetches only the requested fields without materialising full
  // Contact objects, which keeps large address books fast to load.
  const contacts = await Contact.getAllDetails([ContactField.FULL_NAME, ContactField.PHONES], {
    sortOrder: ContactsSortOrder.GivenName,
  });

  const entries: DeviceContactEntry[] = [];
  for (const contact of contacts) {
    const name = contact.fullName?.trim();
    if (!name) continue;
    for (const phone of contact.phones ?? []) {
      if (!phone.number) continue;
      const mobile = normaliseMalaysianMobile(phone.number);
      entries.push({
        key: `${contact.id}:${phone.id}`,
        name,
        phoneLabel: phone.label || "mobile",
        rawPhone: phone.number,
        recipient: mobile
          ? {
              id: `contact:${contact.id}:${phone.id}`,
              name,
              type: "DUITNOW_MOBILE",
              accountId: mobile,
              bankName: DUITNOW_LABEL,
            }
          : null,
      });
    }
  }
  return entries;
};

export const useContactsAccess = () => {
  return useQuery({
    queryKey: queryKeys.device.contactsPermission,
    queryFn: readContactsAccess,
    // Re-check whenever the screen regains focus: the user may have changed
    // the permission in system Settings.
    staleTime: 0,
  });
};

export const useRequestContactsAccess = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await requestPermissionsAsync();
      return readContactsAccess();
    },
    onSuccess: (access) => queryClient.setQueryData(queryKeys.device.contactsPermission, access),
  });
};

export const useDeviceContacts = (enabled: boolean) => {
  return useQuery({
    queryKey: queryKeys.device.contacts,
    queryFn: loadContacts,
    enabled,
    staleTime: 5 * 60_000,
  });
};
