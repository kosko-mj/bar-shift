import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'

interface Message {
  id: number
  user_name: string
  bar_id: string
  user_id: string
  content: string
  channel: string // Added channel to Message interface
  created_at: string
}

interface MessagesPageProps {
  isDark: boolean
  barName: string
  userBars: string[] // Added userBars to props interface
  userId: string | null
  userName: string
}

const CHANNELS = ['General', 'BOH', 'FOH', 'Security', 'Management'] // Defined CHANNELS constant

export function MessagesPage({ isDark, barName: initialBar, userBars, userId, userName }: MessagesPageProps) {
  // State declarations (consolidated and corrected)
  const [activeBar, setActiveBar] = useState(initialBar)
  const [expandedBars, setExpandedBars] = useState<string[]>([initialBar]) // Track which bars are "open"
  const [activeChannel, setActiveChannel] = useState('General')
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Debugging: This will show up in your browser console (F12) 
  // so you know the component is actually trying to render.
  useEffect(() => {
    console.log("MessagesPage mounted for bar:", activeBar, "channel:", activeChannel);
  }, [activeBar, activeChannel]);

  // Logic: Automatically scroll so the latest message is always visible
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Function to handle clicking a bar name
  const toggleBar = (bar: string) => {
    setExpandedBars(prev => 
      prev.includes(bar) ? prev.filter(b => b !== bar) : [...prev, bar]
    )
    setActiveBar(bar)
  }

  // Logic: Load message history for THIS bar only (Multi-tenant)
  useEffect(() => {
    const loadMessages = async () => {
      try { // Removed duplicate try block
        setIsLoading(true)
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('bar_id', activeBar)
          .eq('channel', activeChannel)
          .order('created_at', { ascending: true })
          .limit(50) // Removed duplicate limit

        if (error) throw error
        if (data) setMessages(data)
      } catch (err) {
        console.error("Error fetching messages. Did you create the table in Supabase?", err)
      } finally {
        setIsLoading(false)
      }
    }

    loadMessages()
    console.log("Subscribing to real-time messages for:", activeBar) // Removed duplicate console.log

    // Logic: Real-time subscription
    // For Realtime filters with spaces, it's safer to subscribe to the whole table
    // and filter the incoming data in JavaScript to prevent "white page" crashes.
    const channel = supabase
      .channel('room-messages')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const msg = payload.new as Message // Removed duplicate Message type assertion
          if (msg.bar_id === activeBar && msg.channel === activeChannel) { // Corrected filtering logic
            setMessages(prev => [...prev, msg])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeBar, activeChannel]) // Corrected dependency array

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newMessage.trim()) return
    if (!userId) {
      console.error("Cannot send message: No userId found. Are you logged in?")
      return
    }

    const messageData = {
      bar_id: activeBar,
      user_id: userId,
      user_name: userName || 'Team Member',
      channel: activeChannel,
      content: newMessage.trim()
    }

    console.log("Attempting to send message to Supabase:", messageData)

    const { error } = await supabase.from('messages').insert([messageData])
    if (error) {
      console.error('Supabase Full Error:', error)
      alert(`Failed to send: ${error.message} (Code: ${error.code})`)
    } else {
      setNewMessage('')
    }
  }

  // If we're still loading, show a simple message instead of a white screen
  if (isLoading) {
    return <div className="p-4 text-gray-500">Loading team chat...</div>
  }

  return (
    <div className="flex gap-4 h-[calc(100dvh-180px)] w-full max-w-6xl mx-auto overflow-hidden">
      {/* Chat Sidebar (Sub-menu) */}
      <div className={`w-20 md:w-64 flex flex-col rounded-xl border ${
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      } overflow-hidden`}> {/* Added overflow-hidden for rounded corners */}
        <div className="p-4 border-b border-gray-800">
          <h3 className="hidden md:block font-bold">Channels</h3>
          <i className="ri-chat-3-line md:hidden text-xl mx-auto"></i>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {/* Bar Selector */}
          {userBars.map((bar) => (
            <div key={bar} className="space-y-1">
              <button
                onClick={() => toggleBar(bar)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center justify-between ${
                  activeBar === bar // Corrected activeBar comparison
                    ? (isDark ? 'bg-blue-600 text-white font-bold' : 'bg-blue-500 text-white font-bold')
                    : (isDark ? 'hover:bg-gray-800/50 text-gray-500' : 'hover:bg-gray-50 text-gray-600')
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <i className={`ri-arrow-${expandedBars.includes(bar) ? 'down' : 'right'}-s-line text-xs transition-transform`}></i>
                  <span className="truncate text-xs uppercase tracking-wider font-semibold">{bar}</span>
                </div>
                {/* Placeholder for unread count indicator - made it a subtle dot */}
                <div className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
              </button>
              
              {/* Channel List for Active Bar */}
              {expandedBars.includes(bar) && (
                <div className="ml-4 space-y-0.5 border-l border-gray-800/50">
                  {CHANNELS.map(ch => (
                    <button
                      key={ch}
                      onClick={() => {
                        setActiveBar(bar)
                        setActiveChannel(ch)
                      }}
                      className={`w-full text-left px-4 py-1.5 rounded-md text-sm transition-colors ${
                        activeBar === bar && activeChannel === ch
                          ? (isDark ? 'bg-blue-700 text-white' : 'bg-blue-500 text-white')
                          : isDark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-100'
                      }`}
                    > {ch} </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Active Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat History Area */}
        <div className={`flex-1 overflow-y-auto rounded-t-xl border p-4 space-y-4 ${ // Chat history container
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        }`}>
          {messages.length === 0 ? (
            <p className="text-center text-gray-500 text-sm mt-10">No messages in {activeChannel}.</p>
          ) : messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.user_id === userId ? 'items-end' : 'items-start'}`}>
              <span className="text-[10px] text-gray-500 mb-1 px-1">
                {msg.user_name} • {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
              </span>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                msg.user_id === userId // Message bubble styling
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : isDark ? 'bg-gray-800 text-gray-100 rounded-tl-none' : 'bg-gray-100 text-gray-900 rounded-tl-none'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={sendMessage} className={`flex gap-2 p-3 border-x border-b rounded-b-xl ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-gray-100 border-gray-200'
        }`}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Message ${activeChannel}...`}
            className={`flex-1 rounded-full px-4 py-2 text-sm border focus:outline-none focus:border-blue-500 ${
              isDark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-300'
            }`}
          />
          <button type="submit" className="w-12 h-12 flex-shrink-0 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform" disabled={!newMessage.trim()}>
            <i className="ri-send-plane-2-fill"></i>
          </button>
        </form>
      </div>
    </div>
  )
}
