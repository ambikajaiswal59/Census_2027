import useCountUp from '../hooks/useCountUp.js'

export default function StatCard({ icon, value, label }) {
  const displayValue = useCountUp(value)

  return (
    <div className="flex items-center gap-2.5 rounded-[9px] border border-[#E3E9F0] bg-[#F9FBFD] p-2.5">
      <div className="grid h-[30px] w-[30px] flex-shrink-0 place-items-center rounded-lg bg-blue2 text-[20px] font-extrabold text-blue">
        <i className={`ti ${icon}`} />
      </div>
      <div>
        <b className="block font-serif text-[22px] leading-none text-navy">{displayValue}</b>
        <span className="mt-[3px] block text-[10px] text-muted">{label}</span>
      </div>
    </div>
  )
}