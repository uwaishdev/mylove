export interface ProposalResponses {
  bestMemory: string;
  dreamDestination: string;
  cuteHabit: string;
  ourSong: string;
  finalMessage: string;
}

export interface AppConfig {
  girlfriendName: string;
  yourName: string;
  welcomeMessage: string;
  surpriseMessage: string;
  thankYouMessage: string;
  googleAppsScriptUrl?: string;
  adminPin?: string;
  hasGoogleScriptUrl?: boolean;
}

export interface StoredResponse {
  id: string;
  submissionId: string;
  submissionDate: string;
  timestamp: string;
  girlfriendName: string;
  bestMemory: string;
  dreamDestination: string;
  cuteHabit: string;
  ourSong: string;
  finalMessage: string;
  status: string;
  forwardedToSheets?: boolean;
}
