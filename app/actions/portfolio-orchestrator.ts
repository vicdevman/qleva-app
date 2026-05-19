"use server";

import { getWalletNetWorth } from "./moralis";
import { getZapperPortfolio } from "./zapper";
import { getAlchemyPortfolio } from "./alchemy";

export interface PortfolioAsset {
  symbol: string;
  name: string;
  balance: number;
  value: number;
  allocation: number;
  change24h: number;
  icon: string;
}

export interface UnifiedPortfolioResult {
  error: boolean;
  totalValue: number;
  chainDistribution: { chain: string; value: number; percent: number; color: string }[];
  topAssets: PortfolioAsset[];
}

export type ProviderType = "moralis" | "zapper" | "alchemy";

const CHAIN_COLORS: Record<string, string> = {
  Ethereum: "#627EEA",
  Base: "#0052FF",
  Polygon: "#8247E5",
  Arbitrum: "#28A0F0",
  Optimism: "#FF0420",
  Default: "#8884d8",
};

export async function getLivePortfolio(
  address: string,
  provider: ProviderType = "moralis"
): Promise<UnifiedPortfolioResult> {
  console.info(`[PORTFOLIO ORCHESTRATOR] Fetching portfolio for ${address} using ${provider.toUpperCase()} provider.`);

  if (provider === "zapper") {
    const data = await getZapperPortfolio(address);
    if (!data || !data.data?.portfolioV2?.tokenBalances) {
      return { error: true, totalValue: 0, chainDistribution: [], topAssets: [] };
    }

    const tokenBalances = data.data.portfolioV2.tokenBalances;
    const totalValue = tokenBalances.totalBalanceUSD;

    // Aggregate by network
    const chainMap = new Map<string, number>();
    const topAssets: PortfolioAsset[] = [];

    tokenBalances.byToken.edges.forEach(({ node }) => {
      const chainName = node.network.name;
      chainMap.set(chainName, (chainMap.get(chainName) || 0) + node.balanceUSD);

      // Add to top assets if it has some value
      if (node.balanceUSD > 0.01) {
        topAssets.push({
          symbol: node.symbol,
          name: node.name,
          balance: node.balance,
          value: node.balanceUSD,
          allocation: totalValue > 0 ? Number(((node.balanceUSD / totalValue) * 100).toFixed(1)) : 0,
          change24h: 0, // Placeholder
          icon: node.imgUrlV2 || "$",
        });
      }
    });

    // Sort assets by value descending
    topAssets.sort((a, b) => b.value - a.value);

    const chainDistribution = Array.from(chainMap.entries())
      .map(([chain, value]) => ({
        chain,
        value,
        percent: totalValue > 0 ? Number(((value / totalValue) * 100).toFixed(1)) : 0,
        color: CHAIN_COLORS[chain] || CHAIN_COLORS.Default,
      }))
      .sort((a, b) => b.value - a.value);

    return {
      error: false,
      totalValue,
      chainDistribution,
      topAssets: topAssets.slice(0, 10), // Limit to top 10
    };
  } else if (provider === "moralis") {
    // Moralis fallback
    const data = await getWalletNetWorth(address);
    if (!data) {
      return { error: true, totalValue: 0, chainDistribution: [], topAssets: [] };
    }

    const totalValue = parseFloat(data.total_networth_usd);
    const chainDistribution = data.chains.map((c) => {
      const chainName = c.chain.toLowerCase() === "eth" ? "Ethereum" : c.chain.charAt(0).toUpperCase() + c.chain.slice(1);
      const value = parseFloat(c.networth_usd);
      return {
        chain: chainName,
        value,
        percent: totalValue > 0 ? Number(((value / totalValue) * 100).toFixed(1)) : 0,
        color: CHAIN_COLORS[chainName] || CHAIN_COLORS.Default,
      };
    }).sort((a, b) => b.value - a.value);

    const topAssets: PortfolioAsset[] = [];
    if (data.tokens) {
      data.tokens.forEach(token => {
        if (token.usd_value > 0.01) {
          topAssets.push({
            symbol: token.symbol,
            name: token.name,
            balance: parseFloat(token.balance) / Math.pow(10, token.decimals),
            value: token.usd_value,
            allocation: totalValue > 0 ? Number(((token.usd_value / totalValue) * 100).toFixed(1)) : 0,
            change24h: token.usd_price_24hr_percent_change || 0,
            icon: token.logo || token.thumbnail || "$",
          });
        }
      });
      topAssets.sort((a, b) => b.value - a.value);
    }

    return {
      error: false,
      totalValue,
      chainDistribution,
      topAssets: topAssets.slice(0, 10), // Limit to top 10
    };
  } else if (provider === "alchemy") {
    // Alchemy fallback
    const data = await getAlchemyPortfolio(address);
    if (!data) {
      return { error: true, totalValue: 0, chainDistribution: [], topAssets: [] };
    }

    let totalValue = 0;
    const chainMap = new Map<string, number>();
    const topAssets: PortfolioAsset[] = [];

    data.forEach(chainData => {
      let chainTotal = 0;
      (chainData.tokens || []).forEach((t: any) => {
        if (t.metadata?.decimals === undefined || t.metadata?.decimals === null) return;
        
        // Convert hex string to decimal and apply decimals
        const rawBalance = BigInt(t.tokenBalance).toString();
        const divisor = Math.pow(10, t.metadata.decimals);
        const balance = Number(rawBalance) / divisor;
        const price = t.priceUSD || 0;
        const value = balance * price;

        if (balance > 0) {
          chainTotal += value;
          topAssets.push({
            symbol: t.metadata.symbol || "UNKNOWN",
            name: t.metadata.name || "Unknown Token",
            balance: balance,
            value: value,
            allocation: 0, // Calculated later
            change24h: 0,
            icon: t.metadata.logo || "$",
          });
        }
      });
      totalValue += chainTotal;
      if (chainTotal > 0) {
        chainMap.set(chainData.chain, chainTotal);
      }
    });

    topAssets.forEach(asset => {
      asset.allocation = totalValue > 0 ? Number(((asset.value / totalValue) * 100).toFixed(1)) : 0;
    });

    topAssets.sort((a, b) => b.value - a.value);

    const chainDistribution = Array.from(chainMap.entries())
      .map(([chain, value]) => ({
        chain,
        value,
        percent: totalValue > 0 ? Number(((value / totalValue) * 100).toFixed(1)) : 0,
        color: CHAIN_COLORS[chain] || CHAIN_COLORS.Default,
      }))
      .sort((a, b) => b.value - a.value);

    return {
      error: false,
      totalValue,
      chainDistribution,
      topAssets: topAssets.slice(0, 10),
    };
  } else {
    return { error: true, totalValue: 0, chainDistribution: [], topAssets: [] };
  }
}
