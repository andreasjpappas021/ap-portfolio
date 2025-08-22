import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ExternalLink, Mail, Play, User } from "lucide-react"
import Image from "next/image"

export default function ResumePage() {
  const projects = [
    {
      title: "What's New: Feature Updates",
      problem: "Users didn't understand how observed vs. forecasted data differed.",
      outcome: "Executed monthly GTM strategy, achieved 90% audience reach, increased NPS by 15%.",
      demoUrl: "#",
      detailsUrl: "#",
      imageUrl: "/placeholder.svg?height=400&width=300",
      tags: ["Product Strategy", "User Experience", "Analytics"],
    },
    {
      title: "Premium Content Format Redesign",
      problem: "Static forecaster posts lacked reach and engagement.",
      outcome: "+50% WAU on Premium content and +1,150% free user conversions.",
      demoUrl: "#",
      detailsUrl: "#",
      imageUrl: "/placeholder.svg?height=400&width=300",
      tags: ["Content Strategy", "Conversion Optimization", "Design"],
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-white">Andreas Pappas</span>
            </div>
            <div className="flex items-center space-x-6">
              <a href="#projects" className="text-slate-300 hover:text-white transition-colors">
                Projects
              </a>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center space-x-2 border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <Mail className="w-4 h-4" />
                <span>Contact</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge variant="secondary" className="w-fit bg-slate-800 text-slate-300 border-slate-700">
                  Product Manager
                </Badge>
                <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight">Andreas Pappas</h1>
                <p className="text-xl text-slate-300 leading-relaxed">
                  Product Manager crafting data-driven experiences that users love
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <span>View Projects</span>
                  <ExternalLink className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="flex items-center space-x-2 border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  <Mail className="w-4 h-4" />
                  <span>Get in Touch</span>
                </Button>
              </div>
            </div>

            {/* Video Section */}
            <div className="relative">
              <div className="aspect-video bg-slate-800 rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
                <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center">
                  <Button
                    size="lg"
                    className="rounded-full w-16 h-16 p-0 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Play className="w-6 h-6 ml-1" />
                  </Button>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full opacity-20"></div>
              <div className="absolute -top-4 -left-4 w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full opacity-20"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-20 px-6 bg-slate-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <Badge variant="outline" className="w-fit mx-auto border-slate-600 text-slate-300">
              Featured Work
            </Badge>
            <h2 className="text-4xl font-bold text-white">Featured Projects</h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              A showcase of impactful product initiatives that drove measurable business results
            </p>
          </div>

          <div className="grid gap-8">
            {projects.map((project, index) => (
              <Card
                key={index}
                className="overflow-hidden border border-slate-700 bg-slate-800/50 backdrop-blur-sm shadow-2xl hover:shadow-3xl hover:border-slate-600 transition-all duration-300"
              >
                <div className="grid lg:grid-cols-2 gap-0">
                  <div className="relative aspect-[4/3] lg:aspect-auto">
                    <Image
                      src={project.imageUrl || "/placeholder.svg"}
                      alt={project.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent"></div>
                  </div>
                  <div className="p-8 lg:p-12 flex flex-col justify-center">
                    <CardHeader className="p-0 space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {project.tags.map((tag, tagIndex) => (
                          <Badge
                            key={tagIndex}
                            variant="secondary"
                            className="text-xs bg-slate-700 text-slate-300 border-slate-600"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <CardTitle className="text-2xl lg:text-3xl text-white">{project.title}</CardTitle>
                    </CardHeader>

                    <CardContent className="p-0 space-y-6 mt-6">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-white mb-2">Problem</h4>
                          <p className="text-slate-300 leading-relaxed">{project.problem}</p>
                        </div>

                        <div>
                          <h4 className="font-semibold text-white mb-2">Outcome</h4>
                          <p className="text-slate-300 leading-relaxed">{project.outcome}</p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <Button className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                          <Play className="w-4 h-4" />
                          <span>View Demo</span>
                        </Button>
                        <Button
                          variant="outline"
                          className="flex items-center space-x-2 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>Details</span>
                        </Button>
                      </div>
                    </CardContent>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent"></div>
        <div className="max-w-4xl mx-auto text-center space-y-8 relative">
          <h2 className="text-4xl font-bold text-white">Let's Build Something Amazing Together</h2>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Ready to discuss your next product challenge? I'd love to hear about your vision and explore how we can
            bring it to life.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              className="flex items-center space-x-2 bg-white text-blue-600 hover:bg-slate-100"
            >
              <Mail className="w-4 h-4" />
              <span>Start a Conversation</span>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-blue-600 transition-colors"
            >
              Download Resume
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-slate-950 border-t border-slate-800">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-white">Andreas Pappas</span>
          </div>
          <p className="text-slate-400">
            © {new Date().getFullYear()} Andreas Pappas. Crafting exceptional product experiences.
          </p>
        </div>
      </footer>
    </div>
  )
}
