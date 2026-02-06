import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Crown, Check, Sparkles, Zap, BookOpen, Trophy, Shield, Loader2, Infinity, Brain, Settings, Gift, Clock, TrendingUp, Target, Star, Rocket } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSubscription, TRIAL_DURATION_DAYS } from "@/hooks/useSubscription";
import { toast } from "sonner";

const PRO_FEATURES = [
  { 
    icon: Infinity, 
    title: "Unlimited Learning", 
    description: "No daily caps on lessons, games & drills",
    highlight: "Most Popular"
  },
  { 
    icon: TrendingUp, 
    title: "Investment Lab", 
    description: "Expert scenarios, portfolio simulations, and real valuation models",
    highlight: "Pro Exclusive"
  },
  { 
    icon: Brain, 
    title: "AI Mentors On-Demand", 
    description: "Unlimited conversations with industry-specific AI mentors",
    highlight: null
  },
  { 
    icon: Target, 
    title: "Advanced Trainer", 
    description: "Pro Reasoning, Mental Models & Common Mistakes analysis",
    highlight: null
  },
  { 
    icon: Trophy, 
    title: "LinkedIn Certificates", 
    description: "Shareable credentials that prove your industry expertise",
    highlight: null
  },
  { 
    icon: Rocket, 
    title: "Priority Content", 
    description: "First access to new industries and premium insights",
    highlight: null
  },
];

const TESTIMONIALS = [
  {
    quote: "Finally understood aerospace supply chains after years of confusion. Worth every penny.",
    author: "Sarah K., VC Associate",
    avatar: "👩‍💼"
  },
  {
    quote: "The Investment Lab scenarios are exactly what I needed before my LP meetings.",
    author: "Marcus T., Fund Manager",
    avatar: "👨‍💼"
  },
  {
    quote: "Went from zero to pitching aerospace founders confidently in 3 months.",
    author: "Diana L., Angel Investor",
    avatar: "👩‍🚀"
  }
];

type PlanType = 'monthly' | 'annual';

