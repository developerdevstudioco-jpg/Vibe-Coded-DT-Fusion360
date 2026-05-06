import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Download, FileDown, FileSpreadsheet, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { Page, User } from '../types';
import Layout from './Layout';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { deleteCalibration, fetchCalibrations, syncCalibrations, type CalibrationRecord } from '../features/calibration/calibrationSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';

interface CalibrationManagementProps {
  user: User;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

type FrequencyOption = '1 Month' | '3 Month' | '6 Month' | '12 Month' | 'Custom';
type FrequencyUnit = 'Days' | 'Months';

type CalibrationFormState = {
  slNo: string;
  instrument: string;
  make: string;
  instrumentId: string;
  serialNo: string;
  leastCount: string;
  range: string;
  location: string;
  acceptanceCriteria: string;
  maxPermissibleError: string;
  calibrationOn: string;
  certificateNo: string;
  calibratedBy: string;
  frequencyOption: FrequencyOption;
  customFrequencyValue: string;
  customFrequencyUnit: FrequencyUnit;
  certificateVerifiedBy: string;
  remarks: string;
};

const CALIBRATION_UPLOAD_HEADERS = [
  'Sl No.',
  'Instrument / Equipment Name',
  'Make',
  'Instruments ID No.',
  'Serial No.',
  'Least Count',
  'Range',
  'Location',
  'Acceptance Criteria STD',
  'Max Permissible Error',
  'Calibration on',
  'Certificate No.',
  'Calibrated by',
  'Calibration Frequency',
  'Certificate Verified By',
  'Remarks',
] as const;

const CALIBRATION_TABLE_HEADERS = [
  ...CALIBRATION_UPLOAD_HEADERS,
  'Calibration Due',
  'Remaining Days',
  'Calibration Status',
] as const;

const INITIAL_FORM_STATE: CalibrationFormState = {
  slNo: '',
  instrument: '',
  make: '',
  instrumentId: '',
  serialNo: '',
  leastCount: '',
  range: '',
  location: '',
  acceptanceCriteria: '',
  maxPermissibleError: '',
  calibrationOn: '',
  certificateNo: '',
  calibratedBy: '',
  frequencyOption: '1 Month',
  customFrequencyValue: '',
  customFrequencyUnit: 'Days',
  certificateVerifiedBy: '',
  remarks: '',
};

const DAY_IN_MS = 1000 * 60 * 60 * 24;
const BULK_UPLOAD_BATCH_SIZE = 100;
const DD_MM_YYYY_PATTERN = /^(\d{2})-(\d{2})-(\d{4})$/;
const YYYY_MM_DD_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const COMPACT_FIELD_CLASS = 'space-y-1.5';
const COMPACT_LABEL_CLASS = 'text-xs font-medium text-slate-700';
const COMPACT_INPUT_CLASS = 'h-9 text-sm';
const COMPACT_SELECT_CLASS = 'h-9 text-sm';
const COMPACT_TEXTAREA_CLASS = 'min-h-[88px] text-sm';

const normalizeHeader = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

const FREQUENCY_MAP: Record<string, { value: number; unit: 'days' | 'months' }> = {
  '1 month': { value: 1, unit: 'months' },
  '3 month': { value: 3, unit: 'months' },
  '3 months': { value: 3, unit: 'months' },
  '6 month': { value: 6, unit: 'months' },
  '6 months': { value: 6, unit: 'months' },
  '12 month': { value: 12, unit: 'months' },
  '12 months': { value: 12, unit: 'months' },
};

const FIELD_ALIASES: Record<string, string[]> = {
  slNo: ['Sl No.', 'Sl No', 'slNo'],
  instrument: ['Instrument / Equipment Name', 'Instrument Name', 'instrument'],
  make: ['Make', 'make'],
  instrumentId: ['Instruments ID No.', 'Instrument ID No.', 'instrumentId'],
  serialNo: ['Serial No.', 'Serial No', 'serialNo'],
  leastCount: ['Least Count', 'leastCount'],
  range: ['Range', 'range'],
  location: ['Location', 'location'],
  acceptanceCriteria: ['Acceptance Criteria STD', 'Acceptance Criteria', 'acceptanceCriteria'],
  maxPermissibleError: ['Max Permissible Error', 'maxPermissibleError'],
  calibrationOn: ['Calibration on', 'Calibration On', 'calibrationOn'],
  dueDate: ['Calibration Due', 'Due Date', 'dueDate'],
  certificateNo: ['Certificate No.', 'Certificate No', 'certificateNo'],
  calibratedBy: ['Calibrated by', 'Calibrated By', 'calibratedBy'],
  calibrationFrequency: ['Calibration Frequency', 'calibrationFrequency'],
  certificateVerifiedBy: ['Certificate Verified By', 'certificateVerifiedBy'],
  remarks: ['Remarks', 'remarks'],
};

const parseFrequency = (frequency: string) => {
  const normalized = frequency.trim().toLowerCase().replace(/\s+/g, ' ');

  if (!normalized) {
    return null;
  }

  if (FREQUENCY_MAP[normalized]) {
    return FREQUENCY_MAP[normalized];
  }

  const customMatch = normalized.match(/custom\s*:?\s*(\d+)\s*(day|days|month|months)$/i);
  if (customMatch) {
    return {
      value: Number(customMatch[1]),
      unit: customMatch[2].toLowerCase().startsWith('day') ? 'days' : 'months',
    };
  }

  const genericMatch = normalized.match(/^(\d+)\s*(day|days|month|months)$/i);
  if (genericMatch) {
    return {
      value: Number(genericMatch[1]),
      unit: genericMatch[2].toLowerCase().startsWith('day') ? 'days' : 'months',
    };
  }

  return null;
};

const buildUtcDate = (year: number, month: number, day: number) => {
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
};

const parseDateString = (value: string | null | undefined): Date | null => {
  const normalized = String(value ?? '').trim().replace(/[/.]/g, '-');

  if (!normalized) {
    return null;
  }

  const ddMmYyyyMatch = normalized.match(DD_MM_YYYY_PATTERN);
  if (ddMmYyyyMatch) {
    return buildUtcDate(Number(ddMmYyyyMatch[3]), Number(ddMmYyyyMatch[2]), Number(ddMmYyyyMatch[1]));
  }

  const yyyyMmDdMatch = normalized.match(YYYY_MM_DD_PATTERN);
  if (yyyyMmDdMatch) {
    return buildUtcDate(Number(yyyyMmDdMatch[1]), Number(yyyyMmDdMatch[2]), Number(yyyyMmDdMatch[3]));
  }

  const fallbackDate = new Date(normalized);
  if (Number.isNaN(fallbackDate.getTime())) {
    return null;
  }

  return buildUtcDate(
    fallbackDate.getUTCFullYear(),
    fallbackDate.getUTCMonth() + 1,
    fallbackDate.getUTCDate(),
  );
};

const formatDateString = (value: Date | string | null | undefined): string => {
  const date = value instanceof Date ? value : parseDateString(value);

  if (!date) {
    return '';
  }

  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = String(date.getUTCFullYear());

  return `${day}-${month}-${year}`;
};

const calculateDueDate = (calibrationOn: string, calibrationFrequency: string): string | null => {
  if (!calibrationOn || !calibrationFrequency) {
    return null;
  }

  const baseDate = parseDateString(calibrationOn);
  if (!baseDate) {
    return null;
  }

  const parsedFrequency = parseFrequency(calibrationFrequency);
  if (!parsedFrequency) {
    return null;
  }

  const dueDate = new Date(baseDate);

  if (parsedFrequency.unit === 'days') {
    dueDate.setUTCDate(dueDate.getUTCDate() + parsedFrequency.value);
  } else {
    dueDate.setUTCMonth(dueDate.getUTCMonth() + parsedFrequency.value);
  }

  return formatDateString(dueDate);
};

const getRemainingDays = (dueDate: string | null): number | null => {
  if (!dueDate) {
    return null;
  }

  const due = parseDateString(dueDate);
  if (!due) {
    return null;
  }

  const today = new Date();
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const dueUtc = Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate());

