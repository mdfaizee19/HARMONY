import { ShieldCheck, Plus, Trash2, X, Save } from "lucide-react";
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

interface Rule {
  id: string;
  title: string;
  description: string;
  priority: "hard" | "soft";
  createdAt?: any;
}

export function NonNegotiablesFeature() {
  const { user } = useAuth();
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPriority, setNewPriority] = useState<"hard" | "soft">("hard");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Ordered by createdAt so new ones appear at bottom or top. 
    // Using 'desc' for newest first usually better for activity, but 'asc' for strict list is ok.
    // Let's use 'desc' (newest first).
    const q = query(
      collection(db, "users", user.uid, "nonNegotiables"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const fetchedRules = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Rule[];
        setRules(fetchedRules);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching rules:", err);
        setError("Failed to load rules.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (rules.length >= 7) {
      setError("Maximum 7 rules allowed.");
      setTimeout(() => setError(null), 3000);
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, "users", user.uid, "nonNegotiables"), {
        title: newTitle,
        description: newDesc,
        priority: newPriority,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Reset form
      setNewTitle("");
      setNewDesc("");
      setIsAdding(false);
    } catch (err) {
      console.error("Error adding rule:", err);
      setError("Failed to save rule.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "nonNegotiables", ruleId));
    } catch (err) {
      console.error("Error deleting rule:", err);
      setError("Failed to delete rule.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <p className="text-gray-700 font-serif italic text-sm">
          Define up to 7 non-negotiable rules for your agent.
        </p>
        <span className="text-xs font-serif text-gray-500">
          {rules.length}/7 Used
        </span>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-sm font-serif border border-red-200 rounded-lg">
          {error}
        </div>
      )}

      {!isAdding && rules.length < 7 && (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full bg-black text-white py-3 px-6 rounded-xl font-serif flex items-center justify-center gap-2 hover:bg-gray-800 transition-all border-2 border-black"
        >
          <Plus className="w-5 h-5" />
          Add New Rule
        </button>
      )}

      {isAdding && (
        <form onSubmit={handleAddRule} className="bg-gray-50 p-5 rounded-2xl border-2 border-dashed border-gray-400 animate-in fade-in slide-in-from-top-4">
          <h4 className="font-serif text-black mb-3 font-semibold">New Rule</h4>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Rule Title (e.g. Transaction Limit)"
              className="w-full p-2 border border-gray-300 rounded-lg font-serif text-sm focus:outline-none focus:border-black"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
            />
            <textarea
              placeholder="Description (e.g. Max $10k per transaction)"
              className="w-full p-2 border border-gray-300 rounded-lg font-serif text-sm focus:outline-none focus:border-black"
              rows={2}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              required
            />
            <div className="flex gap-4">
              <label className="flex items-center gap-2 font-serif text-sm cursor-pointer">
                <input
                  type="radio"
                  name="priority"
                  value="hard"
                  checked={newPriority === "hard"}
                  onChange={() => setNewPriority("hard")}
                  className="accent-black"
                />
                Hard Constraint
              </label>
              <label className="flex items-center gap-2 font-serif text-sm cursor-pointer">
                <input
                  type="radio"
                  name="priority"
                  value="soft"
                  checked={newPriority === "soft"}
                  onChange={() => setNewPriority("soft")}
                  className="accent-black"
                />
                Soft Constraint
              </label>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-black text-white py-2 rounded-lg font-serif text-sm flex items-center justify-center gap-2 hover:bg-gray-800"
              >
                <Save className="w-4 h-4" />
                {submitting ? "Saving..." : "Save Rule"}
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
          <div className="text-center py-8 text-gray-400 font-serif">Loading rules...</div>
        ) : rules.length === 0 && !isAdding ? (
          <div className="text-center py-8 text-gray-400 font-serif border-2 border-dashed border-gray-200 rounded-2xl">
            No rules defined yet.
          </div>
        ) : (
          rules.map((rule) => (
            <div key={rule.id} className="bg-white p-5 rounded-2xl border-2 border-black group relative hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start gap-3">
                  <ShieldCheck className={`w-5 h-5 mt-1 ${rule.priority === 'hard' ? 'text-red-500' : 'text-blue-500'}`} />
                  <div>
                    <h4 className="font-serif text-black font-medium">{rule.title}</h4>
                    <p className="font-serif text-gray-600 mt-1 text-sm">{rule.description}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 text-xs font-serif rounded-full ${rule.priority === 'hard' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                  {rule.priority === 'hard' ? 'Hard' : 'Soft'}
                </span>
              </div>

              <button
                onClick={() => handleDeleteRule(rule.id)}
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity p-1"
                title="Delete Rule"
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
