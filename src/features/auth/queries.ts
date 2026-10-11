import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";

import { getAuthCapability } from "./device-auth";

/**
 * The authentication method to use for the next transfer. Re-detected each
 * time the app returns to the foreground, since the user may have enrolled or
 * removed biometrics in system Settings in the meantime.
 */
export const useAuthCapability = () => {
  return useQuery({ queryKey: queryKeys.device.authCapability, queryFn: getAuthCapability, staleTime: 0 });
};

