import { motion } from "framer-motion";

const IkigaiHeroGraphic = () => {
  const circles = [
    { cx: 140, cy: 130, color: "hsl(var(--ikigai-love))", label: "What you love", labelX: 80, labelY: 55, delay: 0 },
    { cx: 210, cy: 130, color: "hsl(var(--ikigai-good))", label: "What you're great at", labelX: 270, labelY: 55, delay: 0.2 },
    { cx: 140, cy: 200, color: "hsl(var(--ikigai-world))", label: "What the world needs", labelX: 70, labelY: 280, delay: 0.4 },
    { cx: 210, cy: 200, color: "hsl(var(--ikigai-livelihood))", label: "What sustains you", labelX: 280, labelY: 280, delay: 0.6 },
  ];

  return (
    <div className="relative w-[380px] h-[380px]">
      <svg viewBox="0 0 350 330" className="w-full h-full">
        {circles.map((c, i) => (
          <motion.circle
            key={i}
            cx={c.cx}
            cy={c.cy}
            r="82"
            fill={c.color}
            fillOpacity={0.12}
            stroke={c.color}
            strokeWidth="1.5"
            strokeOpacity={0.3}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.9, delay: c.delay, ease: "easeOut" }}
            style={{ transformOrigin: `${c.cx}px ${c.cy}px` }}
          />
        ))}

        {/* Center glow */}
        <motion.circle
          cx="175"
          cy="165"
          r="32"
          fill="hsl(var(--brand-warm))"
          fillOpacity={0.15}
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          transition={{ duration: 1.2, delay: 1 }}
          style={{ transformOrigin: "175px 165px" }}
          className="animate-pulse-soft"
        />
        <motion.text
          x="175"
          y="162"
          textAnchor="middle"
          fill="hsl(var(--foreground))"
          fontSize="10"
          fontWeight="700"
          fontFamily="DM Sans"
          letterSpacing="2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          IKIGAI
        </motion.text>
        <motion.text
          x="175"
          y="176"
          textAnchor="middle"
          fill="hsl(var(--muted-foreground))"
          fontSize="7"
          fontFamily="DM Sans"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.7 }}
        >
          your reason for being
        </motion.text>

        {/* Labels */}
        {circles.map((c, i) => (
          <motion.text
            key={`label-${i}`}
            x={c.labelX}
            y={c.labelY}
            textAnchor="middle"
            fill="hsl(var(--muted-foreground))"
            fontSize="8.5"
            fontFamily="DM Sans"
            fontWeight="500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ delay: c.delay + 0.5 }}
          >
            {c.label}
          </motion.text>
        ))}
      </svg>
    </div>
  );
};

export default IkigaiHeroGraphic;
