import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../../lib/supabase'

interface AlertComment {
  id: number
  alert_id: number
  user_id: string
  comment: string
  is_manager_note: boolean
  created_at: string
}

interface Alert {
  id: number
  title: string
  type: string
  severity: string
  status: string
  message: string
  manager_notes: string | null
  bar_id: string
  is_global: boolean
  start_time: string
  end_time: string | null
  created_by: string
  created_at: string
  updated_at: string
  creator_name?: string
  acknowledgement_count?: number
  total_staff_count?: number
  view_count?: number
  comments?: AlertComment[]
}

interface Profile {
  id: string
  name: string
}

interface AlertsPageProps {
  isDark: boolean
  barName: string
  userId: string | null
  isManager?: boolean
}

const typeLabels: Record<string, string> = {
  '86': '86 / Out of Stock',
  'staff_meeting': 'Staff Meeting',
  'doh': 'DOH / Compliance',
  'incident': 'Incident Report',
  'customer_86': '86 Customer',
  'maintenance': 'Maintenance',
  'staff_notice': 'Staff Notice',
  'shift_handoff': 'Shift Handoff'
}

const severityColors: Record<string, string> = {
  critical: 'border-l-red-600',
  high: 'border-l-orange-500',
  normal: 'border-l-yellow-500',
  low: 'border-l-blue-500'
}

const statusColors: Record<string, string> = {
  open: 'text-gray-400',
  acknowledged: 'text-gray-400',
  resolved: 'text-gray-600',
  expired: 'text-gray-600'
}

const typeIcons: Record<string, string> = {
  '86': 'ri-restaurant-line',
  'staff_meeting': 'ri-calendar-event-line',
  'doh': 'ri-government-line',
  'incident': 'ri-alert-line',
  'customer_86': 'ri-user-forbid-line',
  'maintenance': 'ri-tools-line',
  'staff_notice': 'ri-team-line',
  'shift_handoff': 'ri-exchange-line'
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

const formatDuration = (endTime: string | null): string => {
  if (!endTime) return 'No expiration'
  const end = new Date(endTime)
  const now = new Date()
  const hoursLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60))
  if (hoursLeft <= 0) return 'Expired'
  if (hoursLeft < 24) return `${hoursLeft} hours left`
  return `${Math.ceil(hoursLeft / 24)} days left`
}

