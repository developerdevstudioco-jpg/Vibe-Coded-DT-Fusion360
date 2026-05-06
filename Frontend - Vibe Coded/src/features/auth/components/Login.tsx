import { LogIn } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/button';
import logo from '../../../assets/logo.png';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { PasswordInput } from '../../../components/ui/password-input';
import { useAppDispatch } from '../../../store/hooks';
import { login } from '../authSlice';
import axiosInstance from '../../../api/axiosInstance';
import { toast } from 'sonner';
import { isPlantAdminRole, isSuperAdminRole } from '../../dashboard/components/files/roleUtils';

// Removed TEST_USERS & ROLE_ICONS as they are now mapped in the backend for JWT logic.

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axiosInstance.post('/api/auth/login', { username: email, password });
            const { user, token } = response.data;
            
            localStorage.setItem('token', token);
            dispatch(login(user));

            if (user.mustChangePassword) {
                navigate('/change-password');
                toast.success('Login successful. Please change your password to continue.');
            } else if (isSuperAdminRole(user.role)) {
                navigate('/super-admin-dashboard');
                toast.success('Login successful');
            } else if (isPlantAdminRole(user.role)) {
                navigate('/plant-admin-dashboard');
                toast.success('Login successful');
            } else {
                navigate('/dashboard');
                toast.success('Login successful');
            }
        } catch (error) {
            console.error('Login error', error);
            toast.error((error as any)?.response?.data?.message || 'Invalid credentials or system error');
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

                    <CardTitle className="text-3xl font-bold tracking-tight" style={{ color: '#393738' }}>
                        DT-Fusion360
                    </CardTitle>
                    <CardDescription className="text-base">
                        Project Lifecycle Management Software
                    </CardDescription>
                    <div className="text-xs text-muted-foreground">
                        Dhoot Transmission Ltd • Enterprise Edition
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" style={{ color: '#393738' }}>Email</Label>
                            <Input
                                id="email"
                                type="text"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" style={{ color: '#393738' }}>Password</Label>
                            <PasswordInput
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={loading || !email || !password}
                            className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                            style={{
                                backgroundColor: '#ed1c24',
                                color: 'white'
                            }}
                        >
                            <LogIn className="w-5 h-5 mr-2" />
                            {loading ? 'Logging in...' : 'Login'}
                        </Button>
                    </form>

                    <div className="text-center space-y-2 pt-4">
                        <p className="text-sm text-muted-foreground">
                            Need Help? Contact IT support for access issues or system errors use this mailId: <br />
                            <a href="mailto:supports@devstudioco.com" className="text-red-500 hover:underline">supports@devstudioco.com</a>
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
