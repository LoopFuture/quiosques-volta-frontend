import { request } from '@/features/app-data/api'
import type {
  ProfilePatchApiRequest,
  ProfilePatchRequest,
  ProfileResponse,
} from './models'
import { profileResponseSchema, serializeProfilePatchRequest } from './models'

export async function fetchProfileState(signal?: AbortSignal) {
  return profileResponseSchema.parse(
    await request<ProfileResponse>({
      meta: {
        feature: 'profile',
        operation: 'profile-state',
      },
      method: 'GET',
      path: '/api/v1/profile',
      signal,
    }),
  )
}

export async function patchProfile(patch: ProfilePatchRequest) {
  return profileResponseSchema.parse(
    await request<ProfileResponse, ProfilePatchApiRequest>({
      body: serializeProfilePatchRequest(patch),
      meta: {
        feature: 'profile',
        operation: 'patch-profile',
        redactKeys: [
          'accountHolderName',
          'email',
          'fullName',
          'iban',
          'name',
          'nif',
          'phoneNumber',
        ],
      },
      method: 'PATCH',
      path: '/api/v1/profile',
    }),
  )
}

export async function deleteProfileAccount() {
  await request<void>({
    meta: {
      feature: 'profile',
      operation: 'delete-account',
    },
    method: 'DELETE',
    path: '/api/v1/profile/account',
  })
}
