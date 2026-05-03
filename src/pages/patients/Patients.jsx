import React, { useState, useEffect, useCallback } from 'react';
import {
  UserPlus,
  Search,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Pill,
  User,
  Phone,
  Mail,
  CalendarDays,
  Droplet,
  MapPin,
  ClipboardCheck,
  Trash2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal, ModalFooter } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Pagination } from '../../components/ui/Pagination';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { patientService } from '../../services/patientService';
import { useToast } from '../../hooks/useToast';
import { useDebounce } from '../../hooks/useDebounce';
import { validateCreatePatient, validateUpdatePatient, validateCreatePrescription } from '../../utils/validators';

const statusConfig = {
  pending: { variant: 'warning', icon: Clock, label: 'Pending' },
  partially_dispensed: { variant: 'default', icon: CheckCircle2, label: 'Partial' },
  dispensed: { variant: 'success', icon: CheckCircle2, label: 'Dispensed' },
  expired: { variant: 'destructive', icon: XCircle, label: 'Expired' },
  cancelled: { variant: 'outline', icon: XCircle, label: 'Cancelled' },
};

const initialPatientForm = {
  name: '',
  phone: '',
  email: '',
  dateOfBirth: '',
  gender: '',
  bloodType: '',
  address: '',
  allergies: '',
  notes: '',
};

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const formatDate = (date) => (date ? new Date(date).toLocaleDateString() : 'Not set');

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'P';
}

function DetailItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-white/5 bg-background/60 p-3">
      <div className="mt-0.5 h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center text-primary">
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wider text-gray-500">{label}</p>
        <p className="text-sm text-gray-200 truncate">{value || 'Not set'}</p>
      </div>
    </div>
  );
}

