import { request } from '@/features/app-data/api'
import type { ProfilePatchRequest, ProfileResponse } from './models'
import { profilePatchRequestSchema, profileResponseSchema } from './models'

export async function fetchProfileState(signal?: AbortSignal) {
  return profileResponseSchema.parse(
    await request<ProfileResponse>({
      meta: {
        feature: 'profile',
        operation: 'profile-state',
      },
      method: 'GET',
      path: '/profile',
      signal,
    }),
  )
}

export async function patchProfile(patch: ProfilePatchRequest) {
  return profileResponseSchema.parse(
    await request<ProfileResponse, ProfilePatchRequest>({
      body: profilePatchRequestSchema.parse(patch),
      meta: {
        feature: 'profile',
        operation: 'patch-profile',
        redactKeys: ['email', 'iban', 'name', 'nif', 'phoneNumber'],
      },
      method: 'PATCH',
      path: '/profile',
    }),
  )
}
