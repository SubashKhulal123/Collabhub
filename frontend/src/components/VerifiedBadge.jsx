import React from 'react';
import { FiShield } from 'react-icons/fi';

const VerifiedBadge = ({ size = 'sm', showLabel = true }) => {
  const sizes = {
    xs: { container: 'text-[10px] px-1.5 py-0.5 gap-0.5', icon: 10 },
    sm: { container: 'text-xs px-2 py-0.5 gap-1', icon: 11 },
    md: { container: 'text-sm px-2.5 py-1 gap-1', icon: 13 },
    lg: { container: 'text-base px-3 py-1.5 gap-1.5', icon: 15 }
  };

  const s = sizes[size] || sizes.sm;

  return (
    <span
      className={`inline-flex items-center ${s.container} rounded-full font-medium`}
      style={{
        background: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)',
        color: '#3730a3',
        border: '1px solid rgba(99, 102, 241, 0.2)',
      }}
      title="Verified Identity"
    >
      <FiShield size={s.icon} style={{ flexShrink: 0 }} />
      {showLabel && <span>Verified</span>}
    </span>
  );
};

export default VerifiedBadge;