'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Image from 'next/image';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      if (response.ok) {
        // Successful registration, redirect to login
        router.push('/login?message=Registration successful. You can now sign in.');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Registration failed');
      }
    } catch (_) {
      setError('Connection error. Please verify the server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Large X */}
      <div className="flex-1 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
        <X 
          size={300} 
          className="text-gray-400 stroke-[0.5]"
          strokeWidth={0.5}
        />
      </div>

      {/* Right side - Registration form */}
      <div className="flex-1 bg-white flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mb-4">
              <Image 
                src="/sami_logoxd.png" 
                alt="SAMI Logo"
                width={64}
                height={64}
                className="w-16 h-16 mx-auto object-contain"
              />
            </div>
            <CardTitle className="text-2xl font-semibold text-gray-900">
              Create SAMI Account
            </CardTitle>
            <CardDescription>
              System Architecture Mapping Interface
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name field */}
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              {/* Email field */}
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Password field */}
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              {/* Confirm Password field */}
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              {/* Error message */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Register button */}
              <div className="flex justify-center pt-2">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="px-8"
                  size="lg"
                >
                  {isLoading ? 'Creating account...' : 'sign up'}
                </Button>
              </div>
            </form>

            {/* Login link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link 
                  href="/login" 
                  className="text-gray-900 hover:underline font-medium"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 