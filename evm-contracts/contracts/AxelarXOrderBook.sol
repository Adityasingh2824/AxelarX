// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title AxelarX Order Book
 * @notice A high-performance Central Limit Order Book (CLOB) for decentralized trading
 * @dev Implements price-time priority matching with gas-optimized order management
 */
contract AxelarXOrderBook is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    // ============ Enums ============
    enum OrderSide { Buy, Sell }
    enum OrderType { Limit, Market }
    enum OrderStatus { Open, PartiallyFilled, Filled, Cancelled }
    enum TimeInForce { GTC, IOC, FOK, PostOnly }

    // ============ Structs ============
    struct Order {
        uint256 id;
        address trader;
        OrderSide side;
        OrderType orderType;
        uint256 price;          // Price in quote token (scaled by 1e18)
        uint256 quantity;       // Quantity in base token (scaled by decimals)
        uint256 filledQuantity;
        OrderStatus status;
        TimeInForce timeInForce;
        uint256 timestamp;
    }

    struct Trade {
        uint256 id;
        uint256 makerOrderId;
        uint256 takerOrderId;
        address maker;
        address taker;
        uint256 price;
        uint256 quantity;
        uint256 timestamp;
    }

    struct MarketStats {
        uint256 lastPrice;
        uint256 bestBid;
        uint256 bestAsk;
        uint256 volume24h;
        uint256 high24h;
        uint256 low24h;
        uint256 totalTrades;
    }

    // ============ State Variables ============
    IERC20 public immutable baseToken;
    IERC20 public immutable quoteToken;
    
    string public baseSymbol;
    string public quoteSymbol;
    
    uint256 public nextOrderId = 1;
    uint256 public nextTradeId = 1;
    
    uint256 public makerFeeBps = 10;    // 0.1%
    uint256 public takerFeeBps = 20;    // 0.2%
    uint256 public minOrderSize;
    uint256 public maxOrderSize;
    uint256 public tickSize = 1;        // Minimum price increment
    
    uint256 public collectedFees;
    
    MarketStats public marketStats;

    // Order storage
    mapping(uint256 => Order) public orders;
    mapping(address => uint256[]) public userOrders;
    mapping(address => mapping(address => uint256)) public balances; // user => token => balance
    
    // Order book structure (price => orderIds)
    uint256[] public bidPrices;         // Sorted descending
    uint256[] public askPrices;         // Sorted ascending
    mapping(uint256 => uint256[]) public bidsAtPrice;
    mapping(uint256 => uint256[]) public asksAtPrice;

    // Recent trades
    Trade[] public recentTrades;
    uint256 public constant MAX_RECENT_TRADES = 100;

    // ============ Events ============
    event OrderPlaced(
        uint256 indexed orderId,
        address indexed trader,
        OrderSide side,
        OrderType orderType,
        uint256 price,
        uint256 quantity
    );
    
    event OrderCancelled(uint256 indexed orderId, address indexed trader);
    
    event OrderFilled(
        uint256 indexed orderId,
        uint256 filledQuantity,
        uint256 remainingQuantity
    );
    
    event TradeExecuted(
        uint256 indexed tradeId,
        uint256 indexed makerOrderId,
        uint256 indexed takerOrderId,
        address maker,
        address taker,
        uint256 price,
        uint256 quantity
    );
    
    event Deposit(address indexed user, address indexed token, uint256 amount);
    event Withdrawal(address indexed user, address indexed token, uint256 amount);
    event FeesCollected(address indexed collector, uint256 amount);

    // ============ Constructor ============
    constructor(
        address _baseToken,
        address _quoteToken,
        string memory _baseSymbol,
        string memory _quoteSymbol,
        uint256 _minOrderSize,
        uint256 _maxOrderSize
    ) Ownable(msg.sender) {
        baseToken = IERC20(_baseToken);
        quoteToken = IERC20(_quoteToken);
        baseSymbol = _baseSymbol;
        quoteSymbol = _quoteSymbol;
        minOrderSize = _minOrderSize;
        maxOrderSize = _maxOrderSize;
    }

    // ============ External Functions ============
    
    /**
     * @notice Deposit tokens to the order book
     * @param token Token address to deposit
     * @param amount Amount to deposit
     */
    function deposit(address token, uint256 amount) external nonReentrant whenNotPaused {
        require(token == address(baseToken) || token == address(quoteToken), "Invalid token");
        require(amount > 0, "Amount must be > 0");
        
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        balances[msg.sender][token] += amount;
        
        emit Deposit(msg.sender, token, amount);
    }
    
    /**
     * @notice Withdraw tokens from the order book
     * @param token Token address to withdraw
     * @param amount Amount to withdraw
     */
    function withdraw(address token, uint256 amount) external nonReentrant {
        require(token == address(baseToken) || token == address(quoteToken), "Invalid token");
        require(balances[msg.sender][token] >= amount, "Insufficient balance");
        
        balances[msg.sender][token] -= amount;
        IERC20(token).safeTransfer(msg.sender, amount);
        
        emit Withdrawal(msg.sender, token, amount);
    }
    
    /**
     * @notice Place a new order
     * @param side Order side (Buy/Sell)
     * @param orderType Order type (Limit/Market)
     * @param price Price in quote token (ignored for market orders)
     * @param quantity Quantity in base token
     * @param timeInForce Time in force option
     */
    function placeOrder(
        OrderSide side,
        OrderType orderType,
        uint256 price,
        uint256 quantity,
        TimeInForce timeInForce
    ) external nonReentrant whenNotPaused returns (uint256 orderId) {
        require(quantity >= minOrderSize, "Order too small");
        require(quantity <= maxOrderSize, "Order too large");
        
        if (orderType == OrderType.Limit) {
            require(price > 0, "Price must be > 0");
            require(price % tickSize == 0, "Price not aligned to tick size");
        }
        
        // Lock funds
        if (side == OrderSide.Buy) {
            uint256 requiredQuote = (quantity * price) / 1e18;
            require(balances[msg.sender][address(quoteToken)] >= requiredQuote, "Insufficient quote balance");
            balances[msg.sender][address(quoteToken)] -= requiredQuote;
        } else {
            require(balances[msg.sender][address(baseToken)] >= quantity, "Insufficient base balance");
            balances[msg.sender][address(baseToken)] -= quantity;
        }
        
        orderId = nextOrderId++;
        
        Order storage order = orders[orderId];
        order.id = orderId;
        order.trader = msg.sender;
        order.side = side;
        order.orderType = orderType;
        order.price = price;
        order.quantity = quantity;
        order.filledQuantity = 0;
        order.status = OrderStatus.Open;
        order.timeInForce = timeInForce;
        order.timestamp = block.timestamp;
        
        userOrders[msg.sender].push(orderId);
        
        emit OrderPlaced(orderId, msg.sender, side, orderType, price, quantity);
        
        // Try to match the order
        _matchOrder(orderId);
        
        // Add to order book if not fully filled
        if (order.status == OrderStatus.Open || order.status == OrderStatus.PartiallyFilled) {
            if (orderType == OrderType.Limit) {
                if (timeInForce == TimeInForce.IOC) {
                    // Cancel remaining for IOC
                    _cancelOrder(orderId);
                } else if (timeInForce != TimeInForce.FOK || order.filledQuantity == 0) {
                    _addToOrderBook(orderId);
                }
            }
        }
        
        return orderId;
    }
    
    /**
     * @notice Cancel an existing order
     * @param orderId Order ID to cancel
     */
    function cancelOrder(uint256 orderId) external nonReentrant {
        Order storage order = orders[orderId];
        require(order.trader == msg.sender, "Not order owner");
        require(order.status == OrderStatus.Open || order.status == OrderStatus.PartiallyFilled, "Order not active");
        
        _cancelOrder(orderId);
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get order book (bids and asks)
     * @param limit Maximum number of price levels to return
     */
    function getOrderBook(uint256 limit) external view returns (
        uint256[] memory bidPricesOut,
        uint256[] memory bidQuantities,
        uint256[] memory askPricesOut,
        uint256[] memory askQuantities
    ) {
        uint256 bidCount = bidPrices.length < limit ? bidPrices.length : limit;
        uint256 askCount = askPrices.length < limit ? askPrices.length : limit;
        
        bidPricesOut = new uint256[](bidCount);
        bidQuantities = new uint256[](bidCount);
        askPricesOut = new uint256[](askCount);
        askQuantities = new uint256[](askCount);
        
        for (uint256 i = 0; i < bidCount; i++) {
            bidPricesOut[i] = bidPrices[i];
            bidQuantities[i] = _getTotalQuantityAtPrice(bidPrices[i], true);
        }
        
        for (uint256 i = 0; i < askCount; i++) {
            askPricesOut[i] = askPrices[i];
            askQuantities[i] = _getTotalQuantityAtPrice(askPrices[i], false);
        }
    }
    
    /**
     * @notice Get user's active orders
     * @param user User address
     */
    function getUserOrders(address user) external view returns (Order[] memory) {
        uint256[] storage orderIds = userOrders[user];
        uint256 activeCount = 0;
        
        for (uint256 i = 0; i < orderIds.length; i++) {
            if (orders[orderIds[i]].status == OrderStatus.Open || 
                orders[orderIds[i]].status == OrderStatus.PartiallyFilled) {
                activeCount++;
            }
        }
        
        Order[] memory activeOrders = new Order[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < orderIds.length; i++) {
            if (orders[orderIds[i]].status == OrderStatus.Open || 
                orders[orderIds[i]].status == OrderStatus.PartiallyFilled) {
                activeOrders[index++] = orders[orderIds[i]];
            }
        }
        
        return activeOrders;
    }
    
    /**
     * @notice Get recent trades
     * @param limit Maximum number of trades to return
     */
    function getRecentTrades(uint256 limit) external view returns (Trade[] memory) {
        uint256 count = recentTrades.length < limit ? recentTrades.length : limit;
        Trade[] memory trades = new Trade[](count);
        
        for (uint256 i = 0; i < count; i++) {
            trades[i] = recentTrades[recentTrades.length - 1 - i];
        }
        
        return trades;
    }
    
    /**
     * @notice Get user balance
     * @param user User address
     * @param token Token address
     */
    function getBalance(address user, address token) external view returns (uint256) {
        return balances[user][token];
    }
    
    /**
     * @notice Get market statistics
     */
    function getMarketStats() external view returns (MarketStats memory) {
        return marketStats;
    }
    
    // ============ Admin Functions ============
    
    function setFees(uint256 _makerFeeBps, uint256 _takerFeeBps) external onlyOwner {
        require(_makerFeeBps <= 100, "Maker fee too high");
        require(_takerFeeBps <= 100, "Taker fee too high");
        makerFeeBps = _makerFeeBps;
        takerFeeBps = _takerFeeBps;
    }
    
    function setOrderSizeLimits(uint256 _minOrderSize, uint256 _maxOrderSize) external onlyOwner {
        minOrderSize = _minOrderSize;
        maxOrderSize = _maxOrderSize;
    }
    
    function setTickSize(uint256 _tickSize) external onlyOwner {
        require(_tickSize > 0, "Invalid tick size");
        tickSize = _tickSize;
    }
    
    function collectFees(address to) external onlyOwner {
        uint256 fees = collectedFees;
        collectedFees = 0;
        quoteToken.safeTransfer(to, fees);
        emit FeesCollected(to, fees);
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // ============ Internal Functions ============
    
    function _matchOrder(uint256 orderId) internal {
        Order storage takerOrder = orders[orderId];
        
        if (takerOrder.side == OrderSide.Buy) {
            _matchBuyOrder(orderId);
        } else {
            _matchSellOrder(orderId);
        }
    }
    
    function _matchBuyOrder(uint256 takerOrderId) internal {
        Order storage takerOrder = orders[takerOrderId];
        
        uint256 i = 0;
        while (i < askPrices.length && takerOrder.filledQuantity < takerOrder.quantity) {
            uint256 askPrice = askPrices[i];
            
            // Check if price matches
            if (takerOrder.orderType == OrderType.Market || takerOrder.price >= askPrice) {
                uint256[] storage ordersAtPrice = asksAtPrice[askPrice];
                
                uint256 j = 0;
                while (j < ordersAtPrice.length && takerOrder.filledQuantity < takerOrder.quantity) {
                    uint256 makerOrderId = ordersAtPrice[j];
                    Order storage makerOrder = orders[makerOrderId];
                    
                    if (makerOrder.status == OrderStatus.Open || makerOrder.status == OrderStatus.PartiallyFilled) {
                        _executeTrade(makerOrderId, takerOrderId, askPrice);
                    }
                    
                    if (makerOrder.status == OrderStatus.Filled) {
                        // Remove from price level
                        _removeOrderFromPriceLevel(askPrice, j, false);
                    } else {
                        j++;
                    }
                }
                
                // Remove empty price level
                if (asksAtPrice[askPrice].length == 0) {
                    _removePriceLevel(i, false);
                } else {
                    i++;
                }
            } else {
                break; // No more matching prices
            }
        }
    }
    
    function _matchSellOrder(uint256 takerOrderId) internal {
        Order storage takerOrder = orders[takerOrderId];
        
        uint256 i = 0;
        while (i < bidPrices.length && takerOrder.filledQuantity < takerOrder.quantity) {
            uint256 bidPrice = bidPrices[i];
            
            // Check if price matches
            if (takerOrder.orderType == OrderType.Market || takerOrder.price <= bidPrice) {
                uint256[] storage ordersAtPrice = bidsAtPrice[bidPrice];
                
                uint256 j = 0;
                while (j < ordersAtPrice.length && takerOrder.filledQuantity < takerOrder.quantity) {
                    uint256 makerOrderId = ordersAtPrice[j];
                    Order storage makerOrder = orders[makerOrderId];
                    
                    if (makerOrder.status == OrderStatus.Open || makerOrder.status == OrderStatus.PartiallyFilled) {
                        _executeTrade(makerOrderId, takerOrderId, bidPrice);
                    }
                    
                    if (makerOrder.status == OrderStatus.Filled) {
                        _removeOrderFromPriceLevel(bidPrice, j, true);
                    } else {
                        j++;
                    }
                }
                
                if (bidsAtPrice[bidPrice].length == 0) {
                    _removePriceLevel(i, true);
                } else {
                    i++;
                }
            } else {
                break;
            }
        }
    }
    
    function _executeTrade(uint256 makerOrderId, uint256 takerOrderId, uint256 price) internal {
        Order storage makerOrder = orders[makerOrderId];
        Order storage takerOrder = orders[takerOrderId];
        
        uint256 makerRemaining = makerOrder.quantity - makerOrder.filledQuantity;
        uint256 takerRemaining = takerOrder.quantity - takerOrder.filledQuantity;
        uint256 fillQuantity = makerRemaining < takerRemaining ? makerRemaining : takerRemaining;
        
        if (fillQuantity == 0) return;
        
        uint256 quoteAmount = (fillQuantity * price) / 1e18;
        
        // Calculate fees
        uint256 makerFee = (quoteAmount * makerFeeBps) / 10000;
        uint256 takerFee = (quoteAmount * takerFeeBps) / 10000;
        
        // Update filled quantities
        makerOrder.filledQuantity += fillQuantity;
        takerOrder.filledQuantity += fillQuantity;
        
        // Update order statuses
        if (makerOrder.filledQuantity >= makerOrder.quantity) {
            makerOrder.status = OrderStatus.Filled;
        } else {
            makerOrder.status = OrderStatus.PartiallyFilled;
        }
        
        if (takerOrder.filledQuantity >= takerOrder.quantity) {
            takerOrder.status = OrderStatus.Filled;
        } else {
            takerOrder.status = OrderStatus.PartiallyFilled;
        }
        
        // Transfer tokens
        if (takerOrder.side == OrderSide.Buy) {
            // Taker buys base, maker sells base
            balances[takerOrder.trader][address(baseToken)] += fillQuantity;
            balances[makerOrder.trader][address(quoteToken)] += quoteAmount - makerFee;
        } else {
            // Taker sells base, maker buys base
            balances[takerOrder.trader][address(quoteToken)] += quoteAmount - takerFee;
            balances[makerOrder.trader][address(baseToken)] += fillQuantity;
        }
        
        collectedFees += makerFee + takerFee;
        
        // Record trade
        uint256 tradeId = nextTradeId++;
        Trade memory trade = Trade({
            id: tradeId,
            makerOrderId: makerOrderId,
            takerOrderId: takerOrderId,
            maker: makerOrder.trader,
            taker: takerOrder.trader,
            price: price,
            quantity: fillQuantity,
            timestamp: block.timestamp
        });
        
        if (recentTrades.length >= MAX_RECENT_TRADES) {
            // Shift array (gas expensive but acceptable for limited size)
            for (uint256 i = 0; i < recentTrades.length - 1; i++) {
                recentTrades[i] = recentTrades[i + 1];
            }
            recentTrades[recentTrades.length - 1] = trade;
        } else {
            recentTrades.push(trade);
        }
        
        // Update market stats
        marketStats.lastPrice = price;
        marketStats.totalTrades++;
        marketStats.volume24h += fillQuantity;
        
        if (price > marketStats.high24h) marketStats.high24h = price;
        if (marketStats.low24h == 0 || price < marketStats.low24h) marketStats.low24h = price;
        
        emit TradeExecuted(tradeId, makerOrderId, takerOrderId, makerOrder.trader, takerOrder.trader, price, fillQuantity);
        emit OrderFilled(makerOrderId, makerOrder.filledQuantity, makerOrder.quantity - makerOrder.filledQuantity);
        emit OrderFilled(takerOrderId, takerOrder.filledQuantity, takerOrder.quantity - takerOrder.filledQuantity);
    }
    
    function _addToOrderBook(uint256 orderId) internal {
        Order storage order = orders[orderId];
        
        if (order.side == OrderSide.Buy) {
            _insertPriceLevel(order.price, true);
            bidsAtPrice[order.price].push(orderId);
            _updateBestBid();
        } else {
            _insertPriceLevel(order.price, false);
            asksAtPrice[order.price].push(orderId);
            _updateBestAsk();
        }
    }
    
    function _cancelOrder(uint256 orderId) internal {
        Order storage order = orders[orderId];
        uint256 remainingQuantity = order.quantity - order.filledQuantity;
        
        // Refund locked funds
        if (order.side == OrderSide.Buy) {
            uint256 refundQuote = (remainingQuantity * order.price) / 1e18;
            balances[order.trader][address(quoteToken)] += refundQuote;
        } else {
            balances[order.trader][address(baseToken)] += remainingQuantity;
        }
        
        order.status = OrderStatus.Cancelled;
        
        // Remove from order book
        if (order.side == OrderSide.Buy) {
            _removeOrderFromBook(orderId, order.price, true);
        } else {
            _removeOrderFromBook(orderId, order.price, false);
        }
        
        emit OrderCancelled(orderId, order.trader);
    }
    
    function _removeOrderFromBook(uint256 orderId, uint256 price, bool isBid) internal {
        uint256[] storage ordersAtPrice = isBid ? bidsAtPrice[price] : asksAtPrice[price];
        
        for (uint256 i = 0; i < ordersAtPrice.length; i++) {
            if (ordersAtPrice[i] == orderId) {
                ordersAtPrice[i] = ordersAtPrice[ordersAtPrice.length - 1];
                ordersAtPrice.pop();
                break;
            }
        }
        
        // Remove price level if empty
        if (ordersAtPrice.length == 0) {
            uint256[] storage prices = isBid ? bidPrices : askPrices;
            for (uint256 i = 0; i < prices.length; i++) {
                if (prices[i] == price) {
                    prices[i] = prices[prices.length - 1];
                    prices.pop();
                    
                    // Re-sort
                    if (isBid) {
                        _sortBidPrices();
                        _updateBestBid();
                    } else {
                        _sortAskPrices();
                        _updateBestAsk();
                    }
                    break;
                }
            }
        }
    }
    
    function _insertPriceLevel(uint256 price, bool isBid) internal {
        uint256[] storage prices = isBid ? bidPrices : askPrices;
        
        // Check if price level already exists
        for (uint256 i = 0; i < prices.length; i++) {
            if (prices[i] == price) return;
        }
        
        prices.push(price);
        
        if (isBid) {
            _sortBidPrices();
        } else {
            _sortAskPrices();
        }
    }
    
    function _removePriceLevel(uint256 index, bool isBid) internal {
        uint256[] storage prices = isBid ? bidPrices : askPrices;
        prices[index] = prices[prices.length - 1];
        prices.pop();
        
        if (isBid) {
            _sortBidPrices();
            _updateBestBid();
        } else {
            _sortAskPrices();
            _updateBestAsk();
        }
    }
    
    function _removeOrderFromPriceLevel(uint256 price, uint256 index, bool isBid) internal {
        uint256[] storage ordersAtPrice = isBid ? bidsAtPrice[price] : asksAtPrice[price];
        ordersAtPrice[index] = ordersAtPrice[ordersAtPrice.length - 1];
        ordersAtPrice.pop();
    }
    
    function _sortBidPrices() internal {
        // Simple insertion sort for bids (descending)
        for (uint256 i = 1; i < bidPrices.length; i++) {
            uint256 key = bidPrices[i];
            int256 j = int256(i) - 1;
            
            while (j >= 0 && bidPrices[uint256(j)] < key) {
                bidPrices[uint256(j + 1)] = bidPrices[uint256(j)];
                j--;
            }
            bidPrices[uint256(j + 1)] = key;
        }
    }
    
    function _sortAskPrices() internal {
        // Simple insertion sort for asks (ascending)
        for (uint256 i = 1; i < askPrices.length; i++) {
            uint256 key = askPrices[i];
            int256 j = int256(i) - 1;
            
            while (j >= 0 && askPrices[uint256(j)] > key) {
                askPrices[uint256(j + 1)] = askPrices[uint256(j)];
                j--;
            }
            askPrices[uint256(j + 1)] = key;
        }
    }
    
    function _updateBestBid() internal {
        marketStats.bestBid = bidPrices.length > 0 ? bidPrices[0] : 0;
    }
    
    function _updateBestAsk() internal {
        marketStats.bestAsk = askPrices.length > 0 ? askPrices[0] : 0;
    }
    
    function _getTotalQuantityAtPrice(uint256 price, bool isBid) internal view returns (uint256) {
        uint256[] storage orderIds = isBid ? bidsAtPrice[price] : asksAtPrice[price];
        uint256 total = 0;
        
        for (uint256 i = 0; i < orderIds.length; i++) {
            Order storage order = orders[orderIds[i]];
            if (order.status == OrderStatus.Open || order.status == OrderStatus.PartiallyFilled) {
                total += order.quantity - order.filledQuantity;
            }
        }
        
        return total;
    }
}








