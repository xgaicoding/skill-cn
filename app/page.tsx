import HomePage from "@/components/home/HomePage";

export default function Page({
  searchParams,
}: {
  searchParams?: { q?: string; tag?: string; sort?: string };
}) {
  return <HomePage initial={searchParams || {}} />;
}
