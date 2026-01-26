"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppStore } from "@/store";
import { useWallet } from "@solana/wallet-adapter-react";
import { FileCheck, Copy, Check, QrCode, Trash2, Shield, Loader2 } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { formatUSD, generateUUID } from "@/lib/utils";
import { QRCodeSVG } from "qrcode.react";

const THRESHOLD_OPTIONS = [
  { label: "$1K", value: 1000 },
  { label: "$10K", value: 10000 },
  { label: "$50K", value: 50000 },
  { label: "$100K", value: 100000 },
  { label: "$500K", value: 500000 },
  { label: "$1M", value: 1000000 },
];

export function ProofOfFunds() {
  const { connected, publicKey } = useWallet();
  const { proofs, addProof, removeProof, shieldedBalances } = useAppStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedThreshold, setSelectedThreshold] = useState<number | null>(null);
  const [showProofDialog, setShowProofDialog] = useState(false);
  const [generatedProof, setGeneratedProof] = useState<typeof proofs[0] | null>(null);
  const [copied, setCopied] = useState(false);

  const totalShieldedValue = shieldedBalances.reduce((acc, b) => acc + (b.usdValue || 0), 0);

  const generateProof = async (threshold: number) => {
    if (!publicKey) return;

    // Check if user has enough shielded balance
    if (totalShieldedValue < threshold) {
      alert(`Insufficient shielded balance. You have ${formatUSD(totalShieldedValue)} but need at least ${formatUSD(threshold)}`);
      return;
    }

    setIsGenerating(true);
    setSelectedThreshold(threshold);

    try {
      // Simulate proof generation (in production, this would use ZK proofs)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const proofId = generateUUID();
      const proof = {
        id: proofId,
        threshold,
        createdAt: Date.now(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
        proofData: Buffer.from(JSON.stringify({
          threshold,
          timestamp: Date.now(),
          walletHash: publicKey.toBase58().slice(0, 8),
        })).toString("base64"),
        shareableLink: `${window.location.origin}/verify/${proofId}`,
      };

      addProof(proof);
      setGeneratedProof(proof);
      setShowProofDialog(true);
    } catch (error) {
      console.error("Error generating proof:", error);
    } finally {
      setIsGenerating(false);
      setSelectedThreshold(null);
    }
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!connected) {
    return null;
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileCheck className="h-5 w-5" />
            Proof of Funds
          </CardTitle>
          <CardDescription>
            Generate verifiable proof that you hold funds without revealing your exact balance or address
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Generate New Proof */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Generate New Proof</p>
            <div className="flex flex-wrap gap-2">
              {THRESHOLD_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  variant={totalShieldedValue >= option.value ? "outline" : "ghost"}
                  size="sm"
                  onClick={() => generateProof(option.value)}
                  disabled={isGenerating || totalShieldedValue < option.value}
                  className={totalShieldedValue < option.value ? "opacity-50" : ""}
                >
                  {isGenerating && selectedThreshold === option.value ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  {option.label}+
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Your shielded balance: {formatUSD(totalShieldedValue)}
            </p>
          </div>

          {/* Active Proofs */}
          {proofs.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-border">
              <p className="text-sm font-medium">Active Proofs</p>
              <div className="space-y-2">
                {proofs.map((proof) => {
                  const isExpired = proof.expiresAt < Date.now();
                  return (
                    <div
                      key={proof.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        isExpired ? "border-red-500/20 bg-red-500/5" : "border-border bg-muted/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Shield className={`h-5 w-5 ${isExpired ? "text-red-500" : "text-emerald-500"}`} />
                        <div>
                          <p className="font-medium">
                            Holds {formatUSD(proof.threshold)}+
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {isExpired
                              ? "Expired"
                              : `Expires ${formatDistanceToNow(proof.expiresAt, { addSuffix: true })}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!isExpired && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setGeneratedProof(proof);
                                setShowProofDialog(true);
                              }}
                            >
                              <QrCode className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => copyLink(proof.shareableLink)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeProof(proof.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Proof Dialog */}
      <Dialog open={showProofDialog} onOpenChange={setShowProofDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-emerald-500" />
              Proof of Funds Generated
            </DialogTitle>
            <DialogDescription>
              Share this proof to verify you hold {generatedProof && formatUSD(generatedProof.threshold)}+ without revealing your actual balance
            </DialogDescription>
          </DialogHeader>

          {generatedProof && (
            <div className="space-y-6 py-4">
              {/* QR Code */}
              <div className="flex justify-center">
                <div className="p-4 bg-white rounded-lg">
                  <QRCodeSVG value={generatedProof.shareableLink} size={180} />
                </div>
              </div>

              {/* Proof Details */}
              <div className="space-y-3 p-4 rounded-lg bg-muted">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Threshold</span>
                  <Badge variant="success">{formatUSD(generatedProof.threshold)}+</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Created</span>
                  <span className="text-sm">{format(generatedProof.createdAt, "PPp")}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Expires</span>
                  <span className="text-sm">{format(generatedProof.expiresAt, "PPp")}</span>
                </div>
              </div>

              {/* Link */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Shareable Link</label>
                <div className="flex gap-2">
                  <code className="flex-1 text-xs bg-background px-3 py-2 rounded-md font-mono truncate border">
                    {generatedProof.shareableLink}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyLink(generatedProof.shareableLink)}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button onClick={() => setShowProofDialog(false)} className="w-full">
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
