import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../App';
import { Button } from './ui/button';
import {
  Users,
  X,
  CheckCircle2,
  Loader2,
  Search,
  AlertCircle
} from 'lucide-react';
import { Input } from './ui/input';
import { usersAPI } from '../utils/supabase/client';

interface UserSwitcherProps {
  currentUser: User;
  onUserChange: (user: User) => void;
}

// Role icons mapping
const ROLE_ICONS: Record<string, string> = {
  'SuperAdmin': '👑',
  'PlantAdmin': '🏭',
  'Plant Head': '🏢',
  'Admin': '⚙️',
  'VP': '💼',
  'COO': '💼',
  'Assistant VP': '💼',
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

export default function UserSwitcher({ currentUser, onUserChange }: UserSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all users when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      // Since auth was removed, use a hardcoded list of predefined users
      // In a real scenario, you would fetch from the backend with proper auth
      const mockUsers: User[] = [
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

      setUsers(mockUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (user: User) => {
    onUserChange(user);
    setIsOpen(false);
    setSearchQuery('');
  };

  // Filter users based on search query
  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query) ||
      (typeof user.department === 'string' && user.department.toLowerCase().includes(query)) ||
      (Array.isArray(user.department) && user.department.some(d => d.toLowerCase().includes(query))) ||
      (typeof user.plant === 'string' && user.plant.toLowerCase().includes(query)) ||
      (user.plants && user.plants.some(p => p.toLowerCase().includes(query)))
    );
  });

  // Group users by role
  const groupedUsers = filteredUsers.reduce((acc, user) => {
    const role = user.role;
    if (!acc[role]) {
      acc[role] = [];
    }
    acc[role].push(user);
    return acc;
  }, {} as Record<string, User[]>);

  // Sort role groups by hierarchy
  const roleOrder = [
    'SuperAdmin', 'PlantAdmin', 'Plant Head', 'Admin',
    'VP', 'COO', 'Assistant VP',
    'GM', 'DGM', 'AGM',
    'Manager', 'Deputy Manager', 'Assistant Manager',
    'Senior Engineer', 'Senior Executive', 'Senior Officer',
    'Junior Engineer', 'Junior Executive', 'Junior Officer',
    'QA'
  ];

  const sortedRoles = Object.keys(groupedUsers).sort((a, b) => {
    const indexA = roleOrder.indexOf(a);
    const indexB = roleOrder.indexOf(b);
    if (indexA === -1 && indexB === -1) return a.localeCompare(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  const getRoleIcon = (role: string) => {
    return ROLE_ICONS[role] || '👤';
  };

  const getUserDescription = (user: User) => {
    const deptStr = Array.isArray(user.department)
      ? user.department.join(', ')
      : user.department;
    const plantCount = user.plants?.length || 1;
    return `${deptStr} • ${plantCount} plant${plantCount > 1 ? 's' : ''}`;
  };

  return (
    <>
      {/* Switch User Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2 hover:bg-[#fff5f5] hover:border-[#ed1c24]"
      >
        <Users className="w-4 h-4" />
        <span className="hidden sm:inline">Switch User</span>
      </Button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: '#e5e7eb' }}>
              <div>
                <h2 className="text-xl font-bold" style={{ color: '#393738' }}>
                  Switch User
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Select a user to test different roles and permissions
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Current User */}
            <div className="p-6 bg-[#fff5f5] border-b" style={{ borderColor: '#e5e7eb' }}>
              <div className="text-xs font-semibold text-muted-foreground mb-2">
                CURRENT USER
              </div>
              <div className="flex items-center gap-3">
                <div className="text-3xl">
                  {getRoleIcon(currentUser.role)}
                </div>
                <div>
                  <div className="font-semibold" style={{ color: '#393738' }}>
                    {currentUser.name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {currentUser.email} • {currentUser.role}
                  </div>
                </div>
                <CheckCircle2 className="w-5 h-5 ml-auto" style={{ color: '#ed1c24' }} />
              </div>
            </div>

            {/* Search Bar */}
            <div className="p-6 border-b" style={{ borderColor: '#e5e7eb' }}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by name, email, role, department, or plant..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              {searchQuery && (
                <div className="text-xs text-muted-foreground mt-2">
                  Found {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>

            {/* User List */}
            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 380px)' }}>
              <div className="text-xs font-semibold text-muted-foreground mb-3">
                AVAILABLE USERS {!loading && !error && `(${users.length})`}
              </div>
              <div className="grid grid-cols-1 gap-3">
                {loading && (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                )}
                {error && (
                  <div className="flex items-center justify-center p-4 text-red-500">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    {error}
                  </div>
                )}
                {!loading && !error && sortedRoles.map(role => {
                  return (
                    <div key={role}>
                      <div className="text-sm font-semibold text-muted-foreground mb-1">
                        {role}
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        {groupedUsers[role].map(user => {
                          const isCurrent = user.email === currentUser.email;

                          return (
                            <button
                              key={user.id}
                              onClick={() => !isCurrent && handleUserSelect(user)}
                              disabled={isCurrent}
                              className={`
                                p-4 rounded-lg border-2 text-left transition-all
                                ${isCurrent
                                  ? 'border-[#ed1c24] bg-[#fff5f5] cursor-default'
                                  : 'border-gray-200 hover:border-[#ed1c24] hover:bg-[#fff5f5] cursor-pointer'
                                }
                              `}
                            >
                              <div className="flex items-start gap-3">
                                <div className="text-3xl">{getRoleIcon(user.role)}</div>
                                <div className="flex-1">
                                  <div className="font-semibold text-sm" style={{ color: '#393738' }}>
                                    {user.name}
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {user.email} • {user.role}
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {getUserDescription(user)}
                                  </div>
                                </div>
                                {isCurrent && (
                                  <CheckCircle2 className="w-5 h-5" style={{ color: '#ed1c24' }} />
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t bg-gray-50" style={{ borderColor: '#e5e7eb' }}>
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="font-semibold" style={{ color: '#ed1c24' }}>ℹ</span>
                <p>
                  <strong>Tip:</strong> Switching users allows you to test role-based access control (RBAC)
                  and see how different permissions affect the UI. Your session data will be preserved.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}