// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ChipVault {
    address public owner;
    
    uint256 public minimumPurchase = 0.001 ether; 

    event ChipsPurchased(address indexed buyer, uint256 amountPaid);
    event ChipsCashedOut(address indexed player, uint256 amountReturned);

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Accepts incoming ETH and logs the purchase for the off-chain backend to process.
     */
    function buyChips() public payable {
        require(msg.value >= minimumPurchase, "Insufficient ETH sent to buy chips");
        emit ChipsPurchased(msg.sender, msg.value);
    }

    /**
     * @dev Executes an authorized withdrawal of ETH to a designated player address.
     * Only the deployer (the backend server) can authorize this transaction, 
     * ensuring off-chain chip balances are verified prior to on-chain execution.
     * * @param _player The destination wallet address for the ETH payout.
     * @param _ethAmount The quantity of wei to transfer.
     */
    function cashOutPlayer(address payable _player, uint256 _ethAmount) public {
        require(msg.sender == owner, "Unauthorized: Oracle backend signature required");
        require(address(this).balance >= _ethAmount, "Vault liquidity insufficient for payout");
        
        _player.transfer(_ethAmount);
        
        emit ChipsCashedOut(_player, _ethAmount);
    }

    /**
     * @dev Allows the administrative owner to withdraw accumulated protocol revenue.
     */
    function withdrawProfits() public {
        require(msg.sender == owner, "Unauthorized: Owner access required");
        payable(owner).transfer(address(this).balance);
    }

    /**
     * @dev Fallback mechanism to allow direct funding of the vault liquidity pool.
     */
    receive() external payable {}
}