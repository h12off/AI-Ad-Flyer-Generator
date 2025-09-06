
import React from 'react';
import type { AdConcept } from '../types';

interface AdVariationCardProps {
  concept: AdConcept;
  isSelected: boolean;
  onSelect: () => void;
  buttonColor: string;
}

const AdVariationCard: React.FC<AdVariationCardProps> = ({ concept, isSelected, onSelect, buttonColor }) => {
  const selectedClasses = isSelected
    ? 'border-amber-500 bg-gray-800 ring-2 ring-amber-500'
    : 'border-gray-700 bg-gray-800/80 hover:bg-gray-700/90 hover:border-gray-600';

  const ctaStyle = {
    backgroundColor: `${buttonColor}33`, 
    color: buttonColor,
    borderColor: `${buttonColor}80`,
  };

  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${selectedClasses}`}
    >
      <h3 className="font-bold text-white text-lg">{concept.headline}</h3>
      <p className="text-gray-400 mt-1 text-sm">{concept.body}</p>
      <div className="flex items-center justify-between mt-3 gap-2 flex-wrap">
        <div 
          style={ctaStyle}
          className="text-xs font-semibold px-2.5 py-1 rounded-full border"
        >
          {concept.cta}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
            {concept.promo && (
                <span className="bg-amber-500/20 text-amber-400 text-xs font-bold px-2 py-0.5 rounded-full">
                    {concept.promo}
                </span>
            )}
            {concept.previousPrice && (
                <span className="text-gray-500 text-xs font-bold line-through">
                    {concept.previousPrice}
                </span>
            )}
            {concept.price && (
                <span className="bg-gray-600/50 text-gray-200 text-xs font-bold px-2 py-0.5 rounded-full">
                    {concept.price}
                </span>
            )}
        </div>
      </div>
    </div>
  );
};

export default AdVariationCard;