export interface Profile {
  id: string
  name: string
  position: string
  bars: string[]
}

export interface Shift {
  id: number
  bar_id: string
  date: string
  start_time: string
  end_time: string
  notes: string
  created_at: string
  created_by: string
}

export interface Assignment {
  id: number
  shift_id: number
  user_id: string
  role: string
  created_at: string
}

export interface OpenShift {
  id: number
  shift_id: number
  role: string
  status: 'open' | 'claimed' | 'cancelled'
  original_assignment_id: number | null
  claimed_by: string | null
  created_at: string
  claimed_at: string | null
}

// Extended type for UI display (join data)
export interface ShiftWithDetails extends Shift {
  assignments: Assignment[]
  profiles: Record<string, Profile>
  openPositions: OpenShift[]
}