export default function Button({
  href,
  onClick,
  variant = 'primary',
  children,
  target,
  id,
  className = '',
}) {
  const base =
    'btn-shimmer inline-flex items-center lg:mt-2 gap-2 rounded-full px-1 py-0 lg:px-2 lg:py-1  text-[10px] lg:text-[13px] font-bold border-2 cursor-pointer transition-[background,border-color,color,transform,box-shadow] duration-300'
  const variants = {
    primary:
      'bg-blue border-blue text-white hover:bg-transparent hover:text-blue hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(29,95,167,.22),inset_0_0_0_1px_rgba(29,95,167,.06)]',
    secondary:
      'bg-white border-line text-navy hover:bg-transparent hover:border-blue hover:text-blue hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(29,95,167,.22),inset_0_0_0_1px_rgba(29,95,167,.06)]',
  }

  const content = (
    <>
      <span className="relative z-[2] transition-transform duration-300 group-hover:translate-x-1">
        {children}
      </span>
    </>
  )

  const classes = `${base} ${variants[variant]} ${className} group`

  if (href) {
    return (
      <a href={href} target={target} id={id} onClick={onClick} className={classes}>
        {content}
      </a>
    )
  }

  return (
    <button id={id} onClick={onClick} className={classes} type="button">
      {content}
    </button>
  )
}
