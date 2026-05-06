import React, { useState } from 'react';
import { User } from '../App';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Factory, LogIn, Users as UsersIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface LoginProps {
  onLogin: (user: User) => void;
}

// All available test users
const TEST_USERS: User[] = [
  {
    id: 'user-superadmin',
    name: 'Rajesh Kumar',
    email: 'admin@dhoot.com',
    role: 'SuperAdmin',
    department: 'Admin / Management Office',
    plant: 'Aurangabad Plant 1',
    plants: ['Aurangabad Plant 1', 'Aurangabad Plant 2', 'Pune Plant', 'Nashik Plant'],
    isActive: true
  },
  {
    id: 'user-plantadmin',
    name: 'Priya Desai',
    email: 'plantadmin@dhoot.com',
    role: 'PlantAdmin',
    department: 'Production',
    plant: 'Aurangabad Plant 1',
    plants: ['Aurangabad Plant 1'],
    isActive: true
  },
  {
    id: 'user-planthead-1',
    name: 'Vijay Naik',
    email: 'planthead.aurangabad1@dhoot.com',
    role: 'Plant Head',
    department: 'Operations',
    plant: 'Aurangabad Plant 1',
    plants: ['Aurangabad Plant 1'],
    isActive: true
  },
  {
    id: 'user-planthead-2',
    name: 'Smita Joshi',
    email: 'planthead.pune@dhoot.com',
    role: 'Plant Head',
    department: 'Operations',
    plant: 'Pune Plant',
    plants: ['Pune Plant'],
    isActive: true
  },
  {
    id: 'user-planthead-3',
    name: 'Rohit Deshmukh',
    email: 'planthead.nashik@dhoot.com',
    role: 'Plant Head',
    department: 'Operations',
    plant: 'Nashik Plant',
    plants: ['Nashik Plant'],
    isActive: true
  },
  {
    id: 'user-planthead-4',
    name: 'Ashok Bhalerao',
    email: 'planthead.aurangabad2@dhoot.com',
    role: 'Plant Head',
    department: 'Operations',
    plant: 'Aurangabad Plant 2',
    plants: ['Aurangabad Plant 2'],
    isActive: true
  },
  {
    id: 'user-vp',
    name: 'Anil Sharma',
    email: 'vp@dhoot.com',
    role: 'VP',
    department: 'Operations',
    plant: 'Aurangabad Plant 1',
    plants: ['Aurangabad Plant 1', 'Aurangabad Plant 2'],
    isActive: true
  },
  {
    id: 'user-coo',
    name: 'Sandeep Joshi',
    email: 'coo@dhoot.com',
    role: 'COO',
    department: 'Operations',
    plant: 'Aurangabad Plant 1',
    plants: ['Aurangabad Plant 1', 'Aurangabad Plant 2', 'Pune Plant', 'Nashik Plant'],
    isActive: true
  },
  {
    id: 'user-gm-1',
    name: 'Manoj Patil',
    email: 'gm.production@dhoot.com',
    role: 'GM',
    department: 'Production',
    plant: 'Aurangabad Plant 1',
    plants: ['Aurangabad Plant 1'],
    isActive: true
  },
  {
    id: 'user-gm-2',
    name: 'Suresh Kulkarni',
    email: 'gm.quality@dhoot.com',
    role: 'GM',
    department: 'Quality Assurance (QA)',
    plant: 'Pune Plant',
    plants: ['Pune Plant'],
    isActive: true
  },
  {
    id: 'user-dgm-1',
    name: 'Rakesh Verma',
    email: 'dgm.rd@dhoot.com',
    role: 'DGM',
    department: 'R&D',
    plant: 'Aurangabad Plant 1',
    plants: ['Aurangabad Plant 1', 'Pune Plant'],
    isActive: true
  },
  {
    id: 'user-agm-1',
    name: 'Deepak Rane',
    email: 'agm.production@dhoot.com',
    role: 'AGM',
    department: 'Production',
    plant: 'Nashik Plant',
    plants: ['Nashik Plant'],
    isActive: true
  },
  {
    id: 'user-manager-1',
    name: 'Vikram Singh',
    email: 'manager.rd@dhoot.com',
    role: 'Manager',
    department: 'R&D',
    plant: 'Aurangabad Plant 1',
    plants: ['Aurangabad Plant 1', 'Pune Plant'],
    isActive: true
  },
  {
    id: 'user-manager-2',
    name: 'Pooja Gupta',
    email: 'manager.manufacturing@dhoot.com',
    role: 'Manager',
    department: 'Manufacturing',
    plant: 'Aurangabad Plant 2',
    plants: ['Aurangabad Plant 2'],
    isActive: true
  },
  {
    id: 'user-manager-3',
    name: 'Ramesh Iyer',
    email: 'manager.ped@dhoot.com',
    role: 'Manager',
    department: 'PED',
    plant: 'Pune Plant',
    plants: ['Pune Plant'],
    isActive: true
  },
  {
    id: 'user-deputy-manager-1',
    name: 'Kiran Deshmukh',
    email: 'dmanager.qa@dhoot.com',
    role: 'Deputy Manager',
    department: 'Quality Assurance (QA)',
    plant: 'Aurangabad Plant 1',
    plants: ['Aurangabad Plant 1'],
    isActive: true
  },
  {
    id: 'user-asst-manager-1',
    name: 'Neha Pawar',
    email: 'amanager.purchase@dhoot.com',
    role: 'Assistant Manager',
    department: 'Purchase',
    plant: 'Aurangabad Plant 1',
    plants: ['Aurangabad Plant 1'],
    isActive: true
  },
  {
    id: 'user-sr-engineer-1',
    name: 'Amit Patel',
    email: 'sengineer.rd@dhoot.com',
    role: 'Senior Engineer',
    department: 'R&D',
    plant: 'Aurangabad Plant 1',
    plants: ['Aurangabad Plant 1'],
    isActive: true
  },
  {
    id: 'user-sr-engineer-2',
    name: 'Sachin Bhosale',
    email: 'sengineer.production@dhoot.com',
    role: 'Senior Engineer',
    department: 'Production',
    plant: 'Pune Plant',
    plants: ['Pune Plant'],
    isActive: true
  },
  {
    id: 'user-sr-engineer-3',
    name: 'Vishal Jain',
    email: 'sengineer.maintenance@dhoot.com',
    role: 'Senior Engineer',
    department: 'Maintenance',
    plant: 'Nashik Plant',
    plants: ['Nashik Plant'],
    isActive: true
  },
  {
    id: 'user-sr-exec-1',
    name: 'Kavita Nair',
    email: 'sexec.ped@dhoot.com',
    role: 'Senior Executive',
    department: 'PED',
    plant: 'Aurangabad Plant 2',
    plants: ['Aurangabad Plant 2'],
    isActive: true
  },
  {
    id: 'user-sr-officer-1',
    name: 'Sanjay Reddy',
    email: 'sofficer.purchase@dhoot.com',
    role: 'Senior Officer',
    department: 'Purchase',
    plant: 'Pune Plant',
    plants: ['Pune Plant'],
    isActive: true
  },
  {
    id: 'user-jr-engineer-1',
    name: 'Rahul Sawant',
    email: 'jengineer.rd@dhoot.com',
    role: 'Junior Engineer',
    department: 'R&D',
    plant: 'Aurangabad Plant 1',
    plants: ['Aurangabad Plant 1'],
    isActive: true
  },
  {
    id: 'user-jr-engineer-2',
    name: 'Priyanka Shinde',
    email: 'jengineer.production@dhoot.com',
    role: 'Junior Engineer',
    department: 'Production',
    plant: 'Aurangabad Plant 2',
    plants: ['Aurangabad Plant 2'],
    isActive: true
  },
  {
    id: 'user-jr-exec-1',
    name: 'Tushar Kadam',
    email: 'jexec.manufacturing@dhoot.com',
    role: 'Junior Executive',
    department: 'Manufacturing',
    plant: 'Nashik Plant',
    plants: ['Nashik Plant'],
    isActive: true
  },
  {
    id: 'user-jr-officer-1',
    name: 'Sneha Raut',
    email: 'jofficer.purchase@dhoot.com',
    role: 'Junior Officer',
    department: 'Purchase',
    plant: 'Aurangabad Plant 1',
    plants: ['Aurangabad Plant 1'],
    isActive: true
  },
  {
    id: 'user-qa-1',
    name: 'Anjali Mehta',
    email: 'qa.specialist@dhoot.com',
    role: 'QA',
    department: 'Quality Assurance (QA)',
    plant: 'Aurangabad Plant 1',
    plants: ['Aurangabad Plant 1'],
    isActive: true
  },
  {
    id: 'user-qa-2',
    name: 'Ganesh Kale',
    email: 'qa.inspector@dhoot.com',
    role: 'QA',
    department: 'Quality Assurance (QA)',
    plant: 'Pune Plant',
    plants: ['Pune Plant'],
    isActive: true
  },
  {
    id: 'user-qa-3',
    name: 'Madhuri Deshpande',
    email: 'qa.auditor@dhoot.com',
    role: 'QA',
    department: 'Quality Assurance (QA)',
    plant: 'Nashik Plant',
    plants: ['Nashik Plant'],
    isActive: true
  },
  {
    id: 'user-admin-1',
    name: 'Arjun Khanna',
    email: 'admin.systems@dhoot.com',
    role: 'Admin',
    department: 'Admin / Management Office',
    plant: 'Aurangabad Plant 1',
    plants: ['Aurangabad Plant 1'],
    isActive: true
  }
];

