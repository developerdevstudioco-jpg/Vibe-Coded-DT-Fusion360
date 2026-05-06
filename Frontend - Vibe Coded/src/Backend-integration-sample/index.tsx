import React, { useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { submitSampleForm, SampleFormData, resetFormStatus } from '../features/slices/sampleSlice';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Loader2, Send, RotateCcw } from 'lucide-react';

import { User, Page } from '../types';
import Layout from '../components/Layout';

interface BackendIntegrationSampleProps {
    user: User;
    onNavigate: (page: Page) => void;
    onLogout: () => void;
}

const validationSchema = Yup.object().shape({
    projectName: Yup.string().required('Project name is required'),
    projectCode: Yup.string().required('Project code is required'),
    startDate: Yup.string().required('Start date is required'),
    endDate: Yup.string().required('End date is required'),
    priority: Yup.string().required('Priority is required'),
    status: Yup.string().required('Status is required'),
    budget: Yup.number().required('Budget is required').min(0, 'Budget must be positive'),
    leadEngineer: Yup.string().required('Lead engineer is required'),
    department: Yup.string().required('Department is required'),
    description: Yup.string(),
});

export default function BackendIntegrationSample({ user, onNavigate, onLogout }: BackendIntegrationSampleProps) {
    const dispatch = useAppDispatch();
    const { loading, error, success, formData } = useAppSelector((state) => state.sample);

    const formik = useFormik<SampleFormData>({
        initialValues: {
            projectName: '',
            projectCode: '',
            startDate: '',
            endDate: '',
            priority: 'medium',
            status: 'planned',
            budget: 0,
            leadEngineer: '',
            department: '',
            description: '',
        },
        // validationSchema,
        onSubmit: (values) => {
            dispatch(submitSampleForm(values));
        },
    });

    useEffect(() => {
        if (success) {
            toast.success('Form submitted successfully!');
            formik.resetForm();
            dispatch(resetFormStatus());
        }
        if (error) {
            toast.error(error);
        }
    }, [success, error, dispatch, formik]);

    return (
        <Layout user={user} currentPage="BackendIntegrationSample" onNavigate={onNavigate} onLogout={onLogout} title="Integration Sample">
            <div className="container mx-auto py-10 max-w-2xl px-4">
                <Card className="shadow-lg border-t-4 border-t-[#ed1c24]">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold">Project Integration Sample</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={formik.handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* 1. Project Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="projectName">Project Name *</Label>
                                    <Input
                                        id="projectName"
                                        placeholder="Enter project name"
                                        {...formik.getFieldProps('projectName')}
                                    />
                                    {formik.touched.projectName && formik.errors.projectName && (
                                        <p className="text-xs text-destructive">{formik.errors.projectName}</p>
                                    )}
                                </div>

                                {/* 2. Project Code */}
                                <div className="space-y-2">
                                    <Label htmlFor="projectCode">Project Code *</Label>
                                    <Input
                                        id="projectCode"
                                        placeholder="P-001"
                                        {...formik.getFieldProps('projectCode')}
                                    />
                                    {formik.touched.projectCode && formik.errors.projectCode && (
                                        <p className="text-xs text-destructive">{formik.errors.projectCode}</p>
                                    )}
                                </div>

                                {/* 3. Start Date */}
                                <div className="space-y-2">
                                    <Label htmlFor="startDate">Start Date *</Label>
                                    <Input
                                        id="startDate"
                                        type="date"
                                        {...formik.getFieldProps('startDate')}
                                    />
                                    {formik.touched.startDate && formik.errors.startDate && (
                                        <p className="text-xs text-destructive">{formik.errors.startDate}</p>
                                    )}
                                </div>

                                {/* 4. End Date */}
                                <div className="space-y-2">
                                    <Label htmlFor="endDate">End Date *</Label>
                                    <Input
                                        id="endDate"
                                        type="date"
                                        {...formik.getFieldProps('endDate')}
                                    />
                                    {formik.touched.endDate && formik.errors.endDate && (
                                        <p className="text-xs text-destructive">{formik.errors.endDate}</p>
                                    )}
                                </div>

                                {/* 5. Priority */}
                                <div className="space-y-2">
                                    <Label>Priority *</Label>
                                    <Select
                                        onValueChange={(val) => formik.setFieldValue('priority', val)}
                                        value={formik.values.priority}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select priority" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {formik.touched.priority && formik.errors.priority && (
                                        <p className="text-xs text-destructive">{formik.errors.priority}</p>
                                    )}
                                </div>

                                {/* 6. Status */}
                                <div className="space-y-2">
                                    <Label>Status *</Label>
                                    <Select
                                        onValueChange={(val) => formik.setFieldValue('status', val)}
                                        value={formik.values.status}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="planned">Planned</SelectItem>
                                            <SelectItem value="in-progress">In Progress</SelectItem>
                                            <SelectItem value="completed">Completed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {formik.touched.status && formik.errors.status && (
                                        <p className="text-xs text-destructive">{formik.errors.status}</p>
                                    )}
                                </div>

                                {/* 7. Budget */}
                                <div className="space-y-2">
                                    <Label htmlFor="budget">Budget (INR) *</Label>
                                    <Input
                                        id="budget"
                                        type="number"
                                        placeholder="0.00"
                                        {...formik.getFieldProps('budget')}
                                    />
                                    {formik.touched.budget && formik.errors.budget && (
                                        <p className="text-xs text-destructive">{formik.errors.budget}</p>
                                    )}
                                </div>

                                {/* 8. Lead Engineer */}
                                <div className="space-y-2">
                                    <Label htmlFor="leadEngineer">Lead Engineer *</Label>
                                    <Input
                                        id="leadEngineer"
                                        placeholder="Engineer name"
                                        {...formik.getFieldProps('leadEngineer')}
                                    />
                                    {formik.touched.leadEngineer && formik.errors.leadEngineer && (
                                        <p className="text-xs text-destructive">{formik.errors.leadEngineer}</p>
                                    )}
                                </div>

                                {/* 9. Department */}
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="department">Department *</Label>
                                    <Input
                                        id="department"
                                        placeholder="e.g. Production, QA, R&D"
                                        {...formik.getFieldProps('department')}
                                    />
                                    {formik.touched.department && formik.errors.department && (
                                        <p className="text-xs text-destructive">{formik.errors.department}</p>
                                    )}
                                </div>

                                {/* 10. Description */}
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Enter project details..."
                                        rows={4}
                                        {...formik.getFieldProps('description')}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <Button
                                    type="submit"
                                    className="flex-1 bg-[#ed1c24] hover:bg-[#d11920]"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="mr-2 h-4 w-4" />
                                            Submit Project
                                        </>
                                    )}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => formik.resetForm()}
                                    disabled={loading}
                                >
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Reset
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}
