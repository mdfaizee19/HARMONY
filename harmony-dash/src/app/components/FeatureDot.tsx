import { motion } from "motion/react";
import { LucideIcon } from "lucide-react";

interface FeatureDotProps {
  icon: LucideIcon;
  label: string;
  angle: number;
  radius: number;
  isActive: boolean;
  onClick: () => void;
}

export function FeatureDot({ icon: Icon, label, angle, radius, isActive, onClick }: FeatureDotProps) {
  // Convert angle to radians and calculate position
  const angleRad = (angle * Math.PI) / 180;
  const x = Math.cos(angleRad) * radius;
  const y = Math.sin(angleRad) * radius;

  return (
    <motion.div
      className="absolute"
      style={{
        left: `calc(50% + ${x}px)`,
        top: `calc(50% + ${y}px)`,
        transform: "translate(-50%, -50%)",
      }}
      whileHover={{ scale: 1.2 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.button
        onClick={onClick}
        className="relative group"
        animate={{
          scale: isActive ? 1.1 : 1,
        }}
      >
        {/* Dot */}
        <motion.div
          className="w-16 h-16 rounded-full flex items-center justify-center cursor-pointer transition-all"
          style={{
            backgroundColor: isActive ? "#000000" : "#ffffff",
            border: "3px solid #000000",
            boxShadow: isActive 
              ? "0 0 30px 5px rgba(0, 0, 0, 0.3)" 
              : "0 4px 10px rgba(0, 0, 0, 0.1)",
          }}
          whileHover={{
            boxShadow: "0 0 25px 3px rgba(0, 0, 0, 0.25)",
          }}
        >
          <Icon 
            className="w-7 h-7" 
            style={{ color: isActive ? "#ffffff" : "#000000" }} 
          />
        </motion.div>

        {/* Label */}
        <motion.div
          className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none font-serif italic"
          style={{
            backgroundColor: "#f5f5f5",
            color: "#000000",
            border: "1px solid #000000",
          }}
        >
          {label}
        </motion.div>

        {/* Active indicator ring */}
        {isActive && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-black"
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 1.3, opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </motion.button>
    </motion.div>
  );
}
