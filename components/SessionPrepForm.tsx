'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2 } from 'lucide-react'

export default function SessionPrepForm() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [formData, setFormData] = useState({
    questions: '',
    strengths: '',
    weaknesses: '',
    goals: '',
    challenges: '',
    context: '',
  })

  useEffect(() => {
    async function loadPrep() {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) return

        // Get user's paid purchase
        const { data: purchases } = await supabase
          .from('session_purchases')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'paid')
          .order('created_at', { ascending: false })
          .limit(1)

        if (!purchases || purchases.length === 0) return

        const purchaseId = purchases[0].id

        // Load existing prep
        const { data: prep } = await supabase
          .from('session_prep')
          .select('*')
          .eq('user_id', user.id)
          .eq('purchase_id', purchaseId)
          .single()

        if (prep) {
          // Convert questions array to string if it exists
          const questionsText = prep.questions 
            ? (Array.isArray(prep.questions) ? prep.questions.join('\n') : prep.questions)
            : ''
          setFormData({
            questions: questionsText,
            strengths: prep.strengths || '',
            weaknesses: prep.weaknesses || '',
            goals: prep.goals || '',
            challenges: prep.challenges || '',
            context: prep.context || '',
          })
          setSaved(true)
        }
      } catch (error) {
        console.error('Error loading prep:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPrep()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Not authenticated')
      }

      // Get user's paid purchase
      const { data: purchases } = await supabase
        .from('session_purchases')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'paid')
        .order('created_at', { ascending: false })
        .limit(1)

      if (!purchases || purchases.length === 0) {
        throw new Error('No paid session found')
      }

      const purchaseId = purchases[0].id

      // Split questions by newlines and filter empty ones
      const questionsArray = formData.questions
        .split('\n')
        .map((q) => q.trim())
        .filter((q) => q !== '')

      // Upsert prep data
      const { error } = await supabase.from('session_prep').upsert({
        user_id: user.id,
        purchase_id: purchaseId,
        questions: questionsArray.length > 0 ? questionsArray : null,
        strengths: formData.strengths || null,
        weaknesses: formData.weaknesses || null,
        goals: formData.goals || null,
        challenges: formData.challenges || null,
        context: formData.context || null,
        updated_at: new Date().toISOString(),
      })

      if (error) throw error

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error: any) {
      console.error('Error saving prep:', error)
      alert('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="pt-6">
          <p className="text-slate-400">Loading...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Prepare for Your Session</CardTitle>
        <CardDescription className="text-slate-400">
          Help us make the most of our time together
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Questions */}
        <div className="space-y-2">
          <Label htmlFor="questions" className="text-white font-semibold">
            Questions You'd Like to Ask (3-5 questions)
          </Label>
          <Textarea
            id="questions"
            placeholder="Enter your questions, one per line:&#10;&#10;How do I prioritize features when resources are limited?&#10;What's the best way to align stakeholders?&#10;How can I improve my product strategy?"
            value={formData.questions}
            onChange={(e) => setFormData({ ...formData, questions: e.target.value })}
            className="bg-slate-700 border-slate-600 text-white min-h-[150px]"
          />
          <p className="text-slate-400 text-sm">
            Enter one question per line. We'll discuss these during your session.
          </p>
        </div>

        {/* Strengths */}
        <div className="space-y-2">
          <Label htmlFor="strengths" className="text-white font-semibold">
            Your Strengths
          </Label>
          <Textarea
            id="strengths"
            placeholder="What are you really good at? What skills or experiences do you bring to your role?"
            value={formData.strengths}
            onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
            className="bg-slate-700 border-slate-600 text-white min-h-[100px]"
          />
        </div>

        {/* Weaknesses */}
        <div className="space-y-2">
          <Label htmlFor="weaknesses" className="text-white font-semibold">
            Areas for Growth
          </Label>
          <Textarea
            id="weaknesses"
            placeholder="What would you like to improve? What challenges are you facing?"
            value={formData.weaknesses}
            onChange={(e) => setFormData({ ...formData, weaknesses: e.target.value })}
            className="bg-slate-700 border-slate-600 text-white min-h-[100px]"
          />
        </div>

        {/* Goals */}
        <div className="space-y-2">
          <Label htmlFor="goals" className="text-white font-semibold">
            Goals & Objectives
          </Label>
          <Textarea
            id="goals"
            placeholder="What do you hope to achieve? What outcomes are you looking for from this session?"
            value={formData.goals}
            onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
            className="bg-slate-700 border-slate-600 text-white min-h-[100px]"
          />
        </div>

        {/* Challenges */}
        <div className="space-y-2">
          <Label htmlFor="challenges" className="text-white font-semibold">
            Current Challenges
          </Label>
          <Textarea
            id="challenges"
            placeholder="What obstacles or roadblocks are you facing right now?"
            value={formData.challenges}
            onChange={(e) => setFormData({ ...formData, challenges: e.target.value })}
            className="bg-slate-700 border-slate-600 text-white min-h-[100px]"
          />
        </div>

        {/* Context */}
        <div className="space-y-2">
          <Label htmlFor="context" className="text-white font-semibold">
            Additional Context
          </Label>
          <Textarea
            id="context"
            placeholder="Anything else you'd like me to know? Current projects, team dynamics, company situation, etc."
            value={formData.context}
            onChange={(e) => setFormData({ ...formData, context: e.target.value })}
            className="bg-slate-700 border-slate-600 text-white min-h-[100px]"
          />
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-3 pt-4">
          <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Prep Notes'}
          </Button>
          {saved && (
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm">Your notes have been saved</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

