import { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
            navigate("/");
        } catch (err: any) {
            console.error("Auth Error:", err.code, err.message);

            // Explicit error handling
            switch (err.code) {
                case 'auth/configuration-not-found':
                    setError("Email/Password Sign-in is disabled in Firebase Console. Please enable it in Authentication > Sign-in method.");
                    break;
                case 'auth/user-not-found':
                case 'auth/invalid-credential':
                    setError(isLogin ? "Invalid email or password." : "Error creating account.");
                    break;
                case 'auth/wrong-password':
                    setError("Incorrect password.");
                    break;
                case 'auth/email-already-in-use':
                    setError("Email is already registered. Please login.");
                    break;
                case 'auth/weak-password':
                    setError("Password should be at least 6 characters.");
                    break;
                default:
                    setError(err.message || "Authentication failed. Check console.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 relative overflow-hidden">
            {/* Background Decorative Circles */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full border border-gray-200 opacity-50 pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full border border-gray-200 opacity-30 pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-white border-2 border-black rounded-3xl p-8 shadow-xl z-10"
            >
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-black rounded-full mx-auto mb-4 flex items-center justify-center">
                        <span className="text-white text-2xl font-serif">H</span>
                    </div>
                    <h1 className="text-3xl font-serif text-black mb-2">
                        {isLogin ? "Welcome Back" : "Create Account"}
                    </h1>
                    <p className="text-gray-500 font-serif">
                        {isLogin ? "Sign in to your dashboard" : "Get started with Harmony"}
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm text-center font-serif">
                        {error}
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                        <label className="block text-sm font-serif text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            required
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-black transition-colors font-serif"
                            placeholder="admin@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-serif text-gray-700 mb-1">Password</label>
                        <input
                            type="password"
                            required
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-black transition-colors font-serif"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-black text-white rounded-xl font-serif text-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                        {loading ? "Processing..." : (isLogin ? "Sign In" : "Sign Up")}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError(null);
                        }}
                        className="text-sm text-gray-600 font-serif hover:underline hover:text-black transition-colors"
                    >
                        {isLogin
                            ? "Don't have an account? Sign Up"
                            : "Already have an account? Sign In"}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
