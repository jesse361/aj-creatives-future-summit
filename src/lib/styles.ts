export const inputClass =
  "mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 text-base text-navy outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric-deep";

export const labelClass = "block text-sm font-semibold text-navy";

export const buttonClass = (variant: "primary" | "secondary" | "light" | "ghost" = "primary", className = "") => {
  const variants = {
    primary: "bg-electric-deep text-white hover:bg-[#243fba]",
    secondary: "border border-white/25 text-white hover:bg-white/10",
    light: "bg-white text-navy hover:bg-paper",
    ghost: "text-electric-deep hover:bg-electric/10",
  };
  return `inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold tracking-wide transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric-deep disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`;
};
