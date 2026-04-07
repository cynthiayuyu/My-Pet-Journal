import React, { useMemo } from 'react';
import { HealthRecord, InventoryItem, InsurancePolicy, PrepaidService, PetShop } from '../types';
import { Bell, TrendingUp, DollarSign, Calendar, AlertCircle, Syringe, Package, Shield, PiggyBank } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatDate } from '../utils';

interface DashboardSectionProps {
  healthRecords: HealthRecord[];
  inventoryItems: InventoryItem[];
  insurancePolicies: InsurancePolicy[];
  prepaidServices: PrepaidService[];
  shops: PetShop[];
}

export const DashboardSection: React.FC<DashboardSectionProps> = ({ healthRecords, inventoryItems, insurancePolicies, prepaidServices, shops }) => {
  
  // Calculate Reminders (Next 30 days)
  const reminders = useMemo(() => {
    const now = new Date().getTime();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const items: { id: string; title: string; date: string; type: string; icon: any; color: string }[] = [];

    healthRecords.forEach(r => {
      if (r.nextDueDate) {
        const timeDiff = new Date(r.nextDueDate).getTime() - now;
        if (timeDiff > 0 && timeDiff < thirtyDays) {
           items.push({ id: `h-${r.id}`, title: `${r.title}`, date: r.nextDueDate, type: 'Health', icon: Syringe, color: 'text-blue-500' });
        }
      }
    });

    inventoryItems.forEach(i => {
      const timeDiff = new Date(i.expiryDate).getTime() - now;
      if (timeDiff > 0 && timeDiff < thirtyDays) {
        items.push({ id: `i-${i.id}`, title: `${i.name}`, date: i.expiryDate, type: 'Food', icon: Package, color: 'text-orange-500' });
      }
    });

    insurancePolicies.forEach(p => {
      const timeDiff = new Date(p.expiryDate).getTime() - now;
      if (timeDiff > 0 && timeDiff < thirtyDays) {
        items.push({ id: `ins-${p.id}`, title: `${p.name}`, date: p.expiryDate, type: 'Insurance', icon: Shield, color: 'text-indigo-500' });
      }
    });

    prepaidServices.forEach(s => {
      if (s.expiryDate) {
        const timeDiff = new Date(s.expiryDate).getTime() - now;
        if (timeDiff > 0 && timeDiff < thirtyDays) {
          items.push({ id: `prep-${s.id}`, title: `${s.name}`, date: s.expiryDate, type: 'Service', icon: PiggyBank, color: 'text-emerald-500' });
        }
      }
    });

    return items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [healthRecords, inventoryItems, insurancePolicies, prepaidServices]);

  // Calculate Expenses (Group by Month)
  const expenseData = useMemo(() => {
    const expensesByMonth: Record<string, number> = {};

    healthRecords.forEach(r => {
      if (r.cost) {
        const month = r.date.substring(0, 7); // YYYY-MM
        expensesByMonth[month] = (expensesByMonth[month] || 0) + r.cost;
      }
    });

    shops.forEach(s => {
      s.visits.forEach(v => {
        if (v.cost) {
          const month = v.date.substring(0, 7);
          expensesByMonth[month] = (expensesByMonth[month] || 0) + v.cost;
        }
      });
    });

    // Convert to array and sort
    const sortedMonths = Object.keys(expensesByMonth).sort();
    // Get last 6 months
    const recentMonths = sortedMonths.slice(-6);

    return recentMonths.map(month => {
      const [y, m] = month.split('-');
      const date = new Date(Number(y), Number(m) - 1);
      return {
        month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        amount: expensesByMonth[month]
      };
    });
  }, [healthRecords, shops]);

  const totalRecentExpense = expenseData.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Reminders Section */}
      <div className="card-warm rounded-[2rem] p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500">
            <Bell size={20} />
          </div>
          <div>
            <h3 className="text-xl font-fangsong text-ink">提醒中心</h3>
            <p className="text-xs text-pencil font-sans">Upcoming in 30 days</p>
          </div>
        </div>

        {reminders.length === 0 ? (
          <div className="text-center py-6 bg-sand/10 rounded-xl border border-dashed border-sand">
            <p className="text-sm font-fangsong text-pencil">All caught up!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reminders.map(item => (
              <div key={item.id} className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-sand/30">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-sand/10 ${item.color}`}>
                  <item.icon size={16} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-fangsong text-ink font-medium">{item.title}</div>
                  <div className="text-[10px] uppercase tracking-widest text-pencil font-sans mt-0.5">{item.type}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-fangsong text-red-500 font-medium">{formatDate(item.date)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Expenses Section */}
      <div className="card-warm rounded-[2rem] p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
              <DollarSign size={20} />
            </div>
            <div>
              <h3 className="text-xl font-fangsong text-ink">花費統計</h3>
              <p className="text-xs text-pencil font-sans">Recent 6 months</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-widest text-pencil font-sans">Total</div>
            <div className="text-xl font-fangsong text-ink font-bold">${totalRecentExpense.toLocaleString()}</div>
          </div>
        </div>

        {expenseData.length === 0 ? (
          <div className="text-center py-6 bg-sand/10 rounded-xl border border-dashed border-sand">
            <p className="text-sm font-fangsong text-pencil">No expenses recorded yet.</p>
          </div>
        ) : (
          <div className="h-48 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expenseData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E6E2D8" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#8C8680', fontFamily: 'DM Sans' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#8C8680', fontFamily: 'DM Sans' }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(230, 226, 216, 0.4)' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -2px rgba(62, 58, 54, 0.1)', fontFamily: 'DM Sans', fontSize: '12px' }}
                  itemStyle={{ color: '#3E3A36', fontWeight: 'bold' }}
                />
                <Bar dataKey="amount" fill="#C79A78" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

    </div>
  );
};
