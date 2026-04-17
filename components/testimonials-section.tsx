export function TestimonialsSection() {
  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-br from-green-900 via-green-800 to-green-700 pb-32">
      
      {/* 🔥 FIX: Constrained wave height to prevent overlapping on wide screens */}
      <div className="absolute top-0 left-0 right-0 transform rotate-180 leading-none z-10 h-[100px] sm:h-[150px] md:h-[220px]">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full h-full block" preserveAspectRatio="none">
          <path fill="#ffffff" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,202.7C672,203,768,181,864,181.3C960,181,1056,203,1152,197.3C1248,192,1344,160,1392,144L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>

      {/* Background ambient elements */}
      <div className="absolute inset-0 z-0">
        <div className="animate-pulse-slow absolute top-[60%] right-1/4 h-64 w-64 rounded-full bg-gradient-to-br from-green-400 to-teal-300 opacity-15 blur-3xl"></div>
        <div className="animate-pulse-slow absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-gradient-to-tr from-emerald-400 to-green-300 opacity-15 blur-3xl"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYtMi42ODYgNi02cy0yLjY4Ni02LTYtNmMtMy4zMTQgMC02IDIuNjg2LTYgNnMyLjY4NiA2IDYgNnptMCAzMGMzLjMxNCAwIDYtMi42ODYgNi02cy0yLjY4Ni02LTYtNmMtMy4zMTQgMC02IDIuNjg2LTYgNnMyLjY4NiA2IDYgNnptLTMwLTE4YzMuMzE0IDAgNi0yLjY4NiA2LTZzLTIuNjg2LTYtNi02Yy0zLjMxNCAwLTYgMi42ODYtNiA2czIuNjg2IDYgNiA2eiIgc3Ryb2tlPSIjZmZmZmZmIiBzdHJva2Utb3BhY2l0eT0iLjA1Ii8+PC9nPjwvc3ZnPg==')] opacity-20"></div>
      </div>

      {/* 🔥 FIX: Added heavy explicit top margin (pt-32 md:pt-48) to push content down safely */}
      <div className="container relative z-20 px-4 md:px-6 pt-32 md:pt-48">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <div className="inline-block rounded-full bg-white/20 backdrop-blur-sm px-4 py-1.5 text-sm font-bold tracking-widest uppercase text-white shadow-lg">
              Success Stories
            </div>
            <h2 className="text-3xl font-black tracking-tighter text-white drop-shadow-sm sm:text-4xl md:text-5xl mt-2">
              Hear From Our{" "}
              <span className="bg-gradient-to-r from-green-200 to-emerald-100 bg-clip-text text-transparent">
                Scholars
              </span>
            </h2>
            <p className="max-w-[900px] text-green-100 font-medium md:text-xl/relaxed mt-4">
              Our scholarship program has helped hundreds of students achieve their dreams.
            </p>
          </div>
        </div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 py-12 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="group relative flex flex-col rounded-2xl bg-white/10 backdrop-blur-md shadow-xl border border-white/20 p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:bg-white/15"
            >
              <div className="relative flex h-full flex-col z-10">
                <div className="absolute -top-3 -left-1 text-6xl text-white/30 font-serif leading-none">"</div>

                <div className="mb-4 flex relative z-10">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="text-amber-400 drop-shadow-sm"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ))}
                </div>

                <p className="flex-1 text-green-50 font-medium relative z-10 italic">"{testimonial.quote}"</p>

                <div className="mt-6 flex items-center space-x-4 relative z-10 border-t border-white/10 pt-4">
                  <div className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-emerald-200/50 shadow-sm shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-300/50 to-emerald-200/50"></div>
                    <img
                      src={`/placeholder.svg?height=48&width=48&text=${testimonial.name.charAt(0)}`}
                      alt={testimonial.name}
                      className="relative h-full w-full object-cover z-10"
                    />
                  </div>
                  <div>
                    <h4 className="font-black text-white">{testimonial.name}</h4>
                    <p className="text-xs font-bold uppercase tracking-widest text-emerald-300">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom white wave waving up into the green background */}
      <div className="absolute bottom-0 left-0 right-0 leading-none z-10 h-[80px] sm:h-[120px] md:h-[160px]">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full h-full block" preserveAspectRatio="none">
          <path fill="#ffffff" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,202.7C672,203,768,181,864,181.3C960,181,1056,203,1152,197.3C1248,192,1344,160,1392,144L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>
    </section>
  )
}

const testimonials = [
  {
    name: "Maria Santos",
    role: "Computer Science Student",
    quote:
      "The scholarship program changed my life. I was able to focus on my studies without worrying about finances.",
  },
  {
    name: "Juan Dela Cruz",
    role: "Engineering Graduate",
    quote: "Thanks to this scholarship, I graduated with honors and secured a job at a top engineering firm.",
  },
  {
    name: "Ana Reyes",
    role: "Medical Student",
    quote:
      "The mentorship program connected me with professionals in my field who guided me through my academic journey.",
  },
]
