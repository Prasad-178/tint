"use client";

import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, CheckCircle2, Clock, AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { formatUSD } from "@/lib/utils";
import { format } from "date-fns";
import { useState, useEffect } from "react";

// In a real implementation, this would fetch from a database or on-chain
interface ProofData {
  threshold: number;
  timestamp: number;
  walletHash: string;
  expiresAt: number;
  isValid: boolean;
}

export default function VerifyProofPage() {
  const params = useParams();
  const proofId = params.id as string;
  const [proofData, setProofData] = useState<ProofData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate fetching proof data
    // In production, this would verify against on-chain data or a database
    const fetchProof = async () => {
      setIsLoading(true);
      try {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // For demo purposes, generate mock data based on proof ID
        // In production, this would fetch real proof data
        if (proofId && proofId.length > 10) {
          const mockProof: ProofData = {
            threshold: 10000,
            timestamp: Date.now() - 3600000, // 1 hour ago
            walletHash: proofId.slice(0, 8),
            expiresAt: Date.now() + 23 * 3600000, // 23 hours from now
            isValid: true,
          };
          setProofData(mockProof);
        } else {
          setError("Invalid proof ID");
        }
      } catch {
        setError("Failed to verify proof");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProof();
  }, [proofId]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-muted-foreground">Verifying proof...</p>
        </div>
      </div>
    );
  }

  if (error || !proofData) {
    return (
      <div className="container max-w-lg mx-auto px-4 py-12">
        <Card className="border-red-500/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Proof Not Found</h2>
              <p className="text-muted-foreground mb-6">
                {error || "This proof does not exist or has been revoked."}
              </p>
              <Link href="/">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Tint
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isExpired = proofData.expiresAt < Date.now();

  return (
    <div className="container max-w-lg mx-auto px-4 py-12">
      <Card className={isExpired ? "border-amber-500/20" : "border-emerald-500/20"}>
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4">
            {isExpired ? (
              <Clock className="h-16 w-16 text-amber-500" />
            ) : (
              <CheckCircle2 className="h-16 w-16 text-emerald-500" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {isExpired ? "Proof Expired" : "Proof Verified"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Badge */}
          <div className="flex justify-center">
            <Badge variant={isExpired ? "warning" : "success"} className="text-sm px-4 py-1">
              {isExpired ? "Expired" : "Valid"}
            </Badge>
          </div>

          {/* Proof Details */}
          <div className="space-y-4 p-4 rounded-lg bg-muted">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Statement</span>
              <span className="font-semibold">
                Holds {formatUSD(proofData.threshold)}+
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Created</span>
              <span>{format(proofData.timestamp, "PPp")}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                {isExpired ? "Expired" : "Expires"}
              </span>
              <span>{format(proofData.expiresAt, "PPp")}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Proof ID</span>
              <code className="text-xs font-mono bg-background px-2 py-1 rounded">
                {proofId.slice(0, 8)}...
              </code>
            </div>
          </div>

          {/* Verification Info */}
          <div className="text-center text-sm text-muted-foreground">
            <Shield className="h-4 w-4 inline mr-1" />
            This proof was generated using{" "}
            <a
              href="https://privacycash.co"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-500 hover:underline"
            >
              Privacy.cash
            </a>{" "}
            technology.
            <br />
            No balance or address information was revealed.
          </div>

          {/* CTA */}
          <div className="pt-4 border-t border-border">
            <Link href="/">
              <Button className="w-full" variant="outline">
                <Shield className="h-4 w-4 mr-2" />
                Create Your Own Proof
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
