import { Movement } from '@/types';

interface MovementCardProps {
  movement: Movement;
  onClick?: () => void;
}

const SKILL_LABELS: Record<string, string> = {
  '1': 'Basic',
  '1.05': 'Basic+',
  '1.1': 'Moderate',
  '1.15': 'Moderate+',
  '1.2': 'Skilled',
  '1.25': 'Skilled+',
  '1.3': 'Advanced',
  '1.35': 'Advanced+',
  '1.4': 'Expert',
  '1.45': 'Expert+',
  '1.5': 'Elite',
};

function skillLabel(coef: number): string {
  return SKILL_LABELS[String(coef)] ?? `${coef}x`;
}

function skillColor(coef: number): string {
  if (coef >= 1.4) return 'text-purple-400 bg-purple-400/10';
  if (coef >= 1.25) return 'text-red-400 bg-red-400/10';
  if (coef >= 1.1) return 'text-orange-400 bg-orange-400/10';
  return 'text-green-400 bg-green-400/10';
}

export default function MovementCard({ movement, onClick }: MovementCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-gray-900 rounded-xl border border-gray-800 p-4 hover:border-gray-700 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-white font-semibold">{movement.name}</h3>
          <p className="text-gray-500 text-xs mt-0.5">
            {movement.movementFamily} · {movement.equipmentType}
          </p>
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${skillColor(movement.skillCoefficient)}`}
        >
          {skillLabel(movement.skillCoefficient)}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {movement.allowedScoreTypes.map((st) => (
          <span key={st} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">
            {st}
          </span>
        ))}
      </div>
    </button>
  );
}
