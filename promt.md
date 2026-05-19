You are a **senior Design engineer** with **10 years of experience**.

Go to the readme file and see the details taht i want to be scafolded. 

go to components/ui see all the components there ssidebar...... 

read global.css see the color combo. and i want you to scaffold everything in the readme file 


read package.json you'll see framer motion, zustand, tanstack query and moree... use them well here, when you scaffold th project use real dtaa dummy data, setu p tanstack query and zustand, ensure it follows a clean user flow. this system should be modular cllean and well named and organized, as well as a have a clean ux and ui, with clean modern animations. ensure to use the shadcn components. 

only work on the authenticated pages, Again READ TEH readme and act accordingly and deliver 

ensure you build for responsiveness. 

- **Follow user prompts to their most accurate end**. Interpret intent and choose the best implementation strategy.

**Documentation**: Add concise comments explaining why each change was made.
- **Design Excellence**: Apply premium UI/UX standards (glassmorphism, micro‑animations, modern typography) for any visual changes.
- **Testing**: Run relevant linting and unit tests after each modification.

## Operational Steps
1. **Plan** – Outline required changes.
2. **Implement** – Modify code/files.
4. **Validate** – Execute tests/linting.
5. **Iterate** – Fix issues if any.
6. **Complete** – Mark task as `done` with attached screenshot evidence.



////////////////////////////////////////////////////////////////////////////////////

hey, look at crossChain balances.tsx and se how computing and feattching wallets balances was don,then go aheda to implement for this app, ensure to fetch asesest of a wallet and replace teh dummy one on the portfolio page also those are just assest you can get the price for each token here https://api.g.alchemy.com/prices/v1
/{apiKey}/tokens/by-address

curl --request POST \
  --url https://api.g.alchemy.com/prices/v1/docs-demo/tokens/by-address \
  --header 'Content-Type: application/json' \
  --data '{
  "addresses": [
    {
      "network": "eth-mainnet",
      "address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
    }
  ]
}'


and we'll get this 
{
  "data": [
    {
      "network": "string",
      "address": "string",
      "prices": [
        {
          "currency": "string",
          "value": "string",
          "lastUpdatedAt": "string"
        }
      ],
      "error": "string"
    }
  ]
}

to get token meta data use 

curl --request POST \
  --url https://eth-mainnet.g.alchemy.com/v2/docs-demo \
  --header 'Content-Type: application/json' \
  --data '{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "alchemy_getTokenMetadata",
  "params": [
    "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
  ]
}'

and well get 
200
Success

{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "name": "USD Coin",
    "symbol": "USDC",
    "decimals": 6,
    "logo": "https://static.alchemyapi.io/images/assets/3408.png"
  }
}


with this we should be able to accuulate the balance and assetsdetails. 

