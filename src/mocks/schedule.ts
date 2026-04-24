export interface ScheduledWorker {
  id: number
  name: string
  role: string
  date: string
  start_time: string
  end_time: string
}

export const mockSchedule: ScheduledWorker[] = [
  { id: 1, name: 'Matthew', role: 'bartender', date: '2026-04-27', start_time: '16:00', end_time: '02:00' },
  { id: 2, name: 'Sarah', role: 'bartender', date: '2026-04-27', start_time: '16:00', end_time: '02:00' },
  { id: 3, name: 'Mike', role: 'bar back', date: '2026-04-27', start_time: '16:00', end_time: '02:00' },
  { id: 4, name: 'Juan', role: 'cook', date: '2026-04-27', start_time: '16:00', end_time: '22:00' },
  { id: 5, name: 'Chris', role: 'server', date: '2026-04-27', start_time: '18:00', end_time: '01:00' },
  { id: 6, name: 'Jess', role: 'host', date: '2026-04-27', start_time: '18:00', end_time: '01:00' },
  { id: 7, name: 'Tom', role: 'door', date: '2026-04-27', start_time: '20:00', end_time: '02:00' },
  { id: 8, name: 'Alex', role: 'sound', date: '2026-04-27', start_time: '20:00', end_time: '02:00' },
  { id: 9, name: 'Sam', role: 'manager', date: '2026-04-27', start_time: '16:00', end_time: '02:00' },
]