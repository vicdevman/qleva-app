"use server";

export interface ZapperTokenNode {
  symbol: string;
  tokenAddress: string;
  balance: number;
  balanceUSD: number;
  price: number;
  imgUrlV2: string;
  name: string;
  network: {
    name: string;
  };
}

export interface ZapperResponse {
  data: {
    portfolioV2: {
      tokenBalances: {
        totalBalanceUSD: number;
        byToken: {
          totalCount: number;
          edges: { node: ZapperTokenNode }[];
        };
      };
    };
  };
  errors?: any[];
}

const ZAPPER_QUERY = `
  query TokenBalances($addresses: [Address!]!, $first: Int, $chainIds: [Int!]) {
    portfolioV2(addresses: $addresses, chainIds: $chainIds) {
      tokenBalances {
        totalBalanceUSD
        byToken(first: $first) {
          totalCount
          edges {
            node {
              symbol
              tokenAddress
              balance
              balanceUSD
              price
              imgUrlV2
              name
              network {
                name
              }
            }
          }
        }
      }
    }
  }
`;

const isValidEVMAddress = (address: string) => /^0x[a-fA-F0-9]{40}$/.test(address);

export async function getZapperPortfolio(
  address: string,
  chainIds: number[] = [8453] // Default to Base and this is Ethereum [, 1]
): Promise<ZapperResponse | null> {
  if (!address || !isValidEVMAddress(address)) {
    console.warn(`Zapper: Skipping invalid address: ${address}`);
    return null;
  }

  try {
    const apiKey = process.env.ZAPPER_API_KEY;
    if (!apiKey) {
      console.warn("ZAPPER_API_KEY is not set.");
      return null;
    }

    const response = await fetch("https://public.zapper.xyz/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-zapper-api-key": apiKey,
      },
      body: JSON.stringify({
        query: ZAPPER_QUERY,
        variables: {
          addresses: [address],
          first: 20,
          chainIds: chainIds,
        },
      }),
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      console.error(`Zapper API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const json = await response.json();
    if (json.errors) {
      console.error("Zapper GraphQL errors:", json.errors);
      return null;
    }

    return json;
  } catch (error) {
    console.error("Error fetching portfolio from Zapper:", error);
    return null;
  }
}
