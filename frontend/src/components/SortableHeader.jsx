import { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'

export function SortableHeader({ label, sortKey, sort, setSort, className = '' }) {
  const active = sort.key === sortKey
  const Icon = active ? (sort.dir === 'asc' ? ChevronUp : ChevronDown) : ChevronsUpDown

  return (
    <th
      onClick={() => setSort({
        key: sortKey,
        dir: active && sort.dir === 'asc' ? 'desc' : 'asc',
      })}
      className={`px-4 py-3 font-medium cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200 ${className}`}
    >
      <div className="flex items-center gap-1">
        {label}
        <Icon size={14} className={active ? 'text-blue-600' : 'opacity-40'} />
      </div>
    </th>
  )
}

export function useSort(initial = { key: 'id', dir: 'desc' }) {
  const [sort, setSort] = useState(initial)
  const apply = useMemo(() => (arr) => {
    if (!Array.isArray(arr) || !sort.key) return arr
    return [...arr].sort((a, b) => {
      const av = a[sort.key], bv = b[sort.key]
      if (av == null) return 1
      if (bv == null) return -1
      if (typeof av === 'number') return sort.dir === 'asc' ? av - bv : bv - av
      return sort.dir === 'asc'
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av))
    })
  }, [sort])
  return { sort, setSort, apply }
}
