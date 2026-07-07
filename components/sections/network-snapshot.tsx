"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import {
  fallbackOctaNetworkSnapshot,
  getOctaNetworkSnapshot,
  type OctaNetworkSnapshot,
} from "@/lib/octa-network";

import Pricing from "./pricing/custom";
import Stats from "./stats/default";
import StatsGridBoxed from "./stats/grid-boxed";

const NetworkSnapshotContext = createContext<OctaNetworkSnapshot>(
  fallbackOctaNetworkSnapshot,
);

export function NetworkSnapshotProvider({
  children,
  initialSnapshot,
}: {
  children: React.ReactNode;
  initialSnapshot: OctaNetworkSnapshot;
}) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);

  useEffect(() => {
    let active = true;

    getOctaNetworkSnapshot().then((nextSnapshot) => {
      if (active) {
        setSnapshot(nextSnapshot);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(() => snapshot, [snapshot]);

  return (
    <NetworkSnapshotContext.Provider value={value}>
      {children}
    </NetworkSnapshotContext.Provider>
  );
}

function useNetworkSnapshot() {
  return useContext(NetworkSnapshotContext);
}

export function NetworkStatsGridBoxed({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const { statsItems } = useNetworkSnapshot();

  return (
    <StatsGridBoxed
      title={title}
      description={description}
      items={statsItems}
    />
  );
}

export function NetworkStatsStrip({ className }: { className?: string }) {
  const { stats2Items } = useNetworkSnapshot();

  return <Stats className={className} items={stats2Items} />;
}

export function NetworkPricing({ className }: { className?: string }) {
  const { plans } = useNetworkSnapshot();

  if (plans.length === 0) {
    return null;
  }

  return (
    <Pricing
      title="GPU rental plans for all workloads"
      description="Choose from the latest NVIDIA GPUs with live hourly pricing."
      plans={plans}
      className={className}
    />
  );
}
