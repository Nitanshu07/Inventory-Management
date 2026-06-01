import { useState, useEffect, useCallback, useMemo } from 'react'
import { customersApi } from '../api/client'
import toast from 'react-hot-toast'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import { TableSkeleton } from '../components/Skeleton'
import { SortableHeader, useSort } from '../components/SortableHeader'
import { exportCSV, formatDate } from '../utils/csv'
import { Plus, Pencil, Trash2, Search, Users, Download } from 'lucide-react'

const empty = { name: '', email: '', phone: '', address: '' }

function CustomerForm({ initial = empty, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(initial)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const inputClass = "w-full border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form) }} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Name *</label>
        <input required value={form.name} onChange={e => set('name', e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Email *</label>
        <input required type="email" value={form.email} onChange={e => set('email', e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Phone</label>
        <input value={form.phone || ''} onChange={e => set('phone', e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Address</label>
        <textarea value={form.address || ''} onChange={e => set('address', e.target.value)} rows={2} className={inputClass} />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm rounded-lg border dark:border-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
        <button type="submit" disabled={loading} className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
          {loading ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  )
}

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const { sort, setSort, apply } = useSort({ key: 'id', dir: 'desc' })

  const load = useCallback(() => {
    setLoading(true)
    customersApi.list({ search: search || undefined })
      .then(r => setCustomers(Array.isArray(r.data) ? r.data : []))
      .catch(() => setCustomers([]))
      .finally(() => setLoading(false))
  }, [search])

  useEffect(() => { load() }, [load])

  const sorted = useMemo(() => apply(customers), [apply, customers])

  const toggleSelect = (id) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleAll = () => setSelected(s => s.size === sorted.length ? new Set() : new Set(sorted.map(c => c.id)))

  const handleCreate = async (data) => {
    setSaving(true)
    try { await customersApi.create(data); toast.success('Customer created'); setModal(null); load() }
    catch (e) { toast.error(e.response?.data?.detail || 'Failed to create customer') }
    finally { setSaving(false) }
  }

  const handleUpdate = async (data) => {
    setSaving(true)
    try { await customersApi.update(modal.customer.id, data); toast.success('Customer updated'); setModal(null); load() }
    catch (e) { toast.error(e.response?.data?.detail || 'Failed to update customer') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}" and all their orders?`)) return
    try { await customersApi.delete(id); toast.success('Customer deleted'); load() }
    catch (e) { toast.error(e.response?.data?.detail || 'Failed to delete customer') }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selected.size} customer(s) and all their orders?`)) return
    const results = await Promise.allSettled(Array.from(selected).map(id => customersApi.delete(id)))
    const ok = results.filter(r => r.status === 'fulfilled').length
    toast.success(`Deleted ${ok}${results.length - ok ? `, failed ${results.length - ok}` : ''}`)
    setSelected(new Set())
    load()
  }

  const handleExport = () => {
    exportCSV(sorted, [
      { key: 'id', label: 'Customer ID' },
      { key: 'name', label: 'Full Name' },
      { key: 'email', label: 'Email Address' },
      { key: 'phone', label: 'Phone Number' },
      { key: 'address', label: 'Address' },
      { key: 'created_at', label: 'Joined On', format: formatDate },
    ], `customers-${new Date().toISOString().slice(0,10)}.csv`)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold dark:text-gray-100">Customers</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{customers.length} total</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} disabled={!customers.length}
            className="flex items-center gap-2 border dark:border-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50">
            <Download size={15} /> Export CSV
          </button>
          <button onClick={() => setModal({ type: 'create' })}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
            <Plus size={16} /> Add Customer
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        {selected.size > 0 && (
          <button onClick={handleBulkDelete} className="flex items-center gap-2 bg-red-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-red-700">
            <Trash2 size={15} /> Delete {selected.size}
          </button>
        )}
      </div>

      {loading ? (
        <TableSkeleton columns={5} rows={6} />
      ) : sorted.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border dark:border-gray-800">
          <EmptyState
            icon={Users}
            title="No customers yet"
            description={search ? 'Try a different search term.' : 'Add your first customer to start tracking orders.'}
            action={!search && (
              <button onClick={() => setModal({ type: 'create' })} className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
                <Plus size={16} /> Add Customer
              </button>
            )}
          />
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border dark:border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-800">
              <tr className="text-left text-gray-500 dark:text-gray-400">
                <th className="px-4 py-3 w-8">
                  <input type="checkbox" checked={selected.size === sorted.length && sorted.length > 0} onChange={toggleAll} />
                </th>
                <SortableHeader label="Name" sortKey="name" sort={sort} setSort={setSort} />
                <SortableHeader label="Email" sortKey="email" sort={sort} setSort={setSort} />
                <SortableHeader label="Phone" sortKey="phone" sort={sort} setSort={setSort} />
                <th className="px-4 py-3 font-medium w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(c => (
                <tr key={c.id} className={`border-b dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${selected.has(c.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSelect(c.id)} />
                  </td>
                  <td className="px-4 py-3 font-medium dark:text-gray-100">{c.name}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{c.email}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{c.phone || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => setModal({ type: 'edit', customer: c })} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-blue-600">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleDelete(c.id, c.name)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-red-600">
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

      {modal?.type === 'create' && (
        <Modal title="Add Customer" onClose={() => setModal(null)}>
          <CustomerForm onSubmit={handleCreate} onCancel={() => setModal(null)} loading={saving} />
        </Modal>
      )}
      {modal?.type === 'edit' && (
        <Modal title="Edit Customer" onClose={() => setModal(null)}>
          <CustomerForm initial={modal.customer} onSubmit={handleUpdate} onCancel={() => setModal(null)} loading={saving} />
        </Modal>
      )}
    </div>
  )
}
