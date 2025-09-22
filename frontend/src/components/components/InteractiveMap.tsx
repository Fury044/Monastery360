import React, { useState } from 'react';
import { MapPin, Navigation, Clock, Calendar } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Monastery } from '../types/monastery';

interface InteractiveMapProps {
  monasteries: Monastery[];
  onMonasterySelect: (monastery: Monastery) => void;
}

export function InteractiveMap({ monasteries, onMonasterySelect }: InteractiveMapProps) {
  const [selectedMonastery, setSelectedMonastery] = useState<Monastery | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');

  const districts = ['all', ...new Set(monasteries.map(m => m.location.district))];
  const filteredMonasteries = selectedDistrict === 'all' 
    ? monasteries 
    : monasteries.filter(m => m.location.district === selectedDistrict);

  const handleMonasteryClick = (monastery: Monastery) => {
    setSelectedMonastery(monastery);
    onMonasterySelect(monastery);
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Monastery Map</h3>
          <div className="flex gap-2">
            {districts.map((district) => (
              <Button
                key={district}
                variant={selectedDistrict === district ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDistrict(district)}
              >
                {district === 'all' ? 'All Districts' : district}
              </Button>
            ))}
          </div>
        </div>

        {/* Map Container - Simulated Map */}
        <div className="relative">
          <div className="bg-gradient-to-br from-green-100 to-blue-100 rounded-lg h-96 relative overflow-hidden">
            {/* Background pattern to simulate terrain */}
            <div className="absolute inset-0 opacity-20">
              <div className="w-full h-full bg-repeat opacity-30" 
                   style={{
                     backgroundImage: `radial-gradient(circle at 20% 50%, rgba(120, 119, 120, 0.3) 1px, transparent 1px),
                                     radial-gradient(circle at 80% 50%, rgba(120, 119, 120, 0.3) 1px, transparent 1px)`,
                     backgroundSize: '40px 40px'
                   }}>
              </div>
            </div>

            {/* Monastery Markers */}
            {filteredMonasteries.map((monastery, index) => {
              const x = 20 + (index * 25) % 70; // Simulate distribution
              const y = 20 + (index * 30) % 60;
              
              return (
                <div
                  key={monastery.id}
                  className={`absolute cursor-pointer transition-transform hover:scale-110 ${
                    selectedMonastery?.id === monastery.id ? 'scale-125' : ''
                  }`}
                  style={{ left: `${x}%`, top: `${y}%` }}
                  onClick={() => handleMonasteryClick(monastery)}
                >
                  <div className={`relative p-2 rounded-full shadow-lg ${
                    selectedMonastery?.id === monastery.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-white text-primary'
                  }`}>
                    <MapPin className="w-6 h-6" />
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                      <div className="bg-white rounded px-2 py-1 shadow-md text-xs font-medium">
                        {monastery.name}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-white rounded-lg p-3 shadow-md">
              <h4 className="font-medium text-sm mb-2">Legend</h4>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                  <span>Selected Monastery</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 bg-white border-2 border-primary rounded-full"></div>
                  <span>Available Monastery</span>
                </div>
              </div>
            </div>

            {/* Compass */}
            <div className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-md">
              <Navigation className="w-6 h-6 text-primary" />
            </div>
          </div>

          {/* Map Notice */}
          <div className="mt-2 bg-amber-50 border border-amber-200 rounded p-2">
            <p className="text-sm text-amber-800">
              🗺️ This is a simplified map representation. The full version would include interactive Google Maps integration with real GPS coordinates, routing, and nearby attractions.
            </p>
          </div>
        </div>

        {/* Selected Monastery Details */}
        {selectedMonastery && (
          <Card className="p-4 border-l-4 border-l-primary">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold">{selectedMonastery.name}</h4>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {selectedMonastery.location.district}
                  </p>
                </div>
                <Badge variant="secondary">
                  Founded {selectedMonastery.foundingYear}
                </Badge>
              </div>
              
              <p className="text-sm">{selectedMonastery.description}</p>
              
              <div className="flex gap-2">
                <Button size="sm" variant="default">
                  <Navigation className="w-4 h-4 mr-1" />
                  Get Directions
                </Button>
                <Button size="sm" variant="outline">
                  <Clock className="w-4 h-4 mr-1" />
                  Audio Guide
                </Button>
                <Button size="sm" variant="outline">
                  <Calendar className="w-4 h-4 mr-1" />
                  Events
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Monastery List */}
        <div>
          <h4 className="font-medium mb-3">All Monasteries ({filteredMonasteries.length})</h4>
          <div className="grid gap-2">
            {filteredMonasteries.map((monastery) => (
              <Card 
                key={monastery.id}
                className={`p-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                  selectedMonastery?.id === monastery.id ? 'bg-muted' : ''
                }`}
                onClick={() => handleMonasteryClick(monastery)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{monastery.name}</p>
                    <p className="text-xs text-muted-foreground">{monastery.location.district}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-xs">
                      {monastery.foundingYear}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {monastery.upcomingEvents.length} events
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}