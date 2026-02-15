# CLAW.FUND Quick Start Guide

## 🚀 Get Running in 5 Minutes

### 1. Clone and Install
```bash
git clone <your-repo>
cd Claw.Fund
npm install
```

### 2. Configure Environment
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your WalletConnect Project ID:
```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

Get your Project ID from: https://cloud.walletconnect.com/

### 3. Start Development
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend (optional, for live trading data)
cd backend
npm install
npm start
```

### 4. Access the App
- Frontend: http://localhost:3000
- Backend WebSocket: ws://localhost:8080

### 5. Connect Wallet
1. Click "Connect Wallet" in the app
2. Select MetaMask or your preferred wallet
3. Approve the connection
4. Switch to Monad Testnet if prompted

## 📋 What's Integrated

✅ **Treasury Dashboard** - Real contract data from AgentTreasury  
✅ **Live Trading Feed** - WebSocket updates from backend  
✅ **Governance** - Vote on proposals (requires 100 CLAW)  
✅ **Quests** - Complete on-chain quests (requires 10 CLAW)  
✅ **Token Gating** - Access control based on CLAW balance  

## 🧪 Run Tests
```bash
npm test
```

**Test Coverage**: 39 property-based tests with 1,900+ iterations

## 📚 Documentation

- **Setup**: See `INTEGRATION_SETUP.md`
- **Deployment**: See `DEPLOYMENT_GUIDE.md`
- **Testing**: See `USER_TESTING_GUIDE.md`

## 🔧 Common Issues

**"Missing environment variables"**
→ Ensure `.env.local` exists with all required variables

**"WebSocket connection failed"**
→ Start the backend: `cd backend && npm start`

**"Contract read failed"**
→ Check Monad testnet RPC is accessible

**"Transaction failed"**
→ Ensure wallet has MON for gas and CLAW for features

## 📞 Need Help?

Check the troubleshooting sections in:
- `INTEGRATION_SETUP.md` - Setup issues
- `DEPLOYMENT_GUIDE.md` - Production issues
- `USER_TESTING_GUIDE.md` - Testing questions

## 🎯 Next Steps

1. **Development**: Make changes and test locally
2. **Testing**: Run `npm test` before committing
3. **Deployment**: Follow `DEPLOYMENT_GUIDE.md`
4. **User Testing**: Use `USER_TESTING_GUIDE.md`

---

**Status**: ✅ MVP Complete - Ready for Production
**Version**: 1.0.0
**Last Updated**: 2026-02-14