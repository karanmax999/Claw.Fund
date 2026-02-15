# CLAW.FUND Production Deployment Guide

## Pre-Deployment Checklist

### ✅ Code Quality
- [x] All 39 property-based tests passing
- [x] TypeScript compilation successful
- [x] No console errors in development
- [x] Contract ABIs up to date
- [x] Environment variables validated

### ✅ Security
- [ ] Environment variables secured (not committed to git)
- [ ] WalletConnect Project ID configured
- [ ] RPC endpoints rate-limited
- [ ] Contract addresses verified on explorer
- [ ] No private keys in codebase

### ✅ Performance
- [ ] Contract read caching configured
- [ ] WebSocket reconnection tested
- [ ] Loading states implemented
- [ ] Error boundaries in place
- [ ] Mobile responsiveness verified

## Deployment Steps

### 1. Environment Configuration

Create production `.env.local`:

```bash
# Production Contract Addresses (Monad Testnet)
NEXT_PUBLIC_CLAW_TOKEN_ADDRESS=0x3E53Bf5E22451497a9805703FC7fDcC8e527d5FD
NEXT_PUBLIC_AGENT_TREASURY_ADDRESS=0xA32CB983689376b8FED765727067069084d1fbb6
NEXT_PUBLIC_GOVERNANCE_ADDRESS=0x6726a4A8B149F59Db599FEBF450F279e82951560
NEXT_PUBLIC_PROFIT_DISTRIBUTOR_ADDRESS=0x4256b955d4Bf234e484c9A6145F901833881c9e2
NEXT_PUBLIC_QUEST_MANAGER_ADDRESS=0x061638608f8CBe21D81d4C95E5208FCC4fa8D74f

# Production Network
NEXT_PUBLIC_MONAD_RPC_URL=https://testnet-rpc.monad.xyz
NEXT_PUBLIC_CHAIN_ID=10143

# Production WebSocket (Update with your backend URL)
NEXT_PUBLIC_WS_URL=wss://your-backend-domain.com

# WalletConnect (Get from https://cloud.walletconnect.com/)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_production_project_id

# Feature Flags
NEXT_PUBLIC_ENABLE_DEMO_MODE=false
```

### 2. Build for Production

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build production bundle
npm run build

# Test production build locally
npm start
```

### 3. Deploy Frontend

#### Option A: Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
# Project Settings > Environment Variables
```

#### Option B: Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod

# Set environment variables in Netlify dashboard
```

#### Option C: Custom Server

```bash
# Build
npm run build

# Copy .next folder and node_modules to server
# Run with PM2 or similar process manager
pm2 start npm --name "claw-fund" -- start
```

### 4. Deploy Backend Trading Agent

```bash
cd backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with production values

# Start with PM2
pm2 start src/index.ts --name "claw-agent"

