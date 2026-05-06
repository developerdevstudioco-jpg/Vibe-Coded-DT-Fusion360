// Updated: Removed Supabase messagesAPI dependency - now uses local in-memory state
import React, { useState, useEffect } from 'react';
import { Send, Search, Hash, Paperclip, Smile, MoreVertical, Plus, RefreshCw } from 'lucide-react';
import { User, Page } from '../App';
import Layout from './Layout';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { cn } from './ui/utils';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';

interface MessageHubProps {
  user: User;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  embedded?: boolean;
}

interface Channel {
  id: string;
  name: string;
  type: 'project' | 'department' | 'general';
  allowedDepts?: string[];
  plant?: string;
  projectId?: string;
  unread?: number;
  lastMessageAt?: string;
}

interface Message {
  id: string;
  channelId: string;
  userId: string;
  userName: string;
  userRole: string;
  message: string;
  attachments?: any[];
  reactions?: Array<{ emoji: string; userId: string; userName: string }>;
  timestamp: string;
}

const departments = [
  'R&D', 'NPD',
  'Quality Assurance (QA)',
  'Production', 'Manufacturing Engineering', 'Maintenance',
  'Purchase', 'Stores / Inventory', 'Logistics',
  'Sales', 'Finance & Accounts', 'HR', 'IT / Systems', 'Administration', 'Admin / Management Office'
];

const defaultChannels: Channel[] = [
    { id: 'general', name: 'General', type: 'general', unread: 0, lastMessageAt: '' },
    { id: 'project1', name: 'Project Updates', type: 'project', unread: 0, lastMessageAt: '' },
    { id: 'dept1', name: 'Quality Assurance', type: 'department', allowedDepts: ['Quality Assurance (QA)'], unread: 0, lastMessageAt: '' },
  ];

