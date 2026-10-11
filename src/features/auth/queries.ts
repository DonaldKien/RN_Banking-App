import { useQuery } from "@tanstack/react-query";

import { selectForcePinFallback } from "@/features/demo/demo-slice";
import { queryKeys } from "@/lib/query-keys";
import { useAppSelector } from "@/store";

import { PIN_CAPABILITY, getAuthCapability } from "./device-auth";

/**
 * The authentication method to use for the next transfer. Re-detected each
 * time the app returns to the foreground, since the user may have enrolled or
 * removed biometrics in system Settings in the meantime.
 */
export const useAuthCapability = () => {
  const forcePin = useAppSelector(selectForcePinFallback);
  return useQuery({
    queryKey: queryKeys.device.authCapability,
    queryFn: getAuthCapability,
    staleTime: 0,
    select: (capability) => (forcePin ? PIN_CAPABILITY : capability),
  });
};

/** What the hardware actually supports, ignoring demo overrides. */
export const useDeviceAuthCapability = () => {
  return useQuery({ queryKey: queryKeys.device.authCapability, queryFn: getAuthCapability, staleTime: 0 });
};
