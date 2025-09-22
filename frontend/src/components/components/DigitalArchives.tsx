import React, { useState } from 'react';
import { Search, Filter, Download, Eye, BookOpen, Image, Archive, FileText } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { ArchiveItem } from '../types/monastery';

interface DigitalArchivesProps {
  archives: ArchiveItem[];
  monasteryName?: string;
}

export function DigitalArchives({ archives, monasteryName }: DigitalArchivesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<ArchiveItem | null>(null);

  const types = ['all', 'manuscript', 'mural', 'artifact', 'document'];
  
  const filteredArchives = archives.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || item.type === selectedType;
    return matchesSearch && matchesType;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'manuscript': return <BookOpen className="w-4 h-4" />;
      case 'mural': return <Image className="w-4 h-4" />;
      case 'artifact': return <Archive className="w-4 h-4" />;
      case 'document': return <FileText className="w-4 h-4" />;
      default: return <Archive className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'manuscript': return 'bg-blue-100 text-blue-800';
      case 'mural': return 'bg-green-100 text-green-800';
      case 'artifact': return 'bg-purple-100 text-purple-800';
      case 'document': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold">Digital Archives</h3>
            {monasteryName && (
              <p className="text-sm text-muted-foreground">{monasteryName}</p>
            )}
          </div>
          <Badge variant="outline">
            {filteredArchives.length} items
          </Badge>
        </div>

        {/* Search and Filter */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search archives..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {types.map((type) => (
              <Button
                key={type}
                variant={selectedType === type ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType(type)}
                className="flex-shrink-0"
              >
                {getTypeIcon(type)}
                <span className="ml-1 capitalize">
                  {type === 'all' ? 'All Types' : type}
                </span>
              </Button>
            ))}
          </div>
        </div>

        {/* Archives Grid/List View */}
        <Tabs defaultValue="grid" className="w-full">
          <TabsList>
            <TabsTrigger value="grid">Grid View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>

          <TabsContent value="grid" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredArchives.map((item) => (
                <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <div className="aspect-video relative">
                    <ImageWithFallback
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2">
                      <Badge className={getTypeColor(item.type)}>
                        {getTypeIcon(item.type)}
                        <span className="ml-1 capitalize">{item.type}</span>
                      </Badge>
                    </div>
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold mb-2">{item.title}</h4>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {item.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                      {item.dateCreated && (
                        <span>Created: {item.dateCreated}</span>
                      )}
                      <span>Digitized: {new Date(item.digitalizedDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSelectedItem(item)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="list" className="space-y-2">
            {filteredArchives.map((item) => (
              <Card key={item.id} className="p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                    <ImageWithFallback
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">{item.title}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {item.description}
                        </p>
                      </div>
                      <Badge className={getTypeColor(item.type)}>
                        {getTypeIcon(item.type)}
                        <span className="ml-1 capitalize">{item.type}</span>
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-xs text-muted-foreground">
                        {item.dateCreated && `Created: ${item.dateCreated} • `}
                        Digitized: {new Date(item.digitalizedDate).toLocaleDateString()}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setSelectedItem(item)}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        {/* AI-Powered Search Notice */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
          <p className="text-sm text-indigo-800">
            🤖 AI-Powered Search: The full version would include intelligent categorization, OCR text search within manuscripts, and semantic similarity matching for better discovery.
          </p>
        </div>

        {/* Item Detail Modal */}
        {selectedItem && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">{selectedItem.title}</h3>
                    <Badge className={`${getTypeColor(selectedItem.type)} mt-2`}>
                      {getTypeIcon(selectedItem.type)}
                      <span className="ml-1 capitalize">{selectedItem.type}</span>
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedItem(null)}
                  >
                    ✕
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="aspect-video rounded-lg overflow-hidden">
                    <ImageWithFallback
                      src={selectedItem.imageUrl}
                      alt={selectedItem.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-muted-foreground">{selectedItem.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selectedItem.dateCreated && (
                      <div>
                        <span className="font-medium">Date Created:</span>
                        <p className="text-muted-foreground">{selectedItem.dateCreated}</p>
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Digitized Date:</span>
                      <p className="text-muted-foreground">
                        {new Date(selectedItem.digitalizedDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button>
                      <Download className="w-4 h-4 mr-2" />
                      Download High-Res
                    </Button>
                    <Button variant="outline">
                      Share
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </Card>
  );
}