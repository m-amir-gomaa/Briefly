import { motion } from 'framer-motion'
import HomeHeader from '../components/layout/HomeHeader'
import HomeFooter from '../components/layout/HomeFooter'

interface TermsViewProps {
  onNavigate: (path: string) => void
}

export default function TermsView({ onNavigate }: TermsViewProps) {
  return (
    <div className="home-gradient-bg flex min-h-screen flex-col text-zinc-950 transition-colors duration-300 dark:text-zinc-100">
      <HomeHeader onNavigate={onNavigate} />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md rounded-3xl p-8 sm:p-12 shadow-xl shadow-zinc-200/50 dark:shadow-black/30 border border-zinc-200/50 dark:border-zinc-800/50"
        >
          <h1 className="text-3xl font-bold tracking-tight text-zinc-950 sm:text-5xl dark:text-zinc-50 mb-8">
            Terms of Service
          </h1>
          <div className="prose prose-zinc dark:prose-invert prose-lg max-w-none">
            <p>Last updated: {new Date().toLocaleDateString()}</p>
            <p>
              Please read these Terms of Service carefully before using Briefly.
            </p>
            
            <h3>1. Agreement to Terms</h3>
            <p>
              By accessing or using our services, you agree to be bound by these Terms and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
            </p>

            <h3>2. Use License</h3>
            <p>
              Permission is granted to temporarily use Briefly for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.
            </p>

            <h3>3. User Content</h3>
            <p>
              Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material. You are responsible for the Content that you post on or through the Service, including its legality, reliability, and appropriateness.
            </p>

            <h3>4. Changes</h3>
            <p>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. What constitutes a material change will be determined at our sole discretion.
            </p>
          </div>
        </motion.div>
      </main>

      <HomeFooter onNavigate={onNavigate} />
    </div>
  )
}
