// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title WorldBoss
 * @notice Manages world boss encounters requiring agent coordination
 * @dev The Titan - A massive boss that requires 5+ agents to defeat
 */
contract WorldBoss is Ownable, ReentrancyGuard, Pausable {
    // Custom errors for gas efficiency
    error BossNotActive();
    error BossAlreadyDefeated();
    error InsufficientDamage();
    error NotParticipant();
    error RewardAlreadyClaimed();
    error BossStillAlive();
    error TooSoonToRespawn();

    struct Boss {
        uint256 currentHealth;
        uint256 maxHealth;
        uint256 prizePool;
        uint256 spawnTime;
        uint256 defeatTime;
        bool isActive;
        bool isDefeated;
        address[] participants;
        mapping(address => uint256) damageDealt;
        mapping(address => bool) rewardClaimed;
    }

    // State variables
    Boss public currentBoss;
    uint256 public bossCounter;
    uint256 public constant RESPAWN_COOLDOWN = 2 hours;
    uint256 public constant MIN_PARTICIPANTS = 5;
    uint256 public constant BOSS_MAX_HEALTH = 10000;
    uint256 public constant MIN_DAMAGE = 10;
    uint256 public constant MAX_DAMAGE = 100;

    // Events
    event BossSpawned(uint256 indexed bossId, uint256 maxHealth, uint256 spawnTime);
    event BossAttacked(uint256 indexed bossId, address indexed attacker, uint256 damage, uint256 remainingHealth);
    event BossDefeated(uint256 indexed bossId, uint256 defeatTime, uint256 prizePool, uint256 participantCount);
    event RewardClaimed(uint256 indexed bossId, address indexed participant, uint256 reward);
    event PrizePoolIncreased(uint256 indexed bossId, uint256 amount, uint256 newTotal);

    constructor() Ownable(msg.sender) {
        _spawnBoss();
    }

    /**
     * @notice Attack the current boss
     * @param damage Amount of damage to deal (will be clamped to MIN_DAMAGE - MAX_DAMAGE)
     */
    function attackBoss(uint256 damage) external nonReentrant whenNotPaused {
        if (!currentBoss.isActive) revert BossNotActive();
        if (currentBoss.isDefeated) revert BossAlreadyDefeated();

        // Clamp damage to valid range
        uint256 actualDamage = damage;
        if (actualDamage < MIN_DAMAGE) actualDamage = MIN_DAMAGE;
        if (actualDamage > MAX_DAMAGE) actualDamage = MAX_DAMAGE;

        // Track participant
        if (currentBoss.damageDealt[msg.sender] == 0) {
            currentBoss.participants.push(msg.sender);
        }
        currentBoss.damageDealt[msg.sender] += actualDamage;

        // Apply damage
        if (actualDamage >= currentBoss.currentHealth) {
            currentBoss.currentHealth = 0;
            currentBoss.isDefeated = true;
            currentBoss.defeatTime = block.timestamp;
            
            emit BossDefeated(
                bossCounter,
                block.timestamp,
                currentBoss.prizePool,
                currentBoss.participants.length
            );
        } else {
            currentBoss.currentHealth -= actualDamage;
        }

        emit BossAttacked(bossCounter, msg.sender, actualDamage, currentBoss.currentHealth);
    }

    /**
     * @notice Claim reward after boss is defeated
     */
    function claimReward() external nonReentrant {
        if (!currentBoss.isDefeated) revert BossStillAlive();
        if (currentBoss.damageDealt[msg.sender] == 0) revert NotParticipant();
        if (currentBoss.rewardClaimed[msg.sender]) revert RewardAlreadyClaimed();

        // Calculate reward based on damage contribution
        uint256 totalDamage = BOSS_MAX_HEALTH;
        uint256 userDamage = currentBoss.damageDealt[msg.sender];
        uint256 reward = (currentBoss.prizePool * userDamage) / totalDamage;

        currentBoss.rewardClaimed[msg.sender] = true;

        // Transfer reward
        (bool success, ) = msg.sender.call{value: reward}("");
        require(success, "Reward transfer failed");

        emit RewardClaimed(bossCounter, msg.sender, reward);
    }

    /**
     * @notice Spawn a new boss (only after cooldown)
     */
    function spawnBoss() external onlyOwner {
        if (currentBoss.isActive && !currentBoss.isDefeated) revert BossNotActive();
        if (block.timestamp < currentBoss.defeatTime + RESPAWN_COOLDOWN) revert TooSoonToRespawn();

        _spawnBoss();
    }

    /**
     * @notice Add funds to the current boss prize pool
     */
    function increasePrizePool() external payable {
        if (!currentBoss.isActive) revert BossNotActive();
        
        currentBoss.prizePool += msg.value;
        emit PrizePoolIncreased(bossCounter, msg.value, currentBoss.prizePool);
    }

    /**
     * @notice Get boss status
     */
    function getBossStatus() external view returns (
        uint256 health,
        uint256 maxHealth,
        uint256 prizePool,
        uint256 participantCount,
        bool isActive,
        bool isDefeated,
        uint256 spawnTime
    ) {
        return (
            currentBoss.currentHealth,
            currentBoss.maxHealth,
            currentBoss.prizePool,
            currentBoss.participants.length,
            currentBoss.isActive,
            currentBoss.isDefeated,
            currentBoss.spawnTime
        );
    }

    /**
     * @notice Get participant damage
     */
    function getParticipantDamage(address participant) external view returns (uint256) {
        return currentBoss.damageDealt[participant];
    }

    /**
     * @notice Get all participants
     */
    function getParticipants() external view returns (address[] memory) {
        return currentBoss.participants;
    }

    /**
     * @notice Internal function to spawn boss
     */
    function _spawnBoss() private {
        bossCounter++;
        
        // Reset boss state
        delete currentBoss.participants;
        currentBoss.currentHealth = BOSS_MAX_HEALTH;
        currentBoss.maxHealth = BOSS_MAX_HEALTH;
        currentBoss.prizePool = 0;
        currentBoss.spawnTime = block.timestamp;
        currentBoss.defeatTime = 0;
        currentBoss.isActive = true;
        currentBoss.isDefeated = false;

        emit BossSpawned(bossCounter, BOSS_MAX_HEALTH, block.timestamp);
    }

    /**
     * @notice Emergency pause
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Receive ETH
     */
    receive() external payable {
        if (currentBoss.isActive) {
            currentBoss.prizePool += msg.value;
            emit PrizePoolIncreased(bossCounter, msg.value, currentBoss.prizePool);
        }
    }
}
