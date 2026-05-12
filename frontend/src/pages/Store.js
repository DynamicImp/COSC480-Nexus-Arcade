import React, { useState } from 'react';
import { ethers } from 'ethers';
import { chipAPI } from '../api';

const CONTRACT_ADDRESS = "0x39e3f80A0e1e9eCF60A941aD295Cd4db6204d596"; 

const CONTRACT_ABI = [
  "function buyChips() public payable"
];

const STORE_PACKAGES = [
  { id: 'starter', title: 'Starter Pack', chips: 100, costEth: '0.001', isSub: false },
  { id: 'pro', title: 'Pro Pack', chips: 550, costEth: '0.005', isSub: false },
  { id: 'elite', title: 'Elite Pack', chips: 1200, costEth: '0.01', isSub: false },
  { id: 'vip', title: 'VIP Pass (30 Days)', chips: 5000, costEth: '0.05', isSub: true }
];

const Store = ({ user, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState('buy');
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [sellAmount, setSellAmount] = useState('');

  const handlePurchase = async (pkg) => {
    setProcessingId(pkg.id);
    setError('');
    setSuccessMessage('');

    try {
      if (!window.ethereum) {
        throw new Error("Digital wallet provider not found. Please install a compatible wallet.");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();
      
      if (network.chainId !== 11155111n && network.chainId !== 11155111) {
        throw new Error("Please configure your wallet to the designated network.");
      }

      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const purchaseAmount = ethers.parseEther(pkg.costEth);

      const transaction = await contract.buyChips({ value: purchaseAmount });
      
      // Wait for network confirmation
      await transaction.wait();

      /**
       * Synchronize with backend using Ethers v6 transaction.hash.
       * We use a fallback for userId to ensure compatibility with different Auth payloads.
       */
      const response = await chipAPI.purchase({
        userId: user.id || user.userId,
        amount: pkg.chips,
        transactionHash: transaction.hash,
        isSubscription: pkg.isSub
      });

      setSuccessMessage(`Successfully acquired ${pkg.title}!`);
      
      if (onUpdateUser) {
        onUpdateUser({ 
          ...user, 
          chips: response.newBalance !== undefined ? response.newBalance : (user.chips + pkg.chips),
          isVip: pkg.isSub ? true : user.isVip 
        });
      }

    } catch (err) {
      console.error("Transaction Error:", err);
      if (err.code === 'ACTION_REJECTED') {
        setError("Transaction cancelled by user.");
      } else {
        setError(err.message || "A transaction error occurred.");
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleSell = async () => {
    setError('');
    setSuccessMessage('');
    const amountToSell = parseInt(sellAmount, 10);

    if (isNaN(amountToSell) || amountToSell <= 0) {
      setError("Please enter a valid amount to cash out.");
      return;
    }

    if (amountToSell > user.chips) {
      setError("Insufficient chip balance for this withdrawal.");
      return;
    }

    if (!user.walletAddress) {
      setError("Please link a MetaMask wallet in the Lobby before cashing out.");
      return;
    }

    setProcessingId('sell');

    try {
      const response = await chipAPI.sell({
        userId: user.id || user.userId,
        amount: amountToSell
      });

      const ethValue = (amountToSell * 0.00001).toFixed(5);
      setSuccessMessage(`Successfully cashed out ${amountToSell} chips. ${ethValue} Sepolia ETH authorized.`);
      setSellAmount('');
      
      if (onUpdateUser) {
        onUpdateUser({ 
          ...user, 
          chips: response.newBalance 
        });
      }

    } catch (err) {
      console.error("Withdrawal Error:", err);
      setError("Failed to process withdrawal. Please contact support.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto', padding: '20px', color: '#fff' }}>
      <h2 style={{ color: '#f39c12' }}>Arcade Cashier</h2>
      
      <div style={{ margin: '20px 0', padding: '15px', backgroundColor: '#16213e', borderRadius: '8px', border: '1px solid #e94560' }}>
        <h3 style={{ margin: 0 }}>Available Balance: <span style={{ color: '#2ecc71' }}>{user?.chips || 0}</span> Chips</h3>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', gap: '10px' }}>
        <button 
          onClick={() => setActiveTab('buy')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'buy' ? '#e94560' : '#1a1a2e',
            color: '#fff',
            border: activeTab === 'buy' ? '2px solid #e94560' : '2px solid #333',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Purchase Chips
        </button>
        <button 
          onClick={() => setActiveTab('sell')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'sell' ? '#3498db' : '#1a1a2e',
            color: '#fff',
            border: activeTab === 'sell' ? '2px solid #3498db' : '2px solid #333',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Cash Out
        </button>
      </div>

      {error && <div style={{ color: '#e74c3c', marginBottom: '15px', padding: '10px', backgroundColor: 'rgba(231, 76, 60, 0.1)', borderRadius: '5px', border: '1px solid #e74c3c' }}>{error}</div>}
      {successMessage && <div style={{ color: '#2ecc71', marginBottom: '15px', padding: '10px', backgroundColor: 'rgba(46, 204, 113, 0.1)', borderRadius: '5px', border: '1px solid #2ecc71' }}>{successMessage}</div>}

      {activeTab === 'buy' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          {STORE_PACKAGES.map((pkg) => (
            <div key={pkg.id} style={{ border: pkg.isSub ? '2px solid #f39c12' : '1px solid #333', borderRadius: '8px', padding: '20px', backgroundColor: '#1a1a2e' }}>
              <h3 style={{ color: pkg.isSub ? '#f39c12' : '#fff', marginTop: 0 }}>{pkg.title}</h3>
              <p style={{ fontSize: '28px', margin: '15px 0', fontWeight: 'bold', color: '#e94560' }}>{pkg.chips} Chips</p>
              <p style={{ color: '#888', marginBottom: '20px' }}>Cost: {pkg.costEth} ETH</p>
              <button 
                onClick={() => handlePurchase(pkg)} 
                disabled={processingId !== null}
                style={{ padding: '12px 20px', backgroundColor: processingId === pkg.id ? '#555' : (pkg.isSub ? '#f39c12' : '#e94560'), color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', width: '100%', fontWeight: 'bold' }}
              >
                {processingId === pkg.id ? 'Processing...' : 'Purchase'}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ border: '1px solid #333', borderRadius: '8px', padding: '30px', backgroundColor: '#1a1a2e', maxWidth: '500px', margin: '0 auto' }}>
          <h3 style={{ color: '#3498db', marginTop: 0 }}>Withdraw to Wallet</h3>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px' }}>Amount to Withdraw (Chips)</label>
            <input 
              type="number" 
              value={sellAmount}
              onChange={(e) => setSellAmount(e.target.value)}
              style={{ padding: '12px', width: '150px', textAlign: 'center', fontSize: '18px', backgroundColor: '#0f3460', color: '#2ecc71', border: '2px solid #333', borderRadius: '6px' }}
            />
          </div>
          <button 
            onClick={handleSell} 
            disabled={processingId !== null || !sellAmount}
            style={{ padding: '15px 20px', backgroundColor: processingId === 'sell' ? '#555' : '#3498db', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', width: '100%', fontWeight: 'bold' }}
          >
            {processingId === 'sell' ? 'Authorizing...' : 'Confirm Cash Out'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Store;