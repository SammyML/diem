// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MONToken.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title WorldTreasury
 * @dev Production-grade treasury managing entry fees, rewards, and agent economy
 * 
 * Features:
 * - Reentrancy protection on all state-changing functions
 * - Pausable for emergency stops
 * - Custom errors for gas optimization
 * - Comprehensive input validation
 * - Rate limiting for reward distribution
 * - Agent reputation tracking
 * 
 * @custom:security-contact security@diem.xyz
 */
contract WorldTreasury is Ownable, ReentrancyGuard, Pausable {
    // ============ Constants ============
    
    /// @notice Entry fee required to join the world
    uint256 public constant ENTRY_FEE = 100 * 10**18;
    
    /// @notice Maximum reward per action to prevent exploits
    uint256 public constant MAX_REWARD_PER_ACTION = 500 * 10**18;
    
    /// @notice Minimum time between rewards for same agent (anti-spam)
    uint256 public constant REWARD_COOLDOWN = 1 seconds;
    
    // ============ State Variables ============
    
    /// @notice MON token contract
    MONToken public immutable monToken;
    
    /// @notice Total number of agents who have entered
    uint256 public totalAgents;
    
    /// @notice Total entry fees collected
    uint256 public totalFeesCollected;
    
    /// @notice Total rewards distributed
    uint256 public totalRewardsDistributed;
    
    /// @notice Authorized reward distributors
    mapping(address => bool) public isDistributor;
    
    /// @notice Agent data structure (optimized for storage)
    struct Agent {
        bool hasEntered;           // 1 byte
        uint248 entryTime;         // 31 bytes (fits with bool in one slot)
        uint256 totalEarned;       // 32 bytes (slot 2)
        uint256 totalSpent;        // 32 bytes (slot 3)
        uint256 actionCount;       // 32 bytes (slot 4)
        uint256 lastRewardTime;    // 32 bytes (slot 5) - for rate limiting
        uint256 reputationScore;   // 32 bytes (slot 6) - for future features
    }
    
    /// @notice Agent data by address
    mapping(address => Agent) public agents;
    
    /// @notice Total transfers between agent pairs
    mapping(address => mapping(address => uint256)) public agentToAgentTransfers;
    
    // ============ Custom Errors ============
    
    error AgentAlreadyEntered();
    error AgentNotInWorld();
    error InsufficientBalance();
    error InvalidAmount();
    error InvalidAddress();
    error RewardTooLarge(uint256 requested, uint256 maximum);
    error RewardCooldownActive(uint256 timeRemaining);
    error TransferFailed();
    error NotAuthorizedDistributor();
    
    // ============ Events ============
    
    event AgentEntered(address indexed agent, uint256 entryFee, uint256 timestamp);
    event RewardDistributed(address indexed agent, uint256 amount, string reason, uint256 newBalance);
    event AgentToAgentTransfer(address indexed from, address indexed to, uint256 amount, string reason);
    event ItemPurchased(address indexed buyer, address indexed seller, uint256 price, string itemType);
    event DistributorUpdated(address indexed distributor, bool authorized);
    event ReputationUpdated(address indexed agent, uint256 oldScore, uint256 newScore);
    
    // ============ Constructor ============
    
    /**
     * @notice Initializes the WorldTreasury
     * @param _monToken Address of the MON token contract
     */
    constructor(address _monToken) Ownable(msg.sender) {
        if (_monToken == address(0)) revert InvalidAddress();
        monToken = MONToken(_monToken);
        
        // Owner is automatically a distributor
        isDistributor[msg.sender] = true;
        emit DistributorUpdated(msg.sender, true);
    }
    
    // ============ Admin Functions ============
    
    /**
     * @notice Authorizes or revokes a reward distributor
     * @param distributor Address to update
     * @param authorized Whether the address is authorized
     */
    function setDistributor(address distributor, bool authorized) external onlyOwner {
        if (distributor == address(0)) revert InvalidAddress();
        isDistributor[distributor] = authorized;
        emit DistributorUpdated(distributor, authorized);
    }
    
    /**
     * @notice Pauses all treasury operations
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Unpauses treasury operations
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // ============ Core Functions ============
    
    /**
     * @notice Agent pays entry fee to join the world
     * @dev Protected against reentrancy. Requires approval of ENTRY_FEE tokens.
     */
    function enterWorld() external nonReentrant whenNotPaused {
        if (agents[msg.sender].hasEntered) revert AgentAlreadyEntered();
        if (monToken.balanceOf(msg.sender) < ENTRY_FEE) revert InsufficientBalance();
        
        // Transfer entry fee to treasury
        if (!monToken.transferFrom(msg.sender, address(this), ENTRY_FEE)) {
            revert TransferFailed();
        }
        
        agents[msg.sender] = Agent({
            hasEntered: true,
            entryTime: uint248(block.timestamp),
            totalEarned: 0,
            totalSpent: ENTRY_FEE,
            actionCount: 0,
            lastRewardTime: 0,
            reputationScore: 100 // Starting reputation
        });
        
        unchecked {
            // Safe: totalAgents and totalFeesCollected won't realistically overflow
            ++totalAgents;
            totalFeesCollected += ENTRY_FEE;
        }
        
        emit AgentEntered(msg.sender, ENTRY_FEE, block.timestamp);
    }
    
    /**
     * @notice Distributes reward to agent for actions
     * @dev Only authorized distributors can call. Rate limited per agent.
     * @param agent Address of the agent receiving reward
     * @param amount Amount of MON to reward
     * @param reason Reason for the reward (e.g., "gathered ore")
     */
    function distributeReward(address agent, uint256 amount, string calldata reason) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        if (!isDistributor[msg.sender]) revert NotAuthorizedDistributor();
        if (!agents[agent].hasEntered) revert AgentNotInWorld();
        if (amount == 0) revert InvalidAmount();
        if (amount > MAX_REWARD_PER_ACTION) revert RewardTooLarge(amount, MAX_REWARD_PER_ACTION);
        
        // Check cooldown
        Agent storage agentData = agents[agent];
        if (block.timestamp < agentData.lastRewardTime + REWARD_COOLDOWN) {
            revert RewardCooldownActive(
                agentData.lastRewardTime + REWARD_COOLDOWN - block.timestamp
            );
        }
        
        // Mint new MON as reward
        monToken.mintReward(agent, amount);
        
        // Update agent stats
        unchecked {
            // Safe: these values won't realistically overflow
            agentData.totalEarned += amount;
            agentData.actionCount++;
            totalRewardsDistributed += amount;
        }
        agentData.lastRewardTime = block.timestamp;
        
        // Increase reputation for successful actions
        _updateReputation(agent, agentData.reputationScore + 1);
        
        emit RewardDistributed(agent, amount, reason, monToken.balanceOf(agent));
    }
    
    /**
     * @notice Transfers MON from one agent to another
     * @dev Both agents must be in the world. Protected against reentrancy.
     * @param to Recipient agent address
     * @param amount Amount of MON to transfer
     * @param reason Reason for transfer
     */
    function transferToAgent(address to, uint256 amount, string calldata reason) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        if (!agents[msg.sender].hasEntered) revert AgentNotInWorld();
        if (!agents[to].hasEntered) revert AgentNotInWorld();
        if (to == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();
        if (monToken.balanceOf(msg.sender) < amount) revert InsufficientBalance();
        
        if (!monToken.transferFrom(msg.sender, to, amount)) revert TransferFailed();
        
        unchecked {
            // Safe: won't overflow in realistic scenarios
            agentToAgentTransfers[msg.sender][to] += amount;
            agents[msg.sender].totalSpent += amount;
        }
        
        emit AgentToAgentTransfer(msg.sender, to, amount, reason);
    }
    
    /**
     * @notice Purchases an item from another agent
     * @dev Both agents must be in the world. Protected against reentrancy.
     * @param seller Seller agent address
     * @param price Price of the item in MON
     * @param itemType Type of item being purchased
     */
    function purchaseItem(address seller, uint256 price, string calldata itemType) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        if (!agents[msg.sender].hasEntered) revert AgentNotInWorld();
        if (!agents[seller].hasEntered) revert AgentNotInWorld();
        if (seller == address(0)) revert InvalidAddress();
        if (price == 0) revert InvalidAmount();
        if (monToken.balanceOf(msg.sender) < price) revert InsufficientBalance();
        
        if (!monToken.transferFrom(msg.sender, seller, price)) revert TransferFailed();
        
        unchecked {
            // Safe: won't overflow in realistic scenarios
            agents[msg.sender].totalSpent += price;
            agents[seller].totalEarned += price;
        }
        
        // Increase seller's reputation for successful trade
        _updateReputation(seller, agents[seller].reputationScore + 2);
        
        emit ItemPurchased(msg.sender, seller, price, itemType);
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Gets comprehensive agent statistics
     * @param agent Address of the agent
     * @return hasEntered Whether agent has entered the world
     * @return entryTime Timestamp when agent entered
     * @return totalEarned Total MON earned
     * @return totalSpent Total MON spent
     * @return actionCount Number of actions performed
     * @return currentBalance Current MON balance
     * @return reputationScore Agent's reputation score
     */
    function getAgentStats(address agent) external view returns (
        bool hasEntered,
        uint256 entryTime,
        uint256 totalEarned,
        uint256 totalSpent,
        uint256 actionCount,
        uint256 currentBalance,
        uint256 reputationScore
    ) {
        Agent memory a = agents[agent];
        return (
            a.hasEntered,
            a.entryTime,
            a.totalEarned,
            a.totalSpent,
            a.actionCount,
            monToken.balanceOf(agent),
            a.reputationScore
        );
    }
    
    /**
     * @notice Gets world-wide statistics
     * @return _totalAgents Total number of agents
     * @return _totalFeesCollected Total entry fees collected
     * @return _totalRewardsDistributed Total rewards distributed
     * @return treasuryBalance Current treasury balance
     */
    function getWorldStats() external view returns (
        uint256 _totalAgents,
        uint256 _totalFeesCollected,
        uint256 _totalRewardsDistributed,
        uint256 treasuryBalance
    ) {
        return (
            totalAgents,
            totalFeesCollected,
            totalRewardsDistributed,
            monToken.balanceOf(address(this))
        );
    }
    
    // ============ Internal Functions ============
    
    /**
     * @dev Updates agent reputation score
     * @param agent Address of the agent
     * @param newScore New reputation score
     */
    function _updateReputation(address agent, uint256 newScore) internal {
        uint256 oldScore = agents[agent].reputationScore;
        agents[agent].reputationScore = newScore;
        emit ReputationUpdated(agent, oldScore, newScore);
    }
}