export default function PatientsPage() {
  const toast = useToast();
  const navigate = useNavigate();

  // Patient list
  const [patients, setPatients] = useState([]);
  const [patientMeta, setPatientMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [patientPage, setPatientPage] = useState(1);
  const debouncedSearch = useDebounce(search, 400);

  // Selected patient
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientHistory, setPatientHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Prescriptions
  const [prescriptions, setPrescriptions] = useState([]);
  const [rxLoading, setRxLoading] = useState(false);

  // Modals
  const [patientFormOpen, setPatientFormOpen] = useState(false);
  const [editPatientId, setEditPatientId] = useState(null);
  const [patientForm, setPatientForm] = useState(initialPatientForm);
  const [patientFormLoading, setPatientFormLoading] = useState(false);
  const [patientFormErrors, setPatientFormErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [rxFormOpen, setRxFormOpen] = useState(false);
  // Field names match backend: doctor, diagnosisCode, medicineName
  const [rxForm, setRxForm] = useState({
    patient: '',
    doctor: '',
    hospital: '',
    diagnosisCode: '',
    items: [{ medicineName: '', dosage: '', frequency: '', duration: '', quantity: '' }],
    notes: '',
  });
  const [rxFormLoading, setRxFormLoading] = useState(false);
  const [rxFormErrors, setRxFormErrors] = useState({});

  // ─── Fetch patients ──────────────────────────────────────────────────
  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await patientService.getPatients({ page: patientPage, search: debouncedSearch || undefined });
      setPatients(response?.data || []);
      setPatientMeta(response?.meta || null);
    } catch (err) {
      setError(err.message);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, [patientPage, debouncedSearch]);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);
  useEffect(() => { setPatientPage(1); }, [debouncedSearch]);

  // ─── Fetch history when patient selected ─────────────────────────────
  const selectPatient = async (patient) => {
    setSelectedPatient(patient);
    try {
      setHistoryLoading(true);
      setRxLoading(true);
      const [history, rxResponse] = await Promise.allSettled([
        patientService.getPatientHistory(patient._id),
        patientService.getPrescriptions({ patient: patient._id }),
      ]);
      setPatientHistory(history.status === 'fulfilled' ? history.value?.data : null);
      setPrescriptions(rxResponse.status === 'fulfilled' ? (rxResponse.value?.data || []) : []);
    } catch {
      // handled individually
    } finally {
      setHistoryLoading(false);
      setRxLoading(false);
    }
  };

  // ─── Patient form ────────────────────────────────────────────────────
  const openCreatePatient = () => {
    setEditPatientId(null);
    setPatientForm(initialPatientForm);
    setPatientFormErrors({});
    setPatientFormOpen(true);
  };

  const openEditPatient = (p) => {
    setEditPatientId(p._id);
    setPatientForm({
      name: p.name || '', phone: p.phone || '', email: p.email || '',
      dateOfBirth: p.dateOfBirth ? p.dateOfBirth.split('T')[0] : '',
      gender: p.gender || '', bloodType: p.bloodType || '', address: p.address || '',
      // Backend stores allergies as array; display as comma-separated for editing
      allergies: Array.isArray(p.allergies) ? p.allergies.join(', ') : (p.allergies || ''),
      notes: p.notes || '',
    });
    setPatientFormErrors({});
    setPatientFormOpen(true);
  };

  const handlePatientSubmit = async (e) => {
    e.preventDefault();

    // Build payload matching backend schema
    const payload = {
      name: patientForm.name.trim(),
      phone: patientForm.phone.trim(),
    };
    if (patientForm.email) payload.email = patientForm.email.trim();
    if (patientForm.dateOfBirth) payload.dateOfBirth = new Date(patientForm.dateOfBirth).toISOString();
    if (patientForm.gender) payload.gender = patientForm.gender;
    if (patientForm.bloodType) payload.bloodType = patientForm.bloodType;
    if (patientForm.address) payload.address = patientForm.address.trim();
    if (patientForm.notes) payload.notes = patientForm.notes.trim();

    // Backend expects allergies as array of strings
    if (patientForm.allergies) {
      payload.allergies = patientForm.allergies
        .split(',')
        .map((a) => a.trim())
        .filter((a) => a.length > 0);
    }

    // Client-side validation
    const validation = editPatientId ? validateUpdatePatient(payload) : validateCreatePatient(payload);
    if (!validation.valid) {
      setPatientFormErrors(validation.errors);
      return;
    }
    setPatientFormErrors({});

    setPatientFormLoading(true);
    try {
      if (editPatientId) {
        await patientService.updatePatient(editPatientId, payload);
        toast.success('Patient updated');
      } else {
        await patientService.createPatient(payload);
        toast.success('Patient created');
      }
      setPatientFormOpen(false);
      fetchPatients();
    } catch (err) {
      // Toast is shown globally by api interceptor
    } finally {
      setPatientFormLoading(false);
    }
  };

  const handleDeletePatient = async () => {
    if (!deleteTarget) return;

    setDeleteLoading(true);
    try {
      await patientService.deletePatient(deleteTarget._id);
      toast.success('Patient deactivated');
      setDeleteTarget(null);
      setSelectedPatient(null);
      setPatientHistory(null);
      setPrescriptions([]);
      fetchPatients();
    } catch {
      // Toast is shown globally by api interceptor
    } finally {
      setDeleteLoading(false);
    }
  };

  // ─── Prescription form ───────────────────────────────────────────────
  const openCreateRx = async () => {
    if (!selectedPatient) return;

    setRxForm({
      patient: selectedPatient._id,
      doctor: '',
      hospital: '',
      diagnosisCode: '',
      items: [{ medicineName: '', dosage: '', frequency: '', duration: '', quantity: '' }],
      notes: '',
    });
    setRxFormErrors({});
    setRxFormOpen(true);
  };

  const addRxItem = () => {
    setRxForm((f) => ({
      ...f,
      items: [...f.items, { medicineName: '', dosage: '', frequency: '', duration: '', quantity: '' }],
    }));
  };

  const removeRxItem = (index) => {
    setRxForm((f) => ({
      ...f,
      items: f.items.filter((_, i) => i !== index),
    }));
  };

  const updateRxItem = (index, field, value) => {
    setRxForm((f) => ({
      ...f,
      items: f.items.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }));
  };

  const handleRxSubmit = async (e) => {
    e.preventDefault();

    // Build payload matching backend createPrescriptionSchema
    const payload = {
      patient: rxForm.patient,
      doctor: rxForm.doctor.trim(),
    };
    if (rxForm.hospital) payload.hospital = rxForm.hospital.trim();
    if (rxForm.diagnosisCode) payload.diagnosisCode = rxForm.diagnosisCode.trim();
    if (rxForm.notes) payload.notes = rxForm.notes.trim();

    // Backend expects items with medicineName (string), not medicine (ObjectId)
    payload.items = rxForm.items.map((i) => {
      const item = { medicineName: i.medicineName.trim() };
      if (i.dosage) item.dosage = i.dosage.trim();
      if (i.frequency) item.frequency = i.frequency.trim();
      if (i.duration) item.duration = i.duration.trim();
      if (i.quantity !== '') item.quantity = Number(i.quantity);
      return item;
    });

    // Client-side validation
    const validation = validateCreatePrescription(payload);
    if (!validation.valid) {
      setRxFormErrors(validation.errors);
      return;
    }
    setRxFormErrors({});

    setRxFormLoading(true);
    try {
      await patientService.createPrescription(payload);
      toast.success('Prescription created');
      setRxFormOpen(false);
      if (selectedPatient) selectPatient(selectedPatient);
    } catch (err) {
      // Toast is shown globally by api interceptor
    } finally {
      setRxFormLoading(false);
    }
  };

  // ─── Dispense ─────────────────────────────────────────────────────────
  const handleDispense = async (rxId) => {
    try {
      await patientService.dispensePrescription(rxId, {});
      toast.success('Prescription dispensed');
      if (selectedPatient) selectPatient(selectedPatient);
    } catch (err) {
      // Toast is shown globally by api interceptor
    }
  };

  const updatePatientField = (field, value) => setPatientForm((f) => ({ ...f, [field]: value }));

  // ─── Render ───────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white tracking-tight">Patients & Prescriptions</h1>
        <Button className="gap-2" onClick={openCreatePatient}>
          <UserPlus size={18} />
          New Patient
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — Patient List */}
        <Card className="lg:col-span-1 h-[calc(100vh-12rem)] flex flex-col">
          <CardHeader className="border-b border-white/5 pb-4 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search patients..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-background border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0">
            {loading ? (
              <div className="p-8 text-center text-gray-400">Loading patients...</div>
            ) : error ? (
              <ErrorState message={error} onRetry={fetchPatients} className="py-8" />
            ) : patients.length === 0 ? (
              <EmptyState icon={User} title="No patients" description="Create your first patient." className="py-8" />
            ) : (
              <div className="divide-y divide-white/5">
                {patients.map((patient) => (
                  <button
                    key={patient._id}
                    onClick={() => selectPatient(patient)}
                    className={`w-full text-left p-4 hover:bg-white/5 transition-colors border-l-2 ${
                      selectedPatient?._id === patient._id
                        ? 'bg-primary/5 border-primary'
                        : 'border-transparent'
                    }`}
                  >
                    <p className="font-semibold text-white">{patient.name}</p>
                    <p className="text-sm text-gray-400 mt-0.5">{patient.phone || patient.email || ''}</p>
                  </button>
                ))}
              </div>
            )}
            {patientMeta && <Pagination meta={patientMeta} onPageChange={setPatientPage} />}
          </CardContent>
        </Card>

        {/* Right — Patient Detail + Prescriptions */}
        <Card className="lg:col-span-2 h-[calc(100vh-12rem)] flex flex-col overflow-y-auto">
          {!selectedPatient ? (
            <CardContent className="flex-1 flex flex-col items-center justify-center text-gray-500">
              <FileText size={48} className="mb-4 opacity-20" />
              <p>Select a patient to view details and prescriptions</p>
            </CardContent>
          ) : (
            <div className="p-6 space-y-6">
              {/* Patient info header */}
              <div className="hidden">
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedPatient.name}</h2>
                  <p className="text-gray-400 text-sm mt-1">{selectedPatient.phone} · {selectedPatient.email || ''}</p>
                  {selectedPatient.dateOfBirth && (
                    <p className="text-xs text-gray-500 mt-1">DOB: {new Date(selectedPatient.dateOfBirth).toLocaleDateString()}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEditPatient(selectedPatient)}>Edit</Button>
                  <Button size="sm" className="gap-1.5" onClick={openCreateRx}>
                    <Pill size={14} />
                    New Prescription
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border border-white/5 bg-background/50 overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 border-b border-white/5">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-14 w-14 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                      {getInitials(selectedPatient.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-lg font-semibold text-white truncate">{selectedPatient.name}</p>
                        <Badge variant={selectedPatient.isActive === false ? 'outline' : 'success'}>
                          {selectedPatient.isActive === false ? 'Inactive' : 'Active'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-400">
                        Patient record{selectedPatient.createdAt ? ` since ${new Date(selectedPatient.createdAt).toLocaleDateString()}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => openEditPatient(selectedPatient)}>Edit Patient</Button>
                    <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(selectedPatient)} className="gap-1.5">
                      <Trash2 size={14} />
                      Delete
                    </Button>
                    <Button size="sm" className="gap-1.5" onClick={openCreateRx}>
                      <Pill size={14} />
                      New Prescription
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 p-5">
                  <DetailItem icon={Phone} label="Phone" value={selectedPatient.phone} />
                  <DetailItem icon={Mail} label="Email" value={selectedPatient.email} />
                  <DetailItem icon={CalendarDays} label="Date of Birth" value={formatDate(selectedPatient.dateOfBirth)} />
                  <DetailItem icon={User} label="Gender" value={selectedPatient.gender ? selectedPatient.gender.charAt(0).toUpperCase() + selectedPatient.gender.slice(1) : ''} />
                  <DetailItem icon={Droplet} label="Blood Type" value={selectedPatient.bloodType} />
                  <DetailItem icon={MapPin} label="Address" value={selectedPatient.address} />
                </div>
                {(selectedPatient.allergies?.length > 0 || selectedPatient.notes) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 px-5 pb-5">
                    <div className="rounded-lg border border-warning/20 bg-warning/10 p-3">
                      <p className="text-[11px] uppercase tracking-wider text-warning mb-1">Allergies</p>
                      <p className="text-sm text-gray-200">
                        {selectedPatient.allergies?.length ? selectedPatient.allergies.join(', ') : 'None recorded'}
                      </p>
                    </div>
                    {selectedPatient.notes && (
                      <div className="rounded-lg border border-white/5 bg-background/60 p-3">
                        <p className="text-[11px] uppercase tracking-wider text-gray-500 mb-1">Notes</p>
                        <p className="text-sm text-gray-300">{selectedPatient.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-lg border border-white/5 bg-background/60 p-4">
                  <div className="flex items-center gap-2 text-primary mb-2">
                    <ClipboardCheck size={16} />
                    <span className="text-xs uppercase tracking-wider">Prescriptions</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{patientHistory?.stats?.totalPrescriptions ?? prescriptions.length}</p>
                </div>
                <div className="rounded-lg border border-white/5 bg-background/60 p-4">
                  <div className="flex items-center gap-2 text-success mb-2">
                    <CheckCircle2 size={16} />
                    <span className="text-xs uppercase tracking-wider">Dispensed</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{prescriptions.filter((rx) => rx.status === 'dispensed').length}</p>
                </div>
                <div className="rounded-lg border border-white/5 bg-background/60 p-4">
                  <div className="flex items-center gap-2 text-warning mb-2">
                    <Clock size={16} />
                    <span className="text-xs uppercase tracking-wider">Pending</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{prescriptions.filter((rx) => rx.status === 'pending' || rx.status === 'partially_dispensed').length}</p>
                </div>
              </div>

              {/* Prescriptions */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Prescriptions</h3>
                {rxLoading ? (
                  <p className="text-gray-400 text-sm">Loading prescriptions...</p>
                ) : prescriptions.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 border border-dashed border-white/10 rounded-xl">
                    No prescriptions for this patient.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {prescriptions.map((rx) => {
                      const config = statusConfig[rx.status] || statusConfig.pending;
                      const StatusIcon = config.icon;
                      const canEditRx = rx.status !== 'dispensed' && rx.status !== 'cancelled';
                      return (
                        <div key={rx._id} className="p-4 rounded-lg border border-white/5 bg-background/70 hover:border-white/10 transition-colors space-y-3">
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-white">{rx.prescriptionNumber || rx.diagnosisCode || 'Prescription'}</p>
                              <p className="text-xs text-gray-500">Dr. {rx.doctor?.name || (typeof rx.doctor === 'string' ? rx.doctor : '') || 'Unknown'} · {new Date(rx.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={config.variant} className="gap-1">
                                <StatusIcon size={12} />
                                {config.label}
                              </Badge>
                              {canEditRx && (rx.status === 'pending' || rx.status === 'partially_dispensed') && (
                                <>
                                  <Button size="sm" variant="ghost" onClick={() => navigate(`/patients/prescriptions/${rx._id}/edit`)} className="text-xs h-7">
                                    Edit
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => handleDispense(rx._id)} className="text-xs h-7">
                                    Dispense
                                  </Button>
                                </>
                              )}
                              {canEditRx && rx.status !== 'pending' && rx.status !== 'partially_dispensed' && (
                                <Button size="sm" variant="ghost" onClick={() => navigate(`/patients/prescriptions/${rx._id}/edit`)} className="text-xs h-7">
                                  Edit
                                </Button>
                              )}
                            </div>
                          </div>
                          {rx.items && rx.items.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {rx.items.map((item, idx) => (
                                <p key={idx} className="rounded-md bg-white/[0.03] border border-white/5 px-3 py-2 text-xs text-gray-400">
                                  {item.medicineName || 'Medicine'} — {item.dosage || ''} {item.frequency || ''} × {item.duration || ''}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* ─── Patient Form Modal ──────────────────────────────────────────── */}
      <Modal isOpen={patientFormOpen} onClose={() => setPatientFormOpen(false)} title={editPatientId ? 'Edit Patient' : 'New Patient'} size="md">
        <form onSubmit={handlePatientSubmit} className="space-y-4">
          {Object.keys(patientFormErrors).length > 0 && (
            <div className="bg-danger/10 border border-danger/20 rounded-lg p-3">
              <p className="text-danger text-sm font-medium mb-1">Please fix the following errors:</p>
              {Object.values(patientFormErrors).map((err, i) => (
                <p key={i} className="text-danger/80 text-xs">• {err}</p>
              ))}
            </div>
          )}

          <Input label="Full Name *" value={patientForm.name} onChange={(e) => updatePatientField('name', e.target.value)} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Phone *" value={patientForm.phone} onChange={(e) => updatePatientField('phone', e.target.value)} required />
            <Input label="Email" type="email" value={patientForm.email} onChange={(e) => updatePatientField('email', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Date of Birth" type="date" value={patientForm.dateOfBirth} onChange={(e) => updatePatientField('dateOfBirth', e.target.value)} />
            <Select label="Gender" value={patientForm.gender} onChange={(e) => updatePatientField('gender', e.target.value)}>
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Blood Type" value={patientForm.bloodType} onChange={(e) => updatePatientField('bloodType', e.target.value)}>
              <option value="">Select</option>
              {BLOOD_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </Select>
            <Input label="Address" value={patientForm.address} onChange={(e) => updatePatientField('address', e.target.value)} />
          </div>
          <Input label="Allergies" value={patientForm.allergies} onChange={(e) => updatePatientField('allergies', e.target.value)} placeholder="e.g. Penicillin, Aspirin (comma separated)" />
          <ModalFooter>
            <Button variant="ghost" type="button" onClick={() => setPatientFormOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={patientFormLoading}>
              {patientFormLoading ? 'Saving...' : editPatientId ? 'Update Patient' : 'Create Patient'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeletePatient}
        title="Delete Patient"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This will deactivate the patient record.`}
        confirmLabel="Delete"
        loading={deleteLoading}
      />

      {/* ─── Prescription Form Modal ─────────────────────────────────────── */}
      <Modal isOpen={rxFormOpen} onClose={() => setRxFormOpen(false)} title="New Prescription" size="lg">
        <form onSubmit={handleRxSubmit} className="space-y-4">
          {Object.keys(rxFormErrors).length > 0 && (
            <div className="bg-danger/10 border border-danger/20 rounded-lg p-3">
              <p className="text-danger text-sm font-medium mb-1">Please fix the following errors:</p>
              {Object.values(rxFormErrors).map((err, i) => (
                <p key={i} className="text-danger/80 text-xs">• {err}</p>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input label="Doctor Name *" value={rxForm.doctor} onChange={(e) => setRxForm((f) => ({ ...f, doctor: e.target.value }))} required />
            <Input label="Hospital" value={rxForm.hospital} onChange={(e) => setRxForm((f) => ({ ...f, hospital: e.target.value }))} />
            <Input label="Diagnosis Code" value={rxForm.diagnosisCode} onChange={(e) => setRxForm((f) => ({ ...f, diagnosisCode: e.target.value }))} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-300">Medications</p>
              <Button type="button" variant="ghost" size="sm" onClick={addRxItem}>+ Add Item</Button>
            </div>
            {rxForm.items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-[2fr_repeat(4,1fr)_auto] gap-2 p-3 rounded-lg bg-background border border-white/5">
                <Input placeholder="Medicine Name *" value={item.medicineName} onChange={(e) => updateRxItem(idx, 'medicineName', e.target.value)} />
                <Input placeholder="Dosage" value={item.dosage} onChange={(e) => updateRxItem(idx, 'dosage', e.target.value)} />
                <Input placeholder="Frequency" value={item.frequency} onChange={(e) => updateRxItem(idx, 'frequency', e.target.value)} />
                <Input placeholder="Duration" value={item.duration} onChange={(e) => updateRxItem(idx, 'duration', e.target.value)} />
                <Input placeholder="Qty" type="number" min="1" value={item.quantity} onChange={(e) => updateRxItem(idx, 'quantity', e.target.value)} />
                <button
                  type="button"
                  onClick={() => removeRxItem(idx)}
                  disabled={rxForm.items.length === 1}
                  className="h-10 w-10 rounded-lg border border-white/10 text-gray-400 hover:text-danger hover:bg-danger/10 disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Remove medication"
                >
                  <XCircle size={16} className="mx-auto" />
                </button>
              </div>
            ))}
          </div>

          <Input label="Notes" value={rxForm.notes} onChange={(e) => setRxForm((f) => ({ ...f, notes: e.target.value }))} />

          <ModalFooter>
            <Button variant="ghost" type="button" onClick={() => setRxFormOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={rxFormLoading}>
              {rxFormLoading ? 'Creating...' : 'Create Prescription'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
