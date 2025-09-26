import React, { useEffect, useMemo, useState } from 'react';
import '../styles/tour-animations.css';
import MapRouteViewer from '../components/MapRouteViewer';
import CesiumGlobeViewer from '../components/CesiumGlobeViewer';
import Monastery3DDemo from '../components/Monastery3DDemo';
import PanoramaViewer from '../components/PanoramaViewer';
import { aiRoute, fetchMonasteries, type Monastery, type RoutePathPoint, type RouteStep } from '../lib/api';
// Tour landing page converted from "tour page/index.html"
// Uses Tailwind classes already available in the project
export default function TourLanding() {
  // Scroll reveal for [data-reveal] elements
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('reveal--visible');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    nodes.forEach(n => io.observe(n));
    return () => io.disconnect();
  }, []);
  // ---- Mini planner state (Leaflet) ----
  const [question, setQuestion] = useState('Best 90-minute walking route to explore');
  const [duration, setDuration] = useState(90);
  const [mode, setMode] = useState<'foot' | 'bike' | 'car'>('foot');
  const [steps, setSteps] = useState<RouteStep[]>([]);
  const [path, setPath] = useState<RoutePathPoint[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [monasteries, setMonasteries] = useState<Monastery[]>([]);
  const [useCesium, setUseCesium] = useState(false);
  const [threeMode, setThreeMode] = useState<'3d' | 'pano'>('3d');
  const [globeFailed, setGlobeFailed] = useState(false);

  const SIKKIM_STATION = { lat: 27.3389, lng: 88.6065 };

  useEffect(() => {
    let mounted = true;
    fetchMonasteries().then((data: Monastery[]) => { if (mounted) setMonasteries(data || []); }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  async function handlePlanMini(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await aiRoute({ question, duration_minutes: duration, start_lat: SIKKIM_STATION.lat, start_lng: SIKKIM_STATION.lng, transport_mode: mode });
      setSteps(res.steps || []);
      setPath(res.path || null);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  const markers = useMemo(() => {
    const points = (monasteries || [])
      .map((m) => {
        const lat = m?.info?.coordinates?.lat;
        const lng = m?.info?.coordinates?.lng;
        if (typeof lat === 'number' && typeof lng === 'number') {
          return { lat, lng, title: m.name };
        }
        return null;
      })
      .filter(Boolean) as Array<{ lat: number; lng: number; title?: string }>;
    points.unshift({ lat: SIKKIM_STATION.lat, lng: SIKKIM_STATION.lng, title: 'Sikkim Station (Start)' });
    // Add a fallback selection of notable monasteries in Sikkim for a richer 3D view
    const demo: Array<{ lat: number; lng: number; title: string }> = [
      { title: 'Rumtek Monastery', lat: 27.3175, lng: 88.6200 },
      { title: 'Pemayangtse Monastery', lat: 27.3006, lng: 88.2338 },
      { title: 'Tashiding Monastery', lat: 27.2516, lng: 88.2901 },
    ];
    const existingTitles = new Set(points.map(p => p.title));
    if (points.length < 3) {
      demo.forEach(d => { if (!existingTitles.has(d.title)) points.push(d); });
    }
    return points;
  }, [monasteries]);

  // Pick a panorama from monastery media if available
  const panoUrl = useMemo(() => {
    for (const m of monasteries) {
      const media = (m.media || []) as any[];
      const pano = media.find(x => (x.type === 'panorama' || /pano/i.test(x.type || '')) && x.file_url);
      if (pano && pano.file_url) return pano.file_url as string;
    }
    return 'https://pannellum.org/images/alma.jpg';
  }, [monasteries]);
  return (
    <div className="font-sans">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-30">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-28">
            {/* Logo */}
            <div className="flex-shrink-0">
              <a href="#">
                <img className="h-28 w-28" src="/assets/3cd372d8af4fd08304ef8109871a76a52d77bb08.png" alt="Logo" />
              </a>
            </div>
            {/* Navigation */}
            <nav className="hidden md:flex md:items-center md:space-x-16">
              <a href="/" className="text-2xl text-white hover:text-gray-300">Home</a>
              <a href="#section-tours" className="text-2xl text-white hover:text-gray-300">Tour</a>
              <a href="#section-explore" className="text-2xl text-white hover:text-gray-300">Map</a>
              <a href="#section-guides" className="text-2xl text-white hover:text-gray-300">Events</a>
            </nav>
            {/* Auth */}
            <div className="hidden md:flex items-center space-x-6">
              <a href="#" className="text-2xl text-gray-50 bg-white/10 backdrop-blur-sm rounded-lg px-8 py-3 hover:bg-white/20">Login</a>
              <a href="#">
                <img src="/assets/I242_444_242_441.svg" alt="User Profile" className="h-9 w-7" />
              </a>
            </div>
            {/* Mobile menu button (static) */}
            <div className="md:hidden">
              <button className="text-white focus:outline-none" aria-label="Open menu">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section id="section-hero" className="relative h-[885px] flex items-center justify-center text-center overflow-hidden tour-hero-zoom">
        <div className="absolute inset-0 z-0">
          <img src="/assets/48add54116442011f5b2f444b88b996935844cb5.png" alt="Himalayan mountains" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/30"></div>
        </div>
        <div className="relative z-10 px-4" data-reveal>
          <h1 className="font-montserrat font-semibold text-6xl md:text-7xl bg-gradient-to-br from-black to-gray-600 bg-clip-text text-transparent tour-hero-title">
            Find Monasteries & <br /> Plan Your Journey
          </h1>
        </div>
      </section>

      {/* Explore & Navigate */}
      <section id="section-explore" className="bg-brand-dark py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-screen-2xl mx-auto" data-reveal>
          <h2 className="font-montserrat text-5xl font-medium text-white mb-6">Explore & Navigate</h2>
          <div className="bg-white/10 backdrop-blur-2xl rounded-[24px] w-full p-4">
            <div className="bg-white rounded-2xl p-4">
              {useCesium ? (
                threeMode === '3d' ? (
                  <div className="space-y-6">
                    <CesiumGlobeViewer
                      steps={steps}
                      markers={markers}
                      path={path || undefined}
                      onFailFallback={() => { setThreeMode('pano'); setGlobeFailed(true); }}
                    />
                    <Monastery3DDemo />
                  </div>
                ) : (
                  <PanoramaViewer imageUrl={panoUrl} />
                )
              ) : (
                <MapRouteViewer steps={steps} markers={markers} path={path || undefined} transportMode={mode} />
              )}
            </div>
            {globeFailed && useCesium && (
              <div className="mt-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                3D globe could not load from the CDN. Showing panorama instead.
              </div>
            )}
            <form onSubmit={handlePlanMini} className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What would you like to see?"
                className="col-span-2 rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <input
                type="number"
                value={duration}
                min={20}
                max={240}
                onChange={(e) => setDuration(parseInt(e.target.value || '90', 10))}
                className="rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="Duration (minutes)"
              />
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as any)}
                className="rounded-lg border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="foot">Walking</option>
                <option value="bike">Bike</option>
                <option value="car">Car</option>
              </select>
              <button type="submit" disabled={loading} className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-60 md:col-span-1">
                {loading ? 'Planning…' : 'Plan Route'}
              </button>
            </form>
            {error && <div className="text-red-600 mt-2">{error}</div>}
            {/* Voice assistant removed (now handled by Voiceflow widget) */}
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
            <button className="w-full sm:w-auto bg-white/10 backdrop-blur-sm rounded-2xl px-8 py-4 flex items-center justify-center gap-4 text-white text-3xl font-montserrat hover:bg-white/20">
              <span>Filters</span>
              <img src="/assets/132_51.svg" alt="dropdown arrow" className="w-7 h-auto border-2 border-white" />
            </button>
            <a className="w-full sm:w-auto bg-accent-green rounded-2xl px-8 py-4 text-black text-3xl font-montserrat hover:opacity-90" href="https://maps.google.com" target="_blank" rel="noreferrer">
              Open in Maps
            </a>
            <button onClick={() => { setUseCesium((v) => !v); setTimeout(() => { document.getElementById('section-explore')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 10); }} className="w-full sm:w-auto bg-white/10 backdrop-blur-sm rounded-2xl px-8 py-4 text-white text-3xl font-montserrat hover:bg-white/20">
              {useCesium ? 'Use 2D Map' : 'Use 3D View'}
            </button>
            {useCesium && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button onClick={() => setThreeMode('3d')} className={`flex-1 sm:flex-none rounded-2xl px-6 py-3 text-white text-2xl font-montserrat border ${threeMode==='3d' ? 'bg-white/20 border-white' : 'bg-white/10 border-white/30'} hover:bg-white/20`}>3D</button>
                <button onClick={() => setThreeMode('pano')} className={`flex-1 sm:flex-none rounded-2xl px-6 py-3 text-white text-2xl font-montserrat border ${threeMode==='pano' ? 'bg-white/20 border-white' : 'bg-white/10 border-white/30'} hover:bg-white/20`}>Panorama</button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Travel & Tours */}
      <section id="section-tours" className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="/assets/e485ba38f625428ee4da234ab001b99ea4ebf8a5.png" alt="Landscape" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/50"></div>
        </div>
        <div className="relative z-10 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8" data-reveal>
          <h2 className="font-montserrat text-5xl font-medium text-white mb-12">Travel & Tours</h2>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Tours grid */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-8">
              {[
                {src: '/assets/562eb0dfddf4a58d81d6da2f05c95ed48059bf36.png', title: 'Eastern Mystery Tour'},
                {src: '/assets/1638bb17c2b86a0c078def8be7de50b7021fa6b6.png', title: 'Gangtok with Pelling Tour'},
                {src: '/assets/02cf9150c45f9efb17d537e5785ff3107c180139.png', title: 'Best of Gangtok'},
                {src: '/assets/a2450759057f2f59bc87e0234332c7e80058c2cc.png', title: 'Unique Himalaya'},
                {src: '/assets/84fa41f91c7851647eecf4640150606fe3b2efd8.png', title: 'Treasures of Sikkim Tour'},
                {src: '/assets/fe938264a4b93c74953839f313ef841742961de0.png', title: 'North Sikkim Tour'},
              ].map(card => (
                <div key={card.src} className="bg-white/10 backdrop-blur-md rounded-2xl p-3 tour-card">
                  <img src={card.src} alt={card.title} className="rounded-lg w-full h-48 object-cover mb-4" />
                  <h3 className="font-montserrat text-2xl font-semibold text-white px-2">{card.title}</h3>
                </div>
              ))}
            </div>
            {/* Route Map */}
            <div className="lg:col-span-5 relative rounded-2xl overflow-hidden p-8 flex flex-col">
              <img src="/assets/4849e2f78c69b4fe0a1c26233e4a32f222266a1c.png" alt="Route map background" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/70"></div>
              <div className="relative z-10 text-white font-montserrat">
                <h3 className="text-3xl font-semibold mb-10">Eastern Mystery Tour</h3>
                <ul className="space-y-5">
                  {[
                    {src: '/assets/135_233.svg', text: 'NJP Rly Station'},
                    {src: '/assets/135_236.svg', text: 'Darjeeling\nSightseeing'},
                    {src: '/assets/135_237.svg', text: 'Mirik Excursion'},
                    {src: '/assets/135_239.svg', text: 'Darjeeling – Gangtok'},
                    {src: '/assets/135_241.svg', text: 'Gangtok Local\nSightseeing'},
                    {src: '/assets/135_243.svg', text: 'Excursion to Tsomgo\nLake & Baba Mandir'},
                    {src: '/assets/135_252.svg', text: 'Gangtok – NJP\nRly Station'},
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-4">
                      <img src={item.src} alt="dot" className="w-3 h-3" />
                      <span className="font-semibold text-base whitespace-pre-line">{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative z-10 mt-auto text-center">
                <button className="bg-black/60 rounded-lg px-10 py-4 text-white text-3xl font-semibold font-montserrat hover:bg-black/80">View more</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hotel and Stays */}
      <section id="section-stays" className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="/assets/d4923d154532aae71f06a5b4495399800a1b8c5c.png" alt="Hotel landscape" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
        <div className="relative z-10 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8" data-reveal>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="text-white font-montserrat">
              <h4 className="text-5xl font-medium mb-6">Hotel and stays</h4>
              <h2 className="text-7xl font-bold leading-tight">Rest where serenity<br />Meets comfort.</h2>
              <p className="text-2xl font-medium mt-8 max-w-3xl">Choose from hotels, homestays, and retreats near monasteries. Whether you seek comfort, culture, or quiet, find the perfect place to rest during your journey through Sikkim.</p>
            </div>
            <div className="w-full">
              <div className="flex overflow-x-auto snap-x snap-mandatory gap-8 pb-4">
                {[
                  {src: '/assets/04bc2863b121adae385a87a8ee8860a802d4275b.png', title: 'Hotels in Yukson'},
                  {src: '/assets/8a3deb684d9f73a079652cdfc566557bce5c5ea1.png', title: 'Hotels in Gangtok'},
                  {src: '/assets/103244bf22f14449100cbcdc5c40f4aac2d047e5.png', title: 'Hotels in Aritar'},
                  {src: '/assets/767e24af78275c12892056caee06c5ed753eea66.png', title: 'Hotels in Geysing'},
                ].map(card => (
                  <div key={card.src} className="snap-center flex-shrink-0 w-full lg:w-auto relative rounded-2xl overflow-hidden tour-card">
                    <img src={card.src} alt={card.title} className="w-[541px] h-[754px] object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent"></div>
                    <h3 className="absolute bottom-12 left-8 font-montserrat text-5xl font-medium text-white">{card.title}</h3>
                  </div>
                ))}
              </div>
              <div className="flex justify-center items-center gap-8 mt-8">
                <div className="flex items-center justify-center gap-2">
                  <button className="w-3 h-3 bg-white rounded-full" />
                  <button className="w-3 h-3 bg-white/50 rounded-full" />
                  <button className="w-3 h-3 bg-white/50 rounded-full" />
                  <button className="w-3 h-3 bg-white/50 rounded-full" />
                </div>
                <button className="bg-black/60 rounded-lg px-10 py-4 text-white text-3xl font-semibold font-montserrat hover:bg-black/80">View more</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Getting Around */}
      <section id="section-transport" className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="/assets/7374069ed4f9ec4ab01e9665b0817964cc6ae396.png" alt="Road in the mountains" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/50"></div>
        </div>
        <div className="relative z-10 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8" data-reveal>
          <h2 className="font-montserrat text-5xl font-medium text-white mb-12">Getting Around</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 xl:gap-14">
            {[
              {img: '/assets/5c00fd487feafd5bc550fb021f445dab4ac73042.png', title: 'Local Taxi Services', desc: 'Quick rides around town with trusted local drivers.', cta: 'Book Now'},
              {img: '/assets/836ae5fa0540bd630fc2d4778f8448f459084f8c.png', title: 'Bus Schedules', desc: 'Stay on track with real-time bus timings and routes.', cta: 'View Schedules'},
              {img: '/assets/a9d7fa9e34d09c79aacad8d5652ea283ad170295.png', title: 'Car Rentals', desc: 'Rent a car of your choice for flexible and comfortable travel.', cta: 'Explore More'},
            ].map((c) => (
              <div key={c.title} className="bg-white/10 backdrop-blur-lg rounded-[40px] p-8 text-white font-montserrat tour-card">
                <img src={c.img} alt={c.title} className="rounded-2xl w-full h-56 object-cover mb-6" />
                <h3 className="text-3xl font-bold">{c.title}</h3>
                <p className="text-base font-medium mt-2">{c.desc}</p>
                <button className="mt-6 bg-accent-orange rounded-lg px-10 py-2 text-white text-2xl font-semibold hover:opacity-90">{c.cta}</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MyTown Guide */}
      <section id="section-guides" className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="/assets/fc26e98dacd4c396d1f2253c5abafb2594d34e80.png" alt="Guide section background" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
        <div className="relative z-10 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8" data-reveal>
          <h2 className="font-montserrat text-5xl font-medium text-white mb-12">MyTown Guide</h2>
          <div className="relative">
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-8 pb-4">
              {[1,2].map((i) => (
                <div key={i} className="snap-center flex-shrink-0 w-full md:w-auto bg-white/10 backdrop-blur-xl rounded-2xl p-6 flex flex-col md:flex-row gap-6 text-white font-montserrat">
                  <div className="bg-white/10 backdrop-blur-md rounded-[81px] p-5 text-center flex-shrink-0">
                    <img src={i === 1 ? '/assets/3fc89229d6374fc6f28190a65064dd080cba75f0.png' : '/assets/7ce142eecefe92fbb2f3ce5a636cafabe9723cad.png'} alt="Guide" className="rounded-full w-28 h-36 object-cover mx-auto" />
                    <h4 className="font-semibold text-base mt-6">Tashi Bhutia</h4>
                    <p className="text-base mt-8">Contact: 📞<br />+91 98765 43210</p>
                    <p className="text-base mt-2">License No.:<br />SG-2025-178</p>
                  </div>
                  <div className="space-y-6">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
                      <h5 className="text-2xl font-medium mb-4">More info:</h5>
                      <ul className="space-y-2 text-base">
                        <li>Specialization: Adventure & Cultural Tours</li>
                        <li>Languages: English, Hindi, Nepali, Bhutia</li>
                        <li>Experience: 8+ years as a certified tour guide</li>
                      </ul>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
                      <h5 className="text-2xl font-medium mb-4">Services:</h5>
                      <p className="text-base leading-snug">Trekking expeditions, Monastery & cultural heritage tours, Local food and homestay experiences, Customized taxi & car rental arrangements</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Arrows */}
            <button className="absolute top-1/2 -translate-y-1/2 left-0 -translate-x-4 md:-translate-x-12 opacity-30 hover:opacity-100">
              <img src="/assets/I167_616_167_272.svg" alt="Previous" className="w-12 h-12" />
            </button>
            <button className="absolute top-1/2 -translate-y-1/2 right-0 translate-x-4 md:translate-x-12 hover:opacity-100">
              <img src="/assets/I167_616_167_269.svg" alt="Next" className="w-12 h-12" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="section-footer" className="relative bg-[#060100] pt-48 text-white font-montserrat">
        <div className="absolute bottom-0 left-0 right-0 h-[811px] z-0">
          <img src="/assets/ad3644cdb8088cd53f724ff2b60d0c7378020c33.png" alt="Mountains at sunset" className="w-full h-full object-cover object-bottom" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[430px] bg-[#060100] z-10"></div>

        <div className="relative z-20 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* Quick Links */}
            <div>
              <h3 className="text-3xl font-medium mb-6">Quick links</h3>
              <ul className="space-y-4 text-2xl font-normal">
                <li><a href="#" className="hover:text-gray-300">Home</a></li>
                <li><a href="#" className="hover:text-gray-300">Virtual Tours & Archives</a></li>
                <li><a href="#" className="hover:text-gray-300">Maps & Services</a></li>
                <li><a href="#" className="hover:text-gray-300">Events and festivals</a></li>
              </ul>
            </div>
            {/* Support */}
            <div>
              <h3 className="text-3xl font-medium mb-6">Support</h3>
              <ul className="space-y-4 text-2xl font-normal">
                <li><a href="#" className="hover:text-gray-300">About Us</a></li>
                <li><a href="#" className="hover:text-gray-300">Contact</a></li>
                <li><a href="#" className="hover:text-gray-300">Donate</a></li>
                <li><a href="#" className="hover:text-gray-300">FAQ</a></li>
              </ul>
            </div>
            {/* Branding */}
            <div className="lg:col-span-2 flex items-center justify-center lg:justify-end text-center lg:text-right">
              <div>
                <h2 className="text-5xl font-semibold">Monastery360</h2>
                <p className="text-3xl font-normal mt-2">Preserving the sacred, Sharing with the world</p>
              </div>
            </div>
          </div>
          {/* Copyright */}
          <div className="mt-24 py-8 text-center text-base font-normal">
            <p>@ 2025 Monastery360 . All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
