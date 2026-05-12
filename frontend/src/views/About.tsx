import { motion } from 'framer-motion'
import HomeHeader from '../components/layout/HomeHeader'
import HomeFooter from '../components/layout/HomeFooter'

interface AboutViewProps {
  onNavigate: (path: string) => void
}

export default function AboutView({ onNavigate }: AboutViewProps) {
  return (
    <div className="home-gradient-bg flex min-h-screen flex-col text-zinc-950 transition-colors duration-300 dark:text-zinc-100">
      <HomeHeader onNavigate={onNavigate} />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <h1 className="text-4xl font-bold tracking-tight text-zinc-950 sm:text-6xl dark:text-zinc-50 mb-8 text-center">
            About Briefly
          </h1>
          <div className="prose prose-zinc dark:prose-invert prose-lg mx-auto">
            <p>
              At Briefly, we believe that the best work comes from clear understanding and communication. 
              Our mission is to eliminate the friction between initial client conversations and actionable project scopes.
            </p>
            <p>
              Agencies waste countless hours parsing through chaotic notes, disjointed emails, and 
              long voice recordings just to figure out what needs to be built. We built Briefly to be the 
              intelligent layer that organizes that chaos into structured, professional briefs in seconds.
            </p>
            <h3>Our Story</h3>
            <p>
              Briefly was born out of a hackathon, driven by the frustration of constant miscommunications 
              and scope creep in agency-client relationships. We wanted a single, calm workspace to drop all 
              messy input and magically get a polished output.
            </p>
            <h3>Our Values</h3>
            <ul>
              <li><strong>Clarity above all:</strong> We strive to make complex things simple.</li>
              <li><strong>Time is precious:</strong> We build tools that save you time so you can focus on creating.</li>
              <li><strong>Security & Privacy:</strong> Your client data is sensitive, and we treat it with the highest level of care.</li>
            </ul>
          </div>
        </motion.div>
      </main>

      <HomeFooter onNavigate={onNavigate} />
    </div>
  )
}
