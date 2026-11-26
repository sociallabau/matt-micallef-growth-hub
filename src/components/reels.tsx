import { instagramEmbed } from "@/lib/format";

// Instagram's embed is a white header, a 4:5 media box, then a white footer.
// We zoom the iframe so the 9:16 video fills a 9:16 frame and slide the header
// out of view; overflow-hidden crops the rest.
const MEDIA_ZOOM = 16 / 9 / 1.25; // ≈1.42
const EMBED_HEADER_PX = 54;

export function Reels({ urls }: { urls: string[] }) {
  if (!urls.length) return <p className="text-sm text-muted">No top content added yet.</p>;
  return (
    <div className="grid justify-items-center gap-5 sm:grid-cols-2 sm:justify-items-stretch lg:grid-cols-3">
        {urls.map((url, i) => {
          const embed = instagramEmbed(url);
          return (
            <article key={url} className="glow w-full max-w-[360px] overflow-hidden rounded-xl border">
              <div className="relative aspect-[9/16] overflow-hidden bg-black">
                {embed ? (
                  <iframe
                    src={embed}
                    title={`Top performing post ${i + 1}`}
                    loading="lazy"
                    scrolling="no"
                    allowFullScreen
                    className="absolute border-0"
                    style={{
                      width: `${MEDIA_ZOOM * 100}%`,
                      left: `${((1 - MEDIA_ZOOM) / 2) * 100}%`,
                      top: -EMBED_HEADER_PX,
                      height: `calc(100% + ${EMBED_HEADER_PX + 400}px)`,
                    }}
                  />
                ) : (
                  <a href={url} target="_blank" rel="noreferrer" className="grid h-full place-items-center p-4 text-sm text-white underline">
                    View post
                  </a>
                )}
                <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
                  #{i + 1}
                </span>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute right-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-xs text-white backdrop-blur hover:bg-black"
                >
                  Open ↗
                </a>
              </div>
            </article>
          );
        })}
    </div>
  );
}
