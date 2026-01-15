// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title AxelarX Bridge Contract
 * @notice Cross-chain bridge for token transfers using Axelar network
 * @dev Supports multiple destination chains and token mappings
 */
contract AxelarXBridge is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    // ============ Structs ============
    struct BridgeRequest {
        uint256 id;
        address sender;
        address token;
        uint256 amount;
        string destinationChain;
        string destinationAddress;
        uint256 timestamp;
        bool completed;
        bytes32 txHash;
    }

    struct ChainConfig {
        bool enabled;
        uint256 minAmount;
        uint256 maxAmount;
        uint256 fee;          // Fee in basis points
        string contractAddress;
    }

    struct TokenConfig {
        bool enabled;
        address localAddress;
        mapping(string => string) remoteAddresses; // chain => address
    }

    // ============ State Variables ============
    mapping(uint256 => BridgeRequest) public bridgeRequests;
    mapping(string => ChainConfig) public chainConfigs;
    mapping(address => TokenConfig) public tokenConfigs;
    mapping(bytes32 => bool) public processedMessages;
    
    uint256 public nextRequestId = 1;
    uint256 public totalBridged;
    uint256 public collectedFees;
    
    address public axelarGateway;
    address public axelarGasService;
    
    string[] public supportedChains;
    address[] public supportedTokens;

    // ============ Events ============
    event BridgeInitiated(
        uint256 indexed requestId,
        address indexed sender,
        address token,
        uint256 amount,
        string destinationChain,
        string destinationAddress
    );
    
    event BridgeCompleted(
        uint256 indexed requestId,
        bytes32 txHash
    );
    
    event TokensReceived(
        bytes32 indexed messageId,
        string sourceChain,
        address recipient,
        address token,
        uint256 amount
    );
    
    event ChainConfigured(
        string chain,
        bool enabled,
        uint256 minAmount,
        uint256 maxAmount,
        uint256 fee
    );
    
    event TokenConfigured(
        address token,
        bool enabled
    );
    
    event FeesCollected(address indexed collector, uint256 amount);

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
     * @notice Bridge tokens to another chain
     * @param token Token to bridge
     * @param amount Amount to bridge
     * @param destinationChain Destination chain name
     * @param destinationAddress Recipient address on destination chain
     */
    function bridge(
        address token,
        uint256 amount,
        string calldata destinationChain,
        string calldata destinationAddress
    ) external payable nonReentrant whenNotPaused returns (uint256) {
        require(tokenConfigs[token].enabled, "Token not supported");
        
        ChainConfig storage chainConfig = chainConfigs[destinationChain];
        require(chainConfig.enabled, "Chain not supported");
        require(amount >= chainConfig.minAmount, "Amount below minimum");
        require(amount <= chainConfig.maxAmount, "Amount above maximum");
        
        // Calculate fee
        uint256 fee = (amount * chainConfig.fee) / 10000;
        uint256 bridgeAmount = amount - fee;
        
        // Transfer tokens
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        collectedFees += fee;
        
        // Create bridge request
        uint256 requestId = nextRequestId++;
        
        BridgeRequest storage request = bridgeRequests[requestId];
        request.id = requestId;
        request.sender = msg.sender;
        request.token = token;
        request.amount = bridgeAmount;
        request.destinationChain = destinationChain;
        request.destinationAddress = destinationAddress;
        request.timestamp = block.timestamp;
        request.completed = false;
        
        totalBridged += amount;
        
        // In production, this would call Axelar Gateway
        // _callAxelarBridge(token, bridgeAmount, destinationChain, destinationAddress);
        
        emit BridgeInitiated(requestId, msg.sender, token, bridgeAmount, destinationChain, destinationAddress);
        
        return requestId;
    }
    
    /**
     * @notice Complete a bridge request (called by relayer/owner)
     * @param requestId Bridge request ID
     * @param txHash Transaction hash on destination chain
     */
    function completeBridge(uint256 requestId, bytes32 txHash) external onlyOwner {
        BridgeRequest storage request = bridgeRequests[requestId];
        require(!request.completed, "Already completed");
        
        request.completed = true;
        request.txHash = txHash;
        
        emit BridgeCompleted(requestId, txHash);
    }
    
    /**
     * @notice Receive tokens from another chain (called by Axelar)
     * @param messageId Unique message ID
     * @param sourceChain Source chain name
     * @param recipient Recipient address
     * @param token Token address on this chain
     * @param amount Amount received
     */
    function receiveTokens(
        bytes32 messageId,
        string calldata sourceChain,
        address recipient,
        address token,
        uint256 amount
    ) external onlyOwner nonReentrant {
        // In production, validate Axelar message
        // require(msg.sender == axelarGateway, "Only Axelar gateway");
        
        require(!processedMessages[messageId], "Already processed");
        require(tokenConfigs[token].enabled, "Token not supported");
        
        processedMessages[messageId] = true;
        
        IERC20(token).safeTransfer(recipient, amount);
        
        emit TokensReceived(messageId, sourceChain, recipient, token, amount);
    }
    
    // ============ View Functions ============
    
    function getBridgeRequest(uint256 requestId) external view returns (BridgeRequest memory) {
        return bridgeRequests[requestId];
    }
    
    function getChainConfig(string calldata chain) external view returns (
        bool enabled,
        uint256 minAmount,
        uint256 maxAmount,
        uint256 fee,
        string memory contractAddress
    ) {
        ChainConfig storage config = chainConfigs[chain];
        return (config.enabled, config.minAmount, config.maxAmount, config.fee, config.contractAddress);
    }
    
    function isTokenSupported(address token) external view returns (bool) {
        return tokenConfigs[token].enabled;
    }
    
    function getSupportedChains() external view returns (string[] memory) {
        return supportedChains;
    }
    
    function getSupportedTokens() external view returns (address[] memory) {
        return supportedTokens;
    }
    
    function getStats() external view returns (uint256 _totalBridged, uint256 _collectedFees) {
        return (totalBridged, collectedFees);
    }
    
    // ============ Admin Functions ============
    
    function configureChain(
        string calldata chain,
        bool enabled,
        uint256 minAmount,
        uint256 maxAmount,
        uint256 fee,
        string calldata contractAddress
    ) external onlyOwner {
        ChainConfig storage config = chainConfigs[chain];
        
        // Add to supported chains if new
        if (!config.enabled && enabled) {
            supportedChains.push(chain);
        }
        
        config.enabled = enabled;
        config.minAmount = minAmount;
        config.maxAmount = maxAmount;
        config.fee = fee;
        config.contractAddress = contractAddress;
        
        emit ChainConfigured(chain, enabled, minAmount, maxAmount, fee);
    }
    
    function configureToken(
        address token,
        bool enabled
    ) external onlyOwner {
        TokenConfig storage config = tokenConfigs[token];
        
        // Add to supported tokens if new
        if (!config.enabled && enabled) {
            supportedTokens.push(token);
        }
        
        config.enabled = enabled;
        config.localAddress = token;
        
        emit TokenConfigured(token, enabled);
    }
    
    function setTokenRemoteAddress(
        address token,
        string calldata chain,
        string calldata remoteAddress
    ) external onlyOwner {
        tokenConfigs[token].remoteAddresses[chain] = remoteAddress;
    }
    
    function setAxelarAddresses(address _gateway, address _gasService) external onlyOwner {
        axelarGateway = _gateway;
        axelarGasService = _gasService;
    }
    
    function collectFees(address to) external onlyOwner {
        uint256 fees = collectedFees;
        collectedFees = 0;
        
        // Transfer native token fees
        (bool success, ) = to.call{value: address(this).balance}("");
        require(success, "Transfer failed");
        
        emit FeesCollected(to, fees);
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @notice Emergency withdraw (only owner)
     * @param token Token to withdraw (address(0) for native)
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            (bool success, ) = msg.sender.call{value: amount}("");
            require(success, "Transfer failed");
        } else {
            IERC20(token).safeTransfer(msg.sender, amount);
        }
    }
    
    // Allow receiving native tokens
    receive() external payable {}
}








