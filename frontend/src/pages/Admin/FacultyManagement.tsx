import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, X, Loader2, Check } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import Card from '../../components/Card';
import api from '../../services/api';

interface Faculty {
  id: string;
  name: string;
  email: string;
  department: string;
  phone: string;
  registration_number: string;
  created_at: string;
}

interface EditingFaculty {
  id: string;
  name: string;
  email: string;
  department: string;
  phone: string;
  registration_number: string;
}

export default function FacultyManagement() {
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditingFaculty | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const departments = [
    'Computer Science',
    'Electronics',
    'Mechanical',
    'Civil',
    'Electrical',
    'Chemical',
    'Aerospace',
    'Biomedical',
    'Information Technology',
    'Business Administration'
  ];

  useEffect(() => {
    fetchFaculty();
  }, []);

  const fetchFaculty = async () => {
    try {
      setError('');
      const response = await api.get('/api/admin/faculty/list');
      setFaculty(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch faculty');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (fac: Faculty) => {
    setEditingId(fac.id);
    setEditForm({
      id: fac.id,
      name: fac.name,
      email: fac.email,
      department: fac.department,
      phone: fac.phone,
      registration_number: fac.registration_number
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm) return;

    setActionLoading(`edit-${editForm.id}`);
    setError('');
    setSuccess('');

    try {
      // Validate form
      if (!editForm.name || !editForm.email || !editForm.department || !editForm.phone || !editForm.registration_number) {
        throw new Error('All fields are required');
      }

      // Make API call to update faculty
      await api.put(`/api/admin/faculty/${editForm.id}`, {
        name: editForm.name,
        email: editForm.email,
        department: editForm.department,
        phone: editForm.phone,
        registration_number: editForm.registration_number
      });

      setSuccess('Faculty updated successfully');
      setEditingId(null);
      setEditForm(null);
      await fetchFaculty();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to update faculty';
      setError(errorMsg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      return;
    }

    setActionLoading(`delete-${id}`);
    setError('');
    setSuccess('');

    try {
      await api.delete(`/api/admin/faculty/${id}`);
      setSuccess('Faculty deleted successfully');
      await fetchFaculty();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete faculty');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Faculty Management</h1>
          <p className="text-gray-600">Manage faculty members, edit their details, or remove them from the system</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm flex items-start gap-2">
            <span className="font-semibold">Error:</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 text-green-800 text-sm flex items-center gap-2">
            <Check className="w-5 h-5 flex-shrink-0" />
            {success}
          </div>
        )}

        <Card>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-gray-600">Loading faculty...</span>
            </div>
          ) : faculty.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-2">No faculty members found</p>
              <p className="text-sm text-gray-400">Use "Add Faculty" from the sidebar to create faculty accounts</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Registration #</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Department</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Phone</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {faculty.map((fac) => (
                    <React.Fragment key={fac.id}>
                      <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-gray-900 font-medium">{fac.name}</td>
                        <td className="px-6 py-4 text-gray-600">{fac.email}</td>
                        <td className="px-6 py-4 text-gray-600 font-mono text-sm">{fac.registration_number}</td>
                        <td className="px-6 py-4 text-gray-600">{fac.department}</td>
                        <td className="px-6 py-4 text-gray-600">{fac.phone}</td>
                        <td className="px-6 py-4 text-right flex gap-2 justify-end items-center">
                          <button
                            onClick={() => handleEdit(fac)}
                            disabled={actionLoading !== null}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(fac.id, fac.name)}
                            disabled={actionLoading !== null}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>

                      {/* Edit Form Row */}
                      {editingId === fac.id && editForm && (
                        <tr className="bg-blue-50 border-b-2 border-blue-200">
                          <td colSpan={5} className="px-6 py-4">
                            <form onSubmit={handleSaveEdit} className="space-y-4">
                              <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">Edit Faculty Details</h3>
                                <button
                                  type="button"
                                  onClick={handleCancelEdit}
                                  disabled={actionLoading !== null}
                                  className="p-1 text-gray-500 hover:text-gray-700"
                                >
                                  <X className="w-5 h-5" />
                                </button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Name
                                  </label>
                                  <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    required
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                  </label>
                                  <input
                                    type="email"
                                    value={editForm.email}
                                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    required
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Registration #
                                  </label>
                                  <input
                                    type="text"
                                    value={editForm.registration_number}
                                    onChange={(e) => setEditForm({ ...editForm, registration_number: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    required
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Department
                                  </label>
                                  <select
                                    value={editForm.department}
                                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    required
                                  >
                                    <option value="">Select</option>
                                    {departments.map(dept => (
                                      <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone
                                  </label>
                                  <input
                                    type="tel"
                                    value={editForm.phone}
                                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    required
                                  />
                                </div>

                                <div className="flex gap-2 items-end">
                                  <button
                                    type="submit"
                                    disabled={actionLoading !== null}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
                                  >
                                    {actionLoading === `edit-${editForm.id}` ? (
                                      <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Saving
                                      </>
                                    ) : (
                                      'Save'
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleCancelEdit}
                                    disabled={actionLoading !== null}
                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </form>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}
