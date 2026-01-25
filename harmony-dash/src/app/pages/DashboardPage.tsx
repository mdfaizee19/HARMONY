import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
    LayoutDashboard,
    ShieldCheck,
    TrendingUp,
    Calendar,
    CreditCard,
    AlertTriangle,
    MessageCircle,
    FileText,
    Settings,
    Link2
} from "lucide-react";
import { FeatureDot } from "@/app/components/FeatureDot";
import { FeaturePanel } from "@/app/components/FeaturePanel";
import { LinkedAccountsPanel } from "@/app/components/LinkedAccountsPanel";
import { OverviewFeature } from "@/app/components/features/OverviewFeature";
import { NonNegotiablesFeature } from "@/app/components/features/NonNegotiablesFeature";
import { SimulationFeature } from "@/app/components/features/SimulationFeature";
import { CommitmentsFeature } from "@/app/components/features/CommitmentsFeature";
import { TransactionsFeature } from "@/app/components/features/TransactionsFeature";
import { RiskAlertsFeature } from "@/app/components/features/RiskAlertsFeature";
import { HarmonyTalkFeature } from "@/app/components/features/HarmonyTalkFeature";
import { DecisionLogFeature } from "@/app/components/features/DecisionLogFeature";
import { SettingsFeature } from "@/app/components/features/SettingsFeature";
import { useAuth } from "@/contexts/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

interface Feature {
    id: string;
    label: string;
    icon: typeof LayoutDashboard;
    component: React.ComponentType;
}

const features: Feature[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard, component: OverviewFeature },
    { id: "non-negotiables", label: "Non-Negotiables", icon: ShieldCheck, component: NonNegotiablesFeature },
    { id: "simulation", label: "Simulation & Forecast", icon: TrendingUp, component: SimulationFeature },
    { id: "commitments", label: "Commitments", icon: Calendar, component: CommitmentsFeature },
    { id: "transactions", label: "Transactions", icon: CreditCard, component: TransactionsFeature },
    { id: "risk-alerts", label: "Risk & Alerts", icon: AlertTriangle, component: RiskAlertsFeature },
    { id: "harmony-talk", label: "Harmony Talk", icon: MessageCircle, component: HarmonyTalkFeature },
    { id: "decision-log", label: "Decision Log", icon: FileText, component: DecisionLogFeature },
    { id: "settings", label: "Settings / Profile", icon: Settings, component: SettingsFeature },
];

// Star component
function Star({ style }: { style: React.CSSProperties }) {
    return (
        <motion.div
            className="absolute w-1 h-1 bg-black rounded-full"
            style={style}
            animate={{
                opacity: [0.3, 1, 0.3],
                scale: [1, 1.2, 1],
            }}
            transition={{
                duration: Math.random() * 3 + 2,
                repeat: Infinity,
                ease: "easeInOut",
            }}
        />
    );
}

export default function DashboardPage() {
    const [activeFeature, setActiveFeature] = useState<string | null>(null);
    const [showLinks, setShowLinks] = useState(false);
    const [stars, setStars] = useState<Array<{ left: string; top: string; delay: number }>>([]);
    const { user } = useAuth();

    useEffect(() => {
        // Generate random stars
        const newStars = Array.from({ length: 100 }, () => ({
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            delay: Math.random() * 2,
        }));
        setStars(newStars);
    }, []);

    const handleFeatureClick = (featureId: string) => {
        setActiveFeature(featureId);
    };

    const handleClosePanel = () => {
        setActiveFeature(null);
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const activeFeatureData = features.find(f => f.id === activeFeature);
    const ActiveComponent = activeFeatureData?.component;

    // Circle configuration
    const radius = 280;
    const startAngle = -90; // Start at top

    return (
        <div className="min-h-screen bg-white relative overflow-hidden flex items-center justify-center p-8">
            {/* Top Bar Actions */}
            <div className="absolute top-8 right-8 z-30 flex gap-4">
                {/* Linked Services Toggle */}
                <button
                    onClick={() => setShowLinks(!showLinks)}
                    className={`p-3 border rounded-full transition-colors flex items-center gap-2 ${showLinks ? 'bg-black text-white border-black' : 'bg-white text-black border-black hover:bg-gray-100'}`}
                    title="Linked Services"
                >
                    <Link2 className="w-5 h-5" />
                </button>

                <button
                    onClick={handleLogout}
                    className="px-4 py-2 border border-black rounded-full font-serif hover:bg-black hover:text-white transition-colors bg-white shadow-sm"
                >
                    Sign Out ({user?.email})
                </button>
            </div>

            {/* Linked Accounts Panel (Absolute Left/Top) - Only visible when toggled */}
            {showLinks && (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="absolute top-24 right-8 w-80 h-[600px] z-20 shadow-2xl"
                >
                    <LinkedAccountsPanel />
                </motion.div>
            )}

            {/* Stars Background */}
            {stars.map((star, index) => (
                <Star
                    key={index}
                    style={{
                        left: star.left,
                        top: star.top,
                        animationDelay: `${star.delay}s`,
                    }}
                />
            ))}

            {/* Main Container */}
            <div className={`relative w-full max-w-6xl aspect-square flex items-center justify-center z-10 transition-all duration-500 ${showLinks ? '-translate-x-32' : ''}`}>
                {/* Central Black Hub with Matt Glow */}
                <motion.div
                    className="relative z-10 w-48 h-48 rounded-full bg-black flex flex-col items-center justify-center cursor-pointer"
                    style={{
                        boxShadow: "0 0 40px 10px rgba(0, 0, 0, 0.4), 0 0 80px 20px rgba(0, 0, 0, 0.2)",
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <div className="relative text-center">
                        <div className="text-white text-3xl font-serif tracking-wide mb-2">Voice Agent</div>
                        <div className="text-gray-400 text-sm font-serif">Dashboard</div>
                    </div>
                </motion.div>

                {/* Feature Dots */}
                {features.map((feature, index) => {
                    const angle = startAngle + (index * 360) / features.length;
                    return (
                        <FeatureDot
                            key={feature.id}
                            icon={feature.icon}
                            label={feature.label}
                            angle={angle}
                            radius={radius}
                            isActive={activeFeature === feature.id}
                            onClick={() => handleFeatureClick(feature.id)}
                        />
                    );
                })}

                {/* Connection Lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                    {features.map((_, index) => {
                        const angle = ((startAngle + (index * 360) / features.length) * Math.PI) / 180;
                        const x1 = 50;
                        const y1 = 50;
                        const x2 = 50 + (radius / 6) * Math.cos(angle);
                        const y2 = 50 + (radius / 6) * Math.sin(angle);
                        return (
                            <line
                                key={index}
                                x1={`${x1}%`}
                                y1={`${y1}%`}
                                x2={`${x2}%`}
                                y2={`${y2}%`}
                                stroke="#000000"
                                strokeWidth="1"
                                strokeDasharray="3 3"
                            />
                        );
                    })}
                </svg>
            </div>

            {/* Feature Panel */}
            {activeFeatureData && ActiveComponent && (
                <FeaturePanel
                    isOpen={!!activeFeature}
                    onClose={handleClosePanel}
                    title={activeFeatureData.label}
                    icon={activeFeatureData.icon}
                >
                    <ActiveComponent />
                </FeaturePanel>
            )}

            {/* Info Text */}
            <motion.div
                className="fixed bottom-8 left-1/2 -translate-x-1/2 text-center z-20"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
            >
                <p className="text-gray-800 font-serif italic">
                    Click on any feature dot to explore • {features.length} features available
                </p>
            </motion.div>
        </div>
    );
}
