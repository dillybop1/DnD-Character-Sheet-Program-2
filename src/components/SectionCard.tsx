import type { PropsWithChildren } from "react";

interface SectionCardProps extends PropsWithChildren {
  title: string;
  subtitle?: string;
  className?: string;
}

export function SectionCard({ title, subtitle, className, children }: SectionCardProps) {
  return (
    <section className={`section-card ${className ?? ""}`.trim()}>
      <header className="section-card__header">
        <div>
          <p className="section-card__eyebrow">{subtitle ?? "Dynamic panel"}</p>
          <h2>{title}</h2>
        </div>
      </header>
      <div className="section-card__body">{children}</div>
    </section>
  );
}
