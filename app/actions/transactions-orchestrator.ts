"use server";

import { getMoralisTransactions } from "./transactions-moralis";
import { getAlchemyTransactions } from "./transactions-alchemy";
import { getZapperTransactions } from "./transactions-zapper";
import { ProviderType } from "./portfolio-orchestrator";

export interface UnifiedTransaction {
  id: string;
  hash: string;
  date: string;
  type: "send" | "receive" | "swap" | "contract_execution" | "unknown";
  status: "success" | "pending" | "failed";
  chain: string;
  assetSymbol?: string;
  amount?: string;
  toAddress?: string;
  fromAddress?: string;
  valueUsd?: number;
}

export async function getRecentTransactions(
  address: string,
  provider: ProviderType = "moralis",
  chain: string = "base" // default chain representation
): Promise<UnifiedTransaction[]> {
  console.info(`[TRANSACTIONS ORCHESTRATOR] Fetching transactions for ${address} using ${provider.toUpperCase()} provider.`);
  const unifiedTx: UnifiedTransaction[] = [];

  if (provider === "moralis") {
    // Moralis uses: eth, polygon, base, etc.
    const rawTxs = await getMoralisTransactions(address, chain.toLowerCase());
    
    rawTxs.forEach((tx: any) => {
      // Very basic mapping from Moralis History schema
      const category = tx.category || "unknown";
      let type: UnifiedTransaction["type"] = "unknown";
      
      if (category.includes("send")) type = "send";
      else if (category.includes("receive")) type = "receive";
      else if (category.includes("swap")) type = "swap";
      else if (category.includes("contract")) type = "contract_execution";

      unifiedTx.push({
        id: tx.hash,
        hash: tx.hash,
        date: tx.block_timestamp,
        type,
        status: "success", // Moralis history usually only returns mined txs
        chain,
        assetSymbol: tx.erc20_transfers?.[0]?.token_symbol || "Native",
        amount: tx.erc20_transfers?.[0]?.value_formatted || "0",
        toAddress: tx.to_address,
        fromAddress: tx.from_address,
      });
    });

  } else if (provider === "alchemy") {
    // Alchemy uses: eth-mainnet, base-mainnet, etc.
    const network = chain === "base" ? "base-mainnet" : "eth-mainnet";
    const rawTxs = await getAlchemyTransactions(address, network);

    rawTxs.forEach((tx: any) => {
      // Alchemy getAssetTransfers schema
      unifiedTx.push({
        id: tx.uniqueId || tx.hash,
        hash: tx.hash,
        date: tx.metadata?.blockTimestamp || new Date().toISOString(),
        type: tx.to === address ? "receive" : "send",
        status: "success",
        chain,
        assetSymbol: tx.asset,
        amount: tx.value?.toString() || "0",
        toAddress: tx.to,
        fromAddress: tx.from,
      });
    });

  } else if (provider === "zapper") {
    const rawTxs = await getZapperTransactions(address);

    rawTxs.forEach((tx: any) => {
      let type: UnifiedTransaction["type"] = "unknown";
      if (tx.direction === "IN") type = "receive";
      else if (tx.direction === "OUT") type = "send";
      else if (tx.type) type = "contract_execution";

      unifiedTx.push({
        id: tx.id || tx.hash,
        hash: tx.hash,
        date: new Date(tx.timestamp * 1000).toISOString(),
        type,
        status: "success",
        chain: tx.network || "unknown",
        assetSymbol: tx.type || "Native",
        amount: "0",
        toAddress: tx.destination,
        fromAddress: address,
      });
    });
  } else {
    // Zapper or unsupported fallback
    console.warn(`Transactions provider '${provider}' currently falls back to empty.`);
  }

  // Sort newest first
  return unifiedTx.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
