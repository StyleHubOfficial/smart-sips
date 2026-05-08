import React, { useEffect } from 'react';

interface GoogleAdProps {
  slot: string;
  format?: string;
}

export const GoogleAd: React.FC<GoogleAdProps> = ({ slot, format = "auto" }) => {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdSense error: ", e);
    }
  }, []);

  return (
    <ins className="adsbygoogle"
         style={{ display: 'block' }}
         data-ad-client="ca-pub-6109353330910529"
         data-ad-slot={slot}
         data-ad-format={format}
         data-full-width-responsive="true"></ins>
  );
};
