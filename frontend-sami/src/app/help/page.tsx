'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Layout from '@/components/Layout';
import { 
  Github, 
  Heart, 
  Code, 
  Users, 
  MapPin,
  ExternalLink,
  BookOpen,
  Lightbulb
} from 'lucide-react';

export default function HelpPage() {
  return (
    <Layout title="Help & About">
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mb-4">
              <img 
                src="/sami_logoxd.png" 
                alt="SAMI Logo"
                className="w-16 h-16 mx-auto object-contain"
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">SAMI</h1>
            <p className="text-lg text-gray-600">Service Architecture Management Interface</p>
            <Badge variant="outline" className="mt-2">
              <Heart className="w-3 h-3 mr-1" />
              Open Source
            </Badge>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* About the Project */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  About SAMI
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  SAMI is a comprehensive platform designed to help developers and architects 
                  visualize, document, and manage microservices architectures. It provides 
                  an intuitive interface for creating service maps, tracking dependencies, 
                  and maintaining system documentation.
                </p>
                <p className="text-gray-700">
                  The platform includes features for project management, service visualization, 
                  dependency tracking and collaborative commenting.
                </p>
              </CardContent>
            </Card>

            {/* Why SAMI? */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  Why SAMI?
                </CardTitle>
              </CardHeader>
                          <CardContent>
              <p className="text-gray-700">
                SAMI was born from the challenge of documenting microservices architectures. 
                As systems grow more complex, keeping track of service relationships, 
                dependencies, and system evolution becomes increasingly difficult.
              </p>
              <p className="text-gray-700 mt-3">
                This project aims to simplify that process and help development teams 
                maintain clear, up-to-date documentation of their distributed systems.
              </p>
              
              {/* Sami cat photo */}
              <div className="flex justify-center my-4">
                <div className="text-center">
                  <img 
                    src="/Sami_FOTO.png" 
                    alt="Sami the cat - inspiration for SAMI project name"
                    className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 shadow-md mx-auto"
                  />
                  <p className="text-xs text-gray-500 mt-2">Meet Sami! 🐱</p>
                </div>
              </div>
              
              <p className="text-gray-700 text-sm italic">
                Fun fact: The name SAMI originally came from my cat Sami, who is quite lazy 
                and loves to sleep. I then crafted the words "Service Architecture Management 
                Interface" to match the name - just like how we want our documentation process 
                to be: effortless and peaceful! 🐱
              </p>
            </CardContent>
            </Card>

            {/* Creator Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Creator
                </CardTitle>
              </CardHeader>
                          <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-gray-900">Gerson Andrade Meza</p>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Chile
                  </p>
                </div>
                <p className="text-gray-700 text-sm">
                  Software developer passionate about creating tools that solve real-world 
                  problems in software architecture and documentation.
                </p>
                <div className="pt-2">
                  <Button variant="outline" size="sm" asChild>
                    <a 
                      href="https://github.com/imnotUrban" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <Github className="w-4 h-4" />
                      @imnotUrban
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
            </Card>

            {/* Open Source & License */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Github className="w-5 h-5" />
                  Open Source
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-green-800 font-medium text-sm">✓ Free to use and modify</p>
                  <p className="text-green-800 font-medium text-sm">✓ Contributions welcome</p>
                  <p className="text-green-800 font-medium text-sm">✓ Community driven</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-800 font-medium text-sm">✗ Selling as a service prohibited</p>
                  <p className="text-red-700 text-sm">
                    Companies can use this project internally, but selling SAMI as a product or service is not allowed.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contributing Section */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                Contributing
              </CardTitle>
              <CardDescription>
                Help make SAMI better for everyone
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                We welcome contributions from the community! Whether you're fixing bugs, 
                adding new features, improving documentation, or sharing ideas, your 
                contributions are valuable.
              </p>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Ways to Contribute:</h4>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li>• Report bugs and issues</li>
                    <li>• Submit feature requests</li>
                    <li>• Improve documentation</li>
                    <li>• Submit code improvements</li>
                    <li>• Share usage examples</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Getting Started:</h4>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li>• Fork the repository</li>
                    <li>• Create a feature branch</li>
                    <li>• Make your changes</li>
                    <li>• Submit a pull request</li>
                    <li>• Join the discussion</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="mt-8 text-center">
            <Separator className="mb-6" />
            <p className="text-sm text-gray-500 mb-4">
              Built with ❤️ to help developers document their microservices better
            </p>
            <div className="flex justify-center gap-4">
              <Button variant="outline" size="sm">
                <Github className="w-4 h-4 mr-2" />
                View on GitHub
              </Button>
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4 mr-2" />
                Documentation
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 