import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Users, Ticket, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Event } from '../types/monastery';

interface CulturalCalendarProps {
  events: Event[];
  monasteryName?: string;
}

export function CulturalCalendar({ events, monasteryName }: CulturalCalendarProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'festival': return 'bg-red-100 text-red-800';
      case 'ritual': return 'bg-purple-100 text-purple-800';
      case 'ceremony': return 'bg-blue-100 text-blue-800';
      case 'teaching': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEventsByMonth = (month: number, year: number) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getMonth() === month && eventDate.getFullYear() === year;
    });
  };

  const nextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const prevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const upcomingEvents = events
    .filter(event => new Date(event.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold">Cultural Calendar</h3>
            {monasteryName && (
              <p className="text-sm text-muted-foreground">{monasteryName}</p>
            )}
          </div>
          <Badge variant="outline">
            {events.length} events
          </Badge>
        </div>

        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="all">All Events</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            <div className="space-y-3">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((event) => (
                  <Card key={event.id} className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => setSelectedEvent(event)}>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{event.title}</h4>
                          <Badge className={getEventTypeColor(event.type)}>
                            {event.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(event.date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {event.time}
                          </div>
                          {event.maxParticipants && (
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              Max {event.maxParticipants}
                            </div>
                          )}
                        </div>
                      </div>
                      {event.canBook && (
                        <Button size="sm">
                          <Ticket className="w-3 h-3 mr-1" />
                          Book
                        </Button>
                      )}
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No upcoming events scheduled</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4">
            {/* Month Navigation */}
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={prevMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h4 className="font-semibold">
                {months[selectedMonth]} {selectedYear}
              </h4>
              <Button variant="outline" size="sm" onClick={nextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Calendar Grid - Simplified */}
            <div className="space-y-2">
              {getEventsByMonth(selectedMonth, selectedYear).length > 0 ? (
                getEventsByMonth(selectedMonth, selectedYear).map((event) => (
                  <Card key={event.id} className="p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => setSelectedEvent(event)}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{event.title}</span>
                          <Badge className={getEventTypeColor(event.type)} size="sm">
                            {event.type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          <span>{new Date(event.date).getDate()}</span>
                          <span>{event.time}</span>
                        </div>
                      </div>
                      {event.canBook && (
                        <Button size="sm" variant="outline">
                          Book
                        </Button>
                      )}
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No events in {months[selectedMonth]} {selectedYear}</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            <div className="space-y-2">
              {events.map((event) => (
                <Card key={event.id} className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedEvent(event)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{event.title}</h4>
                        <Badge className={getEventTypeColor(event.type)}>
                          {event.type}
                        </Badge>
                        {new Date(event.date) < new Date() && (
                          <Badge variant="secondary">Past Event</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(event.date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {event.time}
                        </div>
                      </div>
                    </div>
                    {event.canBook && new Date(event.date) >= new Date() && (
                      <Button size="sm">
                        <Ticket className="w-3 h-3 mr-1" />
                        Book
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Booking Notice */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm text-green-800">
            🎫 Booking Integration: The full version would include real-time availability, payment processing, and integration with local tourism services for a complete booking experience.
          </p>
        </div>

        {/* Event Detail Modal */}
        {selectedEvent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-lg w-full">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">{selectedEvent.title}</h3>
                    <Badge className={`${getEventTypeColor(selectedEvent.type)} mt-2`}>
                      {selectedEvent.type}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedEvent(null)}
                  >
                    ✕
                  </Button>
                </div>

                <div className="space-y-4">
                  <p className="text-muted-foreground">{selectedEvent.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Date</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(selectedEvent.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Time</p>
                        <p className="text-sm text-muted-foreground">{selectedEvent.time}</p>
                      </div>
                    </div>
                  </div>

                  {selectedEvent.maxParticipants && (
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Capacity</p>
                        <p className="text-sm text-muted-foreground">
                          Maximum {selectedEvent.maxParticipants} participants
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedEvent.canBook && new Date(selectedEvent.date) >= new Date() && (
                    <div className="pt-4">
                      <Button className="w-full">
                        <Ticket className="w-4 h-4 mr-2" />
                        Book This Event
                      </Button>
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        Free participation • Registration required
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </Card>
  );
}