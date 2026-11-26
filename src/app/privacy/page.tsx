import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export const metadata = {
  title: "Privacy",
  description: "Skilldrem privacy policy overview.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border sticky top-0 bg-background/80 backdrop-blur z-40">
        <div className="mx-auto max-w-3xl h-14 flex items-center px-4">
          <Logo variant="wordmark" />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-12 prose prose-neutral dark:prose-invert">
        <h1>Privacy</h1>
        <p>
          Skilldrem stores account and learning data needed to run the product: profile details, preferences,
          saved roadmaps, progress, and AI conversation history associated with your account.
        </p>
        <p>
          Authentication may be provided by configured identity providers. AI features send prompts to third-party
          model providers under their terms. We do not sell personal learning data.
        </p>
        <p>
          You may request account deletion and export of personal learning data through the product or by contacting
          the operator. This page is a product baseline and should be reviewed by counsel before public launch.
        </p>
        <p>
          <Link href="/">← Home</Link>
        </p>
      </main>
    </div>
  );
}
