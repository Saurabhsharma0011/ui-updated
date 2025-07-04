# Token Platform

A Next.js application for displaying and trading tokens on the Solana blockchain with real-time OHLC candlestick charts.

## Features

- Real-time token updates via WebSocket connection
- Solana wallet integration (Phantom, Solflare, Backpack)
- Buy/sell tokens directly from the interface
- View token details, prices, and market data
- **NEW**: OHLC Candlestick Charts with MEVX API integration
- **NEW**: Detailed token modal with chart, overview, and trading tabs
- Create new tokens

## New Chart Functionality - Complete Flow

### Step-by-Step Implementation

**Step 1: Listen to WebSocket messages from pump.fun**
- ✅ Enhanced WebSocket listener in `useWebSocket.ts`
- ✅ Captures all raw message structures with detailed logging
- ✅ Identifies token creation events from multiple message formats

**Step 2: Extract bondingCurveKey from each token creation event**
- ✅ Advanced extraction logic in `extractOrDeriveBondingCurve()`
- ✅ Tries multiple field patterns from pump.fun messages
- ✅ Falls back to deterministic PDA derivation using mint address
- ✅ Validates extracted addresses using Solana PublicKey validation

**Step 3: Use bondingCurveKey as the pool address**
- ✅ Automatically stores bonding curve keys in token data
- ✅ Displays bonding curve addresses in token cards for verification
- ✅ Shows green indicator dot when chart data is available

**Step 4: Call MEVX API with this pool address to fetch OHLC data**
- ✅ Automatic API calls to `/api/candlesticks` with real bonding curve addresses
- ✅ Real-time OHLC data fetching using extracted bonding curve keys
- ✅ Fallback error handling when bonding curve data is unavailable

**Step 5: Use the OHLC data to render a trading chart for that token**
- ✅ Interactive candlestick charts using lightweight-charts library
- ✅ Real-time price statistics (24h high/low, volume, price changes)
- ✅ Responsive chart design matching platform theme
- ✅ Auto-refresh functionality with rate limiting

### Technical Implementation Details

#### Bonding Curve Extraction (`lib/bondingCurve.ts`)
```typescript
// Deterministic PDA derivation for pump.fun bonding curves
const [bondingCurveAddress] = PublicKey.findProgramAddressSync(
  [Buffer.from("bonding-curve"), mintPublicKey.toBuffer()],
  programPublicKey
)
```

#### Enhanced WebSocket Processing
- **Raw message analysis** with detailed field logging
- **Multiple extraction patterns** for different pump.fun message formats
- **Automatic bonding curve derivation** when not explicitly provided
- **Real-time validation** of extracted addresses

#### Chart Data Pipeline
1. **Token created** → WebSocket receives event
2. **Bonding curve extracted** → From message or derived from mint
3. **Chart data fetched** → MEVX API called with bonding curve address
4. **Chart rendered** → Interactive candlestick display with statistics

### OHLC Candlestick Charts
- **Real-time OHLC data** from MEVX API using actual bonding curve addresses
- **Interactive candlestick charts** using lightweight-charts library
- **Price statistics** including 24h high/low, volume, and price changes
- **Automatic data fetching** when token details are opened with valid bonding curves

### Chart Features
- **Green indicator dots** on "View Details" buttons when chart data is available
- **Bonding curve address display** in token cards for verification
- **Error handling** for missing bonding curve data
- **Auto-refresh** functionality with rate limiting
- **Responsive design** matching the dark theme

### MEVX API Integration
- **Endpoint**: `GET /api/candlesticks`
- **Real Parameters**: 
  - `poolAddress`: Extracted or derived bonding curve address
  - `timeBucket`: Time interval (default: "1s")
  - `limit`: Number of candles (default: "10000")
- **Real Response**: Live OHLC candlestick data with volume from pump.fun bonding curves

