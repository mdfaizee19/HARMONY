import { Activity, TrendingUp, Users, Clock, DollarSign } from "lucide-react";
import { useEffect, useState } from "react";
import { doc, onSnapshot, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

export function OverviewFeature() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;

    const unsub = onSnapshot(doc(db, "users", user.uid), (doc) => {
      if (doc.exists()) {
        setBalance(doc.data().balance);
      }
    });

    return () => unsub();
  }, [user]);

  const handleAddFunds = async () => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      balance: increment(500)
    });
  };

  const stats = [
    {
      label: "Account Balance",
      value: balance !== null ? `$${balance.toLocaleString()}` : "Loading...",
      icon: DollarSign,
      trend: "+500 (Demo)"
    },
    { label: "Total Interactions", value: "1,247", icon: Users, trend: "+23%" },
    { label: "Avg Response Time", value: "1.2s", icon: Clock, trend: "-5%" },
    { label: "Success Rate", value: "94%", icon: TrendingUp, trend: "+2%" },
  ];

  return (
    <div className="space-y-6">
      <p className="text-gray-700 font-serif italic">
        Get a comprehensive view of your voice agent's performance and activity metrics.
      </p>

      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border-2 border-black relative group">
            <div className="flex items-start justify-between mb-3">
              <stat.icon className="w-8 h-8 text-black" />
              <button
                onClick={stat.label === "Account Balance" ? handleAddFunds : undefined}
                className={`font-serif text-sm ${stat.amountAction ? 'cursor-pointer hover:underline' : ''} ${stat.trend.startsWith('+') ? 'text-black' : 'text-gray-600'}`}
              >
                {stat.trend}
              </button>
            </div>
            <div className="text-3xl font-serif text-black mb-1">{stat.value}</div>
            <div className="text-sm text-gray-600 font-serif">{stat.label}</div>

            {stat.label === "Account Balance" && (
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.stopPropagation(); handleAddFunds(); }}
                  className="bg-black text-white text-xs px-2 py-1 rounded-full"
                >
                  + Add Funds
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-gray-100 p-6 rounded-2xl border border-black">
        <h3 className="font-serif text-black mb-3">Recent Activity</h3>
        <div className="space-y-3">
          {[
            "User completed transaction #1234",
            "System alert resolved: Low confidence threshold",
            "New commitment scheduled for Jan 28",
            "Decision logged: Approve transfer $500",
          ].map((activity, idx) => (
            <div key={idx} className="flex items-center gap-3 font-serif text-gray-800">
              <div className="w-2 h-2 bg-black rounded-full"></div>
              {activity}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
