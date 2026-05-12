import { motion } from 'framer-motion'
import HomeHeader from '../components/layout/HomeHeader'
import HomeFooter from '../components/layout/HomeFooter'

interface PrivacyViewProps {
  onNavigate: (path: string) => void
}

export default function PrivacyView({ onNavigate }: PrivacyViewProps) {
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
            Privacy Policy
          </h1>
          <div className="prose prose-zinc dark:prose-invert prose-lg max-w-none">
            <p>Last updated: {new Date().toLocaleDateString()}</p>
            <p>
              At Briefly, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our service.
            </p>
            
            <h3>1. Information We Collect</h3>
            <p>
              We collect information that you provide directly to us when you register for an account, create or modify your profile, and use our services. This includes text, voice notes, and images you upload to our platform.
            </p>

            <h3>2. How We Use Your Information</h3>
            <p>
              We use the information we collect primarily to provide, maintain, and improve our services. This includes using AI to process your inputs into project briefs. We do not use your proprietary data to train public AI models.
            </p>

            <h3>3. Data Security</h3>
            <p>
              We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process.
            </p>

            <h3>4. Contact Us</h3>
            <p>
              If you have questions or comments about this Privacy Policy, please contact us at: <a href="mailto:privacy@briefly.ai">privacy@briefly.ai</a>.
            </p>
          </div>
        </motion.div>
      </main>

      <HomeFooter onNavigate={onNavigate} />
    </div>
  )
}
