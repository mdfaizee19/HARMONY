import { AlertTriangle, Shield, AlertCircle, CheckCircle } from "lucide-react";

export function RiskAlertsFeature() {
  const alerts = [
    {
      severity: "high",
      title: "Unusual Transaction Pattern Detected",
      description: "Multiple high-value transactions in short timeframe",
      timestamp: "2 hours ago",
      status: "Active",
    },
    {
      severity: "medium",
      title: "Low Confidence Score",
      description: "Voice recognition confidence below threshold (78%)",
      timestamp: "5 hours ago",
      status: "Under Review",
    },
    {
      severity: "low",
      title: "System Update Available",
      description: "New security patch available for voice agent",
      timestamp: "1 day ago",
      status: "Pending",
    },
    {
      severity: "resolved",
      title: "Authentication Issue Resolved",
      description: "Biometric verification system back online",
      timestamp: "2 days ago",
      status: "Resolved",
    },
  ];

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "high": return AlertTriangle;
      case "medium": return AlertCircle;
      case "low": return Shield;
      case "resolved": return CheckCircle;
      default: return AlertCircle;
    }
  };

  const getSeverityBorder = (severity: string) => {
    switch (severity) {
      case "high": return "border-black";
      case "medium": return "border-gray-600";
      case "low": return "border-gray-400";
      case "resolved": return "border-gray-300";
      default: return "border-gray-400";
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-gray-700 font-serif italic">
        Monitor and respond to security risks and system alerts in real-time.
      </p>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-xl border-2 border-black text-center">
          <div className="text-2xl font-serif text-black">1</div>
          <div className="font-serif text-gray-600">High Risk</div>
        </div>
        <div className="bg-white p-4 rounded-xl border-2 border-gray-600 text-center">
          <div className="text-2xl font-serif text-black">1</div>
          <div className="font-serif text-gray-600">Medium Risk</div>
        </div>
        <div className="bg-white p-4 rounded-xl border-2 border-gray-400 text-center">
          <div className="text-2xl font-serif text-black">1</div>
          <div className="font-serif text-gray-600">Low Risk</div>
        </div>
      </div>

      <div className="space-y-3">
        {alerts.map((alert, idx) => {
          const Icon = getSeverityIcon(alert.severity);
          const borderClass = getSeverityBorder(alert.severity);
          
          return (
            <div key={idx} className={`bg-white p-5 rounded-2xl border-2 ${borderClass}`}>
              <div className="flex items-start gap-4">
                <Icon className="w-6 h-6 text-black mt-1" />
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="font-serif text-black">{alert.title}</h4>
                    <span className="px-2 py-1 font-serif bg-gray-100 text-black rounded-full border border-black">
                      {alert.status}
                    </span>
                  </div>
                  <p className="font-serif text-gray-600 mb-2">{alert.description}</p>
                  <p className="font-serif text-gray-500 italic">{alert.timestamp}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
