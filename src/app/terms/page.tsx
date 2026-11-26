import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export const metadata = {
  title: "Terms",
  description: "Skilldrem terms of use overview.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border sticky top-0 bg-background/80 backdrop-blur z-40">
        <div className="mx-auto max-w-3xl h-14 flex items-center px-4">
          <Logo variant="wordmark" />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-12 prose prose-neutral dark:prose-invert">
        <h1>Terms of use</h1>
        <p>
          Skilldrem provides learning guidance and links to third-party educational resources. External sites set their
          own pricing, availability and terms. AI-generated plans and explanations can be wrong; verify important
          facts on official sources.
        </p>
        <p>
          Users must not use the service to facilitate copyright infringement or to submit unlawful content. The
          operators may remove content or restrict accounts that abuse the platform or AI endpoints.
        </p>
        <p>
          These terms are a product baseline and should be finalized with legal review before wide public launch.
        </p>
        <p>
          <Link href="/">← Home</Link>
        </p>
      </main>
    </div>
  );
}
