"use server";

const isValidEVMAddress = (address: string) => /^0x[a-fA-F0-9]{40}$/.test(address);

export async function getMoralisTransactions(
  address: string,
  chain: string = "eth"
) {
  if (!address || !isValidEVMAddress(address)) {
    console.warn(`[MORALIS TX] Invalid EVM address provided: "${address}"`);
    return [];
  }

  try {
    const apiKey = process.env.MORALIS_API_KEY;
    if (!apiKey) {
      console.error("[MORALIS TX] MORALIS_API_KEY environment variable is not defined!");
      return [];
    }

    const url = `https://deep-index.moralis.io/api/v2.2/wallets/${address}/history?chain=${chain}&order=DESC`;
    console.info(`[MORALIS TX] Querying history for address ${address} on chain ${chain}...`);
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-API-Key": apiKey,
        "Accept": "application/json",
      },
      next: { revalidate: 60 }
    });

    if (!response.ok) {
      console.error(`[MORALIS TX] Failed response with status ${response.status} from Moralis API.`);
      return [];
    }

    const data = await response.json();
    const resultCount = data.result?.length || 0;
    console.info(`[MORALIS TX] Successfully fetched ${resultCount} transactions.`);
    return data.result || [];
  } catch (error) {
    console.error("[MORALIS TX] Fatal error during fetch:", error);
    return [];
  }
}
