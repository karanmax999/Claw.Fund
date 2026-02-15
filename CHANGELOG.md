# Changelog

All notable changes to CLAW.FUND will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-15

### Added
- Initial release of CLAW.FUND platform
- Dashboard with treasury overview and performance metrics
- Live AI trading decision feed via WebSocket
- Governance system with on-chain voting
- Quest system with reward distribution
- Token gating for premium features (100 CLAW for governance, 10 CLAW for quests)
- Integration with 5 smart contracts on Monad Testnet
- Property-based testing suite (39 tests, 1,900+ iterations)
- Comprehensive documentation (setup, deployment, testing guides)
- Error boundaries for graceful error handling
- Rate limiting for contract calls and API requests
- Legal pages (Terms of Service, Privacy Policy)
- Disclaimer banner for testnet warning
- Environment variable validation

### Smart Contracts
- CLAWToken (0x3E53Bf5E22451497a9805703FC7fDcC8e527d5FD)
- AgentTreasury (0xA32CB983689376b8FED765727067069084d1fbb6)
- Governance (0x6726a4A8B149F59Db599FEBF450F279e82951560)
- ProfitDistributor (0x4256b955d4Bf234e484c9A6145F901833881c9e2)
- QuestManager (0x061638608f8CBe21D81d4C95E5208FCC4fa8D74f)

### Technical Stack
- Next.js 14 with App Router
- TypeScript 5
- Wagmi v2 + Viem v2 + RainbowKit v2
- TailwindCSS with custom theme
- Vitest + fast-check for testing
- WebSocket for real-time updates

### Security
- ReentrancyGuard on all critical contracts
- Pausable functionality for emergency stops
- Access control with onlyAgent/onlyGovernance modifiers
- Max allocation risk checks
- SafeERC20 for token transfers
- No upgradeability (immutable contracts)

## [Unreleased]

### Planned
- Production deployment configuration
- Error tracking integration (Sentry)
- Analytics integration
- Mobile responsive improvements
- Accessibility enhancements (WCAG compliance)
- User onboarding flow
- Additional quest types
- Advanced trading strategies
- Multi-chain support

---

## Version History

- **1.0.0** - Initial MVP release (February 15, 2026)
