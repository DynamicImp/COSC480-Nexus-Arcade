import React, { useState } from 'react';
import { ethers } from 'ethers';
import { chipAPI } from '../api';

// Smart contract configuration
// TEMP remember to replace this with the actual address when deploy ChipVault
const CONTRACT_ADDRESS = "0xf02F83EC402c9A3FCfCBbeDA424C99a9F21b6f30"; 

// Minimal ABI required to interact with the ChipVault contract
const CONTRACT_ABI = [
  "function buyChips() public payable"
];

const Store = ({ user, onUpdateUser }) => {
  // Component state management
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Executes the Web3 transaction and synchronizes with the backend database
  const handlePurchase = async () => {
    setIsProcessing(true);
    setError('');
    setSuccessMessage('');

    try {
      // Verify MetaMask injection in the browser environment
      if (!window.ethereum) {
        throw new Error("MetaMask is not installed. Please install it to use the Web3 Store.");
      }

      // Initialize ethers provider and request user account access
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      
      // Obtain the signer instance for transaction authorization
      const signer = provider.getSigner();

      // Ensure the wallet is connected to the correct network (Sepolia Chain ID: 11155111)
      const network = await provider.getNetwork();
      if (network.chainId !== 11155111) {
        throw new Error("Please switch your MetaMask network to Sepolia.");
      }

      // Instantiate the smart contract interface
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      // Define the transaction value (0.001 Sepolia ETH)
      const purchaseAmount = ethers.utils.parseEther("0.001");

      // Execute the contract function
      const transaction = await contract.buyChips({ value: purchaseAmount });
      
      // Await network confirmation
      const receipt = await transaction.wait();

      // Synchronize successful blockchain transaction with the Web2 SQLite database
      const response = await chipAPI.purchase({
        userId: user.id,
        amount: 100, // 0.001 ETH grants 100 chips
        transactionHash: receipt.transactionHash
      });

      // Update local application state and UI
      setSuccessMessage(`Transaction confirmed! 100 chips added to your account.`);
      if (onUpdateUser) {
        onUpdateUser({ ...user, chips: response.newBalance });
      }

    } catch (err) {
      console.error("Web3 Purchase Error:", err);
      // Format MetaMask user rejection errors for cleaner UI display
      if (err.code === 'ACTION_REJECTED') {
        setError("Transaction was rejected by the user.");
      } else {
        setError(err.message || "An error occurred during the transaction.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h2>Web3 Chip Exchange</h2>
      <p>Convert Sepolia ETH into Arcade Chips directly via the blockchain.</p>

      {/* User Balance Display */}
      <div style={{ margin: '20px 0', padding: '15px', backgroundColor: '#f0f4f8', borderRadius: '8px' }}>
        <h3>Current Balance: {user?.chips || 0} Chips</h3>
      </div>

      {/* Exchange Rate Card */}
      <div style={{ border: '2px solid #ddd', borderRadius: '8px', padding: '30px', backgroundColor: '#fff' }}>
        <h3>Standard Package</h3>
        <p style={{ fontSize: '24px', margin: '15px 0' }}><strong>100 Chips</strong></p>
        <p style={{ color: '#666', marginBottom: '20px' }}>Cost: 0.001 Sepolia ETH</p>
        
        {/* Error and Success Messaging */}
        {error && <div style={{ color: '#e74c3c', marginBottom: '15px', padding: '10px', backgroundColor: '#fdedec', borderRadius: '5px' }}>{error}</div>}
        {successMessage && <div style={{ color: '#2ecc71', marginBottom: '15px', padding: '10px', backgroundColor: '#eafaf1', borderRadius: '5px' }}>{successMessage}</div>}

        {/* Transaction Action Button */}
        <button 
          onClick={handlePurchase} 
          disabled={isProcessing}
          style={{ 
            padding: '15px 30px', 
            fontSize: '18px', 
            backgroundColor: isProcessing ? '#95a5a6' : '#f39c12', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '5px', 
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            width: '100%',
            fontWeight: 'bold'
          }}
        >
          {isProcessing ? 'Processing Transaction...' : 'Buy 100 Chips with MetaMask'}
        </button>
      </div>
      <p style={{ marginTop: '20px', fontSize: '12px', color: '#888' }}>
        Transactions are processed securely on the Ethereum Sepolia Testnet. Gas fees apply.
      </p>
    </div>
  );
};

export default Store;