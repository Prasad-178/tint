"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppStore } from "@/store";
import { useWallet } from "@solana/wallet-adapter-react";
import { FileCheck, Copy, Check, QrCode, Trash2, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { formatUSD, generateUUID } from "@/lib/utils";
import { QRCodeSVG } from "qrcode.react";

const THRESHOLD_OPTIONS = [
  { label: "$1K", value: 1000 },
  { label: "$10K", value: 10000 },
  { label: "$100K", value: 100000 },
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

    if (totalShieldedValue < threshold) {
      return;
    }

    setIsGenerating(true);
    setSelectedThreshold(threshold);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const proofId = generateUUID();
      const proof = {
        id: proofId,
        threshold,
        createdAt: Date.now(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
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

  const activeProofs = proofs.filter(p => p.expiresAt > Date.now());

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium text-muted-foreground">Proof of Funds</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Generate buttons */}
          <div className="flex flex-wrap gap-2">
            {THRESHOLD_OPTIONS.map((option) => {
              const canGenerate = totalShieldedValue >= option.value;
              return (
                <Button
                  key={option.value}
                  variant={canGenerate ? "outline" : "ghost"}
                  size="sm"
                  onClick={() => generateProof(option.value)}
                  disabled={isGenerating || !canGenerate}
                  className={`h-8 text-xs ${!canGenerate ? "opacity-40" : ""}`}
                >
                  {isGenerating && selectedThreshold === option.value ? (
                    <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                  ) : null}
                  {option.label}+
                </Button>
              );
            })}
          </div>

          {/* Active Proofs - Compact list */}
          {activeProofs.length > 0 && (
            <div className="space-y-2 pt-3 border-t border-border">
              {activeProofs.map((proof) => (
                <div
                  key={proof.id}
                  className="flex items-center justify-between py-1.5"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs font-normal">
                      {formatUSD(proof.threshold)}+
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(proof.expiresAt, { addSuffix: true })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        setGeneratedProof(proof);
                        setShowProofDialog(true);
                      }}
                    >
                      <QrCode className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => copyLink(proof.shareableLink)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-red-500"
                      onClick={() => removeProof(proof.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeProofs.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Generate proofs to share privately
            </p>
          )}
        </CardContent>
      </Card>

      {/* Proof Dialog - Simplified */}
      <Dialog open={showProofDialog} onOpenChange={setShowProofDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Proof Generated</DialogTitle>
          </DialogHeader>

          {generatedProof && (
            <div className="space-y-4 pt-2">
              <div className="flex justify-center">
                <div className="p-3 bg-white rounded-lg">
                  <QRCodeSVG value={generatedProof.shareableLink} size={160} />
                </div>
              </div>

              <div className="text-center">
                <Badge variant="success" className="text-sm">
                  Holds {formatUSD(generatedProof.threshold)}+
                </Badge>
                <p className="text-xs text-muted-foreground mt-2">
                  Expires {formatDistanceToNow(generatedProof.expiresAt, { addSuffix: true })}
                </p>
              </div>

              <div className="flex gap-2">
                <code className="flex-1 text-[10px] bg-muted px-2 py-1.5 rounded font-mono truncate">
                  {generatedProof.shareableLink}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => copyLink(generatedProof.shareableLink)}
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
