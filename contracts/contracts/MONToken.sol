// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title MON Token
 * @dev Production-grade ERC20 token for Diem virtual world on Monad blockchain
 * 
 * Features:
 * - Reentrancy protection on all state-changing functions
 * - Pausable for emergency circuit breaker
 * - Custom errors for gas optimization
 * - Comprehensive events for transparency
 * - Role-based access control
 * 
 * @custom:security-contact security@diem.xyz
 */
contract MONToken is ERC20, Ownable, ReentrancyGuard, Pausable {
    
    // ============ Constants ============
    
    /// @notice Entry fee required to join the world
    uint256 public constant ENTRY_FEE = 100 * 10**18; // 100 MON
    
    /// @notice Initial balance given to new agents for testing
    uint256 public constant INITIAL_AGENT_BALANCE = 200 * 10**18; // 200 MON
    
    /// @notice Maximum reward that can be minted in a single transaction
    uint256 public constant MAX_SINGLE_REWARD = 1000 * 10**18; // 1000 MON
    
    /// @notice Initial supply minted to deployer
    uint256 private constant INITIAL_SUPPLY = 1000000 * 10**18; // 1M MON
    
    // ============ State Variables ============
    
    /// @notice Address of the WorldTreasury contract authorized to mint rewards
    address public worldTreasury;
    
    /// @notice Total amount of rewards minted
    uint256 public totalRewardsMinted;
    
    /// @notice Total number of agents funded
    uint256 public totalAgentsFunded;
    
    // ============ Custom Errors ============
    
    /// @dev Thrown when caller is not the WorldTreasury
    error OnlyTreasury();
    
    /// @dev Thrown when treasury address is zero
    error InvalidTreasuryAddress();
    
    /// @dev Thrown when agent address is zero
    error InvalidAgentAddress();
    
    /// @dev Thrown when reward amount exceeds maximum
    error RewardTooLarge(uint256 requested, uint256 maximum);
    
    /// @dev Thrown when agent array is empty
    error EmptyAgentArray();
    
    /// @dev Thrown when batch operation is too large
    error BatchTooLarge(uint256 size, uint256 maximum);
    
    // ============ Events ============
    
    /// @notice Emitted when an agent is funded with initial balance
    /// @param agent Address of the funded agent
    /// @param amount Amount of MON tokens funded
    event AgentFunded(address indexed agent, uint256 amount);
    
    /// @notice Emitted when a reward is minted
    /// @param agent Address receiving the reward
    /// @param amount Amount of MON tokens minted
    /// @param totalMinted Total rewards minted so far
    event RewardMinted(address indexed agent, uint256 amount, uint256 totalMinted);
    
    /// @notice Emitted when WorldTreasury address is updated
    /// @param oldTreasury Previous treasury address
    /// @param newTreasury New treasury address
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    
    // ============ Constructor ============
    
    /**
     * @notice Initializes the MON token with initial supply
     * @dev Mints initial supply to the contract deployer
     */
    constructor() ERC20("Monad Token", "MON") Ownable(msg.sender) {
        _mint(msg.sender, INITIAL_SUPPLY);
    }
    
    // ============ Admin Functions ============
    
    /**
     * @notice Sets the WorldTreasury contract address
     * @dev Only owner can call. Treasury address cannot be zero.
     * @param _treasury Address of the WorldTreasury contract
     */
    function setWorldTreasury(address _treasury) external onlyOwner {
        if (_treasury == address(0)) revert InvalidTreasuryAddress();
        
        address oldTreasury = worldTreasury;
        worldTreasury = _treasury;
        
        emit TreasuryUpdated(oldTreasury, _treasury);
    }
    
    /**
     * @notice Pauses all token transfers
     * @dev Only owner can call. Use in emergency situations.
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Unpauses token transfers
     * @dev Only owner can call.
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // ============ Agent Funding Functions ============
    
    /**
     * @notice Funds a new agent with initial MON balance
     * @dev Only owner can call. Protected against reentrancy.
     * @param agent Address of the agent to fund
     */
    function fundAgent(address agent) external onlyOwner nonReentrant whenNotPaused {
        if (agent == address(0)) revert InvalidAgentAddress();
        
        _mint(agent, INITIAL_AGENT_BALANCE);
        
        unchecked {
            // Safe: totalAgentsFunded will never realistically overflow
            ++totalAgentsFunded;
        }
        
        emit AgentFunded(agent, INITIAL_AGENT_BALANCE);
    }
    
    /**
     * @notice Batch funds multiple agents with initial MON balance
     * @dev Only owner can call. Gas-optimized for batch operations.
     * @param agents Array of agent addresses to fund
     */
    function fundAgents(address[] calldata agents) external onlyOwner nonReentrant whenNotPaused {
        uint256 length = agents.length;
        if (length == 0) revert EmptyAgentArray();
        if (length > 100) revert BatchTooLarge(length, 100);
        
        for (uint256 i = 0; i < length;) {
            address agent = agents[i];
            if (agent == address(0)) revert InvalidAgentAddress();
            
            _mint(agent, INITIAL_AGENT_BALANCE);
            emit AgentFunded(agent, INITIAL_AGENT_BALANCE);
            
            unchecked {
                // Safe: i will never overflow in realistic scenarios
                ++i;
            }
        }
        
        unchecked {
            // Safe: totalAgentsFunded will never realistically overflow
            totalAgentsFunded += length;
        }
    }
    
    // ============ Reward Functions ============
    
    /**
     * @notice Mints reward tokens for agent actions
     * @dev Only WorldTreasury can call. Protected against reentrancy.
     * @param agent Address of the agent receiving the reward
     * @param amount Amount of MON tokens to mint
     */
    function mintReward(address agent, uint256 amount) external nonReentrant whenNotPaused {
        if (msg.sender != worldTreasury) revert OnlyTreasury();
        if (agent == address(0)) revert InvalidAgentAddress();
        if (amount > MAX_SINGLE_REWARD) revert RewardTooLarge(amount, MAX_SINGLE_REWARD);
        
        _mint(agent, amount);
        
        unchecked {
            // Safe: totalRewardsMinted overflow would require unrealistic token amounts
            totalRewardsMinted += amount;
        }
        
        emit RewardMinted(agent, amount, totalRewardsMinted);
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Returns token statistics
     * @return supply Total supply of MON tokens
     * @return rewardsMinted Total rewards minted
     * @return agentsFunded Total agents funded
     */
    function getTokenStats() external view returns (
        uint256 supply,
        uint256 rewardsMinted,
        uint256 agentsFunded
    ) {
        return (totalSupply(), totalRewardsMinted, totalAgentsFunded);
    }
    
    // ============ Internal Overrides ============
    
    /**
     * @dev Hook that is called before any transfer of tokens
     * @param from Address tokens are transferred from
     * @param to Address tokens are transferred to
     * @param amount Amount of tokens transferred
     */
    function _update(address from, address to, uint256 amount) 
        internal 
        override 
        whenNotPaused 
    {
        super._update(from, to, amount);
    }
}
