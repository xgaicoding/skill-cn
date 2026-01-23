import DetailPage from "@/components/detail/DetailPage";

export default function Page({ params }: { params: { id: string } }) {
  return <DetailPage id={params.id} />;
}
