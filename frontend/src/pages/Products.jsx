import { useState, useEffect, useCallback, useMemo } from 'react'
import { productsApi } from '../api/client'
import toast from 'react-hot-toast'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import { TableSkeleton } from '../components/Skeleton'
import { SortableHeader, useSort } from '../components/SortableHeader'
import { exportCSV, formatDate, formatCurrency } from '../utils/csv'
import { Plus, Pencil, Trash2, Search, Package, Download, AlertTriangle } from 'lucide-react'

const empty = { name: '', sku: '', description: '', price: '', stock_quantity: '' }

function ProductForm({ initial = empty, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(initial)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({ ...form, price: parseFloat(form.price), stock_quantity: parseInt(form.stock_quantity) })
  }

  const inputClass = "w-full border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Name *</label>
        <input required value={form.name} onChange={e => set('name', e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 dark:text-gray-300">SKU *</label>
        <input required value={form.sku} onChange={e => set('sku', e.target.value)} className={inputClass} disabled={!!initial.id} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Description</label>
        <textarea value={form.description || ''} onChange={e => set('description', e.target.value)} rows={2} className={inputClass} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-gray-300">Price ($) *</label>
          <input required type="number" step="0.01" min="0.01" value={form.price} onChange={e => set('price', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-gray-300">Stock Qty *</label>
          <input required type="number" min="0" value={form.stock_quantity} onChange={e => set('stock_quantity', e.target.value)} className={inputClass} />
        </div>
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

export default function Products() {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const { sort, setSort, apply } = useSort({ key: 'id', dir: 'desc' })

  const load = useCallback(() => {
    setLoading(true)
    productsApi.list({ search: search || undefined })
      .then(r => setProducts(Array.isArray(r.data) ? r.data : []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [search])

  useEffect(() => { load() }, [load])

  const sorted = useMemo(() => apply(products), [apply, products])
  const lowStockCount = products.filter(p => p.stock_quantity <= 10).length

  const toggleSelect = (id) => setSelected(s => {
    const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n
  })
  const toggleAll = () => setSelected(s => s.size === sorted.length ? new Set() : new Set(sorted.map(p => p.id)))

  const handleCreate = async (data) => {
    setSaving(true)
    try { await productsApi.create(data); toast.success('Product created'); setModal(null); load() }
    catch (e) { toast.error(e.response?.data?.detail || 'Failed to create product') }
    finally { setSaving(false) }
  }

  const handleUpdate = async (data) => {
    setSaving(true)
    try { await productsApi.update(modal.product.id, data); toast.success('Product updated'); setModal(null); load() }
    catch (e) { toast.error(e.response?.data?.detail || 'Failed to update product') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"?`)) return
    try { await productsApi.delete(id); toast.success('Product deleted'); load() }
    catch (e) { toast.error(e.response?.data?.detail || 'Failed to delete product') }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selected.size} product(s)?`)) return
    const ids = Array.from(selected)
    const results = await Promise.allSettled(ids.map(id => productsApi.delete(id)))
    const ok = results.filter(r => r.status === 'fulfilled').length
    const fail = results.length - ok
    toast.success(`Deleted ${ok}${fail ? `, failed ${fail}` : ''}`)
    setSelected(new Set())
    load()
  }

  const handleExport = () => {
    exportCSV(sorted, [
      { key: 'id', label: 'Product ID' },
      { key: 'name', label: 'Product Name' },
      { key: 'sku', label: 'SKU' },
      { key: 'description', label: 'Description' },
      { key: 'price', label: 'Price (USD)', format: formatCurrency },
      { key: 'stock_quantity', label: 'Stock Quantity' },
      { key: 'created_at', label: 'Created At', format: formatDate },
      { key: 'updated_at', label: 'Last Updated', format: formatDate },
    ], `products-${new Date().toISOString().slice(0,10)}.csv`)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold dark:text-gray-100">Products</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{products.length} total</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} disabled={!products.length}
            className="flex items-center gap-2 border dark:border-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50">
            <Download size={15} /> Export CSV
          </button>
          <button onClick={() => setModal({ type: 'create' })}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      {lowStockCount > 0 && !loading && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-900/50 flex items-center gap-3">
          <AlertTriangle size={18} className="text-orange-600 dark:text-orange-400 shrink-0" />
          <p className="text-sm text-orange-800 dark:text-orange-300">
            <strong>{lowStockCount}</strong> product{lowStockCount !== 1 ? 's' : ''} {lowStockCount !== 1 ? 'are' : 'is'} running low on stock (≤ 10 units)
          </p>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input placeholder="Search by name or SKU…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        {selected.size > 0 && (
          <button onClick={handleBulkDelete} className="flex items-center gap-2 bg-red-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-red-700">
            <Trash2 size={15} /> Delete {selected.size}
          </button>
        )}
      </div>

      {loading ? (
        <TableSkeleton columns={6} rows={6} />
      ) : sorted.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border dark:border-gray-800">
          <EmptyState
            icon={Package}
            title="No products yet"
            description={search ? 'Try a different search term.' : 'Get started by adding your first product to the inventory.'}
            action={!search && (
              <button onClick={() => setModal({ type: 'create' })} className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
                <Plus size={16} /> Add Product
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
                <SortableHeader label="SKU" sortKey="sku" sort={sort} setSort={setSort} />
                <SortableHeader label="Price" sortKey="price" sort={sort} setSort={setSort} />
                <SortableHeader label="Stock" sortKey="stock_quantity" sort={sort} setSort={setSort} />
                <th className="px-4 py-3 font-medium w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(p => (
                <tr key={p.id} className={`border-b dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${selected.has(p.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} />
                  </td>
                  <td className="px-4 py-3 font-medium dark:text-gray-100">{p.name}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 font-mono text-xs">{p.sku}</td>
                  <td className="px-4 py-3 dark:text-gray-200">${p.price.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      p.stock_quantity === 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' :
                      p.stock_quantity <= 10 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' :
                      'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                    }`}>{p.stock_quantity}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => setModal({ type: 'edit', product: p })} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-blue-600">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleDelete(p.id, p.name)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-red-600">
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
