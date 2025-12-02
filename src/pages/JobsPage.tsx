import { useState, useEffect, useMemo } from "react";
import { AudioLines, RefreshCw } from "lucide-react";

import type { Job, Contract } from "../types";
import JobCard from "../components/JobCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "../contexts/AuthContext";

export default function JobsPage() {
  let authContext;
  try {
    authContext = useAuth();
  } catch (error) {
    console.error('Error getting auth context in JobsPage:', error);
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
  
  const { user } = authContext;
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const mountedRef = useRef(true);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:8000/jobs");
      if (!response.ok) {
        throw new Error("Error loading jobs");
      }
      const data = await response.json();
      if (mountedRef.current) {
        setJobs(data);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError("Could not load jobs. Please verify the server is running.");
        console.error("Error fetching jobs:", err);
        // Fallback to sample data
        setJobs([
          {
            id: 1,
            title: "Tomato Picker",
            pay: "$12/hr",
            location: "Farm A",
            date: "Nov 20, 2025",
          },
          {
            id: 2,
            title: "Berry Harvester",
            pay: "$10/hr",
            location: "Farm B",
            date: "Nov 21, 2025",
          },
        ]);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    fetchJobs();
    
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleApply = async (jobId: number, audioBlob?: Blob) => {
    try {
      let audioUrl: string | undefined = undefined;

      // Upload audio to Supabase storage if provided
      if (audioBlob) {
        try {
          console.log("Uploading audio file...", audioBlob.size, "bytes");
          // Dynamically import to avoid crashing if storage module has issues
          const { uploadAudioFile } = await import("../lib/storage");
          audioUrl = await uploadAudioFile(audioBlob, `job-${jobId}`);
          console.log("Audio uploaded successfully:", audioUrl);
        } catch (uploadError) {
          console.error("Error uploading audio:", uploadError);
          const errorMessage = uploadError instanceof Error 
            ? uploadError.message 
            : "Unknown error";
          
          // Ask user if they want to continue without audio
          const continueWithoutAudio = confirm(
            `Failed to upload audio recording: ${errorMessage}\n\n` +
            "Would you like to submit the application without the audio recording?"
          );
          
          if (!continueWithoutAudio) {
            return; // User cancelled
          }
          // Continue without audio_url
        }
      }

      // Create contract via API with authentication
      try {
        const { authenticatedFetch } = await import("../lib/api");
        
        // Include worker_id and audio_url if available
        const requestBody: any = { job_id: jobId };
        if (user?.id) {
          requestBody.worker_id = user.id;
        }
        if (audioUrl) {
          requestBody.audio_url = audioUrl;
        }
        
        const response = await authenticatedFetch("http://localhost:8000/contracts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          let errorText = "Failed to create contract";
          try {
            const errorData = await response.json();
            errorText = errorData.detail || errorData.message || errorText;
          } catch {
            try {
              errorText = await response.text();
            } catch {
              // Use default error message
            }
          }
          throw new Error(errorText);
        }

        const newContract: Contract = await response.json();

        // Also save to localStorage as backup
        try {
          const existingContracts = localStorage.getItem("contracts");
          const contracts: Contract[] = existingContracts
            ? JSON.parse(existingContracts)
            : [];
          contracts.push(newContract);
          localStorage.setItem("contracts", JSON.stringify(contracts));
        } catch (storageErr) {
          console.warn("Could not save to localStorage:", storageErr);
        }

        alert(
          "Application submitted! The employer will review your application."
        );
      } catch (apiErr) {
        console.error("Error applying to job:", apiErr);
        const errorMessage = apiErr instanceof Error 
          ? apiErr.message 
          : "Error submitting application. Please try again.";
        
        // Provide more helpful error messages
        if (errorMessage.includes("Network error") || errorMessage.includes("Failed to fetch")) {
          alert("Could not connect to the server. Please make sure the backend is running at http://localhost:8000");
        } else if (errorMessage.includes("worker")) {
          alert("There was an issue with your account. Please try logging out and back in.");
        } else {
          alert(`Error: ${errorMessage}`);
        }
      }
    } catch (err) {
      console.error("Unexpected error in handleApply:", err);
      alert("An unexpected error occurred. Please try again.");
    }
  };

  const filteredJobs = useMemo(() => {
    try {
      if (filter === "all") return jobs;
      return jobs.filter((job) => {
        try {
          const cropType = ((job as any)?.crop_type || "").toLowerCase();
          return cropType === filter;
        } catch (err) {
          console.warn("Error filtering job:", err);
          return false;
        }
      });
    } catch (err) {
      console.error("Error in filteredJobs:", err);
      return jobs; // Return all jobs as fallback
    }
  }, [jobs, filter]);

  const stats = useMemo(() => {
    try {
      const workers = jobs.reduce(
        (sum, job) => {
          try {
            return sum + (((job as any)?.workers_requested as number) || 0);
          } catch (err) {
            return sum;
          }
        },
        0
      );
      const audioFriendly = jobs.length;
      const nextStart = jobs[0]?.date;
      return { workers, audioFriendly, nextStart };
    } catch (err) {
      console.error("Error calculating stats:", err);
      return { workers: 0, audioFriendly: 0, nextStart: undefined };
    }
  }, [jobs]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white pb-28">
      <header className="rounded-b-[2.5rem] bg-gradient-to-br from-emerald-500 to-emerald-600 px-4 pt-12 pb-10 text-white shadow-lg">
        <div className="mx-auto max-w-3xl space-y-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-100">
              San Quintín Workforce
            </p>
            <h1 className="mt-2 text-3xl font-semibold leading-tight">
              Find work in San Quintín, Baja California, Mexico
            </h1>
            <p className="mt-2 text-emerald-50">
              Jobs curated for low-text, icon-forward experiences built for
              agricultural day laborers.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="bg-white/15 text-white" variant="outline">
              <AudioLines className="mr-2 h-4 w-4" />
              Voice-friendly
            </Badge>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 pt-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Card className="bg-white/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                Workers needed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{stats.workers || "—"}</p>
              <p className="text-xs text-muted-foreground">
                across all postings
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                Voice-ready listings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{stats.audioFriendly}</p>
              <p className="text-xs text-muted-foreground">
                multi-lingual prompts
              </p>
            </CardContent>
          </Card>
          <Card className="col-span-2 bg-white/80 sm:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                Next start date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                {stats.nextStart ?? "Pending"}
              </p>
              <p className="text-xs text-muted-foreground">Updated hourly</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Tabs
            value={filter}
            onValueChange={setFilter}
            className="w-full sm:w-auto"
          >
            <TabsList className="flex w-full flex-wrap gap-2 rounded-2xl bg-muted p-1 sm:w-auto">
              <TabsTrigger value="all">All jobs</TabsTrigger>
              <TabsTrigger value="tomato">Tomato</TabsTrigger>
              <TabsTrigger value="strawberry">Strawberry</TabsTrigger>
              <TabsTrigger value="other">Other</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto gap-2 text-sm text-muted-foreground"
            onClick={fetchJobs}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {loading ? (
          <Card className="border-dashed border-muted">
            <CardContent className="space-y-4 py-8 text-center text-muted-foreground">
              <p className="font-medium">Loading curated shifts…</p>
              <p className="text-sm">
                Connecting to Supabase and the Poisson-powered generator.
              </p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="border-destructive/40 bg-red-50">
            <CardContent className="space-y-2 py-6 text-sm text-destructive">
              <p className="font-semibold">We couldn’t reach the job server.</p>
              <p>{error}</p>
            </CardContent>
          </Card>
        ) : filteredJobs.length === 0 ? (
          <Card className="border-dashed text-center">
            <CardContent className="py-12">
              <p className="text-lg font-medium text-muted-foreground">
                No jobs in this category yet.
              </p>
              <p className="text-sm text-muted-foreground">
                Try another filter or check back later.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => {
              try {
                return <JobCard key={job.id} job={job} onApply={handleApply} />;
              } catch (err) {
                console.error("Error rendering job card:", err, job);
                return null;
              }
            })}
          </div>
        )}
      </main>
    </div>
  );
}
