import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Users, IndianRupee, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { delhiVenues, sports } from '@/data/events';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface HostEventFormProps {
  onSuccess?: () => void;
}

const HostEventForm: React.FC<HostEventFormProps> = ({ onSuccess }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    sport: '',
    venueId: '',
    date: '',
    time: '',
    isPaid: false,
    ticketPrice: 0,
    maxCapacity: 100,
  });

  const selectedVenue = delhiVenues.find(v => v.id === formData.venueId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.sport || !formData.venueId || !formData.date || !formData.time) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    const venue = delhiVenues.find(v => v.id === formData.venueId);
    const eventData = {
      ...formData,
      venue: venue?.name,
      address: venue?.address,
      price: formData.isPaid ? formData.ticketPrice : 0,
    };

    toast({
      title: 'Event Created!',
      description: `Your event "${formData.title}" has been successfully created.`,
    });
    
    setFormData({
      title: '',
      description: '',
      sport: '',
      venueId: '',
      date: '',
      time: '',
      isPaid: false,
      ticketPrice: 0,
      maxCapacity: 100,
    });

    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Event Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Event Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Enter event title"
          className="bg-secondary border-border"
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe your event..."
          className="bg-secondary border-border min-h-[100px]"
        />
      </div>

      {/* Sport Selection */}
      <div className="space-y-2">
        <Label>Sport *</Label>
        <Select value={formData.sport} onValueChange={(value) => setFormData({ ...formData, sport: value })}>
          <SelectTrigger className="bg-secondary border-border">
            <SelectValue placeholder="Select a sport" />
          </SelectTrigger>
          <SelectContent>
            {sports.map((sport) => (
              <SelectItem key={sport} value={sport}>{sport}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Venue Selection */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <MapPin className="h-4 w-4" /> Venue *
        </Label>
        <Select value={formData.venueId} onValueChange={(value) => setFormData({ ...formData, venueId: value })}>
          <SelectTrigger className="bg-secondary border-border">
            <SelectValue placeholder="Select a venue in Delhi" />
          </SelectTrigger>
          <SelectContent>
            {delhiVenues.map((venue) => (
              <SelectItem key={venue.id} value={venue.id}>
                <div>
                  <p className="font-medium">{venue.name}</p>
                  <p className="text-xs text-muted-foreground">Capacity: {venue.capacity.toLocaleString()}</p>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedVenue && (
          <p className="text-xs text-muted-foreground">{selectedVenue.address}</p>
        )}
      </div>

      {/* Date and Time */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Calendar className="h-4 w-4" /> Date *
          </Label>
          <Input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="bg-secondary border-border"
          />
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Clock className="h-4 w-4" /> Time *
          </Label>
          <Input
            type="time"
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            className="bg-secondary border-border"
          />
        </div>
      </div>

      {/* Max Capacity */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Users className="h-4 w-4" /> Maximum Attendees
        </Label>
        <Input
          type="number"
          value={formData.maxCapacity}
          onChange={(e) => setFormData({ ...formData, maxCapacity: parseInt(e.target.value) || 0 })}
          placeholder="Maximum number of attendees"
          className="bg-secondary border-border"
          max={selectedVenue?.capacity || 100000}
        />
        {selectedVenue && (
          <p className="text-xs text-muted-foreground">
            Venue max capacity: {selectedVenue.capacity.toLocaleString()}
          </p>
        )}
      </div>

      {/* Paid Event Toggle */}
      <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
        <div>
          <Label className="font-medium">Paid Event</Label>
          <p className="text-xs text-muted-foreground">Enable ticketing for your event</p>
        </div>
        <Switch
          checked={formData.isPaid}
          onCheckedChange={(checked) => setFormData({ ...formData, isPaid: checked })}
        />
      </div>

      {/* Ticket Price (if paid) */}
      {formData.isPaid && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-2"
        >
          <Label className="flex items-center gap-2">
            <IndianRupee className="h-4 w-4" /> Ticket Price (₹)
          </Label>
          <Input
            type="number"
            value={formData.ticketPrice}
            onChange={(e) => setFormData({ ...formData, ticketPrice: parseInt(e.target.value) || 0 })}
            placeholder="Enter ticket price"
            className="bg-secondary border-border"
            min={0}
          />
        </motion.div>
      )}

      {/* Submit Button */}
      <Button type="submit" className="w-full">
        <Trophy className="h-4 w-4 mr-2" />
        Create Event
      </Button>
    </form>
  );
};

export default HostEventForm;
