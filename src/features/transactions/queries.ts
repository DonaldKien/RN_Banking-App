import { useInfiniteQuery, useQuery, useQueryClient, type InfiniteData } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import { getTransaction, getTransactions } from "@/services/api/bank-api";
import type { Page, Transaction, TransactionFilter } from "@/services/api/types";

const PAGE_SIZE = 30;

const transactionsInfiniteOptions = (filter: TransactionFilter) => {
  return {
    queryKey: queryKeys.transactions.list(filter),
    queryFn: ({ pageParam }: { pageParam: string | null }) =>
      getTransactions({ cursor: pageParam, limit: PAGE_SIZE, filter }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage: Page<Transaction>) => lastPage.nextCursor,
  };
};

/** Paginated history for the full transactions list. */
export const useTransactions = (filter: TransactionFilter) => {
  return useInfiniteQuery(transactionsInfiniteOptions(filter));
};

/**
 * The latest few transactions for the home screen. Shares its cache entry
 * with the "all" history list, so opening History is instant.
 */
export const useRecentTransactions = (count = 5) => {
  return useInfiniteQuery({
    ...transactionsInfiniteOptions("all"),
    select: (data: InfiniteData<Page<Transaction>>) => data.pages[0]?.items.slice(0, count) ?? [],
  });
};

/**
 * A single transaction. Seeds from any list already in the cache so details
 * open instantly, then refreshes in the background.
 */
export const useTransaction = (id: string) => {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: queryKeys.transactions.detail(id),
    queryFn: () => getTransaction(id),
    initialData: () => {
      const lists = queryClient.getQueriesData<InfiniteData<Page<Transaction>>>({
        queryKey: queryKeys.transactions.all,
      });
      for (const [, data] of lists) {
        const match = data?.pages?.flatMap((page) => page.items).find((tx) => tx.id === id);
        if (match) return match;
      }
      return undefined;
    },
  });
};
