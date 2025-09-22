import React, { useEffect, useRef, useState } from 'react';

// Simple intersection observer hook to reveal sections on scroll
function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setVisible(true)),
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, visible } as const;
}

const ASSET_BASE = 'http://127.0.0.1:8000/assets';
const heroBg = `${ASSET_BASE}/Rumtek/rumtek-monastery.jpg`;

export default function Home() {
  const sections = [
    { key: 'records' },
    { key: 'festivals' },
    { key: 'routes' },
    { key: 'virtual' },
    { key: 'why' },
  ];

  return (
    <div className="min-h-screen bg-[#faf7f2] text-gray-900">
      {/* Hero */}
      <section
        className="relative h-[72vh] md:h-[78vh] w-full overflow-hidden"
        aria-label="Hero"
      >
        <img
          src={heroBg}
          alt="Sikkim Monastery"
          className="absolute inset-0 h-full w-full object-cover scale-105 animate-[slow-zoom_18s_ease-in-out_infinite_alternate]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />
        <div className="relative z-10 mx-auto flex h-full max-w-7xl items-center px-6">
          <div className="max-w-2xl text-white">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-sm">Discover Sikkim</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight drop-shadow-xl">
              Explore the Spiritual
              <br />
              Heritage of Sikkim
            </h1>
            <p className="mt-4 text-lg md:text-xl text-white/90">
              Immerse yourself in monasteries, rituals, archives and virtual pilgrimages.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#explore"
                className="rounded-lg bg-amber-500 px-5 py-2.5 text-white shadow hover:bg-amber-600 transition"
              >
                Explore Now
              </a>
              <a
                href="#records"
                className="rounded-lg bg-white/15 px-5 py-2.5 text-white shadow hover:bg-white/25 transition"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>
        {/* Floating cards parallax */}
        <div className="pointer-events-none absolute inset-x-0 bottom-10 hidden md:flex justify-center gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 w-36 rounded-xl bg-white/85 shadow-lg backdrop-blur border border-white/60 animate-[float_6s_ease-in-out_infinite]"
              style={{ animationDelay: `${i * 0.8}s` as any }}
            />
          ))}
        </div>
      </section>

      {/* Explore Monasteries */}
      <section id="explore" className="mx-auto max-w-7xl px-6 py-14">
        <header className="mb-6">
          <h2 className="text-2xl md:text-3xl font-semibold">Explore Monasteries</h2>
        </header>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {[
            `${ASSET_BASE}/Rumtek/rumtek-monastery.jpg`,
            `${ASSET_BASE}/Pemangytse/Front_view_of_Pemayangtse_monastery.jpg`,
            `${ASSET_BASE}/Tashiding/Tashiding-Monastery-.jpg`,
            `${ASSET_BASE}/Rumtek/Vikramjit-Kakati-Rumtek.jpg`,
            `${ASSET_BASE}/Pemangytse/Entrance_to_Pemangytse_Gompa.jpg`,
          ].map((src, idx) => (
            <div
              key={src}
              className="group relative aspect-square overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
            >
              <img
                src={src}
                alt={`Monastery ${idx + 1}`}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            </div>
          ))}
        </div>
      </section>

      {/* Content Sections */}
      <ContentBlock
        id="records"
        title="Monastic Records"
        text="Browse repositories of wisdom preserved in manuscripts, murals and sacred art."
        cta="Explore Now"
        image={`${ASSET_BASE}/Rumtek/Rumtek_Monastery_-_Inside_Close_View.jpg`}
      />
      <ContentBlock
        id="festivals"
        title="Monastic Festivals"
        text="Celebrate the monastic traditions and vibrant festivals of Sikkim."
        cta="Discover More"
        image={`${ASSET_BASE}/Tashiding/tashiding-monastery-pelling-sikkim-1-attr-hero.jpeg`}
        reverse
      />
      <ContentBlock
        id="routes"
        title="Pilgrimage Routes"
        text="Plan your spiritual journey across monasteries, scenic valleys and rivers."
        cta="Plan Route"
        image={`${ASSET_BASE}/Tashiding/Yuksom_near_Tashiding_Monastery_cb70e35f2e.webp`}
      />
      <ContentBlock
        id="virtual"
        title="Virtual Pilgrimage"
        text="Experience the sacred ambience through immersive 360° journeys."
        cta="Begin a Tour"
        image={`${ASSET_BASE}/Tashiding/ae4b46d50598b5ab7d3ec2ea2841bf7e_1000x1000.jpg`}
        reverse
      />

      {/* Why Monastery360 */}
      <WhyBlock />

      {/* Footer */}
      <Footer />

      {/* Keyframes */}
      <style>{`
        @keyframes float { 0%{transform:translateY(0)} 50%{transform:translateY(-10px)} 100%{transform:translateY(0)} }
        @keyframes slow-zoom { from { transform: scale(1.08); } to { transform: scale(1.0); } }
      `}</style>
    </div>
  );
}
type ContentProps = {
  id: string;
  title: string;
  text: string;
  cta: string;
  image: string;
  reverse?: boolean;
};

