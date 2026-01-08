import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Search, MapPin, Calendar, Clock, Users, Filter, Ticket, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { delhiEvents, sports, Event } from '@/data/events';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import StarRating from '@/components/StarRating';
import HostEventForm from '@/components/HostEventForm';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const EventCard: React.FC<{ event: Event; isViewer: boolean; onAction: (event: Event) => void }> = ({ event, isViewer, onAction }) => {
  const { t } = useTranslation();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300"
    >
      <div className="relative h-48">
        <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute top-3 right-3">
          <span className={`text-xs font-medium px-3 py-1 rounded-full ${
            event.isPaid ? 'bg-amber-500/90 text-white' : 'bg-green-500/90 text-white'
          }`}>
            {event.isPaid ? `₹${event.price}` : t('events.free')}
          </span>
        </div>
        <div className="absolute top-3 left-3">
          <span className="text-xs font-medium px-3 py-1 rounded-full bg-primary/90 text-primary-foreground">
            {event.sport}
          </span>
        </div>
      </div>
      
      <div className="p-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg line-clamp-1 text-foreground">{event.title}</h3>
        </div>
        
        <div className="flex items-center gap-2 mb-3">
          <StarRating rating={event.rating} />
          <span className="text-sm text-muted-foreground">({event.reviewCount} reviews)</span>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{event.description}</p>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 text-primary" />
            <span>{new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 text-primary" />
            <span>{event.time}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4 text-primary" />
            <span>{event.spotsAvailable} / {event.totalSpots} spots</span>
          </div>
        </div>

        <Button 
          variant={isViewer ? 'default' : 'default'} 
          className="w-full"
          onClick={() => onAction(event)}
        >
          {isViewer ? (
            <>
              <Ticket className="h-4 w-4 mr-2" />
              {t('events.buyTicket')}
            </>
          ) : (
            t('events.register')
          )}
        </Button>
      </div>
    </motion.div>
  );
};

const EventsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [priceFilter, setPriceFilter] = useState<string>('all');
  const [hostFormOpen, setHostFormOpen] = useState(false);

  const isViewer = user?.role === 'viewer';
  const isOrganizer = user?.role === 'organizer';

  const filteredEvents = delhiEvents.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSport = selectedSport === 'all' || event.sport === selectedSport;
    const matchesPrice = priceFilter === 'all' || 
                        (priceFilter === 'free' && !event.isPaid) ||
                        (priceFilter === 'paid' && event.isPaid);
    return matchesSearch && matchesSport && matchesPrice;
  });

  const handleEventAction = (event: Event) => {
    if (isViewer) {
      toast({
        title: 'Ticket Booking',
        description: `Processing ticket for ${event.title}. Redirecting to payment...`,
      });
    } else {
      toast({
        title: 'Registration Successful',
        description: `You have registered for ${event.title}!`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background pt-20 pb-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-4 text-foreground">
            Sports <span className="text-primary">{t('events.title')}</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {t('events.subtitle')}
          </p>
          
          {isOrganizer && (
            <Button 
              className="mt-6" 
              size="lg"
              onClick={() => setHostFormOpen(true)}
            >
              <Plus className="h-5 w-5 mr-2" />
              Host an Event
            </Button>
          )}
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border p-4 rounded-xl mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search events or locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary border-border"
              />
            </div>
            <Select value={selectedSport} onValueChange={setSelectedSport}>
              <SelectTrigger className="w-full md:w-48 bg-secondary border-border">
                <SelectValue placeholder="Select Sport" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sports</SelectItem>
                {sports.map((sport) => (
                  <SelectItem key={sport} value={sport}>{sport}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priceFilter} onValueChange={setPriceFilter}>
              <SelectTrigger className="w-full md:w-36 bg-secondary border-border">
                <SelectValue placeholder="Price" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            Showing {filteredEvents.length} events in Delhi NCR
          </p>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Sort by date</span>
          </div>
        </div>

        {/* Events Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <EventCard 
              key={event.id} 
              event={event} 
              isViewer={isViewer}
              onAction={handleEventAction}
            />
          ))}
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No events found matching your criteria.</p>
          </div>
        )}

        {/* Host Event Dialog */}
        <Dialog open={hostFormOpen} onOpenChange={setHostFormOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-foreground">Host a New Event</DialogTitle>
            </DialogHeader>
            <HostEventForm onSuccess={() => setHostFormOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default EventsPage;
