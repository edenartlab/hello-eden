import { fetcher } from "@/lib/fetcher";
import { Creator } from "@edenlabs/eden-sdk";
import useSWR from "swr";

export const useEdenUser = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const route = "/api/me";

  const { data, mutate } = useSWR(isAuthenticated ? route : null, async () =>
    fetcher(route)
  );

  return {
    user: isAuthenticated ? (data?.creator as Creator) : undefined,
    balance: isAuthenticated ? data?.balance : undefined,
    pendingTasks: isAuthenticated ? data?.pendingTasks : undefined,
    refetchMe: mutate,
  };
};