// Role icons mapping
const ROLE_ICONS: Record<string, string> = {
  'SuperAdmin': '👑',
  'PlantAdmin': '🏭',
  'Plant Head': '🏢',
  'Admin': '⚙️',
  'VP': '💼',
  'COO': '💼',
  'GM': '👔',
  'DGM': '👔',
  'AGM': '👔',
  'Manager': '👔',
  'Deputy Manager': '👔',
  'Assistant Manager': '👔',
  'Senior Engineer': '🔧',
  'Senior Executive': '🔧',
  'Senior Officer': '🔧',
  'Junior Engineer': '🔨',
  'Junior Executive': '🔨',
  'Junior Officer': '🔨',
  'QA': '✓',
};

export default function Login({ onLogin }: LoginProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    const user = TEST_USERS.find(u => u.id === userId);
    setSelectedUser(user || null);
  };

  const handleLogin = () => {
    if (selectedUser) {
      onLogin(selectedUser);
    }
  };

  const getRoleIcon = (role: string) => {
    return ROLE_ICONS[role] || '👤';
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
            <div 
              className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-2xl"
              style={{ backgroundColor: '#ed1c24' }}
            >
              <Factory className="w-12 h-12 text-white" />
            </div>
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
          {/* User Selection */}
          <div className="space-y-3">
            <label className="text-sm font-semibold flex items-center gap-2" style={{ color: '#393738' }}>
              <UsersIcon className="w-4 h-4" style={{ color: '#ed1c24' }} />
              Select User
            </label>
            <Select value={selectedUserId} onValueChange={handleUserSelect}>
              <SelectTrigger className="w-full h-12 text-base border-2 hover:border-[#ed1c24] transition-colors">
                <SelectValue placeholder="Choose your account..." />
              </SelectTrigger>
              <SelectContent className="max-h-[400px]">
                {TEST_USERS.map((user) => (
                  <SelectItem 
                    key={user.id} 
                    value={user.id}
                    className="cursor-pointer py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getRoleIcon(user.role)}</span>
                      <div className="flex flex-col">
                        <span className="font-semibold">{user.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {user.role} • {user.department}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selected User Preview */}
          {selectedUser && (
            <div 
              className="p-4 rounded-xl border-2 animate-in fade-in slide-in-from-bottom-2 duration-300"
              style={{ 
                backgroundColor: '#fff5f5',
                borderColor: '#ed1c24'
              }}
            >
              <div className="flex items-start gap-3">
                <div className="text-4xl">{getRoleIcon(selectedUser.role)}</div>
                <div className="flex-1">
                  <div className="font-bold text-lg" style={{ color: '#393738' }}>
                    {selectedUser.name}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {selectedUser.email}
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs">
                    <span 
                      className="px-2 py-1 rounded-md font-semibold"
                      style={{ 
                        backgroundColor: '#ed1c24',
                        color: 'white'
                      }}
                    >
                      {selectedUser.role}
                    </span>
                    <span className="text-muted-foreground">
                      {selectedUser.plants?.length || 1} plant{(selectedUser.plants?.length || 1) > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {Array.isArray(selectedUser.department) 
                      ? selectedUser.department.join(', ') 
                      : selectedUser.department}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Login Button */}
          <Button
            onClick={handleLogin}
            disabled={!selectedUser}
            className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
            style={{ 
              backgroundColor: selectedUser ? '#ed1c24' : '#9ca3af',
              color: 'white'
            }}
          >
            <LogIn className="w-5 h-5 mr-2" />
            {selectedUser ? `Login as ${selectedUser.name}` : 'Select a user to continue'}
          </Button>

          {/* Info Text */}
          <div className="text-center space-y-2">
            <p className="text-xs text-muted-foreground">
              <strong>{TEST_USERS.length} test accounts</strong> available for development
            </p>
            <p className="text-xs text-muted-foreground">
              No password required • Direct access enabled
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}