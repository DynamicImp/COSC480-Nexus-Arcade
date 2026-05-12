// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ChipVault {
    address public owner;
    
    // Defines how much Sepolia ETH it costs to buy a batch of chips
    uint256 public minimumPurchase = 0.001 ether; 

    // An event that acts as a blockchain "receipt" when someone buys chips
    event ChipsPurchased(address indexed buyer, uint256 amountPaid);

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Allows users to send Sepolia ETH to the arcade's bank
     */
    function buyChips() public payable {
        // Ensures the user sent at least the minimum required ETH
        require(msg.value >= minimumPurchase, "Insufficient ETH sent to buy chips");
        
        // Broadcasts the purchase to the blockchain so your backend can hear it
        emit ChipsPurchased(msg.sender, msg.value);
    }

    /**
     * @dev Allows the arcade owner to withdraw the collected ETH profits
     */
    function withdrawProfits() public {
        // Security check: Only the owner can call this function
        require(msg.sender == owner, "Only the arcade owner can withdraw profits");
        
        // Transfers all the ETH stored in this contract to the owner's wallet
        payable(owner).transfer(address(this).balance);
    }
}