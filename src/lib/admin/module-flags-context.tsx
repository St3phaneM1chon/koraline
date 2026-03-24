'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface ModuleFlagsState {
  /** Map of module key → enabled boolean */
  flags: Record<string, boolean>;
  /** Whether the current tenant is the Attitudes super-admin */
  isSuperAdmin: boolean;
  /** True while the initial fetch is in progress */
  loading: boolean;
}

const defaultState: ModuleFlagsState = {
  flags: {},
  isSuperAdmin: false,
  loading: true,
};

const ModuleFlagsContext = createContext<ModuleFlagsState>(defaultState);

export function ModuleFlagsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ModuleFlagsState>(defaultState);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/admin/modules')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.success && data.data) {
          const flags: Record<string, boolean> = {};
          for (const m of data.data.modules) {
            flags[m.key] = m.enabled;
          }
          setState({
            flags,
            isSuperAdmin: data.data.isSuperAdmin ?? false,
            loading: false,
          });
        } else {
          setState((prev) => ({ ...prev, loading: false }));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState((prev) => ({ ...prev, loading: false }));
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ModuleFlagsContext.Provider value={state}>
      {children}
    </ModuleFlagsContext.Provider>
  );
}

export function useModuleFlags(): ModuleFlagsState {
  return useContext(ModuleFlagsContext);
}
