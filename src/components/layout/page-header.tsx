import { cn } from "@/lib/utils";

/**
 * The header every tab opens with: a small eyebrow, a big title and a line
 * of copy. The aurora behind it comes from the root layout. `children` sits
 * to the right on wide screens, or underneath in the hero.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  children,
  size = "default",
  className,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  size?: "default" | "hero" | "compact";
  className?: string;
}) {
  return (
    <section
      className={cn(
        "relative",
        size === "hero" && "pt-10 pb-4 lg:pt-16",
        size === "default" && "pt-8 pb-2 lg:pt-12",
        size === "compact" && "pt-5 pb-1",
        className,
      )}
    >
      <div className={cn("flex flex-col gap-6", size !== "hero" && "lg:flex-row lg:items-end lg:justify-between")}>
        <div className="flex max-w-3xl flex-col gap-3">
          {eyebrow && (
            <p className="text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-[0.18em] uppercase">
              <span aria-hidden className="bg-primary size-1.5 rounded-full shadow-[0_0_10px] shadow-primary" />
              {eyebrow}
            </p>
          )}
          <h1
            className={cn(
              "font-semibold tracking-tight",
              size === "hero" && "text-4xl leading-[1.05] sm:text-6xl",
              size === "default" && "text-3xl sm:text-5xl",
              size === "compact" && "text-2xl sm:text-3xl",
            )}
          >
            {title}
          </h1>
          {description && (
            <p className={cn("text-muted-foreground max-w-2xl", size === "hero" ? "text-lg" : "text-base")}>
              {description}
            </p>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}
