
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toPng } from 'html-to-image';
import type { AdConcept } from './types';
import { generateAdIdeas } from './services/geminiService';
import AdCanvas from './components/AdCanvas';
import AdVariationCard from './components/AdVariationCard';
import { WandIcon, Spinner, UploadIcon, DownloadIcon } from './components/Icon';
import PaywallModal from './components/PaywallModal';

const INITIAL_USER_IMAGE = 'https://storage.googleapis.com/prismatic-lamp-429813-r4/1274955355/achdouz.png';
const INITIAL_PROMPT = `I need engaging flyer ideas for a new all-in-one Planner Dashboard app.
Goal: Attract students and professionals who want to boost their productivity.
Key points:
- The headline should be catchy and organization-focused.
- Mention key features shown in the image: To-Do Lists, Study Timers, and Goal Tracking.
- Emphasize the benefit: Stop procrastinating and achieve your goals.
- The CTA should be clear and action-oriented, like "Get Organized Today" or "Download Now".`;
const INITIAL_COMPANY_NAME = "ACHDOUZ COMPANY LLC";
const INITIAL_WEBSITE = "www.achdouzcompanyllc.com";


const COLOR_SWATCHES = [
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#10b981', // Green
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#ec4899', // Pink
];

const App: React.FC = () => {
  const [adConcepts, setAdConcepts] = useState<AdConcept[]>([]);
  const [selectedConcept, setSelectedConcept] = useState<AdConcept | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [userImage, setUserImage] = useState<string>(INITIAL_USER_IMAGE);
  const [userPrompt, setUserPrompt] = useState<string>(INITIAL_PROMPT);
  const [companyName, setCompanyName] = useState<string>(INITIAL_COMPANY_NAME);
  const [website, setWebsite] = useState<string>(INITIAL_WEBSITE);
  const [promoDeal, setPromoDeal] = useState<string>("25% OFF This Week!");
  const [price, setPrice] = useState<string>("$49");
  const [previousPrice, setPreviousPrice] = useState<string>("$79");
  const [adFormat, setAdFormat] = useState<'square' | 'story'>('square');
  const [buttonColor, setButtonColor] = useState<string>('#f59e0b');
  const [downloadCount, setDownloadCount] = useState(0);
  const [isPaywallVisible, setIsPaywallVisible] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const adCanvasRef = useRef<HTMLDivElement>(null);


  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (userImage && userImage.startsWith('blob:')) {
                URL.revokeObjectURL(userImage);
            }
            setUserImage(reader.result as string);
        };
        reader.readAsDataURL(file);
    } else if (file) {
        alert("Please select a valid image file (e.g., PNG, JPG, WEBP).");
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  }

  const handleGenerateIdeas = useCallback(async () => {
    if (!userPrompt.trim()) {
        setError("Please enter a description for your ad idea.");
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const newConcepts = await generateAdIdeas(userPrompt, promoDeal, price, previousPrice);
      setAdConcepts(newConcepts);
      setSelectedConcept(newConcepts[0] || null);
    } catch (e: any) {
      setError(e.message || "An unknown error occurred.");
      setAdConcepts([]);
      setSelectedConcept(null);
    } finally {
      setIsLoading(false);
    }
  }, [userPrompt, promoDeal, price, previousPrice]);

  const handleDownload = useCallback(async () => {
    if (downloadCount >= 1) {
      setIsPaywallVisible(true);
      return;
    }

    const element = adCanvasRef.current;
    if (!element || !selectedConcept) {
      alert("Could not download image. Preview element not found or no ad selected.");
      return;
    }
  
    setIsDownloading(true);
  
    try {
      const imageElement = element.querySelector('img');
      if (imageElement && imageElement.src) {
        await imageElement.decode();
      }
      
      const fileName = `flyer-ad-${adFormat}-${Date.now()}.png`;
  
      const fontCssResponse = await fetch("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap");
      let fontCssText = await fontCssResponse.text();
      
      const fontUrlRegex = /url\((https?:\/\/[^)]+)\)/g;
      const uniqueFontUrls = [...new Set(Array.from(fontCssText.matchAll(fontUrlRegex), m => m[1]))];

      const fontDataPromises = uniqueFontUrls.map(async (url) => {
        const fontFileResponse = await fetch(url);
        const blob = await fontFileResponse.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve({ url, dataUrl: reader.result as string });
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      });
  
      const fontDataPairs = await Promise.all(fontDataPromises) as {url: string, dataUrl: string}[];
      const urlMap = new Map(fontDataPairs.map(p => [p.url, p.dataUrl]));
      
      fontCssText = fontCssText.replace(fontUrlRegex, (match, url) => {
          return `url(${urlMap.get(url) || url})`;
      });

      // By calculating pixelRatio based on the element's on-screen size,
      // we ensure the downloaded image is a high-resolution version of exactly
      // what the user sees in the preview. This avoids issues with responsive
      // styles not being applied correctly when forcing a specific width/height.
      const pixelRatio = 1080 / element.offsetWidth;

      const dataUrl = await toPng(element, {
        // No longer forcing width/height, which caused layout discrepancies.
        // Instead, we capture at the element's true size and scale up.
        pixelRatio: pixelRatio,
        cacheBust: true,
        fontEmbedCSS: fontCssText,
        backgroundColor: '#000000',
      });
  
      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      link.click();

      const newCount = downloadCount + 1;
      setDownloadCount(newCount);
      localStorage.setItem('downloadCount', newCount.toString());
  
    } catch (err) {
      console.error("Failed to generate image", err);
      alert("Oops, something went wrong! Could not download image.");
    } finally {
      setIsDownloading(false);
    }
  }, [adFormat, selectedConcept, downloadCount]);
  
  useEffect(() => {
    handleGenerateIdeas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const savedCount = localStorage.getItem('downloadCount');
    if (savedCount) {
      setDownloadCount(parseInt(savedCount, 10));
    }
  }, []);

  return (
    <div className="bg-[#111827] min-h-screen text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-screen-2xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tighter text-white">
            AI Ad <span className="text-amber-400">Flyer Generator</span>
          </h1>
          <p className="mt-4 max-w-3xl mx-auto text-lg text-gray-400">
            Describe your service, and let AI create professional, high-converting ad flyers instantly.
          </p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-5 gap-8 xl:gap-12">
          <div className="lg:col-span-2 bg-[#1F2937] p-6 rounded-2xl border border-gray-700 flex flex-col">
            <h2 className="text-3xl font-bold mb-2 text-white">Customize Your Ad</h2>
            <p className="text-gray-400 mb-6">Tweak the details to perfectly match your brand.</p>

            <div className="flex-grow flex flex-col gap-5">
                <div className="space-y-2">
                    <label htmlFor="company-name" className="block text-sm font-semibold text-gray-300">Company Name</label>
                    <input type="text" id="company-name" value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"/>
                </div>
                <div className="space-y-2">
                    <label htmlFor="website" className="block text-sm font-semibold text-gray-300">Website URL</label>
                    <input type="text" id="website" value={website} onChange={e => setWebsite(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"/>
                </div>
                 <div className="space-y-2">
                    <label htmlFor="promo-deal" className="block text-sm font-semibold text-gray-300">Promo Deal / Discount (Optional)</label>
                    <input type="text" id="promo-deal" value={promoDeal} placeholder="e.g., 25% OFF" onChange={e => setPromoDeal(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"/>
                </div>
                <div className="space-y-2">
                    <label htmlFor="price" className="block text-sm font-semibold text-gray-300">Price / Starting From (Optional)</label>
                    <input type="text" id="price" value={price} placeholder="e.g., $99" onChange={e => setPrice(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"/>
                </div>
                <div className="space-y-2">
                    <label htmlFor="previous-price" className="block text-sm font-semibold text-gray-300">Previous Price (Optional)</label>
                    <input type="text" id="previous-price" value={previousPrice} placeholder="e.g., $149" onChange={e => setPreviousPrice(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"/>
                </div>
                <div className="space-y-2">
                    <label htmlFor="user-prompt" className="block text-sm font-semibold text-gray-300">
                        Ad Description & Key Points
                    </label>
                    <textarea
                        id="user-prompt"
                        value={userPrompt}
                        onChange={(e) => setUserPrompt(e.target.value)}
                        placeholder="e.g., I need a flyer for my coffee shop's new winter latte..."
                        rows={6}
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                    />
                </div>
                
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-300">Ad Format</label>
                        <div className="flex rounded-lg bg-gray-800 p-1 border border-gray-600 h-11">
                            <button
                                onClick={() => setAdFormat('square')}
                                className={`w-full rounded-md text-sm font-semibold transition-colors duration-200 ${adFormat === 'square' ? 'bg-amber-500 text-white shadow-md' : 'text-gray-300 hover:bg-gray-700'}`}
                            >
                                Post (1:1)
                            </button>
                            <button
                                onClick={() => setAdFormat('story')}
                                className={`w-full rounded-md text-sm font-semibold transition-colors duration-200 ${adFormat === 'story' ? 'bg-amber-500 text-white shadow-md' : 'text-gray-300 hover:bg-gray-700'}`}
                            >
                                Story (9:16)
                            </button>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-300">Button Color</label>
                        <div className="flex items-center justify-between rounded-lg bg-gray-800 p-1 border border-gray-600 h-11 gap-1">
                            {COLOR_SWATCHES.map(color => (
                                <button
                                    key={color}
                                    onClick={() => setButtonColor(color)}
                                    className={`w-full h-full rounded-md transition-all duration-200 ${buttonColor === color ? 'ring-2 ring-offset-2 ring-offset-gray-800 ring-white' : 'scale-90 opacity-60 hover:opacity-100 hover:scale-100'}`}
                                    style={{ backgroundColor: color }}
                                    aria-label={`Select color ${color}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 mt-auto pt-4'>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        className="hidden"
                        accept="image/png, image/jpeg, image/webp"
                    />
                    <button
                        onClick={triggerFileUpload}
                        className="w-full flex items-center justify-center gap-2 bg-transparent border-2 border-gray-600 hover:bg-gray-800 hover:border-gray-500 text-gray-200 font-bold py-3 px-4 rounded-lg transition-colors duration-300"
                    >
                        <UploadIcon className="w-5 h-5" />
                        Change Image
                    </button>
                     <button
                      onClick={handleGenerateIdeas}
                      disabled={isLoading}
                      className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-800/50 disabled:cursor-wait text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 shadow-lg shadow-amber-500/10"
                    >
                      {isLoading ? (
                        <>
                          <Spinner className="w-5 h-5" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <WandIcon className="w-5 h-5" />
                          Generate Ideas
                        </>
                      )}
                    </button>
                </div>
                
                <hr className="border-gray-700"/>

                <div>
                    <h3 className="text-xl font-bold mb-3 text-white">AI-Generated Variations</h3>
                    {error && (
                      <div className="bg-red-900/50 border border-red-700 text-red-300 p-3 rounded-lg mb-4">
                        <p className="font-semibold">Generation Failed</p>
                        <p className="text-sm">{error}</p>
                      </div>
                    )}
                    
                    <div className="space-y-3 max-h-[240px] lg:max-h-[280px] overflow-auto pr-2 -mr-2">
                        {isLoading && !adConcepts.length ? (
                            <p className='text-gray-400 text-center py-4'>Generating initial ideas...</p>
                        ) : adConcepts.length > 0 ? (
                            adConcepts.map((concept, index) => (
                                <AdVariationCard
                                    key={index}
                                    concept={concept}
                                    isSelected={selectedConcept === concept}
                                    onSelect={() => setSelectedConcept(concept)}
                                    buttonColor={buttonColor}
                                />
                            ))
                        ) : (
                            !isLoading && <p className='text-gray-400 text-center py-4'>No ad concepts. Try a new prompt!</p>
                        )}
                    </div>
                </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="sticky top-8">
                <AdCanvas
                    ref={adCanvasRef}
                    image={userImage}
                    adContent={selectedConcept}
                    format={adFormat}
                    buttonColor={buttonColor}
                    companyName={companyName}
                    website={website}
                />
                <button
                    onClick={handleDownload}
                    disabled={!selectedConcept || isDownloading}
                    className="w-full mt-6 flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800/50 disabled:cursor-not-allowed text-white font-bold py-4 px-4 rounded-lg transition-colors duration-300 text-lg shadow-lg shadow-emerald-500/20"
                >
                    {isDownloading ? (
                        <>
                            <Spinner className="w-6 h-6" />
                            Downloading...
                        </>
                    ) : (
                        <>
                            <DownloadIcon className="w-6 h-6" />
                            Download as PNG
                        </>
                    )}
                </button>
            </div>
          </div>
        </main>
      </div>
      {isPaywallVisible && <PaywallModal onClose={() => setIsPaywallVisible(false)} />}
    </div>
  );
};

export default App;