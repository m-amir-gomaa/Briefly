import { motion } from 'framer-motion'
import HomeHeader from '../components/layout/HomeHeader'
import HomeFooter from '../components/layout/HomeFooter'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { Check } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { createCheckoutSession } from '../services/api'

interface PricingViewProps {
  onNavigate: (path: string) => void
}

const plans = [
  {
    name: 'Starter',
    price: '$0',
    description: 'Perfect for freelancers and solo consultants just getting started.',
    features: ['Up to 3 active projects', 'Basic AI brief generation', 'Text & Voice input', 'Community support'],
    buttonText: 'Get Started',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$49',
    period: '/mo',
    description: 'For growing agencies that need more volume and advanced features.',
    features: ['Unlimited projects', 'Advanced AI brief generation', 'Image & File attachments', 'Custom branding on briefs', 'Priority email support'],
    buttonText: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For large teams requiring custom workflows and enterprise-grade security.',
    features: ['Everything in Pro', 'Custom AI models', 'SSO & Advanced Security', 'Dedicated success manager', 'API access'],
    buttonText: 'Contact Sales',
    popular: false,
  },
]

export default function PricingView({ onNavigate }: PricingViewProps) {
  const user = useAuthStore((state) => state.user)

  const handleAction = async (planName: string) => {
    if (planName === 'Enterprise') {
      onNavigate('/contact')
      return
    }

    if (planName === 'Pro' && user) {
      if (user.plan_tier === 'pro') {
        alert('You are already on the Pro plan!')
        return
      }
      try {
        const { url } = await createCheckoutSession()
        window.location.href = url
      } catch (error) {
        alert('Failed to start checkout session. Please try again later.')
      }
      return
    }

    if (user) {
      onNavigate('/dashboard')
    } else {
      onNavigate('/register')
    }
  }

  return (
    <div className="home-gradient-bg flex min-h-screen flex-col text-zinc-950 transition-colors duration-300 dark:text-zinc-100">
      <HomeHeader onNavigate={onNavigate} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <h1 className="text-4xl font-bold tracking-tight text-zinc-950 sm:text-6xl dark:text-zinc-50">
            Simple, transparent pricing
          </h1>
          <p className="mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            Choose the plan that best fits your agency's needs. Upgrade, downgrade, or cancel anytime.
          </p>
        </motion.div>

        <div className="mt-16 grid max-w-6xl mx-auto gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.15, ease: 'easeOut' }}
              className="flex"
            >
              <Card className={`relative flex flex-col w-full p-8 ${plan.popular ? 'border-zinc-400 dark:border-zinc-500 shadow-xl shadow-zinc-200/50 dark:shadow-black/50' : 'border-zinc-200/50 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm'}`}>
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-zinc-950 px-3 py-0.5 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-950">
                    Most Popular
                  </span>
                )}
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-zinc-950 dark:text-zinc-100">{plan.name}</h3>
                  <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 min-h-[40px]">{plan.description}</p>
                </div>
                <div className="mb-6 flex items-baseline text-zinc-950 dark:text-zinc-50">
                  <span className="text-5xl font-bold tracking-tight">{plan.price}</span>
                  {plan.period && <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">{plan.period}</span>}
                </div>
                <ul className="mb-8 flex-1 space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-3 text-sm text-zinc-600 dark:text-zinc-300">
                      <Check className="h-5 w-5 shrink-0 text-zinc-950 dark:text-zinc-100" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.popular ? 'primary' : 'secondary'}
                  className="w-full"
                  onClick={() => handleAction(plan.name)}
                >
                  {plan.buttonText}
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>
      </main>

      <HomeFooter onNavigate={onNavigate} />
    </div>
  )
}
