import { motion } from 'framer-motion'
import HomeHeader from '../components/layout/HomeHeader'
import HomeFooter from '../components/layout/HomeFooter'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { Mail, MapPin } from 'lucide-react'

interface ContactViewProps {
  onNavigate: (path: string) => void
}

export default function ContactView({ onNavigate }: ContactViewProps) {
  return (
    <div className="home-gradient-bg flex min-h-screen flex-col text-zinc-950 transition-colors duration-300 dark:text-zinc-100">
      <HomeHeader onNavigate={onNavigate} />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <h1 className="text-4xl font-bold tracking-tight text-zinc-950 sm:text-6xl dark:text-zinc-50">
            Get in touch
          </h1>
          <p className="mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            Whether you have a question about features, pricing, or need technical support, our team is ready to answer all your questions.
          </p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
          >
            <Card className="p-8 h-full bg-white/50 backdrop-blur-sm dark:bg-zinc-900/50">
              <h2 className="text-2xl font-semibold mb-6">Contact Information</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-zinc-100 p-3 dark:bg-zinc-800">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-medium text-zinc-950 dark:text-zinc-100">Email Us</h3>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Our friendly team is here to help.</p>
                    <a href="mailto:hello@briefly.ai" className="mt-2 inline-block font-medium text-zinc-950 hover:underline dark:text-zinc-100">hello@briefly.ai</a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-zinc-100 p-3 dark:bg-zinc-800">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-medium text-zinc-950 dark:text-zinc-100">Office</h3>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Come say hello at our office HQ.</p>
                    <p className="mt-2 text-sm font-medium text-zinc-950 dark:text-zinc-100">100 Tech Lane, Suite 200<br/>San Francisco, CA 94105</p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
          >
            <Card className="p-8 bg-white/50 backdrop-blur-sm dark:bg-zinc-900/50">
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert("Thanks for reaching out! We'll get back to you soon.") }}>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Name</label>
                  <input type="text" id="name" className="mt-1 block w-full rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white" placeholder="Jane Doe" required />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Email</label>
                  <input type="email" id="email" className="mt-1 block w-full rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white" placeholder="jane@example.com" required />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Message</label>
                  <textarea id="message" rows={4} className="mt-1 block w-full rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white" placeholder="How can we help you?" required />
                </div>
                <Button type="submit" className="w-full mt-4">Send Message</Button>
              </form>
            </Card>
          </motion.div>
        </div>
      </main>

      <HomeFooter onNavigate={onNavigate} />
    </div>
  )
}
