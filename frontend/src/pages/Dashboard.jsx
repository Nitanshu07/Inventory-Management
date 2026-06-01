import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { statsApi, productsApi, ordersApi } from '../api/client'
import { Package, Users, ShoppingCart, AlertTriangle, DollarSign, TrendingUp, ArrowRight } from 'lucide-react'
import Sparkline from '../components/Sparkline'
import { StatSkeleton, Skeleton } from '../components/Skeleton'

function StatCard({ label, value, icon: Icon, color, sparkData, sparkColor }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border dark:border-gray-800 p-5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4 min-w-0">
        <div className={`p-3 rounded-lg ${color} shrink-0`}>
          <Icon size={22} className="text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold dark:text-gray-100 truncate">{value}</p>
        </div>
      </div>
      {sparkData && <Sparkline data={sparkData} color={sparkColor} width={70} height={32} />}
    </div>
  )
}

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  shipped: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  delivered: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [lowStock, setLowStock] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      statsApi.get().then(r => setStats(r.data)).catch(() => {}),
      productsApi.list({ limit: 100 }).then(r => {
        const data = Array.isArray(r.data) ? r.data : []
        setLowStock(data.filter(p => p.stock_quantity <= 10))
      }).catch(() => setLowStock([])),
      ordersApi.list().then(r => setOrders(Array.isArray(r.data) ? r.data : [])).catch(() => setOrders([])),
    ]).finally(() => setLoading(false))
  }, [])

  // Build last-7-days series
  const series = (() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      return d.toISOString().slice(0, 10)
    })
    const orderCounts = days.map(day => orders.filter(o => o.created_at?.startsWith(day)).length)
    const revenueDay = days.map(day => orders.filter(o => o.created_at?.startsWith(day))
      .reduce((s, o) => s + o.total_amount, 0))
    return { orderCounts, revenueDay }
  })()

  const recentOrders = [...orders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5)

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold dark:text-gray-100">Dashboard</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Overview of your inventory and orders</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <StatSkeleton key={i} />)
        ) : (
          <>
            <StatCard label="Products" value={stats?.total_products ?? 0} icon={Package} color="bg-blue-500" />
            <StatCard label="Customers" value={stats?.total_customers ?? 0} icon={Users} color="bg-green-500" />
            <StatCard
              label="Orders"
              value={stats?.total_orders ?? 0}
              icon={ShoppingCart}
              color="bg-purple-500"
              sparkData={series.orderCounts}
              sparkColor="#a855f7"
            />
            <StatCard label="Low Stock" value={stats?.low_stock_products ?? 0} icon={AlertTriangle} color="bg-orange-500" />
            <StatCard
              label="Revenue"
              value={`$${(stats?.total_revenue || 0).toFixed(2)}`}
              icon={DollarSign}
              color="bg-emerald-500"
              sparkData={series.revenueDay}
              sparkColor="#10b981"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border dark:border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold dark:text-gray-100">Recent Orders</h3>
            <Link to="/orders" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : recentOrders.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 py-6 text-center">No orders yet</p>
          ) : (
            <div className="space-y-2">
              {recentOrders.map(o => (
                <div key={o.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium dark:text-gray-100 truncate">#{o.id} — {o.customer_name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(o.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-medium dark:text-gray-100">${o.total_amount.toFixed(2)}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[o.status]}`}>{o.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low stock alerts */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border dark:border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-orange-600 dark:text-orange-400 flex items-center gap-2">
              <AlertTriangle size={18} /> Low Stock Alerts
            </h3>
            <Link to="/products" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              Products <ArrowRight size={14} />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
          ) : lowStock.length === 0 ? (
            <div className="text-center py-6">
              <TrendingUp size={24} className="mx-auto text-green-500 mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">All products well-stocked!</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {lowStock.slice(0, 8).map(p => (
                <div key={p.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <div className="min-w-0">
                    <p className="text-sm font-medium dark:text-gray-100 truncate">{p.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{p.sku}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 ${
                    p.stock_quantity === 0
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                      : 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
                  }`}>
                    {p.stock_quantity} left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
