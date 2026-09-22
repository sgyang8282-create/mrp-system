import { Construction } from "lucide-react";

export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <Construction className="h-8 w-8 text-fg-muted" strokeWidth={1.5} />
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="max-w-md text-sm text-fg-muted">{description}</p>
    </div>
  );
}