export function AlertsPage({ isDark, barName, userId, isManager = true }: AlertsPageProps) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterSeverity, setFilterSeverity] = useState<string>('all')
  const [comment, setComment] = useState('')
  const [profiles, setProfiles] = useState<Map<string, string>>(new Map())
  const [totalStaffCount, setTotalStaffCount] = useState(0)
  const [newAlert, setNewAlert] = useState({
    title: '',
    type: '86',
    severity: 'normal',
    message: '',
    manager_notes: '',
    end_time_type: 'custom',
    end_time_value: '',
    end_time_unit: 'hours',
    meeting_date: '',
    customer_name: ''
  })

  // Load profiles and staff count
  useEffect(() => {
    const loadData = async () => {
      const { data: profilesData } = await supabase.from('profiles').select('id, name')
      if (profilesData) {
        const map = new Map()
        profilesData.forEach((p: Profile) => map.set(p.id, p.name))
        setProfiles(map)
        setTotalStaffCount(profilesData.length)
      }
    }
    loadData()
  }, [])

  const applyFilters = useCallback((alertsList: Alert[], type: string, status: string, severity: string) => {
    let filtered = [...alertsList]
    if (type !== 'all') {
      filtered = filtered.filter(a => a.type === type)
    }
    if (status !== 'all') {
      filtered = filtered.filter(a => a.status === status)
    }
    if (severity !== 'all') {
      filtered = filtered.filter(a => a.severity === severity)
    }
    setFilteredAlerts(filtered)
  }, [])

  const loadAlerts = useCallback(async () => {
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('bar_id', barName)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading alerts:', error)
    } else if (data) {
      const enhancedAlerts = await Promise.all(data.map(async (alert: Alert) => {
        const { count: ackCount } = await supabase
          .from('alert_acknowledgements')
          .select('*', { count: 'exact', head: true })
          .eq('alert_id', alert.id)
        
        const { count: viewCount } = await supabase
          .from('alert_views')
          .select('*', { count: 'exact', head: true })
          .eq('alert_id', alert.id)
        
        return {
          ...alert,
          acknowledgement_count: ackCount || 0,
          view_count: viewCount || 0,
          total_staff_count: totalStaffCount,
          creator_name: profiles.get(alert.created_by) || 'Unknown'
        }
      }))
      setAlerts(enhancedAlerts)
      applyFilters(enhancedAlerts, filterType, filterStatus, filterSeverity)
    }
    setLoading(false)
  }, [barName, profiles, filterType, filterStatus, filterSeverity, applyFilters, totalStaffCount])

  // Create a ref to always have the latest loadAlerts function
  const loadAlertsRef = useRef(loadAlerts)
  useEffect(() => {
    loadAlertsRef.current = loadAlerts
  }, [loadAlerts])

  // Load alerts initially
  useEffect(() => {
    if (profiles.size > 0) {
      loadAlerts()
    }
  }, [loadAlerts, profiles.size])

  // Note: Real-time updates are handled globally in App.tsx
  // No local subscription needed here

  const handleFilterChange = (type: string, status: string, severity: string) => {
    setFilterType(type)
    setFilterStatus(status)
    setFilterSeverity(severity)
    applyFilters(alerts, type, status, severity)
  }

  const handleCreateAlert = async () => {
    if (!newAlert.title && newAlert.type !== 'customer_86') {
      alert('Title is required')
      return
    }

    if (newAlert.type === 'customer_86' && !newAlert.customer_name) {
      alert('Customer name is required')
      return
    }

    let endTime = null
    let severity = newAlert.severity
    let title = newAlert.title
    let message = newAlert.message

    // Set fixed severities for certain types
    if (newAlert.type === 'doh' || newAlert.type === 'incident') {
      severity = 'critical'
    }

    // For customer_86, use customer name as title
    if (newAlert.type === 'customer_86') {
      title = `86 Customer: ${newAlert.customer_name}`
      message = `Customer ${newAlert.customer_name} has been banned from the premises.`
    }

    if (newAlert.type === 'staff_meeting' && newAlert.meeting_date) {
      endTime = new Date(newAlert.meeting_date).toISOString()
    } else if (newAlert.end_time_type === 'custom' && newAlert.end_time_value) {
      const value = parseInt(newAlert.end_time_value)
      if (newAlert.end_time_unit === 'hours') {
        endTime = new Date(Date.now() + value * 60 * 60 * 1000).toISOString()
      } else {
        endTime = new Date(Date.now() + value * 24 * 60 * 60 * 1000).toISOString()
      }
    } else if (newAlert.end_time_type === 'end_of_shift') {
      endTime = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString()
    } else if (newAlert.end_time_type === 'tomorrow_8am') {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(8, 0, 0, 0)
      endTime = tomorrow.toISOString()
    }

    const { error } = await supabase
      .from('alerts')
      .insert([{
        title: title,
        type: newAlert.type,
        severity: severity,
        message: message,
        manager_notes: newAlert.manager_notes || null,
        bar_id: barName,
        start_time: new Date().toISOString(),
        end_time: endTime,
        created_by: userId,
        status: 'open'
      }])

    if (error) {
      console.error('Error creating alert:', error)
      alert('Failed to create alert')
    } else {
      setShowCreateModal(false)
      setNewAlert({
        title: '',
        type: '86',
        severity: 'normal',
        message: '',
        manager_notes: '',
        end_time_type: 'custom',
        end_time_value: '',
        end_time_unit: 'hours',
        meeting_date: '',
        customer_name: ''
      })
      loadAlerts()
    }
  }

  const handleAcknowledge = async (alertId: number) => {
    const { error } = await supabase
      .from('alert_acknowledgements')
      .insert([{ alert_id: alertId, user_id: userId }])

    if (error) {
      console.error('Error acknowledging alert:', error)
    } else {
      await supabase
        .from('alert_views')
        .insert([{ alert_id: alertId, user_id: userId }])
      
      const alert = alerts.find(a => a.id === alertId)
      if (alert && alert.type === 'incident' && (alert.acknowledgement_count || 0) + 1 >= totalStaffCount) {
        await supabase
          .from('alerts')
          .update({ status: 'resolved' })
          .eq('id', alertId)
      } else {
        await supabase
          .from('alerts')
          .update({ status: 'acknowledged' })
          .eq('id', alertId)
      }
      
      loadAlerts()
    }
  }

  const handleResolve = async (alertId: number) => {
    const { error } = await supabase
      .from('alerts')
      .update({ status: 'resolved' })
      .eq('id', alertId)

    if (error) {
      console.error('Error resolving alert:', error)
    } else {
      loadAlerts()
      setShowDetailModal(false)
    }
  }

  const handleDeleteAlert = async (alertId: number) => {
    if (!confirm('Delete this alert permanently?')) return

    const { error } = await supabase
      .from('alerts')
      .delete()
      .eq('id', alertId)

    if (error) {
      console.error('Error deleting alert:', error)
      alert('Failed to delete alert')
    } else {
      loadAlerts()
      setShowDetailModal(false)
    }
  }

  const canDelete = (alert: Alert): boolean => {
    return isManager || alert.created_by === userId
  }

  const handleAddComment = async () => {
    if (!comment.trim() || !selectedAlert) return

    const { error } = await supabase
      .from('alert_comments')
      .insert([{
        alert_id: selectedAlert.id,
        user_id: userId,
        comment: comment,
        is_manager_note: isManager
      }])

    if (error) {
      console.error('Error adding comment:', error)
    } else {
      setComment('')
      const { data } = await supabase
        .from('alert_comments')
        .select('*')
        .eq('alert_id', selectedAlert.id)
        .order('created_at', { ascending: true })
      
      if (data) {
        setSelectedAlert({ ...selectedAlert, comments: data })
      }
      loadAlerts()
    }
  }

  const viewAlertDetail = async (alert: Alert) => {
    await supabase
      .from('alert_views')
      .insert([{ alert_id: alert.id, user_id: userId }])
    
    const { data: comments } = await supabase
      .from('alert_comments')
      .select('*')
      .eq('alert_id', alert.id)
      .order('created_at', { ascending: true })
    
    setSelectedAlert({ ...alert, comments: comments || [] })
    setShowDetailModal(true)
  }

  const getTypeBadge = () => {
    return 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
  }

  const getFormFields = () => {
    switch(newAlert.type) {
      case '86':
        return (
          <>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Duration</label>
              <select
                className={`w-full rounded-lg px-4 py-2 border focus:outline-none focus:border-gray-500 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
                value={newAlert.end_time_type}
                onChange={(e) => setNewAlert({...newAlert, end_time_type: e.target.value})}
              >
                <option value="custom">Custom duration</option>
                <option value="end_of_shift">Until end of shift</option>
                <option value="tomorrow_8am">Until tomorrow 8am</option>
              </select>
            </div>
            {newAlert.end_time_type === 'custom' && (
              <div className="flex gap-2">
                <input
                  type="number"
                  className={`flex-1 rounded-lg px-4 py-2 border focus:outline-none focus:border-gray-500 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
                  value={newAlert.end_time_value}
                  onChange={(e) => setNewAlert({...newAlert, end_time_value: e.target.value})}
                  placeholder="Duration"
                />
                <select
                  className={`flex-1 rounded-lg px-4 py-2 border focus:outline-none focus:border-gray-500 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
                  value={newAlert.end_time_unit}
                  onChange={(e) => setNewAlert({...newAlert, end_time_unit: e.target.value})}
                >
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                </select>
              </div>
            )}
          </>
        )
      case 'staff_meeting':
        return (
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Meeting Date & Time</label>
            <input
              type="datetime-local"
              className={`w-full rounded-lg px-4 py-2 border focus:outline-none focus:border-gray-500 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
              value={newAlert.meeting_date}
              onChange={(e) => setNewAlert({...newAlert, meeting_date: e.target.value})}
            />
          </div>
        )
      case 'customer_86':
        return (
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Customer Name</label>
            <input
              type="text"
              className={`w-full rounded-lg px-4 py-2 border focus:outline-none focus:border-gray-500 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
              value={newAlert.customer_name}
              onChange={(e) => setNewAlert({...newAlert, customer_name: e.target.value})}
              placeholder="Full name of banned customer"
            />
          </div>
        )
      case 'doh':
      case 'incident':
        return null
      default:
        return (
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Severity</label>
            <select
              className={`w-full rounded-lg px-4 py-2 border focus:outline-none focus:border-gray-500 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
              value={newAlert.severity}
              onChange={(e) => setNewAlert({...newAlert, severity: e.target.value})}
            >
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
          </div>
        )
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-400">Loading alerts...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Alerts & Announcements</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className={`px-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
        >
          + New Alert
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={filterType}
          onChange={(e) => handleFilterChange(e.target.value, filterStatus, filterSeverity)}
          className={`px-3 py-1 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
        >
          <option value="all">All Types</option>
          {Object.entries(typeLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => handleFilterChange(filterType, e.target.value, filterSeverity)}
          className={`px-3 py-1 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
        >
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="resolved">Resolved</option>
          <option value="expired">Expired</option>
        </select>

        <select
          value={filterSeverity}
          onChange={(e) => handleFilterChange(filterType, filterStatus, e.target.value)}
          className={`px-3 py-1 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
        >
          <option value="all">All Severity</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className={`rounded-xl p-8 text-center border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <i className="ri-notification-line text-4xl text-gray-500 mb-2 block"></i>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              No alerts found
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              onClick={() => viewAlertDetail(alert)}
              className={`rounded-xl p-4 border-l-4 cursor-pointer transition-all hover:translate-x-1 ${
                severityColors[alert.severity] || severityColors.normal
              } ${isDark ? 'bg-gray-800 border-y border-r border-gray-700' : 'bg-white border-y border-r border-gray-200'}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <i className={`${typeIcons[alert.type]} text-xl mt-0.5 text-gray-400`}></i>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold">{alert.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getTypeBadge()}`}>
                        {typeLabels[alert.type]}
                      </span>
                      <span className={`text-xs font-medium ${statusColors[alert.status]}`}>
                        {alert.status}
                      </span>
                    </div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} line-clamp-2`}>
                      {alert.message}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span>By {alert.creator_name || 'Unknown'}</span>
                      <span>{formatDate(alert.created_at)}</span>
                      {alert.end_time && alert.status !== 'resolved' && alert.status !== 'expired' && (
                        <span className="text-yellow-500">{formatDuration(alert.end_time)}</span>
                      )}
                      {alert.type === 'incident' && (
                        <span>✓ {alert.acknowledgement_count || 0}/{alert.total_staff_count || 0} acknowledged</span>
                      )}
                      <span>👁 {alert.view_count || 0}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {alert.status === 'open' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAcknowledge(alert.id)
                      }}
                      className={`px-3 py-1 rounded-lg text-sm ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'}`}
                    >
                      Acknowledge
                    </button>
                  )}
                  {canDelete(alert) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteAlert(alert.id)
                      }}
                      className="px-3 py-1 rounded-lg text-sm bg-red-600 hover:bg-red-700 text-white"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Alert Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className={`rounded-xl shadow-xl w-full max-w-md p-6 border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <h3 className="text-xl font-bold mb-4">Create New Alert</h3>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Type</label>
                <select
                  className={`w-full rounded-lg px-4 py-2 border focus:outline-none focus:border-gray-500 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
                  value={newAlert.type}
                  onChange={(e) => {
                    const newType = e.target.value
                    setNewAlert({
                      ...newAlert,
                      type: newType,
                      severity: (newType === 'doh' || newType === 'incident') ? 'critical' : 'normal',
                      title: newType === 'customer_86' ? '' : newAlert.title,
                      message: newType === 'customer_86' ? '' : newAlert.message
                    })
                  }}
                >
                  <option value="86">86 / Out of Stock</option>
                  <option value="customer_86">86 Customer</option>
                  <option value="staff_meeting">Staff Meeting</option>
                  <option value="doh">DOH / Compliance</option>
                  <option value="incident">Incident Report</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="staff_notice">Staff Notice</option>
                  <option value="shift_handoff">Shift Handoff</option>
                </select>
              </div>

              {newAlert.type !== 'customer_86' && (
                <>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Title</label>
                    <input
                      type="text"
                      className={`w-full rounded-lg px-4 py-2 border focus:outline-none focus:border-gray-500 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
                      value={newAlert.title}
                      onChange={(e) => setNewAlert({...newAlert, title: e.target.value})}
                      placeholder="Brief title"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Message</label>
                    <textarea
                      className={`w-full rounded-lg px-4 py-2 border focus:outline-none focus:border-gray-500 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
                      rows={3}
                      value={newAlert.message}
                      onChange={(e) => setNewAlert({...newAlert, message: e.target.value})}
                      placeholder="Detailed message"
                    />
                  </div>
                </>
              )}

              {getFormFields()}

              {newAlert.type !== 'customer_86' && (
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Manager Notes (private)</label>
                  <textarea
                    className={`w-full rounded-lg px-4 py-2 border focus:outline-none focus:border-gray-500 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
                    rows={2}
                    value={newAlert.manager_notes}
                    onChange={(e) => setNewAlert({...newAlert, manager_notes: e.target.value})}
                    placeholder="Internal notes (staff won't see this)"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className={`px-4 py-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAlert}
                className={`px-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
              >
                Create Alert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Detail Modal */}
      {showDetailModal && selectedAlert && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className={`rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6 border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <div className="flex justify-between items-start mb-4"> {/* Alert Detail Modal Header */}
              <div className="flex items-center gap-2">
                <i className={`${typeIcons[selectedAlert.type]} text-2xl`}></i>
                <h3 className="text-xl font-bold">{selectedAlert.title}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${getTypeBadge()}`}>
                  {typeLabels[selectedAlert.type]}
                </span>
              </div>
              <div className="flex gap-2">
                {selectedAlert.status !== 'resolved' && isManager && selectedAlert.type !== 'incident' && (
                  <button
                    onClick={() => handleResolve(selectedAlert.id)}
                    className="px-3 py-1 rounded-lg text-sm bg-green-600 hover:bg-green-700 text-white"
                  >
                    Resolve
                  </button>
                )}
                {canDelete(selectedAlert) && (
                  <button
                    onClick={() => handleDeleteAlert(selectedAlert.id)}
                    className="px-3 py-1 rounded-lg text-sm bg-red-600 hover:bg-red-700 text-white"
                  >
                    Delete
                  </button>
                )}
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-1 rounded-lg hover:bg-gray-700"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className={`p-3 rounded-lg border ${severityColors[selectedAlert.severity]}`}> {/* Alert Message */}
                <p className="text-sm">{selectedAlert.message}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-400">Created by:</span>
                  <p>{selectedAlert.creator_name || 'Unknown'}</p>
                </div>
                <div>
                  <span className="text-gray-400">Created at:</span>
                  <p>{formatDate(selectedAlert.created_at)}</p>
                </div>
                {selectedAlert.end_time && (
                  <div>
                    <span className="text-gray-400">Expires:</span>
                    <p>{formatDate(selectedAlert.end_time)}</p>
                  </div>
                )}
                <div>
                  <span className="text-gray-400">Status:</span>
                  <p className={`font-medium ${statusColors[selectedAlert.status]}`}>{selectedAlert.status}</p>
                </div>
                {selectedAlert.type === 'incident' && (
                  <div>
                    <span className="text-gray-400">Acknowledged:</span>
                    <p>{selectedAlert.acknowledgement_count || 0} / {selectedAlert.total_staff_count || 0} staff</p>
                  </div>
                )}
              </div>

              {selectedAlert.manager_notes && isManager && (
                <div className={`p-3 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'}`}>
                  <p className="text-sm font-medium mb-1">Manager Notes</p>
                  <p className="text-sm">{selectedAlert.manager_notes}</p>
                </div>
              )}

              <div>
                <h4 className="font-medium mb-2">Comments & Updates</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
                  {(selectedAlert.comments || []).length === 0 ? (
                    <p className="text-sm text-gray-400">No comments yet</p>
                  ) : (
                    selectedAlert.comments?.map((c) => (
                      <div key={c.id} className={`p-2 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                        <p className="text-xs text-gray-400">{c.comment}</p>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className={`flex-1 rounded-lg px-4 py-2 border focus:outline-none focus:border-gray-500 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
                    placeholder="Add a comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                  <button
                    onClick={handleAddComment}
                    className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  if (selectedAlert.status === 'open') {
                    handleAcknowledge(selectedAlert.id)
                  }
                  setShowDetailModal(false)
                }}
                className={`px-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}