import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface Stats {
  active_jobs: number;
  total_applications: number;
  weekly_jobs: Array<{ name: string; jobs: number }>;
  weekly_applications: Array<{ name: string; applications: number }>;
  labor_demand_forecast: Array<{ month: string; demand: number }>;
  category_stats: Array<{ category: string; jobs: number; workers: number }>;
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:8000/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fallback data if API fails
  const jobStats = stats?.weekly_jobs.map((day, index) => ({
    name: day.name,
    jobs: day.jobs,
    applications: stats.weekly_applications[index]?.applications || 0,
  })) || [
    { name: 'Mon', jobs: 0, applications: 0 },
    { name: 'Tue', jobs: 0, applications: 0 },
    { name: 'Wed', jobs: 0, applications: 0 },
    { name: 'Thu', jobs: 0, applications: 0 },
    { name: 'Fri', jobs: 0, applications: 0 },
    { name: 'Sat', jobs: 0, applications: 0 },
    { name: 'Sun', jobs: 0, applications: 0 },
  ];

  const laborDemand = stats?.labor_demand_forecast || [
    { month: 'Jan', demand: 0 },
    { month: 'Feb', demand: 0 },
    { month: 'Mar', demand: 0 },
    { month: 'Apr', demand: 0 },
    { month: 'May', demand: 0 },
    { month: 'Jun', demand: 0 },
  ];

  const categoryStats = stats?.category_stats || [
    { category: 'Tomato', jobs: 0, workers: 0 },
    { category: 'Strawberry', jobs: 0, workers: 0 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-primary text-white p-6 shadow-md">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-sm mt-1 opacity-90">Statistics and forecasts</p>
      </div>

      <div className="p-4 space-y-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-gray-600">Loading statistics...</p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg shadow-md p-4 text-center">
                <div className="text-3xl mb-2">📊</div>
                <div className="text-2xl font-bold text-gray-800">
                  {stats?.active_jobs || 0}
                </div>
                <div className="text-sm text-gray-600">Active Jobs</div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-4 text-center">
                <div className="text-3xl mb-2">👥</div>
                <div className="text-2xl font-bold text-gray-800">
                  {stats?.total_applications || 0}
                </div>
                <div className="text-sm text-gray-600">Applications</div>
              </div>
            </div>

            {/* Weekly Job Stats */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-lg font-semibold mb-4">Jobs and Applications (This Week)</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={jobStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="jobs" fill="#22c55e" name="Jobs" />
                  <Bar dataKey="applications" fill="#3b82f6" name="Applications" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Labor Demand Forecast */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-lg font-semibold mb-4">Labor Demand Forecast</h2>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={laborDemand}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="demand" stroke="#22c55e" strokeWidth={2} name="Demand" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Category Breakdown */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-lg font-semibold mb-4">Jobs by Category</h2>
              <div className="space-y-3">
                {categoryStats.map((stat) => (
                  <div key={stat.category} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">{stat.category}</span>
                        <span className="text-sm text-gray-600">{stat.jobs} jobs</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${(stat.jobs / 50) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

