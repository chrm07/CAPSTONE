import Link from "next/link"
import { Button } from "@/components/ui/button"
import { HeroSection } from "@/components/hero-section"
import { MainNav } from "@/components/main-nav"
import { FeaturesSection } from "@/components/features-section"
import { TestimonialsSection } from "@/components/testimonials-section"
import { FaqSection } from "@/components/faq-section"
import { CtaSection } from "@/components/cta-section"
import { EnhancedFooter } from "@/components/enhanced-footer"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 backdrop-blur-md shadow-lg">
        <div className="container flex h-16 items-center">
          <MainNav />
          <div className="ml-auto flex items-center space-x-4">
            <Link href="/login">
              <Button
                variant="ghost"
                className="text-white hover:text-white hover:bg-green-800 transition-all duration-300 font-medium border border-transparent hover:border-green-500"
                style={{ backgroundColor: "rgba(22, 101, 52, 0.3)" }}
              >
                Log in
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-white text-green-700 hover:bg-gray-50 hover:text-green-800 rounded-full px-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold">
                Register
              </Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <TestimonialsSection />
        <FaqSection />
        <CtaSection />
      </main>
      <EnhancedFooter />
    </div>
  )
}
