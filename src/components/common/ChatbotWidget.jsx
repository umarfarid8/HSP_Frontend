import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Bot } from 'lucide-react'
import LoadingSpinner from './LoadingSpinner'
import { chatbotApi } from '../../api/chatbotApi'

const QUICK_QUESTIONS = [
  'How do I book a service?',
  'How does payment work?',
  'How do I track my booking?',
  'What services are available?',
]

export default function ChatbotWidget() {
  const [isOpen, setIsOpen]       = useState(false)
  const [messages, setMessages]   = useState([
    {
      role: 'assistant',
      content: 'Assalam o Alaikum! I\'m the HSP Assistant 👋\n\nI can help you with bookings, payments, account questions, and more. What can I help you with today?',
    },
  ])
  const [input, setInput]         = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError]   = useState(false)

  const messagesEndRef = useRef(null)
  const inputRef       = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100)
  }, [isOpen])

  const sendMessage = async (text) => {
    const content = (text || input).trim()
    if (!content || isLoading) return

    const userMsg  = { role: 'user', content }
    const updated  = [...messages, userMsg]

    setMessages(updated)
    setInput('')
    setIsLoading(true)
    setHasError(false)

    try {
      const { data } = await chatbotApi.sendMessage(
        updated.map(({ role, content }) => ({ role, content }))
      )
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
    } catch {
      setHasError(true)
      setMessages((prev) => [...prev, {
        role:    'assistant',
        content: 'Sorry, I\'m having trouble connecting. Please try again.',
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full
                   shadow-lg hover:bg-primary-dark transition-all duration-200 z-50
                   flex items-center justify-center hover:scale-105"
        aria-label="Open assistant"
      >
        {isOpen
          ? <X size={22} />
          : (
            <>
              <MessageCircle size={22} />
              {/* Pulse ring */}
              <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20" />
            </>
          )}
      </button>

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl
                        border border-slate-200 flex flex-col z-50 overflow-hidden
                        max-h-[520px]">

          {/* Header */}
          <div className="bg-primary px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Bot size={18} className="text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">HSP Assistant</p>
              <p className="text-white/70 text-xs">Powered by AI · Always available</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="ml-auto text-white/70 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-slate-50">
            {messages.map((msg, i) => (
              <ChatBubble key={i} message={msg} />
            ))}

            {isLoading && (
              <div className="flex gap-2 items-end">
                <div className="w-7 h-7 rounded-full bg-primary-light flex items-center
                                justify-center flex-shrink-0">
                  <Bot size={14} className="text-primary" />
                </div>
                <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"
                      style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"
                      style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"
                      style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick questions — only shown at start */}
          {messages.length === 1 && (
            <div className="px-4 py-2 bg-white border-t border-slate-100">
              <p className="text-[10px] text-slate-400 font-medium mb-2 uppercase tracking-wide">
                Quick questions
              </p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="text-xs bg-primary-light text-primary px-2.5 py-1
                               rounded-full hover:bg-primary hover:text-white transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="px-3 py-3 border-t border-slate-100 bg-white flex items-end gap-2">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything…"
              className="flex-1 bg-slate-100 rounded-xl px-3 py-2.5 text-sm text-slate-800
                         outline-none resize-none placeholder:text-slate-400 max-h-24
                         leading-relaxed"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              className="w-9 h-9 bg-primary rounded-full flex items-center justify-center
                         text-white hover:bg-primary-dark transition-colors
                         disabled:opacity-40 flex-shrink-0"
            >
              <Send size={15} className="ml-0.5" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}

function ChatBubble({ message }) {
  const isUser = message.role === 'user'
  return (
    <div className={`flex gap-2 items-end ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-primary-light flex items-center
                        justify-center flex-shrink-0">
          <Bot size={13} className="text-primary" />
        </div>
      )}

      {/* Bubble */}
      <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed
        shadow-sm whitespace-pre-wrap
        ${isUser
          ? 'bg-primary text-white rounded-br-sm'
          : 'bg-white text-slate-800 rounded-bl-sm'}`}>
        {message.content}
      </div>
    </div>
  )
}