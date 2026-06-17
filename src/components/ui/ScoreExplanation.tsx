interface ScoreExplanationProps {
  outputScore: number;
  capacityScore: number;
  skillScore: number;
  progressionScore: number;
  prodigyScore: number;
}

function ExplanationRow({
  label,
  score,
  description,
  weight,
}: {
  label: string;
  score: number;
  description: string;
  weight: string;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-800 last:border-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-white text-sm font-semibold">{label}</span>
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-xs">{weight}</span>
            <span className="text-orange-400 font-bold text-sm">{score}</span>
          </div>
        </div>
        <p className="text-gray-500 text-xs leading-relaxed">{description}</p>
        <div className="mt-1.5 h-1 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-orange-500/60 rounded-full"
            style={{ width: `${score / 10}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default function ScoreExplanation({
  outputScore,
  capacityScore,
  skillScore,
  progressionScore,
  prodigyScore,
}: ScoreExplanationProps) {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
      <h3 className="text-white font-semibold mb-1">What does this mean?</h3>
      <p className="text-gray-500 text-xs mb-3">
        Prodigy Score = Output×40% + Capacity×25% + Skill×20% + Progression×15%
      </p>
      <ExplanationRow
        label="Output Score"
        score={outputScore}
        weight="40%"
        description="Physics-based power output — how much skill-weighted mechanical work you did per second. Higher load, faster time = higher output."
      />
      <ExplanationRow
        label="Capacity Score"
        score={capacityScore}
        weight="25%"
        description="Sustained work density over time. Longer workouts at high intensity are rewarded. A 30-min workout at 200W beats a 2-min sprint at the same power."
      />
      <ExplanationRow
        label="Skill Score"
        score={skillScore}
        weight="20%"
        description="Movement complexity and variety. Olympic lifts, gymnastics, and diverse movement selections score higher than simple mono-structural work."
      />
      <ExplanationRow
        label="Progression Score"
        score={progressionScore}
        weight="15%"
        description="Improvement vs your baseline. 500 = no change. Above 500 = you beat your previous best or recent trend. Below 500 = regression from baseline."
      />
      <div className="mt-3 pt-3 border-t border-gray-800 flex items-center justify-between">
        <span className="text-white font-bold">Prodigy Score</span>
        <span className="text-orange-400 font-black text-lg">{prodigyScore}</span>
      </div>
    </div>
  );
}