  return Math.ceil((dueUtc - todayUtc) / DAY_IN_MS);
};

const getCalibrationStatus = (
  remainingDays: number | null,
  dueDate: string | null,
  calibrationOn?: string | null,
): string => {
  if (!parseDateString(calibrationOn ?? '')) {
    return 'Enter Calib on Date';
  }

  if (!dueDate || remainingDays === null) {
    return 'Not Scheduled';
  }

  if (remainingDays <= 2) {
    return 'Over Due';
  }

  if (remainingDays <= 6) {
    return 'Due Near';
  }

  if (remainingDays <= 20) {
    return 'Due Soon';
  }

  return 'Good';
};

const getStatusColor = (status: string, remainingDays: number | null) => {
  if (status === 'Over Due' || ((remainingDays ?? 9999) <= 2 && remainingDays !== null)) {
    return '#ed1c24';
  }

  if (status === 'Due Near' || (((remainingDays ?? 9999) >= 3) && ((remainingDays ?? 9999) <= 6))) {
    return '#f97316';
  }

  if (status === 'Due Soon' || (((remainingDays ?? 9999) >= 7) && ((remainingDays ?? 9999) <= 20))) {
    return '#f5a623';
  }

  if (status === 'Not Scheduled') {
    return '#64748b';
  }

  if (status === 'Enter Calib on Date') {
    return '#0f766e';
  }

  return '#2ecc71';
};

const getRowClassName = (remainingDays: number | null) => {
  if (remainingDays === null) {
    return 'bg-slate-50 hover:bg-slate-100';
  }

  if (remainingDays <= 2) {
    return 'bg-red-50 hover:bg-red-100 border-l-4 border-l-[#ed1c24]';
  }

  if (remainingDays <= 6) {
    return 'bg-orange-50 hover:bg-orange-100 border-l-4 border-l-[#f97316]';
  }

  if (remainingDays <= 20) {
    return 'bg-yellow-50 hover:bg-yellow-100 border-l-4 border-l-[#f5a623]';
  }

  return 'bg-emerald-50 hover:bg-emerald-100 border-l-4 border-l-[#2ecc71]';
};

