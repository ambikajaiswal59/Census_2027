export default function StatCard({ icon, value, label }) {
  return (
    <div className="flex items-center gap-2.5 rounded-[9px] border border-[#E3E9F0] bg-[#F9FBFD] p-2.5">
      <div className="grid h-[30px] w-[30px] flex-shrink-0 place-items-center rounded-lg bg-blue2 text-[20px] font-extrabold text-blue">
        <i className={`ti ${icon}`} />
      </div>
      <div>
        <b className="block font-serif text-[22px] leading-none text-navy">{value}</b>
        <span className="mt-[3px] block text-[10px] text-muted">{label}</span>
      </div>
    </div>
  )
}
