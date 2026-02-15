export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      
      <div className="space-y-6 text-claw-dim">
        <section>
          <h2 className="text-xl font-semibold text-white mb-3">1. Information We Collect</h2>
          <p className="mb-3">CLAW.FUND collects minimal information:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Wallet addresses (public blockchain data)</li>
            <li>Transaction history (public blockchain data)</li>
            <li>WebSocket connection data (temporary, not stored)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">2. How We Use Information</h2>
          <p className="mb-3">We use collected information to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Provide platform functionality</li>
            <li>Display your portfolio and transaction history</li>
            <li>Enable governance participation</li>
            <li>Verify quest completion</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">3. Data Storage</h2>
          <p>
            All transaction data is stored on the Monad blockchain and is publicly accessible. 
            We do not store private keys or personal information on our servers.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">4. Cookies</h2>
          <p>
            We use local storage to maintain your wallet connection state. No tracking cookies 
            are used.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">5. Third-Party Services</h2>
          <p className="mb-3">We integrate with:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>WalletConnect - for wallet connections</li>
            <li>Monad RPC - for blockchain interactions</li>
            <li>These services have their own privacy policies</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">6. Security</h2>
          <p>
            We implement security measures to protect your data. However, no method of 
            transmission over the Internet is 100% secure.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">7. Your Rights</h2>
          <p>
            Since all data is on-chain, you have full control over your wallet and can 
            disconnect at any time.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">8. Changes to Privacy Policy</h2>
          <p>
            We may update this privacy policy from time to time. We will notify you of any 
            changes by posting the new policy on this page.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">9. Contact</h2>
          <p>
            If you have questions about this privacy policy, please contact us through our 
            official channels.
          </p>
        </section>
      </div>

      <div className="mt-8 pt-6 border-t border-white/10">
        <p className="text-sm text-claw-dim">
          Last updated: February 15, 2026
        </p>
      </div>
    </div>
  );
}