const deriveFormStateFromRecord = (record: CalibrationRecord): CalibrationFormState => {
  const parsedFrequency = parseFrequency(record.calibrationFrequency);
  const normalizedFrequency = record.calibrationFrequency.trim().toLowerCase().replace(/\s+/g, ' ');

  if (
    normalizedFrequency === '1 month' ||
    normalizedFrequency === '3 month' ||
    normalizedFrequency === '3 months' ||
    normalizedFrequency === '6 month' ||
    normalizedFrequency === '6 months' ||
    normalizedFrequency === '12 month' ||
    normalizedFrequency === '12 months'
  ) {
    return {
      slNo: record.slNo,
      instrument: record.instrument,
      make: record.make,
      instrumentId: record.instrumentId,
      serialNo: record.serialNo,
      leastCount: record.leastCount,
      range: record.range,
      location: record.location,
      acceptanceCriteria: record.acceptanceCriteria,
      maxPermissibleError: record.maxPermissibleError,
      calibrationOn: record.calibrationOn || '',
      certificateNo: record.certificateNo,
      calibratedBy: record.calibratedBy,
      frequencyOption:
        normalizedFrequency === '1 month'
          ? '1 Month'
          : normalizedFrequency === '3 month' || normalizedFrequency === '3 months'
            ? '3 Month'
            : normalizedFrequency === '6 month' || normalizedFrequency === '6 months'
              ? '6 Month'
              : '12 Month',
      customFrequencyValue: '',
      customFrequencyUnit: 'Days',
      certificateVerifiedBy: record.certificateVerifiedBy,
      remarks: record.remarks,
    };
  }

  return {
    slNo: record.slNo,
    instrument: record.instrument,
    make: record.make,
    instrumentId: record.instrumentId,
    serialNo: record.serialNo,
    leastCount: record.leastCount,
    range: record.range,
    location: record.location,
    acceptanceCriteria: record.acceptanceCriteria,
    maxPermissibleError: record.maxPermissibleError,
    calibrationOn: record.calibrationOn || '',
    certificateNo: record.certificateNo,
    calibratedBy: record.calibratedBy,
    frequencyOption: 'Custom',
    customFrequencyValue: parsedFrequency ? String(parsedFrequency.value) : '',
    customFrequencyUnit: parsedFrequency?.unit === 'months' ? 'Months' : 'Days',
    certificateVerifiedBy: record.certificateVerifiedBy,
    remarks: record.remarks,
  };
};

const parseExcelDateInfo = async (rawValue: unknown) => {
  if (rawValue === null || rawValue === undefined || rawValue === '') {
    return '';
  }

  if (typeof rawValue === 'number') {
    const XLSX = await import('xlsx');
    const dateObj = XLSX.SSF.parse_date_code(rawValue);
    if (!dateObj) {
      return '';
    }

    const y = dateObj.y;
    const m = String(dateObj.m).padStart(2, '0');
    const d = String(dateObj.d).padStart(2, '0');
    return `${d}-${m}-${y}`;
  }

  const stringValue = String(rawValue).trim();
  if (!stringValue) {
    return '';
  }

  const parsedDate = parseDateString(stringValue);
  if (parsedDate) {
    return formatDateString(parsedDate);
  }

  return '';
};

const extractRowValue = (row: Record<string, unknown>, aliases: string[]) => {
  const normalizedRow = Object.entries(row).reduce<Record<string, unknown>>((acc, [key, value]) => {
    acc[normalizeHeader(key)] = value;
    return acc;
  }, {});

  for (const alias of aliases) {
    const normalizedAlias = normalizeHeader(alias);
    if (normalizedAlias in normalizedRow) {
      return normalizedRow[normalizedAlias];
    }
  }

  return '';
};

const normalizeTextCell = (value: unknown) => {
  const normalized = String(value ?? '').trim();
  return normalized.length > 0 ? normalized : '-';
};

const hasActualCellValue = (value: unknown) => String(value ?? '').trim().length > 0;

const buildFrequencyValue = (
  frequencyOption: FrequencyOption,
  customFrequencyValue: string,
  customFrequencyUnit: FrequencyUnit,
) => {
  if (frequencyOption !== 'Custom') {
    return frequencyOption;
  }

  if (!customFrequencyValue.trim()) {
    return 'Custom';
  }

  return `Custom: ${customFrequencyValue.trim()} ${customFrequencyUnit}`;
};

const buildExportRows = (records: CalibrationRecord[]) =>
  records.map((record) => ({
    'Sl No.': record.slNo || '',
    'Instrument / Equipment Name': record.instrument || '',
    Make: record.make || '',
    'Instruments ID No.': record.instrumentId || '',
    'Serial No.': record.serialNo || '',
    'Least Count': record.leastCount || '',
    Range: record.range || '',
    Location: record.location || '',
    'Acceptance Criteria STD': record.acceptanceCriteria || '',
    'Max Permissible Error': record.maxPermissibleError || '',
    'Calibration on': record.calibrationOn || '',
    'Calibration Due': record.dueDate || '',
    'Remaining Days': record.remainingDays ?? '',
    'Calibration Status': record.status || '',
    'Certificate No.': record.certificateNo || '',
    'Calibrated by': record.calibratedBy || '',
    'Calibration Frequency': record.calibrationFrequency || '',
    'Certificate Verified By': record.certificateVerifiedBy || '',
    Remarks: record.remarks || '',
  }));

