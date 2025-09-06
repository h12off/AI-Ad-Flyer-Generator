
import React from 'react';
import { DownloadIcon } from './Icon';

interface PaywallModalProps {
  onClose: () => void;
}

const PaywallModal: React.FC<PaywallModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center border border-gray-700 shadow-2xl">
        <h2 className="text-4xl font-bold text-amber-400 mb-4">Unlock Unlimited Downloads</h2>
        <p className="text-gray-300 mb-6">
          You've used your free download. Subscribe to our monthly plan to get unlimited downloads and generate as many ad flyers as you need.
        </p>
        <div className="bg-gray-900 p-6 rounded-lg mb-6">
            <p className="text-5xl font-black text-white">$25<span className="text-2xl font-medium text-gray-400">/month</span></p>
        </div>
        {/* 
          Replace the href below with your Stripe Payment Link.
          You can create a payment link in your Stripe dashboard:
          https://dashboard.stripe.com/payment-links
        */}
        <a
          href="https://buy.stripe.com/14A8wQet88o07ZhalReME1S"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-4 rounded-lg transition-colors duration-300 text-lg"
        >
          <DownloadIcon className="w-6 h-6" />
          Subscribe Now
        </a>
        <button
          onClick={onClose}
          className="mt-4 text-gray-400 hover:text-white transition-colors"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
};

export default PaywallModal;
