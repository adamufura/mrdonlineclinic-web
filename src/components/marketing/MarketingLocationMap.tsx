const MAP_QUERY = 'Abba Saude House, Katsina, Nigeria';
const MAP_EMBED_SRC = `https://maps.google.com/maps?q=${encodeURIComponent(MAP_QUERY)}&hl=en&z=16&output=embed`;

export function MarketingLocationMap() {
  return (
    <section aria-labelledby="marketing-map-heading" className="border-t border-brand-stroke-soft bg-white">
      <div className="mx-auto w-full max-w-site px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
        <div className="text-center">
          <h2 id="marketing-map-heading" className="text-2xl font-extrabold text-brand-navy lg:text-[1.65rem]">
            Find us on the map
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-brand-body sm:text-base">
            {MAP_QUERY}
          </p>
        </div>
        <div className="mt-8 overflow-hidden rounded-2xl border border-brand-stroke-soft bg-brand-landing/40 shadow-sm ring-1 ring-brand-stroke-soft/60">
          <iframe
            title="MRD Online Clinic — Abba Saude House, Katsina, Nigeria on Google Maps"
            src={MAP_EMBED_SRC}
            className="block h-80 w-full border-0 sm:h-96 lg:h-[26rem]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
        <p className="mt-4 text-center text-sm">
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(MAP_QUERY)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-brand-hero-blue underline-offset-4 hover:text-brand-navy hover:underline"
          >
            Open in Google Maps
          </a>
        </p>
      </div>
    </section>
  );
}
