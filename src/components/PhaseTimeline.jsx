import PhaseCard from './PhaseCard.jsx'
import { phaseData } from '../data/phaseData.js'

export default function PhaseTimeline({ onOpenPhase }) {
  return (
    <div className="mb-[30px] flex flex-col gap-0">
      {phaseData.map((phase, i) => (
        <PhaseCard
          key={phase.title}
          phase={phase}
          index={i}
          isLast={i === phaseData.length - 1}
          onShowMore={() => onOpenPhase(i)}
        />
      ))}
    </div>
  )
}
