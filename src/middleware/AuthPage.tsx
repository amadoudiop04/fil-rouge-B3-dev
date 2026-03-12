import React, { useState } from 'react';
import { LoginForm } from '../pages/LoginForm';
import { RegisterForm } from '../pages/RegisterForm';

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-[#0a1628] text-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-8">
        {/* Logo ou titre */}
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">
            Bienvenue <span className="text-blue-500">#LUG</span>
          </h1>
          <p className="text-gray-400">Gestion d'application de bureau</p>
        </div>

        {/* Formulaires */}
        {isLogin ? (
          <LoginForm onSwitchToRegister={() => setIsLogin(false)} />
        ) : (
          <RegisterForm onSwitchToLogin={() => setIsLogin(true)} />
        )}
      </div>
    </div>
  );
};
