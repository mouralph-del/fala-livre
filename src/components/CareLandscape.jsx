import LearningLandscape from './LearningLandscape'
import InterfaceIcon from './InterfaceIcon'
import './CarePages.css'

export default function CareLandscape({ activity }) {
  const icon = { plans: 'crown', progress: 'checklist', responsibleGuidance: 'book', signIn: 'home', createAccount: 'home', profile: 'checklist' }[activity]
  return <>
    <LearningLandscape activity="care" />
    <div className="care-scene-symbol" data-care-scene={activity} aria-hidden="true"><InterfaceIcon name={icon} /></div>
  </>
}
