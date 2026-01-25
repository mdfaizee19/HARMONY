import { motion, AnimatePresence } from "motion/react";
import { X, LucideIcon } from "lucide-react";

interface FeaturePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
}

export function FeaturePanel({ isOpen, onClose, title, icon: Icon, children }: FeaturePanelProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-4xl max-h-[85vh] bg-white rounded-3xl overflow-hidden z-50"
            style={{
              border: "2px solid #000000",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
            }}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div
              className="px-8 py-6 flex items-center justify-between bg-black"
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-white"
                  style={{ backgroundColor: "#000000" }}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl text-white font-serif">
                  {title}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-black" />
              </button>
            </div>

            {/* Content */}
            <div className="px-8 py-6 overflow-y-auto max-h-[calc(85vh-100px)] font-serif">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
