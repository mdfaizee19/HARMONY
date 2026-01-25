import { ArrowUpRight, ArrowDownLeft } from "lucide-react";

export function TransactionsFeature() {
  const transactions = [
    {
      id: "#TXN-1234",
      type: "outgoing",
      description: "Payment to Vendor ABC",
      amount: 2500,
      date: "Jan 24, 2026",
      status: "Completed",
    },
    {
      id: "#TXN-1233",
      type: "incoming",
      description: "Client Payment Received",
      amount: 5000,
      date: "Jan 23, 2026",
      status: "Completed",
    },
    {
      id: "#TXN-1232",
      type: "outgoing",
      description: "Subscription Renewal",
      amount: 299,
      date: "Jan 22, 2026",
      status: "Completed",
    },
    {
      id: "#TXN-1231",
      type: "incoming",
      description: "Refund Processed",
      amount: 150,
      date: "Jan 21, 2026",
      status: "Pending",
    },
  ];

  const totalIncoming = transactions
    .filter(t => t.type === "incoming")
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalOutgoing = transactions
    .filter(t => t.type === "outgoing")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      <p className="text-gray-700 font-serif italic">
        Track and manage all financial transactions processed through your voice agent.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border-2 border-black">
          <ArrowDownLeft className="w-8 h-8 text-black mb-3" />
          <div className="text-2xl font-serif text-black">${totalIncoming.toLocaleString()}</div>
          <div className="font-serif text-gray-600">Total Incoming</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border-2 border-black">
          <ArrowUpRight className="w-8 h-8 text-black mb-3" />
          <div className="text-2xl font-serif text-black">${totalOutgoing.toLocaleString()}</div>
          <div className="font-serif text-gray-600">Total Outgoing</div>
        </div>
      </div>

      <div className="space-y-3">
        {transactions.map((transaction, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border-2 border-black hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 border-black ${
                  transaction.type === "incoming" ? "bg-white" : "bg-black"
                }`}>
                  {transaction.type === "incoming" ? (
                    <ArrowDownLeft className="w-5 h-5 text-black" />
                  ) : (
                    <ArrowUpRight className="w-5 h-5 text-white" />
                  )}
                </div>
                <div>
                  <h4 className="font-serif text-black">{transaction.description}</h4>
                  <p className="font-serif text-gray-600">{transaction.id} • {transaction.date}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-serif text-black">
                  {transaction.type === "incoming" ? "+" : "-"}${transaction.amount.toLocaleString()}
                </div>
                <span className={`font-serif px-2 py-1 rounded-full border ${
                  transaction.status === "Completed" 
                    ? "bg-black text-white border-black" 
                    : "bg-white text-black border-black"
                }`}>
                  {transaction.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
