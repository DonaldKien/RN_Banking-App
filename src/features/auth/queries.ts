import { useQuery } from "@tanstack/react-query";

import { selectForcePinFallback } from "@/features/demo/demo-slice";
import { queryKeys } from "@/lib/query-keys";
import { useAppSelector } from "@/store";

import { PIN_CAPABILITY, getAuthCapability } from "./device-auth";

// Re-detected on foreground: biometrics may have changed in Settings.
export const useAuthCapability = () => {
  const forcePin = useAppSelector(selectForcePinFallback);
  return useQuery({
    queryKey: queryKeys.device.authCapability,
    queryFn: getAuthCapability,
    staleTime: 0,
    select: (capability) => (forcePin ? PIN_CAPABILITY : capability),
  });
};

/** Ignores demo overrides. */
export const useDeviceAuthCapability = () => {
  return useQuery({ queryKey: queryKeys.device.authCapability, queryFn: getAuthCapability, staleTime: 0 });
};
