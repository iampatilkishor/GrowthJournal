const META = {
  "loss-recovery": {
    title: "Loss Recovery Calculator | GrowthNotes",
    description:
      "See exactly how much gain you need to recover from any percentage loss. The math every trader must understand.",
  },
  leverage: {
    title: "Leverage Impact Calculator | GrowthNotes",
    description:
      "Discover how leverage turns small adverse moves into catastrophic losses — and find your liquidation point.",
  },
  edge: {
    title: "Win Rate & R:R Edge Calculator | GrowthNotes",
    description:
      "Calculate your expectancy per trade. Find out whether your strategy has a real mathematical edge.",
  },
  "position-size": {
    title: "Position Size Calculator | GrowthNotes",
    description:
      "Calculate the exact position size to risk a fixed percentage of your account on any trade.",
  },
  compounding: {
    title: "Compounding Calculator | GrowthNotes",
    description:
      "See how consistent monthly returns compound your trading account over time.",
  },
};

export async function generateMetadata({ params }) {
  const { tool } = await params;
  const m = META[tool];
  if (!m) return { title: "Trading Tools | GrowthNotes" };
  return {
    title: m.title,
    description: m.description,
    openGraph: { title: m.title, description: m.description },
  };
}

export default function ToolLayout({ children }) {
  return children;
}
