import React, { useEffect } from 'react';

interface GoogleAdProps {
  slot: string;
  format?: string;
}

export const GoogleAd: React.FC<GoogleAdProps> = ({ slot, format = "auto" }) => {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdSense error: ", e);
    }
  }, []);

  return (
    <div className="relative w-full h-full min-h-[300px] flex flex-col items-center justify-center bg-white/5 border border-white/10 rounded-lg overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 z-0"></div>
      
      {/* Real AdSense Component */}
      <ins className="adsbygoogle relative z-10 w-full h-full flex items-center justify-center"
           style={{ display: 'block', zIndex: 10 }}
           data-ad-client="ca-pub-6109353330910529"
           data-ad-slot={slot}
           data-ad-format={format}
           data-full-width-responsive="true"></ins>

      {/* Fallback visible in dev/test when Ad isn't loaded */}
      <div className="absolute inset-0 z-0 flex flex-col items-center justify-center text-center opacity-50 group-hover:opacity-100 transition-opacity">
        <span className="text-gray-500 text-sm font-bold tracking-widest uppercase mb-2">Advertisement</span>
        <span className="text-gray-600 text-xs">(Ad content will appear here)</span>
      </div>
    </div>
  );
};