export default function Subscription() {
  const navigate = useNavigate();
  const { 
    isProUser, 
    isLoading, 
    purchasePackage,
    getPackage,
    restorePurchases,
    getExpirationDate,
    willRenew,
    toggleProForTesting,
    isNative,
    trialStatus,
    canStartTrial,
    startFreeTrial,
    planType,
  } = useSubscription();
  
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('annual');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showTestimonials, setShowTestimonials] = useState(false);

  const handleStartTrial = () => {
    const success = startFreeTrial();
    if (success) {
      toast.success("🎉 Your 7-day Pro trial has started!", {
        description: "Explore all Pro features - no credit card required"
      });
      navigate(-1);
    } else {
      toast.error("Trial not available");
    }
  };

  const handlePurchase = async () => {
    const pkg = getPackage(selectedPlan);
    
    if (!pkg) {
      if (!isNative) {
        toggleProForTesting();
        toast.success("Pro activated for testing!");
        return;
      }
      toast.error("Subscription packages not available");
      return;
    }

    setIsPurchasing(true);
    const result = await purchasePackage(pkg);
    setIsPurchasing(false);

    if (result.success) {
      toast.success("Welcome to MarketLingo Pro! 🎉");
      navigate(-1);
    } else if (!result.cancelled) {
      toast.error(result.error || "Purchase failed. Please try again.");
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    const result = await restorePurchases();
    setIsRestoring(false);

    if (result.success) {
      if (result.restored) {
        toast.success("Subscription restored successfully!");
      } else {
        toast.info("No active subscription found");
      }
    } else {
      toast.error(result.error || "Restore failed");
    }
  };

  const handleManageSubscription = () => {
    if (isNative) {
      window.open('https://apps.apple.com/account/subscriptions', '_blank');
    }
  };

  const expirationDate = getExpirationDate();
  const renewStatus = willRenew();

  const getPriceDisplay = (type: PlanType) => {
    const pkg = getPackage(type);
    if (pkg?.product?.priceString) return pkg.product.priceString;
    switch (type) {
      case 'monthly': return '$9.99';
      case 'annual': return '$79.99';
    }
  };

  const getMonthlyEquivalent = () => {
    const pkg = getPackage('annual');
    if (pkg?.product?.price) {
      const monthlyPrice = pkg.product.price / 12;
      return `$${monthlyPrice.toFixed(2)}`;
    }
    return '$6.67';
  };

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      {/* Header */}
      <div 
        className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="flex items-center gap-4 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              MarketLingo Pro
              <Crown className="w-5 h-5 text-amber-400" />
            </h1>
            <p className="text-sm text-muted-foreground">Become investment-ready</p>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-6 max-w-lg mx-auto w-full"
        style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom, 24px))' }}
      >
        {/* Already Pro / In Trial */}
        {isProUser && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className={`p-6 ${planType === 'trial' 
              ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30' 
              : 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-500/30'}`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  planType === 'trial' 
                    ? 'bg-gradient-to-br from-purple-400 to-pink-500' 
                    : 'bg-gradient-to-br from-amber-400 to-orange-500'
                }`}>
                  {planType === 'trial' ? <Gift className="w-6 h-6 text-white" /> : <Crown className="w-6 h-6 text-white" />}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-amber-400">
                    {planType === 'trial' ? `Trial: ${trialStatus.daysRemaining} days left` : "You're a Pro!"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {expirationDate 
                      ? `${planType === 'trial' ? 'Ends' : (renewStatus ? 'Renews' : 'Expires')} ${expirationDate.toLocaleDateString()}`
                      : 'Full access activated'
                    }
                  </p>
                </div>
              </div>
              
              {planType === 'trial' && (
                <div className="space-y-3">
                  <p className="text-foreground/80">
                    Enjoying Pro features? Subscribe now to keep access after your trial ends.
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500"
                      onClick={handlePurchase}
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      Subscribe - {getPriceDisplay('annual')}/year
                    </Button>
                  </div>
                </div>
              )}
              
              {planType !== 'trial' && (
                <>
                  <p className="text-foreground/80 mb-4">
                    Thank you for supporting MarketLingo! You have full access to all Pro features.
                  </p>
                  {isNative && expirationDate && (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={handleManageSubscription}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Manage Subscription
                    </Button>
                  )}
                </>
              )}
            </Card>
          </motion.div>
        )}

        {/* Not Pro - Show Upgrade Options */}
        {!isProUser && (
          <>
            {/* Hero Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-4"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/30">
                <Crown className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Become Investment-Ready</h2>
              <p className="text-muted-foreground">
                Master industries like a VC in 6 months
              </p>
            </motion.div>

            {/* Trial CTA - Most Prominent */}
            {canStartTrial && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="p-5 bg-gradient-to-br from-purple-500/20 via-pink-500/10 to-orange-500/20 border-purple-500/40 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-400/20 to-transparent rounded-full blur-2xl" />
                  
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-3">
                      <Gift className="w-5 h-5 text-purple-400" />
                      <span className="text-sm font-medium text-purple-400">Limited Time</span>
                    </div>
                    
                    <h3 className="text-xl font-bold mb-2">Try Pro Free for {TRIAL_DURATION_DAYS} Days</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Full access to all Pro features. No credit card required. Cancel anytime.
                    </p>
                    
                    <Button 
                      className="w-full h-12 text-base font-semibold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg"
                      onClick={handleStartTrial}
                    >
                      <Sparkles className="w-5 h-5 mr-2" />
                      Start Free Trial
                    </Button>
                    
                    <p className="text-xs text-center text-muted-foreground mt-3">
                      Then {getPriceDisplay('annual')}/year or {getPriceDisplay('monthly')}/month
                    </p>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Divider */}
            {canStartTrial && (
              <div className="flex items-center gap-4 py-2">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">or subscribe now</span>
                <div className="flex-1 h-px bg-border" />
              </div>
            )}

            {/* Pricing Cards */}
            <div className="space-y-3">
              {/* Annual - Best Value */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                className="relative"
              >
                <Badge className="absolute -top-2 left-4 z-10 bg-green-500 text-white text-xs px-2 py-0.5">
                  Save 33% - Best Value
                </Badge>
                <Card 
                  className={`p-4 cursor-pointer transition-all ${
                    selectedPlan === 'annual' 
                      ? 'border-primary ring-2 ring-primary/20 bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedPlan('annual')}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-lg">Yearly</p>
                      <p className="text-sm text-muted-foreground">
                        {getMonthlyEquivalent()}/month, billed annually
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{getPriceDisplay('annual')}</p>
                      <p className="text-xs text-muted-foreground">/year</p>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Monthly */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card 
                  className={`p-4 cursor-pointer transition-all ${
                    selectedPlan === 'monthly' 
                      ? 'border-primary ring-2 ring-primary/20 bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedPlan('monthly')}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-lg">Monthly</p>
                      <p className="text-sm text-muted-foreground">Flexible, cancel anytime</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{getPriceDisplay('monthly')}</p>
                      <p className="text-xs text-muted-foreground">/month</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>

            {/* Subscribe Button */}
            <Button 
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-orange-500/30"
              onClick={handlePurchase}
              disabled={isPurchasing}
            >
              {isPurchasing ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Crown className="w-5 h-5 mr-2" />
              )}
              {isPurchasing ? 'Processing...' : `Subscribe - ${getPriceDisplay(selectedPlan)}${selectedPlan === 'monthly' ? '/mo' : '/yr'}`}
            </Button>

            {/* Restore */}
            <Button 
              variant="ghost" 
              className="w-full text-muted-foreground"
              onClick={handleRestore}
              disabled={isRestoring}
            >
              {isRestoring && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Restore Purchases
            </Button>
          </>
        )}

        {/* Features List */}
        <div className="space-y-3 pt-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            What's Included in Pro
          </h3>
          
          {PRO_FEATURES.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + index * 0.05 }}
            >
              <Card className="p-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-medium">{feature.title}</h4>
                    {feature.highlight && (
                      <Badge variant="secondary" className="text-xs">{feature.highlight}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="space-y-3 pt-4">
          <button 
            onClick={() => setShowTestimonials(!showTestimonials)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Star className="w-4 h-4 text-amber-400" />
            What Pro members say
            <motion.span
              animate={{ rotate: showTestimonials ? 180 : 0 }}
              className="ml-1"
            >
              ▼
            </motion.span>
          </button>
          
          <AnimatePresence>
            {showTestimonials && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-3 overflow-hidden"
              >
                {TESTIMONIALS.map((testimonial, index) => (
                  <Card key={index} className="p-4 bg-bg-2/50">
                    <p className="text-sm italic mb-2">"{testimonial.quote}"</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{testimonial.avatar}</span>
                      <span>{testimonial.author}</span>
                    </div>
                  </Card>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Legal */}
        <p className="text-xs text-center text-muted-foreground px-4 pt-4">
          Subscription automatically renews unless cancelled at least 24 hours before the end of the current period. Manage subscriptions in your Apple ID settings.
        </p>

        {/* Web Testing Toggle */}
        {!isNative && (
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-center text-muted-foreground mb-2">
              ⚠️ Web Preview Mode
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={toggleProForTesting}
            >
              Toggle Pro Status (Testing)
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
