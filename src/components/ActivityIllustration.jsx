import { useSyncExternalStore } from 'react'
import { homeCharacters } from '../data/homeCharacters'
import { getPreferences, subscribePreferences } from '../utils/preferences'

export default function ActivityIllustration({ variant }) {
  const preferences = useSyncExternalStore(subscribePreferences, getPreferences)
  const key = variant === 'learn' ? 'learnCharacter' : 'gameCharacter'
  return (
    <img
      className="activity-illustration"
      src={homeCharacters[key][preferences[key]]}
      alt=""
      width="280"
      height="270"
      decoding="async"
    />
  )
}
