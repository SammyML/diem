import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ethers } from 'ethers';
import './ArenaPage.css';
import { API_BASE_URL } from '../config';

// Placeholder - Replace with actual deployed address
const ARENA_CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const ARENA_ABI = [
    "function placeBet(uint256 battleId, uint8 side, uint256 amount) external",
    "function claimWinnings(uint256 battleId) external"
];

interface Battle {
    battleId: string;
    challenger: string;
    opponent: string | null;
    wager: number;
    status: 'open' | 'active' | 'completed';
}

interface Boss {
    health: number;
    maxHealth: number;
    status: string;
}

const ArenaPage: React.FC = () => {
    const [openBattles, setOpenBattles] = useState<Battle[]>([]);
    const [activeBattles, setActiveBattles] = useState<Battle[]>([]);
    const [boss, setBoss] = useState<Boss | null>(null);
    const [wallet, setWallet] = useState<string | null>(null);
    const [betAmount, setBetAmount] = useState<string>("10");

    useEffect(() => {
        const fetchData = async () => {
            const API = API_BASE_URL;
            try {
                // Fetch Battles
                const openRes = await fetch(`${API}/arena/battles/open`);
                const activeRes = await fetch(`${API}/arena/battles/active`);
                setOpenBattles(await openRes.json());
                setActiveBattles(await activeRes.json());

                // Fetch Titan
                const bossRes = await fetch(`${API}/boss/status`);
                const bossData = await bossRes.json();
                setBoss(bossData.boss);
            } catch (e) {
                console.error(e);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 2000); // Faster refresh for combat
        return () => clearInterval(interval);
    }, []);

    const connectWallet = async () => {
        if (window.ethereum) {
            try {
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                await provider.send("eth_requestAccounts", []);
                const signer = provider.getSigner();
                setWallet(await signer.getAddress());
            } catch (err) {
                console.error("Wallet connection failed", err);
            }
        } else {
            alert("Please install MetaMask!");
        }
    };

    const placeBet = async (battleId: string, side: number) => {
        if (!wallet) return alert("Connect Wallet first!");
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const contract = new ethers.Contract(ARENA_CONTRACT_ADDRESS, ARENA_ABI, signer);

            // Parse battleId from string guid to uint256 if needed, or use hash
            // For this demo, we assume the string is numeric or handled by backend mapping
            // But standard UUIDs don't fit in uint256 directly without hashing.
            // We'll mock the ID for now as hash(battleId)
            const id = ethers.BigNumber.from(ethers.utils.id(battleId));
            const amount = ethers.utils.parseEther(betAmount);

            const tx = await contract.placeBet(id, side, amount);
            await tx.wait();
            alert(`Bet Placed on Side ${side === 0 ? 'Challenger' : 'Opponent'}!`);
        } catch (err) {
            console.error("Betting failed", err);
            alert("Betting failed. See console.");
        }
    };

    const healthPercent = boss ? (boss.health / boss.maxHealth) * 100 : 0;

    return (
        <div className="arena-page">
            <Link to="/app" className="btn-pixel btn-secondary" style={{ position: 'absolute', top: 20, left: 20 }}>
                ← BACK TO SIM
            </Link>

            <div style={{ position: 'absolute', top: 20, right: 20 }}>
                {!wallet ? (
                    <button onClick={connectWallet} className="btn-pixel btn-primary">
                        CONNECT WALLET
                    </button>
                ) : (
                    <span className="btn-pixel btn-outline" style={{ color: 'var(--neon-green)' }}>
                        {wallet.slice(0, 6)}...{wallet.slice(-4)}
                    </span>
                )}
            </div>

            <header className="arena-header">
                <h1>THE ARENA</h1>
                <p>PVP COMBAT & TITAN RAIDS</p>
            </header>

            {/* TITAN RAID BOSS */}
            {boss && (
                <section className="titan-section">
                    <h2 style={{ color: 'var(--danger)', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        RAID BOSS DETECTED
                    </h2>
                    <div className="titan-avatar">
                        <svg width="100" height="100" viewBox="0 0 100 100" fill="none" stroke="var(--danger)" strokeWidth="2">
                            <path d="M50 20 L80 40 L80 80 L20 80 L20 40 Z" />
                            <circle cx="35" cy="50" r="5" fill="var(--danger)" />
                            <circle cx="65" cy="50" r="5" fill="var(--danger)" />
                            <path d="M40 70 Q50 60 60 70" />
                            <path d="M50 10 L50 20" />
                            <path d="M50 10 L40 5" />
                            <path d="M50 10 L60 5" />
                        </svg>
                    </div>
                    <h3>THE TITAN</h3>
                    <div className="titan-health-container">
                        <div
                            className="titan-health-fill"
                            style={{ width: `${healthPercent}%` }}
                        />
                        <div className="titan-health-text">
                            {boss.health.toLocaleString()} / {boss.maxHealth.toLocaleString()} HP
                        </div>
                    </div>
                    <p style={{ marginTop: 10, fontSize: '0.8rem' }}>
                        STATUS: <span style={{ color: 'var(--text-main)' }}>{boss.status.toUpperCase()}</span>
                    </p>
                </section>
            )}

            {/* BATTLES */}
            <div className="battle-grid">
                <div className="battle-column">
                    <h3 className="section-title">LIVE DUELS</h3>
                    {activeBattles.map(b => (
                        <div key={b.battleId} className="battle-card active">
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--gold)' }}>
                                <span>DUEL #{b.battleId.slice(0, 4)}</span>
                                <span>{b.wager} MON POOL</span>
                            </div>
                            <div className="fighters">
                                <div className="fighter-side">
                                    <span>{b.challenger}</span>
                                    {wallet && (
                                        <button onClick={() => placeBet(b.battleId, 0)} className="btn-bet">
                                            BET CHALLENGER
                                        </button>
                                    )}
                                </div>
                                <span className="vs-badge">VS</span>
                                <div className="fighter-side">
                                    <span>{b.opponent}</span>
                                    {wallet && (
                                        <button onClick={() => placeBet(b.battleId, 1)} className="btn-bet">
                                            BET OPPONENT
                                        </button>
                                    )}
                                </div>
                            </div>
                            {wallet && (
                                <div style={{ textAlign: 'center', marginTop: '10px' }}>
                                    <input
                                        type="number"
                                        value={betAmount}
                                        onChange={(e) => setBetAmount(e.target.value)}
                                        style={{ width: '60px', background: '#000', color: '#fff', border: '1px solid #333', marginRight: '5px' }}
                                    />
                                    <span style={{ fontSize: '0.7rem', color: '#888' }}>MON WAGER</span>
                                </div>
                            )}
                            <div style={{ color: 'var(--neon-green)', fontSize: '0.7rem', textAlign: 'center', marginTop: '10px' }}>
                                /// COMBAT IN PROGRESS ///
                            </div>
                        </div>
                    ))}
                    {activeBattles.length === 0 && <p className="empty-state">No active duels.</p>}
                </div>

                <div className="battle-column">
                    <h3 className="section-title">OPEN CHALLENGES</h3>
                    {openBattles.map(b => (
                        <div key={b.battleId} className="battle-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)' }}>
                                <span>CHALLENGE #{b.battleId.slice(0, 4)}</span>
                                <span>{b.wager} MON</span>
                            </div>
                            <div className="fighters">
                                <span>{b.challenger}</span>
                                <span className="vs-badge" style={{ opacity: 0.5 }}>VS</span>
                                <span style={{ opacity: 0.5 }}>?</span>
                            </div>
                            <button className="btn-pixel btn-primary" style={{ width: '100%', padding: '10px' }}>
                                ACCEPT CHALLENGE
                            </button>
                        </div>
                    ))}
                    {openBattles.length === 0 && <p className="empty-state">No open challenges.</p>}
                </div>
            </div>
        </div>
    );
};

export default ArenaPage;
