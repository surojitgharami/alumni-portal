import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, Clock, XCircle, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Application {
  id: string;
  job_id: string;
  applied_at: string;
  cover_letter?: string;
  status: 'applied' | 'shortlisted' | 'selected' | 'rejected';
}

export default function MyApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/applications/my-applications`,
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
      );
      const data = await response.json();
      setApplications(data);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
    setLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'selected':
        return <Star className="text-green-500" size={20} />;
      case 'shortlisted':
        return <CheckCircle className="text-blue-500" size={20} />;
      case 'rejected':
        return <XCircle className="text-red-500" size={20} />;
      default:
        return <Clock className="text-yellow-500" size={20} />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      applied: 'bg-yellow-100 text-yellow-800',
      shortlisted: 'bg-blue-100 text-blue-800',
      selected: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || colors.applied;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-[#0F4C81] hover:underline mb-6"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back
        </button>

        <h1 className="text-4xl font-bold text-gray-900 mb-8">My Job Applications</h1>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : applications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 text-lg">No applications yet</p>
            <button
              onClick={() => navigate('/jobs')}
              className="mt-4 bg-[#0F4C81] text-white px-6 py-2 rounded-lg hover:bg-blue-900"
            >
              Browse Jobs
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div key={app.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">{app.job_id}</h3>
                    <p className="text-gray-600 text-sm mt-1">Applied on {new Date(app.applied_at).toLocaleDateString()}</p>
                    {app.cover_letter && (
                      <p className="text-gray-700 mt-3 text-sm">{app.cover_letter.substring(0, 150)}...</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    {getStatusIcon(app.status)}
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(app.status)}`}>
                      {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
