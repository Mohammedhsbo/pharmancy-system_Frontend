import React, { useState, useEffect, useCallback } from 'react';
import { UserPlus, Search, Shield, CheckCircle2, XCircle, Edit2, Trash2 } from 'lucide-react';
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
import { userService } from '../../services/userService';
import { useToast } from '../../hooks/useToast';
import { useDebounce } from '../../hooks/useDebounce';
import { ROLE_LIST, ROLE_LABELS } from '../../utils/constants';
import { validateCreateUser, validateUpdateUser } from '../../utils/validators';

const initialForm = {
  name: '', email: '', password: '', phone: '', role: 'cashier',
};

export default function UserManagementPage() {
  const toast = useToast();

  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

  // ─── Fetch ──────────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await userService.getUsers({
        page,
        search: debouncedSearch || undefined,
      });
      setUsers(response?.data || []);
      setMeta(response?.meta || null);
    } catch (err) {
      setError(err.message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { setPage(1); }, [debouncedSearch]);

  // ─── Toggle active ──────────────────────────────────────────────────────
  const handleToggleActive = async (id) => {
    // Optimistic update
    const original = [...users];
    setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, isActive: !u.isActive } : u)));

    try {
      await userService.toggleActive(id);
      toast.success('User status updated');
    } catch (err) {
      setUsers(original);
      // Toast is shown globally by api interceptor
    }
  };

  // ─── Form ───────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditId(null);
    setForm(initialForm);
    setFormErrors({});
    setFormOpen(true);
  };

  const openEdit = (user) => {
    setEditId(user._id);
    setForm({
      name: user.name || '',
      email: user.email || '',
      password: '',
      phone: user.phone || '',
      role: user.role || 'cashier',
    });
    setFormErrors({});
    setFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = { ...form };
    // Don't send empty password on edit
    if (editId && !payload.password) delete payload.password;
    // Don't send empty phone
    if (!payload.phone) delete payload.phone;

    // Client-side validation
    const validation = editId ? validateUpdateUser(payload) : validateCreateUser(payload);
    if (!validation.valid) {
      setFormErrors(validation.errors);
      return;
    }
    setFormErrors({});

    setFormLoading(true);
    try {
      if (editId) {
        await userService.updateUser(editId, payload);
        toast.success('User updated successfully');
      } else {
        await userService.createUser(payload);
        toast.success('User created successfully');
      }
      setFormOpen(false);
      fetchUsers();
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
      await userService.deleteUser(deleteTarget._id);
      toast.success('User deleted');
      setDeleteTarget(null);
      fetchUsers();
    } catch (err) {
      // Toast is shown globally by api interceptor
    } finally {
      setDeleteLoading(false);
    }
  };

  const updateForm = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const roleColors = {
    admin: 'border-primary text-primary',
    pharmacist: 'border-success text-success',
    cashier: 'border-gray-500 text-gray-400',
  };

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-white tracking-tight">User Management</h1>
        <Button className="gap-2" onClick={openCreate}>
          <UserPlus size={18} />
          Add New User
        </Button>
      </div>

      <Card>
        <CardHeader className="border-b border-white/5 pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <Shield size={20} className="text-primary" />
              System Access Control
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-background border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <TableSkeleton rows={5} cols={4} />
          ) : error ? (
            <ErrorState message={error} onRetry={fetchUsers} />
          ) : !Array.isArray(users) || users.length === 0 ? (
            <EmptyState
              icon={Shield}
              title="No users found"
              description="Create a new user to get started."
              action={<Button onClick={openCreate} className="gap-2"><UserPlus size={16} />Add User</Button>}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="bg-white/5 text-gray-400 font-medium border-b border-white/5">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-white">{user?.name || 'Unknown User'}</p>
                        <p className="text-xs text-gray-500">{user?.email || 'No email'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={roleColors[user.role] || ''}>
                          {ROLE_LABELS[user.role] || user.role}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          {user.isActive ? (
                            <><CheckCircle2 size={14} className="text-success" /><span className="text-success text-xs">Active</span></>
                          ) : (
                            <><XCircle size={14} className="text-danger" /><span className="text-danger text-xs">Suspended</span></>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(user)}
                            className="p-1.5 text-gray-400 hover:text-primary transition-colors rounded-md hover:bg-primary/10"
                            title="Edit"
                          >
                            <Edit2 size={15} />
                          </button>
                          <Button
                            variant={user.isActive ? 'destructive' : 'outline'}
                            size="sm"
                            onClick={() => handleToggleActive(user._id)}
                            className="text-xs h-7 px-2"
                          >
                            {user.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                          <button
                            onClick={() => setDeleteTarget(user)}
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

          {meta && <Pagination meta={meta} onPageChange={setPage} />}
        </CardContent>
      </Card>

      {/* ─── Create/Edit User Modal ──────────────────────────────────────── */}
      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title={editId ? 'Edit User' : 'Create User'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          {Object.keys(formErrors).length > 0 && (
            <div className="bg-danger/10 border border-danger/20 rounded-lg p-3">
              <p className="text-danger text-sm font-medium mb-1">Please fix the following errors:</p>
              {Object.values(formErrors).map((err, i) => (
                <p key={i} className="text-danger/80 text-xs">• {err}</p>
              ))}
            </div>
          )}

          <Input label="Full Name *" value={form.name} onChange={(e) => updateForm('name', e.target.value)} required />
          <Input label="Email *" type="email" value={form.email} onChange={(e) => updateForm('email', e.target.value)} required />
          <div>
            <Input
              label={editId ? 'Password (leave blank to keep current)' : 'Password *'}
              type="password"
              value={form.password}
              onChange={(e) => updateForm('password', e.target.value)}
              required={!editId}
            />
            {!editId && (
              <p className="text-xs text-gray-500 mt-1">
                Min 8 chars, must include uppercase, lowercase, number, and special character (@$!%*?&#).
              </p>
            )}
          </div>
          <Input label="Phone" value={form.phone} onChange={(e) => updateForm('phone', e.target.value)} />
          <Select label="Role *" value={form.role} onChange={(e) => updateForm('role', e.target.value)}>
            {ROLE_LIST.map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </Select>

          <ModalFooter>
            <Button variant="ghost" type="button" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={formLoading}>
              {formLoading ? 'Saving...' : editId ? 'Update User' : 'Create User'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* ─── Delete Confirm ──────────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleteLoading}
      />
    </div>
  );
}
