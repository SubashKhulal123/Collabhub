import React, { useState, useEffect } from 'react';
import { enable2FA, verify2FA, disable2FA } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { FiShield, FiCheck, FiX, FiCopy } from 'react-icons/fi';

const TwoFactorSetup = () => {
  const { user, setUser } = useAuth();
  const [step, setStep] = useState('start');
  const [secret, setSecret] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.twoFactorEnabled) {
      setStep('enabled');
    }
  }, [user]);

  const handleEnable = async () => {
    setLoading(true);
    try {
      const { data } = await enable2FA();
      setSecret(data.secret);
      setQrCode(data.qrCode);
      setStep('qr');
      toast.success('Scan the QR code with Google Authenticator');
    } catch (error) {
      console.error('Enable error:', error);
      toast.error(error.response?.data?.message || 'Failed to setup 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    try {
      await verify2FA(verificationCode);
      setUser({ ...user, twoFactorEnabled: true });
      setStep('success');
      toast.success('2FA enabled successfully!');
    } catch (error) {
      console.error('Verify error:', error);
      toast.error(error.response?.data?.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    const code = prompt('Enter your 2FA code to disable:');
    if (!code || code.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    try {
      await disable2FA(code);
      setUser({ ...user, twoFactorEnabled: false });
      setStep('start');
      toast.success('2FA disabled successfully');
    } catch (error) {
      console.error('Disable error:', error);
      toast.error(error.response?.data?.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(secret);
    toast.success('Secret key copied!');
  };

  if (step === 'enabled') {
    return (
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <FiShield className="mx-auto text-green-500" size={48} />
          <h2 className="text-xl font-bold mt-4">2FA is Enabled</h2>
          <p className="text-gray-600 mt-2">Your account is protected with two-factor authentication.</p>
          <button
            onClick={handleDisable}
            disabled={loading}
            className="mt-6 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
          >
            {loading ? 'Processing...' : 'Disable 2FA'}
          </button>
        </div>
      </div>
    );
  }

  if (step === 'qr') {
    return (
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h2 className="text-xl font-bold mb-4">Scan QR Code</h2>
          <p className="text-gray-600 mb-4">Scan this QR code with Google Authenticator or any authenticator app</p>
          
          <div className="bg-white p-4 rounded-lg inline-block mx-auto">
            {qrCode && <img src={qrCode} alt="QR Code" className="w-48 h-48 mx-auto" />}
          </div>
          
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Or enter this code manually:</p>
            <div className="flex items-center justify-center space-x-2 mt-1">
              <code className="text-lg font-mono bg-gray-200 px-3 py-1 rounded">{secret}</code>
              <button onClick={copyToClipboard} className="text-indigo-600 hover:text-indigo-800">
                <FiCopy size={18} />
              </button>
            </div>
          </div>
          
          <div className="mt-6">
            <label className="block text-sm font-medium mb-1">Verification Code</label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="Enter 6-digit code"
              maxLength={6}
              className="input-field text-center text-lg"
            />
            <button
              onClick={handleVerify}
              disabled={loading}
              className="mt-4 btn-primary w-full"
            >
              {loading ? 'Verifying...' : 'Verify & Enable'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <FiCheck className="mx-auto text-green-500" size={48} />
          <h2 className="text-xl font-bold mt-4">2FA Enabled!</h2>
          <p className="text-gray-600 mt-2">Your account is now protected with two-factor authentication.</p>
          <button
            onClick={() => window.location.href = '/profile'}
            className="mt-6 btn-primary"
          >
            Back to Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <FiShield className="mx-auto text-indigo-600" size={48} />
        <h2 className="text-xl font-bold mt-4">Two-Factor Authentication</h2>
        <p className="text-gray-600 mt-2">
          Add an extra layer of security to your account by enabling two-factor authentication.
        </p>
        <ul className="text-left text-sm text-gray-600 mt-4 space-y-2">
          <li>✓ • Download Google Authenticator or similar app</li>
          <li>✓ • Scan the QR code with your app</li>
          <li>✓ • Enter the 6-digit code to verify</li>
        </ul>
        <button
          onClick={handleEnable}
          disabled={loading}
          className="mt-6 btn-primary w-full"
        >
          {loading ? 'Setting up...' : 'Enable 2FA'}
        </button>
      </div>
    </div>
  );
};

export default TwoFactorSetup;