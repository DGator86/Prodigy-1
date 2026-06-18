import { getScoreLevel } from '@/types';

interface ScoreBadgeProps {
  score: number;
  showLevel?: boolean;
}

export default function ScoreBadge({ score, showLevel = false }: ScoreBadgeProps) {
  const bgColor =
    score >= 975
      ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
      : score >= 925
        ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
        : score >= 850
          ? 'bg-orange-500/20 text-orange-300 border-orange-500/30'
          : score >= 750
            ? 'bg-red-500/20 text-red-300 border-red-500/30'
            : score >= 600
              ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
              : score >= 400
                ? 'bg-green-500/20 text-green-300 border-green-500/30'
                : score >= 200
                  ? 'bg-teal-500/20 text-teal-300 border-teal-500/30'
                  : 'bg-gray-800 text-gray-400 border-gray-700';

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${bgColor}`}>
      {score}
      {showLevel && <span className="opacity-70">· {getScoreLevel(score)}</span>}
    </span>
  );
}
