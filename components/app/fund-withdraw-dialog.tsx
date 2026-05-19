"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Copy,
  Check,
  ArrowRight,
  Wallet,
  Zap,
  ArrowDownLeft,
  ArrowUpRight,
  Loader2,
  QrCode,
  CreditCard,
} from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { useWalletStore } from "@/stores/wallet-store";
import { usePortfolio } from "@/lib/query-hooks";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [matches, query]);

  return matches;
}

export function FundWithdrawDialogs() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { fundDialogOpen, setFundDialogOpen, withdrawDialogOpen, setWithdrawDialogOpen } = useUIStore();
  const { wallets } = useWalletStore();
  const { data: portfolio } = usePortfolio();

  const connectedWallet = wallets.find((w) => w.type === "connected");
  const smartWallet = wallets.find((w) => w.type === "smart");

  const [copied, setCopied] = React.useState(false);
  const [selectedToken, setSelectedToken] = React.useState("ETH");
  const [amount, setAmount] = React.useState("");
  const [step, setStep] = React.useState<"idle" | "signing" | "processing" | "success">("idle");
  const [activeTab, setActiveTab] = React.useState("internal");

  // Reset state on open changes
  React.useEffect(() => {
    if (!fundDialogOpen && !withdrawDialogOpen) {
      setStep("idle");
      setAmount("");
    }
  }, [fundDialogOpen, withdrawDialogOpen]);

  const handleCopyAddress = () => {
    if (smartWallet?.address) {
      navigator.clipboard.writeText(smartWallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const tokens = portfolio?.topAssets && portfolio.topAssets.length > 0 
    ? portfolio.topAssets 
    : [
        { symbol: "ETH", name: "Ethereum", balance: 0.1245, icon: "Ξ" },
        { symbol: "USDC", name: "USD Coin", balance: 250.00, icon: "$" },
      ];

  const handleAction = async (type: "fund" | "withdraw") => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return;
    
    setStep("signing");
    await new Promise((resolve) => setTimeout(resolve, 1800)); // Signature simulate
    setStep("processing");
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Onchain simulate
    setStep("success");
  };

  const renderFundContent = () => (
    <div className="p-4 space-y-4">
      {step === "idle" && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="internal" className="rounded-lg py-2">Transfer</TabsTrigger>
            <TabsTrigger value="external" className="rounded-lg py-2">External</TabsTrigger>
          </TabsList>
          
          <TabsContent value="internal" className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground font-medium">Select Token</label>
              <div className="grid grid-cols-2 gap-2">
                {tokens.map((t) => (
                  <button
                    key={t.symbol}
                    onClick={() => setSelectedToken(t.symbol)}
                    className={cn(
                      "flex items-center justify-between border rounded-xl p-3 text-left transition-all hover:bg-muted/50",
                      selectedToken === t.symbol ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "bg-card"
                    )}
                  >
                    <div>
                      <p className="text-xs font-semibold">{t.symbol}</p>
                      <p className="text-[10px] text-muted-foreground">{t.name}</p>
                    </div>
                    <p className="text-xs font-semibold">{t.balance}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground font-medium">Amount to Deposit</label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="0.0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pr-16 py-6 rounded-xl border-border bg-card font-heading text-lg font-semibold"
                />
                <button 
                  onClick={() => {
                    const current = tokens.find(t => t.symbol === selectedToken);
                    if (current) setAmount(current.balance.toString());
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-lg hover:bg-primary/20 transition-all"
                >
                  MAX
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-dashed border-border p-3.5 bg-muted/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Wallet className="size-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Connected Wallet</p>
                  <p className="text-xs font-semibold">MetaMask</p>
                </div>
              </div>
              <ArrowRight className="size-4 text-muted-foreground" />
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center">
                  <Zap className="size-4 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Smart Wallet</p>
                  <p className="text-xs font-semibold">Qleva Account</p>
                </div>
              </div>
            </div>

            <Button onClick={() => handleAction("fund")} className="w-full py-6 rounded-xl gap-2 font-semibold">
              <ArrowDownLeft className="size-4" />
              Sign & Deposit
            </Button>
          </TabsContent>

          <TabsContent value="external" className="space-y-4 pt-4">
            <div className="flex flex-col items-center justify-center p-4 border rounded-2xl bg-card gap-3">
              <div className="bg-white p-3 rounded-xl border shadow-sm">
                <QrCode className="size-28 text-slate-800" />
              </div>
              <p className="text-xs text-muted-foreground text-center max-w-[200px]">
                Scan to send any Base / Sepolia compatible ERC20 tokens directly
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground font-medium">Smart Wallet Deposit Address</label>
              <div className="flex items-center gap-2 border rounded-xl p-2.5 bg-muted/30">
                <p className="text-xs font-mono font-medium truncate flex-1 pl-1.5">
                  {smartWallet?.address || "0x3e8C42fb6728001a2B548817a1772fb2a1881a2B"}
                </p>
                <Button variant="ghost" size="icon-sm" onClick={handleCopyAddress} className="rounded-lg">
                  {copied ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="py-5 rounded-xl gap-2 text-xs font-semibold">
                <CreditCard className="size-4 text-muted-foreground" />
                Buy with Card
              </Button>
              <Button variant="outline" className="py-5 rounded-xl gap-2 text-xs font-semibold">
                <Wallet className="size-4 text-muted-foreground" />
                Coinbase Pay
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      )}

      {step !== "idle" && renderProgressState("Deposit")}
    </div>
  );

  const renderWithdrawContent = () => (
    <div className="p-4 space-y-4">
      {step === "idle" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground font-medium">Select Token to Withdraw</label>
            <div className="grid grid-cols-2 gap-2">
              {tokens.map((t) => (
                <button
                  key={t.symbol}
                  onClick={() => setSelectedToken(t.symbol)}
                  className={cn(
                    "flex items-center justify-between border rounded-xl p-3 text-left transition-all hover:bg-muted/50",
                    selectedToken === t.symbol ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "bg-card"
                  )}
                >
                  <div>
                    <p className="text-xs font-semibold">{t.symbol}</p>
                    <p className="text-[10px] text-muted-foreground">{t.name}</p>
                  </div>
                  <p className="text-xs font-semibold">{t.balance}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground font-medium">Amount to Withdraw</label>
            <div className="relative">
              <Input
                type="number"
                placeholder="0.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pr-16 py-6 rounded-xl border-border bg-card font-heading text-lg font-semibold"
              />
              <button 
                onClick={() => {
                  const current = tokens.find(t => t.symbol === selectedToken);
                  if (current) setAmount(current.balance.toString());
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-lg hover:bg-primary/20 transition-all"
              >
                MAX
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-dashed border-border p-3.5 bg-muted/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center">
                <Zap className="size-4 text-primary" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Smart Wallet</p>
                <p className="text-xs font-semibold">Qleva Account</p>
              </div>
            </div>
            <ArrowRight className="size-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Wallet className="size-4 text-blue-500" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Connected Wallet</p>
                <p className="text-xs font-semibold">MetaMask</p>
              </div>
            </div>
          </div>

          <Button onClick={() => handleAction("withdraw")} className="w-full py-6 rounded-xl gap-2 font-semibold">
            <ArrowUpRight className="size-4" />
            Withdraw to Connected Wallet
          </Button>
        </div>
      )}

      {step !== "idle" && renderProgressState("Withdrawal")}
    </div>
  );

  const renderProgressState = (actionLabel: string) => {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
        {step === "signing" && (
          <>
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 relative">
              <Loader2 className="size-7 text-primary animate-spin" />
            </div>
            <h3 className="font-heading text-lg font-semibold">Requesting Signature</h3>
            <p className="text-xs text-muted-foreground max-w-[240px]">
              Confirm the action in your connected wallet browser extension...
            </p>
          </>
        )}

        {step === "processing" && (
          <>
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 relative">
              <Loader2 className="size-7 text-primary animate-spin" />
            </div>
            <h3 className="font-heading text-lg font-semibold">Confirming onchain</h3>
            <p className="text-xs text-muted-foreground max-w-[240px]">
              Submitting execution script and waiting for blocks on Base...
            </p>
          </>
        )}

        {step === "success" && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center space-y-4"
          >
            <div className="flex size-14 items-center justify-center rounded-full bg-green-500/10">
              <Check className="size-7 text-green-500" />
            </div>
            <h3 className="font-heading text-lg font-semibold">{actionLabel} Complete!</h3>
            <p className="text-xs text-muted-foreground max-w-[240px]">
              Successfully processed {amount} {selectedToken}. Balances will update momentarily.
            </p>
            <Button 
              variant="outline" 
              onClick={() => {
                setFundDialogOpen(false);
                setWithdrawDialogOpen(false);
              }}
              className="px-6 rounded-xl text-xs font-semibold"
            >
              Done
            </Button>
          </motion.div>
        )}
      </div>
    );
  };

  if (isMobile) {
    return (
      <>
        {/* Mobile Fund Drawer */}
        <Drawer open={fundDialogOpen} onOpenChange={setFundDialogOpen}>
          <DrawerContent className="bg-popover border-t outline-none max-h-[85vh]">
            <DrawerHeader className="border-b pb-3 text-left">
              <DrawerTitle className="font-heading text-lg font-semibold">Fund Wallet</DrawerTitle>
              <DrawerDescription className="text-xs text-muted-foreground">
                Add assets to your secure Smart Wallet account.
              </DrawerDescription>
            </DrawerHeader>
            <div className="overflow-y-auto">{renderFundContent()}</div>
          </DrawerContent>
        </Drawer>

        {/* Mobile Withdraw Drawer */}
        <Drawer open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
          <DrawerContent className="bg-popover border-t outline-none max-h-[85vh]">
            <DrawerHeader className="border-b pb-3 text-left">
              <DrawerTitle className="font-heading text-lg font-semibold">Withdraw Wallet</DrawerTitle>
              <DrawerDescription className="text-xs text-muted-foreground">
                Transfer tokens from your Smart Wallet back to connected wallet.
              </DrawerDescription>
            </DrawerHeader>
            <div className="overflow-y-auto">{renderWithdrawContent()}</div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  return (
    <>
      {/* Desktop Fund Dialog */}
      <Dialog open={fundDialogOpen} onOpenChange={setFundDialogOpen}>
        <DialogContent className="max-w-md bg-popover/90 backdrop-blur-xl border p-0 rounded-2xl overflow-hidden shadow-2xl">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle className="font-heading text-lg font-semibold">Fund Smart Wallet</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Add assets to your secure automated Smart Wallet account on Base / Sepolia.
            </DialogDescription>
          </DialogHeader>
          {renderFundContent()}
        </DialogContent>
      </Dialog>

      {/* Desktop Withdraw Dialog */}
      <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
        <DialogContent className="max-w-md bg-popover/90 backdrop-blur-xl border p-0 rounded-2xl overflow-hidden shadow-2xl">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle className="font-heading text-lg font-semibold">Withdraw Assets</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Transfer tokens safely from your Smart Wallet to your personal wallet.
            </DialogDescription>
          </DialogHeader>
          {renderWithdrawContent()}
        </DialogContent>
      </Dialog>
    </>
  );
}
