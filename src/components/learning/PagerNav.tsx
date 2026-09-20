import { XpButton } from "@/components/ui/XpButton";

interface PagerNavProps {
  prevHref?: string;
  nextHref?: string;
  prevLabel?: string;
  nextLabel?: string;
  onPrev?: () => void;
  onNext?: () => void;
  ariaLabelPrefix?: string;
}

/** Prev / Next studs at the bottom of lesson and program views. */
export function PagerNav({
  prevLabel,
  nextLabel,
  onPrev,
  onNext,
  ariaLabelPrefix = "Go to",
}: PagerNavProps) {
  return (
    <nav className="pager-nav" aria-label="Item navigation">
      <XpButton
        disabled={!prevLabel || !onPrev}
        onClick={onPrev}
        aria-label={prevLabel ? `${ariaLabelPrefix} ${prevLabel}` : undefined}
      >
        {prevLabel ? <>&larr; {prevLabel}</> : "\u2190"}
      </XpButton>
      <span className="pager-spacer" aria-hidden="true" />
      <XpButton
        disabled={!nextLabel || !onNext}
        onClick={onNext}
        aria-label={nextLabel ? `${ariaLabelPrefix} ${nextLabel}` : undefined}
      >
        {nextLabel ? <>{nextLabel} &rarr;</> : "\u2192"}
      </XpButton>
    </nav>
  );
}