import { Header } from "@/components/Header";
import { QuestionnaireFlow } from "@/components/QuestionnaireFlow";

export default function QuestionnairePage() {
  return (
    <div className="w-full flex flex-col items-center">
      <Header />
      <QuestionnaireFlow />
    </div>
  );
}
