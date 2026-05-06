import React, { useState } from 'react';
import { UserPlus, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { PasswordInput } from './ui/password-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Checkbox } from './ui/checkbox';
import { authAPI } from '../utils/supabase/client';
import { toast } from 'sonner';
import { ALL_DEPARTMENTS, PLANTS } from '../utils/masterData';
import { supportsMultiPlantAccess, USER_CREATION_ROLE_GROUPS } from '../utils/rbac';

interface UserRegistrationProps {
  onSuccess: () => void;
  onBack: () => void;
}

export default function UserRegistration({ onSuccess, onBack }: UserRegistrationProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: '',
    department: '',
    plant: PLANTS[0],
    plants: [] as string[]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isMultiPlantRole = supportsMultiPlantAccess(formData.role);

  const handlePlantToggle = (plant: string) => {
    setFormData(prev => ({
      ...prev,
      plants: prev.plants.includes(plant)
        ? prev.plants.filter(p => p !== plant)
        : [...prev.plants, plant]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (isMultiPlantRole && formData.plants.length === 0) {
      setError('Please select at least one plant for multi-plant roles');
      return;
    }

    setLoading(true);

    try {
      const userData = {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: formData.role,
        department: formData.department,
        plant: formData.plant,
        plants: isMultiPlantRole ? formData.plants : [formData.plant]
      };

      const result = await authAPI.signUp(userData);

      if (result.success) {
        toast.success('User registered successfully!');
        onSuccess();
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to register user');
      toast.error('Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" 
         style={{ background: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)' }}>
      <div className="w-full max-w-2xl">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Login
        </Button>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-6 h-6" />
              Create New User Account
            </CardTitle>
            <CardDescription>
              Set up a new user account for the DT-Fusion360 platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="user@dhoottransmission.com"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <PasswordInput
                    id="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Min. 6 characters"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <PasswordInput
                    id="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Re-enter password"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {USER_CREATION_ROLE_GROUPS.map((group) => (
                        <div key={group.label}>
                          <div className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                            {group.label}
                          </div>
                          {group.roles.map(role => (
                            <SelectItem key={role} value={role}>{role}</SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department *</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) => setFormData({ ...formData, department: value })}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_DEPARTMENTS.map(dept => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {!isMultiPlantRole ? (
                <div className="space-y-2">
                  <Label htmlFor="plant">Primary Plant *</Label>
                  <Select
                    value={formData.plant}
                    onValueChange={(value) => setFormData({ ...formData, plant: value })}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select plant" />
                    </SelectTrigger>
                    <SelectContent>
                      {PLANTS.map(plant => (
                        <SelectItem key={plant} value={plant}>{plant}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Plant Access * (Select all applicable)</Label>
                  <div className="border rounded-md p-4 space-y-2">
                    {PLANTS.map(plant => (
                      <div key={plant} className="flex items-center space-x-2">
                        <Checkbox
                          id={`plant-${plant}`}
                          checked={formData.plants.includes(plant)}
                          onCheckedChange={() => handlePlantToggle(plant)}
                          disabled={loading}
                        />
                        <label
                          htmlFor={`plant-${plant}`}
                          className="text-sm cursor-pointer"
                        >
                          {plant}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  className="flex-1"
                  style={{ backgroundColor: '#ed1c24' }}
                  disabled={loading}
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
