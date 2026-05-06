import React, { useState } from 'react';
import { CheckCircle2, Circle, Factory, Users, FolderKanban, FileText, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { seedDemoUsers } from '../utils/seedDemoUsers';

interface InitializationGuideProps {
  onDismiss: () => void;
}

export default function InitializationGuide({ onDismiss }: InitializationGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSeeding, setIsSeeding] = useState(false);

  const steps = [
    {
      title: 'Welcome to DT-Fusion360',
      description: 'Production-ready R&D and QA management platform',
      icon: Factory,
      content: (
        <div className="space-y-4">
          <p>
            DT-Fusion360 is now fully configured with enterprise-grade security and multi-plant data isolation.
          </p>
          <div className="space-y-2">
            <h4 className="font-semibold">Key Features:</h4>
            <ul className="space-y-1 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" style={{ color: '#ed1c24' }} />
                Supabase backend with authentication
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" style={{ color: '#ed1c24' }} />
                Multi-plant security architecture
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" style={{ color: '#ed1c24' }} />
                Complete audit logging
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" style={{ color: '#ed1c24' }} />
                Role-based access control
              </li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: 'Create Your First User',
      description: 'Set up a SuperAdmin account',
      icon: Users,
      content: (
        <div className="space-y-4">
          <p>
            To get started, create your first SuperAdmin account by clicking <strong>"Create Account"</strong> on the login page.
          </p>
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <h4 className="font-semibold">SuperAdmin Setup:</h4>
            <ul className="text-sm space-y-1">
              <li>• <strong>Name:</strong> Your full name</li>
              <li>�� <strong>Email:</strong> Your email address</li>
              <li>• <strong>Password:</strong> Min. 6 characters (use strong password)</li>
              <li>• <strong>Role:</strong> Select "Super Admin"</li>
              <li>• <strong>Department:</strong> Choose your department</li>
              <li>• <strong>Plants:</strong> Select ALL plants for full access</li>
            </ul>
          </div>
          <div className="p-3 border-l-4 rounded" style={{ borderColor: '#ed1c24', backgroundColor: '#fff5f5' }}>
            <p className="text-sm">
              💡 <strong>Tip:</strong> SuperAdmin has access to all plants and can manage all users. This should be your first account.
            </p>
          </div>
        </div>
      )
    },
    {
      title: 'Multi-Plant Security',
      description: 'Understanding data isolation',
      icon: Factory,
      content: (
        <div className="space-y-4">
          <p>
            DT-Fusion360 implements strict plant-level data isolation to ensure users only see data from their assigned plants.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">SuperAdmin</CardTitle>
              </CardHeader>
              <CardContent className="text-xs">
                Access to ALL plants. Can manage all users and data.
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">PlantAdmin</CardTitle>
              </CardHeader>
              <CardContent className="text-xs">
                Access to multiple assigned plants. Can manage users in those plants.
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Manager</CardTitle>
              </CardHeader>
              <CardContent className="text-xs">
                Access to assigned plants. Can view and edit projects/forms.
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Engineer/QA</CardTitle>
              </CardHeader>
              <CardContent className="text-xs">
                Access to single plant only. Cannot see other plants' data.
              </CardContent>
            </Card>
          </div>
        </div>
      )
    },
    {
      title: 'Create Projects & Forms',
      description: 'Start collaborating',
      icon: FolderKanban,
      content: (
        <div className="space-y-4">
          <p>
            Once logged in, you can start creating projects and forms. All data is automatically associated with your plant.
          </p>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                   style={{ backgroundColor: '#ed1c24' }}>
                <span className="text-white">1</span>
              </div>
              <div>
                <h4 className="font-semibold">Create Projects</h4>
                <p className="text-sm text-muted-foreground">
                  Navigate to Projects → Create Project. Enter project details and assign to a plant.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                   style={{ backgroundColor: '#ed1c24' }}>
                <span className="text-white">2</span>
              </div>
              <div>
                <h4 className="font-semibold">Add Forms</h4>
                <p className="text-sm text-muted-foreground">
                  Go to Forms → Create Form. Select project and fill in form details (UCL, FT, Machine).
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                   style={{ backgroundColor: '#ed1c24' }}>
                <span className="text-white">3</span>
              </div>
              <div>
                <h4 className="font-semibold">Manage Tasks</h4>
                <p className="text-sm text-muted-foreground">
                  Create tasks linked to projects. Assign to team members and track progress.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Optional: Load Demo Data',
      description: 'Test with sample data',
      icon: FileText,
      content: (
        <div className="space-y-4">
          <p>
            If you want to test the system with pre-populated demo data, you can run the seed script.
          </p>
          <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm">
            <div className="mb-2 text-gray-400">// Open browser console (F12)</div>
            <div>import &#123; seedDatabase &#125; from './utils/seed';</div>
            <div>await seedDatabase();</div>
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Demo Credentials:</h4>
            <ul className="text-sm space-y-1 font-mono">
              <li>• superadmin@dt.com / test123</li>
              <li>• plantadmin@dt.com / test123</li>
              <li>• engineer@dt.com / test123</li>
              <li>• qa@dt.com / test123</li>
            </ul>
          </div>
          <div className="p-3 border-l-4 rounded" style={{ borderColor: '#ed1c24', backgroundColor: '#fff5f5' }}>
            <p className="text-sm">
              ⚠️ <strong>Note:</strong> Demo data will create sample users, projects, forms, and tasks. This is optional and can be skipped.
            </p>
          </div>
        </div>
      )
    }
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;
  const CurrentIcon = steps[currentStep].icon;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="border-b">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center"
                 style={{ backgroundColor: '#ed1c24' }}>
              <CurrentIcon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <CardTitle>{steps[currentStep].title}</CardTitle>
              <CardDescription>{steps[currentStep].description}</CardDescription>
            </div>
            <Badge variant="outline">
              Step {currentStep + 1} of {steps.length}
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-6">
          {steps[currentStep].content}
        </CardContent>

        <div className="border-t p-6 flex items-center justify-between bg-muted/30">
          <div className="flex gap-2">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className="w-2 h-2 rounded-full transition-all"
                style={{
                  backgroundColor: index === currentStep ? '#ed1c24' : '#d1d5db'
                }}
              />
            ))}
          </div>

          <div className="flex gap-3">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={() => setCurrentStep(currentStep - 1)}
              >
                Previous
              </Button>
            )}
            {currentStep < steps.length - 1 ? (
              <Button
                onClick={() => setCurrentStep(currentStep + 1)}
                style={{ backgroundColor: '#ed1c24' }}
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={onDismiss}
                style={{ backgroundColor: '#ed1c24' }}
              >
                Get Started
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}