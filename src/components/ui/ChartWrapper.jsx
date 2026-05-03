import React from 'react';

export function ChartWrapper({ children }) {
  return (
    <div className="w-full h-[320px] min-h-[320px] min-w-0" style={{ width: '100%', height: 320, minWidth: 0, minHeight: 320 }}>
      {children}
    </div>
  );
}
