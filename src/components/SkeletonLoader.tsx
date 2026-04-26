import { motion } from "motion/react";

export function SkeletonGrid({ count = 6, type = 'card' }: { count?: number, type?: 'card' | 'list' }) {
  return (
    <div className={`grid gap-6 ${type === 'card' ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5' : 'grid-cols-1'}`}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="skeleton-base skeleton-card h-64 w-full flex flex-col p-5"
        >
          <div className="skeleton-base skeleton-text h-32 w-full rounded-xl mb-4" />
          <div className="skeleton-base skeleton-text h-6 w-3/4 mb-2" />
          <div className="skeleton-base skeleton-text h-4 w-1/2 mb-auto" />
          <div className="flex gap-2 mt-4">
            <div className="skeleton-base skeleton-text h-8 w-8 rounded-full" />
            <div className="skeleton-base skeleton-text h-8 w-1/3 rounded-full" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function SkeletonChat() {
  return (
    <div className="space-y-4 w-full max-w-4xl mx-auto p-4">
      <div className="skeleton-base skeleton-card h-20 w-3/4 rounded-2xl rounded-tl-sm mr-auto skeleton-yellow" />
      <div className="skeleton-base skeleton-card h-24 w-4/5 rounded-2xl rounded-tr-sm ml-auto" />
      <div className="skeleton-base skeleton-card h-16 w-2/3 rounded-2xl rounded-tl-sm mr-auto skeleton-green" />
    </div>
  );
}
