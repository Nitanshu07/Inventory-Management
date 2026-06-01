import { useState, useEffect, useCallback, useMemo } from 'react'
import { ordersApi, customersApi, productsApi } from '../api/client'
import toast from 'react-hot-toast'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import { TableSkeleton } from '../components/Skeleton'
import { SortableHeader, useSort } from '../components/SortableHeader'
import { exportCSV, formatDate, formatCurrency } from '../utils/csv'
import { Plus, Eye, Trash2, X, ShoppingCart, Download, Printer, Truck, Check, Circle } from 'lucide-react'

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  shipped: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  delivered: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

const STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']
const TIMELINE_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered']

function StatusTimeline({ status }) {
  if (status === 'cancelled') {
    return <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-sm text-red-700 dark:text-red-300 text-center">This order has been cancelled.</div>
  }
  const currentIdx = TIMELINE_STATUSES.indexOf(status)
  return (
    <div className="flex items-center justify-between">
      {TIMELINE_STATUSES.map((s, i) => {
        const done = i <= currentIdx
        const current = i === currentIdx
        return (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                done ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
              } ${current ? 'ring-4 ring-blue-100 dark:ring-blue-900/40' : ''}`}>
                {done ? <Check size={14} /> : <Circle size={10} />}
              </div>
              <span className={`text-xs mt-1 capitalize ${done ? 'font-medium text-gray-700 dark:text-gray-200' : 'text-gray-400'}`}>{s}</span>
            </div>
            {i < TIMELINE_STATUSES.length - 1 && (
              <div className={`h-0.5 flex-1 mb-5 ${i < currentIdx ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function CreateOrderModal({ onClose, onCreated }) {
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [customerId, setCustomerId] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState([{ product_id: '', quantity: 1 }])
  const [saving, setSaving] = useState(false)
  const inputClass = "w-full border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"

  useEffect(() => {
    customersApi.list({ limit: 200 }).then(r => setCustomers(Array.isArray(r.data) ? r.data : []))
    productsApi.list({ limit: 200 }).then(r => setProducts(Array.isArray(r.data) ? r.data : []))
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
        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Customer *</label>
        <select required value={customerId} onChange={e => setCustomerId(e.target.value)} className={inputClass}>
          <option value="">Select customer…</option>
          {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium dark:text-gray-300">Items *</label>
          <button type="button" onClick={addItem} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
            <Plus size={12} /> Add item
          </button>
        </div>
        <div className="space-y-3">
          {products.length === 0 && (
            <div className="text-sm text-gray-500 dark:text-gray-400 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border dark:border-gray-700">
              No products available. Please add a product first.
            </div>
          )}
          {items.map((item, idx) => {
            const prod = products.find(p => p.id === parseInt(item.product_id))
            const subtotal = prod ? prod.price * (parseInt(item.quantity) || 0) : 0
            return (
              <div key={idx} className="p-3 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 space-y-2">
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Product</label>
                    <select
                      value={item.product_id}
                      onChange={e => setItem(idx, 'product_id', e.target.value)}
                      className="w-full border dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select product…</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id} disabled={p.stock_quantity === 0}>
                          {p.name} — ${p.price.toFixed(2)} {p.stock_quantity === 0 ? '(out of stock)' : `(${p.stock_quantity} in stock)`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-24 shrink-0">
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      max={prod?.stock_quantity || 9999}
                      value={item.quantity}
                      onChange={e => setItem(idx, 'quantity', e.target.value)}
                      className="w-full border dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="mt-6 p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0"
                      title="Remove item"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                {prod && (
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-1 border-t dark:border-gray-700">
                    <span>${prod.price.toFixed(2)} × {item.quantity || 0}</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-200">${subtotal.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        {total > 0 && (
          <div className="flex items-center justify-between p-3 mt-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/50">
            <span className="text-sm font-medium text-blue-900 dark:text-blue-200">Order Total</span>
            <span className="text-xl font-bold text-blue-900 dark:text-blue-100">${total.toFixed(2)}</span>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Notes</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className={inputClass} />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border dark:border-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
        <button type="submit" disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
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
      toast.error(e.response?.data?.detail || 'Failed to update status')
    } finally { setSaving(false) }
  }

  const handlePrint = () => {
    const itemsRows = order.items.map(item => `
      <tr>
        <td>${item.product_name}</td>
        <td style="font-family:monospace;color:#666">${item.product_sku}</td>
        <td>${item.quantity}</td>
        <td>$${item.unit_price.toFixed(2)}</td>
        <td style="text-align:right">$${(item.quantity * item.unit_price).toFixed(2)}</td>
      </tr>
    `).join('')

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice #${order.id}</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #1f2937; }
          h1 { margin: 0 0 4px; font-size: 32px; letter-spacing: -0.02em; }
          .subtitle { color: #6b7280; margin-bottom: 32px; font-size: 14px; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #1f2937; padding-bottom: 16px; margin-bottom: 24px; }
          .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px; font-size: 14px; }
          .meta-label { color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
          .meta-value { font-weight: 600; }
          .status-badge { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; text-transform: capitalize; background: #dbeafe; color: #1e40af; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th { text-align: left; padding: 12px; border-bottom: 2px solid #1f2937; font-size: 12px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.05em; }
          td { padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
          .total-row td { border-top: 2px solid #1f2937; border-bottom: none; font-weight: 700; padding-top: 16px; font-size: 16px; }
          .notes { margin-top: 24px; padding: 16px; background: #f9fafb; border-radius: 8px; font-size: 14px; }
          .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>INVOICE</h1>
            <div class="subtitle">Inventory &amp; Order Management</div>
          </div>
          <div style="text-align:right">
            <div class="meta-label">Invoice #</div>
            <div style="font-size:20px;font-weight:700">${order.id}</div>
          </div>
        </div>

        <div class="meta">
          <div>
            <div class="meta-label">Order Date</div>
            <div class="meta-value">${new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
          <div>
            <div class="meta-label">Status</div>
            <span class="status-badge">${status}</span>
          </div>
          <div>
            <div class="meta-label">Bill To</div>
            <div class="meta-value">${order.customer_name}</div>
            <div style="color:#6b7280">${order.customer_email}</div>
          </div>
          <div>
            <div class="meta-label">Total Amount</div>
            <div style="font-size:24px;font-weight:700;color:#059669">$${order.total_amount.toFixed(2)}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th style="text-align:right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
            <tr class="total-row">
              <td colspan="4" style="text-align:right">Total</td>
              <td style="text-align:right">$${order.total_amount.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        ${order.notes ? `<div class="notes"><strong>Notes:</strong> ${order.notes}</div>` : ''}

        <div class="footer">
          Generated on ${new Date().toLocaleString()} &middot; Thank you for your business!
        </div>

        <script>window.onload = () => { window.print(); }</script>
      </body>
      </html>
    `

    const win = window.open('', '_blank', 'width=900,height=700')
    if (!win) {
      toast.error('Please allow pop-ups to print invoices')
      return
    }
    win.document.write(html)
    win.document.close()
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500 dark:text-gray-400">Order #</span><p className="font-semibold dark:text-gray-100">{order.id}</p></div>
          <div><span className="text-gray-500 dark:text-gray-400">Date</span><p className="font-semibold dark:text-gray-100">{new Date(order.created_at).toLocaleDateString()}</p></div>
          <div><span className="text-gray-500 dark:text-gray-400">Customer</span><p className="font-semibold dark:text-gray-100">{order.customer_name}</p></div>
          <div><span className="text-gray-500 dark:text-gray-400">Email</span><p className="dark:text-gray-200">{order.customer_email}</p></div>
          {order.notes && <div className="col-span-2"><span className="text-gray-500 dark:text-gray-400">Notes</span><p className="dark:text-gray-200">{order.notes}</p></div>}
        </div>

        <div className="pt-2 mt-4">
          <p className="text-sm font-medium mb-3 dark:text-gray-300">Status</p>
          <StatusTimeline status={status} />
        </div>

        <div className="mt-5">
          <p className="text-sm font-medium mb-2 dark:text-gray-300">Items</p>
          <table className="w-full text-sm border dark:border-gray-700 rounded-lg overflow-hidden">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr className="text-left text-gray-500 dark:text-gray-400">
                <th className="px-3 py-2">Product</th>
                <th className="px-3 py-2">SKU</th>
                <th className="px-3 py-2">Qty</th>
                <th className="px-3 py-2">Unit</th>
                <th className="px-3 py-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map(item => (
                <tr key={item.id} className="border-t dark:border-gray-700">
                  <td className="px-3 py-2 dark:text-gray-200">{item.product_name}</td>
                  <td className="px-3 py-2 font-mono text-xs text-gray-500 dark:text-gray-400">{item.product_sku}</td>
                  <td className="px-3 py-2 dark:text-gray-200">{item.quantity}</td>
                  <td className="px-3 py-2 dark:text-gray-200">${item.unit_price.toFixed(2)}</td>
                  <td className="px-3 py-2 font-medium dark:text-gray-100 text-right">${(item.quantity * item.unit_price).toFixed(2)}</td>
                </tr>
              ))}
              <tr className="border-t-2 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <td colSpan={4} className="px-3 py-2 text-right font-semibold dark:text-gray-100">Total</td>
                <td className="px-3 py-2 text-right font-bold text-lg dark:text-gray-100">${order.total_amount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="no-print">
        <p className="text-sm font-medium mb-2 dark:text-gray-300">Change status</p>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map(s => (
            <button key={s} onClick={() => handleStatusChange(s)} disabled={saving || s === status}
              className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all ${
                s === status ? STATUS_COLORS[s] + ' ring-2 ring-offset-1 ring-current dark:ring-offset-gray-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between gap-3 no-print">
        <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg border dark:border-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
          <Printer size={15} /> Print Invoice
        </button>
        <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border dark:border-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">Close</button>
      </div>
    </div>
  )
}

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [modal, setModal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(new Set())
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateRange, setDateRange] = useState('all') // all, 7d, 30d, 90d
  const { sort, setSort, apply } = useSort({ key: 'id', dir: 'desc' })

  const load = useCallback(() => {
    setLoading(true)
    ordersApi.list()
      .then(r => setOrders(Array.isArray(r.data) ? r.data : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    let result = orders
    if (statusFilter !== 'all') result = result.filter(o => o.status === statusFilter)
    if (dateRange !== 'all') {
      const days = { '7d': 7, '30d': 30, '90d': 90 }[dateRange]
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - days)
      result = result.filter(o => new Date(o.created_at) >= cutoff)
    }
    return apply(result)
  }, [orders, statusFilter, dateRange, apply])

  const toggleSelect = (id) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleAll = () => setSelected(s => s.size === filtered.length ? new Set() : new Set(filtered.map(o => o.id)))

  const handleDelete = async (id) => {
    if (!confirm(`Delete order #${id}?`)) return
    try { await ordersApi.delete(id); toast.success('Order deleted'); load() }
    catch (e) { toast.error('Failed to delete order') }
  }

  const handleBulkAction = async (action) => {
    const ids = Array.from(selected)
    if (action === 'delete') {
      if (!confirm(`Delete ${ids.length} order(s)?`)) return
      const results = await Promise.allSettled(ids.map(id => ordersApi.delete(id)))
      const ok = results.filter(r => r.status === 'fulfilled').length
      toast.success(`Deleted ${ok}${results.length - ok ? `, failed ${results.length - ok}` : ''}`)
    } else if (action === 'ship') {
      const results = await Promise.allSettled(ids.map(id => ordersApi.update(id, { status: 'shipped' })))
      const ok = results.filter(r => r.status === 'fulfilled').length
      toast.success(`Marked ${ok} as shipped`)
    }
    setSelected(new Set())
    load()
  }

  const handleExport = () => {
    exportCSV(filtered, [
      { key: 'id', label: 'Order ID' },
      { key: 'customer_name', label: 'Customer Name' },
      { key: 'customer_email', label: 'Customer Email' },
      { key: 'status', label: 'Status', format: s => s ? s.charAt(0).toUpperCase() + s.slice(1) : '' },
      { label: 'Items Count', value: o => o.items.length },
      { label: 'Items Detail', value: o => o.items.map(i => `${i.product_name} (${i.product_sku}) x${i.quantity} @ $${i.unit_price.toFixed(2)}`).join('; ') },
      { key: 'total_amount', label: 'Total (USD)', format: formatCurrency },
      { key: 'notes', label: 'Notes' },
      { key: 'created_at', label: 'Order Date', format: formatDate },
    ], `orders-${new Date().toISOString().slice(0,10)}.csv`)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold dark:text-gray-100">Orders</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{filtered.length} of {orders.length}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} disabled={!filtered.length}
            className="flex items-center gap-2 border dark:border-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50">
            <Download size={15} /> Export CSV
          </button>
          <button onClick={() => setModal({ type: 'create' })}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
            <Plus size={16} /> New Order
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="border dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">All statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <select value={dateRange} onChange={e => setDateRange(e.target.value)}
          className="border dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">All time</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
        {selected.size > 0 && (
          <div className="flex gap-2 ml-auto">
            <button onClick={() => handleBulkAction('ship')} className="flex items-center gap-2 bg-purple-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-purple-700">
              <Truck size={15} /> Mark Shipped ({selected.size})
            </button>
            <button onClick={() => handleBulkAction('delete')} className="flex items-center gap-2 bg-red-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-red-700">
              <Trash2 size={15} /> Delete ({selected.size})
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <TableSkeleton columns={7} rows={6} />
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border dark:border-gray-800">
          <EmptyState
            icon={ShoppingCart}
            title={orders.length === 0 ? 'No orders yet' : 'No orders match your filter'}
            description={orders.length === 0 ? 'Create your first order to start tracking sales.' : 'Try adjusting your filters above.'}
            action={orders.length === 0 && (
              <button onClick={() => setModal({ type: 'create' })} className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
                <Plus size={16} /> New Order
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
                  <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} />
                </th>
                <SortableHeader label="#" sortKey="id" sort={sort} setSort={setSort} />
                <SortableHeader label="Customer" sortKey="customer_name" sort={sort} setSort={setSort} />
                <th className="px-4 py-3 font-medium">Items</th>
                <SortableHeader label="Total" sortKey="total_amount" sort={sort} setSort={setSort} />
                <SortableHeader label="Status" sortKey="status" sort={sort} setSort={setSort} />
                <SortableHeader label="Date" sortKey="created_at" sort={sort} setSort={setSort} />
                <th className="px-4 py-3 font-medium w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id} className={`border-b dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${selected.has(o.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.has(o.id)} onChange={() => toggleSelect(o.id)} />
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{o.id}</td>
                  <td className="px-4 py-3 font-medium dark:text-gray-100">{o.customer_name}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{o.items.length} item{o.items.length !== 1 ? 's' : ''}</td>
                  <td className="px-4 py-3 font-medium dark:text-gray-100">${o.total_amount.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[o.status]}`}>{o.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{new Date(o.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => setModal({ type: 'detail', order: o })} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-blue-600">
                        <Eye size={15} />
                      </button>
                      <button onClick={() => handleDelete(o.id)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-red-600">
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
        <Modal title="New Order" onClose={() => setModal(null)} size="lg">
          <CreateOrderModal onClose={() => setModal(null)} onCreated={load} />
        </Modal>
      )}
      {modal?.type === 'detail' && (
        <Modal title={`Order #${modal.order.id}`} onClose={() => setModal(null)} size="lg">
          <OrderDetailModal order={modal.order} onClose={() => setModal(null)} onUpdated={load} />
        </Modal>
      )}
    </div>
  )
}