export default function CalibrationManagement({ user, onNavigate, onLogout }: CalibrationManagementProps) {
  const dispatch = useAppDispatch();
  const { records: calibrations, loading, error } = useAppSelector((state) => state.calibration);

  const [statusFilter, setStatusFilter] = useState('all');
  const [addRecordOpen, setAddRecordOpen] = useState(false);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
  const [formState, setFormState] = useState<CalibrationFormState>(INITIAL_FORM_STATE);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (calibrations.length === 0 && !loading) {
      dispatch(fetchCalibrations());
    }
  }, [calibrations.length, dispatch, loading]);

  useEffect(() => {
    setSelectedRecordIds((previousSelectedIds) =>
      previousSelectedIds.filter((selectedId) => calibrations.some((record) => record.id === selectedId)),
    );
  }, [calibrations]);

  const frequencyValue = useMemo(
    () => buildFrequencyValue(formState.frequencyOption, formState.customFrequencyValue, formState.customFrequencyUnit),
    [formState.customFrequencyUnit, formState.customFrequencyValue, formState.frequencyOption],
  );
  const computedDueDate = useMemo(
    () => calculateDueDate(formState.calibrationOn, frequencyValue),
    [formState.calibrationOn, frequencyValue],
  );
  const computedRemainingDays = useMemo(() => getRemainingDays(computedDueDate), [computedDueDate]);
  const computedStatus = useMemo(
    () => getCalibrationStatus(computedRemainingDays, computedDueDate, formState.calibrationOn),
    [computedDueDate, computedRemainingDays, formState.calibrationOn],
  );
  const isEditing = editingRecordId !== null;

  const overdueCount = calibrations.filter((record) => record.status === 'Over Due').length;
  const dueNearCount = calibrations.filter((record) => record.status === 'Due Near').length;
  const dueSoonCount = calibrations.filter((record) => record.status === 'Due Soon').length;
  const totalInstrumentsCount = calibrations.length;

  const filteredCalibrations = calibrations
    .filter((record) => statusFilter === 'all' || record.status === statusFilter)
    .sort((leftRecord, rightRecord) => {
      const leftSlNo = Number(leftRecord.slNo);
      const rightSlNo = Number(rightRecord.slNo);
      const leftHasNumericSlNo = Number.isFinite(leftSlNo) && leftRecord.slNo.trim() !== '';
      const rightHasNumericSlNo = Number.isFinite(rightSlNo) && rightRecord.slNo.trim() !== '';

      if (leftHasNumericSlNo && rightHasNumericSlNo) {
        return leftSlNo - rightSlNo;
      }

      if (leftHasNumericSlNo) {
        return -1;
      }

      if (rightHasNumericSlNo) {
        return 1;
      }

      return leftRecord.instrument.localeCompare(rightRecord.instrument);
    });
  const filteredRecordIds = filteredCalibrations.map((record) => record.id);
  const selectedFilteredRecordIds = filteredRecordIds.filter((recordId) => selectedRecordIds.includes(recordId));
  const areAllFilteredRecordsSelected =
    filteredRecordIds.length > 0 && selectedFilteredRecordIds.length === filteredRecordIds.length;
  const hasSelectedRecords = selectedRecordIds.length > 0;

  const handleFieldChange = <K extends keyof CalibrationFormState>(field: K, value: CalibrationFormState[K]) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const toggleRecordSelection = (recordId: string, checked: boolean) => {
    setSelectedRecordIds((previousSelectedIds) => {
      if (checked) {
        return previousSelectedIds.includes(recordId) ? previousSelectedIds : [...previousSelectedIds, recordId];
      }

      return previousSelectedIds.filter((selectedId) => selectedId !== recordId);
    });
  };

  const toggleSelectAllFilteredRecords = (checked: boolean) => {
    setSelectedRecordIds((previousSelectedIds) => {
      if (checked) {
        return Array.from(new Set([...previousSelectedIds, ...filteredRecordIds]));
      }

      return previousSelectedIds.filter((selectedId) => !filteredRecordIds.includes(selectedId));
    });
  };

  const resetForm = () => {
    setFormState(INITIAL_FORM_STATE);
    setEditingRecordId(null);
  };

  const loadXlsx = async () => import('xlsx');

  const syncCalibrationBatches = async (records: Partial<CalibrationRecord>[]) => {
    let totalProcessedCount = 0;
    let totalSkippedCount = 0;

    for (let index = 0; index < records.length; index += BULK_UPLOAD_BATCH_SIZE) {
      const batch = records.slice(index, index + BULK_UPLOAD_BATCH_SIZE);
      const result = await dispatch(syncCalibrations(batch)).unwrap();
      totalProcessedCount += result?.processedCount ?? batch.length;
      totalSkippedCount += result?.skippedCount ?? 0;
    }

    return {
      processedCount: totalProcessedCount,
      skippedCount: totalSkippedCount,
    };
  };

  const handleExport = async () => {
    const XLSX = await loadXlsx();
    const worksheet = XLSX.utils.json_to_sheet(buildExportRows(filteredCalibrations));
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'Calibration_Records.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleExportSelected = async () => {
    const selectedRecords = filteredCalibrations.filter((record) => selectedRecordIds.includes(record.id));

    if (!selectedRecords.length) {
      toast.error('Select at least one instrument to export');
      return;
    }

    const XLSX = await loadXlsx();
    const worksheet = XLSX.utils.json_to_sheet(buildExportRows(selectedRecords));
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'Selected_Calibration_Records.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadTemplate = async () => {
    const XLSX = await loadXlsx();
    const worksheet = XLSX.utils.aoa_to_sheet([Array.from(CALIBRATION_UPLOAD_HEADERS)]);
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'Calibration_Bulk_Template.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleSingleRecordSubmit = () => {
    if (!formState.instrument.trim()) {
      toast.error('Instrument / Equipment Name is required');
      return;
    }

    if (formState.frequencyOption === 'Custom' && !formState.customFrequencyValue.trim()) {
      toast.error('Enter a custom calibration frequency value');
      return;
    }

    const newRecord: Partial<CalibrationRecord> = {
      ...(editingRecordId ? { id: editingRecordId } : {}),
      slNo: formState.slNo.trim(),
      instrument: formState.instrument.trim(),
      make: formState.make.trim(),
      instrumentId: formState.instrumentId.trim(),
      serialNo: formState.serialNo.trim(),
      leastCount: formState.leastCount.trim(),
      range: formState.range.trim(),
      location: formState.location.trim(),
      acceptanceCriteria: formState.acceptanceCriteria.trim(),
      maxPermissibleError: formState.maxPermissibleError.trim(),
      calibrationOn: formState.calibrationOn,
      dueDate: computedDueDate,
      certificateNo: formState.certificateNo.trim(),
      calibratedBy: formState.calibratedBy.trim(),
      calibrationFrequency: frequencyValue,
      certificateVerifiedBy: formState.certificateVerifiedBy.trim(),
      remarks: formState.remarks.trim(),
    };

    dispatch(syncCalibrations([newRecord]))
      .unwrap()
      .then(() => {
        toast.success(isEditing ? 'Instrument updated successfully' : 'Instrument added successfully');
        dispatch(fetchCalibrations());
        setAddRecordOpen(false);
        resetForm();
      })
      .catch((syncError) => {
        toast.error(syncError || 'Failed to save instrument');
      });
  };

  const handleEditRecord = (record: CalibrationRecord) => {
    setEditingRecordId(record.id);
    setFormState(deriveFormStateFromRecord(record));
    setAddRecordOpen(true);
  };

  const handleDeleteRecord = (record: CalibrationRecord) => {
    const shouldDelete = window.confirm(`Delete instrument "${record.instrument}"?`);

    if (!shouldDelete) {
      return;
    }

    dispatch(deleteCalibration(record.id))
      .unwrap()
      .then(() => {
        setSelectedRecordIds((previousSelectedIds) => previousSelectedIds.filter((selectedId) => selectedId !== record.id));
        toast.success('Instrument deleted successfully');
      })
      .catch((deleteError) => {
        toast.error(deleteError || 'Failed to delete instrument');
      });
  };

  const handleDeleteSelected = async () => {
    const selectedRecords = filteredCalibrations.filter((record) => selectedRecordIds.includes(record.id));

    if (!selectedRecords.length) {
      toast.error('Select at least one instrument to delete');
      return;
    }

    const shouldDelete = window.confirm(`Delete ${selectedRecords.length} selected instrument(s)?`);

    if (!shouldDelete) {
      return;
    }

    try {
      for (const record of selectedRecords) {
        await dispatch(deleteCalibration(record.id)).unwrap();
      }

      setSelectedRecordIds((previousSelectedIds) =>
        previousSelectedIds.filter((selectedId) => !selectedRecords.some((record) => record.id === selectedId)),
      );
      toast.success(`${selectedRecords.length} instrument(s) deleted successfully`);
    } catch (deleteError: any) {
      toast.error(deleteError || 'Failed to delete selected instruments');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = async (loadEvent) => {
      try {
        const XLSX = await loadXlsx();
        const data = new Uint8Array(loadEvent.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const parsedRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

        if (!parsedRows.length) {
          toast.error('No data found in the uploaded file');
          return;
        }

        const records: Partial<CalibrationRecord>[] = [];
        let skippedRows = 0;

        for (const row of parsedRows) {
          const rawInstrument = extractRowValue(row, FIELD_ALIASES.instrument);
          const textFields = {
            slNo: normalizeTextCell(extractRowValue(row, FIELD_ALIASES.slNo)),
            instrument: normalizeTextCell(rawInstrument),
            make: normalizeTextCell(extractRowValue(row, FIELD_ALIASES.make)),
            instrumentId: normalizeTextCell(extractRowValue(row, FIELD_ALIASES.instrumentId)),
            serialNo: normalizeTextCell(extractRowValue(row, FIELD_ALIASES.serialNo)),
            leastCount: normalizeTextCell(extractRowValue(row, FIELD_ALIASES.leastCount)),
            range: normalizeTextCell(extractRowValue(row, FIELD_ALIASES.range)),
            location: normalizeTextCell(extractRowValue(row, FIELD_ALIASES.location)),
            acceptanceCriteria: normalizeTextCell(extractRowValue(row, FIELD_ALIASES.acceptanceCriteria)),
            maxPermissibleError: normalizeTextCell(extractRowValue(row, FIELD_ALIASES.maxPermissibleError)),
            certificateNo: normalizeTextCell(extractRowValue(row, FIELD_ALIASES.certificateNo)),
            calibratedBy: normalizeTextCell(extractRowValue(row, FIELD_ALIASES.calibratedBy)),
            calibrationFrequency: normalizeTextCell(extractRowValue(row, FIELD_ALIASES.calibrationFrequency)),
            certificateVerifiedBy: normalizeTextCell(extractRowValue(row, FIELD_ALIASES.certificateVerifiedBy)),
            remarks: normalizeTextCell(extractRowValue(row, FIELD_ALIASES.remarks)),
          };

          const calibrationOn = await parseExcelDateInfo(extractRowValue(row, FIELD_ALIASES.calibrationOn));
          const providedDueDate = await parseExcelDateInfo(extractRowValue(row, FIELD_ALIASES.dueDate));

          const hasMeaningfulValue =
            Object.values(row).some((value) => hasActualCellValue(value)) || Boolean(calibrationOn) || Boolean(providedDueDate);
          if (!hasMeaningfulValue) {
            continue;
          }

          if (!hasActualCellValue(rawInstrument)) {
            skippedRows += 1;
            continue;
          }

          records.push({
            slNo: textFields.slNo,
            instrument: textFields.instrument,
            make: textFields.make,
            instrumentId: textFields.instrumentId,
            serialNo: textFields.serialNo,
            leastCount: textFields.leastCount,
            range: textFields.range,
            location: textFields.location,
            acceptanceCriteria: textFields.acceptanceCriteria,
            maxPermissibleError: textFields.maxPermissibleError,
            calibrationOn,
            dueDate: calculateDueDate(calibrationOn, textFields.calibrationFrequency) ?? providedDueDate,
            certificateNo: textFields.certificateNo,
            calibratedBy: textFields.calibratedBy,
            calibrationFrequency: textFields.calibrationFrequency,
            certificateVerifiedBy: textFields.certificateVerifiedBy,
            remarks: textFields.remarks,
          });
        }

        if (!records.length) {
          toast.error('No valid instrument rows were found in the uploaded file');
          return;
        }

        syncCalibrationBatches(records)
          .then((result) => {
            const processedCount = result.processedCount ?? records.length;
            const totalSkippedRows = (result.skippedCount ?? 0) + skippedRows;
            const successMessage =
              totalSkippedRows > 0
                ? `Imported ${processedCount} instrument(s). Skipped ${totalSkippedRows} blank or invalid row(s).`
                : `Successfully imported ${processedCount} instrument(s)`;

            toast.success(successMessage);
            dispatch(fetchCalibrations());
            setBulkUploadOpen(false);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          })
          .catch((syncError) => {
            toast.error(syncError || 'Failed to sync calibrations');
          });
      } catch (uploadError) {
        toast.error('Failed to parse the uploaded file');
      }
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <Layout user={user} currentPage="calibration" onNavigate={onNavigate} onLogout={onLogout} title="Calibration Management">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-slate-500">Total Instruments</div>
              <div className="mt-2 text-3xl font-bold text-slate-900">{totalInstrumentsCount}</div>
            </CardContent>
          </Card>
          <Card className="border-yellow-200 bg-yellow-50 shadow-sm">
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-yellow-700">Due Soon</div>
              <div className="mt-2 text-3xl font-bold text-yellow-800">{dueSoonCount}</div>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50 shadow-sm">
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-red-700">Over Due</div>
              <div className="mt-2 text-3xl font-bold text-red-800">{overdueCount}</div>
            </CardContent>
          </Card>
        </div>

        {(overdueCount > 0 || dueNearCount > 0 || dueSoonCount > 0 || error) && (
          <Alert style={{ borderColor: '#ed1c24', backgroundColor: '#fff5f5' }}>
            <AlertCircle className="h-4 w-4" style={{ color: '#ed1c24' }} />
            <AlertTitle>Calibration Alerts</AlertTitle>
            <AlertDescription>
              {overdueCount > 0 && (
                <span className="block font-medium text-[#ed1c24]">
                  {overdueCount} instrument(s) are in Over Due status.
                </span>
              )}
              {dueNearCount > 0 && (
                <span className="mt-1 block text-[#f97316]">
                  {dueNearCount} instrument(s) are in Due Near status.
                </span>
              )}
              {dueSoonCount > 0 && (
                <span className="mt-1 block text-[#f5a623]">
                  {dueSoonCount} instrument(s) are in Due Soon status.
                </span>
              )}
              {error && <span className="mt-1 block text-slate-600">{error}</span>}
            </AlertDescription>
          </Alert>
        )}

        <Card style={{ borderRadius: '12px' }}>
          <CardHeader>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <CardTitle>Calibration Register</CardTitle>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={handleDownloadTemplate} className="border-dashed border-primary text-primary">
                  <FileDown className="mr-2 h-4 w-4" />
                  CSV Template
                </Button>
                <Button variant="outline" onClick={handleExport}>
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
                <Button variant="outline" onClick={handleExportSelected} disabled={!hasSelectedRecords}>
                  <Download className="mr-2 h-4 w-4" />
                  Export Selected
                </Button>
                <Button variant="outline" onClick={handleDeleteSelected} disabled={!hasSelectedRecords}>
                  <Trash2 className="mr-2 h-4 w-4 text-red-600" />
                  Delete Selected
                </Button>
                <Button variant="outline" onClick={() => setBulkUploadOpen(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Bulk Upload
                </Button>
                <Button style={{ backgroundColor: '#ed1c24' }} onClick={() => setAddRecordOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Instrument
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="w-full sm:w-[220px]">
                <Label htmlFor="status-filter">Calibration Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status-filter">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Enter Calib on Date">Enter Calib on Date</SelectItem>
                    <SelectItem value="Good">Good</SelectItem>
                    <SelectItem value="Due Soon">Due Soon</SelectItem>
                    <SelectItem value="Due Near">Due Near</SelectItem>
                    <SelectItem value="Over Due">Over Due</SelectItem>
                    <SelectItem value="Not Scheduled">Not Scheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm text-slate-500">
                {hasSelectedRecords ? `${selectedRecordIds.length} record(s) selected` : 'No records selected'}
              </div>
            </div>

            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[52px]">
                      <Checkbox
                        checked={areAllFilteredRecordsSelected}
                        onCheckedChange={(checked) => toggleSelectAllFilteredRecords(checked === true)}
                        aria-label="Select all calibration records"
                      />
                    </TableHead>
                    {CALIBRATION_TABLE_HEADERS.map((header) => (
                      <TableHead key={header}>{header}</TableHead>
                    ))}
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCalibrations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={CALIBRATION_TABLE_HEADERS.length + 2} className="py-8 text-center text-sm text-slate-500">
                        No calibration records found for the selected filter.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCalibrations.map((record, index) => (
                      <TableRow key={record.id} className={getRowClassName(record.remainingDays)}>
                        <TableCell>
                          <Checkbox
                            checked={selectedRecordIds.includes(record.id)}
                            onCheckedChange={(checked) => toggleRecordSelection(record.id, checked === true)}
                            aria-label={`Select ${record.instrument}`}
                          />
                        </TableCell>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">{record.instrument}</TableCell>
                        <TableCell>{record.make || '-'}</TableCell>
                        <TableCell>{record.instrumentId || '-'}</TableCell>
                        <TableCell>{record.serialNo || '-'}</TableCell>
                        <TableCell>{record.leastCount || '-'}</TableCell>
                        <TableCell>{record.range || '-'}</TableCell>
                        <TableCell>{record.location || '-'}</TableCell>
                        <TableCell>{record.acceptanceCriteria || '-'}</TableCell>
                        <TableCell>{record.maxPermissibleError || '-'}</TableCell>
                        <TableCell>{record.calibrationOn || '-'}</TableCell>
                        <TableCell>{record.certificateNo || '-'}</TableCell>
                        <TableCell>{record.calibratedBy || '-'}</TableCell>
                        <TableCell>{record.calibrationFrequency || '-'}</TableCell>
                        <TableCell>{record.certificateVerifiedBy || '-'}</TableCell>
                        <TableCell className="text-muted-foreground">{record.remarks || '-'}</TableCell>
                        <TableCell>{record.dueDate || '-'}</TableCell>
                        <TableCell>
                          {record.remainingDays === null ? (
                            '-'
                          ) : (
                            <span style={{ color: getStatusColor(record.status, record.remainingDays), fontWeight: 500 }}>
                              {record.remainingDays} days
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge style={{ backgroundColor: getStatusColor(record.status, record.remainingDays), color: '#ffffff' }}>
                            {record.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => handleEditRecord(record)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button type="button" variant="outline" size="sm" onClick={() => handleDeleteRecord(record)}>
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog
          open={addRecordOpen}
          onOpenChange={(open) => {
            setAddRecordOpen(open);
            if (!open) {
              resetForm();
            }
          }}
        >
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0 rounded-xl border border-slate-200 shadow-xl bg-white">
            <DialogHeader className="p-6 border-b border-slate-100 shrink-0">
              <DialogTitle className="text-lg font-semibold text-gray-900">
                {isEditing ? 'Edit Instrument' : 'Add Instrument Individually'}
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500">
                Enter calibration instrument details in a compact form.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid gap-4 md:grid-cols-2">
              <div className={`${COMPACT_FIELD_CLASS} md:col-span-2`}>
                <Label htmlFor="instrument-name" className={COMPACT_LABEL_CLASS}>Instrument / Equipment Name</Label>
                <Input
                  id="instrument-name"
                  value={formState.instrument}
                  onChange={(e) => handleFieldChange('instrument', e.target.value)}
                  placeholder="Enter instrument name"
                  className={COMPACT_INPUT_CLASS}
                />
              </div>

              <div className={COMPACT_FIELD_CLASS}>
                <Label htmlFor="make" className={COMPACT_LABEL_CLASS}>Make</Label>
                <Input id="make" value={formState.make} onChange={(e) => handleFieldChange('make', e.target.value)} className={COMPACT_INPUT_CLASS} />
              </div>
              <div className={COMPACT_FIELD_CLASS}>
                <Label htmlFor="instrument-id" className={COMPACT_LABEL_CLASS}>Instruments ID No.</Label>
                <Input id="instrument-id" value={formState.instrumentId} onChange={(e) => handleFieldChange('instrumentId', e.target.value)} className={COMPACT_INPUT_CLASS} />
              </div>
              <div className={COMPACT_FIELD_CLASS}>
                <Label htmlFor="serial-no" className={COMPACT_LABEL_CLASS}>Serial No.</Label>
                <Input id="serial-no" value={formState.serialNo} onChange={(e) => handleFieldChange('serialNo', e.target.value)} className={COMPACT_INPUT_CLASS} />
              </div>

              <div className={COMPACT_FIELD_CLASS}>
                <Label htmlFor="least-count" className={COMPACT_LABEL_CLASS}>Least Count</Label>
                <Input id="least-count" value={formState.leastCount} onChange={(e) => handleFieldChange('leastCount', e.target.value)} className={COMPACT_INPUT_CLASS} />
              </div>
              <div className={COMPACT_FIELD_CLASS}>
                <Label htmlFor="range" className={COMPACT_LABEL_CLASS}>Range</Label>
                <Input id="range" value={formState.range} onChange={(e) => handleFieldChange('range', e.target.value)} className={COMPACT_INPUT_CLASS} />
              </div>
              <div className={COMPACT_FIELD_CLASS}>
                <Label htmlFor="location" className={COMPACT_LABEL_CLASS}>Location</Label>
                <Input id="location" value={formState.location} onChange={(e) => handleFieldChange('location', e.target.value)} className={COMPACT_INPUT_CLASS} />
              </div>

              <div className={COMPACT_FIELD_CLASS}>
                <Label htmlFor="acceptance-criteria" className={COMPACT_LABEL_CLASS}>Acceptance Criteria STD</Label>
                <Input
                  id="acceptance-criteria"
                  value={formState.acceptanceCriteria}
                  onChange={(e) => handleFieldChange('acceptanceCriteria', e.target.value)}
                  className={COMPACT_INPUT_CLASS}
                />
              </div>
              <div className={COMPACT_FIELD_CLASS}>
                <Label htmlFor="max-permissible-error" className={COMPACT_LABEL_CLASS}>Max Permissible Error</Label>
                <Input
                  id="max-permissible-error"
                  value={formState.maxPermissibleError}
                  onChange={(e) => handleFieldChange('maxPermissibleError', e.target.value)}
                  className={COMPACT_INPUT_CLASS}
                />
              </div>
              <div className={COMPACT_FIELD_CLASS}>
                <Label htmlFor="calibration-on" className={COMPACT_LABEL_CLASS}>Calibration on</Label>
                <Input
                  id="calibration-on"
                  value={formState.calibrationOn}
                  onChange={(e) => handleFieldChange('calibrationOn', e.target.value)}
                  placeholder="DD-MM-YYYY"
                  inputMode="numeric"
                  className={COMPACT_INPUT_CLASS}
                />
              </div>

              <div className={COMPACT_FIELD_CLASS}>
                <Label htmlFor="calibration-frequency" className={COMPACT_LABEL_CLASS}>Calibration Frequency</Label>
                <Select
                  value={formState.frequencyOption}
                  onValueChange={(value: FrequencyOption) => handleFieldChange('frequencyOption', value)}
                >
                  <SelectTrigger id="calibration-frequency" className={COMPACT_SELECT_CLASS}>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1 Month">1 Month</SelectItem>
                    <SelectItem value="3 Month">3 Month</SelectItem>
                    <SelectItem value="6 Month">6 Month</SelectItem>
                    <SelectItem value="12 Month">12 Month</SelectItem>
                    <SelectItem value="Custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formState.frequencyOption === 'Custom' && (
                <>
                  <div className={COMPACT_FIELD_CLASS}>
                    <Label htmlFor="custom-frequency-value" className={COMPACT_LABEL_CLASS}>Custom Frequency Value</Label>
                    <Input
                      id="custom-frequency-value"
                      type="number"
                      min="1"
                      value={formState.customFrequencyValue}
                      onChange={(e) => handleFieldChange('customFrequencyValue', e.target.value)}
                      placeholder="Enter value"
                      className={COMPACT_INPUT_CLASS}
                    />
                  </div>
                  <div className={COMPACT_FIELD_CLASS}>
                    <Label htmlFor="custom-frequency-unit" className={COMPACT_LABEL_CLASS}>Custom Frequency Unit</Label>
                    <Select
                      value={formState.customFrequencyUnit}
                      onValueChange={(value: FrequencyUnit) => handleFieldChange('customFrequencyUnit', value)}
                    >
                      <SelectTrigger id="custom-frequency-unit" className={COMPACT_SELECT_CLASS}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Days">Days</SelectItem>
                        <SelectItem value="Months">Months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <div className={COMPACT_FIELD_CLASS}>
                <Label htmlFor="certificate-no" className={COMPACT_LABEL_CLASS}>Certificate No.</Label>
                <Input
                  id="certificate-no"
                  value={formState.certificateNo}
                  onChange={(e) => handleFieldChange('certificateNo', e.target.value)}
                  className={COMPACT_INPUT_CLASS}
                />
              </div>
              <div className={COMPACT_FIELD_CLASS}>
                <Label htmlFor="calibrated-by" className={COMPACT_LABEL_CLASS}>Calibrated by</Label>
                <Input
                  id="calibrated-by"
                  value={formState.calibratedBy}
                  onChange={(e) => handleFieldChange('calibratedBy', e.target.value)}
                  className={COMPACT_INPUT_CLASS}
                />
              </div>
              <div className={COMPACT_FIELD_CLASS}>
                <Label htmlFor="verified-by" className={COMPACT_LABEL_CLASS}>Certificate Verified By</Label>
                <Input
                  id="verified-by"
                  value={formState.certificateVerifiedBy}
                  onChange={(e) => handleFieldChange('certificateVerifiedBy', e.target.value)}
                  className={COMPACT_INPUT_CLASS}
                />
              </div>

              <div className={`${COMPACT_FIELD_CLASS} md:col-span-2`}>
                <Label htmlFor="remarks" className={COMPACT_LABEL_CLASS}>Remarks</Label>
                <Textarea
                  id="remarks"
                  value={formState.remarks}
                  onChange={(e) => handleFieldChange('remarks', e.target.value)}
                  rows={3}
                  className={COMPACT_TEXTAREA_CLASS}
                />
              </div>
            </div>
            </div>

            <DialogFooter className="p-6 border-t border-slate-100 shrink-0 gap-2">
              <Button variant="outline" onClick={() => setAddRecordOpen(false)} className="h-9">
                Cancel
              </Button>
              <Button style={{ backgroundColor: '#ed1c24' }} onClick={handleSingleRecordSubmit} className="h-9">
                {isEditing ? 'Update Instrument' : 'Save Instrument'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={bulkUploadOpen} onOpenChange={setBulkUploadOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 rounded-xl border border-slate-200 shadow-xl bg-white">
            <DialogHeader className="p-6 border-b border-slate-100 shrink-0">
              <DialogTitle className="text-lg font-semibold text-gray-900">Bulk Upload Calibration Data</DialogTitle>
              <DialogDescription className="text-sm text-slate-500">
                Upload `.csv`, `.xlsx`, or `.xls`. Auto-calculated fields will be generated after import.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="rounded-lg border border-dashed border-muted-foreground/25 bg-muted/10 p-4">
                <div className="flex flex-col items-center justify-center py-4 text-center">
                  <FileSpreadsheet className="mb-3 h-10 w-10 text-muted-foreground" />
                  <p className="mb-1 text-sm font-medium">Upload your calibration bulk file</p>
                  <p className="mb-3 text-xs text-muted-foreground">
                    Use the template headers only. Blank text cells will be stored as `-`.
                  </p>

                  <label className="cursor-pointer">
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      className="hidden"
                      onChange={handleFileUpload}
                      onClick={(e) => {
                        e.currentTarget.value = '';
                      }}
                    />
                    <Button variant="outline" asChild className="h-9">
                      <span>Select File</span>
                    </Button>
                  </label>
                </div>
              </div>

              <div className="rounded-lg border bg-slate-50 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Required Headers
                </p>
                <div className="max-h-24 overflow-y-auto text-xs leading-5 text-slate-600">
                  {CALIBRATION_UPLOAD_HEADERS.join(', ')}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
