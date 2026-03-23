import type { ProfilePatchRequest } from '@/features/profile/models'
import { waitForMockApi } from './delay'
import { patchProfileResponse, readProfileResponse } from './state'

export async function getMockProfileState() {
  await waitForMockApi()

  return readProfileResponse()
}

export async function patchMockProfile(patch: ProfilePatchRequest) {
  await waitForMockApi()

  return patchProfileResponse(patch)
}
