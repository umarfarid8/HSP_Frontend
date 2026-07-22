import { useState, useEffect } from 'react'
import { adminApi } from '../../api/adminApi'
import toast from 'react-hot-toast'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import { Plus, ToggleLeft, ToggleRight, Edit2 } from 'lucide-react'

export default function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ name: '', description: '', iconUrl: '', isActive: true })

  const fetchCategories = async () => {
    try {
      const { data } = await adminApi.getCategories()
      setCategories(data || [])
    } catch (err) {
      toast.error('Failed to load categories.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (editingId) {
        await adminApi.updateCategory(editingId, form)
        toast.success('Category updated successfully!')
      } else {
        await adminApi.createCategory(form)
        toast.success('Category created successfully!')
      }
      setForm({ name: '', description: '', iconUrl: '', isActive: true })
      setEditingId(null)
      fetchCategories()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (cat) => {
    setEditingId(cat.id)
    setForm({
      name: cat.name,
      description: cat.description,
      iconUrl: cat.iconUrl || '',
      isActive: cat.isActive
    })
  }

  const handleToggle = async (id) => {
    try {
      await adminApi.toggleCategory(id)
      toast.success('Category status updated.')
      fetchCategories()
    } catch {
      toast.error('Failed to toggle status.')
    }
  }

  return (
    <DashboardLayout>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Service Categories</h1>
          <p className="text-sm text-slate-500">Manage platform service offerings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Form */}
        <div className="card h-fit bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            {editingId ? 'Edit Category' : 'Add New Category'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="input-field"
                placeholder="e.g. Plumbing"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="input-field resize-none"
                placeholder="Brief summary..."
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-2 flex justify-center"
            >
              {isSubmitting ? <LoadingSpinner size="sm" /> : editingId ? 'Update Category' : 'Create Category'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => { setEditingId(null); setForm({ name: '', description: '', iconUrl: '', isActive: true }); }}
                className="w-full text-xs text-slate-500 hover:underline text-center mt-2"
              >
                Cancel Edit
              </button>
            )}
          </form>
        </div>

        {/* Categories Table */}
        <div className="lg:col-span-2 card bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Categories List</h2>
          {isLoading ? (
            <div className="flex justify-center py-8"><LoadingSpinner size="lg" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead>
                  <tr className="text-left text-xs font-semibold text-slate-500 uppercase">
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Providers</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-slate-50">
                      <td className="py-3 font-medium text-slate-900">{cat.name}</td>
                      <td className="py-3 text-slate-500">{cat.providerCount || 0}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cat.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                          {cat.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 text-right space-x-2">
                        <button onClick={() => handleEdit(cat)} className="p-1 text-slate-500 hover:text-primary">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleToggle(cat.id)} className="p-1 text-slate-500 hover:text-primary">
                          {cat.isActive ? <ToggleRight size={20} className="text-green-600" /> : <ToggleLeft size={20} />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}