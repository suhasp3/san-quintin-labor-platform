import { useState, useEffect } from "react";
import { FileCheck2, MapPin, Wallet } from "lucide-react";

import type { Contract } from "../types";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function MyContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);

  useEffect(() => {
    let mounted = true;
    
    const fetchContracts = async () => {
    try {
      const { authenticatedFetch } = await import("../lib/api");
      const response = await authenticatedFetch("http://localhost:8000/contracts");
      if (response.ok) {
        const data = await response.json();
        const normalized = (data || []).map((contract: any) => {
          try {
            return {
              id: contract.id,
              jobId: contract.job_id ?? contract.jobId,
              jobTitle: contract.job_title ?? contract.jobTitle ?? "Unknown job",
              pay: contract.pay ?? contract.jobs?.pay ?? "$—",
              location: contract.location ?? contract.jobs?.location ?? "TBD",
              date: contract.date ?? contract.jobs?.start_date ?? "",
              status: contract.status ?? "pending",
              workerId: contract.worker_id,
              createdAt: contract.created_at,
            };
          } catch (err) {
            console.warn("Error normalizing contract:", err);
            return null;
          }
        }).filter((c: any) => c !== null);
        if (mounted) {
          setContracts(normalized);
        }
      } else {
        // Fallback to localStorage if API fails
        try {
          const savedContracts = localStorage.getItem("contracts");
          if (savedContracts && mounted) {
            setContracts(JSON.parse(savedContracts));
          }
        } catch (storageErr) {
          console.error("Error reading from localStorage:", storageErr);
        }
      }
    } catch (error) {
      console.error("Error fetching contracts:", error);
      // Fallback to localStorage
      try {
        const savedContracts = localStorage.getItem("contracts");
        if (savedContracts && mounted) {
          setContracts(JSON.parse(savedContracts));
        }
      } catch (storageErr) {
        console.error("Error reading from localStorage:", storageErr);
      }
    }
    };
    
    fetchContracts();
    
    return () => {
      mounted = false;
    };
  }, []);

  const getStatusColor = (status: Contract["status"]) => {
    switch (status) {
      case "accepted":
      case "signed":
        return "bg-primary/15 text-primary border-primary/30";
      case "rejected":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-amber-100 text-amber-800 border-amber-200";
    }
  };

  const getStatusText = (status: Contract["status"]) => {
    switch (status) {
      case "accepted":
      case "signed":
        return "Accepted";
      case "rejected":
        return "Rejected";
      default:
        return "Pending";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white pb-24">
      <header className="rounded-b-[2rem] bg-primary px-6 pt-12 pb-10 text-white shadow-inner">
        <div className="mx-auto max-w-3xl space-y-4">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-emerald-100">
              Contract locker
            </p>
            <h1 className="mt-2 text-3xl font-semibold">Track your offers</h1>
            <p className="mt-2 text-emerald-50">
              Every digital contract stays accessible, audio-friendly, and tamper-proof.
            </p>
          </div>
          <Card className="bg-white/10 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-white">Secure agreements</CardTitle>
              <CardDescription className="text-emerald-100">
                We notify you via WhatsApp when growers update the status.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pt-6">
        {contracts.length === 0 ? (
          <Card className="border-dashed border-primary/40 bg-primary/5 text-center">
            <CardContent className="py-12">
              <FileCheck2 className="mx-auto mb-4 h-10 w-10 text-primary" />
              <CardTitle className="text-lg">No contracts yet</CardTitle>
              <CardDescription className="mt-2 text-sm">
                Apply to jobs from the home tab. Your signed contracts will land here automatically.
              </CardDescription>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {contracts.map((contract) => (
              <Card key={contract.id} className="border border-border/70 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="text-lg">{contract.jobTitle}</CardTitle>
                    <CardDescription>{contract.date}</CardDescription>
                  </div>
                  <Badge className={getStatusColor(contract.status)}>
                    {getStatusText(contract.status)}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-primary" />
                    <span className="text-foreground font-medium">{contract.pay}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>{contract.location}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

