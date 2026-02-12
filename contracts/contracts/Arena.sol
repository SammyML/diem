// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MONToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title Arena
 * @dev Spectator betting for Diem Agent Battles.
 *      Allows users to wager MON on Battle ID outcomes.
 */
contract Arena is Ownable, ReentrancyGuard, Pausable {

    // ============ State ============

    MONToken public immutable monToken;
    address public oracle; 

    uint256 public constant PLATFORM_FEE_BPS = 500; // 5%
    uint256 public totalFeesCollected;

    enum BattleState { Open, Resolved, Cancelled }
    enum Side { Challenger, Opponent }

    struct Battle {
        uint256 id;
        BattleState state;
        Side winner;
        uint256 totalBetsChallenger;
        uint256 totalBetsOpponent;
        mapping(address => uint256) betsChallenger;
        mapping(address => uint256) betsOpponent;
        bool exists;
    }

    mapping(uint256 => Battle) public battles;
    mapping(uint256 => mapping(address => bool)) public hasClaimed;

    // ============ Events ============

    event BetPlaced(uint256 indexed battleId, address indexed better, Side side, uint256 amount);
    event BattleResolved(uint256 indexed battleId, Side winner, uint256 winnerPool, uint256 loserPool);
    event WinningsClaimed(uint256 indexed battleId, address indexed better, uint256 amount);

    // ============ Constructor ============

    constructor(address _monToken, address _oracle) Ownable(msg.sender) {
        monToken = MONToken(_monToken);
        oracle = _oracle;
    }

    // ============ Logic ============

    function placeBet(uint256 battleId, uint8 sideInt, uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Bet > 0");
        require(sideInt <= 1, "Invalid Side");
        Side side = Side(sideInt);

        Battle storage battle = battles[battleId];
        
        // Auto-create if not exists
        if (!battle.exists) {
            battle.id = battleId;
            battle.state = BattleState.Open;
            battle.exists = true;
        }

        require(battle.state == BattleState.Open, "Battle closed");

        // Transfer MON
        require(monToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        if (side == Side.Challenger) {
            battle.betsChallenger[msg.sender] += amount;
            battle.totalBetsChallenger += amount;
        } else {
            battle.betsOpponent[msg.sender] += amount;
            battle.totalBetsOpponent += amount;
        }

        emit BetPlaced(battleId, msg.sender, side, amount);
    }

    function resolveBattle(uint256 battleId, uint8 winnerSideInt) external {
        require(msg.sender == oracle, "Only Oracle");
        require(winnerSideInt <= 1, "Invalid Side");
        
        Battle storage battle = battles[battleId];
        require(battle.exists, "Battle not found");
        require(battle.state == BattleState.Open, "Not open");

        battle.state = BattleState.Resolved;
        battle.winner = Side(winnerSideInt);

        emit BattleResolved(battleId, battle.winner, 
            battle.winner == Side.Challenger ? battle.totalBetsChallenger : battle.totalBetsOpponent,
            battle.winner == Side.Challenger ? battle.totalBetsOpponent : battle.totalBetsChallenger
        );
    }

    function claimWinnings(uint256 battleId) external nonReentrant {
        Battle storage battle = battles[battleId];
        require(battle.state == BattleState.Resolved, "Not resolved");
        require(!hasClaimed[battleId][msg.sender], "Already claimed");

        uint256 userBet;
        uint256 winnerTotal;
        uint256 loserTotal;

        if (battle.winner == Side.Challenger) {
            userBet = battle.betsChallenger[msg.sender];
            winnerTotal = battle.totalBetsChallenger;
            loserTotal = battle.totalBetsOpponent;
        } else {
            userBet = battle.betsOpponent[msg.sender];
            winnerTotal = battle.totalBetsOpponent;
            loserTotal = battle.totalBetsChallenger;
        }

        require(userBet > 0, "No winning bet");

        // Payout Calculation:
        // Share = UserBet / WinnerTotal
        // Payout = UserBet + (Share * LoserTotal * 95%) 
        // 5% fee taken from LoserTotal

        uint256 loserPoolAfterFee = (loserTotal * (10000 - PLATFORM_FEE_BPS)) / 10000;
        uint256 fee = loserTotal - loserPoolAfterFee;
        
        // Pro-rata share of loser pool
        uint256 share = (userBet * loserPoolAfterFee) / winnerTotal;
        uint256 payout = userBet + share;

        hasClaimed[battleId][msg.sender] = true;
        totalFeesCollected += fee;

        require(monToken.transfer(msg.sender, payout), "Transfer failed");
        emit WinningsClaimed(battleId, msg.sender, payout);
    }

    // ============ Admin ============

    function withdrawFees(address to) external onlyOwner {
        uint256 amount = totalFeesCollected;
        totalFeesCollected = 0;
        require(monToken.transfer(to, amount), "Transfer failed");
    }

    function setOracle(address _oracle) external onlyOwner {
        oracle = _oracle;
    }
}
