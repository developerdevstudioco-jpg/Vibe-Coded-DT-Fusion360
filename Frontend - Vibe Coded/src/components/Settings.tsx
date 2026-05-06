import React, { useState } from 'react';
import { User, Save, Bell, Lock, Globe, Database, Mail, Shield, Loader2 } from 'lucide-react';
import { User as UserType, Page } from '../App';
import Layout from './Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { PasswordInput } from './ui/password-input';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { toast } from 'sonner';
import { Badge } from './ui/badge';
import axiosInstance from '../api/axiosInstance';
import { updateUser } from '../features/auth/authSlice';
import { isSuperAdminRole } from '../features/dashboard/components/files/roleUtils';
import { useAppDispatch } from '../store/hooks';

interface SettingsProps {
  user: UserType;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

export default function Settings({ user, onNavigate, onLogout }: SettingsProps) {
  const dispatch = useAppDispatch();
  const isSuperAdmin = isSuperAdminRole(user.role);
  // Profile Settings
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState('+91 98765 43210');
  const [department, setDepartment] = useState('R&D Engineering');

  // Notification Settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [taskReminders, setTaskReminders] = useState(true);
  const [projectUpdates, setProjectUpdates] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  // Application Preferences
  const [theme, setTheme] = useState('light');
  const [language, setLanguage] = useState('en');
  const [dateFormat, setDateFormat] = useState('DD-MM-YYYY');
  const [timezone, setTimezone] = useState('Asia/Kolkata');

  // Security Settings
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('30');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleSaveProfile = () => {
    toast.success('Profile updated successfully');
  };

  const handleSaveNotifications = () => {
    toast.success('Notification preferences saved');
  };

  const handleSavePreferences = () => {
    toast.success('Application preferences saved');
  };

  const handleSaveSecurity = () => {
    toast.success('Security settings updated');
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      toast.error('Fill in all password fields');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setPasswordLoading(true);

    try {
      const response = await axiosInstance.post('/api/auth/change-password', {
        currentPassword,
        newPassword,
      });

      dispatch(updateUser(response.data?.user ?? { mustChangePassword: false }));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      toast.success('Password updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <Layout user={user} currentPage="settings" onNavigate={onNavigate} onLogout={onLogout} title="Settings">
      <div className="max-w-5xl mx-auto">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          {/* Profile Settings */}
          <TabsContent value="profile">
            <Card style={{ borderRadius: '12px' }}>
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" style={{ color: '#ed1c24' }} />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Update your personal information and contact details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@dhoot.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Select value={department} onValueChange={setDepartment}>
                      <SelectTrigger id="department">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="R&D Engineering">R&D Engineering</SelectItem>
                        <SelectItem value="Quality Assurance">Quality Assurance</SelectItem>
                        <SelectItem value="Production">Production</SelectItem>
                        <SelectItem value="Maintenance">Maintenance</SelectItem>
                        <SelectItem value="Management">Management</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Input id="role" value={user.role} disabled className="bg-muted" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="plant">Plant</Label>
                    <Input
                      id="plant"
                      value={Array.isArray(user.plant) ? user.plant.join(', ') : user.plant}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>

                <Separator />

                <div className="flex justify-end gap-3">
                  <Button variant="outline">Cancel</Button>
                  <Button
                    onClick={handleSaveProfile}
                    style={{ backgroundColor: '#ed1c24' }}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications">
            <Card style={{ borderRadius: '12px' }}>
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" style={{ color: '#ed1c24' }} />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Manage how you receive notifications and updates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                    <div className="space-y-0.5">
                      <Label className="text-base">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                    <div className="space-y-0.5">
                      <Label className="text-base">Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive browser push notifications
                      </p>
                    </div>
                    <Switch
                      checked={pushNotifications}
                      onCheckedChange={setPushNotifications}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                    <div className="space-y-0.5">
                      <Label className="text-base">Task Reminders</Label>
                      <p className="text-sm text-muted-foreground">
                        Get reminders for upcoming task deadlines
                      </p>
                    </div>
                    <Switch
                      checked={taskReminders}
                      onCheckedChange={setTaskReminders}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                    <div className="space-y-0.5">
                      <Label className="text-base">Project Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        Notifications for project status changes
                      </p>
                    </div>
                    <Switch
                      checked={projectUpdates}
                      onCheckedChange={setProjectUpdates}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                    <div className="space-y-0.5">
                      <Label className="text-base">Weekly Digest</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive a weekly summary of activities
                      </p>
                    </div>
                    <Switch
                      checked={weeklyDigest}
                      onCheckedChange={setWeeklyDigest}
                    />
                  </div>
                </div>

                <Separator />

                <div className="flex justify-end gap-3">
                  <Button variant="outline">Reset to Default</Button>
                  <Button
                    onClick={handleSaveNotifications}
                    style={{ backgroundColor: '#ed1c24' }}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Application Preferences */}
          <TabsContent value="preferences">
            <Card style={{ borderRadius: '12px' }}>
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" style={{ color: '#ed1c24' }} />
                  Application Preferences
                </CardTitle>
                <CardDescription>
                  Customize your application experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="theme">Theme</Label>
                    <Select value={theme} onValueChange={setTheme}>
                      <SelectTrigger id="theme">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="auto">Auto (System)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger id="language">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="hi">हिंदी (Hindi)</SelectItem>
                        <SelectItem value="mr">मराठी (Marathi)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateFormat">Date Format</Label>
                    <Select value={dateFormat} onValueChange={setDateFormat}>
                      <SelectTrigger id="dateFormat">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DD-MM-YYYY">DD-MM-YYYY</SelectItem>
                        <SelectItem value="MM-DD-YYYY">MM-DD-YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select value={timezone} onValueChange={setTimezone}>
                      <SelectTrigger id="timezone">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">America/New York (EST)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-end gap-3">
                  <Button variant="outline">Reset to Default</Button>
                  <Button
                    onClick={handleSavePreferences}
                    style={{ backgroundColor: '#ed1c24' }}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security">
            <Card style={{ borderRadius: '12px' }}>
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" style={{ color: '#ed1c24' }} />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Manage your account security and privacy
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="p-4 rounded-lg border">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <Label className="text-base block">
                        {isSuperAdmin ? 'Self Password Change' : 'Change Password'}
                      </Label>
                      {isSuperAdmin && (
                        <Badge variant="secondary" className="bg-red-50 text-red-700 border border-red-100">
                          SuperAdmin Only
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      {isSuperAdmin
                        ? 'For security, the protected SuperAdmin password can only be changed from this signed-in account.'
                        : 'Update your password regularly to keep your account secure'}
                    </p>
                    <div className="space-y-3">
                      <PasswordInput
                        placeholder="Current password"
                        value={currentPassword}
                        onChange={(event) => setCurrentPassword(event.target.value)}
                      />
                      <PasswordInput
                        placeholder="New password"
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                      />
                      <PasswordInput
                        placeholder="Confirm new password"
                        value={confirmNewPassword}
                        onChange={(event) => setConfirmNewPassword(event.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Use at least 8 characters with uppercase, lowercase, number, and special character.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleChangePassword}
                        disabled={passwordLoading || !currentPassword || !newPassword || !confirmNewPassword}
                      >
                        {passwordLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Update Password
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="space-y-0.5">
                      <Label className="text-base flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Two-Factor Authentication
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <Switch
                      checked={twoFactorEnabled}
                      onCheckedChange={setTwoFactorEnabled}
                    />
                  </div>

                  <div className="p-4 rounded-lg border">
                    <Label htmlFor="sessionTimeout" className="text-base mb-2 block">
                      Session Timeout
                    </Label>
                    <p className="text-sm text-muted-foreground mb-4">
                      Automatically log out after period of inactivity
                    </p>
                    <Select value={sessionTimeout} onValueChange={setSessionTimeout}>
                      <SelectTrigger id="sessionTimeout">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                        <SelectItem value="never">Never</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="p-4 rounded-lg border">
                    <Label className="text-base mb-2 block">Active Sessions</Label>
                    <p className="text-sm text-muted-foreground mb-4">
                      View and manage your active sessions
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <div>
                          <p className="text-sm">Windows PC - Chrome</p>
                          <p className="text-xs text-muted-foreground">Current session</p>
                        </div>
                        <Badge style={{ backgroundColor: '#2ecc71', color: '#ffffff' }}>
                          Active
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-end gap-3">
                  <Button variant="outline">Cancel</Button>
                  <Button
                    onClick={handleSaveSecurity}
                    style={{ backgroundColor: '#ed1c24' }}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Security Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
