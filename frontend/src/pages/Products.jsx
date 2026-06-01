import { useState, useEffect, useCallback } from 'react'
import { productsApi } from '../api/client'
import toast from 'react-hot-toast'
import Modal from '../components/Modal'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'

const empty = { name: '', sku: '', description: '', price: '', stock_quantity: '' }

function ProductForm({ initial = empty, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(initial)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({ ...form, price: parseFloat(form.price), stock_quantity: parseInt(form.stock_quantity) })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Name *</label>
        <input required value={form.name} onChange={e => set('name', e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">SKU *</label>
        <input required value={form.sku} onChange={e => set('sku', e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={!!initial.id} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea value={form.description || ''} onChange={e => set('description', e.target.value)} rows={2}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Price ($) *</label>
          <input required type="number" step="0.01" min="0.01" value={form.price} onChange={e => set('price', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Stock Qty *</label>
          <input required type="number" min="0" value={form.stock_quantity} onChange={e => set('stock_quantity', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
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

export default function Products() {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    productsApi.list({ search: search || undefined })
      .then(r => setProducts(Array.isArray(r.data) ? r.data : []))
      .catch(() => setProducts([]))
  }, [search])

  useEffect(() => { load() }, [load])

  const handleCreate = async (data) => {
    setSaving(true)
    try {
      await productsApi.create(data)
      toast.success('Product created')
      setModal(null)
      load()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to create product')
    } finally { setSaving(false) }
  }

  const handleUpdate = async (data) => {
    setSaving(true)
    try {
      await productsApi.update(modal.product.id, data)
      toast.success('Product updated')
      setModal(null)
      load()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to update product')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"?`)) return
    try {
      await productsApi.delete(id)
      toast.success('Product deleted')
      load()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to delete product')
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Products</h2>
        <button onClick={() => setModal({ type: 'create' })}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input placeholder="Search by name or SKU…" value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr className="text-left text-gray-500">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium w-20">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No products found</td></tr>
            ) : products.map(p => (
              <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.sku}</td>
                <td className="px-4 py-3">${p.price.toFixed(2)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    p.stock_quantity === 0 ? 'bg-red-100 text-red-700' :
                    p.stock_quantity <= 10 ? 'bg-orange-100 text-orange-700' :
                    'bg-green-100 text-green-700'
                  }`}>{p.stock_quantity}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => setModal({ type: 'edit', product: p })} className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-blue-600">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => handleDelete(p.id, p.name)} className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-red-600">
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
        <Modal title="Add Product" onClose={() => setModal(null)}>
          <ProductForm onSubmit={handleCreate} onCancel={() => setModal(null)} loading={saving} />
        </Modal>
      )}
      {modal?.type === 'edit' && (
        <Modal title="Edit Product" onClose={() => setModal(null)}>
          <ProductForm initial={modal.product} onSubmit={handleUpdate} onCancel={() => setModal(null)} loading={saving} />
        </Modal>
      )}
    </div>
  )
}
