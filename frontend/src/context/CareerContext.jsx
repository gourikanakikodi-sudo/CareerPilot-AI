/**
 * CareerContext — single source of truth for all career data across modules.
 * Fetches GET /api/career-context/ on mount and whenever refresh() is called.
 * Components consume: useCareer() hook.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import api from '../services/api'
import { useAuth } from './AuthContext'

const CareerContext = createContext(null)

export function CareerProvider({ children }) {
  const { user } = useAuth()
  const [context, setContext] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const fetchedRef = useRef(false)

  const fetchContext = useCallback(async (force = false) => {
    if (!user) return
    if (fetchedRef.current && !force) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/career-context/')
      setContext(res.data)
      fetchedRef.current = true
      // Keep resume_id in sync for legacy localStorage usage
      if (res.data?.resume?.id) {
        localStorage.setItem('resume_id', res.data.resume.id)
      }
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to load career context.')
    } finally {
      setLoading(false)
    }
  }, [user])

  // Refresh after a resume upload or analysis triggers downstream changes
  const refresh = useCallback(() => fetchContext(true), [fetchContext])

  useEffect(() => {
    if (user) {
      fetchedRef.current = false
      fetchContext()
    } else {
      setContext(null)
      fetchedRef.current = false
    }
  }, [user, fetchContext])

  const value = useMemo(() => ({
    context,
    loading,
    error,
    refresh,
    // Convenience accessors
    resume: context?.resume ?? null,
    analysis: context?.latest_analysis ?? null,
    atsScore: context?.latest_analysis?.ats_score ?? 0,
    resumeScore: context?.latest_analysis?.resume_rating ?? 0,
    roadmap: context?.roadmap ?? null,
    skillGap: context?.skill_gap ?? null,
    coding: context?.coding ?? { total: 0, accepted: 0, acceptance_rate: 0 },
    interviews: context?.interviews ?? [],
    latestFeedback: context?.latest_feedback ?? null,
    jobMatches: context?.job_matches ?? [],
    missingSkills: context?.skill_gap?.missing_skills
      ? context.skill_gap.missing_skills.split(',').map((s) => s.trim()).filter(Boolean)
      : context?.latest_analysis?.missing_skills
        ? context.latest_analysis.missing_skills.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
  }), [context, loading, error, refresh])

  return <CareerContext.Provider value={value}>{children}</CareerContext.Provider>
}

export function useCareer() {
  const ctx = useContext(CareerContext)
  if (!ctx) throw new Error('useCareer must be used inside CareerProvider')
  return ctx
}
