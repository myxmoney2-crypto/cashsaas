import { Header } from "@/components/Header";
import { QuestionnaireEntry } from "@/components/QuestionnaireEntry";

export default async function QuestionnairePage(props: PageProps<"/questionnaire">) {
  const { reprise } = await props.searchParams;

  return (
    <div className="w-full flex flex-col items-center">
      <Header />
      <QuestionnaireEntry resume={reprise === "1"} />
    </div>
  );
}
