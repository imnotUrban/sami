'use client';

import { useRouter } from 'next/navigation';
import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-8">
      <div className="text-center">
        <div className="mb-8">
          <img 
            src="/sami_logoxd.png" 
            alt="SAMI - System Architecture Mapping Interface"
            className="w-96 h-auto mx-auto object-contain"
          />
        </div>
        <p className="text-xl text-gray-600 mb-12 max-w-md mx-auto">
          System Architecture Mapping Interface
        </p>
        
        <div className="space-y-4">
          <Button
            onClick={() => router.push('/login')}
            className="flex items-center justify-center space-x-2 w-full sm:w-auto px-8 py-4 mx-auto"
            size="lg"
          >
            <LogIn size={20} />
            <span>Sign In</span>
          </Button>
        </div>
        
        <div className="mt-12 text-sm text-gray-500">
          <p>Manage your infrastructure projects visually</p>
        </div>
      </div>
    </div>
  );
}
