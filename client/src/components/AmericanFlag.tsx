import React from 'react';

interface AmericanFlagProps {
  size?: 'small' | 'large' | 'extra-large';
}

export default function AmericanFlag({ size = 'small' }: AmericanFlagProps) {
  const flagSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1235 650">
      <!-- Stripes -->
      <rect width="1235" height="650" fill="#bf0a30"/>
      <rect width="1235" height="50" fill="#ffffff" y="0"/>
      <rect width="1235" height="50" fill="#ffffff" y="100"/>
      <rect width="1235" height="50" fill="#ffffff" y="200"/>
      <rect width="1235" height="50" fill="#ffffff" y="300"/>
      <rect width="1235" height="50" fill="#ffffff" y="400"/>
      <rect width="1235" height="50" fill="#ffffff" y="500"/>
      <rect width="1235" height="50" fill="#ffffff" y="600"/>
      
      <!-- Blue field -->
      <rect width="494" height="350" fill="#002868"/>
      
      <!-- Stars - improved layout -->
      <g fill="#ffffff">
        <!-- Row 1 -->
        <circle cx="41" cy="35" r="20"/>
        <circle cx="123" cy="35" r="20"/>
        <circle cx="205" cy="35" r="20"/>
        <circle cx="287" cy="35" r="20"/>
        <circle cx="369" cy="35" r="20"/>
        <circle cx="451" cy="35" r="20"/>
        
        <!-- Row 2 -->
        <circle cx="82" cy="87" r="20"/>
        <circle cx="164" cy="87" r="20"/>
        <circle cx="246" cy="87" r="20"/>
        <circle cx="328" cy="87" r="20"/>
        <circle cx="410" cy="87" r="20"/>
        
        <!-- Row 3 -->
        <circle cx="41" cy="140" r="20"/>
        <circle cx="123" cy="140" r="20"/>
        <circle cx="205" cy="140" r="20"/>
        <circle cx="287" cy="140" r="20"/>
        <circle cx="369" cy="140" r="20"/>
        <circle cx="451" cy="140" r="20"/>
        
        <!-- Row 4 -->
        <circle cx="82" cy="192" r="20"/>
        <circle cx="164" cy="192" r="20"/>
        <circle cx="246" cy="192" r="20"/>
        <circle cx="328" cy="192" r="20"/>
        <circle cx="410" cy="192" r="20"/>
        
        <!-- Row 5 -->
        <circle cx="41" cy="245" r="20"/>
        <circle cx="123" cy="245" r="20"/>
        <circle cx="205" cy="245" r="20"/>
        <circle cx="287" cy="245" r="20"/>
        <circle cx="369" cy="245" r="20"/>
        <circle cx="451" cy="245" r="20"/>
        
        <!-- Row 6 -->
        <circle cx="82" cy="297" r="20"/>
        <circle cx="164" cy="297" r="20"/>
        <circle cx="246" cy="297" r="20"/>
        <circle cx="328" cy="297" r="20"/>
        <circle cx="410" cy="297" r="20"/>
      </g>
    </svg>
  `;

  // Determine size classes based on the size prop
  let width, height;
  if (size === 'extra-large') {
    width = 'w-64'; // 4x the large size (16 * 4 = 64)
    height = 'h-40'; // 4x the large size (10 * 4 = 40)
  } else if (size === 'large') {
    width = 'w-16';
    height = 'h-10';
  } else {
    width = 'w-12';
    height = 'h-8';
  }

  return (
    <div 
      className={`flag ${width} ${height} animate-flag-wave mx-auto`} 
      dangerouslySetInnerHTML={{ __html: flagSvg }}
    />
  );
}
