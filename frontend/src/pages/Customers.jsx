import { useState, useEffect, useCallback } from 'react'
import { customersApi } from '../api/client'
import toast from 'react-hot-toast'
import Modal from '../components/Modal'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'

const empty = { name: '', email: '', phone: '', address: '' }

function CustomerForm({ initial = empty, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(initial)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form) }} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Name *</label>
        <input required value={form.name} onChange={e => set('name', e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Email *</label>
        <input required type="email" value={form.email} onChange={e => set('email', e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Phone</label>
        <input value={form.phone || ''} onChange={e => set('phone', e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Address</label>
        <textarea value={form.address || ''} onChange={e => set('address', e.target.value)} rows={2}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-50">Cancel</button>
        <button type="submit" disabled={loading}
          className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
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

  const load = useCallback(() => {
    customersApi.list({ search: search || undefined })
      .then(r => setCustomers(Array.isArray(r.data) ? r.data : []))
      .catch(() => setCustomers([]))
  }, [search])

  useEffect(() => { load() }, [load])

  const handleCreate = async (data) => {
    setSaving(true)
    try {
      await customersApi.create(data)
      toast.success('Customer created')
      setModal(null)
      load()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to create customer')
    } finally { setSaving(false) }
  }

  const handleUpdate = async (data) => {
    setSaving(true)
    try {
      await customersApi.update(modal.customer.id, data)
      toast.success('Customer updated')
      setModal(null)
      load()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to update customer')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"?`)) return
    try {
      await customersApi.delete(id)
      toast.success('Customer deleted')
      load()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to delete customer')
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Customers</h2>
        <button onClick={() => setModal({ type: 'create' })}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
          <Plus size={16} /> Add Customer
        </button>
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr className="text-left text-gray-500">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium w-20">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No customers found</td></tr>
            ) : customers.map(c => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 text-gray-600">{c.email}</td>
                <td className="px-4 py-3 text-gray-500">{c.phone || '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => setModal({ type: 'edit', customer: c })} className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-blue-600">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => handleDelete(c.id, c.name)} className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-red-600">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
