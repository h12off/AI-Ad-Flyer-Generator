
import React, { forwardRef } from 'react';
import type { AdConcept } from '../types';

interface AdCanvasProps {
  image: string;
  adContent: AdConcept | null;
  format: 'square' | 'story';
  buttonColor: string;
  companyName: string;
  website: string;
}

const AdCanvas = forwardRef<HTMLDivElement, AdCanvasProps>(({ image, adContent, format, buttonColor, companyName, website }, ref) => {
  const aspectRatioClass = format === 'square' ? 'aspect-square' : 'aspect-[9/16]';

  if (!adContent) {
    return (
      <div ref={ref} className={`w-full ${aspectRatioClass} bg-gray-900 rounded-2xl flex items-center justify-center text-white p-8 transition-all duration-300 border-2 border-dashed border-gray-700`}>
        <div className='text-center'>
          <h3 className='text-2xl font-bold mb-2'>Preview Area</h3>
          <p className='text-gray-400 max-w-sm'>Select an AI variation or edit the content on the left to see your ad preview here.</p>
        </div>
      </div>
    );
  }

  const { headline, body, cta, promo, price, previousPrice } = adContent;

  const paddingClass = 'p-8 md:p-10 lg:p-12';
  const headlineSize = format === 'square' ? 'text-7xl lg:text-8xl' : 'text-8xl lg:text-9xl';
  const bodySize = 'text-3xl lg:text-4xl';
  const ctaClasses = 'text-2xl lg:text-3xl py-5 px-10';

  return (
    <div ref={ref} className={`relative w-full ${aspectRatioClass} rounded-2xl overflow-hidden shadow-2xl bg-black select-none transition-all duration-300`}>
      <img
        src={image}
        alt="Ad background"
        crossOrigin="anonymous" 
        className="absolute inset-0 w-full h-full object-cover object-center opacity-60"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent"></div>
      
      <div className={`absolute inset-0 ${paddingClass} flex flex-col justify-between text-white`}>
        <header className="text-center w-full">
            <div className={`text-2xl font-bold tracking-wider opacity-90`}>
                {companyName}
            </div>
            <p className={`text-base text-white/70 tracking-widest font-light`}>
                {website}
            </p>
        </header>

        <div className="w-full">
          <h1 className={`${headlineSize} font-black leading-tight drop-shadow-lg mb-5`}>
            {headline}
          </h1>
          <p className={`${bodySize} text-gray-200 max-w-xl drop-shadow-md mb-8 font-medium`}>
            {body}
          </p>
          {(promo || price || previousPrice) && (
            <div className="mb-8 flex items-center flex-wrap gap-4">
                {promo && (
                    <span className="bg-amber-400 text-black text-2xl lg:text-3xl font-extrabold px-6 py-2 rounded-full shadow-lg transform -rotate-3 inline-block">
                        {promo}
                    </span>
                )}
                {(price || previousPrice) && (
                    <div className="flex items-baseline gap-3">
                        {price && (
                            <span className="bg-white/90 text-black text-4xl lg:text-5xl font-black px-6 py-4 rounded-full shadow-lg inline-flex items-center justify-center">
                                {price}
                            </span>
                        )}
                        {previousPrice && (
                            <span className="text-gray-400 text-3xl lg:text-4xl font-semibold line-through">
                                {previousPrice}
                            </span>
                        )}
                    </div>
                )}
            </div>
          )}
          <button 
            style={{ backgroundColor: buttonColor }}
            className={`font-bold ${ctaClasses} rounded-xl transition-all duration-300 shadow-lg hover:shadow-2xl hover:brightness-110 transform hover:scale-105`}
          >
            {cta}
          </button>
        </div>
      </div>
    </div>
  );
});

export default AdCanvas;