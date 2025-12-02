import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Play, CheckCircle2, XCircle, Loader2, Mic, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { authenticatedFetch } from "../lib/api";

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

export default function ApplicationsPage() {
  let authContext;
  try {
    authContext = useAuth();
  } catch (error) {
    console.error('Error getting auth context in ApplicationsPage:', error);
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md text-center space-y-4">
          <div className="text-red-600 text-lg font-semibold">⚠️ Authentication Error</div>
          <p className="text-muted-foreground">
            There was an issue loading your authentication. Please refresh the page.
          </p>
        </div>
      </div>
    );
  }
  
  const { user, userRole, loading: authLoading } = authContext;
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [playingAudio, setPlayingAudio] = useState<HTMLAudioElement | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    if (!authLoading && user) {
      fetchApplications();
    }
    return () => {
      mountedRef.current = false;
    };
  }, [user, userRole, authLoading, filterStatus]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      let url = "http://localhost:8000/applications";
      if (userRole === 'grower' && user?.id) {
        url += `?grower_id=${user.id}`;
      }
      if (filterStatus !== "all") {
        url += `${userRole === 'grower' && user?.id ? '&' : '?'}status=${filterStatus}`;
      }

      const response = await authenticatedFetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch applications");
      }
      const data: Application[] = await response.json();
      if (mountedRef.current) {
        setApplications(data);
      }
    } catch (err) {
      console.error("Error fetching applications:", err);
      if (mountedRef.current) {
        setError("Could not load applications. Please try again.");
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  const handleStatusUpdate = async (applicationId: number, newStatus: 'accepted' | 'rejected') => {
    try {
      const response = await authenticatedFetch(
        `http://localhost:8000/applications/${applicationId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update application");
      }

      fetchApplications(); // Refresh applications
    } catch (err) {
      console.error("Error updating application:", err);
      alert("Error updating the application. Please try again.");
    }
  };

  const getStatusColor = (status: Application['status']) => {
    switch (status) {
      case "accepted": return "bg-green-100 text-green-700 border-green-200";
      case "rejected": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-amber-100 text-amber-800 border-amber-200";
    }
  };

  const playAudio = (audioUrl: string) => {
    if (playingAudio) {
      playingAudio.pause();
      playingAudio.currentTime = 0;
    }
    const audio = new Audio(audioUrl);
    audio.play();
    setPlayingAudio(audio);
    audio.onended = () => setPlayingAudio(null);
    audio.onerror = () => {
      alert("Error playing audio. Please check the audio URL.");
      setPlayingAudio(null);
    };
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading user data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white pb-24">
      <header className="rounded-b-[2rem] bg-blue-600 px-6 pt-12 pb-10 text-white shadow-inner">
        <div className="mx-auto max-w-3xl space-y-4">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-blue-100">
              Application Review
            </p>
            <h1 className="mt-2 text-3xl font-semibold">Manage Job Applications</h1>
            <p className="mt-2 text-blue-50">
              Review voice and text applications from workers.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pt-6">
        <div className="mb-6">
          <Tabs value={filterStatus} onValueChange={setFilterStatus}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="accepted">Accepted</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {loading ? (
          <Card className="border-dashed border-blue-400 bg-blue-50 text-center">
            <CardContent className="py-12">
              <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-blue-600" />
              <CardTitle className="text-lg text-blue-800">Loading applications...</CardTitle>
              <CardDescription className="mt-2 text-sm text-blue-600">
                Fetching applications from the database.
              </CardDescription>
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="border-destructive/40 bg-red-50">
            <CardContent className="space-y-2 py-6 text-sm text-destructive">
              <p className="font-semibold">Error loading applications.</p>
              <p>{error}</p>
            </CardContent>
          </Card>
        ) : applications.length === 0 ? (
          <Card className="border-dashed border-blue-400 bg-blue-50 text-center">
            <CardContent className="py-12">
              <FileText className="mx-auto mb-4 h-10 w-10 text-blue-600" />
              <CardTitle className="text-lg text-blue-800">No applications found</CardTitle>
              <CardDescription className="mt-2 text-sm text-blue-600">
                There are no applications matching your criteria.
              </CardDescription>
            </CardContent>
          </Card>
        ) : (
          <ScrollArea className="h-[calc(100vh-250px)]">
            <div className="space-y-4 pr-4">
              {applications.map((app) => (
                <Card key={app.id} className="border border-border/70 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div>
                      <CardTitle className="text-lg">{app.job_title}</CardTitle>
                      <CardDescription className="text-sm">
                        {app.worker_name} ({app.worker_phone})
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(app.status)}>
                      {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    {app.audio_url && (
                      <div className="flex items-center gap-2">
                        <Mic className="h-4 w-4 text-blue-600" />
                        <span>Voice Application:</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => playAudio(app.audio_url!)}
                          disabled={playingAudio !== null}
                        >
                          <Play className="h-4 w-4 mr-2" /> Play
                        </Button>
                        <a 
                          href={app.audio_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-500 hover:underline text-xs"
                        >
                          Download
                        </a>
                      </div>
                    )}
                    {app.notes && (
                      <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 text-blue-600 mt-1" />
                        <div>
                          <span className="font-medium text-foreground">Text Application:</span>
                          <p className="mt-1 text-sm bg-muted/50 p-2 rounded-md">{app.notes}</p>
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Submitted: {app.submitted_at ? new Date(app.submitted_at).toLocaleString() : 'Unknown'}
                    </p>

                    {app.status === 'pending' && (
                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="outline"
                          className="flex-1 bg-green-500 text-white hover:bg-green-600"
                          onClick={() => handleStatusUpdate(app.id, 'accepted')}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" /> Accept
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 bg-red-500 text-white hover:bg-red-600"
                          onClick={() => handleStatusUpdate(app.id, 'rejected')}
                        >
                          <XCircle className="h-4 w-4 mr-2" /> Reject
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </main>
    </div>
  );
}

