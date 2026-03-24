"use client"

import { useState, useEffect } from "react"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import Image from "next/image"

export function HeroSection() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isTrackLoading, setIsTrackLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Trigger animations after component mounts
    const timer = setTimeout(() => {
      setIsLoaded(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  const handleTrackClick = () => {
    setIsTrackLoading(true)
    // Simulate loading delay for smooth transition
    setTimeout(() => {
      router.push("/login")
    }, 600)
  }

  return (
    <section className="relative w-full bg-gradient-to-br from-emerald-50 via-green-100 to-teal-50 py-20 md:py-32 overflow-hidden min-h-screen flex items-center justify-center">
      {/* Enhanced background with more vibrant colors */}
      <div className="absolute inset-0 z-0">
        {/* Vibrant gradient overlays */}
        <div
          className={`absolute top-0 left-1/2 transform -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-br from-green-300/40 via-emerald-200/30 to-teal-200/20 rounded-full opacity-80 blur-3xl transition-all duration-1000 ${
            isLoaded ? "scale-100 opacity-80" : "scale-75 opacity-0"
          }`}
          style={{ animationDelay: "0.2s" }}
        ></div>
        <div
          className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-emerald-400/30 via-green-300/20 to-teal-300/20 rounded-full opacity-60 blur-2xl transition-all duration-1000 ${
            isLoaded ? "scale-100 opacity-60" : "scale-75 opacity-0"
          }`}
          style={{ animationDelay: "0.4s" }}
        ></div>

        {/* Additional colorful depth layers */}
        <div
          className={`absolute top-20 left-1/4 w-96 h-96 bg-gradient-to-br from-green-200/50 to-emerald-300/40 rounded-full opacity-50 blur-3xl animate-pulse transition-all duration-1200 ${
            isLoaded ? "scale-100 opacity-50" : "scale-50 opacity-0"
          }`}
          style={{ animationDelay: "0.6s" }}
        ></div>
        <div
          className={`absolute bottom-20 right-1/4 w-80 h-80 bg-gradient-to-tl from-teal-200/60 to-green-200/40 rounded-full opacity-40 blur-3xl transition-all duration-1200 ${
            isLoaded ? "scale-100 opacity-40" : "scale-50 opacity-0"
          }`}
          style={{ animationDelay: "0.8s" }}
        ></div>

        {/* More vibrant floating shapes */}
        <div
          className={`absolute top-32 left-1/4 w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full opacity-70 animate-bounce transition-all duration-500 ${
            isLoaded ? "opacity-70 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className={`absolute top-48 right-1/3 w-4 h-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full opacity-60 animate-bounce transition-all duration-500 ${
            isLoaded ? "opacity-60 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          style={{ animationDelay: "1.2s" }}
        ></div>
        <div
          className={`absolute bottom-32 left-1/3 w-5 h-5 bg-gradient-to-r from-teal-400 to-green-500 rounded-full opacity-80 animate-bounce transition-all duration-500 ${
            isLoaded ? "opacity-80 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          style={{ animationDelay: "1.4s" }}
        ></div>
        <div
          className={`absolute top-40 right-1/4 w-4 h-4 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full opacity-50 animate-bounce transition-all duration-500 ${
            isLoaded ? "opacity-50 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          style={{ animationDelay: "1.6s" }}
        ></div>
      </div>

      <div className="container relative z-10 px-4 md:px-6 w-full">
        <div className="flex flex-col items-center justify-center text-center space-y-10 max-w-5xl mx-auto">
          {/* Status indicator with entrance animation */}
          <div
            className={`flex items-center justify-center space-x-2 text-sm transition-all duration-700 ease-out ${
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
            style={{ animationDelay: "0.3s" }}
          >
            <div className="relative">
              <div className="h-2 w-2 rounded-full bg-gradient-to-r from-green-400 to-green-600 shadow-lg animate-pulse"></div>
              <div className="absolute inset-0 h-2 w-2 rounded-full bg-green-400 animate-ping opacity-75"></div>
            </div>
            <span className="text-gray-600 font-medium">Now accepting applications for 2025</span>
          </div>

          {/* BTS Logo replacing the text heading */}
          <div className="space-y-8 w-full flex flex-col items-center justify-center">
            <div className="relative flex items-center justify-center">
              <div
                className={`transition-all duration-1000 ease-out ${
                  isLoaded ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95"
                }`}
                style={{ animationDelay: "0.5s" }}
              >
                <Image
                  src="/images/bts-logo.jpg"
                  alt="Bawat Tahanan May Scholar - BTS Logo"
                  width={800}
                  height={400}
                  className="mx-auto rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 max-w-full h-auto"
                  priority
                />
              </div>
            </div>
            <div className="w-full flex justify-center">
              <p
                className={`text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed text-center transition-all duration-800 ease-out ${
                  isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                }`}
                style={{ animationDelay: "0.7s" }}
              >
                Empowering communities through education. Your journey to academic success starts here.
              </p>
            </div>
          </div>

          {/* Enhanced CTA buttons with loading states and animations */}
          <div
            className={`flex flex-col sm:flex-row gap-6 pt-6 w-full justify-center items-center transition-all duration-800 ease-out ${
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ animationDelay: "0.9s" }}
          >
            {/* Remove Apply Now button from hero section */}
            <Button
              variant="ghost"
              size="lg"
              onClick={handleTrackClick}
              disabled={isTrackLoading}
              className="relative text-green-600 hover:text-green-700 hover:bg-green-50 px-12 py-4 text-lg transition-all duration-300 border border-green-200/50 hover:border-green-300 shadow-lg hover:shadow-xl transform hover:scale-105 rounded-full disabled:opacity-80 disabled:cursor-not-allowed disabled:transform-none min-w-[180px]"
            >
              {isTrackLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-green-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Loading...</span>
                </>
              ) : (
                "Track Application"
              )}
            </Button>
          </div>

          {/* Achievement badges with staggered entrance animation */}
          <div
            className={`flex flex-wrap justify-center items-center gap-4 pt-8 w-full transition-all duration-800 ease-out ${
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
            style={{ animationDelay: "1.3s" }}
          >
            {["✓ Verified Program", "✓ Government Approved", "✓ Community Focused"].map((text, index) => (
              <div
                key={index}
                className={`bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg border border-green-100 transform hover:scale-105 transition-all duration-300 ${
                  isLoaded ? "scale-100 opacity-100" : "scale-90 opacity-0"
                }`}
                style={{ animationDelay: `${1.4 + index * 0.1}s` }}
              >
                <span className="text-sm font-medium text-green-600">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Custom CSS for additional animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }

        .animate-scale-in {
          animation: scaleIn 0.5s ease-out forwards;
        }
      `}</style>
    </section>
  )
}
