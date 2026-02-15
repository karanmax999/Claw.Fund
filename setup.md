# CLAW.FUND Setup Instructions

## Quick Setup (5 Minutes)

### Step 1: Get WalletConnect Project ID
1. Go to https://cloud.walletconnect.com/
2. Sign up or log in
3. Create a new project
4. Copy your Project ID

### Step 2: Configure Environment
```bash
# Update .env.local with your WalletConnect Project ID
# Replace 'your_walletconnect_project_id_here' with your actual ID
```

### Step 3: Install Dependencies
```bash
# Frontend
npm install

# Backend
cd backend
npm install
cd ..
```

### Step 4: Start Services
```bash
# Terminal 1: Start Backend
cd backend
npm start

# Terminal 2: Start Frontend
npm run dev
```

### Step 5: Access Application
- Frontend: http://localhost:3000
- Backend WebSocket: ws://localhost:8080

## Verification Checklist

- [ ] WalletConnect Project ID configured in .env.local
- [ ] Backend running on port 8080
- [ ] Frontend running on port 3000
- [ ] Can connect wallet
- [ ] Can see treasury data
- [ ] Live feed shows "CONNECTED" status

## Troubleshooting

### "Missing environment variables"
→ Check .env.local has WalletConnect Project ID

### "WebSocket connection failed"
→ Ensure backend is running: `cd backend && npm start`

### "Cannot connect wallet"
→ Verify WalletConnect Project ID is valid

### "Contract read failed"
→ Check Monad testnet RPC is accessible

## Next Steps

1. Connect your wallet
2. Switch to Monad Testnet
3. Get test MON from faucet
4. Explore the dashboard
5. Try governance voting (requires 100 CLAW)
6. Complete quests (requires 10 CLAW)

## Support

- Documentation: See README.md
- Quick Start: See QUICK_START.md
- Issues: Check TROUBLESHOOTING.md
