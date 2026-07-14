import { useState } from 'react'
import { PlusCircle, Info, Sparkles } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

export default function ManageCategories({ onCategoryAdded }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (name.trim().length < 2) {
      toast.error('Category name must be at least 2 characters.')
      return
    }
    if (description.trim().length < 5) {
      toast.error('Description must be at least 5 characters.')
      return
    }

    setIsSubmitting(true)
    try {
      await api.post('/admin/categories', { name, description })
      toast.success('Category registered successfully!')
      
      // Reset form
      setName('')
      setDescription('')
      
      // Optional callback to refresh categories list on parent layouts
      if (onCategoryAdded) onCategoryAdded()
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to register category.'
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm max-w-lg">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={20} className="text-primary" />
        <h2 className="text-lg font-bold text-slate-900">Add New Service Category</h2>
      </div>
      <p className="text-slate-500 text-xs mb-6">
        Registering a new category dynamically adds it to the list of categories used by the AI classifier.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Category Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Appliance Repair"
            className="input-field"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Category Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Describe the type of repairs and maintenance services covered in this category..."
            className="input-field resize-none"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <PlusCircle size={17} />
          <span>{isSubmitting ? 'Creating Category...' : 'Register Category'}</span>
        </button>
      </form>
    </div>
  )
}