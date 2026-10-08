import LearningLandscape from './LearningLandscape'
import InterfaceIcon from './InterfaceIcon'
import './CarePages.css'

export default function CareLandscape({ activity }) {
  const icon = { plans: 'crown', progress: 'checklist', responsibleGuidance: 'book', signIn: 'home', createAccount: 'home', profile: 'checklist' }[activity]
  return <>
    <LearningLandscape activity="care" />
    <div className="care-scene-symbol" data-care-scene={activity} aria-hidden="true">
      {activity === 'profile' ? <svg className="interface-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" focusable="false"><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="3" />{[0,45,90,135,180,225,270,315].map(angle=><path key={angle} d="M12 1V5" transform={`rotate(${angle} 12 12)`} strokeWidth="4" />)}</svg> : ['signIn', 'createAccount'].includes(activity) ? <svg className="interface-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" focusable="false"><circle cx="8" cy="8" r="5" /><path d="m12 12 9 9M17 17l3-3M20 20l3-3" /></svg> : <InterfaceIcon name={icon} />}
    </div>
  </>
}
