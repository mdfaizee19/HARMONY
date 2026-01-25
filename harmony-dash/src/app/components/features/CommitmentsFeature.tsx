import { Calendar, Clock, Plus, Trash2, X, Save, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy
} from "firebase/firestore";
import { format, parseISO } from "date-fns";

interface Commitment {
  id: string;
  title: string;
  amount: number;
  dueDate: string; // ISO string for simple storage/sorting
  urgencyLevel: "low" | "medium" | "high";
  recurrence: "one-time" | "monthly" | "custom";
  notes?: string;
  createdAt?: any;
}

export function CommitmentsFeature() {
  const { user } = useAuth();
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [newTitle, setNewTitle] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newUrgency, setNewUrgency] = useState<"low" | "medium" | "high">("medium");
  const [newRecurrence, setNewRecurrence] = useState<"one-time" | "monthly" | "custom">("one-time");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Order by Due Date ascending (soonest first)
    const q = query(
      collection(db, "users", user.uid, "commitments"),
      orderBy("dueDate", "asc")
    );

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const fetched = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Commitment[];
        setCommitments(fetched);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching commitments:", err);
        setError("Failed to load commitments.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleAddCommitment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, "users", user.uid, "commitments"), {
        title: newTitle,
        amount: parseFloat(newAmount),
        dueDate: newDate,
        urgencyLevel: newUrgency,
        recurrence: newRecurrence,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Reset form
      setNewTitle("");
      setNewAmount("");
      setNewDate("");
      setNewRecurrence("one-time");
      setIsAdding(false);
    } catch (err) {
      console.error("Error adding commitment:", err);
      setError("Failed to save commitment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "commitments", id));
    } catch (err) {
      console.error("Error deleting commitment:", err);
      setError("Failed to delete commitment.");
    }
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <p className="text-gray-700 font-serif italic text-sm">
          Manage your financial commitments and future obligations.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-sm font-serif border border-red-200 rounded-lg">
          {error}
        </div>
      )}

      {!isAdding && (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full bg-black text-white py-3 px-6 rounded-xl font-serif flex items-center justify-center gap-2 hover:bg-gray-800 transition-all border-2 border-black"
        >
          <Plus className="w-5 h-5" />
          Add New Commitment
        </button>
      )}

      {isAdding && (
        <form onSubmit={handleAddCommitment} className="bg-gray-50 p-5 rounded-2xl border-2 border-dashed border-gray-400 animate-in fade-in slide-in-from-top-4">
          <h4 className="font-serif text-black mb-3 font-semibold">New Commitment</h4>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Title (e.g. Credit Card Bill)"
              className="w-full p-2 border border-gray-300 rounded-lg font-serif text-sm focus:outline-none focus:border-black"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                placeholder="Amount ($)"
                className="w-full p-2 border border-gray-300 rounded-lg font-serif text-sm focus:outline-none focus:border-black"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                required
              />
              <input
                type="date"
                className="w-full p-2 border border-gray-300 rounded-lg font-serif text-sm focus:outline-none focus:border-black"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                required
              />
            </div>

            <div className="flex gap-4">
              <select
                value={newUrgency}
                onChange={(e: any) => setNewUrgency(e.target.value)}
                className="p-2 border border-gray-300 rounded-lg font-serif text-sm bg-white"
              >
                <option value="low">Low Urgency</option>
                <option value="medium">Medium Urgency</option>
                <option value="high">High Urgency</option>
              </select>
              <select
                value={newRecurrence}
                onChange={(e: any) => setNewRecurrence(e.target.value)}
                className="p-2 border border-gray-300 rounded-lg font-serif text-sm bg-white"
              >
                <option value="one-time">One-time</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-black text-white py-2 rounded-lg font-serif text-sm flex items-center justify-center gap-2 hover:bg-gray-800"
              >
                <Save className="w-4 h-4" />
                {submitting ? "Saving..." : "Save Commitment"}
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="flex-1 bg-white text-black border border-gray-300 py-2 rounded-lg font-serif text-sm flex items-center justify-center gap-2 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {loading ? (
          <div className="text-center py-8 text-gray-400 font-serif">Loading commitments...</div>
        ) : commitments.length === 0 && !isAdding ? (
          <div className="text-center py-8 text-gray-400 font-serif border-2 border-dashed border-gray-200 rounded-2xl">
            No active commitments.
          </div>
        ) : (
          commitments.map((item) => (
            <div key={item.id} className="bg-white p-5 rounded-2xl border-2 border-black hover:shadow-lg transition-shadow group relative">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-serif text-black mb-1 font-semibold">{item.title}</h4>
                    <span className="font-bold font-serif text-lg">${item.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-4 font-serif text-gray-600 mt-1">
                    <span className="flex items-center gap-1 text-sm">
                      <Calendar className="w-4 h-4" />
                      {item.dueDate}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${getUrgencyColor(item.urgencyLevel)}`}>
                      {item.urgencyLevel.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleDelete(item.id)}
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity p-1 bg-white rounded-full shadow-sm border border-gray-100"
                title="Delete Commitment"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
