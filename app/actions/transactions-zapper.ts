"use server";

const isValidEVMAddress = (address: string) => /^0x[a-fA-F0-9]{40}$/.test(address);

export async function getZapperTransactions(address: string) {
  if (!address || !isValidEVMAddress(address)) {
    console.warn(`[ZAPPER TX] Invalid address provided: "${address}"`);
    return [];
  }

  try {
    const apiKey = process.env.ZAPPER_API_KEY;
    if (!apiKey) {
      console.error("[ZAPPER TX] ZAPPER_API_KEY environment variable is not defined!");
      return [];
    }

    const query = `
      query GetTransactionHistory($addresses: [Address!]!) {
        transactionHistory(addresses: $addresses) {
          edges {
            node {
              id
              timestamp
              network
              direction
              type
              destination
              hash
            }
          }
        }
      }
    `;

    console.info(`[ZAPPER TX] Querying transactions history for address ${address}...`);

    const response = await fetch("https://public.zapper.xyz/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-zapper-api-key": apiKey,
      },
      body: JSON.stringify({
        query,
        variables: {
          addresses: [address],
        },
      }),
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      console.error(`[ZAPPER TX] Failed response with status ${response.status} from Zapper GraphQL.`);
      return [];
    }

    const data = await response.json();
    if (data.errors) {
      console.error("[ZAPPER TX] GraphQL errors returned:", data.errors);
      return [];
    }

    const transfers = data.data?.transactionHistory?.edges?.map((e: any) => e.node) || [];
    console.info(`[ZAPPER TX] Successfully fetched ${transfers.length} transactions.`);
    return transfers;
  } catch (error) {
    console.error("[ZAPPER TX] Fatal error during fetch:", error);
    return [];
  }
}
