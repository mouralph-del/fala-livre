export const learningScenes = {
  learn: 'school', communication: 'message', words: 'reading',
  writing: 'writing', keyboard: 'writing', notebook: 'writing',
  myDay: 'village', myDayRoutines: 'indoor', myDayCommunication: 'message',
  myDayEmotions: 'emotions', situations: 'village',
}
export function hasLearningLandscape(activity) { return Object.hasOwn(learningScenes, activity) }
