import { Logo } from "@/components/Logo";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <Logo className="size-20 text-foreground" title="Esherify" />
      <h1 className="text-4xl font-semibold tracking-tight">Esherify</h1>
      <p className="max-w-md text-base text-muted-foreground">
        Turn any Droste image into an MC Escher spiral, right in your browser.
      </p>
    </main>
  );
}
