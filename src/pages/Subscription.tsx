import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Crown, Check, Sparkles, Zap, BookOpen, Trophy, Shield, Loader2, Infinity, Brain, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";

const PRO_FEATURES = [
  { icon: Infinity, title: "Unlimited Access", description: "No daily limits on lessons, games & drills" },
  { icon: BookOpen, title: "Investment Lab", description: "Expert-level scenarios & certification" },
  { icon: Brain, title: "AI Mentor", description: "Unlimited conversations with mentors" },
  { icon: Sparkles, title: "Premium Content", description: "Priority content & exclusive insights" },
  { icon: Trophy, title: "Pro Certificates", description: "Shareable LinkedIn-ready credentials" },
  { icon: Shield, title: "Priority Support", description: "Get help when you need it most" },
];

type PlanType = 'monthly' | 'annual';

export default function Subscription() {
  const navigate = useNavigate();
  const { 
    isProUser, 
    isLoading, 
    offerings, 
    purchasePackage,
    getPackage,
    restorePurchases,
    getExpirationDate,
    willRenew,
    toggleProForTesting,
    isNative 
  } = useSubscription();
  
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('annual');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // Get packages
  const monthlyPkg = getPackage('monthly');
  const annualPkg = getPackage('annual');

  const handlePurchase = async () => {
    const pkg = getPackage(selectedPlan);
    
    if (!pkg) {
      // Web fallback or no package available
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
    // Open subscription management in App Store
    if (isNative) {
      window.open('https://apps.apple.com/account/subscriptions', '_blank');
    }
  };

  const expirationDate = getExpirationDate();
  const renewStatus = willRenew();

  // Helper to get price display
  const getPriceDisplay = (type: PlanType) => {
    const pkg = getPackage(type);
    if (pkg?.product?.priceString) return pkg.product.priceString;
    
    // Fallback prices
    switch (type) {
      case 'monthly': return '$9.99';
      case 'annual': return '$79.99';
    }
  };

  // Calculate monthly equivalent for annual
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-safe">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-4 p-4 pt-safe">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">MarketLingo Pro</h1>
            <p className="text-sm text-muted-foreground">Unlock your full potential</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6 max-w-lg mx-auto">
        {/* Already Pro */}
        {isProUser && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-6 bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-500/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-amber-400">You're a Pro!</h2>
                  <p className="text-sm text-muted-foreground">
                    {expirationDate 
                      ? `${renewStatus ? 'Renews' : 'Expires'} ${expirationDate.toLocaleDateString()}`
                      : 'Lifetime access'
                    }
                  </p>
                </div>
              </div>
              <p className="text-foreground/80 mb-4">
                Thank you for supporting MarketLingo! You have full access to all Pro features.
              </p>
              
              {/* Manage Subscription Button */}
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
            </Card>
          </motion.div>
        )}

        {/* Hero Section */}
        {!isProUser && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-6"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/30">
                <Crown className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Become Investment-Ready</h2>
              <p className="text-muted-foreground">
                Master industries like a professional with advanced training
              </p>
            </motion.div>

            {/* Pricing Cards - 3 Options */}
            <div className="space-y-3">
              {/* Annual - Best Value */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="relative"
              >
                <Badge className="absolute -top-2 left-4 z-10 bg-green-500 text-white text-xs px-2 py-0.5">
                  Most Popular - Save 33%
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
                transition={{ delay: 0.15 }}
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
              {isPurchasing ? 'Processing...' : 'Subscribe Now'}
            </Button>

            {/* Restore */}
            <Button 
              variant="ghost" 
              className="w-full text-muted-foreground"
              onClick={handleRestore}
              disabled={isRestoring}
            >
              {isRestoring ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Restore Purchases
            </Button>
          </>
        )}

        {/* Features List */}
        <div className="space-y-3 pt-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            Pro Features
          </h3>
          
          {PRO_FEATURES.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.05 }}
            >
              <Card className="p-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{feature.title}</h4>
                    <Check className="w-4 h-4 text-green-500" />
                  </div>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </Card>
            </motion.div>
          ))}
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
