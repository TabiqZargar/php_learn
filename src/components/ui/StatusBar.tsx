interface StatusBarProps {
  left?: string;
  right?: string;
}

export function StatusBar({ left, right }: StatusBarProps) {
  return (
    <footer className="status-bar">
      <span>{left}</span>
      <span>{right}</span>
      <span className="status-bar-grip" aria-hidden="true" />
    </footer>
  );
}