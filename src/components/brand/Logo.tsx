import Image from "next/image";
import Link from "next/link";

type LogoProps = {
  href?: string;
  /** icon = mark only; full = mark + wordmark image; wordmark = text next to mark */
  variant?: "icon" | "full" | "wordmark";
  className?: string;
  priority?: boolean;
};

export function Logo({
  href = "/",
  variant = "wordmark",
  className = "",
  priority = false,
}: LogoProps) {
  const content =
    variant === "full" ? (
      <Image
        src="/skilldrem-logo.svg"
        alt="Skilldrem"
        width={180}
        height={48}
        className="h-9 w-auto"
        priority={priority}
      />
    ) : (
      <span className="inline-flex items-center gap-2">
        <Image
          src="/skilldrem-mark.svg"
          alt=""
          width={32}
          height={32}
          className="h-8 w-8 rounded-lg"
          priority={priority}
        />
        {variant === "wordmark" && (
          <span className="font-semibold text-lg tracking-tight text-[#1E3A5F] dark:text-foreground">
            Skilldrem
          </span>
        )}
      </span>
    );

  if (!href) {
    return <span className={className}>{content}</span>;
  }

  return (
    <Link href={href} className={`inline-flex items-center ${className}`} aria-label="Skilldrem home">
      {content}
    </Link>
  );
}
