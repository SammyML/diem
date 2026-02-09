import { TokenLedger } from './token-ledger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Payment gateway for world entry
 */
export class PaymentGateway {
    private ledger: TokenLedger;
    private activeSessions: Map<string, string>; // sessionToken -> agentId
    private sessionExpiry: Map<string, number>; // sessionToken -> expiryTime

    constructor(ledger: TokenLedger) {
        this.ledger = ledger;
        this.activeSessions = new Map();
        this.sessionExpiry = new Map();
    }

    /**
     * Process entry payment and create session
     */
    public processEntry(agentId: string): {
        success: boolean;
        sessionToken?: string;
        message: string;
    } {
        // Check if agent can afford entry
        if (!this.ledger.canAffordEntry(agentId)) {
            const entryFee = this.ledger.getEntryFee();
            const balance = this.ledger.getBalance(agentId);
            return {
                success: false,
                message: `Insufficient MON balance. Entry fee: ${entryFee} MON, Your balance: ${balance} MON`
            };
        }

        // Charge entry fee
        const charged = this.ledger.chargeEntryFee(agentId);
        if (!charged) {
            return {
                success: false,
                message: 'Failed to process entry fee payment'
            };
        }

        // Create session token
        const sessionToken = uuidv4();
        this.activeSessions.set(sessionToken, agentId);

        // Session expires in 24 hours
        const expiryTime = Date.now() + (24 * 60 * 60 * 1000);
        this.sessionExpiry.set(sessionToken, expiryTime);

        return {
            success: true,
            sessionToken,
            message: `Entry fee paid successfully. Welcome to Diem!`
        };
    }

    /**
     * Validate session token
     */
    public validateSession(sessionToken: string): {
        valid: boolean;
        agentId?: string;
        message: string;
    } {
        const agentId = this.activeSessions.get(sessionToken);
        if (!agentId) {
            return {
                valid: false,
                message: 'Invalid session token'
            };
        }

        const expiryTime = this.sessionExpiry.get(sessionToken);
        if (!expiryTime || Date.now() > expiryTime) {
            // Session expired
            this.activeSessions.delete(sessionToken);
            this.sessionExpiry.delete(sessionToken);
            return {
                valid: false,
                message: 'Session expired'
            };
        }

        return {
            valid: true,
            agentId,
            message: 'Session valid'
        };
    }

    /**
     * Invalidate session (logout)
     */
    public invalidateSession(sessionToken: string): void {
        this.activeSessions.delete(sessionToken);
        this.sessionExpiry.delete(sessionToken);
    }

    /**
     * Get agent ID from session token
     */
    public getAgentId(sessionToken: string): string | undefined {
        const validation = this.validateSession(sessionToken);
        return validation.valid ? validation.agentId : undefined;
    }

    /**
     * Clean up expired sessions
     */
    public cleanupExpiredSessions(): number {
        const now = Date.now();
        let cleaned = 0;

        this.sessionExpiry.forEach((expiryTime, sessionToken) => {
            if (now > expiryTime) {
                this.activeSessions.delete(sessionToken);
                this.sessionExpiry.delete(sessionToken);
                cleaned++;
            }
        });

        return cleaned;
    }

    /**
     * Get active session count
     */
    public getActiveSessionCount(): number {
        return this.activeSessions.size;
    }
}
