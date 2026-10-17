# RestoStock — Restaurant Inventory Demo

Two-branch inventory, daily sales and closing-report demo. Next.js 14 + Tailwind CSS. No backend: data lives in the browser (localStorage) and comes pre-loaded with 8 days of sample data.

## Run locally

```bash
npm install
npm run dev
```

## Deploy to Vercel

Option A (CLI):

```bash
npm i -g vercel
vercel --prod
```

Option B: push this folder to GitHub, then on vercel.com click **Add New → Project**, import the repo and press **Deploy**. No settings or environment variables are needed.

## Demo flow for the client

1. **Home** — today's received stock, sales and profit/loss %, 7-day trend, both branches side by side.
2. **Intake** — log a warehouse delivery for a branch.
3. **Sales** — record sales; the app stops you selling more than is in stock.
4. **Report** — closing report with profit/loss %, share on WhatsApp or print as PDF.
5. **Stock** — live stock per branch with low-stock alerts.

Use the Branch 1 / Branch 2 switch at the top. **Reset demo data** restores the sample data.

## How the numbers work

- Stock on hand = everything received minus everything sold, up to the selected date.
- Cost of goods sold = units sold × weighted-average purchase cost of that item.
- Profit = sales − cost of goods sold. Profit % = profit ÷ cost of goods sold.
