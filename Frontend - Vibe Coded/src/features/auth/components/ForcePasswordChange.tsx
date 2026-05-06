import { ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../api/axiosInstance';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { PasswordInput } from '../../../components/ui/password-input';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { logout, updateUser } from '../authSlice';
import { isPlantAdminRole, isSuperAdminRole } from '../../dashboard/components/files/roleUtils';
import logo from '../../../assets/logo.png';

export default function ForcePasswordChange() {
    const currentUser = useAppSelector((state) => state.auth.user);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    const navigateToHome = (role: string) => {
        if (isSuperAdminRole(role)) {
            navigate('/super-admin-dashboard');
            return;
        }

        if (isPlantAdminRole(role)) {
            navigate('/plant-admin-dashboard');
            return;
        }

        navigate('/dashboard');
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!currentUser) {
            toast.error('Your session has expired. Please login again.');
            handleLogout();
            return;
        }

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            const response = await axiosInstance.post('/api/auth/change-password', {
                newPassword: password,
            });

            const updatedUser = response.data?.user ?? { ...currentUser, mustChangePassword: false };
            dispatch(updateUser(updatedUser));
            toast.success('Password updated successfully');
            navigateToHome(updatedUser.role);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4"
            style={{
                background: 'linear-gradient(135deg, #393738 0%, #1a1a1a 100%)'
            }}
        >
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-[#ed1c24] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#ed1c24] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-700" />
            </div>

            <Card className="w-full max-w-md relative z-10 shadow-2xl border-0">
                <CardHeader className="space-y-3 text-center pb-8">
                    <div className="flex justify-center mb-4">
                        <img src={logo} alt="DT-Fusion360 Logo" className="w-16 h-16 object-contain" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-slate-900">Change Your Password</CardTitle>
                    <CardDescription className="text-sm text-slate-600">
                        Your account was created with a temporary password. You must set a new password before continuing.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-5">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <PasswordInput
                                id="new-password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                placeholder="Enter your new password"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirm Password</Label>
                            <PasswordInput
                                id="confirm-password"
                                value={confirmPassword}
                                onChange={(event) => setConfirmPassword(event.target.value)}
                                placeholder="Confirm your new password"
                                required
                            />
                        </div>

                        <p className="text-xs text-slate-500">
                            Use at least 8 characters with uppercase, lowercase, number, and special character.
                        </p>

                        <Button
                            type="submit"
                            disabled={loading || !password || !confirmPassword}
                            className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                            style={{
                                backgroundColor: '#ed1c24',
                                color: 'white'
                            }}
                        >
                            {loading ? 'Updating Password...' : 'Update Password'}
                        </Button>
                    </form>

                    <Button
                        type="button"
                        variant="ghost"
                        onClick={handleLogout}
                        className="w-full text-slate-500"
                    >
                        Logout
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
