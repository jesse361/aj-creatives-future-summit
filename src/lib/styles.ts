export const inputClass =
  "mt-2 w-full border border-line bg-white px-3 py-3 text-base text-ink outline-none";

export const labelClass = "block text-sm font-semibold text-ink";

export const buttonClass = (variant: "primary" | "secondary" | "light" | "ghost" | "gold" = "primary", className = "") => {
  const variants = {
    primary: "bg-electric text-white hover:bg-[#2f54e6]",
    secondary: "border border-white/30 text-white hover:border-gold hover:text-gold",
    light: "bg-white text-navy hover:bg-paper",
    ghost: "text-electric hover:bg-electric/10",
    gold: "bg-gold text-navy hover:bg-[#e4c788]",
  };
  return `inline-flex min-h-11 items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`;
};
