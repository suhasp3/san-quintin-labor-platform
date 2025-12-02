import { useState } from "react";
import { CalendarDays, MapPin, Users, Waves, CheckCircle2 } from "lucide-react";

import type { Job } from "../types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import VoiceRecorder from "./VoiceRecorder";

interface JobCardProps {
  job: Job;
  onApply: (jobId: number, audioBlob?: Blob) => void;
  hasApplied?: boolean;
}

export default function JobCard({ job, onApply, hasApplied = false }: JobCardProps) {
  const [showRecorder, setShowRecorder] = useState(false);
  const cropType = (job as any)?.crop_type || (job as any)?.cropType;
  const workerCount = (job as any)?.workers_requested || (job as any)?.workersRequested;

  const handleApply = (audioBlob?: Blob) => {
    if (hasApplied) return; // Prevent applying if already applied
    onApply(job.id, audioBlob);
    setShowRecorder(false);
  };

  return (
    <Card className="border border-border/70 shadow-md">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="muted">
                {cropType ?? "Seasonal"}
              </Badge>
              {hasApplied && (
                <Badge className="bg-green-100 text-green-700 border-green-200">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Applied
                </Badge>
              )}
            </div>
            <CardTitle className="text-xl">{job.title}</CardTitle>
            <CardDescription>{job.location}</CardDescription>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Pay</p>
            <p className="text-lg font-semibold text-foreground">{job.pay}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <CalendarDays className="h-4 w-4 text-primary" />
          <span>{job.date}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4 text-primary" />
          <span>{job.location}</span>
        </div>
        {workerCount ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4 text-primary" />
            <span>{workerCount} workers requested</span>
          </div>
        ) : null}
        {job.description ? (
          <p className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
            {job.description}
          </p>
        ) : null}
      </CardContent>

      <CardFooter className="flex flex-col gap-3">
        {hasApplied ? (
          <div className="w-full rounded-lg bg-green-50 border border-green-200 p-4 text-center">
            <CheckCircle2 className="h-5 w-5 mx-auto mb-2 text-green-600" />
            <p className="text-sm font-medium text-green-800">Application Submitted</p>
            <p className="text-xs text-green-600 mt-1">The employer will review your application</p>
          </div>
        ) : showRecorder ? (
          <VoiceRecorder
            onRecordComplete={handleApply}
            onCancel={() => setShowRecorder(false)}
          />
        ) : (
          <>
            <Button
              className="w-full"
              size="lg"
              onClick={() => setShowRecorder(true)}
            >
              Apply with Voice
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => onApply(job.id)}
            >
              Quick Apply
            </Button>
          </>
        )}
        {!hasApplied && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Waves className="h-4 w-4 text-primary" />
            <span>Audio-first applications supported</span>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

