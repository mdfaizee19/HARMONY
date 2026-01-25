import { useState, useEffect } from "react";
import { Link2, Trash2, Plus, ShoppingCart, CreditCard, Wallet, Calendar } from "lucide-react";
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
    orderBy,
    updateDoc,
    increment
} from "firebase/firestore";

interface LinkedEntity {
    id: string;
    type: "bank" | "creditCard" | "subscription" | "expenseSource";
    provider: string; // e.g. "VISA", "Amazon", "Netflix"
    status: "linked";
}

const PROVIDERS = {
    bank: ["Harmony Bank (Demo)", "External Bank"],
    creditCard: ["Visa Classic", "Mastercard Gold", "Amex Platinum"],
    subscription: ["Netflix", "Spotify", "AWS", "ChatGPT Plus"],
    expenseSource: ["Amazon", "Flipkart", "BigBasket", "Uber", "Swiggy"]
};

export function LinkedAccountsPanel() {
    const { user } = useAuth();
    const [entities, setEntities] = useState<LinkedEntity[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [selectedType, setSelectedType] = useState<keyof typeof PROVIDERS>("bank");
    const [selectedProvider, setSelectedProvider] = useState(PROVIDERS.bank[0]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, "users", user.uid, "linkedAccounts"),
            orderBy("createdAt", "desc")
        );

        const unsub = onSnapshot(q, (snapshot) => {
            setEntities(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as LinkedEntity)));
            setLoading(false);
        });

        return () => unsub();
    }, [user]);

    const handleLink = async () => {
        if (!user) return;

        try {
            // Create Link
            await addDoc(collection(db, "users", user.uid, "linkedAccounts"), {
                type: selectedType,
                provider: selectedProvider,
                status: "linked",
                metadata: {},
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            // Special Logic: Bank Account Bonus
            if (selectedType === "bank") {
                await updateDoc(doc(db, "users", user.uid), {
                    balance: increment(1000000)
                });
                alert("Bank Linked! +1,000,000 Demo Cash Added.");
            }

            setIsAdding(false);
        } catch (e) {
            console.error("Link failed", e);
        }
    };

    const handleUnlink = async (id: string) => {
        if (!user) return;
        if (confirm("Unlink this service? Simulation constraints may fail.")) {
            await deleteDoc(doc(db, "users", user.uid, "linkedAccounts", id));
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'bank': return <Wallet className="w-4 h-4" />;
            case 'creditCard': return <CreditCard className="w-4 h-4" />;
            case 'subscription': return <Calendar className="w-4 h-4" />;
            case 'expenseSource': return <ShoppingCart className="w-4 h-4" />;
            default: return <Link2 className="w-4 h-4" />;
        }
    };

    return (
        <div className="bg-white border-2 border-black rounded-2xl p-4 w-full h-full flex flex-col">
            <h3 className="font-serif text-lg font-semibold mb-4 flex items-center gap-2">
                <Link2 className="w-5 h-5" /> Linked Services
            </h3>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
                {loading ? (
                    <p className="text-gray-400 text-sm font-serif text-center">Loading...</p>
                ) : entities.length === 0 ? (
                    <p className="text-gray-400 text-sm font-serif text-center border-dashed border border-gray-200 p-4 rounded-lg">
                        No services linked.
                    </p>
                ) : (
                    entities.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl group hover:border-black transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center text-black">
                                    {getIcon(item.type)}
                                </div>
                                <div>
                                    <div className="font-serif text-sm font-medium">{item.provider}</div>
                                    <div className="text-xs text-gray-500 capitalize">{item.type.replace(/([A-Z])/g, ' $1').trim()}</div>
                                </div>
                            </div>
                            <button
                                onClick={() => handleUnlink(item.id)}
                                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                                title="Unlink"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Add New */}
            {!isAdding ? (
                <button
                    onClick={() => setIsAdding(true)}
                    className="w-full py-2 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center gap-2 text-gray-500 hover:border-black hover:text-black transition-all font-serif text-sm"
                >
                    <Plus className="w-4 h-4" /> Link Service
                </button>
            ) : (
                <div className="bg-black text-white p-4 rounded-xl space-y-3 animate-in fade-in slide-in-from-bottom-2">
                    <div className="space-y-1">
                        <label className="text-xs text-gray-400 font-serif">Service Type</label>
                        <select
                            value={selectedType}
                            onChange={(e: any) => {
                                setSelectedType(e.target.value);
                                setSelectedProvider(PROVIDERS[e.target.value as keyof typeof PROVIDERS][0]);
                            }}
                            className="w-full bg-gray-800 border-none rounded-lg text-sm p-2 focus:ring-1 focus:ring-white"
                        >
                            <option value="bank">Bank Account</option>
                            <option value="creditCard">Credit Card</option>
                            <option value="subscription">Subscription</option>
                            <option value="expenseSource">Expense App</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs text-gray-400 font-serif">Provider</label>
                        <select
                            value={selectedProvider}
                            onChange={(e) => setSelectedProvider(e.target.value)}
                            className="w-full bg-gray-800 border-none rounded-lg text-sm p-2 focus:ring-1 focus:ring-white"
                        >
                            {PROVIDERS[selectedType].map(p => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-2 pt-1">
                        <button
                            onClick={handleLink}
                            className="flex-1 bg-white text-black py-2 rounded-lg text-xs font-bold"
                        >
                            Connect
                        </button>
                        <button
                            onClick={() => setIsAdding(false)}
                            className="flex-1 bg-transparent border border-gray-600 text-gray-300 py-2 rounded-lg text-xs hover:bg-gray-800"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
