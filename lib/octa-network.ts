import type { PricingColumnProps } from "@/components/ui/pricing-column";

export interface StatItem {
  label?: string;
  value: string | number;
  suffix?: string;
  description?: string;
}

export interface OctaNetworkSnapshot {
  statsItems: StatItem[];
  stats2Items: StatItem[];
  plans: NetworkPricingPlan[];
}

export interface NetworkPricingPlan extends PricingColumnProps {
  priority?: number;
}

const gpuPriority: Record<string, number> = {
  "NVIDIA H100 80GB HBM3": 100,
  "NVIDIA A100-SXM4-40GB": 99,
  "NVIDIA RTX A6000": 98,
  "NVIDIA GeForce RTX 5090": 90,
  "NVIDIA GeForce RTX 4090": 85,
  "NVIDIA GeForce RTX 5080": 80,
  "NVIDIA GeForce RTX 4080": 75,
  "NVIDIA GeForce RTX 4070": 70,
  "NVIDIA GeForce RTX 3090": 60,
  "NVIDIA GeForce RTX 5070": 50,
};

export const fallbackOctaNetworkSnapshot: OctaNetworkSnapshot = {
  statsItems: [
    {
      value: "Global",
      label: "GPU network:",
      description: "Available for AI, rendering, and cloud workloads",
    },
    {
      value: "P2P",
      label: "Node marketplace:",
      description: "Providers offering compute power directly",
    },
    {
      value: "Pay as you go",
      label: "Access model:",
      description: "No subscriptions required",
    },
  ],
  stats2Items: [
    {
      value: "On demand",
      label: "Raw Power Unleashed",
      description: "Global GPU compute when your workload needs it",
    },
    {
      value: "Worldwide",
      label: "Global Reach",
      description: "Decentralized compute locations",
    },
    {
      value: "Flexible",
      label: "Compute Sessions Launched",
      description: "Containers, VMs, AI apps, and render jobs",
    },
  ],
  plans: [],
};

export function normalizeOctaNetworkData(data: any): OctaNetworkSnapshot {
  const statsItems: StatItem[] = [
    {
      value: data.power?.gpus?.toString() || fallbackOctaNetworkSnapshot.statsItems[0].value,
      label: "Total GPUs:",
      description: "Available for Rent",
    },
    {
      value: data.nodes?.count?.toString() || fallbackOctaNetworkSnapshot.statsItems[1].value,
      label: "Total nodes:",
      description: "Offering Compute Power",
    },
    {
      value: data.platform?.users?.toString() || fallbackOctaNetworkSnapshot.statsItems[2].value,
      label: "Registered users:",
      description: "Users & Growing",
    },
  ];

  const stats2Items: StatItem[] = [
    {
      value: Math.round(data.power?.tflops || 0).toString(),
      label: "Raw Power Unleashed",
      description: "Global TFLOPS on Demand",
    },
    {
      value: data.nodes?.locations?.toString() || fallbackOctaNetworkSnapshot.stats2Items[1].value,
      label: "Global Reach",
      description: "Decentralized Locations",
    },
    {
      value:
        data.marketplace?.total_sessions?.toString() ||
        fallbackOctaNetworkSnapshot.stats2Items[2].value,
      label: "Compute Sessions Launched",
      description: "Sessions",
    },
  ];

  const plans: NetworkPricingPlan[] = Object.entries(data.marketplace?.gpus || {})
    .map(([gpuName, gpuData]: [string, any]) => {
      const cleanName = gpuName
        .replace(/NVIDIA\s*/g, "")
        .replace(/GeForce\s*/g, "")
        .trim();

      return {
        name: cleanName,
        description: `${gpuData.count} available`,
        price: gpuData.avg_price,
        priceNote: "per hour",
        features: [
          `Average price: ${gpuData.avg_price} $/hr`,
          `Available count: ${gpuData.count}`,
          "Flexible rental terms",
          "Global GPU marketplace",
        ],
        cta: {
          label: "Rent now",
          href: "https://cube.octa.computer/marketplace/compute",
          variant: "glow" as const,
        },
        variant: "default" as const,
        priority: gpuPriority[gpuName] || 0,
      };
    })
    .sort((a, b) => {
      const priorityA = typeof a.priority === "number" ? a.priority : 0;
      const priorityB = typeof b.priority === "number" ? b.priority : 0;

      if (priorityB === priorityA) {
        const countA = parseInt(a.features?.[1]?.match(/\d+/)?.[0] || "0");
        const countB = parseInt(b.features?.[1]?.match(/\d+/)?.[0] || "0");
        return countB - countA;
      }

      return priorityB - priorityA;
    });

  return { statsItems, stats2Items, plans };
}

export async function getOctaNetworkSnapshot(): Promise<OctaNetworkSnapshot> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch("https://api.octa.computer/network", {
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Octa network API responded with ${response.status}`);
    }

    return normalizeOctaNetworkData(await response.json());
  } catch {
    return fallbackOctaNetworkSnapshot;
  }
}
