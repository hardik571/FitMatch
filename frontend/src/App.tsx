import React, { useState, useMemo, useEffect } from 'react';
import {
  User, Shirt, Calendar, Sparkles, Droplets, LogOut,
  Camera, CheckCircle2, XCircle, ChevronRight, Share2, Save, ShoppingBag, Globe,
  Menu, X, Heart, Star, Zap, Search, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import CameraCapture from './components/CameraCapture';
import ChatAssistant from './components/ChatAssistant';
import ProductCard from './components/ProductCard';
import Auth from './components/Auth';
import { supabase } from './services/supabase';
import { analyzeUserImage, matchOutfit, getEventOutfit, getSkincareAdvice } from './services/geminiService';
import { createUserInBackend, getUserFromBackend, logUserActivity } from './services/apiService';
import { AnalysisResult, OutfitMatchResult, Screen, UserProfile, SkincareRoutine, Language, Product } from './types';
import { MOCK_PRODUCTS } from './data/products';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.AUTH);
  const [language, setLanguage] = useState<Language>('en');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  // State for features
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [outfitResult, setOutfitResult] = useState<OutfitMatchResult | null>(null);
  const [eventResult, setEventResult] = useState<string | null>(null);
  const [skincareResult, setSkincareResult] = useState<SkincareRoutine | null>(null);

  // Inputs
  const [topImage, setTopImage] = useState<string | null>(null);
  const [bottomImage, setBottomImage] = useState<string | null>(null);
  const [eventType, setEventType] = useState<string>('Wedding Guest');
  const [skinTypeInput, setSkinTypeInput] = useState<string>('Combination');

  // Global active image for Chat Context
  const [activeImage, setActiveImage] = useState<string | null>(null);

  // --- Translations ---
  const t = {
    en: {
      title: 'FitMatch AI',
      subtitle: 'Your personal AI stylist, outfit matcher, and grooming assistant.',
      login: 'Get Started with Google',
      nav_profile: 'Profile',
      nav_analyze: 'Analyze',
      nav_match: 'Match',
      nav_events: 'Events',
      nav_care: 'Care',
      nav_shop: 'Shop',
      hello: 'Hello',
      analyze_title: 'AI Body & Face Analysis',
      match_title: 'Outfit Compatibility',
      event_title: 'Event & Season Stylist',
      care_title: 'Grooming & Skincare',
      shop_title: 'Shop The Look',
      profile_stats: 'Your Style Profile',
      analyzed: 'Analyzed',
      take_photo: 'Take a Selfie',
      upload_photo: 'Upload a photo to see your AI analysis here.',
      analyzing: 'AI is analyzing your features...',
      match_btn: 'Check Outfit Match',
      event_btn: 'Get Outfit for',
      care_btn: 'Generate Routine',
      shop_desc: 'Smart recommendations based on your AI profile.',
      buy_btn: 'Buy Now',
      top_picks: 'Top Picks for You',
      trending: 'Trending Now',
      why_match: 'Why this matches you',
      color_match: 'Matches your best colors',
      combos_title: 'Best Outfit Combinations for You',
      style: 'Style',
      top: 'Top',
      bottom: 'Bottom',
      shoes: 'Footwear',
      rec_palette: 'Recommended Palette',
      physical_profile: 'Physical Profile',
      styling_profile: 'Styling Profile',
      occasion_label: "Select Occasion or Season",
      wedding_special: "Wedding Special",
      seasons: "Seasons",
      occasions: "Occasions",
      bride: "Bride (Wedding Day)",
      groom: "Groom (Wedding Day)",
      pre_wedding: "Pre-Wedding Shoot",
      winter: "Winter Wear",
      summer: "Summer Casuals",
      monsoon: "Rainy Day / Monsoon",
      party: "Diwali Party",
      formal: "Formal Interview",
      vacation: "Travel / Vacation"
    },
    hi: {
      title: 'फिटमैच AI',
      subtitle: 'आपका व्यक्तिगत AI स्टाइलिस्ट और ग्रूमिंग असिस्टेंट।',
      login: 'Google से शुरू करें',
      nav_profile: 'प्रोफाइल',
      nav_analyze: 'जांचें',
      nav_match: 'मैच',
      nav_events: 'इवेंट्स',
      nav_care: 'देखभाल',
      nav_shop: 'शॉपिंग',
      hello: 'नमस्ते',
      analyze_title: 'AI चेहरा और शरीर विश्लेषण',
      match_title: 'आउटफिट मिलान',
      event_title: 'इवेंट और मौसम स्टाइलिस्ट',
      care_title: 'ग्रूमिंग और स्किनकेयर',
      shop_title: 'शॉपिंग और सिफारिशें',
      profile_stats: 'आपका स्टाइल प्रोफाइल',
      analyzed: 'विश्लेषण किया गया',
      take_photo: 'सेल्फी लें',
      upload_photo: 'अपना AI विश्लेषण देखने के लिए फोटो अपलोड करें।',
      analyzing: 'AI आपके फीचर्स का विश्लेषण कर रहा है...',
      match_btn: 'मैच चेक करें',
      event_btn: 'इसके लिए आउटफिट',
      care_btn: 'रूटीन बनाएं',
      shop_desc: 'आपके AI प्रोफाइल पर आधारित स्मार्ट सिफारिशें।',
      buy_btn: 'अभी खरीदें',
      top_picks: 'आपके लिए खास',
      trending: 'ट्रेंडिंग फैशन',
      why_match: 'यह आपको क्यों जचता है',
      color_match: 'आपके रंगों से मेल खाता है',
      combos_title: 'आपके लिए बेहतरीन आउटफिट सुझाव',
      style: 'शैली',
      top: 'ऊपरी कपड़ा',
      bottom: 'निचला कपड़ा',
      shoes: 'जूते',
      rec_palette: 'सुझाए गए रंग',
      physical_profile: 'शारीरिक रूपरेखा',
      styling_profile: 'स्टाइलिंग प्रोफाइल',
      occasion_label: "अवसर या मौसम चुनें",
      wedding_special: "शादी विशेष",
      seasons: "मौसम",
      occasions: "अवसर",
      bride: "दुल्हन (शादी का दिन)",
      groom: "दूल्हा (शादी का दिन)",
      pre_wedding: "प्री-वेडिंग शूट",
      winter: "सर्दियों के कपड़े",
      summer: "गर्मियों के कपड़े",
      monsoon: "बारिश का मौसम",
      party: "दिवाली पार्टी",
      formal: "फॉर्मल इंटरव्यू",
      vacation: "यात्रा / छुट्टियां"
    }
  };

  const txt = t[language];

  // --- Feature Handlers ---

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        handleSupabaseUser(session.user);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        handleSupabaseUser(session.user);
      } else {
        setUser(null);
        setCurrentScreen(Screen.AUTH);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSupabaseUser = async (supabaseUser: any) => {
    setLoading(true);
    const email = supabaseUser.email;
    const name = supabaseUser.user_metadata?.name || email.split('@')[0];

    // Try to get or create user in the backend
    let dbUser = await getUserFromBackend(email);
    if (!dbUser) {
      dbUser = await createUserInBackend(name, email);
    }

    const uid = dbUser?.id || supabaseUser.id;

    setUser({ uid, name, email, photoURL: supabaseUser.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80' });
    setCurrentScreen(Screen.HOME);
    setLoading(false);
  };

  const handleAnalyzeProfile = async (base64: string) => {
    setActiveImage(base64);
    setLoading(true);
    try {
      const result = await analyzeUserImage(base64, language);
      if (result.isRelevant === false) {
        alert(result.relevanceMessage || (language === 'hi' ? "कृपया एक मान्य व्यक्ति की फोटो अपलोड करें।" : "Please upload a valid photo of a person."));
        return;
      }
      setAnalysisResult(result);
      if (user) {
        setUser({ ...user, analyzedData: result });
        if (user.email) {
          await logUserActivity(user.email, 'PROFILE_ANALYSIS', result);
        }
      }
    } catch (e) {
      console.error(e);
      alert(language === 'hi' ? "विश्लेषण विफल रहा। कृपया पुनः प्रयास करें।" : "Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOutfitMatch = async () => {
    if (!topImage || !bottomImage) return;
    setLoading(true);
    try {
      const result = await matchOutfit(topImage, bottomImage, language);
      if (result.isRelevant === false) {
        alert(result.relevanceMessage || (language === 'hi' ? "कृपया कपड़ों की मान्य फोटो अपलोड करें।" : "Please upload valid photos of clothing items."));
        return;
      }
      setOutfitResult(result);
      if (user && user.email) {
        await logUserActivity(user.email, 'OUTFIT_MATCH', result);
      }
    } catch (e) {
      console.error(e);
      alert(language === 'hi' ? "मैचिंग विफल रही।" : "Matching failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleEventSuggestion = async () => {
    setLoading(true);
    try {
      const result = await getEventOutfit(eventType, user?.analyzedData, language);
      setEventResult(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSkincare = async () => {
    setLoading(true);
    try {
      const result = await getSkincareAdvice(skinTypeInput, language);
      setSkincareResult(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // --- Smart Product Recommendation Logic ---
  const recommendedProducts = useMemo(() => {
    let products = [...MOCK_PRODUCTS];

    if (!user?.analyzedData) {
      return products.map(p => ({ ...p, matchScore: Math.floor(Math.random() * 20) + 70 }));
    }

    const { bestColors, bodyType, skinTone } = user.analyzedData;

    return products.map(product => {
      let score = 70;

      const colorMatch = product.colors.some(pc =>
        bestColors.some(bc => bc.toLowerCase().includes(pc.toLowerCase()) || pc.toLowerCase().includes(bc.toLowerCase()))
      );
      if (colorMatch) score += 15;

      if (bodyType.toLowerCase().includes('slim') && product.tags.includes('Slim')) score += 10;
      if (bodyType.toLowerCase().includes('average') && product.tags.includes('Casual')) score += 5;
      if (bodyType.toLowerCase().includes('broad') && product.tags.includes('Structured')) score += 10;

      if (skinTone.toLowerCase().includes('fair') && product.colors.includes('Dark')) score += 5;
      if (skinTone.toLowerCase().includes('deep') && product.colors.includes('Pastel')) score += 5;
      if (skinTone.toLowerCase().includes('medium') && product.colors.includes('Beige')) score += 5;

      return { ...product, matchScore: Math.min(score, 99) };
    }).sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  }, [user?.analyzedData]);


  const handleCaptureTop = (base64: string) => { setTopImage(base64); setActiveImage(base64); };
  const handleCaptureBottom = (base64: string) => { setBottomImage(base64); setActiveImage(base64); };

  const toggleLanguage = () => setLanguage(prev => prev === 'en' ? 'hi' : 'en');

  // --- UI Components ---

  const BottomNav = () => (
    <div className="fixed bottom-0 left-0 right-0 glass border-t border-white/20 px-6 py-3 flex justify-between items-center z-40 md:hidden">
      <button onClick={() => setCurrentScreen(Screen.HOME)} className={`flex flex-col items-center ${currentScreen === Screen.HOME ? 'text-black' : 'text-gray-400'}`}>
        <User size={20} />
        <span className="text-[10px] mt-1">{txt.nav_profile}</span>
      </button>
      <button onClick={() => setCurrentScreen(Screen.ANALYZE_ME)} className={`flex flex-col items-center ${currentScreen === Screen.ANALYZE_ME ? 'text-black' : 'text-gray-400'}`}>
        <Sparkles size={20} />
        <span className="text-[10px] mt-1">{txt.nav_analyze}</span>
      </button>
      <button onClick={() => setCurrentScreen(Screen.OUTFIT_MATCH)} className={`flex flex-col items-center ${currentScreen === Screen.OUTFIT_MATCH ? 'text-black' : 'text-gray-400'}`}>
        <Shirt size={20} />
        <span className="text-[10px] mt-1">{txt.nav_match}</span>
      </button>
      <button onClick={() => setCurrentScreen(Screen.EVENT_STYLIST)} className={`flex flex-col items-center ${currentScreen === Screen.EVENT_STYLIST ? 'text-black' : 'text-gray-400'}`}>
        <Calendar size={20} />
        <span className="text-[10px] mt-1">{txt.nav_events}</span>
      </button>
      <button onClick={() => setCurrentScreen(Screen.SKINCARE)} className={`flex flex-col items-center ${currentScreen === Screen.SKINCARE ? 'text-black' : 'text-gray-400'}`}>
        <Droplets size={20} />
        <span className="text-[10px] mt-1">{txt.nav_care}</span>
      </button>
      <button onClick={() => setCurrentScreen(Screen.SHOP)} className={`flex flex-col items-center ${currentScreen === Screen.SHOP ? 'text-black' : 'text-gray-400'}`}>
        <ShoppingBag size={20} />
        <span className="text-[10px] mt-1">{txt.nav_shop}</span>
      </button>
    </div>
  );

  const Sidebar = () => (
    <div className="hidden md:flex flex-col w-64 glass h-screen fixed left-0 top-0 border-r border-white/20 p-6 z-40">
      <div className="flex items-center gap-2 mb-10">
        <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
          <Zap className="text-white" size={18} />
        </div>
        <h1 className="text-xl font-bold tracking-tight">{txt.title}</h1>
      </div>

      <nav className="flex-1 space-y-2">
        {[
          { id: Screen.HOME, icon: User, label: txt.nav_profile },
          { id: Screen.ANALYZE_ME, icon: Sparkles, label: txt.nav_analyze },
          { id: Screen.OUTFIT_MATCH, icon: Shirt, label: txt.nav_match },
          { id: Screen.EVENT_STYLIST, icon: Calendar, label: txt.nav_events },
          { id: Screen.SKINCARE, icon: Droplets, label: txt.nav_care },
          { id: Screen.SHOP, icon: ShoppingBag, label: txt.nav_shop },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentScreen(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentScreen === item.id ? 'bg-black text-white shadow-lg' : 'hover:bg-black/5 text-gray-600'
              }`}
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="pt-6 border-t border-black/5">
        <button onClick={toggleLanguage} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-black/5 text-gray-600 mb-2">
          <Globe size={20} />
          <span className="font-medium">{language === 'en' ? 'Hindi' : 'English'}</span>
        </button>
        <button onClick={() => { supabase.auth.signOut(); setUser(null); setCurrentScreen(Screen.AUTH); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 text-red-600">
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );

  if (currentScreen === Screen.AUTH) {
    return (
      <Auth 
        onSuccess={handleSupabaseUser}
        language={language}
        onToggleLanguage={toggleLanguage}
        title={txt.title}
        subtitle={txt.subtitle}
      />
    );
  }

  const renderScreen = () => {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScreen}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="min-h-full"
        >
          {(() => {
            switch (currentScreen) {
              case Screen.HOME:
                return (
                  <div className="space-y-8 pb-10">
                    <header className="flex justify-between items-center md:hidden mb-4">
                      <h1 className="text-2xl font-bold tracking-tight">{txt.title}</h1>
                      <button onClick={toggleLanguage} className="p-2 glass rounded-full">
                        <Globe size={20} />
                      </button>
                    </header>

                    <section className="relative rounded-3xl overflow-hidden h-48 flex items-end p-6 shadow-xl">
                      <img
                        src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80"
                        className="absolute inset-0 w-full h-full object-cover"
                        alt="Style Hero"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                      <div className="relative z-10">
                        <h2 className="text-white text-3xl font-bold">{txt.hello}, {user?.name}!</h2>
                        <p className="text-white/70">{txt.shop_desc}</p>
                      </div>
                    </section>

                    {user?.analyzedData ? (
                      <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="glass p-6 rounded-3xl shadow-sm">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                              <User size={18} className="text-indigo-500" />
                              {txt.physical_profile}
                            </h3>
                            <div className="space-y-3">
                              <div className="flex justify-between py-2 border-b border-black/5">
                                <span className="text-gray-500">Face Shape</span>
                                <span className="font-semibold">{user.analyzedData.faceShape}</span>
                              </div>
                              <div className="flex justify-between py-2 border-b border-black/5">
                                <span className="text-gray-500">Skin Tone</span>
                                <span className="font-semibold">{user.analyzedData.skinTone}</span>
                              </div>
                              <div className="flex justify-between py-2 border-b border-black/5">
                                <span className="text-gray-500">Body Type</span>
                                <span className="font-semibold">{user.analyzedData.bodyType}</span>
                              </div>
                              <div className="flex justify-between py-2">
                                <span className="text-gray-500">Lookalike</span>
                                <span className="font-semibold text-indigo-600">{user.analyzedData.lookalike}</span>
                              </div>
                            </div>
                          </div>

                          <div className="glass p-6 rounded-3xl shadow-sm">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                              <Sparkles size={18} className="text-amber-500" />
                              {txt.styling_profile}
                            </h3>
                            <div className="mb-4">
                              <p className="text-sm text-gray-500 mb-2">{txt.rec_palette}</p>
                              <div className="flex flex-wrap gap-2">
                                {user.analyzedData.bestColors.map((color, i) => (
                                  <span key={i} className="px-3 py-1 bg-white border border-black/5 rounded-full text-xs font-medium shadow-sm">
                                    {color}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500 mb-2">Hairstyle & Accessories</p>
                              <p className="text-sm font-medium">{user.analyzedData.hairstyle} • {user.analyzedData.sunglasses}</p>
                            </div>
                          </div>
                        </div>

                        <section>
                          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 px-1">
                            <Shirt size={20} className="text-emerald-500" />
                            {txt.combos_title}
                          </h3>
                          <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide -mx-1 px-1">
                            {user.analyzedData.outfitCombinations.map((combo, i) => (
                              <div key={i} className="min-w-[280px] glass p-5 rounded-3xl shadow-sm border border-white/40">
                                <div className="flex justify-between items-start mb-4">
                                  <span className="px-3 py-1 bg-black text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                                    {combo.style}
                                  </span>
                                  <Star size={16} className="text-amber-400 fill-amber-400" />
                                </div>
                                <div className="space-y-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
                                      <Shirt size={16} />
                                    </div>
                                    <div>
                                      <p className="text-[10px] text-gray-400 uppercase font-bold">{txt.top}</p>
                                      <p className="text-sm font-semibold">{combo.top}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500">
                                      <Shirt size={16} className="rotate-180" />
                                    </div>
                                    <div>
                                      <p className="text-[10px] text-gray-400 uppercase font-bold">{txt.bottom}</p>
                                      <p className="text-sm font-semibold">{combo.bottom}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500">
                                      <Zap size={16} />
                                    </div>
                                    <div>
                                      <p className="text-[10px] text-gray-400 uppercase font-bold">{txt.shoes}</p>
                                      <p className="text-sm font-semibold">{combo.footwear}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </section>
                      </div>
                    ) : (
                      <div className="glass p-10 rounded-3xl text-center space-y-4">
                        <div className="w-20 h-20 bg-black/5 rounded-full flex items-center justify-center mx-auto">
                          <Camera size={32} className="text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold">{txt.analyzed}</h3>
                        <p className="text-gray-500 max-w-xs mx-auto">{txt.upload_photo}</p>
                        <button
                          onClick={() => setCurrentScreen(Screen.ANALYZE_ME)}
                          className="bg-black text-white px-8 py-3 rounded-2xl font-bold hover:scale-105 transition-transform"
                        >
                          {txt.take_photo}
                        </button>
                      </div>
                    )}
                  </div>
                );

              case Screen.ANALYZE_ME:
                return (
                  <div className="animate-fade-in max-w-2xl mx-auto space-y-6">
                    <h2 className="text-3xl font-bold tracking-tight">{txt.analyze_title}</h2>
                    {loading ? (
                      <div className="glass p-20 rounded-3xl flex flex-col items-center justify-center space-y-6">
                        <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-lg font-medium animate-pulse">{txt.analyzing}</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <CameraCapture onCapture={handleAnalyzeProfile} />
                        <div className="glass p-6 rounded-3xl">
                          <h4 className="font-bold mb-2 flex items-center gap-2">
                            <CheckCircle2 size={18} className="text-emerald-500" />
                            How it works
                          </h4>
                          <p className="text-sm text-gray-500 leading-relaxed">
                            Our AI analyzes your facial structure, skin undertones, and body proportions to build a unique style DNA. We then use this to recommend colors, cuts, and styles that naturally enhance your look.
                          </p>
                        </div>
                      </div>
                    )}
                    {analysisResult && !loading && (
                      <button
                        onClick={() => setCurrentScreen(Screen.HOME)}
                        className="w-full bg-black text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2"
                      >
                        View My Profile <ChevronRight size={20} />
                      </button>
                    )}
                  </div>
                );

              case Screen.OUTFIT_MATCH:
                return (
                  <div className="animate-fade-in max-w-2xl mx-auto space-y-8">
                    <h2 className="text-3xl font-bold tracking-tight">{txt.match_title}</h2>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-wider ml-1">{txt.top}</p>
                        <CameraCapture onCapture={handleCaptureTop} />
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-wider ml-1">{txt.bottom}</p>
                        <CameraCapture onCapture={handleCaptureBottom} />
                      </div>
                    </div>

                    <button
                      onClick={handleOutfitMatch}
                      disabled={!topImage || !bottomImage || loading}
                      className="w-full bg-black text-white py-4 rounded-2xl font-bold disabled:opacity-50 disabled:scale-100 hover:scale-[1.02] transition-all shadow-xl flex items-center justify-center gap-2"
                    >
                      {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Zap size={20} />}
                      {txt.match_btn}
                    </button>

                    {outfitResult && (
                      <div className="glass p-8 rounded-3xl space-y-6 animate-slide-up">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-3xl font-bold">{outfitResult.score}%</h3>
                            <p className="text-gray-500 font-medium">{outfitResult.verdict}</p>
                          </div>
                          <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center font-bold ${outfitResult.score > 80 ? 'border-emerald-500 text-emerald-500' :
                            outfitResult.score > 50 ? 'border-amber-500 text-amber-500' : 'border-red-500 text-red-500'
                            }`}>
                            {outfitResult.score > 80 ? <CheckCircle2 size={32} /> : <Sparkles size={32} />}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <h4 className="font-bold text-sm uppercase text-gray-400 mb-1">Analysis</h4>
                            <p className="text-gray-700 leading-relaxed">{outfitResult.reasoning}</p>
                          </div>
                          <div className="space-y-2">
                            <h4 className="font-bold text-sm uppercase text-gray-400 mb-1">Style Tips</h4>
                            {outfitResult.styleTips.map((tip, i) => (
                              <div key={i} className="flex gap-3 items-start bg-white/50 p-3 rounded-xl border border-black/5">
                                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-black shrink-0"></div>
                                <p className="text-sm text-gray-600">{tip}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );

              case Screen.EVENT_STYLIST:
                return (
                  <div className="animate-fade-in max-w-2xl mx-auto space-y-8">
                    <h2 className="text-3xl font-bold tracking-tight">{txt.event_title}</h2>

                    <div className="glass p-8 rounded-3xl space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-500 uppercase tracking-wider ml-1">{txt.occasion_label}</label>
                        <div className="relative">
                          <select
                            value={eventType}
                            onChange={(e) => setEventType(e.target.value)}
                            className="w-full bg-white border border-black/10 rounded-2xl px-5 py-4 appearance-none font-medium focus:ring-2 focus:ring-black/5 outline-none transition-all"
                          >
                            <optgroup label={txt.wedding_special}>
                              <option value="Bride (Wedding Day)">{txt.bride}</option>
                              <option value="Groom (Wedding Day)">{txt.groom}</option>
                              <option value="Pre-Wedding Shoot">{txt.pre_wedding}</option>
                              <option value="Wedding Guest">Wedding Guest</option>
                            </optgroup>
                            <optgroup label={txt.seasons}>
                              <option value="Winter Wear">{txt.winter}</option>
                              <option value="Summer Casuals">{txt.summer}</option>
                              <option value="Rainy Day / Monsoon">{txt.monsoon}</option>
                            </optgroup>
                            <optgroup label={txt.occasions}>
                              <option value="Diwali Party">{txt.party}</option>
                              <option value="Formal Interview">{txt.formal}</option>
                              <option value="Travel / Vacation">{txt.vacation}</option>
                              <option value="Date Night">Date Night</option>
                              <option value="Gym / Workout">Gym / Workout</option>
                            </optgroup>
                          </select>
                          <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                        </div>
                      </div>

                      <button
                        onClick={handleEventSuggestion}
                        disabled={loading}
                        className="w-full bg-black text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-all shadow-xl"
                      >
                        {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Sparkles size={20} />}
                        {txt.event_btn} "{eventType}"
                      </button>
                    </div>

                    {eventResult && (
                      <div className="glass p-8 rounded-3xl animate-slide-up prose prose-sm max-w-none">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500">
                            <Calendar size={24} />
                          </div>
                          <h3 className="text-xl font-bold m-0">Stylist Recommendations</h3>
                        </div>
                        <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                          {eventResult}
                        </div>
                        <div className="mt-8 pt-6 border-t border-black/5 flex justify-between items-center">
                          <button className="flex items-center gap-2 text-gray-500 hover:text-black transition-colors font-medium">
                            <Share2 size={18} /> Share
                          </button>
                          <button className="flex items-center gap-2 text-gray-500 hover:text-black transition-colors font-medium">
                            <Save size={18} /> Save to Lookbook
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );

              case Screen.SKINCARE:
                return (
                  <div className="animate-fade-in max-w-2xl mx-auto space-y-8">
                    <h2 className="text-3xl font-bold tracking-tight">{txt.care_title}</h2>

                    <div className="glass p-8 rounded-3xl space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-500 uppercase tracking-wider ml-1">Your Skin Type</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {['Oily', 'Dry', 'Combination', 'Sensitive', 'Normal'].map((type) => (
                            <button
                              key={type}
                              onClick={() => setSkinTypeInput(type)}
                              className={`py-3 rounded-xl font-medium border transition-all ${skinTypeInput === type ? 'bg-black text-white border-black shadow-md' : 'bg-white text-gray-600 border-black/5 hover:border-black/20'
                                }`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={handleSkincare}
                        disabled={loading}
                        className="w-full bg-black text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-all shadow-xl"
                      >
                        {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Droplets size={20} />}
                        {txt.care_btn}
                      </button>
                    </div>

                    {skincareResult && (
                      <div className="space-y-6 animate-slide-up">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="glass p-6 rounded-3xl shadow-sm">
                            <h4 className="font-bold text-amber-600 mb-4 flex items-center gap-2">
                              <Sparkles size={18} /> Morning Routine
                            </h4>
                            <ul className="space-y-3">
                              {skincareResult.morning.map((step, i) => (
                                <li key={i} className="flex gap-3 items-start">
                                  <span className="w-5 h-5 rounded-full bg-amber-50 text-amber-600 text-[10px] flex items-center justify-center font-bold shrink-0 mt-0.5">{i + 1}</span>
                                  <span className="text-sm text-gray-600">{step}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="glass p-6 rounded-3xl shadow-sm">
                            <h4 className="font-bold text-indigo-600 mb-4 flex items-center gap-2">
                              <Calendar size={18} /> Evening Routine
                            </h4>
                            <ul className="space-y-3">
                              {skincareResult.evening.map((step, i) => (
                                <li key={i} className="flex gap-3 items-start">
                                  <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] flex items-center justify-center font-bold shrink-0 mt-0.5">{i + 1}</span>
                                  <span className="text-sm text-gray-600">{step}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        <div className="glass p-6 rounded-3xl shadow-sm">
                          <h4 className="font-bold mb-4">Recommended Product Types</h4>
                          <div className="flex flex-wrap gap-2">
                            {skincareResult.products.map((p, i) => (
                              <span key={i} className="px-4 py-2 bg-white border border-black/5 rounded-xl text-sm font-medium shadow-sm">
                                {p}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );

              case Screen.SHOP:
                return (
                  <div className="animate-fade-in space-y-8">
                    <div className="flex justify-between items-end">
                      <div>
                        <h2 className="text-3xl font-bold tracking-tight">{txt.shop_title}</h2>
                        <p className="text-gray-500">{txt.shop_desc}</p>
                      </div>
                      <div className="hidden md:flex items-center gap-2 glass px-4 py-2 rounded-2xl">
                        <Search size={18} className="text-gray-400" />
                        <input type="text" placeholder="Search styles..." className="bg-transparent outline-none text-sm w-32" />
                      </div>
                    </div>

                    <div className="space-y-10">
                      <section>
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="text-xl font-bold flex items-center gap-2">
                            <Star size={20} className="text-amber-500 fill-amber-500" />
                            {txt.top_picks}
                          </h3>
                          <button className="text-sm font-bold text-indigo-600">View All</button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {recommendedProducts.slice(0, 6).map((product) => (
                            <ProductCard key={product.id} product={product} language={language} />
                          ))}
                        </div>
                      </section>

                      <section className="bg-black rounded-[40px] p-8 md:p-12 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full"></div>
                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                          <div className="flex-1 space-y-4 text-center md:text-left">
                            <span className="px-4 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-widest">Exclusive Offer</span>
                            <h3 className="text-4xl font-bold tracking-tight">Upgrade Your Wardrobe</h3>
                            <p className="text-gray-400 max-w-md">Get personalized shopping lists and early access to trending collections tailored to your AI profile.</p>
                            <button className="bg-white text-black px-8 py-3 rounded-2xl font-bold hover:scale-105 transition-transform">
                              Join Premium
                            </button>
                          </div>
                          <div className="w-full md:w-1/3 aspect-square glass-dark rounded-3xl p-2 rotate-3">
                            <img
                              src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=600&q=80"
                              className="w-full h-full object-cover rounded-2xl"
                              alt="Premium"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        </div>
                      </section>

                      <section className="pb-10">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                          <Zap size={20} className="text-indigo-500" />
                          {txt.trending}
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {MOCK_PRODUCTS.slice(6, 10).map((product) => (
                            <div key={product.id} className="group cursor-pointer">
                              <div className="aspect-[3/4] rounded-2xl overflow-hidden mb-3 relative">
                                <img
                                  src={product.image}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                  alt={product.name}
                                  referrerPolicy="no-referrer"
                                />
                                <button className="absolute top-3 right-3 p-2 glass rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Heart size={16} />
                                </button>
                              </div>
                              <p className="text-xs font-bold text-gray-400 uppercase">{product.brand}</p>
                              <h4 className="font-medium text-sm truncate">{product.name}</h4>
                              <p className="font-bold text-sm">{product.currency} {product.price}</p>
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>
                  </div>
                );

              default:
                return null;
            }
          })()}
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Sidebar />

      <main className="md:ml-64 p-4 md:p-10 pb-24 md:pb-10">
        <div className="max-w-5xl mx-auto">
          {renderScreen()}
        </div>
      </main>

      <BottomNav />

      <ChatAssistant
        language={language}
        activeImage={activeImage}
      />
    </div>
  );
}

export default App;
