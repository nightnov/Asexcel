interface GrowthChartProps {
  data: { month: string; signups: number }[];
}

const MONTH_LABELS: Record<string, string> = {
  "01": "Jan", "02": "Fév", "03": "Mar", "04": "Avr", "05": "Mai", "06": "Jun",
  "07": "Jul", "08": "Aoû", "09": "Sep", "10": "Oct", "11": "Nov", "12": "Déc",
};

function shortLabel(month: string): string {
  return MONTH_LABELS[month.slice(5, 7)] ?? month;
}

const WIDTH = 640;
const HEIGHT = 220;
const PADDING_X = 24;
const PADDING_Y = 20;

export default function GrowthChart({ data }: GrowthChartProps) {
  const max = Math.max(1, ...data.map((d) => d.signups));
  const stepX = (WIDTH - PADDING_X * 2) / Math.max(1, data.length - 1);

  const points = data.map((d, i) => {
    const x = PADDING_X + i * stepX;
    const y = HEIGHT - PADDING_Y - (d.signups / max) * (HEIGHT - PADDING_Y * 2);
    return { x, y, ...d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1]?.x ?? PADDING_X} ${HEIGHT - PADDING_Y} L ${PADDING_X} ${HEIGHT - PADDING_Y} Z`;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <h3 className="text-sm font-semibold text-white">Nouveaux inscrits (6 derniers mois)</h3>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="mt-4 w-full" role="img" aria-label="Graphique des inscriptions mensuelles">
        <defs>
          <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34D399" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#34D399" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#growthFill)" />
        <path d={linePath} fill="none" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p) => (
          <circle key={p.month} cx={p.x} cy={p.y} r="3.5" fill="#0B0F0D" stroke="#34D399" strokeWidth="2" />
        ))}
        {points.map((p) => (
          <text key={p.month} x={p.x} y={HEIGHT - 2} textAnchor="middle" fontSize="11" fill="rgba(255,255,255,0.4)">
            {shortLabel(p.month)}
          </text>
        ))}
      </svg>
    </div>
  );
}
