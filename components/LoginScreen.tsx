import React, { useState, useEffect } from 'react';
import { useToasts } from '../context/ToastContext';
import Logo from '../assets/Logo';

interface LoginScreenProps {
  onLogin: (username: string, password: string) => Promise<{success: boolean, message: string}>;
  onSignup: (username: string, password: string) => Promise<{success: boolean, message: string}>;
  onGuestLogin: () => void;
}

const AuthSpinner: React.FC = () => (
    <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onSignup, onGuestLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginView, setIsLoginView] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string; form?: string }>({});
  const { addToast } = useToasts();

  const validate = () => {
    const newErrors: { username?: string; password?: string } = {};
    if (!username) {
        newErrors.username = 'Email address is required.';
    } else if (!/\S+@\S+\.\S+/.test(username)) {
        newErrors.username = 'Please enter a valid email address.';
    }

    if (!password) {
        newErrors.password = 'Password is required.';
    } else if (password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    // Validate on the fly after initial interaction
    if (Object.keys(errors).length > 0) {
        validate();
    }
  }, [username, password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({}); // Clear previous form errors
    if (!validate()) return;

    setIsLoading(true);
    const action = isLoginView ? onLogin : onSignup;
    const result = await action(username, password);

    if (result.success) {
      addToast(result.message, 'success');
    } else {
      setErrors({ form: result.message });
      setIsLoading(false);
    }
  };

  const toggleView = () => {
      setIsLoginView(!isLoginView);
      setUsername('');
      setPassword('');
      setErrors({});
  };

  return (
    <div className="flex items-center justify-center h-screen animate-fade-in p-4">
        <div className="w-full max-w-sm mx-auto p-6 sm:p-8 bg-[rgba(13,17,23,0.75)] backdrop-blur-xl border border-[#00d9ff]/20 rounded-2xl shadow-2xl shadow-black/50 text-center animate-scale-in">
            <div className="flex justify-center mb-6">
                <Logo className="w-24 h-24 rounded-full shadow-lg" />
            </div>

            <h1 className="font-title text-4xl mb-2 text-white [text-shadow:0_2px_10px_rgba(0,217,255,0.3)]">Welcome to Jiam</h1>
            <p className="text-gray-400 mb-8 tracking-wide">Your AI Supermind awaits.</p>
            
            <form onSubmit={handleSubmit} className="space-y-4" key={isLoginView ? 'login' : 'signup'} noValidate>
                <div className="animate-fade-in">
                    <input
                        type="email"
                        placeholder="Email"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        aria-invalid={!!errors.username}
                        aria-describedby="username-error"
                        className={`w-full bg-black/50 border rounded-md text-white p-3 text-base outline-none transition-all duration-300 ease-in-out focus:ring-2 focus:ring-[#00d9ff] focus:shadow-[0_0_15px_rgba(0,217,255,0.4)] placeholder-gray-500 ${errors.username ? 'border-red-500' : 'border-white/10 focus:border-[#00d9ff]'}`}
                        required
                    />
                    {errors.username && <p id="username-error" className="text-red-400 text-xs mt-1 text-left animate-fade-in">{errors.username}</p>}
                </div>
                <div className="animate-fade-in" style={{ animationDelay: '50ms'}}>
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        aria-invalid={!!errors.password}
                        aria-describedby="password-error"
                        className={`w-full bg-black/50 border rounded-md text-white p-3 text-base outline-none transition-all duration-300 ease-in-out focus:ring-2 focus:ring-[#00d9ff] focus:shadow-[0_0_15px_rgba(0,217,255,0.4)] placeholder-gray-500 ${errors.password ? 'border-red-500' : 'border-white/10 focus:border-[#00d9ff]'}`}
                        required
                    />
                    {errors.password && <p id="password-error" className="text-red-400 text-xs mt-1 text-left animate-fade-in">{errors.password}</p>}
                </div>

                {errors.form && <p role="alert" className="text-red-400 text-sm text-center bg-red-500/10 p-2 rounded-md animate-fade-in">{errors.form}</p>}
                
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-br from-[#00d9ff] to-[#007cf0] text-black font-semibold rounded-lg shadow-md transition-all duration-300 ease-in-out hover:brightness-110 hover:shadow-[0_0_20px_rgba(0,217,255,0.6)] disabled:opacity-50 disabled:cursor-not-allowed btn"
                >
                    {isLoading ? <AuthSpinner /> : (isLoginView ? 'Login' : 'Sign Up')}
                </button>
            </form>
            <button
                onClick={toggleView}
                className="w-full mt-4 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
            >
                {isLoginView ? 'Need an account? Sign Up' : 'Already have an account? Login'}
            </button>
            
            <div className="space-y-4 mt-6">
                <button
                    onClick={onGuestLogin}
                    disabled={isLoading}
                    className="w-full px-4 py-3 bg-transparent border border-white/10 text-gray-300 font-semibold rounded-lg transition-all duration-300 ease-in-out hover:bg-white/5 hover:border-white/20 hover:text-white btn disabled:opacity-50"
                >
                    Continue as Guest
                </button>
            </div>
        </div>
    </div>
  );
};

export default LoginScreen;