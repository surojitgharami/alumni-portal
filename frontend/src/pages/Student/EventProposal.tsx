import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, AlertCircle } from 'lucide-react';
import axios from 'axios';

interface Proposal {
  id: string;
  title: string;
  description: string;
  event_date: string;
  status: string;
}

export default function EventProposal() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string>('');

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/student/events/my-proposals`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setProposals(response.data);
    } catch (err) {
      console.error('Error fetching proposals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !eventDate || !location.trim()) {
      setError('All fields are required');
      return;
    }

    try {
      await axios.post(
        `${BACKEND_URL}/api/student/events/propose`,
        {
          title,
          description,
          event_date: eventDate,
          location
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setTitle('');
      setDescription('');
      setEventDate('');
      setLocation('');
      setShowForm(false);
      fetchProposals();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit proposal');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Propose an Event</h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Proposal
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Event title"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Event description..."
            />
            <input
              type="datetime-local"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Event location"
            />

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-red-700">{error}</p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg"
              >
                Submit Proposal
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Loading proposals...</p>
      ) : (
        <div className="space-y-4">
          {proposals.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No proposals yet</p>
          ) : (
            proposals.map((p) => (
              <div key={p.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900">{p.title}</h3>
                    <p className="text-gray-700 mt-2">{p.description}</p>
                    <div className="mt-3 flex items-center gap-4">
                      <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                        p.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        p.status === 'approved' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                      </span>
                      <p className="text-xs text-gray-500">
                        {new Date(p.event_date).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
