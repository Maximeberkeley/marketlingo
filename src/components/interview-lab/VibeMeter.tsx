interface VibeMeterProps {
  text: string;
}

export function VibeMeter({ text }: VibeMeterProps) {
  const len = text.trim().length;
  const level = len < 30 ? 0 : len < 100 ? 1 : len < 250 ? 2 : 3;
  const labels = ['Too Short', 'Getting There', 'Good Length', 'Perfect! 🔥'];
  const colors = ['#EF4444', '#F59E0B', '#3B82F6', '#10B981'];
  const widths = [15, 40, 70, 100];

  return (
    <div className="flex items-center gap-3 mt-2">
      <div className="flex-1 h-1.5 rounded-full bg-bg-1 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${widths[level]}%`, backgroundColor: colors[level] }} />
      </div>
      <span className="text-[10px] font-bold w-20 text-right" style={{ color: colors[level] }}>{labels[level]}</span>
    </div>
  );
}
