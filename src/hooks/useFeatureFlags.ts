import { useQuery } from "@tanstack/react-query";
import { featureFlagApi } from "@/services/featureFlag.api";

type FeatureFlag = { code: string; isEnabled: boolean };

export const useFeatureFlags = () => {
  const { data = [] } = useQuery<FeatureFlag[]>({
    queryKey: ["feature-flags"],
    queryFn: featureFlagApi.getAll,
    staleTime: 1000 * 60 * 5,
  });

  const isEnabled = (code: string): boolean =>
    data.find((f) => f.code === code)?.isEnabled ?? false;

  return { flags: data, isEnabled };
};
