export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      
      <div className="space-y-6 text-claw-dim">
        <section>
          <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
          <p>
            By accessing and using CLAW.FUND, you accept and agree to be bound by these Terms of Service. 
            If you do not agree to these terms, please do not use the platform.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">2. Testnet Disclaimer</h2>
          <p className="mb-3">
            CLAW.FUND is currently deployed on Monad Testnet. This means:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>All tokens and transactions are for testing purposes only</li>
            <li>Testnet tokens have no real-world value</li>
            <li>The platform may be reset or modified at any time</li>
            <li>Do not send real funds to testnet addresses</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">3. Risk Disclosure</h2>
          <p className="mb-3">
            Using CLAW.FUND involves significant risks, including but not limited to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Smart contract vulnerabilities</li>
            <li>Market volatility and potential loss of funds</li>
            <li>Autonomous trading decisions by AI agent</li>
            <li>Blockchain network issues</li>
            <li>Regulatory uncertainty</li>
          </ul>
          <p className="mt-3 font-semibold text-yellow-500">
            Never invest more than you can afford to lose.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">4. User Responsibilities</h2>
          <p className="mb-3">You are responsible for:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Securing your wallet and private keys</li>
            <li>Understanding the risks of DeFi and autonomous trading</li>
            <li>Complying with applicable laws and regulations</li>
            <li>Verifying all transactions before signing</li>
            <li>Conducting your own research (DYOR)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">5. No Financial Advice</h2>
          <p>
            CLAW.FUND does not provide financial, investment, or legal advice. All information 
            provided is for informational purposes only. Consult with qualified professionals 
            before making any financial decisions.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">6. Autonomous Trading</h2>
          <p>
            The platform uses an AI agent to make autonomous trading decisions. By participating, 
            you acknowledge that:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Trading decisions are made algorithmically without human intervention</li>
            <li>Past performance does not guarantee future results</li>
            <li>The AI may make decisions that result in losses</li>
            <li>You accept the risks associated with autonomous trading</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">7. Governance</h2>
          <p>
            CLAW token holders can participate in governance. By voting on proposals, you 
            acknowledge that:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Governance decisions are binding and executed on-chain</li>
            <li>You are responsible for understanding proposals before voting</li>
            <li>Malicious proposals could harm the protocol</li>
            <li>Governance participation requires careful consideration</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">8. Intellectual Property</h2>
          <p>
            All content, code, and materials on CLAW.FUND are protected by intellectual property 
            rights. You may not copy, modify, or distribute without permission.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">9. Limitation of Liability</h2>
          <p>
            CLAW.FUND and its developers are not liable for any losses, damages, or issues 
            arising from your use of the platform. Use at your own risk.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">10. Service Availability</h2>
          <p>
            We do not guarantee uninterrupted access to the platform. The service may be 
            modified, suspended, or discontinued at any time without notice.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">11. Prohibited Activities</h2>
          <p className="mb-3">You may not:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Use the platform for illegal activities</li>
            <li>Attempt to hack or exploit vulnerabilities</li>
            <li>Manipulate markets or engage in wash trading</li>
            <li>Spam or abuse the platform</li>
            <li>Violate any applicable laws or regulations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">12. Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. Continued use of the 
            platform constitutes acceptance of updated terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">13. Governing Law</h2>
          <p>
            These terms are governed by applicable laws. Any disputes will be resolved through 
            appropriate legal channels.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">14. Contact</h2>
          <p>
            For questions about these terms, please contact us through our official channels.
          </p>
        </section>

        <div className="mt-8 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-500 font-semibold mb-2">⚠️ Important Notice</p>
          <p className="text-sm">
            This is experimental software running on a testnet. Do not use real funds. 
            Always conduct your own research and understand the risks before participating 
            in any DeFi protocol.
          </p>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-white/10">
        <p className="text-sm text-claw-dim">
          Last updated: February 15, 2026
        </p>
      </div>
    </div>
  );
}
