import React from 'react';

export default function PaymentBrandIcon({ name, className = 'w-4 h-4' }) {
  const brand = (name || '').toLowerCase();

  if (brand.includes('visa')) {
    return (
      <svg className={className} viewBox="0 0 36 24" fill="none">
        <rect width="36" height="24" rx="4" fill="#1A1F71" />
        <path d="M14.5 16.5L16.8 7.5H19.2L16.9 16.5H14.5ZM24.2 7.7C23.7 7.5 22.9 7.3 22 7.3C19.7 7.3 18.1 8.5 18.1 10.2C18.1 11.5 19.3 12.2 20.2 12.6C21.1 13 21.4 13.3 21.4 13.7C21.4 14.3 20.7 14.6 20 14.6C19.1 14.6 18.6 14.4 17.8 14.1L17.4 13.9L17 16.3C17.7 16.6 18.9 16.8 20.1 16.8C22.6 16.8 24.2 15.6 24.2 13.8C24.2 12.3 23.2 11.6 22 11C21.3 10.7 20.8 10.4 20.8 9.9C20.8 9.5 21.3 9.1 22.2 9.1C23 9.1 23.6 9.3 24.1 9.5L24.4 9.6L24.8 7.4L24.2 7.7ZM28.5 7.5H26.6C26 7.5 25.5 7.7 25.3 8.3L21.6 16.5H24.1L24.6 15.1H27.7L28 16.5H30.2L28.5 7.5ZM25.3 13.2L26.6 9.6L27.4 13.2H25.3ZM12.7 7.5L10.4 13.7L10.1 12.2C9.7 10.8 8.4 9.3 7 8.6L9.1 16.5H11.7L15.3 7.5H12.7Z" fill="#FFFFFF" />
        <path d="M8.5 7.5H5L5 7.7C7.8 8.4 9.7 10.1 10.4 12.2L9.7 8.3C9.5 7.7 9.1 7.5 8.5 7.5Z" fill="#F7B600" />
      </svg>
    );
  }

  if (brand.includes('mastercard')) {
    return (
      <svg className={className} viewBox="0 0 36 24" fill="none">
        <rect width="36" height="24" rx="4" fill="#222328" />
        <circle cx="14" cy="12" r="7" fill="#EB001B" />
        <circle cx="22" cy="12" r="7" fill="#F79E1B" fillOpacity="0.9" />
      </svg>
    );
  }

  if (brand.includes('apple')) {
    return (
      <svg className={className} viewBox="0 0 36 24" fill="none">
        <rect width="36" height="24" rx="4" fill="#000000" stroke="#333" strokeWidth="1" />
        <path d="M15.2 11.2C15.2 9.8 16.3 9 16.4 8.9C15.7 8 14.6 7.8 14.2 7.8C13.2 7.7 12.2 8.4 11.7 8.4C11.2 8.4 10.4 7.8 9.6 7.8C8.5 7.8 7.5 8.4 7 9.3C5.8 11.3 6.7 14.3 7.9 15.9C8.5 16.7 9.1 17.6 10 17.6C10.9 17.6 11.2 17 12.3 17C13.3 17 13.6 17.6 14.6 17.6C15.5 17.6 16.1 16.8 16.7 15.9C17.4 15 17.7 14.1 17.7 14C17.6 14 15.2 13 15.2 11.2ZM13.8 6.9C14.3 6.3 14.6 5.5 14.5 4.7C13.8 4.7 12.9 5.2 12.4 5.8C12 6.3 11.6 7.1 11.8 7.9C12.6 8 13.4 7.5 13.8 6.9Z" fill="#FFFFFF" />
        <text x="18.5" y="15" fill="#FFFFFF" fontSize="7.5" fontWeight="bold" fontFamily="sans-serif">Pay</text>
      </svg>
    );
  }

  if (brand.includes('google')) {
    return (
      <svg className={className} viewBox="0 0 36 24" fill="none">
        <rect width="36" height="24" rx="4" fill="#FFFFFF" />
        <path d="M12.5 12.1C12.5 11.7 12.4 11.4 12.4 11.1H8.5V12.9H10.7C10.6 13.6 10.2 14.1 9.6 14.5V15.8H11.3C12.3 14.9 12.5 13.6 12.5 12.1Z" fill="#4285F4" />
        <path d="M8.5 16.2C9.5 16.2 10.3 15.9 11.3 15.8L9.6 14.5C9.1 14.8 8.6 15 8.5 15C7.5 15 6.7 14.3 6.4 13.4H4.7V14.7C5.5 16.3 7.1 16.2 8.5 16.2Z" fill="#34A853" />
        <path d="M6.4 13.4C6.3 13.1 6.2 12.6 6.2 12.1C6.2 11.6 6.3 11.1 6.4 10.8V9.5H4.7C4.1 10.7 4.1 13.5 4.7 14.7L6.4 13.4Z" fill="#FBBC05" />
        <path d="M8.5 9.2C9.2 9.2 9.7 9.4 10.2 9.8L11.5 8.5C10.7 7.7 9.6 7.5 8.5 7.5C7.1 7.5 5.5 8.4 4.7 9.5L6.4 10.8C6.7 9.9 7.5 9.2 8.5 9.2Z" fill="#EA4335" />
        <text x="14" y="15" fill="#5F6368" fontSize="7.5" fontWeight="bold" fontFamily="sans-serif">Pay</text>
      </svg>
    );
  }

  if (brand.includes('paypal')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.786.786 0 0 1 .777-.664h7.027c3.42 0 5.617 1.63 5.092 4.787-.492 2.96-2.585 4.67-5.59 4.67h-2.58a.786.786 0 0 0-.777.664l-1.077 6.82a.641.641 0 0 1-.633.54h-.157z" fill="#003087" />
        <path d="M8.948 18.066h3.423c3.005 0 5.098-1.71 5.59-4.67.525-3.157-1.672-4.787-5.092-4.787H5.842a.786.786 0 0 0-.777.664L2.59 22.454a.641.641 0 0 0 .633.74h4.606l1.119-5.128z" fill="#0079C1" fillOpacity="0.9" />
        <path d="M8.06 13.177l1.077-6.82a.786.786 0 0 1 .777-.664h2.58c1.378 0 2.455.36 3.195 1.033.447-.79.624-1.75.46-2.738C15.657 1.34 13.626 0 10.457 0H3.43a.786.786 0 0 0-.777.664L.014 17.545a.641.641 0 0 0 .633.74h4.606l1.246-5.108h1.56z" fill="#00457C" />
      </svg>
    );
  }

  if (brand.includes('cash')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="6" fill="#00D632" />
        <path d="M13.2 8.4C13.2 7.7 12.6 7.2 11.8 7.2C10.9 7.2 10.3 7.6 10.3 8.3C10.3 9 10.9 9.3 11.9 9.7L12.5 9.9C13.9 10.4 15 11.2 15 12.7C15 14.2 13.8 15.3 12.2 15.5V16.8H11V15.5C9.4 15.3 8.4 14.1 8.4 14.1L9.6 12.8C9.6 12.8 10.4 13.8 11.6 13.8C12.5 13.8 13.2 13.3 13.2 12.6C13.2 11.9 12.6 11.5 11.5 11.1L10.9 10.9C9.6 10.4 8.6 9.6 8.6 8.3C8.6 6.9 9.7 5.8 11.1 5.6V4.4H12.3V5.6C13.6 5.8 14.5 6.8 14.5 6.8L13.2 8.4Z" fill="#FFFFFF" />
      </svg>
    );
  }

  if (brand.includes('btc') || brand.includes('bitcoin')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="12" fill="#F7931A" />
        <path d="M16.7 10.2C16.9 8.7 15.9 7.9 14.3 7.5L14.7 5.8L13.7 5.5L13.3 7.1C13 7.1 12.8 7 12.5 6.9L12.9 5.3L11.9 5L11.5 6.7C11.3 6.6 11 6.6 10.8 6.5L10.8 6.5L9.4 6.1L9.1 7.3C9.1 7.3 9.8 7.5 9.8 7.5C10.2 7.6 10.3 7.8 10.2 8.1L9.1 12.5C9.2 12.5 9 12.5 8.9 12.4C8.8 12.4 8.5 12.3 8.5 12.3L8 13.5L9.3 13.8C9.6 13.9 9.8 14 10.1 14L9.7 15.7L10.7 16L11.1 14.3C11.4 14.4 11.6 14.4 11.9 14.5L11.5 16.2L12.5 16.5L12.9 14.8C14.7 15.1 16 14.9 16.5 13.4C16.9 12.2 16.5 11.5 15.6 11.1C16.3 10.9 16.7 10.4 16.7 10.2ZM14.4 13.1C14 14.7 11.5 13.9 10.7 13.7L11.4 10.9C12.2 11.1 14.8 11.4 14.4 13.1ZM14.8 9.5C14.4 11 12.3 10.3 11.7 10.1L12.3 7.6C12.9 7.8 15.1 8 14.8 9.5Z" fill="#FFFFFF" />
      </svg>
    );
  }

  if (brand.includes('usdt') || brand.includes('tether')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="12" fill="#26A17B" />
        <path d="M12.9 11.3V9.7H16.4V7.5H7.6V9.7H11.1V11.3C8.5 11.4 6.5 12.1 6.5 13C6.5 13.9 8.5 14.6 11.1 14.7V17.5H12.9V14.7C15.5 14.6 17.5 13.9 17.5 13C17.5 12.1 15.5 11.4 12.9 11.3ZM12 13.8C9.8 13.8 8.1 13.3 8.1 13C8.1 12.7 9.8 12.2 12 12.2C14.2 12.2 15.9 12.7 15.9 13C15.9 13.3 14.2 13.8 12 13.8Z" fill="#FFFFFF" />
      </svg>
    );
  }

  if (brand.includes('sol') || brand.includes('solana')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="12" fill="#000000" />
        <path d="M6 15.8L7.8 14H18L16.2 15.8H6Z" fill="url(#sol_g1_brand)" />
        <path d="M6 12L7.8 10.2H18L16.2 12H6Z" fill="url(#sol_g2_brand)" />
        <path d="M6 8.2L7.8 6.4H18L16.2 8.2H6Z" fill="url(#sol_g3_brand)" />
        <defs>
          <linearGradient id="sol_g1_brand" x1="6" y1="14" x2="18" y2="15.8" gradientUnits="userSpaceOnUse">
            <stop stopColor="#00FFA3" />
            <stop offset="1" stopColor="#DC1FFF" />
          </linearGradient>
          <linearGradient id="sol_g2_brand" x1="6" y1="10.2" x2="18" y2="12" gradientUnits="userSpaceOnUse">
            <stop stopColor="#00FFA3" />
            <stop offset="1" stopColor="#DC1FFF" />
          </linearGradient>
          <linearGradient id="sol_g3_brand" x1="6" y1="6.4" x2="18" y2="8.2" gradientUnits="userSpaceOnUse">
            <stop stopColor="#00FFA3" />
            <stop offset="1" stopColor="#DC1FFF" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  if (brand.includes('eth') || brand.includes('ethereum')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="12" fill="#627EEA" />
        <path d="M12 4L6.5 13.1L12 16.4L17.5 13.1L12 4Z" fill="#FFFFFF" fillOpacity="0.6" />
        <path d="M12 4V16.4L17.5 13.1L12 4Z" fill="#FFFFFF" />
        <path d="M12 17.4L6.5 14.2L12 21.9L17.5 14.2L12 17.4Z" fill="#FFFFFF" fillOpacity="0.6" />
        <path d="M12 17.4V21.9L17.5 14.2L12 17.4Z" fill="#FFFFFF" />
      </svg>
    );
  }

  if (brand.includes('ltc') || brand.includes('litecoin')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="12" fill="#345D9D" />
        <path d="M11 6H13.2L11.5 13.6H15.5V15.5H9L11 6Z" fill="#FFFFFF" />
        <path d="M9.5 11.2L10.2 9.5H14L13.3 11.2H9.5Z" fill="#FFFFFF" />
      </svg>
    );
  }

  return <span className="text-xs">💳</span>;
}
