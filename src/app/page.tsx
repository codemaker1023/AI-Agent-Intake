'use client'

import { useState, useEffect } from 'react'

interface Bot {
  id: string
  uid: string
  name: string
  prompt: string
  domain: string
  is_active: boolean
  created_at: string
}

interface CallLog {
  id: string
  call_sid: string
  transcript: string
  summary: string
  duration: number
  status: string
  created_at: string
  bots?: {
    name: string
    uid: string
  }
  patients?: {
    name: string
    medical_id: string
  }
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'bots' | 'logs'>('bots')
  const [bots, setBots] = useState<Bot[]>([])
  const [callLogs, setCallLogs] = useState<CallLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingBot, setEditingBot] = useState<Bot | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    uid: '',
    name: '',
    prompt: '',
    domain: 'medical'
  })

  useEffect(() => {
    fetchBots()
    fetchCallLogs()
  }, [])

  const fetchBots = async () => {
    try {
      const response = await fetch('/api/bots')
      const data = await response.json()
      if (response.ok) {
        setBots(data)
        setError(null)
      } else {
        setError(data.error || 'Failed to fetch bots')
      }
    } catch (error) {
      console.error('Error fetching bots:', error)
      setError('Network error: Failed to connect to server')
    }
  }

  const fetchCallLogs = async () => {
    try {
      const response = await fetch('/api/call-logs')
      const data = await response.json()
      if (response.ok) {
        setCallLogs(data)
        setError(null)
      } else {
        setError(data.error || 'Failed to fetch call logs')
      }
    } catch (error) {
      console.error('Error fetching call logs:', error)
      setError('Network error: Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const url = editingBot ? `/api/bots/${editingBot.id}` : '/api/bots'
      const method = editingBot ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        await fetchBots()
        setShowCreateForm(false)
        setEditingBot(null)
        setFormData({ uid: '', name: '', prompt: '', domain: 'medical' })
        setError(null)
      } else {
        setError(data.error || 'Failed to save bot')
      }
    } catch (error) {
      console.error('Error saving bot:', error)
      setError('Network error: Failed to save bot')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (bot: Bot) => {
    setEditingBot(bot)
    setFormData({
      uid: bot.uid,
      name: bot.name,
      prompt: bot.prompt,
      domain: bot.domain
    })
    setShowCreateForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bot?')) return

    try {
      const response = await fetch(`/api/bots/${id}`, { method: 'DELETE' })
      if (response.ok) {
        await fetchBots()
      }
    } catch (error) {
      console.error('Error deleting bot:', error)
    }
  }

  const resetForm = () => {
    setShowCreateForm(false)
    setEditingBot(null)
    setFormData({ uid: '', name: '', prompt: '', domain: 'medical' })
  }

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Minimal Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">AI Intake Agent</h1>
                <p className="text-xs text-gray-500">Medical Intelligence</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-xs text-gray-600">Live</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Minimal Error */}
        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-red-800">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700 ml-4"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Minimal Navigation */}
        <div className="mb-12">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('bots')}
              className={`px-6 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'bots'
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Assistants
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-6 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'logs'
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Analytics
            </button>
          </div>
        </div>

        {activeTab === 'bots' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Assistants</h2>
                <p className="text-gray-600">Manage your AI medical assistants</p>
              </div>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
              >
                {showCreateForm ? 'Cancel' : '+ New Assistant'}
              </button>
            </div>

            {showCreateForm && (
              <div className="bg-gray-50 rounded-lg p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        Assistant ID *
                      </label>
                      <input
                        type="text"
                        value={formData.uid}
                        onChange={(e) => setFormData({ ...formData, uid: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                        placeholder="med-assistant-001"
                        required
                        disabled={submitting}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        Assistant Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                        placeholder="Medical Intake Assistant"
                        required
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">Domain</label>
                    <select
                      value={formData.domain}
                      onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                      disabled={submitting}
                    >
                      <option value="medical">Medical</option>
                      <option value="legal">Legal</option>
                      <option value="receptionist">Receptionist</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      System Prompt *
                    </label>
                    <textarea
                      value={formData.prompt}
                      onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-900 focus:border-gray-900 resize-none"
                      rows={4}
                      placeholder="Instructions for the AI assistant..."
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 disabled:opacity-50"
                    >
                      {submitting ? 'Saving...' : editingBot ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div>
              {bots.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-gray-400 text-6xl mb-4">🤖</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No assistants yet</h3>
                  <p className="text-gray-500 mb-6">Create your first AI assistant to get started</p>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800"
                  >
                    Create Assistant
                  </button>
                </div>
              ) : (
                <div>
                  {/* Header Row */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-2">
                    <div className="flex items-center">
                      <div className="w-10 h-10"></div>
                      <div className="flex-1 text-xs font-medium text-gray-500 uppercase tracking-wider ml-4">
                        Name
                      </div>
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                        UID
                      </div>
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                        Domain
                      </div>
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                        Status
                      </div>
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                        Created
                      </div>
                      <div className="w-20"></div>
                    </div>
                  </div>

                  {/* Data Rows */}
                  <div className="space-y-2">
                    {bots.map((bot) => (
                      <div key={bot.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 flex-1">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900">{bot.name}</h3>
                            </div>
                            <div className="text-sm text-gray-500 font-mono w-32 truncate">
                              {bot.uid}
                            </div>
                            <div className="text-sm text-gray-600 capitalize w-24">
                              {bot.domain}
                            </div>
                            <div className="text-sm w-20">
                              <span className={`px-2 py-1 rounded-full ${
                                bot.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {bot.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500 w-24">
                              {new Date(bot.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={() => handleEdit(bot)}
                              className="text-gray-400 hover:text-gray-600 p-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(bot.id)}
                              className="text-gray-400 hover:text-red-600 p-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Call History</h2>
                <p className="text-gray-600">Recent conversations and outcomes</p>
              </div>
              <button
                onClick={fetchCallLogs}
                className="text-gray-600 hover:text-gray-900 p-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>

            {callLogs.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-gray-400 text-6xl mb-4">📞</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No calls yet</h3>
                <p className="text-gray-500">Call logs will appear here after conversations</p>
              </div>
            ) : (
              <div>
                {/* Header Row */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-2">
                  <div className="flex items-center">
                    <div className="w-10 h-10"></div>
                    <div className="flex-1 text-xs font-medium text-gray-500 uppercase tracking-wider ml-4">
                      Patient
                    </div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Assistant
                    </div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                      Date & Time
                    </div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                      Duration
                    </div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      Status
                    </div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider flex-1">
                      Summary
                    </div>
                  </div>
                </div>

                {/* Data Rows */}
                <div className="space-y-2">
                  {callLogs.map((log) => (
                    <div key={log.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{log.patients?.name || 'Unknown Patient'}</h3>
                          </div>
                          <div className="text-sm text-gray-600 w-32 truncate">
                            {log.bots?.name || 'Unknown Assistant'}
                          </div>
                          <div className="text-sm text-gray-500 w-40">
                            {new Date(log.created_at).toLocaleDateString()} {new Date(log.created_at).toLocaleTimeString()}
                          </div>
                          <div className="text-sm text-gray-600 w-20">
                            {log.duration ? `${Math.floor(log.duration / 60)}:${(log.duration % 60).toString().padStart(2, '0')}` : 'N/A'}
                          </div>
                          <div className="text-sm w-24">
                            <span className={`px-2 py-1 rounded-full ${
                              log.status === 'completed' ? 'bg-green-100 text-green-800' :
                              log.status === 'failed' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {log.status || 'Unknown'}
                            </span>
                          </div>
                          <div className="text-sm text-gray-700 max-w-xs truncate flex-1">
                            {log.summary || log.transcript?.substring(0, 50) + '...' || 'No summary'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