export default function MessageHub({ user, onNavigate, onLogout, embedded = false }: MessageHubProps) {
  const [channels, setChannels] = useState<Channel[]>(defaultChannels);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(defaultChannels[0] || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [newChannelData, setNewChannelData] = useState({
    name: '',
    type: 'general' as 'project' | 'department' | 'general',
    allowedDepts: [] as string[]
  });

  // Load channels on mount
  useEffect(() => {
    // Preload mock channels and initial messages
    if (!selectedChannel && defaultChannels.length > 0) {
      setSelectedChannel(defaultChannels[0]);
    }
    setLoading(false);
  }, []);

  // Load messages when channel changes
  useEffect(() => {
    if (selectedChannel) {
      // for demo/demo mode, keep in-memory; no network
      const channelMessages = messages.filter(msg => msg.channelId === selectedChannel.id);
      setMessages(channelMessages);
    }
  }, [selectedChannel]);

  const loadChannels = () => {
    console.log('loadChannels called - using local data');
    setLoading(false);
    setChannels(defaultChannels);
    if (!selectedChannel && defaultChannels.length > 0) {
      setSelectedChannel(defaultChannels[0]);
    }
  };

  const loadMessages = (channelId: string) => {
    const channelMessages = messages.filter(msg => msg.channelId === channelId);
    setMessages(channelMessages);
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedChannel) return;

    setSendingMessage(true);

    const newMessage: Message = {
      id: `${Date.now()}`,
      channelId: selectedChannel.id,
      userId: user.id || 'unknown',
      userName: user.name || 'You',
      userRole: user.role,
      message: messageInput.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, newMessage]);
    setMessageInput('');
    setSendingMessage(false);
    toast.success('Message sent');
  };

  const handleReaction = (messageId: string, emoji: string) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId
          ? {
              ...msg,
              reactions: msg.reactions
                ? [...msg.reactions, { emoji, userId: user.id, userName: user.name }]
                : [{ emoji, userId: user.id, userName: user.name }],
            }
          : msg
      )
    );
  };

  const handleCreateChannel = () => {
    if (!newChannelData.name.trim()) {
      toast.error('Channel name is required');
      return;
    }

    const newChannel: Channel = {
      id: `${Date.now()}`,
      name: newChannelData.name.trim(),
      type: newChannelData.type,
      allowedDepts: newChannelData.allowedDepts,
      unread: 0,
      lastMessageAt: new Date().toISOString(),
    };

    setChannels(prev => [...prev, newChannel]);
    setSelectedChannel(newChannel);
    setIsCreateChannelOpen(false);
    setNewChannelData({ name: '', type: 'general', allowedDepts: [] });
    toast.success('Channel created successfully');
  };


  const toggleDepartment = (dept: string) => {
    setNewChannelData(prev => ({
      ...prev,
      allowedDepts: prev.allowedDepts.includes(dept)
        ? prev.allowedDepts.filter(d => d !== dept)
        : [...prev.allowedDepts, dept]
    }));
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Check if user can create channels
  const canCreateChannel = ['SuperAdmin', 'PlantAdmin', 'Manager', 'AGM', 'GM', 'DGM'].includes(user.role);

  const projectChannels = channels.filter(c => c.type === 'project');
  const departmentChannels = channels.filter(c => c.type === 'department');
  const generalChannels = channels.filter(c => c.type === 'general');

  const Content = (
    <div className={cn("grid grid-cols-1 lg:grid-cols-4 gap-6", embedded ? "h-full" : "h-[calc(100vh-200px)]")}>
      {/* Channel List */}
      {!embedded && (
        <Card className="lg:col-span-1 border-none shadow-md bg-white overflow-hidden flex flex-col">
          <div className="p-4 border-b bg-slate-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold">Channels</h3>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={loadChannels}
                  className="h-8 w-8"
                  title="Refresh channels"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
                {canCreateChannel && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsCreateChannelOpen(true)}
                    className="h-8 w-8"
                    title="Create channel"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search channels..."
                className="pl-9 bg-white"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">Loading channels...</div>
            ) : channels.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <p>No channels available</p>
                {canCreateChannel && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setIsCreateChannelOpen(true)}
                    className="text-[#ed1c24] mt-2"
                  >
                    Create your first channel
                  </Button>
                )}
              </div>
            ) : (
              <div className="p-3 space-y-6">
                {projectChannels.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between px-2 mb-2">
                      <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Project Channels</h4>
                      <Badge variant="secondary" className="text-[10px] h-5">{projectChannels.length}</Badge>
                    </div>
                    <div className="space-y-1">
                      {projectChannels.map(channel => (
                        <button
                          key={channel.id}
                          onClick={() => setSelectedChannel(channel)}
                          className={cn(
                            "w-full flex items-center justify-between p-2.5 rounded-md transition-colors text-left group",
                            selectedChannel?.id === channel.id ? "bg-[#ed1c24]/10 text-[#ed1c24]" : "hover:bg-slate-100 text-slate-700"
                          )}
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <Hash className={cn("w-4 h-4 flex-shrink-0", selectedChannel?.id === channel.id ? "text-[#ed1c24]" : "text-slate-400 group-hover:text-slate-600")} />
                            <span className="text-sm font-medium truncate">{channel.name}</span>
                          </div>
                          {channel.unread && channel.unread > 0 && (
                            <span className="w-2 h-2 rounded-full bg-[#ed1c24]" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {departmentChannels.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 px-2">Department Channels</h4>
                    <div className="space-y-1">
                      {departmentChannels.map(channel => (
                        <button
                          key={channel.id}
                          onClick={() => setSelectedChannel(channel)}
                          className={cn(
                            "w-full flex items-center justify-between p-2.5 rounded-md transition-colors text-left group",
                            selectedChannel?.id === channel.id ? "bg-[#ed1c24]/10 text-[#ed1c24]" : "hover:bg-slate-100 text-slate-700"
                          )}
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <Hash className={cn("w-4 h-4 flex-shrink-0", selectedChannel?.id === channel.id ? "text-[#ed1c24]" : "text-slate-400 group-hover:text-slate-600")} />
                            <span className="text-sm font-medium truncate">{channel.name}</span>
                          </div>
                          {channel.unread && channel.unread > 0 && (
                            <span className="w-2 h-2 rounded-full bg-[#ed1c24]" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {generalChannels.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 px-2">General Channels</h4>
                    <div className="space-y-1">
                      {generalChannels.map(channel => (
                        <button
                          key={channel.id}
                          onClick={() => setSelectedChannel(channel)}
                          className={cn(
                            "w-full flex items-center justify-between p-2.5 rounded-md transition-colors text-left group",
                            selectedChannel?.id === channel.id ? "bg-[#ed1c24]/10 text-[#ed1c24]" : "hover:bg-slate-100 text-slate-700"
                          )}
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <Hash className={cn("w-4 h-4 flex-shrink-0", selectedChannel?.id === channel.id ? "text-[#ed1c24]" : "text-slate-400 group-hover:text-slate-600")} />
                            <span className="text-sm font-medium truncate">{channel.name}</span>
                          </div>
                          {channel.unread && channel.unread > 0 && (
                            <span className="w-2 h-2 rounded-full bg-[#ed1c24]" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </Card>
      )}

      {/* Messages Panel */}
      <Card className={cn("border-none shadow-md bg-white flex flex-col overflow-hidden", embedded ? "lg:col-span-4 h-full shadow-none border" : "lg:col-span-3")}>
        {selectedChannel ? (
          <>
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between bg-white z-10 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                  <Hash className="w-5 h-5 text-[#ed1c24]" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 leading-none mb-1">{selectedChannel.name}</h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                    {selectedChannel.type === 'project' ? 'Project Channel' : selectedChannel.type === 'department' ? 'Department Channel' : 'General Channel'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => loadMessages(selectedChannel.id)}
                  className="text-slate-500 hover:text-slate-700"
                >
                  <RefreshCw className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-700">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 bg-slate-50/50 p-4">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                <div className="space-y-6 max-w-3xl mx-auto">
                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-slate-50 px-2 text-muted-foreground">Messages</span>
                    </div>
                  </div>

                  {messages.map((msg) => {
                    const isCurrentUser = msg.userId === user.id;
                    const initials = getInitials(msg.userName);

                    return (
                      <div key={msg.id} className="flex gap-4 group animate-in slide-in-from-bottom-2 duration-300">
                        <Avatar className="w-10 h-10 border-2 border-white shadow-sm mt-1">
                          <AvatarFallback className="bg-slate-800 text-white font-semibold text-xs">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-sm font-bold text-slate-900">{msg.userName}</span>
                            {isCurrentUser && (
                              <Badge variant="outline" className="text-[10px] h-4 px-1 text-[#ed1c24] border-[#ed1c24]">
                                You
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-[10px] h-4 px-1 text-slate-500 font-normal border-slate-200">
                              {msg.userRole}
                            </Badge>
                            <span className="text-xs text-muted-foreground ml-auto">{formatTime(msg.timestamp)}</span>
                          </div>

                          <div className="bg-white p-3 rounded-2xl rounded-tl-none border shadow-sm text-sm text-slate-700 leading-relaxed">
                            {msg.message}
                          </div>

                          {msg.reactions && msg.reactions.length > 0 && (
                            <div className="flex gap-1 mt-1.5 flex-wrap">
                              {/* Group reactions by emoji */}
                              {Object.entries(
                                msg.reactions.reduce((acc, r) => {
                                  acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                                  return acc;
                                }, {} as Record<string, number>)
                              ).map(([emoji, count]) => (
                                <button
                                  key={emoji}
                                  onClick={() => handleReaction(msg.id, emoji)}
                                  className="px-2 py-0.5 rounded-full bg-white border shadow-sm text-xs hover:bg-slate-50 transition-colors"
                                >
                                  {emoji} {count > 1 && count}
                                </button>
                              ))}
                              <button
                                onClick={() => handleReaction(msg.id, '👍')}
                                className="px-2 py-0.5 rounded-full bg-white border shadow-sm text-xs hover:bg-slate-50 transition-colors opacity-0 group-hover:opacity-100"
                                title="Add reaction"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 bg-white border-t">
              <div className="flex items-end gap-2 max-w-3xl mx-auto bg-slate-50 p-2 rounded-xl border focus-within:ring-1 focus-within:ring-[#ed1c24] focus-within:border-[#ed1c24] transition-all">
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200">
                  <Paperclip className="w-5 h-5" />
                </Button>
                <Input
                  placeholder={`Message #${selectedChannel.name}`}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={sendingMessage}
                  className="border-none shadow-none bg-transparent focus-visible:ring-0 min-h-[44px] py-2.5"
                />
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200">
                    <Smile className="w-5 h-5" />
                  </Button>
                  <Button
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || sendingMessage}
                    className="h-10 w-10 rounded-lg bg-[#ed1c24] hover:bg-[#c4171e] text-white shadow-sm disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="text-center mt-2">
                <p className="text-[10px] text-muted-foreground">
                  <strong>Tip:</strong> Press Enter to send, Shift+Enter for new line
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>Select a channel to start messaging</p>
          </div>
        )}
      </Card>
    </div>
  );

  return (
    <>
      {embedded ? (
        Content
      ) : (
        <Layout user={user} currentPage="messages" onNavigate={onNavigate} onLogout={onLogout} title="Communication Hub">
          {Content}
        </Layout>
      )}

      {/* Create Channel Dialog */}
      <Dialog open={isCreateChannelOpen} onOpenChange={setIsCreateChannelOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Create New Channel</DialogTitle>
            <DialogDescription>
              Create a new communication channel for your team
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="channel-name">Channel Name *</Label>
              <Input
                id="channel-name"
                placeholder="e.g., project-xyz, rd-team"
                value={newChannelData.name}
                onChange={(e) => setNewChannelData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="channel-type">Channel Type *</Label>
              <Select
                value={newChannelData.type}
                onValueChange={(value: 'project' | 'department' | 'general') =>
                  setNewChannelData(prev => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger id="channel-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="department">Department</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Allowed Departments (Optional)</Label>
              <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                {departments.map(dept => (
                  <div key={dept} className="flex items-center space-x-2">
                    <Checkbox
                      id={`dept-${dept}`}
                      checked={newChannelData.allowedDepts.includes(dept)}
                      onCheckedChange={() => toggleDepartment(dept)}
                    />
                    <label htmlFor={`dept-${dept}`} className="text-sm cursor-pointer">
                      {dept}
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Leave empty to allow all departments to access this channel
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateChannelOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateChannel} style={{ backgroundColor: '#ed1c24' }}>
              Create Channel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
