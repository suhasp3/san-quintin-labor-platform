import { useState } from "react";
import { Megaphone, Sparkles } from "lucide-react";

import JobForm from "../components/JobForm";
import type { Job } from "../types";
import { formatDate } from "../utils/dateFormatter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const [submittedJobs, setSubmittedJobs] = useState<Job[]>([]);

  const handleSubmit = async (jobData: {
    title: string;
    pay: string;
    location: string;
    date: string;
    description?: string;
  }) => {
    try {
      const { authenticatedFetch } = await import("../lib/api");
      const response = await authenticatedFetch("http://localhost:8000/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jobData),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        throw new Error(`Failed to post job: ${errorText}`);
      }

      const newJob: Job = await response.json();
      if (newJob) {
        alert("Job posted successfully!");
        setSubmittedJobs((prev) => [...prev, newJob]);
      }
    } catch (error) {
      console.error("Error posting job:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      alert(`Error posting job: ${errorMessage}. Please try again.`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white pb-24">
      <header className="rounded-b-[2rem] bg-slate-900 px-6 pt-12 pb-10 text-white shadow-inner">
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-300">
              Grower console
            </p>
            <h1 className="mt-3 text-3xl font-semibold">Post accessible jobs</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-200">
              Co-designed with farm owners and labor advocates to make low-text hiring easy, auditable, and fair.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Badge className="bg-white/15 text-white" variant="outline">
              <Sparkles className="mr-2 h-4 w-4" />
              Templates ready
            </Badge>
            <Badge className="bg-white/15 text-white" variant="outline">
              <Megaphone className="mr-2 h-4 w-4" />
              Sends WhatsApp alerts
            </Badge>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 pt-6">
        <Card className="border border-border/70 shadow-md">
          <CardHeader>
            <CardTitle>Create a job in <span className="text-primary">60 seconds</span></CardTitle>
            <p className="text-sm text-muted-foreground">
              Provide only essential info. The platform translates it into icons, voice prompts, and contracts for workers.
            </p>
          </CardHeader>
          <CardContent>
            <JobForm onSubmit={handleSubmit} />
          </CardContent>
        </Card>

        {submittedJobs.length > 0 && (
          <Card className="border border-dashed border-primary/40 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Recently posted jobs
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                We automatically publish these to workers’ low-bandwidth app homescreen.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {submittedJobs.slice(-3).map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between rounded-2xl border border-border/40 bg-white/80 px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-foreground">{job.title}</p>
                    <p className="text-muted-foreground">
                      {job.location} • {formatDate(job.date)}
                    </p>
                  </div>
                  <Badge variant="muted" className="text-xs">
                    Live
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

