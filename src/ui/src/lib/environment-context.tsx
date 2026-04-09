import { createContext, createSignal, useContext, type ParentComponent, type Accessor, type Setter } from "solid-js";
import { useReferenceData } from "./reference-data";

interface EnvironmentContextValue {
  selectedEnvironment: Accessor<string | undefined>;
  setSelectedEnvironment: Setter<string | undefined>;
  environments: Accessor<string[]>;
  environmentsState: Accessor<"pending" | "ready" | "error">;
  environmentsError: Accessor<Error | null>;
}

const EnvironmentContext = createContext<EnvironmentContextValue>();

export const EnvironmentProvider: ParentComponent = (props) => {
  const referenceData = useReferenceData();
  const [selectedEnvironment, setSelectedEnvironment] = createSignal<string | undefined>(undefined);

  return (
    <EnvironmentContext.Provider
      value={{
        selectedEnvironment,
        setSelectedEnvironment,
        environments: referenceData.hostEnvironments.data,
        environmentsState: referenceData.hostEnvironments.state,
        environmentsError: referenceData.hostEnvironments.error,
      }}
    >
      {props.children}
    </EnvironmentContext.Provider>
  );
};

export const useEnvironment = () => {
  const context = useContext(EnvironmentContext);
  if (!context) {
    throw new Error("useEnvironment must be used within an EnvironmentProvider");
  }
  return context;
};
