// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./WorldTreasury.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AgentMarketplace
 * @dev Production-grade P2P marketplace for agent economy
 * 
 * Features:
 * - Reentrancy protection on all transactions
 * - Pausable for emergency stops
 * - Custom errors for gas optimization
 * - Listing expiration system
 * - Marketplace fees
 * - Comprehensive input validation
 * 
 * @custom:security-contact security@diem.xyz
 */
contract AgentMarketplace is Ownable, ReentrancyGuard, Pausable {
    
    // ============ Constants ============
    
    /// @notice Maximum listing duration (30 days)
    uint256 public constant MAX_LISTING_DURATION = 30 days;
    
    /// @notice Minimum price to prevent spam (0.1 MON)
    uint256 public constant MIN_PRICE = 0.1 * 10**18;
    
    /// @notice Maximum profit share percentage
    uint256 public constant MAX_PROFIT_SHARE = 50;
    
    // ============ State Variables ============
    
    /// @notice WorldTreasury contract
    WorldTreasury public immutable treasury;
    
    /// @notice MON token contract
    MONToken public immutable monToken;
    
    /// @notice Marketplace fee percentage (basis points, e.g., 250 = 2.5%)
    uint256 public marketplaceFeePercent = 250; // 2.5%
    
    /// @notice Total marketplace fees collected
    uint256 public totalFeesCollected;
    
    /// @notice Listing counter
    uint256 public listingCounter;
    
    /// @notice Service counter
    uint256 public serviceCounter;
    
    /// @notice Investment counter
    uint256 public investmentCounter;
    
    // ============ Structs ============
    
    /// @notice Listing data (optimized storage)
    struct Listing {
        address seller;          // 20 bytes
        uint96 pricePerUnit;     // 12 bytes (fits in slot 1 with address)
        uint128 quantity;        // 16 bytes (slot 2)
        uint128 createdAt;       // 16 bytes (fits in slot 2)
        string itemType;         // Dynamic (slot 3+)
        bool active;             // 1 byte (slot N)
    }
    
    /// @notice Service offer data
    struct ServiceOffer {
        address provider;        // 20 bytes
        uint96 pricePerAction;   // 12 bytes
        uint128 completedJobs;   // 16 bytes
        bool active;             // 1 byte
        string serviceType;      // Dynamic
    }
    
    /// @notice Investment data
    struct Investment {
        address investor;        // 20 bytes
        address agent;           // 20 bytes
        uint96 amount;           // 12 bytes
        uint32 profitShare;      // 4 bytes (0-100)
        uint128 timestamp;       // 16 bytes
        bool active;             // 1 byte
    }
    
    // ============ Mappings ============
    
    mapping(uint256 => Listing) public listings;
    mapping(uint256 => ServiceOffer) public services;
    mapping(uint256 => Investment) public investments;
    mapping(address => uint256[]) private agentListings;
    mapping(address => uint256[]) private agentServices;
    mapping(address => uint256) public totalInvested;
    
    // ============ Custom Errors ============
    
    error InvalidQuantity();
    error InvalidPrice();
    error InvalidAddress();
    error InvalidProfitShare();
    error ListingNotActive();
    error ServiceNotActive();
    error InvestmentNotActive();
    error InsufficientQuantity();
    error InsufficientBalance();
    error CannotBuyOwnListing();
    error CannotBuyOwnService();
    error CannotInvestInSelf();
    error TransferFailed();
    error ListingExpired();
    error NotListingOwner();
    error NotServiceOwner();
    error NotInvestmentAgent();
    error InvalidFeePercent();
    
    // ============ Events ============
    
    event ItemListed(uint256 indexed listingId, address indexed seller, string itemType, uint256 quantity, uint256 price, uint256 expiresAt);
    event ItemPurchased(uint256 indexed listingId, address indexed buyer, address indexed seller, uint256 quantity, uint256 totalPrice, uint256 fee);
    event ListingCancelled(uint256 indexed listingId, address indexed seller);
    event ServiceOffered(uint256 indexed serviceId, address indexed provider, string serviceType, uint256 price);
    event ServicePurchased(uint256 indexed serviceId, address indexed buyer, address indexed provider, uint256 price, uint256 fee);
    event ServiceCancelled(uint256 indexed serviceId, address indexed provider);
    event InvestmentMade(uint256 indexed investmentId, address indexed investor, address indexed agent, uint256 amount, uint256 profitShare);
    event ProfitDistributed(uint256 indexed investmentId, address indexed investor, uint256 profit);
    event InvestmentWithdrawn(uint256 indexed investmentId, address indexed investor, uint256 amount);
    event MarketplaceFeeUpdated(uint256 oldFee, uint256 newFee);
    event FeesWithdrawn(address indexed recipient, uint256 amount);
    
    // ============ Constructor ============
    
    /**
     * @notice Initializes the AgentMarketplace
     * @param _treasury Address of WorldTreasury contract
     * @param _monToken Address of MON token contract
     */
    constructor(address _treasury, address _monToken) Ownable(msg.sender) {
        if (_treasury == address(0) || _monToken == address(0)) revert InvalidAddress();
        treasury = WorldTreasury(_treasury);
        monToken = MONToken(_monToken);
    }
    
    // ============ Admin Functions ============
    
    /**
     * @notice Updates marketplace fee percentage
     * @param newFeePercent New fee in basis points (max 1000 = 10%)
     */
    function setMarketplaceFee(uint256 newFeePercent) external onlyOwner {
        if (newFeePercent > 1000) revert InvalidFeePercent(); // Max 10%
        uint256 oldFee = marketplaceFeePercent;
        marketplaceFeePercent = newFeePercent;
        emit MarketplaceFeeUpdated(oldFee, newFeePercent);
    }
    
    /**
     * @notice Withdraws collected marketplace fees
     * @param recipient Address to receive fees
     */
    function withdrawFees(address recipient) external onlyOwner {
        if (recipient == address(0)) revert InvalidAddress();
        uint256 amount = totalFeesCollected;
        totalFeesCollected = 0;
        
        if (!monToken.transfer(recipient, amount)) revert TransferFailed();
        emit FeesWithdrawn(recipient, amount);
    }
    
    /**
     * @notice Pauses all marketplace operations
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Unpauses marketplace operations
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // ============ Item Listing Functions ============
    
    /**
     * @notice Lists an item for sale
     * @param itemType Type of item
     * @param quantity Quantity to sell
     * @param pricePerUnit Price per unit in MON
     * @return listingId ID of the created listing
     */
    function listItem(string calldata itemType, uint256 quantity, uint256 pricePerUnit) 
        external 
        nonReentrant 
        whenNotPaused 
        returns (uint256) 
    {
        if (quantity == 0) revert InvalidQuantity();
        if (pricePerUnit < MIN_PRICE) revert InvalidPrice();
        
        uint256 listingId = listingCounter++;
        
        listings[listingId] = Listing({
            seller: msg.sender,
            itemType: itemType,
            quantity: uint128(quantity),
            pricePerUnit: uint96(pricePerUnit),
            active: true,
            createdAt: uint128(block.timestamp)
        });
        
        agentListings[msg.sender].push(listingId);
        
        uint256 expiresAt = block.timestamp + MAX_LISTING_DURATION;
        emit ItemListed(listingId, msg.sender, itemType, quantity, pricePerUnit, expiresAt);
        
        return listingId;
    }
    
    /**
     * @notice Purchases items from a listing
     * @param listingId ID of the listing
     * @param quantity Quantity to purchase
     */
    function purchaseItem(uint256 listingId, uint256 quantity) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        Listing storage listing = listings[listingId];
        
        if (!listing.active) revert ListingNotActive();
        if (listing.quantity < quantity) revert InsufficientQuantity();
        if (msg.sender == listing.seller) revert CannotBuyOwnListing();
        
        // Check expiration
        if (block.timestamp > listing.createdAt + MAX_LISTING_DURATION) {
            listing.active = false;
            revert ListingExpired();
        }
        
        uint256 totalPrice = uint256(listing.pricePerUnit) * quantity;
        if (monToken.balanceOf(msg.sender) < totalPrice) revert InsufficientBalance();
        
        // Calculate marketplace fee
        uint256 fee = (totalPrice * marketplaceFeePercent) / 10000;
        uint256 sellerAmount = totalPrice - fee;
        
        // Transfer payment
        if (!monToken.transferFrom(msg.sender, listing.seller, sellerAmount)) revert TransferFailed();
        if (fee > 0) {
            if (!monToken.transferFrom(msg.sender, address(this), fee)) revert TransferFailed();
            unchecked {
                totalFeesCollected += fee;
            }
        }
        
        // Update listing
        unchecked {
            listing.quantity -= uint128(quantity);
        }
        if (listing.quantity == 0) {
            listing.active = false;
        }
        
        emit ItemPurchased(listingId, msg.sender, listing.seller, quantity, totalPrice, fee);
    }
    
    /**
     * @notice Cancels a listing
     * @param listingId ID of the listing to cancel
     */
    function cancelListing(uint256 listingId) external {
        Listing storage listing = listings[listingId];
        if (listing.seller != msg.sender) revert NotListingOwner();
        listing.active = false;
        emit ListingCancelled(listingId, msg.sender);
    }
    
    // ============ Service Functions ============
    
    /**
     * @notice Offers a service
     * @param serviceType Type of service
     * @param pricePerAction Price per action in MON
     * @return serviceId ID of the created service
     */
    function offerService(string calldata serviceType, uint256 pricePerAction) 
        external 
        nonReentrant 
        whenNotPaused 
        returns (uint256) 
    {
        if (pricePerAction < MIN_PRICE) revert InvalidPrice();
        
        uint256 serviceId = serviceCounter++;
        
        services[serviceId] = ServiceOffer({
            provider: msg.sender,
            serviceType: serviceType,
            pricePerAction: uint96(pricePerAction),
            active: true,
            completedJobs: 0
        });
        
        agentServices[msg.sender].push(serviceId);
        
        emit ServiceOffered(serviceId, msg.sender, serviceType, pricePerAction);
        return serviceId;
    }
    
    /**
     * @notice Purchases a service
     * @param serviceId ID of the service
     */
    function purchaseService(uint256 serviceId) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        ServiceOffer storage service = services[serviceId];
        
        if (!service.active) revert ServiceNotActive();
        if (msg.sender == service.provider) revert CannotBuyOwnService();
        
        uint256 price = service.pricePerAction;
        if (monToken.balanceOf(msg.sender) < price) revert InsufficientBalance();
        
        // Calculate marketplace fee
        uint256 fee = (price * marketplaceFeePercent) / 10000;
        uint256 providerAmount = price - fee;
        
        // Transfer payment
        if (!monToken.transferFrom(msg.sender, service.provider, providerAmount)) revert TransferFailed();
        if (fee > 0) {
            if (!monToken.transferFrom(msg.sender, address(this), fee)) revert TransferFailed();
            unchecked {
                totalFeesCollected += fee;
            }
        }
        
        unchecked {
            service.completedJobs++;
        }
        
        emit ServicePurchased(serviceId, msg.sender, service.provider, price, fee);
    }
    
    /**
     * @notice Cancels a service offer
     * @param serviceId ID of the service to cancel
     */
    function cancelService(uint256 serviceId) external {
        ServiceOffer storage service = services[serviceId];
        if (service.provider != msg.sender) revert NotServiceOwner();
        service.active = false;
        emit ServiceCancelled(serviceId, msg.sender);
    }
    
    // ============ Investment Functions ============
    
    /**
     * @notice Invests in an agent
     * @param agent Address of agent to invest in
     * @param amount Amount of MON to invest
     * @param profitShare Profit share percentage (1-50)
     * @return investmentId ID of the investment
     */
    function investInAgent(address agent, uint256 amount, uint256 profitShare) 
        external 
        nonReentrant 
        whenNotPaused 
        returns (uint256) 
    {
        if (agent == msg.sender) revert CannotInvestInSelf();
        if (agent == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidPrice();
        if (profitShare == 0 || profitShare > MAX_PROFIT_SHARE) revert InvalidProfitShare();
        if (monToken.balanceOf(msg.sender) < amount) revert InsufficientBalance();
        
        // Transfer investment to agent
        if (!monToken.transferFrom(msg.sender, agent, amount)) revert TransferFailed();
        
        uint256 investmentId = investmentCounter++;
        
        investments[investmentId] = Investment({
            investor: msg.sender,
            agent: agent,
            amount: uint96(amount),
            timestamp: uint128(block.timestamp),
            profitShare: uint32(profitShare),
            active: true
        });
        
        unchecked {
            totalInvested[agent] += amount;
        }
        
        emit InvestmentMade(investmentId, msg.sender, agent, amount, profitShare);
        return investmentId;
    }
    
    /**
     * @notice Distributes profit to investor
     * @param investmentId ID of the investment
     * @param profit Amount of profit to distribute
     */
    function distributeProfitToInvestor(uint256 investmentId, uint256 profit) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        Investment storage investment = investments[investmentId];
        
        if (!investment.active) revert InvestmentNotActive();
        if (msg.sender != investment.agent) revert NotInvestmentAgent();
        if (monToken.balanceOf(msg.sender) < profit) revert InsufficientBalance();
        
        // Transfer profit share
        if (!monToken.transferFrom(msg.sender, investment.investor, profit)) revert TransferFailed();
        
        emit ProfitDistributed(investmentId, investment.investor, profit);
    }
    
    /**
     * @notice Withdraws investment (by investor)
     * @param investmentId ID of the investment
     */
    function withdrawInvestment(uint256 investmentId) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        Investment storage investment = investments[investmentId];
        
        if (!investment.active) revert InvestmentNotActive();
        if (msg.sender != investment.investor) revert NotListingOwner();
        
        investment.active = false;
        
        unchecked {
            totalInvested[investment.agent] -= investment.amount;
        }
        
        emit InvestmentWithdrawn(investmentId, msg.sender, investment.amount);
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Gets agent's active listings
     * @param agent Address of the agent
     * @return Array of listing IDs
     */
    function getAgentListings(address agent) external view returns (uint256[] memory) {
        return agentListings[agent];
    }
    
    /**
     * @notice Gets agent's active services
     * @param agent Address of the agent
     * @return Array of service IDs
     */
    function getAgentServices(address agent) external view returns (uint256[] memory) {
        return agentServices[agent];
    }
    
    /**
     * @notice Gets marketplace statistics
     * @return totalListings Total number of listings created
     * @return totalServices Total number of services offered
     * @return totalInvestments Total number of investments made
     * @return feesCollected Total marketplace fees collected
     */
    function getMarketplaceStats() external view returns (
        uint256 totalListings,
        uint256 totalServices,
        uint256 totalInvestments,
        uint256 feesCollected
    ) {
        return (listingCounter, serviceCounter, investmentCounter, totalFeesCollected);
    }
}
