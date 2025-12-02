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
import { Activity, Shield, Signal, FileText, Mic, CheckCircle2, XCircle, Clock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Stats {
  active_jobs: number;
  total_applications: number;
  weekly_jobs: Array<{ name: string; jobs: number }>;
  weekly_applications: Array<{ name: string; applications: number }>;
  labor_demand_forecast: Array<{ month: string; demand: number }>;
  category_stats: Array<{ category: string; jobs: number; workers: number }>;
}

interface Application {
  id: number;
  job_id: number;
  job_title: string;
  worker_id?: string;
  worker_name?: string;
  worker_phone?: string;
  status: 'pending' | 'accepted' | 'rejected';
  audio_url?: string;
  notes?: string;
  submitted_at?: string;
  grower_id?: string;
  farm_name?: string;
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");

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

  useEffect(() => {
    let mounted = true;
    
    const fetchApplications = async () => {
      try {
        setApplicationsLoading(true);
        let url = "http://localhost:8000/applications";
        if (filterStatus !== "all") {
          url += `?status=${filterStatus}`;
        }
        
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          if (data && mounted) {
            setApplications(data);
          }
        } else {
          console.warn("Applications API returned non-OK status:", response.status);
        }
      } catch (error) {
        console.error("Error fetching applications:", error);
      } finally {
        if (mounted) {
          setApplicationsLoading(false);
        }
      }
    };
    
    fetchApplications();
    
    return () => {
      mounted = false;
    };
  }, [filterStatus]);

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

  const getStatusColor = (status: Application['status']) => {
    switch (status) {
      case "accepted": return "bg-green-100 text-green-700 border-green-200";
      case "rejected": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-amber-100 text-amber-800 border-amber-200";
    }
  };

  const getStatusIcon = (status: Application['status']) => {
    switch (status) {
      case "accepted": return <CheckCircle2 className="h-4 w-4" />;
      case "rejected": return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

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

            <Card className="border-0 bg-white">
              <CardHeader>
                <CardTitle>Job Applications</CardTitle>
                <CardDescription>
                  Review and manage all job applications from workers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={filterStatus} onValueChange={setFilterStatus} className="mb-4">
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="accepted">Accepted</TabsTrigger>
                    <TabsTrigger value="rejected">Rejected</TabsTrigger>
                  </TabsList>
                </Tabs>

                {applicationsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading applications...
                  </div>
                ) : applications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="mx-auto h-10 w-10 mb-2 opacity-50" />
                    <p>No applications found</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3 pr-4">
                      {applications.map((app) => (
                        <Card key={app.id} className="border border-border/70">
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                            <div>
                              <CardTitle className="text-base">{app.job_title}</CardTitle>
                              <CardDescription className="text-sm">
                                {app.worker_name} • {app.worker_phone}
                                {app.farm_name && ` • ${app.farm_name}`}
                              </CardDescription>
                            </div>
                            <Badge className={getStatusColor(app.status)}>
                              <span className="flex items-center gap-1">
                                {getStatusIcon(app.status)}
                                {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                              </span>
                            </Badge>
                          </CardHeader>
                          <CardContent className="space-y-2 text-sm">
                            {app.audio_url && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Mic className="h-4 w-4 text-blue-600" />
                                <span>Voice Application:</span>
                                <a 
                                  href={app.audio_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-blue-500 hover:underline"
                                >
                                  Listen
                                </a>
                              </div>
                            )}
                            {app.notes && (
                              <div className="flex items-start gap-2">
                                <FileText className="h-4 w-4 text-blue-600 mt-1" />
                                <div className="flex-1">
                                  <span className="font-medium text-foreground">Text Application:</span>
                                  <p className="mt-1 text-sm bg-muted/50 p-2 rounded-md">{app.notes}</p>
                                </div>
                              </div>
                            )}
                            {app.submitted_at && (
                              <p className="text-xs text-muted-foreground">
                                Submitted: {new Date(app.submitted_at).toLocaleString()}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}

