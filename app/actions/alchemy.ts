"use server";

export interface AlchemyTokenBalance {
  contractAddress: string;
  tokenBalance: string;
}

export interface AlchemyTokenMetadata {
  decimals: number | null;
  logo: string | null;
  name: string | null;
  symbol: string | null;
}

export interface AlchemyTokenPrice {
  network: string;
  address: string;
  price: string;
  timestamp: string;
}

const ALCHEMY_NETWORKS: Record<string, string> = {
  "Ethereum": "eth-mainnet",
  "Polygon": "polygon-mainnet",
  "Base": "base-mainnet",
  "Arbitrum": "arb-mainnet",
  "Optimism": "opt-mainnet",
};

const isValidEVMAddress = (address: string) => /^0x[a-fA-F0-9]{40}$/.test(address);

export async function getAlchemyPortfolio(
  address: string,
  chains: string[] = ["Base"] // "Ethereum"
) {
  if (!address || !isValidEVMAddress(address)) {
    console.warn(`Alchemy: Skipping invalid address: ${address}`);
    return null;
  }

  try {
    const apiKey = process.env.NEXT_PUBLIC_ALCHEMY_KEY;
    if (!apiKey) {
      console.warn("NEXT_PUBLIC_ALCHEMY_KEY is not set.");
      return null;
    }

    const networkPromises = chains.map(async (chainName) => {
      const network = ALCHEMY_NETWORKS[chainName];
      if (!network) return { chain: chainName, balances: [] };

      const url = `https://${network}.g.alchemy.com/v2/${apiKey}`;

      // 1. Fetch Token Balances
      const balanceRes = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "alchemy_getTokenBalances",
          params: [address, "erc20"],
          id: 1,
        }),
      });
      
      const balanceJson = await balanceRes.json();
      if (!balanceJson.result?.tokenBalances) return { chain: chainName, balances: [] };

      // Filter out zero balances
      const activeTokens = balanceJson.result.tokenBalances.filter((t: AlchemyTokenBalance) => 
        t.tokenBalance !== "0x0" && t.tokenBalance !== "0" && t.tokenBalance !== "0x"
      );

      // 2. Fetch Metadata for active tokens
      const metadataPromises = activeTokens.map(async (t: AlchemyTokenBalance) => {
        const metaRes = await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "alchemy_getTokenMetadata",
            params: [t.contractAddress],
            id: 2,
          }),
        });
        const metaJson = await metaRes.json();
        return { ...t, metadata: metaJson.result as AlchemyTokenMetadata };
      });

      const enrichedTokens = await Promise.all(metadataPromises);

      // 3. Fetch Prices (Alchemy API)
      const pricesRes = await fetch(`https://api.g.alchemy.com/prices/v1/${apiKey}/tokens/by-address`, {
        method: "POST",
        headers: { "content-type": "application/json", "accept": "application/json" },
        body: JSON.stringify({
          addresses: enrichedTokens.map(t => ({ network, address: t.contractAddress }))
        }),
      });

      const pricesJson = await pricesRes.json();
      const pricesMap = new Map<string, number>();
      if (pricesJson.data) {
        pricesJson.data.forEach((p: any) => {
          if (!p.error && p.prices && p.prices.length > 0) {
            pricesMap.set(p.address.toLowerCase(), parseFloat(p.prices[0].value));
          }
        });
      }

      return {
        chain: chainName,
        tokens: enrichedTokens.map(t => ({
          ...t,
          priceUSD: pricesMap.get(t.contractAddress.toLowerCase()) || 0
        }))
      };
    });

    const results = await Promise.all(networkPromises);
    return results;

  } catch (error) {
    console.error("Alchemy API Error:", error);
    return null;
  }
}
