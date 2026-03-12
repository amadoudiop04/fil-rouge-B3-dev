import React, { useEffect, useMemo, useState } from 'react';

type AvatarColor = 'blue' | 'purple' | 'green' | 'orange' | 'pink' | 'cyan';

const avatarRingClasses: Record<AvatarColor, string> = {
  blue: 'border-blue-500',
  purple: 'border-purple-500',
  green: 'border-green-500',
  orange: 'border-orange-500',
  pink: 'border-pink-500',
  cyan: 'border-cyan-500',
};

export interface AvatarProps {
  username: string;
  size?: 'sm' | 'md' | 'lg';
  showBorder?: boolean;
  editable?: boolean;
  onColorChange?: (color: AvatarColor) => void;
}

const sizeClasses = {
  sm: 'h-10 w-10 text-xs',
  md: 'h-16 w-16 text-lg',
  lg: 'h-24 w-24 text-3xl',
};

export const Avatar: React.FC<AvatarProps> = ({
  username,
  size = 'md',
  showBorder = true,
  editable = false,
  onColorChange,
}) => {
  const [selectedColor, setSelectedColor] = useState<AvatarColor>('blue');
  const [showColorPicker, setShowColorPicker] = useState(false);

  useEffect(() => {
    const storedColor = window.localStorage.getItem('avatar-color');
    if (storedColor && storedColor in avatarRingClasses) {
      setSelectedColor(storedColor as AvatarColor);
    }
  }, []);

  const avatarUrl = useMemo(
    () =>
      `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(
        username || 'user',
      )}`,
    [username],
  );

  const handleSelectColor = (color: AvatarColor) => {
    setSelectedColor(color);
    window.localStorage.setItem('avatar-color', color);
    setShowColorPicker(false);
    if (onColorChange) {
      onColorChange(color);
    }
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <div
        className={`${sizeClasses[size]} overflow-hidden rounded-full ${
          showBorder ? `border-2 ${avatarRingClasses[selectedColor]}` : ''
        } bg-[#0b1a2e] p-1 flex-shrink-0`}
      >
        <img
          src={avatarUrl}
          alt={username}
          className="h-full w-full rounded-full object-cover"
        />
      </div>
      {editable && (
        <button
          type="button"
          onClick={() => setShowColorPicker((visible) => !visible)}
          className={`absolute ${
            size === 'lg'
              ? 'bottom-0 right-0 h-7 w-7 text-xs'
              : 'bottom-0 right-0 h-6 w-6 text-xs'
          } flex items-center justify-center rounded-full bg-blue-600`}
        >
          ✎
        </button>
      )}

      {showColorPicker && editable && (
        <div className="absolute top-full mt-2 flex gap-2 rounded-xl border border-gray-700 bg-[#101d31] p-2 z-10">
          {(Object.keys(avatarRingClasses) as AvatarColor[]).map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => handleSelectColor(color)}
              className={`h-5 w-5 rounded-full border-2 ${avatarRingClasses[color]} bg-[#0b1a2e] transition ${
                selectedColor === color ? 'scale-110' : ''
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
