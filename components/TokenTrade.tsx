"use client";

import { useState, useCallback, useEffect } from "react";
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { VersionedTransaction } from '@solana/web3.js';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";

interface TokenTradeProps {
  tokenMint?: string;
  tokenName?: string;
  tokenSymbol?: string;
  defaultTab?: "buy" | "sell";
}

export const TokenTrade = ({ tokenMint = "", tokenName = "", tokenSymbol = "", defaultTab = "buy" }: TokenTradeProps) => {
  const [tab, setTab] = useState<"buy" | "sell">(defaultTab);
  const { publicKey, connected, signTransaction } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);
  const [tokenCA, setTokenCA] = useState(tokenMint);
  const [amount, setAmount] = useState("");
  const [slippage, setSlippage] = useState(10);
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [txLoading, setTxLoading] = useState(false);

  // Fetch SOL balance when wallet connects
  const fetchBalance = useCallback(async () => {
    if (publicKey) {
      const bal = await connection.getBalance(publicKey);
      setBalance(bal / 1e9);
    }
  }, [publicKey, connection]);

  // Update tokenCA when tokenMint prop changes
  useEffect(() => {
    if (tokenMint) {
      setTokenCA(tokenMint);
    }
  }, [tokenMint]);

  // React to wallet connection
  useEffect(() => {
    if (connected) fetchBalance();
  }, [connected, fetchBalance]);

  // Handle trade (buy/sell)
  const handleTrade = async () => {
    setTxStatus(null);
    if (!connected || !publicKey || !signTransaction) {
      setTxStatus("Connect your wallet to trade.");
      return;
    }
    if (!tokenCA || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setTxStatus("Enter a valid amount.");
      return;
    }
    setTxLoading(true);
    try {
      // Use our internal API endpoint instead of directly calling pumpportal.fun
      const response = await fetch(`/api/trade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicKey: publicKey.toBase58(),
          action: tab,
          mint: tokenCA,
          denominatedInSol: tab === "buy" ? "true" : "false",
          amount: Number(amount),
          slippage: slippage,
          priorityFee: 0.00001,
          pool: "auto"
        })
      });
      if (response.status === 200) {
        const data = await response.arrayBuffer();
        const tx = VersionedTransaction.deserialize(new Uint8Array(data));
        const signed = await signTransaction(tx);
        const sig = await connection.sendTransaction(signed);
        setTxStatus(`Success! Tx: ${sig.slice(0, 8)}...${sig.slice(-8)}`);
        setAmount("");
        fetchBalance();
      } else {
        const errorText = await response.text();
        setTxStatus(`Failed to generate transaction: ${errorText || response.statusText}`);
      }
    } catch (e: any) {
      setTxStatus("Error: " + (e.message || e.toString()));
    }
    setTxLoading(false);
  };

  return (
    <Card className="bg-transparent border border-primary/30 shadow-lg shadow-primary/20 w-full">
      <CardContent className="p-6">
        <Tabs value={tab} onValueChange={(value) => setTab(value as "buy" | "sell")}>
          <TabsList className="grid w-full grid-cols-2 mb-4 bg-primary/10 border border-primary/30">
            <TabsTrigger 
              value="buy" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl transition-all duration-200 hover:scale-105"
            >
              Buy {tokenSymbol || "Token"}
            </TabsTrigger>
            <TabsTrigger 
              value="sell" 
              className="data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground rounded-xl transition-all duration-200 hover:scale-105"
            >
              Sell {tokenSymbol || "Token"}
            </TabsTrigger>
          </TabsList>
          
          {connected && publicKey && (
            <div className="mb-4 text-xs text-foreground bg-primary/10 border border-primary/30 rounded p-2 flex flex-col gap-1">
              <span>Wallet: {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}</span>
              <span>Balance: {balance !== null ? balance.toFixed(4) : '...'} SOL</span>
            </div>
          )}
          
          {(!tokenMint || tokenMint === "") && (
            <div className="mb-2">
              <Input
                className="w-full bg-transparent border border-primary/30 rounded px-3 py-2 text-foreground mb-2 text-xs"
                placeholder="Paste token CA here"
                value={tokenCA}
                onChange={e => setTokenCA(e.target.value)}
              />
            </div>
          )}

          <TabsContent value="buy">
            <div className="flex justify-between mb-2">
              <Button variant="outline" size="sm" className="text-primary border-primary/30 rounded-xl hover:shadow-lg hover:shadow-primary/30 transform transition-all duration-200 hover:scale-105 active:scale-95">
                Set Max Slippage
              </Button>
            </div>
            <div className="flex items-center bg-primary/10 rounded px-3 py-2 mb-3 border border-primary/30">
              <Input
                className="bg-transparent border-none outline-none text-foreground flex-1 text-lg"
                type="number"
                placeholder="0"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                disabled={txLoading}
              />
              <span className="mx-2 text-foreground font-semibold">SOL</span>
              <Image src="/solana.svg" alt="Solana" width={28} height={28} />
            </div>
            <div className="flex gap-2 mb-4">
              <Button variant="outline" size="sm" className="rounded-xl hover:shadow-lg hover:shadow-primary/30 transform transition-all duration-200 hover:scale-105 active:scale-95" onClick={() => setAmount("")}>Reset</Button>
              <Button variant="outline" size="sm" className="rounded-xl hover:shadow-lg hover:shadow-primary/30 transform transition-all duration-200 hover:scale-105 active:scale-95" onClick={() => setAmount("0.1")}>0.1</Button>
              <Button variant="outline" size="sm" className="rounded-xl hover:shadow-lg hover:shadow-primary/30 transform transition-all duration-200 hover:scale-105 active:scale-95" onClick={() => setAmount("0.5")}>0.5</Button>
              <Button variant="outline" size="sm" className="rounded-xl hover:shadow-lg hover:shadow-primary/30 transform transition-all duration-200 hover:scale-105 active:scale-95" onClick={() => setAmount("1")}>1</Button>
              <Button variant="outline" size="sm" className="rounded-xl hover:shadow-lg hover:shadow-primary/30 transform transition-all duration-200 hover:scale-105 active:scale-95" onClick={() => setAmount(balance ? balance.toString() : "")}>Max</Button>
            </div>
            <Button
              className="w-full bg-primary text-primary-foreground font-semibold py-2 rounded-xl mt-2 disabled:opacity-60 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/50 transform transition-all duration-200 hover:scale-105 active:scale-95"
              onClick={handleTrade}
              disabled={!connected || txLoading}
            >
              {txLoading ? 'Processing...' : connected ? 'Buy' : 'Connect Wallet'}
            </Button>
          </TabsContent>

          <TabsContent value="sell">
            <div className="flex justify-end mb-2">
              <Button variant="outline" size="sm" className="rounded-xl hover:shadow-lg hover:shadow-primary/30 transform transition-all duration-200 hover:scale-105 active:scale-95">Set Max Slippage</Button>
            </div>
            <div className="flex items-center bg-primary/10 rounded px-3 py-2 mb-3 border border-primary/30">
              <Input
                className="bg-transparent border-none outline-none text-foreground flex-1 text-lg"
                type="number"
                placeholder="0"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                disabled={txLoading}
              />
              <span className="mx-2 text-foreground font-semibold">{tokenSymbol || "Token"}</span>
              <div className="h-7 w-7 bg-primary/20 border border-primary rounded-full overflow-hidden flex items-center justify-center">
                <span className="text-xs font-bold text-primary">T</span>
              </div>
            </div>
            <div className="flex gap-2 mb-4">
              <Button variant="outline" size="sm" className="rounded-xl hover:shadow-lg hover:shadow-primary/30 transform transition-all duration-200 hover:scale-105 active:scale-95" onClick={() => setAmount("")}>Reset</Button>
              <Button variant="outline" size="sm" className="rounded-xl hover:shadow-lg hover:shadow-primary/30 transform transition-all duration-200 hover:scale-105 active:scale-95" onClick={() => setAmount("25")}>25%</Button>
              <Button variant="outline" size="sm" className="rounded-xl hover:shadow-lg hover:shadow-primary/30 transform transition-all duration-200 hover:scale-105 active:scale-95" onClick={() => setAmount("50")}>50%</Button>
              <Button variant="outline" size="sm" className="rounded-xl hover:shadow-lg hover:shadow-primary/30 transform transition-all duration-200 hover:scale-105 active:scale-95" onClick={() => setAmount("75")}>75%</Button>
              <Button variant="outline" size="sm" className="rounded-xl hover:shadow-lg hover:shadow-primary/30 transform transition-all duration-200 hover:scale-105 active:scale-95" onClick={() => setAmount("100")}>100%</Button>
            </div>
            <Button
              className="w-full bg-destructive text-destructive-foreground font-semibold py-2 rounded-xl mt-2 disabled:opacity-60 hover:bg-destructive/90 hover:shadow-lg hover:shadow-destructive/50 transform transition-all duration-200 hover:scale-105 active:scale-95"
              onClick={handleTrade}
              disabled={!connected || txLoading}
            >
              {txLoading ? 'Processing...' : connected ? 'Sell' : 'Connect Wallet'}
            </Button>
          </TabsContent>
        </Tabs>

        {txStatus && (
          <div className={`mt-4 text-xs rounded-lg p-3 border ${txStatus.startsWith('Success') ? 'bg-primary/10 text-primary border-primary/30' : 'bg-destructive/10 text-destructive border-destructive/30'}`}>
            {txStatus}
          </div>
        )}
        
        {!connected && (
          <div className="mt-4 flex justify-center">
            <WalletMultiButton className="!bg-primary !text-primary-foreground !font-semibold !px-6 !py-2 !rounded-xl !hover:bg-primary/90 !transition-all !duration-200 !border-none !shadow-lg !hover:shadow-primary/50 !transform !hover:scale-105 !active:scale-95" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
