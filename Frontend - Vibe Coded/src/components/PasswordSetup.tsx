import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, CheckCircle, XCircle, Lock } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { passwordSetupAPI } from '../utils/supabase/client';
import { BRAND_COLORS } from '../utils/branding';
import { toast } from 'sonner';

interface PasswordSetupProps {
  token: string;
  onComplete: () => void;
}

interface PasswordRequirement {
  met: boolean;
  text: string;
}

export default function PasswordSetup({ token, onComplete }: PasswordSetupProps) {
  const [userData, setUserData] = useState<any>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tokenError, setTokenError] = useState('');

  useEffect(() => {
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    try {
      setLoading(true);
      const result = await passwordSetupAPI.verifyToken(token);
      if (result.success) {
        setUserData(result.user);
      } else {
        setTokenError(result.error || 'Invalid token');
      }
    } catch (error: any) {
      setTokenError(error.message || 'Failed to verify token');
    } finally {
      setLoading(false);
    }
  };

  const passwordRequirements: PasswordRequirement[] = [
    { met: password.length >= 8, text: 'At least 8 characters' },
    { met: /[A-Z]/.test(password), text: 'One uppercase letter' },
    { met: /[a-z]/.test(password), text: 'One lowercase letter' },
    { met: /[0-9]/.test(password), text: 'One number' },
    { met: password === confirmPassword && password.length > 0, text: 'Passwords match' }
  ];

  const allRequirementsMet = passwordRequirements.every(req => req.met);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!allRequirementsMet) {
      toast.error('Please meet all password requirements');
      return;
    }

    try {
      setSubmitting(true);
      const result = await passwordSetupAPI.completeSetup(token, password);

      if (result.success) {
        toast.success('Password set successfully! You can now log in.');
        setTimeout(() => {
          onComplete();
        }, 1500);
      }
    } catch (error: any) {
      console.error('Error completing setup:', error);
      toast.error(error.message || 'Failed to set password');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <p>Verifying your setup link...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <CardTitle className="text-center">Invalid or Expired Link</CardTitle>
            <CardDescription className="text-center">
              {tokenError}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-center text-muted-foreground mb-4">
              This password setup link may have expired or already been used. Please contact your administrator for a new setup link.
            </p>
            <Button
              onClick={onComplete}
              variant="outline"
              className="w-full"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: BRAND_COLORS.primaryLighter }}>
              <Lock className="w-8 h-8" style={{ color: BRAND_COLORS.primary }} />
            </div>
          </div>
          <CardTitle className="text-center">Set Your Password</CardTitle>
          <CardDescription className="text-center">
            Welcome to DT-Fusion360! Complete your account setup by creating a secure password.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* User Info */}
          <div className="mb-6 p-4 bg-slate-50 rounded-lg border">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Name:</span>
                <span className="text-sm font-medium">{userData?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Email:</span>
                <span className="text-sm font-medium">{userData?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Role:</span>
                <Badge variant="secondary">{userData?.role}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Plant:</span>
                <span className="text-sm font-medium">{userData?.plant}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Password Input */}
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="pr-10"
                  disabled={submitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-slate-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password *</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="pr-10"
                  disabled={submitting}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-slate-700"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="space-y-2 p-4 bg-slate-50 rounded-lg border">
              <p className="text-sm font-medium mb-2">Password Requirements:</p>
              <div className="space-y-1.5">
                {passwordRequirements.map((req, index) => (
                  <div key={index} className="flex items-center gap-2">
                    {req.met ? (
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                    )}
                    <span className={`text-xs ${req.met ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {req.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full text-white"
              style={{ backgroundColor: BRAND_COLORS.primary }}
              disabled={!allRequirementsMet || submitting}
            >
              {submitting ? 'Setting Password...' : 'Set Password & Complete Setup'}
            </Button>

            {/* Security Notice */}
            <p className="text-xs text-center text-muted-foreground">
              By setting your password, you agree to DT-Fusion360's security policies.
              Keep your password secure and do not share it with anyone.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
