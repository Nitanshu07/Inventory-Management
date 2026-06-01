import { useState, useEffect } from 'react'
import { statsApi, productsApi } from '../api/client'
import { Package, Users, ShoppingCart, AlertTriangle, DollarSign } from 'lucide-react'

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 flex items-center gap-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [lowStock, setLowStock] = useState([])

  useEffect(() => {
    statsApi.get().then(r => setStats(r.data)).catch(() => {})
    productsApi.list({ limit: 100 }).then(r => {
      setLowStock(r.data.filter(p => p.stock_quantity <= 10))
    }).catch(() => {})
  }, [])

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        <StatCard label="Products" value={stats?.total_products ?? '—'} icon={Package} color="bg-blue-500" />
        <StatCard label="Customers" value={stats?.total_customers ?? '—'} icon={Users} color="bg-green-500" />
        <StatCard label="Orders" value={stats?.total_orders ?? '—'} icon={ShoppingCart} color="bg-purple-500" />
        <StatCard label="Low Stock" value={stats?.low_stock_products ?? '—'} icon={AlertTriangle} color="bg-orange-500" />
        <StatCard
          label="Total Revenue"
          value={stats ? `$${stats.total_revenue.toFixed(2)}` : '—'}
          icon={DollarSign}
          color="bg-emerald-500"
        />
      </div>

      {lowStock.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-semibold text-orange-600 mb-4 flex items-center gap-2">
            <AlertTriangle size={18} /> Low Stock Alerts (≤10 units)
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2">Product</th>
                <th className="pb-2">SKU</th>
                <th className="pb-2">Stock</th>
                <th className="pb-2">Price</th>
              </tr>
            </thead>
            <tbody>
              {lowStock.map(p => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="py-2 font-medium">{p.name}</td>
                  <td className="py-2 text-gray-500">{p.sku}</td>
                  <td className="py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${p.stock_quantity === 0 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                      {p.stock_quantity}
                    </span>
                  </td>
                  <td className="py-2">${p.price.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
