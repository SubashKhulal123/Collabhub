import React from 'react';
import WalletCard from '../components/Payments/WalletCard';

const WalletPage = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Wallet</h1>
      <WalletCard />
    </div>
  );
};

export default WalletPage;