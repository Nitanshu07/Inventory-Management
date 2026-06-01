function escape(v) {
  if (v == null || v === '') return ''
  const s = String(v).replace(/"/g, '""')
  return /[",\n\r]/.test(s) ? `"${s}"` : s
}

export function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d)) return ''
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function formatCurrency(n) {
  if (n == null) return ''
  return Number(n).toFixed(2)
}

export function exportCSV(rows, columns, filename) {
  const header = columns.map(c => escape(c.label)).join(',')
  const body = rows.map(row =>
    columns.map(c => {
      const raw = typeof c.value === 'function' ? c.value(row) : row[c.key]
      const formatted = c.format ? c.format(raw, row) : raw
      return escape(formatted)
    }).join(',')
  ).join('\r\n')
  // Add BOM so Excel detects UTF-8 properly
  const csv = '﻿' + header + '\r\n' + body
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}
