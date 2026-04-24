interface NewShift {
  date: string
  startTime: string
  endTime: string
  role: string
  note: string
}

interface PostShiftModalProps {
  isOpen: boolean
  onClose: () => void
  newShift: NewShift
  setNewShift: (shift: NewShift) => void
  onSubmit: () => void
  isDark: boolean
}

export function PostShiftModal({
  isOpen,
  onClose,
  newShift,
  setNewShift,
  onSubmit,
  isDark
}: PostShiftModalProps) {
  if (!isOpen) return null

  const updateShift = (field: keyof NewShift, value: string) => {
    setNewShift({ ...newShift, [field]: value })
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className={`rounded-xl shadow-xl w-full max-w-md p-6 border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <h3 className="text-xl font-bold mb-4">Post a Shift</h3>
        
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Date</label>
            <input 
              type="date" 
              className={`w-full rounded-lg px-4 py-2 border focus:outline-none focus:border-gray-500 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} 
              value={newShift.date}
              onChange={(e) => updateShift('date', e.target.value)}
            />
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Start Time</label>
            <input 
              type="time" 
              className={`w-full rounded-lg px-4 py-2 border focus:outline-none focus:border-gray-500 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} 
              value={newShift.startTime}
              onChange={(e) => updateShift('startTime', e.target.value)}
            />
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>End Time</label>
            <input 
              type="time" 
              className={`w-full rounded-lg px-4 py-2 border focus:outline-none focus:border-gray-500 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} 
              value={newShift.endTime}
              onChange={(e) => updateShift('endTime', e.target.value)}
            />
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Role</label>
            <select 
              className={`w-full rounded-lg px-4 py-2 border focus:outline-none focus:border-gray-500 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
              value={newShift.role}
              onChange={(e) => updateShift('role', e.target.value)}
            >
              <option value="bartender">Bartender</option>
              <option value="server">Server</option>
              <option value="kitchen">Kitchen</option>
              <option value="manager">Manager</option>
            </select>
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Optional Note</label>
            <textarea 
              className={`w-full rounded-lg px-4 py-2 border focus:outline-none focus:border-gray-500 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
              rows={3}
              placeholder="Any additional info..."
              value={newShift.note}
              onChange={(e) => updateShift('note', e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <button 
            onClick={onClose}
            className={`px-4 py-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
          >
            Cancel
          </button>
          <button 
            onClick={onSubmit}
            className={`px-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
          >
            Post Shift
          </button>
        </div>
      </div>
    </div>
  )
}