"use server";

const isValidEVMAddress = (address: string) => /^0x[a-fA-F0-9]{40}$/.test(address);

export interface MoralisTokenBalance {
  token_address: string;
  name: string;
  symbol: string;
  logo?: string;
  thumbnail?: string;
  decimals: number;
  balance: string;
  possible_spam: boolean;
  verified_contract: boolean;
  usd_price: number;
  usd_price_24hr_percent_change: number;
  usd_value: number;
  portfolio_percentage: number;
}

export interface MoralisChainBalance {
  chain: string;
  native_balance: string;
  native_balance_formatted: string;
  native_balance_usd: string;
  token_balance_usd: string;
  networth_usd: string;
}

export interface MoralisNetWorthResponse {
  total_networth_usd: string;
  chains: MoralisChainBalance[];
  tokens: MoralisTokenBalance[]; // Custom added by our wrapper
}

export async function getWalletNetWorth(
  address: string,
  chains: string[] = ["base"] // "eth", 
): Promise<MoralisNetWorthResponse | null> {
  if (!address || !isValidEVMAddress(address)) {
    console.warn(`Moralis: Skipping invalid address: ${address}`);
    return null;
  }

  try {
    const apiKey = process.env.MORALIS_API_KEY;
    if (!apiKey) {
      console.warn("MORALIS_API_KEY is not set.");
      return null;
    }

    const searchParams = new URLSearchParams();
    chains.forEach((chain) => searchParams.append("chains", chain));

    const netWorthUrl = `https://deep-index.moralis.io/api/v2.2/wallets/${address}/net-worth?${searchParams.toString()}`;

    // Fetch Net Worth
    const netWorthPromise = fetch(netWorthUrl, {
      method: "GET",
      headers: {
        "X-API-Key": apiKey,
        "Accept": "application/json",
      },
      next: { revalidate: 60 } // Cache for 60 seconds
    });

    // Fetch Tokens for each chain
    const tokenPromises = chains.map(chain => 
      fetch(`https://deep-index.moralis.io/api/v2.2/wallets/${address}/tokens?chain=${chain}&exclude_spam=true`, {
        method: "GET",
        headers: {
          "X-API-Key": apiKey,
          "Accept": "application/json",
        },
        next: { revalidate: 60 }
      }).then(res => res.ok ? res.json() : null)
    );

    const [netWorthRes, ...tokenResponses] = await Promise.all([netWorthPromise, ...tokenPromises]);

    if (!netWorthRes.ok) {
      console.error(`Moralis API error: ${netWorthRes.status} ${netWorthRes.statusText}`);
      return null;
    }

    const netWorthData = await netWorthRes.json();
    
    // Combine tokens
    let allTokens: MoralisTokenBalance[] = [];
    tokenResponses.forEach(res => {
      if (res && res.result && Array.isArray(res.result)) {
        allTokens = allTokens.concat(res.result);
      } else if (Array.isArray(res)) {
        allTokens = allTokens.concat(res);
      }
    });

    return {
      ...netWorthData,
      tokens: allTokens
    };
  } catch (error) {
    console.error("Error fetching wallet net worth from Moralis:", error);
    return null;
  }
}
