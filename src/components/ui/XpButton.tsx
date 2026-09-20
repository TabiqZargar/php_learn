import type { ButtonHTMLAttributes } from "react";

interface XpButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  primary?: boolean;
}

/** Classic beveled desktop button. */
export function XpButton({
  primary = false,
  className = "",
  type = "button",
  ...rest
}: XpButtonProps) {
  return (
    <button
      type={type}
      className={`xp-button ${primary ? "xp-button-primary" : ""} ${className}`}
      {...rest}
    />
  );
}