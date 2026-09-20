import type { Metadata } from "next";
import { ComputingScreen } from "@/components/ComputingScreen";

export const metadata: Metadata = {
  title: "Calcul en cours",
  robots: { index: false, follow: false },
};

export default function CalculPage() {
  return (
    <div className="w-full flex flex-col items-center">
      <ComputingScreen />
    </div>
  );
}
