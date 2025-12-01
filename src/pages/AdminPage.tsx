import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { Activity, Shield, Signal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
    let mounted = true;
    
    const fetchStats = async () => {
      try {
        const response = await fetch("http://localhost:8000/stats");
        if (response.ok) {
          const data = await response.json();
          if (data && mounted) {
            setStats(data);
          }
        } else {
          console.warn("Stats API returned non-OK status:", response.status);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
        // Keep fallback data (already set in component)
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    
    fetchStats();
    
    return () => {
      mounted = false;
    };
  }, []);

  // Fallback data if API fails
  const jobStats =
    stats?.weekly_jobs.map((day, index) => ({
      name: day.name,
      jobs: day.jobs,
      applications: stats.weekly_applications[index]?.applications || 0,
    })) || [
      { name: "Mon", jobs: 0, applications: 0 },
      { name: "Tue", jobs: 0, applications: 0 },
      { name: "Wed", jobs: 0, applications: 0 },
      { name: "Thu", jobs: 0, applications: 0 },
      { name: "Fri", jobs: 0, applications: 0 },
      { name: "Sat", jobs: 0, applications: 0 },
      { name: "Sun", jobs: 0, applications: 0 },
    ];

  const laborDemand = stats?.labor_demand_forecast || [
    { month: "Jan", demand: 0 },
    { month: "Feb", demand: 0 },
    { month: "Mar", demand: 0 },
    { month: "Apr", demand: 0 },
    { month: "May", demand: 0 },
    { month: "Jun", demand: 0 },
  ];

  const categoryStats = stats?.category_stats || [
    { category: "Tomato", jobs: 0, workers: 0 },
    { category: "Strawberry", jobs: 0, workers: 0 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 pb-24 text-white">
      <header className="px-6 pt-12 pb-10">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.5em] text-slate-400">
              Impact control room
            </p>
            <h1 className="mt-3 text-3xl font-semibold">
              Real-time labor intelligence
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-200">
              Powered by Supabase + Poisson simulations to predict demand and document ethical hiring.
            </p>
          </div>
          <Badge className="bg-white/10 text-white" variant="outline">
            <Shield className="mr-2 h-4 w-4" />
            Audit ready
          </Badge>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4">
        {loading ? (
          <Card className="border border-white/10 bg-white/5 text-center text-white">
            <CardContent className="py-12">
              <p className="text-lg font-medium">Syncing telemetry…</p>
              <p className="text-sm text-white/70">
                Fetching metrics from Supabase and local Poisson runs.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="bg-white/10 text-white">
                <CardContent className="flex items-center justify-between py-6">
                  <div>
                    <p className="text-sm text-white/70">Active jobs</p>
                    <p className="text-3xl font-semibold">{stats?.active_jobs || 0}</p>
                  </div>
                  <Activity className="h-10 w-10 text-emerald-300" />
                </CardContent>
              </Card>
              <Card className="bg-white/10 text-white">
                <CardContent className="flex items-center justify-between py-6">
                  <div>
                    <p className="text-sm text-white/70">Applications</p>
                    <p className="text-3xl font-semibold">
                      {stats?.total_applications || 0}
                    </p>
                  </div>
                  <Signal className="h-10 w-10 text-emerald-300" />
                </CardContent>
              </Card>
            </div>

            <Card className="border-0 bg-white">
              <CardHeader>
                <CardTitle>Jobs & applications (7 days)</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={jobStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="jobs" fill="#22c55e" name="Jobs" radius={[6, 6, 0, 0]} />
                    <Bar
                      dataKey="applications"
                      fill="#2563eb"
                      name="Applications"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="border-0 bg-white">
                <CardHeader>
                  <CardTitle>Labor demand forecast</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Generated from Poisson arrival runs
                  </p>
                </CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={laborDemand}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="demand"
                        stroke="#22c55e"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-0 bg-white">
                <CardHeader>
                  <CardTitle>Crop category mix</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Worker allocation by crop
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {categoryStats.map((stat) => (
                    <div key={stat.category}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-foreground">{stat.category}</span>
                        <span className="text-muted-foreground">{stat.jobs} jobs</span>
                      </div>
                      <div className="mt-2 h-2 w-full rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-primary"
                          style={{ width: `${Math.min((stat.jobs / 50) * 100, 100)}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {stat.workers} workers requested
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

