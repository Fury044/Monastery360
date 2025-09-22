import React, { useEffect, useState } from 'react';
import { Search, Menu, Map, Archive, Calendar, Headphones, Home, X } from 'lucide-react';
import { Button } from './components/components/ui/button';
import { Input } from './components/components/ui/input';
import { Card } from './components/components/ui/card';
import { Badge } from './components/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/components/ui/tabs';
import { ImageWithFallback } from './components/components/figma/ImageWithFallback';
import { MonasteryCard } from './components/components/MonasteryCard';
import { VirtualTour } from './components/components/VirtualTour';
import { InteractiveMap } from './components/components/InteractiveMap';
import { DigitalArchives } from './components/components/DigitalArchives';
import { CulturalCalendar } from './components/components/CulturalCalendar';
import type { Monastery } from './types/monastery';
import { fetchMonasteriesApi, mapApiToFigma } from './lib/api';

export default function App() {
  const [monasteries, setMonasteries] = useState<Monastery[]>([]);
  const [selectedMonastery, setSelectedMonastery] = useState<Monastery | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const api = await fetchMonasteriesApi();
        const mapped = api.map(mapApiToFigma);
        setMonasteries(mapped);
      } catch (e: any) {
        setError(String(e?.message || e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredMonasteries = monasteries.filter(monastery =>
    monastery.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    monastery.location.district.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMonasterySelect = (monastery: Monastery) => {
    setSelectedMonastery(monastery);
    setActiveTab('tour');
    setIsMobileMenuOpen(false);
  };

  const handleBackToHome = () => {
    setSelectedMonastery(null);
    setActiveTab('overview');
  };

  // Aggregate all events for calendar view
  const allEvents = monasteries.flatMap(m => m.upcomingEvents);
  const allArchives = monasteries.flatMap(m => m.archiveItems);

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleBackToHome}
                className="flex items-center gap-2"
              >
                <Home className="w-5 h-5" />
                <span className="font-semibold text-lg">Monastery360</span>
              </Button>
              {selectedMonastery && (
                <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                  <span>/</span>
                  <span>{selectedMonastery.name}</span>
                </div>
              )}
            </div>

            <div className="hidden md:flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search monasteries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="outline" size="sm">
                EN
              </Button>
            </div>

            <Button 
              variant="ghost" 
              size="sm" 
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t bg-background p-4 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search monasteries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="sm" className="w-full">
                Language: English
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {!selectedMonastery ? (
          // Home Page
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="relative">
              <div className="aspect-[21/9] rounded-xl overflow-hidden">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1577500729553-2bc7b3576db2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidWRkaGlzdCUyMG1vbmFzdGVyeSUyMGhpbWFsYXlhbiUyMG1vdW50YWluc3xlbnwxfHx8fDE3NTgxMjkyMDl8MA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Sikkim Monasteries"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="text-center text-white space-y-4 max-w-2xl px-4">
                    <h1 className="text-4xl md:text-6xl font-bold">Monastery360</h1>
                    <p className="text-lg md:text-xl opacity-90">
                      Discover Sikkim's sacred heritage through immersive digital experiences
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      <Badge variant="secondary" className="bg-white/20 text-white">
                        {monasteries.length} Monasteries
                      </Badge>
                      <Badge variant="secondary" className="bg-white/20 text-white">
                        Virtual Tours
                      </Badge>
                      <Badge variant="secondary" className="bg-white/20 text-white">
                        Digital Archives
                      </Badge>
                      <Badge variant="secondary" className="bg-white/20 text-white">
                        Audio Guides
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Access */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => setActiveTab('map')}>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Map className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Interactive Map</h3>
                    <p className="text-sm text-muted-foreground">Explore locations</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => setActiveTab('archives')}>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Archive className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Digital Archives</h3>
                    <p className="text-sm text-muted-foreground">Browse artifacts</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => setActiveTab('calendar')}>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Cultural Calendar</h3>
                    <p className="text-sm text-muted-foreground">Upcoming events</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Headphones className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Audio Guides</h3>
                    <p className="text-sm text-muted-foreground">Listen & learn</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Monasteries</TabsTrigger>
                <TabsTrigger value="map">Map</TabsTrigger>
                <TabsTrigger value="archives">Archives</TabsTrigger>
                <TabsTrigger value="calendar">Calendar</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold">Explore Monasteries</h2>
                  <Badge variant="outline">
                    {filteredMonasteries.length} monasteries
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredMonasteries.map((monastery) => (
                    <MonasteryCard
                      key={monastery.id}
                      monastery={monastery}
                      onSelect={handleMonasterySelect}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="map">
                <InteractiveMap 
                  monasteries={monasteries} 
                  onMonasterySelect={handleMonasterySelect}
                />
              </TabsContent>

              <TabsContent value="archives">
                <DigitalArchives archives={allArchives} />
              </TabsContent>

              <TabsContent value="calendar">
                <CulturalCalendar events={allEvents} />
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          // Individual Monastery Page
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={handleBackToHome}>
                ← Back to Home
              </Button>
              <div>
                <h1 className="text-3xl font-bold">{selectedMonastery.name}</h1>
                <p className="text-muted-foreground">{selectedMonastery.location.district}</p>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="tour">Virtual Tour</TabsTrigger>
                <TabsTrigger value="archives">Archives</TabsTrigger>
                <TabsTrigger value="calendar">Events</TabsTrigger>
                <TabsTrigger value="info">Information</TabsTrigger>
              </TabsList>

              <TabsContent value="tour">
                <VirtualTour
                  images={selectedMonastery.virtualTourImages}
                  monasteryName={selectedMonastery.name}
                  audioGuide={selectedMonastery.audioGuide}
                />
              </TabsContent>

              <TabsContent value="archives">
                <DigitalArchives
                  archives={selectedMonastery.archiveItems}
                  monasteryName={selectedMonastery.name}
                />
              </TabsContent>

              <TabsContent value="calendar">
                <CulturalCalendar
                  events={selectedMonastery.upcomingEvents}
                  monasteryName={selectedMonastery.name}
                />
              </TabsContent>

              <TabsContent value="info">
                <Card className="p-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold mb-3">About {selectedMonastery.name}</h3>
                      <p className="text-muted-foreground">{selectedMonastery.description}</p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Historical Significance</h4>
                      <p className="text-muted-foreground">{selectedMonastery.significance}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-2">Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Founded:</span>
                            <span>{selectedMonastery.foundingYear}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Location:</span>
                            <span>{selectedMonastery.location.district}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Archive Items:</span>
                            <span>{selectedMonastery.archiveItems.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Audio Guide:</span>
                            <span>{selectedMonastery.audioGuide.duration} minutes</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Audio Guide Highlights</h4>
                        <div className="space-y-2">
                          {selectedMonastery.audioGuide.highlights.map((highlight) => (
                            <div key={highlight.id} className="text-sm">
                              <div className="font-medium">{highlight.title}</div>
                              <div className="text-muted-foreground">{highlight.location}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/50 mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold mb-3">Monastery360</h3>
              <p className="text-sm text-muted-foreground">
                Preserving and sharing Sikkim's monastic heritage through digital innovation.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-3">Features</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>Virtual Tours</li>
                <li>Digital Archives</li>
                <li>Interactive Maps</li>
                <li>Audio Guides</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3">Support</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>Accessibility</li>
                <li>Feedback</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3">Connect</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>Community</li>
                <li>Newsletter</li>
                <li>Social Media</li>
                <li>Partnerships</li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-4 text-center text-sm text-muted-foreground">
            © 2025 Monastery360. Preserving cultural heritage for future generations.
          </div>
        </div>
      </footer>
    </div>
  );
}
