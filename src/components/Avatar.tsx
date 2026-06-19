import React, { useEffect, useMemo, useRef, useState } from 'react';

type AvatarColor = 'blue' | 'purple' | 'green' | 'orange' | 'pink' | 'cyan';

const RING: Record<AvatarColor, string> = {
  blue:   'border-blue-500',
  purple: 'border-purple-500',
  green:  'border-green-500',
  orange: 'border-orange-500',
  pink:   'border-pink-500',
  cyan:   'border-cyan-500',
};

const SIZES = {
  sm: 'h-10 w-10',
  md: 'h-16 w-16',
  lg: 'h-24 w-24',
};

export interface AvatarProps {
  username: string;
  size?: 'sm' | 'md' | 'lg';
  showBorder?: boolean;
  editable?: boolean;
  onColorChange?: (color: AvatarColor) => void;
}

const PHOTO_KEY = 'profile-photo';

export const Avatar: React.FC<AvatarProps> = ({
  username,
  size = 'md',
  showBorder = true,
  editable = false,
  onColorChange,
}) => {
  const [color,       setColor]       = useState<AvatarColor>('purple');
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [photo,       setPhoto]       = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const c = localStorage.getItem('avatar-color');
    if (c && c in RING) setColor(c as AvatarColor);
    const p = localStorage.getItem(PHOTO_KEY);
    if (p) setPhoto(p);
  }, []);

  const dicebear = useMemo(
    () => `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(username || 'user')}`,
    [username],
  );

  const handleColor = (c: AvatarColor) => {
    setColor(c);
    localStorage.setItem('avatar-color', c);
    setMenuOpen(false);
    onColorChange?.(c);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const result = ev.target?.result as string;
      setPhoto(result);
      localStorage.setItem(PHOTO_KEY, result);
      setMenuOpen(false);
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhoto(null);
    localStorage.removeItem(PHOTO_KEY);
    setMenuOpen(false);
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <div className={`${SIZES[size]} overflow-hidden rounded-full flex-shrink-0 ${showBorder ? `border-2 ${RING[color]}` : ''}`}
        style={{ background: 'var(--raised)' }}>
        <img
          src={photo ?? dicebear}
          alt={username}
          className="h-full w-full rounded-full object-cover"
        />
      </div>

      {/* Edit button */}
      {editable && (
        <button type="button" onClick={() => setMenuOpen(v => !v)}
          className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full text-[13px] text-white shadow-lg transition hover:scale-105"
          style={{ background: 'var(--violet)' }}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-3.5 w-3.5">
            <path d="M11 2.5l2.5 2.5-7 7H4v-2.5l7-7z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      {/* Menu */}
      {menuOpen && editable && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-40 overflow-hidden rounded-xl shadow-2xl shadow-black/60 w-52"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            {/* Photo upload */}
            <button type="button" onClick={() => fileRef.current?.click()}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-[13px] font-medium transition hover:bg-white/5">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-4 w-4 shrink-0" style={{ color: 'var(--violet2)' }}>
                <path d="M4 16l4-4 3 3 3-4 4 5H4z" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="6.5" cy="6.5" r="1.5"/>
                <rect x="2" y="2" width="16" height="16" rx="3" strokeLinecap="round"/>
              </svg>
              Changer la photo
            </button>
            {photo && (
              <button type="button" onClick={removePhoto}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-[13px] font-medium transition hover:bg-white/5"
                style={{ color: 'var(--red)', borderTop: '1px solid var(--border)' }}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-4 w-4 shrink-0">
                  <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M4 4l.8 9.2c.04.4.4.8.8.8h4.8c.4 0 .76-.4.8-.8L12 4" strokeLinecap="round"/>
                </svg>
                Supprimer la photo
              </button>
            )}
            {/* Color picker */}
            <div className="flex items-center gap-2 px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
              <span className="text-[11px]" style={{ color: 'var(--text3)' }}>Bordure</span>
              <div className="flex gap-1.5 ml-1">
                {(Object.keys(RING) as AvatarColor[]).map(c => (
                  <button key={c} type="button" onClick={() => handleColor(c)}
                    className={`h-4 w-4 rounded-full border-2 ${RING[c]} transition ${color === c ? 'scale-125' : 'opacity-60'}`}
                    style={{ background: 'var(--raised)' }} />
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
};
