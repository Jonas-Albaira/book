import type { CoverConfig } from "@/lib/types";

interface Props {
  title: string;
  subtitle?: string;
  author?: string;
  cfg: CoverConfig;
  className?: string;
}

/** CSS-rendered cover. `template` picks one of several layouts; sizes scale with the cover width. */
export function Cover({ title, subtitle, author, cfg, className = "" }: Props) {
  const font = cfg.font === "serif" ? "font-serif" : "font-sans";
  const base = `relative aspect-[2/3] overflow-hidden rounded-l-sm rounded-r-md shadow-[6px_8px_24px_rgba(0,0,0,0.25)] ${font} ${className}`;
  const style = { background: cfg.bg, color: cfg.fg, containerType: "inline-size" } as React.CSSProperties;
  const long = title.length > 40 ? 2 : title.length > 24 ? 1 : 0;
  const T = { fontSize: ["11cqw", "9cqw", "7.5cqw"][long], lineHeight: 1.05 };
  const S = { fontSize: "4.2cqw", lineHeight: 1.35 };
  const A = { fontSize: "4.4cqw" };
  const spine = <div className="absolute inset-y-0 left-0 w-[4%] bg-black/15" />;

  if (cfg.image) {
    // AI art, full bleed. Unless the art is already lettered, overlay the text on soft scrims for legibility.
    return (
      <div className={base} style={style}>
        {/* eslint-disable-next-line @next/next/no-img-element -- data URL, nothing for next/image to optimise */}
        <img src={cfg.image} alt={title} className="absolute inset-0 h-full w-full object-cover" />
        {spine}
        {!cfg.imageText && (
          <>
            <div className="absolute inset-x-0 top-0 h-1/2 bg-linear-to-b from-black/55 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-1/4 bg-linear-to-t from-black/55 to-transparent" />
            <div className="relative flex h-full flex-col items-center justify-between p-[9%] text-center drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
              <div>
                <div className="font-bold" style={T}>{title}</div>
                <div className="mx-auto my-[5%] h-[2px] w-1/4" style={{ background: cfg.accent }} />
                <div className="opacity-90" style={S}>{subtitle}</div>
              </div>
              <div className="font-semibold uppercase tracking-[0.2em]" style={A}>{author}</div>
            </div>
          </>
        )}
      </div>
    );
  }

  switch (cfg.template % 4) {
    case 0: // centred with rule
      return (
        <div className={base} style={style}>
          {spine}
          <div className="flex h-full flex-col items-center justify-between p-[9%] text-center">
            <div className="uppercase tracking-[0.25em] opacity-70" style={A}>{author}</div>
            <div>
              <div className="font-bold" style={T}>{title}</div>
              <div className="mx-auto my-[6%] h-[2px] w-1/3" style={{ background: cfg.accent }} />
              <div className="opacity-85" style={S}>{subtitle}</div>
            </div>
            <div className="h-[8%] w-[8%] rotate-45" style={{ background: cfg.accent }} />
          </div>
        </div>
      );
    case 1: // colour block
      return (
        <div className={base} style={style}>
          {spine}
          <div className="absolute -right-[20%] -top-[10%] h-[70%] w-[90%] rounded-full opacity-90" style={{ background: cfg.accent }} />
          <div className="absolute inset-x-0 bottom-0 p-[9%]">
            <div className="font-black" style={T}>{title}</div>
            <div className="mt-[4%] opacity-85" style={S}>{subtitle}</div>
            <div className="mt-[8%] font-semibold uppercase tracking-widest" style={A}>{author}</div>
          </div>
        </div>
      );
    case 2: // band
      return (
        <div className={base} style={style}>
          {spine}
          <div className="absolute inset-x-0 top-[38%] h-[24%]" style={{ background: cfg.accent }} />
          <div className="flex h-full flex-col justify-between p-[9%]">
            <div className="font-bold uppercase" style={{ ...T, fontSize: ["10cqw", "7.5cqw", "6cqw"][long] }}>{title}</div>
            <div>
              <div className="opacity-85" style={S}>{subtitle}</div>
              <div className="mt-[6%] font-semibold" style={A}>{author}</div>
            </div>
          </div>
        </div>
      );
    default: // frame
      return (
        <div className={base} style={style}>
          {spine}
          <div className="absolute inset-[6%] border-2" style={{ borderColor: cfg.accent }} />
          <div className="flex h-full flex-col items-center justify-center gap-[5%] p-[14%] text-center">
            <div style={{ ...A, color: cfg.accent }}>✦ ✦ ✦</div>
            <div className="font-semibold italic" style={T}>{title}</div>
            <div className="opacity-85" style={S}>{subtitle}</div>
            <div className="mt-[6%] uppercase tracking-[0.2em]" style={A}>{author}</div>
          </div>
        </div>
      );
  }
}
