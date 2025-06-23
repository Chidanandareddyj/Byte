import React from 'react'
import {Navbar} from '@/components/Navbar'
import Hero from '@/components/Hero'
import Silk from '@/components/ui/Silk';

const page = () => {
  return (
    <div className=''>
      <main>
        <div className='relative  min-h-screen flex flex-col'>
          {/* Silk background */}
          <div className="absolute inset-0 -z-10">
            <Silk
              speed={5}
              scale={1}
              color="#7CA3C7"
              noiseIntensity={0.2}
              rotation={0.14}
            />
          </div>
          <Navbar />
          <Hero />
        </div>
      </main>
    </div>
  )
}

export default page
