"use client";

import { useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { privacyClient, exportCurrentSessionKeypair } from "@/lib/privacy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Settings,
  Copy,
  Check,
  Download,
  Upload,
  AlertTriangle,
  Loader2,
  ExternalLink,
  RefreshCw,
  Wallet,
} from "lucide-react";

interface SessionManagerProps {
  sessionPublicKey: string | null;
  onSessionChanged: () => void;
}

export function SessionManager({ sessionPublicKey, onSessionChanged }: SessionManagerProps) {
  const { publicKey } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState<"address" | "backup" | null>(null);
  const [importValue, setImportValue] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [showBackup, setShowBackup] = useState(false);
  const [backupValue, setBackupValue] = useState<string | null>(null);

  const walletAddress = publicKey?.toBase58() || null;

  const copyToClipboard = useCallback(async (text: string, type: "address" | "backup") => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const handleExportBackup = useCallback(() => {
    if (!walletAddress) return;
    const backup = exportCurrentSessionKeypair(walletAddress);
    if (backup) {
      setBackupValue(backup);
      setShowBackup(true);
    }
  }, [walletAddress]);

  const handleImportSession = useCallback(async () => {
    if (!importValue.trim()) {
      setImportError("Please enter a session backup code");
      return;
    }

    setIsImporting(true);
    setImportError(null);

    try {
      const success = privacyClient.importSession(importValue.trim());
      if (success) {
        setImportValue("");
        setIsOpen(false);
        onSessionChanged();
      } else {
        setImportError("Invalid backup code. Please check and try again.");
      }
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setIsImporting(false);
    }
  }, [importValue, onSessionChanged]);

  if (!walletAddress) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Session Wallet Management
          </DialogTitle>
          <DialogDescription>
            Manage your session wallet for privacy operations. Your session wallet holds funds before they&apos;re shielded.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Session Address */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Current Session Wallet</label>
            {sessionPublicKey ? (
              <div className="flex gap-2">
                <code className="flex-1 text-xs bg-muted px-3 py-2 rounded-md font-mono truncate border">
                  {sessionPublicKey}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(sessionPublicKey, "address")}
                >
                  {copied === "address" ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <a
                  href={`https://solscan.io/account/${sessionPublicKey}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="icon">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </a>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading session...
              </div>
            )}
          </div>

          {/* Backup Section */}
          <div className="space-y-2 pt-4 border-t">
            <label className="text-sm font-medium">Backup Session</label>
            <p className="text-xs text-muted-foreground">
              Save this backup code to recover your session wallet on another device or browser.
            </p>
            {showBackup && backupValue ? (
              <div className="space-y-2">
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <div className="flex items-start gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-500">
                      Keep this code secret! Anyone with this code can access your session wallet funds.
                    </p>
                  </div>
                  <code className="block text-xs bg-background p-2 rounded font-mono break-all border">
                    {backupValue}
                  </code>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(backupValue, "backup")}
                    className="flex-1"
                  >
                    {copied === "backup" ? (
                      <>
                        <Check className="h-4 w-4 mr-2 text-emerald-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Backup Code
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowBackup(false)}
                  >
                    Hide
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" onClick={handleExportBackup} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Show Backup Code
              </Button>
            )}
          </div>

          {/* Import Section */}
          <div className="space-y-2 pt-4 border-t">
            <label className="text-sm font-medium">Recover Session Wallet</label>
            <p className="text-xs text-muted-foreground">
              If you have funds stuck in an old session wallet, paste your backup code here to recover access.
            </p>
            <div className="flex gap-2">
              <Input
                type="text"
                value={importValue}
                onChange={(e) => {
                  setImportValue(e.target.value);
                  setImportError(null);
                }}
                placeholder="Paste your backup code here..."
                className="font-mono text-xs"
              />
              <Button
                onClick={handleImportSession}
                disabled={isImporting || !importValue.trim()}
              >
                {isImporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
              </Button>
            </div>
            {importError && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {importError}
              </p>
            )}
          </div>

          {/* Help Section */}
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              <strong>Lost access to your session wallet?</strong> If you don&apos;t have a backup code, 
              the funds in your old session wallet cannot be recovered. The session is derived from a 
              unique signature, and each browser/device may generate a different session.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
