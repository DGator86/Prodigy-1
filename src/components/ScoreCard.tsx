import { getScoreLevel, getScoreLevelColor } from '@/types';

interface ScoreCardProps {
  label: string;
  score: number;
  description?: string;
  large?: boolean;
}

export default function ScoreCard({ label, score, description, large }: ScoreCardProps) {
  const level = getScoreLevel(score);
  const colorClass = getScoreLevelColor(score);
  const percentage = score / 10;

  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
      <p className="text-gray-400 text-sm font-medium mb-1">{label}</p>
      <div className={`font-black ${large ? 'text-5xl' : 'text-4xl'} ${colorClass}`}>
        {score}
        <span className="text-gray-600 text-lg font-normal">/1000</span>
      </div>
      <p className={`text-sm font-semibold mt-1 ${colorClass}`}>{level}</p>
      {description && <p className="text-gray-500 text-xs mt-1">{description}</p>}
      {/* progress bar */}
      <div className="mt-3 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
