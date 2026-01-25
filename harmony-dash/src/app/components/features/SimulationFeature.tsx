import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Calendar } from "lucide-react";

export function SimulationFeature() {
  const forecastData = [
    { month: "Jan", interactions: 1200, projected: 1250 },
    { month: "Feb", interactions: 1400, projected: 1500 },
    { month: "Mar", interactions: 1600, projected: 1800 },
    { month: "Apr", interactions: 1800, projected: 2100 },
    { month: "May", interactions: 2000, projected: 2400 },
    { month: "Jun", interactions: 2200, projected: 2700 },
  ];

  return (
    <div className="space-y-6">
      <p className="text-gray-700 font-serif italic">
        Run simulations and view forecasted performance metrics for your voice agent.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border-2 border-black">
          <TrendingUp className="w-8 h-8 text-black mb-3" />
          <div className="text-2xl font-serif text-black">+38%</div>
          <div className="font-serif text-gray-600">Projected Growth</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border-2 border-black">
          <Calendar className="w-8 h-8 text-black mb-3" />
          <div className="text-2xl font-serif text-black">6 Months</div>
          <div className="font-serif text-gray-600">Forecast Period</div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border-2 border-black">
        <h3 className="font-serif text-black mb-4">Interaction Forecast</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={forecastData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#000000" style={{ fontFamily: 'Playfair Display, serif' }} />
            <YAxis stroke="#000000" style={{ fontFamily: 'Playfair Display, serif' }} />
            <Tooltip contentStyle={{ fontFamily: 'Playfair Display, serif' }} />
            <Line type="monotone" dataKey="interactions" stroke="#000000" strokeWidth={2} name="Actual" />
            <Line type="monotone" dataKey="projected" stroke="#666666" strokeWidth={2} strokeDasharray="5 5" name="Projected" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-gray-100 p-5 rounded-2xl border border-black">
        <h4 className="font-serif text-black mb-2">Simulation Insights</h4>
        <ul className="space-y-2 font-serif text-gray-800">
          <li className="flex items-start gap-2">
            <span className="text-black mt-1">•</span>
            Expected 38% increase in user interactions over next 6 months
          </li>
          <li className="flex items-start gap-2">
            <span className="text-black mt-1">•</span>
            Peak usage predicted during business hours (9 AM - 5 PM)
          </li>
          <li className="flex items-start gap-2">
            <span className="text-black mt-1">•</span>
            Transaction volume expected to stabilize at 2,500/month by Q3
          </li>
        </ul>
      </div>
    </div>
  );
}
