import { PriceTier, TenantWithUsage } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useState, useEffect } from "react";

interface PricePlansDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: TenantWithUsage;
}

export function PricePlansDialog({ isOpen, onOpenChange, tenant }: PricePlansDialogProps) {
  const [priceTiers, setPriceTiers] = useState<PriceTier[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPriceTiers = async () => {
      try {
        const { data, error } = await supabase
          .from("price_tiers")
          .select("*")
          .eq("is_active", true);
        
        if (error) {
          console.error("Error fetching price tiers:", error);
          toast({
            title: "錯誤",
            description: "無法載入訂閱計畫",
            variant: "destructive",
          });
        } else {
          // Sort price tiers by monthly price in ascending order
          const sortedPriceTiers = (data || []).sort((a, b) => 
            a.price_monthly - b.price_monthly
          );
          setPriceTiers(sortedPriceTiers);
        }
      } catch (error) {
        console.error("Error fetching price tiers:", error);
      }
    };
    if (isOpen) {
      fetchPriceTiers();
    }
  }, [isOpen, toast]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>訂閱計畫</DialogTitle>
          <DialogDescription>
            選擇最適合您教會需求的計畫。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {priceTiers.map((plan) => (
            <div 
              key={plan.id} 
              className={`border rounded-lg p-4 ${plan.name === tenant.price_tier?.name ? 'border-primary bg-primary/10' : ''}`}
            >
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-lg font-semibold">{plan.name}</h4>
                <p className="text-sm text-muted-foreground">${plan.price_monthly}/月</p>
              </div>
              <div className="space-y-2">
                <p>成員人數限制: {plan.user_limit}</p>
                <p>群組數量限制: {plan.group_limit}</p>
                <p>活動數量限制: {plan.event_limit}</p>
                {plan.description && (
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
} 