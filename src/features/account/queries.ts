import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import { getAccount } from "@/services/api/bank-api";

export const useAccount = () => {
  return useQuery({ queryKey: queryKeys.account, queryFn: getAccount });
};

/**
 * Subscribes to the balance only. `select` + structural sharing means
 * components using this hook re-render only when the balance itself changes.
 */
export const useBalance = () => {
  return useQuery({
    queryKey: queryKeys.account,
    queryFn: getAccount,
    select: (account) => account.balance,
  });
};
