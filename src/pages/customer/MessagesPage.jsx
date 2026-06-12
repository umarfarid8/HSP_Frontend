import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft, Send, MessageSquare, ExternalLink,
  CheckCheck, Check,
} from 'lucide-react'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import StatusBadge from '../../components/common/StatusBadge'
import { useAuth } from '../../hooks/useAuth'
import { usePolling } from '../../hooks/usePolling'
import { messageApi } from '../../api/messageApi'
import { formatDate, getInitials } from '../../utils/formatters'

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const { isCustomer }     = useAuth()
  const [searchParams]     = useSearchParams()
  const initThreadId       = searchParams.get('thread')

  const [threads, setThreads]                   = useState([])
  const [selectedThreadId, setSelectedThreadId] = useState(null)
  const [currentThread, setCurrentThread]       = useState(null)
  const [mobileView, setMobileView]             = useState('list') // 'list' | 'chat'
  const [isLoadingThreads, setIsLoadingThreads] = useState(true)
  const [isLoadingChat, setIsLoadingChat]       = useState(false)
  const [newMessage, setNewMessage]             = useState('')
  const [isSending, setIsSending]               = useState(false)

  const messagesEndRef = useRef(null)
  const textareaRef    = useRef(null)

  // ── Load thread list ───────────────────────────────────────────────────────

  const loadThreads = useCallback(async () => {
    try {
      const { data } = await messageApi.getThreads()
      setThreads(data || [])
    } catch { /* silently retry next poll */ }
    finally { setIsLoadingThreads(false) }
  }, [])

  // Load threads immediately, then refresh every 15 seconds
  usePolling(loadThreads, 15_000)

  // ── Auto-open thread from URL query param ──────────────────────────────────
  // e.g. /messages?thread=xxxx (linked from booking detail page)

  useEffect(() => {
    if (initThreadId && threads.length > 0 && !selectedThreadId) {
      handleSelectThread(initThreadId)
    }
  }, [initThreadId, threads])

  // ── Load and poll selected thread ─────────────────────────────────────────

  const loadThread = useCallback(async () => {
    if (!selectedThreadId) return
    try {
      const { data } = await messageApi.getThread(selectedThreadId)
      setCurrentThread(data)
      // Update the unread count in the thread list
      setThreads((prev) =>
        prev.map((t) =>
          t.threadId === selectedThreadId ? { ...t, unreadCount: 0 } : t
        )
      )
    } catch { /* silently retry */ }
  }, [selectedThreadId])

  // Poll for new messages every 5 seconds — only while a thread is open
  usePolling(loadThread, 5_000, !!selectedThreadId)

  // ── Auto-scroll to latest message ─────────────────────────────────────────

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentThread?.messages?.length])

  // ── Select a thread ────────────────────────────────────────────────────────

  const handleSelectThread = (threadId) => {
    setSelectedThreadId(threadId)
    setCurrentThread(null)
    setIsLoadingChat(true)
    setMobileView('chat')
    messageApi.getThread(threadId)
      .then(({ data }) => {
        setCurrentThread(data)
        setThreads((prev) =>
          prev.map((t) => t.threadId === threadId ? { ...t, unreadCount: 0 } : t)
        )
      })
      .catch(() => {})
      .finally(() => setIsLoadingChat(false))
  }

  // ── Send a message ─────────────────────────────────────────────────────────

  const handleSend = async () => {
    const content = newMessage.trim()
    if (!content || !selectedThreadId || isSending) return

    setIsSending(true)
    setNewMessage('')

    try {
      await messageApi.sendMessage(selectedThreadId, { content })
      // Reload thread immediately to show new message
      const { data } = await messageApi.getThread(selectedThreadId)
      setCurrentThread(data)
    } catch {
      setNewMessage(content) // Restore on failure
    } finally {
      setIsSending(false)
      textareaRef.current?.focus()
    }
  }

  const handleKeyDown = (e) => {
    // Ctrl+Enter or Cmd+Enter to send
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSend()
    }
  }

  const handleBack = () => {
    setMobileView('list')
    setSelectedThreadId(null)
    setCurrentThread(null)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      {/* Fixed-height container so chat fills the screen */}
      <div className="flex h-[calc(100vh-7rem)] bg-white rounded-2xl
                      border border-slate-200 overflow-hidden shadow-sm">

        {/* ── Thread List (left panel) ──────────────────────────── */}
        <div className={`
          w-full lg:w-80 lg:flex-shrink-0 flex flex-col
          border-r border-slate-100
          ${mobileView === 'chat' ? 'hidden lg:flex' : 'flex'}
        `}>
          {/* List header */}
          <div className="px-4 py-4 border-b border-slate-100">
            <h1 className="font-bold text-slate-900 text-lg">Messages</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {threads.reduce((sum, t) => sum + t.unreadCount, 0) > 0
                ? `${threads.reduce((s, t) => s + t.unreadCount, 0)} unread`
                : 'All caught up'}
            </p>
          </div>

          {/* Thread list body */}
          <div className="flex-1 overflow-y-auto">
            {isLoadingThreads ? (
              <div className="flex justify-center items-center h-32">
                <LoadingSpinner size="sm" />
              </div>
            ) : threads.length === 0 ? (
              <EmptyThreadList isCustomer={isCustomer} />
            ) : (
              threads.map((thread) => (
                <ThreadItem
                  key={thread.threadId}
                  thread={thread}
                  isActive={thread.threadId === selectedThreadId}
                  onClick={() => handleSelectThread(thread.threadId)}
                />
              ))
            )}
          </div>
        </div>

        {/* ── Chat View (right panel) ───────────────────────────── */}
        <div className={`
          flex-1 flex flex-col min-w-0
          ${mobileView === 'list' ? 'hidden lg:flex' : 'flex'}
        `}>
          {selectedThreadId && currentThread ? (
            <>
              {/* Chat header */}
              <ChatHeader
                thread={currentThread}
                onBack={handleBack}
                isCustomer={isCustomer}
              />

              {/* Messages area */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
                {isLoadingChat ? (
                  <div className="flex justify-center items-center h-full">
                    <LoadingSpinner text="Loading messages..." />
                  </div>
                ) : currentThread.messages?.length === 0 ? (
                  <EmptyChat name={currentThread.otherPartyName} />
                ) : (
                  <MessageList
                    messages={currentThread.messages}
                    messagesEndRef={messagesEndRef}
                  />
                )}
              </div>

              {/* Input area */}
              <ChatInput
                value={newMessage}
                onChange={setNewMessage}
                onSend={handleSend}
                onKeyDown={handleKeyDown}
                isSending={isSending}
                textareaRef={textareaRef}
                disabled={currentThread.bookingStatus === 'Cancelled'}
              />
            </>
          ) : (
            <NoChatSelected />
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// THREAD LIST ITEM
// ─────────────────────────────────────────────────────────────────────────────

function ThreadItem({ thread, isActive, onClick }) {
  const time = thread.lastMessageAt
    ? formatRelativeTime(thread.lastMessageAt)
    : ''

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-start gap-3 px-4 py-3.5 hover:bg-slate-50
                 transition-colors text-left border-b border-slate-50
                 ${isActive ? 'bg-primary-light border-l-2 border-l-primary' : ''}`}
    >
      {/* Avatar */}
      <div className={`w-10 h-10 rounded-full flex items-center justify-center
                       text-sm font-bold flex-shrink-0
                       ${isActive ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'}`}>
        {getInitials(thread.otherPartyName)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <p className={`text-sm truncate
            ${thread.unreadCount > 0 ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
            {thread.otherPartyName}
          </p>
          <span className="text-[10px] text-slate-400 flex-shrink-0">{time}</span>
        </div>

        <p className="text-xs text-slate-500 truncate mt-0.5">{thread.serviceCategory}</p>

        <div className="flex items-center justify-between mt-1">
          <p className={`text-xs truncate flex-1 mr-2
            ${thread.unreadCount > 0 ? 'font-medium text-slate-800' : 'text-slate-400'}`}>
            {thread.lastMessageContent || 'No messages yet'}
          </p>
          {thread.unreadCount > 0 && (
            <span className="flex-shrink-0 w-4 h-4 bg-primary rounded-full text-white
                             text-[10px] font-bold flex items-center justify-center">
              {thread.unreadCount > 9 ? '9+' : thread.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CHAT HEADER
// ─────────────────────────────────────────────────────────────────────────────

function ChatHeader({ thread, onBack, isCustomer }) {
  const navigate = useNavigate()

  const bookingPath = isCustomer
    ? `/customer/bookings/${thread.bookingId}`
    : `/provider/jobs/${thread.bookingId}`

  return (
    <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
      {/* Back button — mobile only */}
      <button
        onClick={onBack}
        className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
      >
        <ArrowLeft size={18} />
      </button>

      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-primary-light flex items-center
                      justify-center text-primary font-bold text-sm flex-shrink-0">
        {getInitials(thread.otherPartyName)}
      </div>

      {/* Name + booking info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 text-sm truncate">
          {thread.otherPartyName}
        </p>
        <p className="text-xs text-slate-400 truncate">
          {thread.serviceCategory} · {formatDate(thread.scheduledDate)}
        </p>
      </div>

      {/* Status badge + booking link */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <StatusBadge status={thread.bookingStatus} />
        <button
          onClick={() => navigate(bookingPath)}
          title="View booking"
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400
                     hover:text-primary transition-colors"
        >
          <ExternalLink size={15} />
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGE LIST
// ─────────────────────────────────────────────────────────────────────────────

function MessageList({ messages, messagesEndRef }) {
  // Group messages by date to insert date separators
  const grouped = groupMessagesByDate(messages)

  return (
    <>
      {grouped.map(({ dateLabel, msgs }) => (
        <div key={dateLabel}>
          {/* Date separator */}
          <div className="flex items-center gap-3 my-4">
            <hr className="flex-1 border-slate-100" />
            <span className="text-[10px] text-slate-400 font-medium px-2
                             bg-white whitespace-nowrap">
              {dateLabel}
            </span>
            <hr className="flex-1 border-slate-100" />
          </div>

          {/* Messages for this date */}
          <div className="space-y-1">
            {msgs.map((msg, idx) => {
              const prevMsg  = idx > 0 ? msgs[idx - 1] : null
              const isNewSender = !prevMsg || prevMsg.senderName !== msg.senderName
              return (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  showSenderName={isNewSender && !msg.isMine}
                />
              )
            })}
          </div>
        </div>
      ))}
      {/* Invisible element at the bottom — scrolled into view on new messages */}
      <div ref={messagesEndRef} />
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGE BUBBLE
// ─────────────────────────────────────────────────────────────────────────────

function MessageBubble({ message, showSenderName }) {
  const time = new Date(message.sentAt).toLocaleTimeString('en-PK', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  })

  if (message.isMine) {
    return (
      <div className="flex flex-col items-end">
        <div className="max-w-[70%] sm:max-w-[60%]">
          <div className="bg-primary text-white rounded-2xl rounded-tr-sm
                          px-4 py-2.5 shadow-sm">
            <p className="text-sm leading-relaxed break-words">{message.content}</p>
          </div>
          <div className="flex items-center justify-end gap-1 mt-1 mr-1">
            <span className="text-[10px] text-slate-400">{time}</span>
            {/* Read receipt */}
            {message.isRead
              ? <CheckCheck size={13} className="text-primary" />
              : <Check      size={13} className="text-slate-300" />}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-start">
      <div className="max-w-[70%] sm:max-w-[60%]">
        {showSenderName && (
          <p className="text-[10px] font-semibold text-slate-500 mb-1 ml-1">
            {message.senderName}
          </p>
        )}
        <div className="bg-slate-100 text-slate-800 rounded-2xl rounded-tl-sm
                        px-4 py-2.5 shadow-sm">
          <p className="text-sm leading-relaxed break-words">{message.content}</p>
        </div>
        <span className="text-[10px] text-slate-400 mt-1 ml-1">{time}</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CHAT INPUT
// ─────────────────────────────────────────────────────────────────────────────

function ChatInput({ value, onChange, onSend, onKeyDown,
                     isSending, textareaRef, disabled }) {
  // Auto-grow the textarea up to 5 lines
  const handleInput = (e) => {
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
    onChange(e.target.value)
  }

  if (disabled) {
    return (
      <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
        <p className="text-sm text-slate-400 text-center">
          This booking is cancelled — chat is disabled
        </p>
      </div>
    )
  }

  return (
    <div className="px-4 py-3 border-t border-slate-100 bg-white">
      <div className="flex items-end gap-2">
        <div className="flex-1 bg-slate-100 rounded-2xl px-4 py-2.5 min-h-[42px]">
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onInput={handleInput}
            onKeyDown={onKeyDown}
            placeholder="Type a message… (Ctrl+Enter to send)"
            className="w-full bg-transparent text-sm text-slate-800 resize-none
                       outline-none placeholder:text-slate-400 max-h-[120px]
                       leading-relaxed"
          />
        </div>

        <button
          onClick={onSend}
          disabled={!value.trim() || isSending}
          className="flex-shrink-0 w-10 h-10 bg-primary rounded-full
                     flex items-center justify-center text-white
                     hover:bg-primary-dark transition-colors
                     disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSending
            ? <LoadingSpinner size="sm" />
            : <Send size={17} className="ml-0.5" />}
        </button>
      </div>
      <p className="text-[10px] text-slate-300 mt-1 text-right">
        Ctrl+Enter to send
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY STATES
// ─────────────────────────────────────────────────────────────────────────────

function NoChatSelected() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center
                    text-slate-300 gap-3 p-8">
      <MessageSquare size={48} strokeWidth={1} />
      <div className="text-center">
        <p className="font-semibold text-slate-400">Select a conversation</p>
        <p className="text-sm text-slate-300 mt-1">
          Choose a thread from the left to start chatting
        </p>
      </div>
    </div>
  )
}

function EmptyChat({ name }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-full bg-primary-light flex items-center
                      justify-center text-primary text-lg font-bold mb-4">
        {getInitials(name)}
      </div>
      <p className="font-semibold text-slate-700">Start the conversation</p>
      <p className="text-sm text-slate-400 mt-1">
        Send a message to {name} about the job
      </p>
    </div>
  )
}

function EmptyThreadList({ isCustomer }) {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <MessageSquare size={36} className="text-slate-200 mb-3" />
      <p className="font-semibold text-slate-500">No conversations yet</p>
      <p className="text-xs text-slate-400 mt-1">
        {isCustomer
          ? 'Messages appear when you make a booking'
          : 'Messages appear when customers book you'}
      </p>
      {isCustomer && (
        <button
          onClick={() => navigate('/customer/match')}
          className="mt-4 text-sm text-primary font-medium hover:underline"
        >
          Find a provider →
        </button>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

// Groups an array of messages by their calendar date
function groupMessagesByDate(messages) {
  const groups = {}
  for (const msg of messages) {
    const label = getDateLabel(msg.sentAt)
    if (!groups[label]) groups[label] = []
    groups[label].push(msg)
  }
  return Object.entries(groups).map(([dateLabel, msgs]) => ({ dateLabel, msgs }))
}

// Returns "Today", "Yesterday", or a formatted date string
function getDateLabel(dateStr) {
  const date      = new Date(dateStr)
  const today     = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  if (date.toDateString() === today.toDateString())     return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString('en-PK', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

// Returns relative time string: "just now", "5m ago", "2h ago", "3 days ago"
function formatRelativeTime(dateStr) {
  const diffMs  = Date.now() - new Date(dateStr).getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  const diffHr  = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffMin < 1)  return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr  < 24) return `${diffHr}h ago`
  if (diffDay < 7)  return `${diffDay}d ago`
  return new Date(dateStr).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })
}