import React from 'react';
import { MapPin, Calendar, Archive, Headphones } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Monastery } from '../types/monastery';

interface MonasteryCardProps {
  monastery: Monastery;
  onSelect: (monastery: Monastery) => void;
}

export function MonasteryCard({ monastery, onSelect }: MonasteryCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" 
          onClick={() => onSelect(monastery)}>
      <div className="aspect-video relative">
        <ImageWithFallback
          src={monastery.imageUrl}
          alt={monastery.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2">
          <Badge variant="secondary">
            {monastery.foundingYear}
          </Badge>
        </div>
      </div>
      
      <div className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-lg">{monastery.name}</h3>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="w-3 h-3" />
              {monastery.location.district}
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground line-clamp-2">
            {monastery.description}
          </p>
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Archive className="w-3 h-3" />
              {monastery.archiveItems.length} items
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {monastery.upcomingEvents.length} events
            </div>
            <div className="flex items-center gap-1">
              <Headphones className="w-3 h-3" />
              {monastery.audioGuide.duration}min
            </div>
          </div>
          
          <div className="flex gap-2 pt-2">
            <Button size="sm" className="flex-1">
              Explore
            </Button>
            <Button size="sm" variant="outline">
              Virtual Tour
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}