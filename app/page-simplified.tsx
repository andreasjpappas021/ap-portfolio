import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SimplifiedResumePage() {
  const projects = [
    {
      title: "What's New: Feature Updates",
      problem: "Users didn't understand how observed vs. forecasted data differed.",
      outcome: "Executed monthly GTM strategy, achieved 90% audience reach, increased NPS by 15%.",
      tags: ["Product Strategy", "User Experience", "Analytics"],
    },
    {
      title: "Premium Content Format Redesign",
      problem: "Static forecaster posts lacked reach and engagement.",
      outcome: "+50% WAU on Premium content and +1,150% free user conversions.",
      tags: ["Content Strategy", "Conversion Optimization", "Design"],
    },
  ]

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Simplified Navigation */}
      <nav className="sticky top-0 z-50 bg-slate-900 border-b border-slate-700 py-4">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-white">Andreas Pappas</span>
            <Button variant="outline" size="sm" className="text-slate-300 border-slate-600">
              Contact
            </Button>
          </div>
        </div>
      </nav>

      {/* Simplified Hero */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-bold text-white mb-4">Andreas Pappas</h1>
          <p className="text-xl text-slate-300 mb-8">
            Product Manager crafting data-driven experiences that users love
          </p>
          <Button className="bg-blue-600 hover:bg-blue-700">View Projects</Button>
        </div>
      </section>

      {/* Simplified Projects */}
      <section id="projects" className="py-20 px-6 bg-slate-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-white mb-12">Featured Projects</h2>

          <div className="grid gap-8">
            {projects.map((project, index) => (
              <Card key={index} className="bg-slate-800 border border-slate-700">
                <CardHeader>
                  <CardTitle className="text-2xl text-white">{project.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-white mb-2">Problem</h4>
                    <p className="text-slate-300">{project.problem}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Outcome</h4>
                    <p className="text-slate-300">{project.outcome}</p>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button className="bg-blue-600 hover:bg-blue-700">View Demo</Button>
                    <Button variant="outline" className="border-slate-600 text-slate-300">
                      Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Simplified Footer */}
      <footer className="py-12 px-6 bg-slate-950">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-slate-400">
            © {new Date().getFullYear()} Andreas Pappas. Crafting exceptional product experiences.
          </p>
        </div>
      </footer>
    </div>
  )
}
