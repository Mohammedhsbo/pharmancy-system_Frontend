import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Plus, XCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { ErrorState } from '../../components/ui/ErrorState';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { patientService } from '../../services/patientService';
import { useToast } from '../../hooks/useToast';
import { validateUpdatePrescription } from '../../utils/validators';

const emptyItem = { medicineName: '', dosage: '', frequency: '', duration: '', quantity: '' };

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'partially_dispensed', label: 'Partially Dispensed' },
  { value: 'dispensed', label: 'Dispensed' },
  { value: 'expired', label: 'Expired' },
  { value: 'cancelled', label: 'Cancelled' },
];

function toDateInput(value) {
  if (!value) return '';
  return value.split('T')[0];
}

export default function EditPrescriptionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [prescription, setPrescription] = useState(null);
  const [form, setForm] = useState({
    doctor: '',
    hospital: '',
    diagnosisCode: '',
    prescribedDate: '',
    expiryDate: '',
    status: 'pending',
    items: [{ ...emptyItem }],
    notes: '',
  });

  const fetchPrescription = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await patientService.getPrescriptionById(id);
      const rx = response?.data;

      if (!rx) {
        setError('Prescription not found.');
        return;
      }

      setPrescription(rx);
      setForm({
        doctor: rx.doctor || '',
        hospital: rx.hospital || '',
        diagnosisCode: rx.diagnosisCode || '',
        prescribedDate: toDateInput(rx.prescribedDate),
        expiryDate: toDateInput(rx.expiryDate),
        status: rx.status || 'pending',
        items: Array.isArray(rx.items) && rx.items.length > 0
          ? rx.items.map((item) => ({
              medicineName: item.medicineName || '',
              dosage: item.dosage || '',
              frequency: item.frequency || '',
              duration: item.duration || '',
              quantity: item.quantity ?? '',
            }))
          : [{ ...emptyItem }],
        notes: rx.notes || '',
      });
    } catch (err) {
      setError(err.message || 'Failed to load prescription.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPrescription();
  }, [fetchPrescription]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateItem = (index, field, value) => {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }));
  };

  const addItem = () => {
    setForm((current) => ({
      ...current,
      items: [...current.items, { ...emptyItem }],
    }));
  };

  const removeItem = (index) => {
    setForm((current) => ({
      ...current,
      items: current.items.filter((_, i) => i !== index),
    }));
  };

  const buildPayload = () => {
    const payload = {
      doctor: form.doctor.trim(),
      status: form.status,
      items: form.items.map((item) => {
        const payloadItem = { medicineName: item.medicineName.trim() };
        if (item.dosage) payloadItem.dosage = item.dosage.trim();
        if (item.frequency) payloadItem.frequency = item.frequency.trim();
        if (item.duration) payloadItem.duration = item.duration.trim();
        if (item.quantity !== '') payloadItem.quantity = Number(item.quantity);
        return payloadItem;
      }),
    };

    if (form.hospital) payload.hospital = form.hospital.trim();
    if (form.diagnosisCode) payload.diagnosisCode = form.diagnosisCode.trim();
    if (form.notes) payload.notes = form.notes.trim();

    return payload;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = buildPayload();
    const validation = validateUpdatePrescription(payload);
    if (!validation.valid) {
      setFormErrors(validation.errors);
      return;
    }
    setFormErrors({});

    try {
      setSaving(true);
      await patientService.updatePrescription(id, payload);
      toast.success('Prescription updated');
      navigate('/patients');
    } catch {
      // Toast is shown globally by api interceptor
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-400">Loading prescription...</div>;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchPrescription} />;
  }

  const isLocked = prescription?.status === 'dispensed' || prescription?.status === 'cancelled';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/patients')} className="gap-2">
          <ArrowLeft size={16} />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Edit Prescription</h1>
          <p className="text-sm text-gray-400 mt-1">
            {prescription?.prescriptionNumber || id}
            {prescription?.patient?.name ? ` - ${prescription.patient.name}` : ''}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b border-white/5">
          <CardTitle>Prescription Details</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {Object.keys(formErrors).length > 0 && (
              <div className="bg-danger/10 border border-danger/20 rounded-lg p-3">
                <p className="text-danger text-sm font-medium mb-1">Please fix the following errors:</p>
                {Object.values(formErrors).map((err, i) => (
                  <p key={i} className="text-danger/80 text-xs">- {err}</p>
                ))}
              </div>
            )}

            {isLocked && (
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 text-sm text-warning">
                This prescription cannot be edited because it is already {prescription.status.replace('_', ' ')}.
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Doctor Name *" value={form.doctor} onChange={(e) => updateField('doctor', e.target.value)} disabled={isLocked} required />
              <Input label="Hospital" value={form.hospital} onChange={(e) => updateField('hospital', e.target.value)} disabled={isLocked} />
              <Input label="Diagnosis Code" value={form.diagnosisCode} onChange={(e) => updateField('diagnosisCode', e.target.value)} disabled={isLocked} />
              <Select label="Status" value={form.status} onChange={(e) => updateField('status', e.target.value)} disabled={isLocked}>
                {statusOptions.map((status) => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </Select>
              <Input label="Prescribed Date" type="date" value={form.prescribedDate} disabled />
              <Input label="Expiry Date" type="date" value={form.expiryDate} disabled />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-300">Medications</p>
                <Button type="button" variant="ghost" size="sm" onClick={addItem} disabled={isLocked} className="gap-1">
                  <Plus size={14} />
                  Add Item
                </Button>
              </div>

              {form.items.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-[2fr_repeat(4,1fr)_auto] gap-2 p-3 rounded-lg bg-background border border-white/5">
                  <Input placeholder="Medicine Name *" value={item.medicineName} onChange={(e) => updateItem(index, 'medicineName', e.target.value)} disabled={isLocked} />
                  <Input placeholder="Dosage" value={item.dosage} onChange={(e) => updateItem(index, 'dosage', e.target.value)} disabled={isLocked} />
                  <Input placeholder="Frequency" value={item.frequency} onChange={(e) => updateItem(index, 'frequency', e.target.value)} disabled={isLocked} />
                  <Input placeholder="Duration" value={item.duration} onChange={(e) => updateItem(index, 'duration', e.target.value)} disabled={isLocked} />
                  <Input placeholder="Qty" type="number" min="1" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', e.target.value)} disabled={isLocked} />
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    disabled={isLocked || form.items.length === 1}
                    className="h-10 w-10 rounded-lg border border-white/10 text-gray-400 hover:text-danger hover:bg-danger/10 disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Remove medication"
                  >
                    <XCircle size={16} className="mx-auto" />
                  </button>
                </div>
              ))}
            </div>

            <Input label="Notes" value={form.notes} onChange={(e) => updateField('notes', e.target.value)} disabled={isLocked} />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => navigate('/patients')}>Cancel</Button>
              <Button type="submit" disabled={saving || isLocked}>
                {saving ? 'Saving...' : 'Update Prescription'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
