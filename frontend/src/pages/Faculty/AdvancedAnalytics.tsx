import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, FileText } from 'lucide-react';
import axios from 'axios';

interface AnalyticsData {
  total_events?: number;
  total_registrations?: number;
  total_jobs?: number;
  total_applications?: number;
  total_newsletters?: number;
  total_achievements?: number;
  active_students?: number;
  active_alumni?: number;
}

export default function AdvancedAnalytics() {
  const [data, setData] = useState<AnalyticsData>({});
  const [loading, setLoading] = useState(true);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [events, jobs, newsletters, achievements, engagement] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/faculty/analytics/events`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get(`${BACKEND_URL}/api/faculty/analytics/jobs`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get(`${BACKEND_URL}/api/faculty/analytics/newsletters`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get(`${BACKEND_URL}/api/faculty/analytics/achievements`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get(`${BACKEND_URL}/api/faculty/analytics/engagement`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      setData({
        total_events: events.data.total_events,
        total_registrations: events.data.total_registrations,
        total_jobs: jobs.data.total_jobs,
        total_applications: jobs.data.total_applications,
        total_newsletters: newsletters.data.total_newsletters,
        total_achievements: achievements.data.total_achievements,
        active_students: engagement.data.active_students,
        active_alumni: engagement.data.active_alumni
      });
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, label, value }: any) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value || 0}</p>
        </div>
        <Icon className="w-12 h-12 text-blue-200" />
      </div>
    </div>
  );

  if (loading) {
    return <p className="text-gray-500">Loading analytics...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Department Analytics</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FileText} label="Total Events" value={data.total_events} />
        <StatCard icon={TrendingUp} label="Event Registrations" value={data.total_registrations} />
        <StatCard icon={FileText} label="Job Postings" value={data.total_jobs} />
        <StatCard icon={TrendingUp} label="Job Applications" value={data.total_applications} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard icon={FileText} label="Newsletters Published" value={data.total_newsletters} />
        <StatCard icon={TrendingUp} label="Achievements" value={data.total_achievements} />
        <StatCard icon={Users} label="Active Students" value={data.active_students} />
        <StatCard icon={Users} label="Active Alumni" value={data.active_alumni} />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Insights</h2>
        <ul className="space-y-2 text-gray-700">
          <li>✓ Department has {data.total_events} active events</li>
          <li>✓ Total job applications: {data.total_applications}</li>
          <li>✓ {data.active_students} students and {data.active_alumni} alumni engaged</li>
          <li>✓ {data.total_newsletters} newsletters published this session</li>
        </ul>
      </div>
    </div>
  );
}
