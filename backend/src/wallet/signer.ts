import { config } from "../config";
import { ISigner, UnsignedTransaction } from "../types";
import { log } from "../logger/reasoningLogger";

/**
 * Mock signer — simulates wallet signing without touching any chain.
 * Replace this implementation with a real signer (e.g. ethers.Wallet)
 * when blockchain integration is ready.
 */
export class MockSigner implements ISigner {
  public readonly address: string;

  constructor() {
    this.address = config.WALLET_ADDRESS;
    log.debug(`MockSigner initialised with address ${this.address}`);
  }

  async signTransaction(tx: UnsignedTransaction): Promise<string> {
    const mockHash = `0xmock_${Date.now().toString(16)}_${Math.random().toString(16).slice(2, 10)}`;
    log.info(`[MockSigner] Signed tx → to: ${tx.to}, value: ${tx.value}, hash: ${mockHash}`);
    return mockHash;
  }
}
