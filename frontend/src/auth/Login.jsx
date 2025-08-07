// src/pages/Login.jsx

import { useState, useContext } from 'react';
import { RoleContext } from '../components/RoleContext';
import {
    EnvelopeIcon,
    LockClosedIcon,
    ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

function Login() {
  const { login } = useContext(RoleContext);
  const [email, setEmail] = useState('');
  // ✅ CORRECTED LINE: Ensure setPassword is included from useState
  const [password, setPassword] = useState(''); 
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed. Please check your credentials.');
      }
      
      login(data.user, data.token);

    } catch (err) {
      console.error('Login request failed', err);
      setError(err.message);
    }
  };

  return (
    <div className="relative isolate min-h-screen w-full bg-white overflow-hidden flex items-center justify-center p-4">
        <div className="absolute inset-x-0 top-[-10rem] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[-20rem]" aria-hidden="true">
            <div className="relative left-1/2 -z-10 aspect-[1155/678] w-[36.125rem] max-w-none -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-40rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
        </div>

        <div className="w-full max-w-lg">
            <div className="bg-white/80 backdrop-blur-md p-8 sm:p-10 rounded-2xl shadow-2xl shadow-gray-300/20 border border-gray-200/80">
                <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Welcome to EvalMate</h1>
                    <p className="mt-2 text-gray-600">
                        Sign in to continue to your dashboard.
                    </p>
                </div>
                
                <form onSubmit={handleLogin} className="mt-8 space-y-5">
                     <p className="text-sm font-semibold text-gray-800">Enter Your Credentials</p>
                     {error && <p className="text-center text-sm text-red-600 bg-red-100 p-2 rounded-md">{error}</p>}
                    <div>
                        <div className="relative mt-1 rounded-md shadow-sm">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <EnvelopeIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                            </div>
                            <input
                                type="email"
                                placeholder="Email Address"
                                className="block w-full rounded-md border-gray-300 py-3 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <div className="relative mt-1 rounded-md shadow-sm">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <LockClosedIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                            </div>
                            <input
                                type="password"
                                placeholder="Password"
                                className="block w-full rounded-md border-gray-300 py-3 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    
                    <div className="pt-4">
                        <button
                            type="submit"
                            className="w-full flex justify-center items-center gap-2 rounded-md border border-transparent bg-indigo-600 py-3 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            <ArrowRightOnRectangleIcon className="h-5 w-5" />
                            Login
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
  )
}

export default Login;