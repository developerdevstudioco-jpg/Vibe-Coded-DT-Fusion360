import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { usersAPI, projectsAPI, formsAPI, auditAPI } from '../utils/supabase/client';

interface SystemHealthProps {
  userRole: string;
}

interface HealthCheck {
  name: string;
  status: 'success' | 'error' | 'warning' | 'loading';
  message: string;
  details?: string;
}

export default function SystemHealth({ userRole }: SystemHealthProps) {
  const [checks, setChecks] = useState<HealthCheck[]>([]);
  const [loading, setLoading] = useState(true);

  const runHealthChecks = async () => {
    setLoading(true);
    const results: HealthCheck[] = [];

    // Check 1: Backend Connection
    try {
      const response = await fetch('https://szesnuacnlcfwpjrxehl.supabase.co/functions/v1/make-server-767ffd61/health');
      if (response.ok) {
        results.push({
          name: 'Backend Server',
          status: 'success',
          message: 'Connected and operational',
          details: 'Supabase Edge Function is running'
        });
      } else {
        results.push({
          name: 'Backend Server',
          status: 'error',
          message: 'Server returned error',
          details: `HTTP ${response.status}`
        });
      }
    } catch (error) {
      results.push({
        name: 'Backend Server',
        status: 'error',
        message: 'Cannot connect to server',
        details: 'Check network connection'
      });
    }

    // Check 2: Database (Users)
    if (userRole === 'SuperAdmin' || userRole === 'PlantAdmin') {
      try {
        const result = await usersAPI.getAll();
        if (result.success) {
          const userCount = result.users.length;
          results.push({
            name: 'User Database',
            status: 'success',
            message: `${userCount} user${userCount !== 1 ? 's' : ''} configured`,
            details: userCount === 0 ? 'Create users to get started' : undefined
          });
        }
      } catch (error) {
        results.push({
          name: 'User Database',
          status: 'warning',
          message: 'Could not fetch users',
          details: 'Check permissions'
        });
      }
    }

    // Check 3: Projects
    try {
      const result = await projectsAPI.getAll();
      if (result.success) {
        const projectCount = result.projects.length;
        results.push({
          name: 'Projects',
          status: projectCount > 0 ? 'success' : 'warning',
          message: `${projectCount} project${projectCount !== 1 ? 's' : ''} found`,
          details: projectCount === 0 ? 'Create your first project' : undefined
        });
      }
    } catch (error) {
      results.push({
        name: 'Projects',
        status: 'error',
        message: 'Cannot access projects',
        details: 'Check authentication'
      });
    }

    // Check 4: Forms
    try {
      const result = await formsAPI.getAll();
      if (result.success) {
        const formCount = result.forms.length;
        results.push({
          name: 'Forms',
          status: formCount > 0 ? 'success' : 'warning',
          message: `${formCount} form${formCount !== 1 ? 's' : ''} found`,
          details: formCount === 0 ? 'Forms can be created after projects' : undefined
        });
      }
    } catch (error) {
      results.push({
        name: 'Forms',
        status: 'warning',
        message: 'Cannot access forms',
        details: 'This is optional'
      });
    }

    // Check 5: Audit Logs (SuperAdmin only)
    if (userRole === 'SuperAdmin') {
      try {
        const result = await auditAPI.getAll();
        if (result.success) {
          const logCount = result.logs.length;
          results.push({
            name: 'Audit Logs',
            status: 'success',
            message: `${logCount} audit log${logCount !== 1 ? 's' : ''} recorded`,
            details: 'All operations are being logged'
          });
        }
      } catch (error) {
        results.push({
          name: 'Audit Logs',
          status: 'warning',
          message: 'Cannot access audit logs',
          details: 'Logging may still be working'
        });
      }
    }

    setChecks(results);
    setLoading(false);
  };

  useEffect(() => {
    runHealthChecks();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'loading':
        return <Loader2 className="w-5 h-5 animate-spin text-blue-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      success: { variant: 'default', className: 'bg-green-100 text-green-800 border-green-300' },
      error: { variant: 'destructive' },
      warning: { variant: 'secondary', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      loading: { variant: 'outline' }
    };
    
    const config = variants[status] || variants.default;
    return <Badge {...config}>{status.toUpperCase()}</Badge>;
  };

  const overallStatus = checks.every(c => c.status === 'success') ? 'success' :
                        checks.some(c => c.status === 'error') ? 'error' : 'warning';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Production readiness status</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(overallStatus)}
            <Button
              variant="outline"
              size="sm"
              onClick={runHealthChecks}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading && checks.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#ed1c24' }} />
            <span className="ml-3 text-muted-foreground">Running health checks...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {checks.map((check, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-4 border rounded-lg hover:bg-muted/30 transition-colors"
              >
                <div className="mt-0.5">
                  {getStatusIcon(check.status)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{check.name}</h4>
                    {getStatusBadge(check.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">{check.message}</p>
                  {check.details && (
                    <p className="text-xs text-muted-foreground mt-1">
                      💡 {check.details}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && checks.length > 0 && (
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">Status Summary</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Total Checks</div>
                <div className="text-2xl font-bold">{checks.length}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Passed</div>
                <div className="text-2xl font-bold text-green-600">
                  {checks.filter(c => c.status === 'success').length}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Issues</div>
                <div className="text-2xl font-bold text-yellow-600">
                  {checks.filter(c => c.status === 'warning' || c.status === 'error').length}
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && overallStatus === 'success' && (
          <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: '#e6f7e6', borderLeft: '4px solid #4caf50' }}>
            <p className="text-sm">
              ✅ <strong>All systems operational!</strong> Your DT-Fusion360 platform is production-ready.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
