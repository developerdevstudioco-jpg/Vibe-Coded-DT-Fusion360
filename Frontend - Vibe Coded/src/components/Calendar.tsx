import {
  Calendar as CalendarIcon,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Filter,
  FolderKanban,
  MapPin,
  Plus,
  Users,
  X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Page, User } from '../App';
import { createEvent, createMoM, fetchEvents, fetchMoMs, MoM } from '../features/calendar/calendarSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import Layout from './Layout';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';

interface CalendarProps {
  user: User;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}



export default function Calendar({ user, onNavigate, onLogout }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [createMoMOpen, setCreateMoMOpen] = useState(false);
  const [viewMoMOpen, setViewMoMOpen] = useState(false);
  const [selectedMoM, setSelectedMoM] = useState<MoM | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  // Event form state
  const [eventTitle, setEventTitle] = useState('');
  const [eventType, setEventType] = useState<'event' | 'meeting'>('event');
  const [eventDate, setEventDate] = useState('');
  const [eventStartTime, setEventStartTime] = useState('');
  const [eventEndTime, setEventEndTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventAttendees, setEventAttendees] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [linkedProject, setLinkedProject] = useState('');

  // MoM form state
  const [momName, setMomName] = useState('');
  const [momDate, setMomDate] = useState('');
  const [momDtplUsers, setMomDtplUsers] = useState('');
  const [momExternalUsers, setMomExternalUsers] = useState<{ name: string; organization: string; designation: string }[]>([
    { name: '', organization: '', designation: '' }
  ]);
  const [momMeetingType, setMomMeetingType] = useState<'internal-to-customer' | 'customer-to-internal' | 'internal-to-supplier' | 'supplier-to-internal'>('internal-to-customer');
  const [momAgenda, setMomAgenda] = useState('');
  const [momVenue, setMomVenue] = useState('');
  const [momMeetingLink, setMomMeetingLink] = useState('');
  const [momDiscussion, setMomDiscussion] = useState('');
  const [momActionItems, setMomActionItems] = useState<{ task: string; assignee: string; deadline: string }[]>([
    { task: '', assignee: '', deadline: '' }
  ]);
  const [momNextMeeting, setMomNextMeeting] = useState('');

  const dispatch = useAppDispatch();
  const { events, moms, loading } = useAppSelector((state) => state.calendar);

  useEffect(() => {
    dispatch(fetchEvents());
    dispatch(fetchMoMs());
  }, [dispatch]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days in month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const getEventsForDate = (date: Date | null) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => {
      if (filterType === 'all') return event.date === dateStr;
      return event.date === dateStr && event.type === filterType;
    });
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleCreateEvent = () => {
    if (!eventTitle || !eventDate) {
      toast.error('Please fill in required fields');
      return;
    }

    const newEvent = {
      title: eventTitle,
      type: eventType,
      date: eventDate,
      startTime: eventStartTime,
      endTime: eventEndTime,
      location: eventLocation,
      attendees: eventAttendees ? eventAttendees.split(',').map(a => a.trim()).filter(a => a) : [],
      description: eventDescription,
      project: linkedProject || undefined,
      priority: 'medium' as const
    };

    dispatch(createEvent(newEvent as any))
      .unwrap()
      .then(() => {
        toast.success('Event created successfully');
        setCreateEventOpen(false);
    
        // Reset form
        setEventTitle('');
        setEventType('event');
        setEventDate('');
        setEventStartTime('');
        setEventEndTime('');
        setEventLocation('');
        setEventAttendees('');
        setEventDescription('');
        setLinkedProject('');
      })
      .catch((err: any) => {
        toast.error(err || 'Failed to create event');
      });
  };

  const handleCreateMoM = () => {
    if (!momName || !momDate || !momAgenda) {
      toast.error('Please fill in required fields');
      return;
    }

    const newMoM = {
      meetingName: momName,
      date: momDate,
      dtplUsers: momDtplUsers.split(',').map(a => a.trim()).filter(a => a),
      externalUsers: momExternalUsers.filter(user => user.name),
      meetingType: momMeetingType,
      agenda: momAgenda,
      venue: momVenue,
      meetingLink: momMeetingLink,
      discussion: momDiscussion,
      actionItems: momActionItems.filter(item => item.task),
      nextMeeting: momNextMeeting || undefined
    };

    dispatch(createMoM(newMoM as any))
      .unwrap()
      .then(() => {
        toast.success('Minutes of Meeting created successfully');
        setCreateMoMOpen(false);
    
        // Reset form
        setMomName('');
        setMomDate('');
        setMomDtplUsers('');
        setMomExternalUsers([{ name: '', organization: '', designation: '' }]);
        setMomMeetingType('internal-to-customer');
        setMomAgenda('');
        setMomVenue('');
        setMomMeetingLink('');
        setMomDiscussion('');
        setMomActionItems([{ task: '', assignee: '', deadline: '' }]);
        setMomNextMeeting('');
      })
      .catch((err: any) => {
        toast.error(err || 'Failed to create MoM');
      });
  };

  const addActionItem = () => {
    setMomActionItems([...momActionItems, { task: '', assignee: '', deadline: '' }]);
  };

  const updateActionItem = (index: number, field: string, value: string) => {
    const updated = [...momActionItems];
    updated[index] = { ...updated[index], [field]: value };
    setMomActionItems(updated);
  };

  const removeActionItem = (index: number) => {
    if (momActionItems.length > 1) {
      setMomActionItems(momActionItems.filter((_, i) => i !== index));
    }
  };

  const addExternalUser = () => {
    setMomExternalUsers([...momExternalUsers, { name: '', organization: '', designation: '' }]);
  };

  const updateExternalUser = (index: number, field: string, value: string) => {
    const updated = [...momExternalUsers];
    updated[index] = { ...updated[index], [field]: value };
    setMomExternalUsers(updated);
  };

  const removeExternalUser = (index: number) => {
    if (momExternalUsers.length > 1) {
      setMomExternalUsers(momExternalUsers.filter((_, i) => i !== index));
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'meeting':
        return '#3498db';
      case 'project':
        return '#9b59b6';
      case 'task':
        return '#f5a623';
      case 'event':
        return '#2ecc71';
      default:
        return '#6b6b6b';
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'meeting':
        return <Users className="w-3 h-3" />;
      case 'project':
        return <FolderKanban className="w-3 h-3" />;
      case 'task':
        return <CheckSquare className="w-3 h-3" />;
      case 'event':
        return <CalendarIcon className="w-3 h-3" />;
      default:
        return <CalendarIcon className="w-3 h-3" />;
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const days = getDaysInMonth(currentDate);
  const selectedDateEvents = getEventsForDate(selectedDate);

  return (
    <Layout user={user} currentPage="calendar" onNavigate={onNavigate} onLogout={onLogout} title="Calendar & Events">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar View */}
        <Card className="lg:col-span-2" style={{ borderRadius: '12px' }}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" style={{ color: '#ed1c24' }} />
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[140px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="event">Events</SelectItem>
                    <SelectItem value="meeting">Meetings</SelectItem>
                    <SelectItem value="project">Projects</SelectItem>
                    <SelectItem value="task">Tasks</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleNextMonth}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Calendar Grid */}
            <div className="space-y-2">
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {dayNames.map((day) => (
                  <div
                    key={day}
                    className="text-center text-sm text-muted-foreground p-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-2">
                {days.map((day, index) => {
                  const dayEvents = day ? getEventsForDate(day) : [];
                  const isToday = day &&
                    day.toDateString() === new Date().toDateString();
                  const isSelected = day && selectedDate &&
                    day.toDateString() === selectedDate.toDateString();

                  return (
                    <button
                      key={index}
                      onClick={() => day && setSelectedDate(day)}
                      className="min-h-[80px] p-2 rounded-lg border transition-all hover:border-primary"
                      style={{
                        backgroundColor: isSelected ? '#ed1c2410' : day ? '#ffffff' : '#f9f9f9',
                        borderColor: isToday ? '#ed1c24' : isSelected ? '#ed1c24' : 'rgba(0,0,0,0.1)',
                        borderWidth: isToday ? '2px' : '1px',
                        cursor: day ? 'pointer' : 'default'
                      }}
                      disabled={!day}
                    >
                      {day && (
                        <div className="flex flex-col items-start h-full">
                          <span className="text-sm mb-1" style={{
                            color: isToday ? '#ed1c24' : '#393738'
                          }}>
                            {day.getDate()}
                          </span>
                          <div className="space-y-1 w-full">
                            {dayEvents.slice(0, 2).map((event) => (
                              <div
                                key={event.id}
                                className="text-xs px-1 py-0.5 rounded truncate"
                                style={{
                                  backgroundColor: getEventTypeColor(event.type) + '20',
                                  color: getEventTypeColor(event.type)
                                }}
                                title={event.title}
                              >
                                {event.title}
                              </div>
                            ))}
                            {dayEvents.length > 2 && (
                              <div className="text-xs text-muted-foreground px-1">
                                +{dayEvents.length - 2} more
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Events Panel */}
        <div className="space-y-6">
          {/* Action Buttons */}
          <Card style={{ borderRadius: '12px' }}>
            <CardContent className="p-4 space-y-3">
              <Dialog open={createEventOpen} onOpenChange={setCreateEventOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full" style={{ backgroundColor: '#ed1c24' }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Event
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Event</DialogTitle>
                    <DialogDescription>
                      Add a new event, meeting, or link to existing projects/tasks
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="eventTitle">Event Title *</Label>
                        <Input
                          id="eventTitle"
                          value={eventTitle}
                          onChange={(e) => setEventTitle(e.target.value)}
                          placeholder="Enter event title"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="eventType">Type *</Label>
                        <Select value={eventType} onValueChange={(v: string) => setEventType(v as 'event' | 'meeting')}>
                          <SelectTrigger id="eventType">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="event">Event</SelectItem>
                            <SelectItem value="meeting">Meeting</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="eventDate">Date *</Label>
                        <Input
                          id="eventDate"
                          type="date"
                          value={eventDate}
                          onChange={(e) => setEventDate(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="startTime">Start Time</Label>
                        <Input
                          id="startTime"
                          type="time"
                          value={eventStartTime}
                          onChange={(e) => setEventStartTime(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="endTime">End Time</Label>
                        <Input
                          id="endTime"
                          type="time"
                          value={eventEndTime}
                          onChange={(e) => setEventEndTime(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={eventLocation}
                          onChange={(e) => setEventLocation(e.target.value)}
                          placeholder="Meeting room, venue, etc."
                        />
                      </div>

                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="attendees">Attendees</Label>
                        <Input
                          id="attendees"
                          value={eventAttendees}
                          onChange={(e) => setEventAttendees(e.target.value)}
                          placeholder="Comma-separated names"
                        />
                      </div>

                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="linkedProject">Link to Project (Optional)</Label>
                        <Select value={linkedProject} onValueChange={setLinkedProject}>
                          <SelectTrigger id="linkedProject">
                            <SelectValue placeholder="Select project" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="GA-2024-001">GA-2024-001 - Gear Assembly</SelectItem>
                            <SelectItem value="TS-2024-042">TS-2024-042 - Transmission Shaft</SelectItem>
                            <SelectItem value="CH-2024-018">CH-2024-018 - Clutch Housing</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={eventDescription}
                          onChange={(e) => setEventDescription(e.target.value)}
                          placeholder="Event details and agenda"
                          rows={4}
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateEventOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateEvent} style={{ backgroundColor: '#ed1c24' }}>
                      Create Event
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={createMoMOpen} onOpenChange={setCreateMoMOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full" variant="outline">
                    <FileText className="w-4 h-4 mr-2" />
                    Create MoM
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create Minutes of Meeting</DialogTitle>
                    <DialogDescription>
                      Document meeting discussions and action items
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="momName">Meeting Title *</Label>
                        <Input
                          id="momName"
                          value={momName}
                          onChange={(e) => setMomName(e.target.value)}
                          placeholder="Enter meeting title"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="momDate">Meeting Date *</Label>
                        <Input
                          id="momDate"
                          type="date"
                          value={momDate}
                          onChange={(e) => setMomDate(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="nextMeeting">Next Meeting Date</Label>
                        <Input
                          id="nextMeeting"
                          type="date"
                          value={momNextMeeting}
                          onChange={(e) => setMomNextMeeting(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="momDtplUsers">DTPL Attendees *</Label>
                        <Input
                          id="momDtplUsers"
                          value={momDtplUsers}
                          onChange={(e) => setMomDtplUsers(e.target.value)}
                          placeholder="Comma-separated names"
                        />
                      </div>

                      <div className="space-y-2 col-span-2">
                        <Label>External Attendees</Label>
                        <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
                          {momExternalUsers.map((user, index) => (
                            <div key={index} className="grid grid-cols-12 gap-2 items-end">
                              <div className="col-span-5">
                                <Input
                                  placeholder="Name"
                                  value={user.name}
                                  onChange={(e) => updateExternalUser(index, 'name', e.target.value)}
                                />
                              </div>
                              <div className="col-span-3">
                                <Input
                                  placeholder="Organization"
                                  value={user.organization}
                                  onChange={(e) => updateExternalUser(index, 'organization', e.target.value)}
                                />
                              </div>
                              <div className="col-span-3">
                                <Input
                                  placeholder="Designation"
                                  value={user.designation}
                                  onChange={(e) => updateExternalUser(index, 'designation', e.target.value)}
                                />
                              </div>
                              <div className="col-span-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeExternalUser(index)}
                                  disabled={momExternalUsers.length === 1}
                                >
                                  <X className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          ))}
                          <div className="flex justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={addExternalUser}
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add User
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="meetingType">Meeting Type *</Label>
                        <Select value={momMeetingType} onValueChange={(value) => setMomMeetingType(value as "internal-to-customer" | "customer-to-internal" | "internal-to-supplier" | "supplier-to-internal")}>
                          <SelectTrigger id="meetingType">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="internal-to-customer">Internal to Customer</SelectItem>
                            <SelectItem value="customer-to-internal">Customer to Internal</SelectItem>
                            <SelectItem value="internal-to-supplier">Internal to Supplier</SelectItem>
                            <SelectItem value="supplier-to-internal">Supplier to Internal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="agenda">Agenda *</Label>
                        <Textarea
                          id="agenda"
                          value={momAgenda}
                          onChange={(e) => setMomAgenda(e.target.value)}
                          placeholder="Meeting agenda and objectives"
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="venue">Venue</Label>
                        <Input
                          id="venue"
                          value={momVenue}
                          onChange={(e) => setMomVenue(e.target.value)}
                          placeholder="Meeting venue"
                        />
                      </div>

                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="meetingLink">Meeting Link</Label>
                        <Input
                          id="meetingLink"
                          value={momMeetingLink}
                          onChange={(e) => setMomMeetingLink(e.target.value)}
                          placeholder="Zoom link, etc."
                        />
                      </div>

                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="discussion">Discussion Points</Label>
                        <Textarea
                          id="discussion"
                          value={momDiscussion}
                          onChange={(e) => setMomDiscussion(e.target.value)}
                          placeholder="Key discussion points and decisions"
                          rows={4}
                        />
                      </div>

                      <div className="space-y-2 col-span-2">
                        <div className="flex items-center justify-between mb-2">
                          <Label>Action Items</Label>
                          <Button variant="outline" size="sm" onClick={addActionItem}>
                            <Plus className="w-4 h-4 mr-1" />
                            Add Item
                          </Button>
                        </div>
                        <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
                          {momActionItems.map((item, index) => (
                            <div key={index} className="grid grid-cols-12 gap-2 items-end">
                              <div className="col-span-5">
                                <Input
                                  placeholder="Task description"
                                  value={item.task}
                                  onChange={(e) => updateActionItem(index, 'task', e.target.value)}
                                />
                              </div>
                              <div className="col-span-3">
                                <Input
                                  placeholder="Assignee"
                                  value={item.assignee}
                                  onChange={(e) => updateActionItem(index, 'assignee', e.target.value)}
                                />
                              </div>
                              <div className="col-span-3">
                                <Input
                                  type="date"
                                  value={item.deadline}
                                  onChange={(e) => updateActionItem(index, 'deadline', e.target.value)}
                                />
                              </div>
                              <div className="col-span-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeActionItem(index)}
                                  disabled={momActionItems.length === 1}
                                >
                                  <X className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateMoMOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateMoM} style={{ backgroundColor: '#ed1c24' }}>
                      Save MoM
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Selected Date Events */}
          <Card style={{ borderRadius: '12px' }}>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">
                {selectedDate
                  ? `Events on ${selectedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
                  : 'Select a date'
                }
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                {selectedDateEvents.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDateEvents.map((event) => (
                      <div
                        key={event.id}
                        className="p-3 rounded-lg border hover:shadow-md transition-shadow"
                        style={{ borderLeft: `4px solid ${getEventTypeColor(event.type)}` }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="flex-1">{event.title}</h4>
                          <Badge
                            style={{
                              backgroundColor: getEventTypeColor(event.type),
                              color: '#ffffff'
                            }}
                          >
                            {getEventTypeIcon(event.type)}
                            <span className="ml-1">{event.type}</span>
                          </Badge>
                        </div>

                        {event.startTime && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                            <Clock className="w-3 h-3" />
                            {event.startTime} - {event.endTime}
                          </div>
                        )}

                        {event.location && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                            <MapPin className="w-3 h-3" />
                            {event.location}
                          </div>
                        )}

                        {event.project && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                            <FolderKanban className="w-3 h-3" />
                            {event.project}
                          </div>
                        )}

                        {event.attendees && event.attendees.length > 0 && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                            <Users className="w-3 h-3" />
                            {event.attendees.length} attendees
                          </div>
                        )}

                        {event.description && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {event.description}
                          </p>
                        )}

                        {event.type === 'meeting' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-3 w-full"
                            onClick={() => {
                              const mom = moms.find(m => m.meetingName === event.title);
                              if (mom) {
                                setSelectedMoM(mom);
                                setViewMoMOpen(true);
                              }
                            }}
                          >
                            <FileText className="w-3 h-3 mr-2" />
                            View MoM
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No events scheduled</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* View MoM Dialog */}
      <Dialog open={viewMoMOpen} onOpenChange={setViewMoMOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Minutes of Meeting</DialogTitle>
          </DialogHeader>
          {selectedMoM && (
            <div className="space-y-6 py-4">
              <div>
                <h3 className="mb-2">{selectedMoM.meetingName}</h3>
                <p className="text-sm text-muted-foreground">
                  Date: {new Date(selectedMoM.date).toLocaleDateString('en-GB')}
                </p>
              </div>

              <div>
                <Label className="mb-2 block">DTPL Attendees</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedMoM.dtplUsers.map((attendee, idx) => (
                    <Badge key={idx} variant="outline">
                      <Users className="w-3 h-3 mr-1" />
                      {attendee}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-2 block">External Attendees</Label>
                <div className="space-y-2">
                  {selectedMoM.externalUsers.map((user, idx) => (
                    <div key={idx} className="p-3 rounded-lg border bg-muted/30">
                      <div className="flex items-start justify-between mb-1">
                        <p className="text-sm flex-1">{user.name}</p>
                        <Badge variant="outline" className="ml-2">
                          {user.designation} - {user.organization}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Meeting Type</Label>
                <p className="text-sm p-3 rounded-lg bg-muted/30">
                  {selectedMoM.meetingType}
                </p>
              </div>

              <div>
                <Label className="mb-2 block">Agenda</Label>
                <p className="text-sm p-3 rounded-lg bg-muted/30">
                  {selectedMoM.agenda}
                </p>
              </div>

              <div>
                <Label className="mb-2 block">Venue</Label>
                <p className="text-sm p-3 rounded-lg bg-muted/30">
                  {selectedMoM.venue}
                </p>
              </div>

              <div>
                <Label className="mb-2 block">Meeting Link</Label>
                <p className="text-sm p-3 rounded-lg bg-muted/30">
                  {selectedMoM.meetingLink}
                </p>
              </div>

              <div>
                <Label className="mb-2 block">Discussion</Label>
                <p className="text-sm p-3 rounded-lg bg-muted/30">
                  {selectedMoM.discussion}
                </p>
              </div>

              <div>
                <Label className="mb-2 block">Action Items</Label>
                <div className="space-y-2">
                  {selectedMoM.actionItems.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-lg border bg-muted/30">
                      <div className="flex items-start justify-between mb-1">
                        <p className="text-sm flex-1">{item.task}</p>
                        <Badge variant="outline" className="ml-2">
                          {new Date(item.deadline).toLocaleDateString('en-GB')}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Assigned to: {item.assignee}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {selectedMoM.nextMeeting && (
                <div>
                  <Label className="mb-2 block">Next Meeting</Label>
                  <p className="text-sm p-3 rounded-lg bg-muted/30">
                    {new Date(selectedMoM.nextMeeting).toLocaleDateString('en-GB', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewMoMOpen(false)}>
              Close
            </Button>
            <Button style={{ backgroundColor: '#ed1c24' }}>
              Export PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}