import { Github, Twitter, Linkedin, Mail } from 'lucide-react'

interface HomeFooterProps {
  onNavigate: (path: string) => void
}

const productLinks = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'New Intake', path: '/intake/new' },
  { label: 'Account', path: '/account' },
]

const resourceLinks = [
  { label: 'Workflow', href: '#workflow' },
  { label: 'Product Preview', href: '#preview' },
  { label: 'API Documentation', href: '#' },
]

const companyLinks = [
  { label: 'About', href: '#' },
  { label: 'Blog', href: '#' },
  { label: 'Careers', href: '#' },
  { label: 'Contact', href: '#' },
]

const socialLinks = [
  { icon: Github, href: '#', label: 'GitHub' },
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
  { icon: Mail, href: 'mailto:hello@briefly.ai', label: 'Email' },
]

export default function HomeFooter({ onNavigate }: HomeFooterProps) {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      {/* Main footer */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
          {/* Brand column */}
          <div>
            <button
              type="button"
              onClick={() => onNavigate('/')}
              className="flex items-center gap-0 transition-opacity duration-200 hover:opacity-80"
              aria-label="Go to Briefly home"
            >
              <img
                src="/logo-title-black.png"
                alt="Briefly"
                className="h-6 dark:invert"
                draggable={false}
              />
            </button>

            <p className="mt-4 max-w-xs text-sm leading-6 text-zinc-500 dark:text-zinc-400">
              Turn rough client inputs into polished, structured project briefs — ready for review and sign-off.
            </p>

            {/* Social links */}
            <div className="mt-6 flex items-center gap-2">
              {socialLinks.map((social) => {
                const Icon = social.icon
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition-all duration-200 ease-in-out hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                    aria-label={social.label}
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                )
              })}
            </div>
          </div>

          {/* Product column */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-950 dark:text-zinc-100">Product</h3>
            <ul className="mt-4 space-y-3">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <button
                    type="button"
                    onClick={() => onNavigate(link.path)}
                    className="text-sm text-zinc-500 transition-colors duration-200 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources column */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-950 dark:text-zinc-100">Resources</h3>
            <ul className="mt-4 space-y-3">
              {resourceLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-zinc-500 transition-colors duration-200 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company column */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-950 dark:text-zinc-100">Company</h3>
            <ul className="mt-4 space-y-3">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-zinc-500 transition-colors duration-200 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-zinc-100 dark:border-zinc-800">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 sm:flex-row sm:px-6 lg:px-8">
          <p className="text-xs text-zinc-400">
            &copy; {currentYear} Briefly. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <a href="#" className="text-xs text-zinc-400 transition-colors duration-200 hover:text-zinc-600">
              Privacy Policy
            </a>
            <a href="#" className="text-xs text-zinc-400 transition-colors duration-200 hover:text-zinc-600">
              Terms of Service
            </a>
            <a href="#" className="text-xs text-zinc-400 transition-colors duration-200 hover:text-zinc-600">
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
