import { useState, useEffect } from 'react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import LoadingSpinner from '../../components/common/LoadingSpinner'

export default function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newCategory, setNewCategory] = useState({ name: '', description: '' })

  // 1. Fetch categories from ASP.NET API
  const fetchCategories = async () => {
    setIsLoading(true)
    try {
      const { data } = await api.get('/servicecategories') // adjust route if needed
      setCategories(data)
    } catch (err) {
      toast.error('Failed to load service categories.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  // 2. Handle form text inputs
  const handleChange = (e) => {
    setNewCategory({ ...newCategory, [e.target.name]: e.target.value })
  }

  // 3. Post new category to the database
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await api.post('/admin/servicecategories', newCategory) // adjust route to your backend endpoint
      toast.success('Service category added successfully!')
      setNewCategory({ name: '', description: '' }) // Reset form
      fetchCategories() // Refresh list
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add category.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Service Categories</h1>
          <p className="text-sm text-slate-500">Manage your system service sectors</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Add Category Form */}
        <div className="card h-fit bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Add New Category</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category Name</label>
              <input
                type="text"
                name="name"
                value={newCategory.name}
                onChange={handleChange}
                required
                placeholder="e.g. Plumbing"
                className="input-field w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea
                name="description"
                value={newCategory.description}
                onChange={handleChange}
                required
                rows={4}
                placeholder="Brief summary of services included..."
                className="input-field w-full px-3 py-2 border rounded-lg resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition"
            >
              {isSubmitting ? <LoadingSpinner size="sm" /> : 'Add Category'}
            </button>
          </form>
        </div>

        {/* Right Side: Existing Categories List */}
        <div className="lg:col-span-2 card bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Existing Categories</h2>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <LoadingSpinner size="lg" />
            </div>
          ) : categories.length === 0 ? (
            <p className="text-slate-500 text-center py-10">No categories found in database.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-semibold text-slate-900">{cat.name}</td>
                      <td className="px-6 py-4 text-slate-500">{cat.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}