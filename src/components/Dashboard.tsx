import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Calendar } from "lucide-react";

interface DashboardProps {
  refreshTrigger: number;
}

export const Dashboard = ({ refreshTrigger }: DashboardProps) => {
  const [stats, setStats] = useState({
    totalThisMonth: 0,
    totalToday: 0,
    averageDaily: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const today = new Date().toISOString().split("T")[0];
        const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          .toISOString()
          .split("T")[0];

        // Get this month's expenses
        const { data: monthData } = await supabase
          .from("expenses")
          .select("amount")
          .gte("expense_date", firstDayOfMonth);

        // Get today's expenses
        const { data: todayData } = await supabase
          .from("expenses")
          .select("amount")
          .eq("expense_date", today);

        const monthTotal = monthData?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
        const todayTotal = todayData?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
        const daysInMonth = new Date().getDate();
        const avgDaily = monthTotal / daysInMonth;

        setStats({
          totalThisMonth: monthTotal,
          totalToday: todayTotal,
          averageDaily: avgDaily,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, [refreshTrigger]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="shadow-[var(--shadow-soft)] border-l-4 border-l-primary">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">This Month</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${stats.totalThisMonth.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground mt-1">Total expenses</p>
        </CardContent>
      </Card>

      <Card className="shadow-[var(--shadow-soft)] border-l-4 border-l-success">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Today</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${stats.totalToday.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground mt-1">Spent today</p>
        </CardContent>
      </Card>

      <Card className="shadow-[var(--shadow-soft)] border-l-4 border-l-accent">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${stats.averageDaily.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground mt-1">This month</p>
        </CardContent>
      </Card>
    </div>
  );
};