function ContentBlock({ id, title, text, cta, image, reverse }: ContentProps) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <section id={id} ref={ref} className="mx-auto max-w-7xl px-6 py-12">
      <div
        className={
          'grid grid-cols-1 md:grid-cols-2 gap-8 items-center rounded-2xl border border-gray-200 bg-white p-4 md:p-6 shadow-sm ' +
          (visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6') +
          ' transition-all duration-700'
        }
      >
        <div className={(reverse ? 'md:order-2' : '') + ' overflow-hidden rounded-xl'}>
          <img
            src={image}
            alt={title}
            className="h-full w-full max-h-[380px] object-cover transition-transform duration-700 hover:scale-[1.03]"
            loading="lazy"
          />
        </div>
        <div className={reverse ? 'md:order-1' : ''}>
          <h3 className="text-2xl md:text-3xl font-semibold tracking-tight">{title}</h3>
          <p className="mt-2 text-gray-600 md:text-lg">{text}</p>
          <div className="mt-5">
            <a
              href={`#${id}`}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-white shadow hover:bg-amber-600 transition"
            >
              {cta}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function WhyBlock() {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <section id="why" ref={ref} className="mx-auto max-w-7xl px-6 py-14">
      <h3 className="text-2xl md:text-3xl font-semibold">Why monastery 360?</h3>
      <p className="mt-2 max-w-2xl text-gray-600">
        Bringing spiritual heritage to life with accessible, curated and immersive journeys.
      </p>
      <div className={(visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6') + ' mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 transition-all duration-700'}>
        {[
          { title: 'Virtual Tours', icon: '🧭' },
          { title: 'Rich Archives', icon: '📜' },
          { title: 'Cultural Events', icon: '🎎' },
          { title: 'Modern UI', icon: '✨' },
        ].map((it) => (
          <div key={it.title} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition">
            <div className="text-3xl">{it.icon}</div>
            <div className="mt-2 text-sm font-medium">{it.title}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="mt-10 border-t border-gray-200 bg-white/70">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 py-10 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-8 w-8 rounded bg-amber-500" />
            <span className="text-lg font-semibold">Monastery360</span>
          </div>
          <p className="mt-3 text-sm text-gray-600">
            Explore monasteries, archives and spiritual journeys across Sikkim.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold tracking-wide">Explore</h4>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            <li><a href="#explore" className="hover:text-gray-900">Monasteries</a></li>
            <li><a href="#records" className="hover:text-gray-900">Records</a></li>
            <li><a href="#festivals" className="hover:text-gray-900">Festivals</a></li>
            <li><a href="#routes" className="hover:text-gray-900">Routes</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold tracking-wide">Resources</h4>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            <li><a href="http://127.0.0.1:8000/docs" target="_blank" className="hover:text-gray-900" rel="noreferrer">API Docs</a></li>
            <li><a href="#" className="hover:text-gray-900">Guides</a></li>
            <li><a href="#" className="hover:text-gray-900">Support</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold tracking-wide">Sign up for updates</h4>
          <form className="mt-3 flex gap-2">
            <input type="email" placeholder="you@example.com" className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400" />
            <button type="submit" className="rounded-lg bg-amber-500 px-4 py-2 text-white hover:bg-amber-600">Join</button>
          </form>
        </div>
      </div>
      <div className="border-t border-gray-200 py-5 text-center text-sm text-gray-500">
        {new Date().getFullYear()} Monastery360 • Built with ❤️
      </div>
    </footer>
  );
}