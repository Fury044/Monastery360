import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause, Volume2, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface VirtualTourProps {
  images: string[];
  monasteryName: string;
  audioGuide?: {
    introduction: string;
    duration: number;
  };
}

export function VirtualTour({ images, monasteryName, audioGuide }: VirtualTourProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [rotation, setRotation] = useState(0);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const toggleAudio = () => {
    setIsPlaying(!isPlaying);
  };

  const handleRotate = () => {
    setRotation((prev) => prev + 90);
  };

  const resetView = () => {
    setRotation(0);
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Virtual Tour - {monasteryName}</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRotate}>
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={resetView}>
              Reset View
            </Button>
          </div>
        </div>

        {/* Virtual Tour Viewer */}
        <div className="relative">
          <div 
            className="relative overflow-hidden rounded-lg bg-muted aspect-video"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            <ImageWithFallback
              src={images[currentImageIndex]}
              alt={`${monasteryName} virtual tour - view ${currentImageIndex + 1}`}
              className="w-full h-full object-cover transition-transform duration-300"
            />
            
            {/* Navigation Controls */}
            <div className="absolute inset-y-0 left-0 flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={prevImage}
                className="bg-black/20 hover:bg-black/40 text-white ml-2"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="absolute inset-y-0 right-0 flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={nextImage}
                className="bg-black/20 hover:bg-black/40 text-white mr-2"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* View Indicator */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
              {currentImageIndex + 1} of {images.length}
            </div>
          </div>

          {/* Thumbnail Navigation */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`flex-shrink-0 w-20 h-14 rounded-md overflow-hidden border-2 transition-colors ${
                  index === currentImageIndex ? 'border-primary' : 'border-transparent'
                }`}
              >
                <ImageWithFallback
                  src={image}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Audio Guide Controls */}
        {audioGuide && (
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Audio Guide</h4>
              <span className="text-sm text-muted-foreground">{audioGuide.duration} min</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{audioGuide.introduction}</p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleAudio}
                className="flex items-center gap-2"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isPlaying ? 'Pause' : 'Play'} Audio Guide
              </Button>
              <Button variant="ghost" size="sm">
                <Volume2 className="w-4 h-4" />
              </Button>
            </div>
            {isPlaying && (
              <div className="mt-2 w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full w-1/4 transition-all duration-1000"></div>
              </div>
            )}
          </div>
        )}

        {/* 360° Tour Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            🔄 This is a simulated 360° tour experience. In the full version, you would be able to look around in all directions and explore interactive hotspots within the monastery.
          </p>
        </div>
      </div>
    </Card>
  );
}