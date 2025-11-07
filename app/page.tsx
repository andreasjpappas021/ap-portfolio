import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ExternalLink, Mail, Play, User, Linkedin, Phone } from "lucide-react"
import Image from "next/image"

export default function ResumePage() {
  const projects = [
    {
      title: "Helping users discover and love new features, every month.",
      problem: [
        [
          "Users fixated on what Surfline got wrong, rarely noticing improvements",
          "New features often went unseen, fueling negative sentiment and missed adoption opportunities"
        ],
      ],
      decision: [
        [
          "Partnered with engineering to roadmap + sequence monthly thematic releases",
          "Equipped marketing with launch narratives and analytics",
        ],
      ],
      impact: [
        "📈 90% audience reach",
        "📊 Increased NPS by 15%",
      ],
      demoUrl: "https://www.surfline.com/lp/whatsnew/home",
      detailsUrl: "/projects/feature-updates",
      imageUrl: "/images/Group 3206.png",
      tags: ["Product Strategy", "GTM", "Growth"],
    },
    {
      title: "Turning outdated reports into a premium growth engine.",
      problem: [
        "Proprietary forecaster content was an outdated and low impact feature:",
        [
          "Engagement stuck at ~3 days/month per user",
		      "Free users had no reason to upgrade",
        ],
      ],
      decision: [
        [
        "Redesigned content for ease of use and increased engagement",
        "Modernized CMS to reduce operational overhead",
        "Coordinated marketing release for awarenesss and education",
        ],
      ],
      impact: [
        "📈 +50% WAU on Premium Analysis",
        "💎 +1,150% Free-to-Premium conversions",
        "📊 Days per month usage increased by 50%"
      ],
      demoUrl: "https://www.surfline.com/lp/whatsnew/releases/jan-25",
      detailsUrl: "/projects/premium-content",
      imageUrl: "/images/days to watch2.png",
      tags: ["Content Strategy", "Merchendizing", "Multi-system", "User Experience"],
    },
    {
      title: 'Boosting trust and engagement with real time data.',
      problem: 'Lack of user trust in forecasts when observed data was better.',
      decision: 'Expanded weather station coverage + changed algorithm to overlay observed surf heights.',
      impact: [
        '📈 +244% DAU',
        '🌍 +30% traffic to real-time obs areas',
        '📉 -10% CS tickets about inaccurate surf',
      ],
      demoUrl: 'https://www.surfline.com/lp/whatsnew/releases/apr-25',
      detailsUrl: '/projects/live-data-expansion',
      imageUrl: '/images/Now Observed3.png',
      tags: ['Product Strategy', 'Data', 'Growth','Machine Learning'],
    },
    {
      title: 'Refactoring Event Data into a Self-Serve Platform.',
      problem: [
        [
        'Event tracking was inconsistent across platforms (iOS, Android, Web).',
        'Duplicated/noisy data inflated costs and made analytics unreliable.',
        'Teams relied too much on Strategy/Data Science for basic answers.',
        ]
      ],
      decision: [
        [
        'Refactored API contracts + standardized event data across platforms.',
        'Removed redudant/immaterial events.',
        'Built dimensional user tables + dashboards for self-serve analytics.',
        'Documented events + created data dictionary for org-wide alignment.',
        ]
      ],
      impact: [
        '💰 $100k annual cost savings',
        '📉 -80% reduction in event volume',
        '📈 50% feature adoption rate from new event-driven marketing automation',
        '🙌 Empowered teams to self-serve → reduced analytics requests'
      ],
      imageUrl: '/images/Frame 4353.png',
      tags: ['Data Strategy', 'Analytics', 'Platform', 'Cost Optimization'],
    },
    {
      title: 'Bringing comfort and modern design parity with Dark Mode.',
      problem: 'App lacked modern visual parity and user expectations for dark mode.',
      decision: 'Partnered with our squad designer to upgrade the design system and executed a full-app dark mode.',
      impact: [
        '🌙 Adopted by over 50% of active users',
        '👥 Praised in the community (no more being blinded during early-morning surf checks!)'
      ],
      demoUrl: 'https://www.surfline.com/lp/whatsnew/releases/sept-24',
      detailsUrl: '/projects/dark-mode',
      imageUrl: '/images/1x1 Release Hero Aug (Img).png',
      tags: ['User Experience', 'Design'],
    }

  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-full overflow-hidden">
                <Image
                  src="/images/headshot.png"
                  alt="Andreas Pappas"
                  width={40}
                  height={40}
                  className="object-cover"
                />
              </div>
              <span className="font-semibold text-white">Andreas Pappas</span>
            </div>
            <div className="flex items-center space-x-6">
              <a href="#projects" className="text-slate-300 hover:text-white transition-colors">
                Projects
              </a>
              <a 
                href="/documents/Apappas2025.pdf" 
                download="Andreas_Pappas_Resume.pdf"
                className="text-slate-300 hover:text-white transition-colors"
              >
                Download Resume
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-10 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-7">
              <div className="space-y-3">
                <Badge variant="secondary" className="w-fit bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-slate-300 hover:border-slate-700">
                  Senior Product Manager
                </Badge>
                <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight">Andreas Pappas</h1>
                <p className="text-lg text-slate-300 leading-relaxed">
                  Crafting data-driven experiences that users love
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 items-center">
                {/* Contact Links */}
                <a
                  href="https://www.linkedin.com/in/andreasjpappas/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-slate-300 hover:text-white transition-colors text-sm"
                >
                  <Linkedin className="w-4 h-4" />
                  <span>LinkedIn</span>
                </a>
                <span className="text-slate-500">•</span> {/* Separator */}
                <a 
                  href="/documents/Apappas2025.pdf" 
                  download="Andreas_Pappas_Resume.pdf"
                  className="text-slate-400 hover:text-slate-300 transition-colors text-sm"
                >
                  Download resume for contact information
                </a>
              </div>
            </div>

            {/* Video Section */}
            <div className="relative">
              <div className="aspect-video bg-slate-800 rounded-xl overflow-hidden shadow-xl border border-slate-700">
                <video
                  className="w-full h-full object-cover"
                  controls
                  preload="metadata"
                  poster="/images/video-thumbnail.png"
                  controlsList="nofullscreen"
                  disablePictureInPicture
                >
                  <source src="/videos/portfoliointo.mov" type="video/quicktime" />
                  <source src="/videos/portfoliointo.mov" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
              <div className="absolute -bottom-3 -right-3 w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full opacity-20"></div>
              <div className="absolute -top-3 -left-3 w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full opacity-20"></div>
            </div>
          </div>
        </div>
      </section>

      {/* By the Numbers Section */}
      <section className="py-12 px-6 lg:px-24 bg-slate-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-4 mb-8">
            <Badge variant="outline" className="w-fit mx-auto border-slate-600 text-slate-300 text-base px-4 py-2">
              By the Numbers
            </Badge>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Quantified impact across key initiatives
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <h3 className="text-3xl font-bold text-white">💰 $100k</h3>
              <p className="text-slate-400 text-sm mt-1">Annual cost savings</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-white">📈 +1,150%</h3>
              <p className="text-slate-400 text-sm mt-1">Conversion lift</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-white">🌍 +244%</h3>
              <p className="text-slate-400 text-sm mt-1">DAU growth on live data</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-white">📊 +15%</h3>
              <p className="text-slate-400 text-sm mt-1">NPS increase</p>
            </div>
          </div>
        </div>
      </section>

      {/* Questions I Ask Section */}
      <section className="py-12 px-6 lg:px-24 bg-slate-900/40">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-4 mb-8">
            <Badge variant="outline" className="w-fit mx-auto border-slate-600 text-slate-300 text-base px-4 py-2">
              Stay Curious
            </Badge>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              A few of the prompts I use to guide product discovery, align stakeholders, and focus execution.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <ul className="space-y-4 text-slate-300">
              <li className="flex gap-3">
                <span className="text-blue-400">❓</span>
                What decision are we unlocking with this work?
              </li>
              <li className="flex gap-3">
                <span className="text-blue-400">📊</span>
                How will we measure success?
              </li>
              <li className="flex gap-3">
                <span className="text-blue-400">🧪</span>
                What could falsify our assumption before we build?
              </li>
              <li className="flex gap-3">
                <span className="text-blue-400">⚖️</span>
                What gets worse if we ship this?
              </li>
            </ul>
            <ul className="space-y-4 text-slate-300">
              <li className="flex gap-3">
                <span className="text-blue-400">🔬</span>
                What's the smallest test that would show if this matters to users?
              </li>
              <li className="flex gap-3">
                <span className="text-blue-400">⚡</span>
                If this fails, how will we know quickly?
              </li>
              <li className="flex gap-3">
                <span className="text-blue-400">👥</span>
                Who needs to be in the loop to make this succeed?
              </li>
              <li className="flex gap-3">
                <span className="text-blue-400">☕</span>
                Did I have enough coffee before this meeting?
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-8 px-6 lg:px-24 bg-slate-800/50">
        <div className="mx-auto">
          <div className="text-center space-y-4 mb-12">
            <Badge variant="outline" className="w-fit mx-auto border-slate-600 text-slate-300 text-base px-4 py-2">
              Proof
            </Badge>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Impactful product initiatives that drove measurable business results
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
                      <CardTitle className="text-2xl lg:text-3xl text-white">{project.title}</CardTitle>
                    </CardHeader>

                    <CardContent className="p-0 space-y-6 mt-6">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-white mb-2">Problem</h4>
                          {Array.isArray(project.problem) ? (
                            project.problem.map((block, blockIndex) => (
                              Array.isArray(block) ? (
                                <ul key={blockIndex} className="list-disc text-slate-300 leading-relaxed ml-4">
                                  {block.map((item, itemIndex) => (
                                    <li key={itemIndex}>{item}</li>
                                  ))}
                                </ul>
                              ) : (
                                <p key={blockIndex} className="text-slate-300 leading-relaxed">{block}</p>
                              )
                            ))
                          ) : (
                            <p className="text-slate-300 leading-relaxed">{project.problem}</p>
                          )}
                        </div>

                        <div>
                          <h4 className="font-semibold text-white mb-2">Decisions</h4>
                          {Array.isArray(project.decision) ? (
                            project.decision.map((block, blockIndex) => (
                              Array.isArray(block) ? (
                                <ul key={blockIndex} className="list-disc text-slate-300 leading-relaxed ml-4">
                                  {block.map((item, itemIndex) => (
                                    <li key={itemIndex}>{item}</li>
                                  ))}
                                </ul>
                              ) : (
                                <p key={blockIndex} className="text-slate-300 leading-relaxed">{block}</p>
                              )
                            ))
                          ) : (
                            <p className="text-slate-300 leading-relaxed">{project.decision}</p>
                          )}
                        </div>

                        <div>
                          <h4 className="font-semibold text-white mb-2">Impact</h4>
                          <ul className="list-disc text-slate-300 leading-relaxed ml-4">
                            {project.impact.map((item, itemIndex) => (
                              <li key={itemIndex}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 pt-4 justify-between items-start sm:items-center">
                        <Button
                          className="flex items-center space-x-2 bg-slate-700 text-slate-300 hover:bg-slate-600 border-slate-600"
                          asChild
                        >
                          <a href={project.demoUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4" />
                            <span>Check it out</span>
                          </a>
                        </Button>
                        <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
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
      <section className="py-20 px-6 bg-slate-800/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-slate-700/10 to-transparent"></div>
        <div className="max-w-4xl mx-auto text-center space-y-8 relative">
          <h2 className="text-4xl font-bold text-white">Let's Build Something Amazing Together</h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Ready to discuss your next product challenge? I'd love to hear about your vision and explore how we can
            bring it to life.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="flex items-center space-x-2 bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              asChild
            >
              <a href="https://www.linkedin.com/in/andreasjpappas/" target="_blank" rel="noopener noreferrer">
                <Mail className="w-4 h-4" />
                <span>Start a Conversation</span>
              </a>
            </Button>
            <Button
              size="lg"
              className="bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              asChild
            >
              <a 
                href="/documents/Apappas2025.pdf" 
                download="Andreas_Pappas_Resume.pdf"
              >
                Download Resume
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-slate-950 border-t border-slate-800">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-10 h-10 rounded-full overflow-hidden">
              <Image
                src="/images/headshot.png"
                alt="Andreas Pappas"
                width={40}
                height={40}
                className="object-cover"
              />
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
