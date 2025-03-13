import ComercioClasse from '@/components/ComercioClasse';

export default function ComercioClassePage({
  params,
}: {
  params: { classe: string };
}) {
  return <ComercioClasse classe={params.classe} />;
}
