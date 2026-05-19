"use server";

const isValidEVMAddress = (address: string) => /^0x[a-fA-F0-9]{40}$/.test(address);

export async function getAlchemyTransactions(
  address: string,
  network: string = "eth-mainnet"
) {
  if (!address || !isValidEVMAddress(address)) {
    console.warn(`[ALCHEMY TX] Invalid address provided: "${address}"`);
    return [];
  }

  try {
    const apiKey = process.env.NEXT_PUBLIC_ALCHEMY_KEY;
    if (!apiKey) {
      console.error("[ALCHEMY TX] NEXT_PUBLIC_ALCHEMY_KEY environment variable is not defined!");
      return [];
    }

    const url = `https://${network}.g.alchemy.com/v2/${apiKey}`;
    console.info(`[ALCHEMY TX] Querying asset transfers for address ${address} on network ${network}...`);

    const body = {
      id: 1,
      jsonrpc: "2.0",
      method: "alchemy_getAssetTransfers",
      params: [
        {
          fromBlock: "0x0",
          toBlock: "latest",
          toAddress: address,
          category: ["external", "internal", "erc20", "erc721", "erc1155"],
          withMetadata: true,
          excludeZeroValue: true,
          maxCount: "0x14" // limit to 20
        }
      ]
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      next: { revalidate: 60 }
    });

    if (!response.ok) {
      console.error(`[ALCHEMY TX] Failed response with status ${response.status} from Alchemy API.`);
      return [];
    }

    const data = await response.json();
    const resultCount = data.result?.transfers?.length || 0;
    console.info(`[ALCHEMY TX] Successfully fetched ${resultCount} transactions.`);
    return data.result?.transfers || [];
  } catch (error) {
    console.error("[ALCHEMY TX] Fatal error during fetch:", error);
    return [];
  }
}
