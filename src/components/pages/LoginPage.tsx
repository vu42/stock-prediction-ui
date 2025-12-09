import { useState } from 'react';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { useAuth } from '../../contexts/AuthContext';

export function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      setError('Please enter username and password.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await login({ username, password });
      // Navigation will be handled by App.tsx checking isAuthenticated
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestAccountClick = (user: string) => {
    setUsername(user);
    setPassword('pass1234');
    setError('');
  };

  const detectedRole = username.startsWith('enduser')
    ? 'End User'
    : username.startsWith('ds')
    ? 'Data Scientist'
    : '—';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <Card className="w-full max-w-[420px] p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-gray-900">Stock Prediction</h1>
          <p className="text-gray-600">Sign in to continue</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username Input */}
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError('');
              }}
              className={error ? 'border-red-500' : ''}
              disabled={isLoading}
            />
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                className={error ? 'border-red-500 pr-10' : 'pr-10'}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Role Detection */}
          <div className="space-y-2">
            <Label>Detected role</Label>
            <div className="text-sm text-gray-600 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
              {detectedRole}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive" className="py-2">
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          {/* Sign In Button */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                disabled={isLoading}
              />
              <Label htmlFor="remember" className="cursor-pointer text-sm">
                Remember me
              </Label>
            </div>
            <a
              href="#"
              className="text-sm text-blue-600 hover:text-blue-700"
              onClick={(e) => e.preventDefault()}
            >
              Forgot password?
            </a>
          </div>
        </form>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Test Accounts</span>
          </div>
        </div>

        {/* Test Accounts */}
        <div className="space-y-4">
          {/* End User Accounts */}
          <div className="space-y-2">
            <h4 className="text-gray-900">End User</h4>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => handleTestAccountClick('enduser1')}
                className="w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-md border border-gray-200 transition-colors"
                disabled={isLoading}
              >
                <div className="text-sm">
                  <span className="text-gray-900">enduser1</span>
                  <span className="text-gray-500"> / pass1234</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleTestAccountClick('enduser2')}
                className="w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-md border border-gray-200 transition-colors"
                disabled={isLoading}
              >
                <div className="text-sm">
                  <span className="text-gray-900">enduser2</span>
                  <span className="text-gray-500"> / pass1234</span>
                </div>
              </button>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              End Users can access Home and Stock Detail. Default landing: Home.
            </p>
          </div>

          {/* Data Scientist Accounts */}
          <div className="space-y-2">
            <h4 className="text-gray-900">Data Scientist</h4>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => handleTestAccountClick('ds1')}
                className="w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-md border border-gray-200 transition-colors"
                disabled={isLoading}
              >
                <div className="text-sm">
                  <span className="text-gray-900">ds1</span>
                  <span className="text-gray-500"> / pass1234</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleTestAccountClick('ds2')}
                className="w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-md border border-gray-200 transition-colors"
                disabled={isLoading}
              >
                <div className="text-sm">
                  <span className="text-gray-900">ds2</span>
                  <span className="text-gray-500"> / pass1234</span>
                </div>
              </button>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Data Scientists can access Training, Pipelines, Home, and Stock Detail. Default landing: Training.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
