import { useState, useEffect, useCallback } from 'react'
import { ordersApi, customersApi, productsApi } from '../api/client'
import toast from 'react-hot-toast'
import Modal from '../components/Modal'
import { Plus, Eye, Trash2, X } from 'lucide-react'

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

const STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']

function CreateOrderModal({ onClose, onCreated }) {
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [customerId, setCustomerId] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState([{ product_id: '', quantity: 1 }])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    customersApi.list({ limit: 200 }).then(r => setCustomers(r.data))
    productsApi.list({ limit: 200 }).then(r => setProducts(r.data))
  }, [])

  const addItem = () => setItems(i => [...i, { product_id: '', quantity: 1 }])
  const removeItem = (idx) => setItems(i => i.filter((_, j) => j !== idx))
  const setItem = (idx, k, v) => setItems(i => i.map((item, j) => j === idx ? { ...item, [k]: v } : item))

  const total = items.reduce((sum, item) => {
    const p = products.find(p => p.id === parseInt(item.product_id))
    return sum + (p ? p.price * (parseInt(item.quantity) || 0) : 0)
  }, 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!customerId) return toast.error('Select a customer')
    const validItems = items.filter(i => i.product_id && parseInt(i.quantity) > 0)
    if (!validItems.length) return toast.error('Add at least one item')

    setSaving(true)
    try {
      await ordersApi.create({
        customer_id: parseInt(customerId),
        notes: notes || null,
        items: validItems.map(i => ({ product_id: parseInt(i.product_id), quantity: parseInt(i.quantity) })),
      })
      toast.success('Order created')
      onCreated()
      onClose()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to create order')
    } finally { setSaving(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Customer *</label>
        <select required value={customerId} onChange={e => setCustomerId(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Select customer…</option>
          {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium">Items *</label>
          <button type="button" onClick={addItem} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
            <Plus size={12} /> Add item
          </button>
        </div>
        <div className="space-y-2">
          {items.map((item, idx) => {
            const prod = products.find(p => p.id === parseInt(item.product_id))
            return (
              <div key={idx} className="flex gap-2 items-center">
                <select value={item.product_id} onChange={e => setItem(idx, 'product_id', e.target.value)}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select product…</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ${p.price.toFixed(2)} (stock: {p.stock_quantity})
                    </option>
                  ))}
                </select>
                <input type="number" min="1" max={prod?.stock_quantity || 9999} value={item.quantity}
                  onChange={e => setItem(idx, 'quantity', e.target.value)}
                  className="w-20 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {items.length > 1 && (
                  <button type="button" onClick={() => removeItem(idx)} className="p-1 text-gray-400 hover:text-red-500">
                    <X size={16} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
        {total > 0 && (
          <p className="text-right text-sm font-semibold mt-2">Total: ${total.toFixed(2)}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Notes</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-50">Cancel</button>
        <button type="submit" disabled={saving}
          className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
          {saving ? 'Placing…' : 'Place Order'}
        </button>
      </div>
    </form>
  )
}

function OrderDetailModal({ order, onClose, onUpdated }) {
  const [status, setStatus] = useState(order.status)
  const [saving, setSaving] = useState(false)

  const handleStatusChange = async (newStatus) => {
    setSaving(true)
    try {
      await ordersApi.update(order.id, { status: newStatus })
      setStatus(newStatus)
      toast.success('Status updated')
      onUpdated()
    } catch (e) {
      toast.error('Failed to update status')
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div><span className="text-gray-500">Order #</span><p className="font-semibold">{order.id}</p></div>
        <div><span className="text-gray-500">Customer</span><p className="font-semibold">{order.customer_name}</p></div>
        <div><span className="text-gray-500">Email</span><p>{order.customer_email}</p></div>
        <div><span className="text-gray-500">Total</span><p className="font-semibold">${order.total_amount.toFixed(2)}</p></div>
        {order.notes && <div className="col-span-2"><span className="text-gray-500">Notes</span><p>{order.notes}</p></div>}
      </div>

      <div>
        <p className="text-sm text-gray-500 mb-1">Status</p>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map(s => (
            <button key={s} onClick={() => handleStatusChange(s)} disabled={saving || s === status}
              className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-colors ${
                s === status ? STATUS_COLORS[s] + ' ring-2 ring-offset-1 ring-current' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium mb-2">Items</p>
        <table className="w-full text-sm border rounded-lg overflow-hidden">
          <thead className="bg-gray-50">
            <tr className="text-left text-gray-500">
              <th className="px-3 py-2">Product</th>
              <th className="px-3 py-2">SKU</th>
              <th className="px-3 py-2">Qty</th>
              <th className="px-3 py-2">Unit</th>
              <th className="px-3 py-2">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map(item => (
              <tr key={item.id} className="border-t">
                <td className="px-3 py-2">{item.product_name}</td>
                <td className="px-3 py-2 font-mono text-xs text-gray-500">{item.product_sku}</td>
                <td className="px-3 py-2">{item.quantity}</td>
                <td className="px-3 py-2">${item.unit_price.toFixed(2)}</td>
                <td className="px-3 py-2 font-medium">${(item.quantity * item.unit_price).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-50">Close</button>
      </div>
    </div>
  )
}

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [modal, setModal] = useState(null)

  const load = useCallback(() => {
    ordersApi.list().then(r => setOrders(r.data)).catch(() => {})
  }, [])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id) => {
    if (!confirm(`Delete order #${id}?`)) return
    try {
      await ordersApi.delete(id)
      toast.success('Order deleted')
      load()
    } catch (e) {
      toast.error('Failed to delete order')
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Orders</h2>
        <button onClick={() => setModal({ type: 'create' })}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
          <Plus size={16} /> New Order
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr className="text-left text-gray-500">
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Items</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium w-20">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No orders found</td></tr>
            ) : orders.map(o => (
              <tr key={o.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{o.id}</td>
                <td className="px-4 py-3 font-medium">{o.customer_name}</td>
                <td className="px-4 py-3 text-gray-500">{o.items.length} item{o.items.length !== 1 ? 's' : ''}</td>
                <td className="px-4 py-3 font-medium">${o.total_amount.toFixed(2)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[o.status]}`}>
                    {o.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{new Date(o.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => setModal({ type: 'detail', order: o })} className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-blue-600">
                      <Eye size={15} />
                    </button>
                    <button onClick={() => handleDelete(o.id)} className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-red-600">
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
        <Modal title="New Order" onClose={() => setModal(null)}>
          <CreateOrderModal onClose={() => setModal(null)} onCreated={load} />
        </Modal>
      )}
      {modal?.type === 'detail' && (
        <Modal title={`Order #${modal.order.id}`} onClose={() => setModal(null)}>
          <OrderDetailModal order={modal.order} onClose={() => setModal(null)} onUpdated={load} />
        </Modal>
      )}
    </div>
  )
}
