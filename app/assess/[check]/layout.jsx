const META = {
  profitability: {
    title: "Profitability Check | GrowthNotes",
    description:
      "Answer 7 honest questions to find out if you have the habits and discipline to become a profitable trader.",
  },
  "pre-trade": {
    title: "Pre-Trade Discipline Check | GrowthNotes",
    description:
      "Run this 30-second checklist before every trade to avoid impulse entries, FOMO, and poor setups.",
  },
};

export async function generateMetadata({ params }) {
  const { check } = await params;
  const m = META[check];
  if (!m) return { title: "Readiness Check | GrowthNotes" };
  return {
    title: m.title,
    description: m.description,
    openGraph: { title: m.title, description: m.description },
  };
}

export default function CheckLayout({ children }) {
  return children;
}
