import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, AlertCircle, Package, ArrowUpDown } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal, ModalFooter } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Pagination } from '../../components/ui/Pagination';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { TableSkeleton } from '../../components/ui/LoadingSkeleton';
import { formatCurrency } from '../../utils/currency';
import { inventoryService } from '../../services/inventoryService';
import { useToast } from '../../hooks/useToast';
import { useDebounce } from '../../hooks/useDebounce';
import { MEDICINE_UNIT_LIST } from '../../utils/constants';
import { validateCreateMedicine, validateUpdateMedicine, validateAdjustStock } from '../../utils/validators';

const TABS = [
  { id: 'all', label: 'All Medicines' },
  { id: 'low-stock', label: 'Low Stock' },
  { id: 'expiring', label: 'Expiring Soon' },
  { id: 'expired', label: 'Expired' },
];

// Field names now match backend schema: sellingPrice, purchasePrice
const initialForm = {
  name: '', genericName: '', category: '', manufacturer: '',
  sellingPrice: '', purchasePrice: '', quantity: '', unit: 'tablet',
  batchNumber: '', expiryDate: '', reorderLevel: '',
  description: '', barcode: '',
};

export default function InventoryPage() {
  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 400);

  // Modal states
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [formLoading, setFormLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Stock adjust modal
  const [stockModal, setStockModal] = useState(null);
  const [stockForm, setStockForm] = useState({ type: 'in', quantity: '', reason: '' });
  const [stockLoading, setStockLoading] = useState(false);
  const [stockErrors, setStockErrors] = useState({});

  const toast = useToast();

  // ─── Fetch data ─────────────────────────────────────────────────────────
const fetchData = useCallback(async () => {
  try {
    setLoading(true);
    setError(null);

    let response;

    if (activeTab === 'low-stock') {
      response = await inventoryService.getLowStock();
      setMedicines(response?.data || []);
      setMeta(null);

    } else if (activeTab === 'expiring') {
      response = await inventoryService.getExpiring(30);
      setMedicines(response?.data || []);
      setMeta(null);

    } else if (activeTab === 'expired') {
      response = await inventoryService.getExpired();
      setMedicines(response?.data || []);
      setMeta(null);

    } else {
      response = await inventoryService.getMedicines({
        page,
        search: debouncedSearch || undefined,
      });

      setMedicines(response?.data || []);
      setMeta(response?.meta || null);
    }

  } catch (err) {
    setError(err.message || 'Something went wrong');
    setMedicines([]);
    setMeta(null);
  } finally {
    setLoading(false);
  }
}, [activeTab, page, debouncedSearch]);
  const fetchCategories = useCallback(async () => {
    try {
      const response = await inventoryService.getActiveCategories();
      setCategories(Array.isArray(response?.data) ? response.data : []);
    } catch {
      // Categories are optional for display
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  useEffect(() => { setPage(1); }, [activeTab, debouncedSearch]);

  // ─── Form handlers ──────────────────────────────────────────────────────
  const openCreate = () => {
    setEditId(null);
    setForm(initialForm);
    setFormErrors({});
    setFormOpen(true);
  };

  const openEdit = (med) => {
    setEditId(med._id);
    setForm({
      name: med.name || '',
      genericName: med.genericName || '',
      category: med.category?._id || med.category || '',
      manufacturer: med.manufacturer || '',
      sellingPrice: med.sellingPrice ?? '',
      purchasePrice: med.purchasePrice ?? '',
      quantity: med.quantity ?? '',
      unit: med.unit || 'tablet',
      batchNumber: med.batchNumber || '',
      expiryDate: med.expiryDate ? med.expiryDate.split('T')[0] : '',
      reorderLevel: med.reorderLevel ?? '',
      description: med.description || '',
      barcode: med.barcode || '',
    });
    setFormErrors({});
    setFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Build payload with correct backend field names
    const payload = {};
    if (form.name) payload.name = form.name.trim();
    if (form.genericName) payload.genericName = form.genericName.trim();
    if (form.category) payload.category = form.category;
    if (form.manufacturer) payload.manufacturer = form.manufacturer.trim();
    if (form.sellingPrice !== '') payload.sellingPrice = Number(form.sellingPrice);
    if (form.purchasePrice !== '') payload.purchasePrice = Number(form.purchasePrice);
    if (!editId && form.quantity !== '') payload.quantity = Number(form.quantity);
    if (form.unit) payload.unit = form.unit;
    if (form.batchNumber) payload.batchNumber = form.batchNumber.trim();
    if (form.expiryDate) payload.expiryDate = new Date(form.expiryDate).toISOString();
    if (form.reorderLevel !== '') payload.reorderLevel = Number(form.reorderLevel);
    if (form.description) payload.description = form.description.trim();
    if (form.barcode) payload.barcode = form.barcode.trim();

    // Client-side validation
    const validation = editId ? validateUpdateMedicine(payload) : validateCreateMedicine(payload);
    if (!validation.valid) {
      setFormErrors(validation.errors);
      return;
    }
    setFormErrors({});

    setFormLoading(true);
    try {
      if (editId) {
        await inventoryService.updateMedicine(editId, payload);
        toast.success('Medicine updated successfully');
      } else {
        await inventoryService.createMedicine(payload);
        toast.success('Medicine created successfully');
      }
      setFormOpen(false);
      fetchData();
    } catch (err) {
      // Toast is shown globally by api interceptor
    } finally {
      setFormLoading(false);
    }
  };

  // ─── Delete ─────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await inventoryService.deleteMedicine(deleteTarget._id);
      toast.success('Medicine deleted');
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      // Toast is shown globally by api interceptor
    } finally {
      setDeleteLoading(false);
    }
  };

  // ─── Stock adjustment ──────────────────────────────────────────────────
  const handleStockAdjust = async (e) => {
    e.preventDefault();

    const payload = {
      type: stockForm.type,
      quantity: Number(stockForm.quantity),
      reason: stockForm.reason.trim(),
    };

    // Client-side validation
    const validation = validateAdjustStock(payload);
    if (!validation.valid) {
      setStockErrors(validation.errors);
      return;
    }
    setStockErrors({});

    setStockLoading(true);
    try {
      await inventoryService.adjustStock(stockModal._id, payload);
      toast.success('Stock adjusted');
      setStockModal(null);
      setStockForm({ type: 'in', quantity: '', reason: '' });
      fetchData();
    } catch (err) {
      // Toast is shown globally by api interceptor
    } finally {
      setStockLoading(false);
    }
  };

  const updateForm = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-white tracking-tight">Inventory Management</h1>
        <Button className="gap-2" onClick={openCreate}>
          <Plus size={18} />
          Add Medicine
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-primary text-white'
                : 'bg-card border border-white/5 text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader className="border-b border-white/5 pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <Package size={20} className="text-primary" />
              Medicine Stock
            </CardTitle>
            {activeTab === 'all' && (
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search medicines..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-background border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <TableSkeleton rows={6} cols={6} />
          ) : error ? (
            <ErrorState message={error} onRetry={fetchData} />
          ) : !Array.isArray(medicines) || medicines.length === 0 ? (
            <EmptyState
              icon={Package}
              title={activeTab === 'all' ? 'No medicines found' : `No ${activeTab.replace('-', ' ')} items`}
              description={activeTab === 'all' ? 'Add your first medicine to get started.' : 'All stock levels are healthy.'}
              action={activeTab === 'all' ? <Button onClick={openCreate} className="gap-2"><Plus size={16} />Add Medicine</Button> : undefined}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="bg-white/5 text-gray-400 font-medium border-b border-white/5">
                  <tr>
                    <th className="px-6 py-4">Medicine Name</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Stock</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4">Expiry</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {medicines.map((med) => (
                    <tr key={med._id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-white">{med.name}</p>
                        {med.genericName && <p className="text-xs text-gray-500">{med.genericName}</p>}
                      </td>
                      <td className="px-6 py-4 text-gray-400">{med.category?.name || (typeof med.category === 'string' ? med.category : '—')}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span>{med.quantity}</span>
                          {med.quantity <= (med.reorderLevel || 20) && (
                            <Badge variant="warning" className="h-5 px-1.5 py-0 text-[10px]">Low</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">{formatCurrency(med.sellingPrice)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span>{med.expiryDate ? new Date(med.expiryDate).toLocaleDateString() : '—'}</span>
                          {med.expiryDate && new Date(med.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && (
                            <AlertCircle size={14} className="text-danger" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setStockModal(med); setStockErrors({}); }}
                            className="p-1.5 text-gray-400 hover:text-success transition-colors rounded-md hover:bg-success/10"
                            title="Adjust Stock"
                          >
                            <ArrowUpDown size={15} />
                          </button>
                          <button
                            onClick={() => openEdit(med)}
                            className="p-1.5 text-gray-400 hover:text-primary transition-colors rounded-md hover:bg-primary/10"
                            title="Edit"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(med)}
                            className="p-1.5 text-gray-400 hover:text-danger transition-colors rounded-md hover:bg-danger/10"
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {meta && <Pagination meta={meta} onPageChange={setPage} />}
        </CardContent>
      </Card>

      {/* ─── Create/Edit Medicine Modal ─────────────────────────────────────── */}
      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={editId ? 'Edit Medicine' : 'Add Medicine'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Show validation errors summary */}
          {Object.keys(formErrors).length > 0 && (
            <div className="bg-danger/10 border border-danger/20 rounded-lg p-3">
              <p className="text-danger text-sm font-medium mb-1">Please fix the following errors:</p>
              {Object.values(formErrors).map((err, i) => (
                <p key={i} className="text-danger/80 text-xs">• {err}</p>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Medicine Name *" value={form.name} onChange={(e) => updateForm('name', e.target.value)} required />
            <Input label="Generic Name" value={form.genericName} onChange={(e) => updateForm('genericName', e.target.value)} />
            <Select label="Category *" value={form.category} onChange={(e) => updateForm('category', e.target.value)}>
              <option value="">Select category</option>
              {categories.map((c) => {
                const categoryId = typeof c === 'string' ? c : c._id;
                const categoryName = typeof c === 'string' ? c : c.name;

                return (
                  <option key={categoryId} value={categoryId}>{categoryName}</option>
                );
              })}
            </Select>
            <Input label="Manufacturer" value={form.manufacturer} onChange={(e) => updateForm('manufacturer', e.target.value)} />
            <Input label="Selling Price *" type="number" step="0.01" min="0" value={form.sellingPrice} onChange={(e) => updateForm('sellingPrice', e.target.value)} required />
            <Input label="Purchase Price *" type="number" step="0.01" min="0" value={form.purchasePrice} onChange={(e) => updateForm('purchasePrice', e.target.value)} required />
            <Input
              label="Quantity *"
              type="number"
              min="0"
              value={form.quantity}
              onChange={(e) => updateForm('quantity', e.target.value)}
              disabled={!!editId}
              required={!editId}
            />
            <Select label="Unit" value={form.unit} onChange={(e) => updateForm('unit', e.target.value)}>
              {MEDICINE_UNIT_LIST.map((u) => (
                <option key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</option>
              ))}
            </Select>
            <Input label="Batch Number" value={form.batchNumber} onChange={(e) => updateForm('batchNumber', e.target.value)} />
            <Input label="Expiry Date *" type="date" value={form.expiryDate} onChange={(e) => updateForm('expiryDate', e.target.value)} required />
            <Input label="Reorder Level" type="number" min="0" value={form.reorderLevel} onChange={(e) => updateForm('reorderLevel', e.target.value)} />
            <Input label="Barcode" value={form.barcode} onChange={(e) => updateForm('barcode', e.target.value)} />
          </div>

          <ModalFooter>
            <Button variant="ghost" type="button" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={formLoading}>
              {formLoading ? 'Saving...' : editId ? 'Update Medicine' : 'Add Medicine'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* ─── Stock Adjustment Modal ─────────────────────────────────────────── */}
      <Modal
        isOpen={!!stockModal}
        onClose={() => setStockModal(null)}
        title={`Adjust Stock — ${stockModal?.name || ''}`}
        size="sm"
      >
        <form onSubmit={handleStockAdjust} className="space-y-4">
          {Object.keys(stockErrors).length > 0 && (
            <div className="bg-danger/10 border border-danger/20 rounded-lg p-3">
              {Object.values(stockErrors).map((err, i) => (
                <p key={i} className="text-danger/80 text-xs">• {err}</p>
              ))}
            </div>
          )}

          <Select
            label="Adjustment Type"
            value={stockForm.type}
            onChange={(e) => setStockForm((f) => ({ ...f, type: e.target.value }))}
          >
            <option value="in">Stock In</option>
            <option value="out">Stock Out</option>
            <option value="adjustment">Adjustment</option>
            <option value="return">Return</option>
          </Select>
          <Input
            label="Quantity *"
            type="number"
            min="1"
            value={stockForm.quantity}
            onChange={(e) => setStockForm((f) => ({ ...f, quantity: e.target.value }))}
            required
          />
          <Input
            label="Reason *"
            value={stockForm.reason}
            onChange={(e) => setStockForm((f) => ({ ...f, reason: e.target.value }))}
            placeholder="e.g. New shipment received"
            required
          />
          <ModalFooter>
            <Button variant="ghost" type="button" onClick={() => setStockModal(null)}>Cancel</Button>
            <Button type="submit" disabled={stockLoading}>
              {stockLoading ? 'Processing...' : 'Adjust Stock'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* ─── Delete Confirm ─────────────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Medicine"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleteLoading}
      />
    </div>
  );
}
