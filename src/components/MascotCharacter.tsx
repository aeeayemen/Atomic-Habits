import React from 'react';

export type MascotMood = 'wave' | 'point' | 'idea' | 'celebrate' | 'proud';

interface MascotCharacterProps {
  mood?: MascotMood;
  className?: string;
  size?: number;
}

export const MascotCharacter: React.FC<MascotCharacterProps> = ({
  mood = 'wave',
  className = '',
  size = 110,
}) => {
  return (
    <div
      className={`relative select-none pointer-events-none transition-transform duration-300 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full filter drop-shadow-lg"
      >
        <defs>
          {/* تدرج لهب شرارة الخارجي */}
          <linearGradient id="shararaBody" x1="60" y1="10" x2="60" y2="110" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#FFE066" />
            <stop offset="35%" stop-color="#FFB703" />
            <stop offset="75%" stop-color="#FB8500" />
            <stop offset="100%" stop-color="#D90429" />
          </linearGradient>

          {/* تدرج القلب المتوهج */}
          <linearGradient id="shararaCore" x1="60" y1="40" x2="60" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#FFF9E6" />
            <stop offset="60%" stop-color="#FFE699" />
            <stop offset="100%" stop-color="#FFB703" />
          </linearGradient>

          {/* تدرج عصابة الرأس الذرية */}
          <linearGradient id="shararaHeadband" x1="20" y1="45" x2="100" y2="45" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#00A896" />
            <stop offset="100%" stop-color="#02C39A" />
          </linearGradient>
        </defs>

        {/* 1. جسم شعلة العادات الذرية "شرارة" */}
        <path
          d="M60 12C60 12 78 30 78 48C78 52 76 56 74 60C82 54 94 65 94 78C94 95 79 108 60 108C41 108 26 95 26 78C26 62 38 52 46 60C44 56 42 52 42 48C42 30 60 12 60 12Z"
          fill="url(#shararaBody)"
        />

        {/* 2. القلب المتوهج الداخلي */}
        <path
          d="M60 44C60 44 72 56 72 70C72 76 68 82 64 86C60 90 52 90 48 86C44 82 40 76 40 70C40 56 60 44 60 44Z"
          fill="url(#shararaCore)"
          opacity="0.85"
        />

        {/* 3. عصابة الرأس الرياضية (Atomic Headband) */}
        <path
          d="M33 48C42 45 78 45 87 48L85 55C75 52 45 52 35 55L33 48Z"
          fill="url(#shararaHeadband)"
        />
        {/* شارة الذرة الذهبية في منتصف العصابة */}
        <circle cx="60" cy="50" r="3.5" fill="#FFE066" stroke="#0F2854" strokeWidth="1" />
        <circle cx="60" cy="50" r="1.5" fill="#D90429" />

        {/* 4. الخدود الوردية الخجولة اللطيفة (Blush) */}
        <ellipse cx="44" cy="74" rx="4.5" ry="2.5" fill="#FF4D6D" opacity="0.6" />
        <ellipse cx="76" cy="74" rx="4.5" ry="2.5" fill="#FF4D6D" opacity="0.6" />

        {/* 5. العيون الكرتونية اللامعة (Anime Eyes) */}
        {mood === 'celebrate' ? (
          // عيون الفرح المغلقة المبتسمة (Smiling closed eyes)
          <g stroke="#0F2854" strokeWidth="2.8" strokeLinecap="round">
            <path d="M42 66 Q 47 61 52 66" />
            <path d="M68 66 Q 73 61 78 66" />
          </g>
        ) : (
          // عيون واسعة مليئة بالبريق
          <g>
            {/* العين اليسرى */}
            <ellipse cx="47" cy="65" rx="5" ry="6.5" fill="#0F2854" />
            <circle cx="45.5" cy="63" r="2.2" fill="#FFFFFF" />
            <circle cx="48.5" cy="67" r="1.1" fill="#FFFFFF" />

            {/* العين اليمنى */}
            <ellipse cx="73" cy="65" rx="5" ry="6.5" fill="#0F2854" />
            <circle cx="71.5" cy="63" r="2.2" fill="#FFFFFF" />
            <circle cx="74.5" cy="67" r="1.1" fill="#FFFFFF" />
          </g>
        )}

        {/* 6. الفم المبتسم واللسان */}
        <path
          d={
            mood === 'celebrate' || mood === 'proud'
              ? 'M53 73 Q 60 83 67 73 Z'
              : 'M54 74 Q 60 80 66 74'
          }
          fill={mood === 'celebrate' || mood === 'proud' ? '#D90429' : 'none'}
          stroke="#0F2854"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        {(mood === 'celebrate' || mood === 'proud') && (
          <path d="M56 77 Q 60 75 64 77 Q 60 81 56 77 Z" fill="#FF758F" />
        )}

        {/* 7. الأذرع واليدين حسب الحالة (Mood Gestures) */}
        {mood === 'wave' && (
          // لوّح باليد اليسرى ترحيباً
          <g>
            <path
              d="M33 76 Q 22 70 20 58 Q 23 54 27 59 Q 29 68 35 73"
              fill="#FFB703"
              stroke="#D90429"
              strokeWidth="1"
            />
            {/* كف يلوح */}
            <circle cx="21" cy="57" r="4.5" fill="#FFE066" />
            <circle cx="23" cy="52" r="2" fill="#FFE066" />
          </g>
        )}

        {mood === 'point' && (
          // يشير باليد نحو العنصر
          <g>
            <path
              d="M87 75 Q 98 78 108 84"
              stroke="#FFB703"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <circle cx="108" cy="84" r="4.5" fill="#FFE066" />
            <path d="M108 84 L 115 88" stroke="#FFE066" strokeWidth="3" strokeLinecap="round" />
          </g>
        )}

        {mood === 'idea' && (
          // مصباح فكرة متوهج فوق الرأس
          <g transform="translate(60, 2) scale(0.7)">
            <circle cx="0" cy="0" r="10" fill="#FFE066" />
            <path d="M-4 12 L 4 12" stroke="#0F2854" strokeWidth="2" strokeLinecap="round" />
            <line x1="0" y1="-14" x2="0" y2="-18" stroke="#FFB703" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="-12" y1="-10" x2="-16" y2="-13" stroke="#FFB703" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="12" y1="-10" x2="16" y2="-13" stroke="#FFB703" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        )}

        {mood === 'celebrate' && (
          // نجوم ومفرقعات احتفال تطفو حوله
          <g>
            <path d="M22 36 L 24 42 L 30 44 L 24 46 L 22 52 L 20 46 L 14 44 L 20 42 Z" fill="#FFE066" />
            <path d="M96 32 L 98 37 L 103 38 L 98 40 L 96 45 L 94 40 L 89 38 L 94 37 Z" fill="#02C39A" />
            <circle cx="104" cy="58" r="2.5" fill="#FFE066" />
            <circle cx="16" cy="68" r="2" fill="#FF4D6D" />
          </g>
        )}
      </svg>
    </div>
  );
};
