import type { Accessor, Setter } from "solid-js";
import {
  useApplicationData,
  type ApplicationEnvironmentSummary,
} from "./application-data";

export type EnvironmentContextValue = {
  selectedEnvironmentId: Accessor<string | undefined>;
  setSelectedEnvironmentId: Setter<string | undefined>;
  environments: Accessor<ApplicationEnvironmentSummary[]>;
  environmentsState: Accessor<
    "idle" | "pending" | "refreshing" | "ready" | "errored"
  >;
  environmentsError: Accessor<Error | null>;
};

export const useEnvironment = (): EnvironmentContextValue => {
  const applicationData = useApplicationData();
  return {
    selectedEnvironmentId: applicationData.selectedEnvironmentId,
    setSelectedEnvironmentId: applicationData.setSelectedEnvironmentId,
    environments: applicationData.environments.data,
    environmentsState: applicationData.environments.state,
    environmentsError: applicationData.environments.error,
  };
};
