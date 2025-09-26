import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/landing.css';
import MapRouteViewer from '../components/MapRouteViewer';
import { aiRoute, fetchMonasteries, type Monastery, type RoutePathPoint, type RouteStep } from '../lib/api';

export default function LandingHome() {
  // Scroll reveal for [data-reveal] elements
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('reveal--visible');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);
  // Mini route planner state
  const [question, setQuestion] = useState('Best 90-minute walking route to explore');
  const [duration, setDuration] = useState(90);
  const [mode, setMode] = useState<'foot' | 'bike' | 'car'>('foot');
  const [steps, setSteps] = useState<RouteStep[]>([]);
  const [path, setPath] = useState<RoutePathPoint[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [monasteries, setMonasteries] = useState<Monastery[]>([]);
  const [tileStyle, setTileStyle] = useState<'osm' | 'sat'>('osm');

  const SIKKIM_STATION = { lat: 27.3389, lng: 88.6065 };

  useEffect(() => {
    let mounted = true;
    fetchMonasteries().then((data) => { if (mounted) setMonasteries(data || []); }).catch(() => {});
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
    return points;
  }, [monasteries]);
  return (
    <div className="page-wrapper">
      <header className="site-header">
        <div className="container site-header__container">
          <a href="#hero" className="site-header__logo">
            <img src="/images/3cd372d8af4fd08304ef8109871a76a52d77bb08.png" alt="Monastery360 Logo" />
          </a>
          <nav className="site-header__nav">
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/tour">Tour</Link></li>
              <li><a href="#routes">Map</a></li>
              <li><a href="#festivals">Events</a></li>
            </ul>
          </nav>
          <div className="site-header__actions">
            <a href="#" className="site-header__login-btn">Login</a>
            <a href="#" className="site-header__user-icon">
              <img src="/images/I242_486_242_441.svg" alt="User Profile" />
            </a>
          </div>
        </div>
      </header>

      <section id="hero" className="hero-section">
        <div className="section-background">
          <img src="/images/d7298ca4bcd9c5770221d60aac34d67bc7440d92.png" alt="Himalayan mountains background" />
          <div className="section-background-overlay" style={{ opacity: 0.17, filter: 'blur(4px)' }} />
        </div>
        <div className="container hero-section__container">
          <div className="hero-section__content">
            <h1 className="hero-section__title" data-reveal>
              <span className="hero-section__title--large">Explore the Spiritual</span>
              <span className="hero-section__title--small">Heritage of Sikkim</span>
            </h1>
            <div className="hero-section__actions" data-reveal>
              <Link to="/tour" className="hero-section__btn">Explore tours</Link>
              <a href="#routes" className="hero-section__btn">Plan your visit</a>
            </div>
          </div>
        </div>
      </section>

      <section id="monasteries" className="section monasteries-section">
        <div className="section-background">
          <img src="/images/f05349074dd613605740b51db64a41bb22756036.png" alt="Monastery landscape" />
          <div className="section-background-overlay" style={{ opacity: 0.36 }} />
        </div>
        <div className="container" data-reveal>
          <h2 className="monasteries-section__title">Explore Monasteries</h2>
          <div className="monasteries-section__grid" data-reveal>
            <article className="monastery-card">
              <img className="monastery-card__image" src="/images/ff0926efbf77d098d4137b1c27f81771787e76fe.png" alt="Pemayangtse Monastery" />
              <div className="monastery-card__content">
                <h3 className="monastery-card__name">Pemayangtse Monastery</h3>
                <p className="monastery-card__desc">Pemayangtse Monastery is the second oldest monastery in Sikkim. It is situated at a distance of around 107 km west of Gangtok.</p>
                <a href="#" className="monastery-card__btn">Explore now</a>
              </div>
            </article>
            <article className="monastery-card">
              <img className="monastery-card__image" src="/images/d8c76147c5672655977df223b55ea59fa5ea696c.png" alt="Gonjang Monastery" />
              <div className="monastery-card__content">
                <h3 className="monastery-card__name">Gonjang Monastery</h3>
                <p className="monastery-card__desc">Gonjang Monastery is located at Fatak Bojhogari near Tashi Viewpoint in Gangtok, Sikkim, around 8 kilometres from Gangtok SNT Bus Station.</p>
                <a href="#" className="monastery-card__btn">Explore now</a>
              </div>
            </article>
            <article className="monastery-card">
              <img className="monastery-card__image" src="/images/774c28ae841196d596c451256b784ce72cf40f31.png" alt="Rumtek Monastery" />
              <div className="monastery-card__content">
                <h3 className="monastery-card__name">Rumtek Monastery</h3>
                <p className="monastery-card__desc">The largest Buddhist monastery in Sikkim is Rumtek monastery, which is the main seat-in-exile of Thaye Dorje, His Holiness the 17th Gyalwa Karmapa.</p>
                <a href="#" className="monastery-card__btn">Explore now</a>
              </div>
            </article>
          </div>
          <div className="monasteries-section__view-more">
            <a href="#" className="monasteries-section__view-more-btn">View more</a>
          </div>
        </div>
      </section>

      <section id="records" className="section content-section">
        <div className="section-background">
          <img src="/images/c27f5a2a0cea1dbd053be480546c337b4c459aa5.png" alt="Monastic records background" />
          <div className="section-background-overlay" style={{ opacity: 0.24 }} />
        </div>
        <div className="container content-section-grid content-section-grid--img-left" data-reveal>
          <div className="content-section-gallery">
            <div className="gallery-container" style={{ width: 780, height: 700 }}>
              <img src="/images/254_410.svg" alt="Gallery image 1" style={{ position: 'absolute', top: 47, left: 45, width: 276, height: 382 }} />
              <img src="/images/ff4ebb23b573780d9671d70504725bc84f08a406.png" alt="Gallery image 2" style={{ position: 'absolute', top: 47, left: 349, width: 390, height: 233, borderRadius: 20, border: '1px solid white' }} />
              <img src="/images/254_409.svg" alt="Gallery image 3" style={{ position: 'absolute', top: 315, left: 414, width: 322, height: 335 }} />
              <img src="/images/2f1a08b8dfd0e838479051ac861217dc62f3efe2.png" alt="Gallery image 4" style={{ position: 'absolute', top: 454, left: 45, width: 345, height: 196, borderRadius: 20, border: '1px solid white' }} />
            </div>
          </div>
          <div className="content-section-text">
            <h2 className="content-section-title">Monastic Records</h2>
            <div className="content-section-desc glass-card">
              <p>Explore centuries-old manuscripts, murals, and artifacts preserved digitally. A gateway to the sacred knowledge and living traditions of Sikkim’s monasteries.</p>
            </div>
            <a href="#" className="btn">Explore now</a>
          </div>
        </div>
      </section>

      <section id="festivals" className="section content-section">
        <div className="section-background">
          <img src="/images/29785267e6901c36325345edd1bc559f4603dacc.png" alt="Monastic festivals background" />
          <div className="section-background-overlay" style={{ opacity: 0.31 }} />
        </div>
        <div className="container content-section-grid content-section-grid--img-right" data-reveal>
          <div className="content-section-text">
            <h2 className="content-section-title">Monastic Festivals</h2>
            <div className="content-section-desc glass-card">
              <p>Celebrate Sikkim’s sacred traditions through vibrant monastery festivals and rituals.</p>
            </div>
            <a href="#" className="btn">Explore now</a>
          </div>
          <div className="content-section-gallery">
            <div className="gallery-container" style={{ width: 780, height: 700 }}>
              <img src="/images/203_404.svg" alt="Gallery image 1" style={{ position: 'absolute', top: 47, left: 45, width: 276, height: 382, transform: 'rotate(180deg)' }} />
              <img src="/images/aff8c510fdf0b418d5bc793b7cd0cfe569aa807f.png" alt="Gallery image 2" style={{ position: 'absolute', top: 47, left: 349, width: 390, height: 233, borderRadius: 20, border: '1px solid white' }} />
              <img src="/images/203_406.svg" alt="Gallery image 3" style={{ position: 'absolute', top: 315, left: 414, width: 322, height: 335, transform: 'rotate(180deg)' }} />
              <img src="/images/9301909625f0a68a80bdf8fbc0d2417e891d13a1.png" alt="Gallery image 4" style={{ position: 'absolute', top: 454, left: 45, width: 345, height: 196, borderRadius: 20, border: '1px solid white' }} />
            </div>
          </div>
        </div>
      </section>

      <section id="routes" className="section content-section">
        <div className="section-background">
          <img src="/images/08d6d3c3664b37ac00c1955933c2332fd8bdf3c6.png" alt="Pilgrimage routes background" />
          <div className="section-background-overlay" style={{ opacity: 0.24 }} />
        </div>
        <div className="container" data-reveal>
          <h2 className="content-section-title">Plan your route</h2>
          <div className="glass-card" style={{ padding: 16 }}>
            <div className="bg-white rounded-2xl p-4">
              <MapRouteViewer steps={steps} markers={markers} path={path || undefined} transportMode={mode} tileStyle={tileStyle} />
            </div>
            <form onSubmit={handlePlanMini} className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-3">
              <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="What would you like to see?" className="md:col-span-2 rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              <input type="number" value={duration} min={20} max={240} onChange={(e) => setDuration(parseInt(e.target.value || '90', 10))} className="rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="Duration (minutes)" />
              <select value={mode} onChange={(e) => setMode(e.target.value as any)} className="rounded-lg border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
                <option value="foot">Walking</option>
                <option value="bike">Bike</option>
                <option value="car">Car</option>
              </select>
              <select value={tileStyle} onChange={(e) => setTileStyle(e.target.value as any)} className="rounded-lg border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
                <option value="osm">Street</option>
                <option value="sat">Satellite</option>
              </select>
              <button type="submit" disabled={loading} className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-60">{loading ? 'Planning…' : 'Plan Route'}</button>
            </form>
            {error && <div className="text-red-600 mt-2">{error}</div>}
          </div>
        </div>
      </section>

      <section id="pilgrimage" className="section content-section">
        <div className="section-background">
          <img src="/images/fa95c1a174372c1c65d2161a5e2512abcdfc2412.png" alt="Virtual pilgrimage background" />
          <div className="section-background-overlay" style={{ opacity: 0.31 }} />
        </div>
        <div className="container content-section-grid content-section-grid--img-right">
          <div className="content-section-text">
            <h2 className="content-section-title">Virtual Pilgrimage</h2>
            <div className="content-section-desc glass-card">
              <p>“Step into the sacred halls of Sikkim’s monasteries through immersive 360° experiences.</p>
            </div>
            <a href="#" className="btn">Explore now</a>
          </div>
          <div className="content-section-gallery">
            <div className="gallery-container" style={{ width: 780, height: 700 }}>
              <img src="/images/203_444.svg" alt="Gallery image 1" style={{ position: 'absolute', top: 47, left: 45, width: 276, height: 382, transform: 'rotate(180deg)' }} />
              <img src="/images/5dd7a718e52ef497240c53e26da93576900834aa.png" alt="Gallery image 2" style={{ position: 'absolute', top: 47, left: 349, width: 390, height: 233, borderRadius: 20, border: '1px solid white' }} />
              <img src="/images/203_446.svg" alt="Gallery image 3" style={{ position: 'absolute', top: 315, left: 414, width: 322, height: 335, transform: 'rotate(180deg)' }} />
              <img src="/images/6575cd93eac57ef38b20ce7fcab2665aa0bf13db.png" alt="Gallery image 4" style={{ position: 'absolute', top: 454, left: 45, width: 345, height: 196, borderRadius: 20, border: '1px solid white' }} />
            </div>
          </div>
        </div>
      </section>

      <section id="why" className="section why-section">
        <div className="container">
          <h2 className="why-section__title">Why monastery 360?</h2>
          <div className="why-section__grid">
            <div className="why-card">
              <div className="why-card__icon-container">
                <img src="/images/210_378.svg" alt="" className="why-card__icon-bg" />
                <img src="/images/4ecc77737f2ad9fdc1eb609ca772da0de066a088.png" alt="Meditation icon" className="why-card__icon" />
              </div>
              <h3 className="why-card__title">Spiritual + Heritage</h3>
              <p className="why-card__desc">Monastery360 preserves Sikkim’s sacred heritage while making it accessible to the world.</p>
            </div>
            <div className="why-card">
              <div className="why-card__icon-container">
                <img src="/images/210_379.svg" alt="" className="why-card__icon-bg" />
                <img src="/images/086c16d7aec2a66dc54360924fd888b2c1f1fbaf.png" alt="Hands icon" className="why-card__icon" />
              </div>
              <h3 className="why-card__title">Tourist-Friendly</h3>
              <p className="why-card__desc">Planning a trip or exploring from home—Monastery360 is your guide.</p>
            </div>
            <div className="why-card">
              <div className="why-card__icon-container">
                <img src="/images/210_380.svg" alt="" className="why-card__icon-bg" />
                <img src="/images/795fc27bd3db0d5ae989907bcfee67be9354d008.png" alt="Scales icon" className="why-card__icon" />
              </div>
              <h3 className="why-card__title">Balanced</h3>
              <p className="why-card__desc">“A digital bridge between the past and present, Monastery360 lets you experience Sikkim’s .</p>
            </div>
          </div>
          <div className="why-section__divider-container">
            <div className="why-section__divider">
              <div className="why-section__divider-highlight" />
            </div>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="site-footer__background">
          <img src="/images/ad3644cdb8088cd53f724ff2b60d0c7378020c33.png" alt="Himalayan mountains at sunset" />
        </div>
        <div className="container site-footer__container">
          <div className="site-footer__links">
            <div className="footer-links-group">
              <h4 className="footer-links-group__title">Quick links</h4>
              <ul>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/tour">Virtual Tours & Archives</Link></li>
                <li><a href="#routes">Maps & Services</a></li>
                <li><a href="#festivals">Events and festivals</a></li>
              </ul>
            </div>
            <div className="footer-links-group">
              <h4 className="footer-links-group__title">Support</h4>
              <ul>
                <li><a href="#">About Us</a></li>
                <li><a href="#">Contact</a></li>
                <li><a href="#">Donate</a></li>
                <li><a href="#">FAQ</a></li>
              </ul>
            </div>
          </div>
          <div className="site-footer__branding">
            <h3 className="site-footer__brand-name">Monastery360</h3>
            <p className="site-footer__tagline">Preserving the sacred, Sharing with the world</p>
          </div>
          <div className="site-footer__copyright">
            <p>@ 2025 Monastery360 . All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
