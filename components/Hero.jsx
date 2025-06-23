import React from 'react';
import { Button } from "@/components/ui/button"; // Assuming you have a Button component
import { Play } from 'lucide-react'; // Assuming you use lucide-react for icons
import Link from 'next/link';
import { ThanosSnapEffect } from './thanos-snap-effect';

const Hero = () => {
  return (
    <div className='container mx-auto px-4 py-16 md:py-24 lg:py-32'>
      <div className='flex flex-col md:flex-row items-start justify-start text-left space-y-10 md:space-y-0 md:space-x-10'>
        {/* left side */}
        <div className="md:w-2/3 lg:w-1/2 space-y-8 animate-fade-in">
          <div>
            <Button
              variant="outline"
              className="rounded-full mb-6 gap-2 bg-white/20 backdrop-blur-md border-white/30 hover:bg-white/30 transition-all duration-300 animate-bounce font-sans"
            >
              <Play size={16} className="text-white" />
              <span className="text-white">Watch How It Works</span>
            </Button>
          </div>
          <h1
            className="text-xl md:text-6xl lg:text-4xl font-bold leading-tight text-white animate-slide-up font-playfair"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Transform Math Learning with AI-Powered Video Generation
          </h1>
          <div className="pt-8 md:pt-10">
            <p className="text-lg md:text-xl text-gray-200 max-w-xl animate-fade-in-delay font-sans">
              Byte-learn uses advanced AI and animation to create engaging educational math videos.
              Turn complex concepts into clear, visual explanations with just a few clicks.
            </p>
            <div className="mt-10">
              <Link href="/login">
                <ThanosSnapEffect
                  size="lg"
                  className="bg-white/20 backdrop-blur-md text-white hover:bg-white/30 rounded-md px-8 py-3 text-lg border border-white/30 transition-all duration-300 hover:scale-105 animate-pulse font-sans"
                >
                  Create Your First Video <span className="ml-2">➔</span>
                </ThanosSnapEffect>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Hero
