import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Crown, Check, Sparkles, Zap, BookOpen, Trophy, Shield, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";
import type { PurchasesPackage } from "@revenuecat/purchases-capacitor";

const PRO_FEATURES = [
  { icon: BookOpen, title: "Investment Lab", description: "Full access to advanced investment scenarios" },
  { icon: Trophy, title: "Premium Certificates", description: "Shareable LinkedIn-ready credentials" },
  { icon: Zap, title: "Unlimited Trainer", description: "No daily limits on scenario practice" },
  { icon: Shield, title: "Priority Support", description: "Get help when you need it most" },
  { icon: Sparkles, title: "Early Access", description: "New markets & features before anyone else" },
];

export default function Subscription() {
  const navigate = useNavigate();
  const { 
    isProUser, 
    isLoading, 
    offerings, 
    purchasePackage, 
    restorePurchases,
    getExpirationDate,
    willRenew,
    toggleProForTesting,
    isNative 
  } = useSubscription();
  
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('monthly');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const handlePurchase = async () => {
    const pkg = selectedPlan === 'monthly' ? offerings?.monthly : offerings?.annual;
    
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

  const expirationDate = getExpirationDate();
  const renewStatus = willRenew();

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
              <p className="text-foreground/80">
                Thank you for supporting MarketLingo! You have full access to all Pro features.
              </p>
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

            {/* Pricing Cards */}
            <div className="grid grid-cols-2 gap-3">
              {/* Monthly */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card 
                  className={`p-4 cursor-pointer transition-all ${
                    selectedPlan === 'monthly' 
                      ? 'border-primary ring-2 ring-primary/20' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedPlan('monthly')}
                >
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">Monthly</p>
                    <p className="text-2xl font-bold">
                      {offerings?.monthly?.product.priceString || '$9.99'}
                    </p>
                    <p className="text-xs text-muted-foreground">/month</p>
                  </div>
                </Card>
              </motion.div>

              {/* Annual */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                className="relative"
              >
                <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 bg-green-500 text-white text-xs">
                  Save 33%
                </Badge>
                <Card 
                  className={`p-4 cursor-pointer transition-all ${
                    selectedPlan === 'annual' 
                      ? 'border-primary ring-2 ring-primary/20' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedPlan('annual')}
                >
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">Annual</p>
                    <p className="text-2xl font-bold">
                      {offerings?.annual?.product.priceString || '$79.99'}
                    </p>
                    <p className="text-xs text-muted-foreground">/year</p>
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
          Subscription automatically renews unless cancelled at least 24 hours before the end of the current period. 
          Manage subscriptions in your Apple ID settings.
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