### How It Works
1. **Click "View Details"** on any token card
2. **Navigate to "Chart" tab** in the token detail modal
3. **OHLC data is automatically fetched** from MEVX API
4. **Interactive candlestick chart** is rendered with price statistics
5. **Refresh functionality** to update chart data

## Getting Started

1. Clone the repository
2. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

## Usage

### Connect Your Wallet

Click the "Connect Wallet" button in the top navigation to connect your Solana wallet (Phantom, Solflare, or Backpack).

### Viewing Tokens

The home page displays tokens in three categories:
- New Tokens (<$10K market cap)
- Bonding Tokens ($10K - $50K market cap)
- Graduated Tokens (>$50K market cap)

### Viewing Token Charts

1. Click **"View Details"** on any token card
2. A detailed modal will open with three tabs:
   - **Overview**: Token information, price data, and social links
   - **Chart**: Interactive OHLC candlestick chart with real-time data
   - **Trade**: Buy/sell interface for the token

### Trading Tokens

Click **"Trade [Symbol]"** on any token card or use the Trade tab in the detail modal to:
- Buy tokens with SOL
- Sell tokens for SOL
- Set custom amounts or use preset buttons
- Monitor transaction status

## Technical Details

### Chart Implementation
- **Library**: lightweight-charts v5.0.8
- **Data Source**: MEVX API (https://api.mevx.io/api/v1/candlesticks)
- **Chart Type**: Candlestick with volume data
- **Styling**: Dark theme matching the platform design

### API Endpoints
- `/api/candlesticks` - Fetches OHLC data from MEVX API
- `/api/trade` - Proxy to pumpportal.fun trading API
- `/api/proxy/mevx` - Price data from MevX API
- `/api/proxy/dexscreener` - DEX screening data

### Components
- `CandlestickChart` - Interactive chart component
- `TokenDetailModal` - Detailed token view with tabs
- `useCandlestickData` - Hook for fetching OHLC data

## Environment Variables

No additional environment variables are required for the chart functionality.

## Dependencies

### New Dependencies Added
- `lightweight-charts` - For rendering candlestick charts

### Existing Dependencies
- `@solana/web3.js` - Solana blockchain interaction
- `@solana/wallet-adapter-*` - Wallet connectivity
- `next` - React framework
- `tailwindcss` - Styling
- Various UI components from Radix UI

## Demo Note

The current implementation uses a sample pool address for demonstration purposes. In a production environment, you would need to:

1. **Obtain the actual bonding curve pool address** for each token
2. **Store pool addresses** in your database or token metadata
3. **Pass the correct pool address** to the MEVX API

## Build and Deploy

```bash
# Build the project
npm run build

# Start production server
npm start
```

The application builds successfully and is ready for deployment.

## API Rate Limits

The MEVX API may have rate limits. The implementation includes:
- **Batch processing** of requests
- **Delay between requests** to respect rate limits
- **Error handling** for failed requests
- **Retry functionality** for users

To trade a token:
1. Click the "Trade" button on any token card
2. A dialog will open with buy/sell options
3. Enter the amount you want to trade
4. Click "Buy" or "Sell" to execute the trade

Alternatively, you can go to the "/trade" page to trade any token by entering its Contract Address (CA).

### Creating Tokens

To create a new token, click the "Create Coin" button and follow the instructions.

## Architecture

- Next.js frontend with React components
- Solana wallet adapter for wallet connections
- Real-time updates via WebSocket
- API routes for trade execution

## Dependencies

- Next.js
- React
- @solana/wallet-adapter-react
- @solana/web3.js
- shadcn/ui components
- Tailwind CSS

## updated the database with supabase
just just need to create .env.local 
paste you supabse_project_url = **************************
you supabase anon link = **************************

## updated the bounding curve of each newly created token through gprc which i got through a github repo
## will update the github link also later
#   r e v e e e l a i  
 #   r e v e e e l a i  
 #   c h e c k  
 #   u i - u p d a t e d  
 #   u i - u p d a t e d  
 