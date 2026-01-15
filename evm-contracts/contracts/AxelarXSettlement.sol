// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title AxelarX Settlement Contract
 * @notice Handles atomic settlement of trades and cross-chain transfers
 * @dev Integrates with Axelar for cross-chain messaging
 */
contract AxelarXSettlement is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    // ============ Enums ============
    enum SettlementStatus { Pending, Completed, Failed, Refunded }
    enum TransferType { Internal, CrossChain }

    // ============ Structs ============
    struct Settlement {
        uint256 id;
        uint256 tradeId;
        address maker;
        address taker;
        address makerToken;
        address takerToken;
        uint256 makerAmount;
        uint256 takerAmount;
        SettlementStatus status;
        uint256 timestamp;
        bytes32 txHash;
    }

    struct PendingTransfer {
        uint256 id;
        address sender;
        address recipient;
        address token;
        uint256 amount;
        string destinationChain;
        uint256 timestamp;
        bool completed;
    }

    // ============ State Variables ============
    mapping(uint256 => Settlement) public settlements;
    mapping(uint256 => PendingTransfer) public pendingTransfers;
    mapping(address => bool) public authorizedOrderBooks;
    mapping(address => bool) public supportedTokens;
    
    uint256 public nextSettlementId = 1;
    uint256 public nextTransferId = 1;
    
    uint256 public settlementTimeout = 1 hours;
    uint256 public totalSettlements;
    uint256 public totalVolume;
    
    address public axelarGateway;
    address public axelarGasService;

    // ============ Events ============
    event SettlementCreated(
        uint256 indexed settlementId,
        uint256 indexed tradeId,
        address maker,
        address taker
    );
    
    event SettlementCompleted(
        uint256 indexed settlementId,
        bytes32 txHash
    );
    
    event SettlementFailed(
        uint256 indexed settlementId,
        string reason
    );
    
    event CrossChainTransferInitiated(
        uint256 indexed transferId,
        address indexed sender,
        string destinationChain,
        uint256 amount
    );
    
    event CrossChainTransferCompleted(
        uint256 indexed transferId,
        bytes32 txHash
    );
    
    event OrderBookAuthorized(address indexed orderBook, bool authorized);
    event TokenSupported(address indexed token, bool supported);

    // ============ Modifiers ============
    modifier onlyAuthorizedOrderBook() {
        require(authorizedOrderBooks[msg.sender], "Not authorized order book");
        _;
    }

    // ============ Constructor ============
    constructor(
        address _axelarGateway,
        address _axelarGasService
    ) Ownable(msg.sender) {
        axelarGateway = _axelarGateway;
        axelarGasService = _axelarGasService;
    }

    // ============ External Functions ============
    
    /**
     * @notice Create a new settlement for a trade
     * @param tradeId Trade ID from the order book
     * @param maker Maker address
     * @param taker Taker address
     * @param makerToken Token the maker is selling
     * @param takerToken Token the taker is selling
     * @param makerAmount Amount of maker token
     * @param takerAmount Amount of taker token
     */
    function createSettlement(
        uint256 tradeId,
        address maker,
        address taker,
        address makerToken,
        address takerToken,
        uint256 makerAmount,
        uint256 takerAmount
    ) external onlyAuthorizedOrderBook nonReentrant whenNotPaused returns (uint256) {
        require(supportedTokens[makerToken] && supportedTokens[takerToken], "Token not supported");
        
        uint256 settlementId = nextSettlementId++;
        
        Settlement storage settlement = settlements[settlementId];
        settlement.id = settlementId;
        settlement.tradeId = tradeId;
        settlement.maker = maker;
        settlement.taker = taker;
        settlement.makerToken = makerToken;
        settlement.takerToken = takerToken;
        settlement.makerAmount = makerAmount;
        settlement.takerAmount = takerAmount;
        settlement.status = SettlementStatus.Pending;
        settlement.timestamp = block.timestamp;
        
        emit SettlementCreated(settlementId, tradeId, maker, taker);
        
        return settlementId;
    }
    
    /**
     * @notice Execute a pending settlement
     * @param settlementId Settlement ID to execute
     */
    function executeSettlement(uint256 settlementId) external nonReentrant whenNotPaused {
        Settlement storage settlement = settlements[settlementId];
        require(settlement.status == SettlementStatus.Pending, "Invalid settlement status");
        require(block.timestamp <= settlement.timestamp + settlementTimeout, "Settlement expired");
        
        // Transfer maker token to taker
        IERC20(settlement.makerToken).safeTransferFrom(
            settlement.maker,
            settlement.taker,
            settlement.makerAmount
        );
        
        // Transfer taker token to maker
        IERC20(settlement.takerToken).safeTransferFrom(
            settlement.taker,
            settlement.maker,
            settlement.takerAmount
        );
        
        settlement.status = SettlementStatus.Completed;
        settlement.txHash = bytes32(block.number);
        
        totalSettlements++;
        totalVolume += settlement.makerAmount;
        
        emit SettlementCompleted(settlementId, settlement.txHash);
    }
    
    /**
     * @notice Initiate a cross-chain transfer
     * @param token Token to transfer
     * @param amount Amount to transfer
     * @param destinationChain Destination chain name (e.g., "ethereum", "polygon")
     * @param destinationAddress Recipient address on destination chain
     */
    function initiateCrossChainTransfer(
        address token,
        uint256 amount,
        string calldata destinationChain,
        string calldata destinationAddress
    ) external payable nonReentrant whenNotPaused returns (uint256) {
        require(supportedTokens[token], "Token not supported");
        require(amount > 0, "Amount must be > 0");
        
        // Transfer tokens to this contract
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        
        uint256 transferId = nextTransferId++;
        
        PendingTransfer storage transfer = pendingTransfers[transferId];
        transfer.id = transferId;
        transfer.sender = msg.sender;
        transfer.token = token;
        transfer.amount = amount;
        transfer.destinationChain = destinationChain;
        transfer.timestamp = block.timestamp;
        transfer.completed = false;
        
        // In production, this would call Axelar Gateway
        // IAxelarGateway(axelarGateway).callContractWithToken(...)
        
        emit CrossChainTransferInitiated(transferId, msg.sender, destinationChain, amount);
        
        return transferId;
    }
    
    /**
     * @notice Handle incoming cross-chain transfer (called by Axelar)
     * @param transferId Transfer ID
     * @param recipient Recipient address
     * @param token Token address
     * @param amount Amount
     */
    function completeCrossChainTransfer(
        uint256 transferId,
        address recipient,
        address token,
        uint256 amount
    ) external onlyOwner nonReentrant {
        // In production, this would validate the Axelar message
        // require(msg.sender == axelarGateway, "Only Axelar gateway");
        
        require(supportedTokens[token], "Token not supported");
        
        IERC20(token).safeTransfer(recipient, amount);
        
        emit CrossChainTransferCompleted(transferId, bytes32(block.number));
    }
    
    /**
     * @notice Refund a failed settlement
     * @param settlementId Settlement ID to refund
     */
    function refundSettlement(uint256 settlementId) external nonReentrant {
        Settlement storage settlement = settlements[settlementId];
        require(
            settlement.status == SettlementStatus.Pending &&
            block.timestamp > settlement.timestamp + settlementTimeout,
            "Cannot refund"
        );
        
        settlement.status = SettlementStatus.Refunded;
        
        emit SettlementFailed(settlementId, "Settlement timeout");
    }
    
    // ============ View Functions ============
    
    function getSettlement(uint256 settlementId) external view returns (Settlement memory) {
        return settlements[settlementId];
    }
    
    function getPendingTransfer(uint256 transferId) external view returns (PendingTransfer memory) {
        return pendingTransfers[transferId];
    }
    
    function getStats() external view returns (uint256 _totalSettlements, uint256 _totalVolume) {
        return (totalSettlements, totalVolume);
    }
    
    // ============ Admin Functions ============
    
    function authorizeOrderBook(address orderBook, bool authorized) external onlyOwner {
        authorizedOrderBooks[orderBook] = authorized;
        emit OrderBookAuthorized(orderBook, authorized);
    }
    
    function setSupportedToken(address token, bool supported) external onlyOwner {
        supportedTokens[token] = supported;
        emit TokenSupported(token, supported);
    }
    
    function setSettlementTimeout(uint256 timeout) external onlyOwner {
        settlementTimeout = timeout;
    }
    
    function setAxelarAddresses(address _gateway, address _gasService) external onlyOwner {
        axelarGateway = _gateway;
        axelarGasService = _gasService;
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @notice Emergency withdraw (only owner)
     * @param token Token to withdraw
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(msg.sender, amount);
    }
}








