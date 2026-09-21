import { Desktop } from "@/components/desktop/Desktop";
import { ProgressProvider } from "@/components/progress/ProgressProvider";

export default function Home() {
  return (
    <ProgressProvider>
      <Desktop />
    </ProgressProvider>
  );
}