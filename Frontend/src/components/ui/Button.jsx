import { cn } from '../../utils/classNames';

function Button({ className = '', variant = 'primary', children, ...props }) {
  const variants = {
    primary: 'bg-cyan-400 text-slate-950 hover:bg-cyan-300',
    secondary: 'border border-white/10 bg-white/5 text-white hover:bg-white/10',
    ghost: 'text-slate-300 hover:bg-white/5 hover:text-white',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-300/60 focus:ring-offset-2 focus:ring-offset-slate-950',
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;