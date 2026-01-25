import { FileText, CheckCircle, XCircle, Clock } from "lucide-react";

export function DecisionLogFeature() {
  const decisions = [
    {
      id: "DEC-1045",
      decision: "Approve transfer of $500 to savings account",
      outcome: "Approved",
      timestamp: "Jan 24, 2026 - 10:45 AM",
      confidence: 98,
      factors: ["Voice verified", "Within transaction limit", "Business hours"],
    },
    {
      id: "DEC-1044",
      decision: "Deny transaction exceeding daily limit",
      outcome: "Denied",
      timestamp: "Jan 24, 2026 - 9:30 AM",
      confidence: 100,
      factors: ["Exceeded $10,000 limit", "Requires manual approval"],
    },
    {
      id: "DEC-1043",
      decision: "Schedule payment for Invoice #4521",
      outcome: "Pending",
      timestamp: "Jan 23, 2026 - 4:15 PM",
      confidence: 95,
      factors: ["Verified invoice", "Sufficient funds", "Awaiting confirmation"],
    },
    {
      id: "DEC-1042",
      decision: "Update user preferences for notifications",
      outcome: "Approved",
      timestamp: "Jan 23, 2026 - 2:00 PM",
      confidence: 100,
      factors: ["User authenticated", "Valid request"],
    },
  ];

  const getOutcomeIcon = (outcome: string) => {
    switch (outcome) {
      case "Approved": return CheckCircle;
      case "Denied": return XCircle;
      case "Pending": return Clock;
      default: return FileText;
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-gray-700 font-serif italic">
        Review all decisions made by your voice agent with full transparency and reasoning.
      </p>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-xl border-2 border-black text-center">
          <div className="text-2xl font-serif text-black">28</div>
          <div className="font-serif text-gray-600">Approved</div>
        </div>
        <div className="bg-white p-4 rounded-xl border-2 border-black text-center">
          <div className="text-2xl font-serif text-black">3</div>
          <div className="font-serif text-gray-600">Denied</div>
        </div>
        <div className="bg-white p-4 rounded-xl border-2 border-gray-600 text-center">
          <div className="text-2xl font-serif text-black">2</div>
          <div className="font-serif text-gray-600">Pending</div>
        </div>
      </div>

      <div className="space-y-3">
        {decisions.map((decision, idx) => {
          const Icon = getOutcomeIcon(decision.outcome);
          
          return (
            <div key={idx} className="bg-white p-5 rounded-2xl border-2 border-black">
              <div className="flex items-start gap-4">
                <Icon className="w-6 h-6 text-black mt-1" />
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-serif text-black">{decision.decision}</h4>
                      <p className="font-serif text-gray-500 italic mt-1">{decision.id} • {decision.timestamp}</p>
                    </div>
                    <span className="px-3 py-1 font-serif text-black bg-gray-100 rounded-full border border-black">
                      {decision.outcome}
                    </span>
                  </div>
                  <div className="mb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-serif text-gray-600">Confidence:</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden border border-black">
                        <div 
                          className="h-full bg-black"
                          style={{ width: `${decision.confidence}%` }}
                        />
                      </div>
                      <span className="font-serif text-black">{decision.confidence}%</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {decision.factors.map((factor, fidx) => (
                      <span key={fidx} className="px-2 py-1 bg-gray-100 text-black font-serif rounded-full border border-black">
                        {factor}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