# Enable startup on boot
pm2 startup
pm2 save
```

### 5. Configure WebSocket Server

Ensure backend WebSocket server is:
- Running on a stable port (default: 8080)
- Behind SSL/TLS (wss://)
- Accessible from frontend domain
- Configured with CORS if needed

Example Nginx configuration:

```nginx
server {
    listen 443 ssl;
    server_name api.your-domain.com;

    location /ws {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

### 6. Verify Deployment

Run through this checklist:

```bash
# 1. Check frontend is accessible
curl https://your-domain.com

# 2. Verify environment variables loaded
# Open browser console and check for validation errors

# 3. Test contract reads
# Connect wallet and check if treasury data loads

# 4. Test WebSocket connection
# Check LiveFeed for connection status

# 5. Test transactions
# Try voting on a proposal or completing a quest
```

## Post-Deployment Monitoring

### Health Checks

Set up monitoring for:

1. **Frontend Health**
   - Endpoint: `/api/health`
   - Expected: 200 OK with status

2. **Backend Health**
   - Endpoint: `/health`
   - Expected: WebSocket connection count, DB status

3. **Contract Availability**
   - Monitor RPC endpoint response times
   - Track failed contract reads

### Logging

Enable production logging:

```typescript
// Add to src/lib/logger.ts
export function logError(error: Error, context: Record<string, any>) {
  console.error('[CLAW.FUND Error]', {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  });
  
  // Send to error tracking service (Sentry, etc.)
  // sentry.captureException(error, { extra: context });
}
```

### Metrics to Track

- **User Engagement**
  - Wallet connections
  - Votes cast
  - Quests completed
  - Average session duration

- **System Performance**
  - Contract read success rate
  - WebSocket uptime
  - Transaction success rate
  - Page load times

- **Trading Activity**
  - Trades executed
  - PnL performance
  - Treasury value changes

## Rollback Plan

If issues occur:

1. **Immediate Rollback**
   ```bash
   # Vercel
   vercel rollback
   
   # Netlify
   netlify rollback
   
   # Custom server
   pm2 restart claw-fund --update-env
   ```

2. **Investigate Issues**
   - Check error logs
   - Review recent changes
   - Test in staging environment

3. **Fix and Redeploy**
   - Apply fixes
   - Run full test suite
   - Deploy with caution

## Scaling Considerations

### Frontend Scaling

- Use CDN for static assets
- Enable caching headers
- Implement service worker for offline support
- Consider edge deployment (Vercel Edge, Cloudflare Workers)

### Backend Scaling

- Use load balancer for multiple backend instances
- Implement Redis for shared state
- Scale WebSocket connections horizontally
- Monitor database performance

### Contract Interaction Scaling

- Implement request batching
- Use multicall for multiple reads
- Cache frequently accessed data
- Implement rate limiting

## Security Best Practices

1. **Environment Variables**
   - Never commit `.env.local` to git
   - Use secrets management (Vercel Secrets, AWS Secrets Manager)
   - Rotate WalletConnect Project ID periodically

2. **Contract Interactions**
   - Validate all user inputs
   - Implement transaction limits
   - Add confirmation dialogs for large transactions
   - Monitor for suspicious activity

3. **WebSocket Security**
   - Use WSS (WebSocket Secure)
   - Implement authentication if needed
   - Rate limit connections
   - Validate all incoming messages

## Troubleshooting Production Issues

### Issue: Contract reads failing

**Symptoms**: Treasury data not loading, "Failed to load" errors

**Solutions**:
1. Check RPC endpoint status
2. Verify contract addresses
3. Check network connectivity
4. Review rate limiting

### Issue: WebSocket disconnections

**Symptoms**: LiveFeed shows "DISCONNECTED", no real-time updates

**Solutions**:
1. Check backend server status
2. Verify WebSocket URL (wss://)
3. Check firewall/proxy settings
4. Review connection logs

### Issue: Transactions failing

**Symptoms**: Votes/quests not completing, transaction errors

**Solutions**:
1. Check user has sufficient gas (MON)
2. Verify user has required CLAW tokens
3. Check contract is not paused
4. Review transaction logs

## Support and Maintenance

### Regular Maintenance Tasks

- **Daily**: Monitor error logs and metrics
- **Weekly**: Review performance metrics, check for updates
- **Monthly**: Security audit, dependency updates
- **Quarterly**: Full system review, load testing

### Emergency Contacts

- **Frontend Issues**: [Your team contact]
- **Backend Issues**: [Your team contact]
- **Contract Issues**: [Your team contact]
- **Infrastructure**: [Your hosting provider]

## Success Metrics

Track these KPIs post-deployment:

- **Uptime**: Target 99.9%
- **Response Time**: < 2s for page loads
- **Transaction Success Rate**: > 95%
- **WebSocket Uptime**: > 99%
- **User Satisfaction**: Monitor feedback

---

**Deployment Status**: Ready for Production ✅
**Last Updated**: 2026-02-14
**Version**: 1.0.0