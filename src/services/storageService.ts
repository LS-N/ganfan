import { mockStorageService } from "./mockRepositories"
import type { StorageService } from "./repositoryTypes"
import { getSupabaseClient } from "./supabaseClient"

const mealPhotoBucket = "meal-photos"

export function createStorageService(): StorageService {
  return {
    async uploadMealPhoto(input) {
      const client = getSupabaseClient()
      if (!client || input.uri.startsWith("mock://")) return mockStorageService.uploadMealPhoto(input)

      const path = `${input.userId}/meals/${input.mealId}/${input.kind}.jpg`
      const file = await uriToBlob(input.uri)
      const { error } = await client.storage.from(mealPhotoBucket).upload(path, file, {
        contentType: "image/jpeg",
        upsert: true
      })
      if (error) return mockStorageService.uploadMealPhoto(input)

      const { data } = await client.storage.from(mealPhotoBucket).createSignedUrl(path, 60 * 10)
      return { path, url: data?.signedUrl }
    },
    async createSignedMealPhotoUrl(path, expiresInSeconds = 60 * 10) {
      const client = getSupabaseClient()
      if (!client || path.startsWith("mock://")) return mockStorageService.createSignedMealPhotoUrl(path, expiresInSeconds)

      const { data, error } = await client.storage.from(mealPhotoBucket).createSignedUrl(path, expiresInSeconds)
      if (error) return undefined
      return data?.signedUrl
    }
  }
}

async function uriToBlob(uri: string): Promise<Blob> {
  const response = await fetch(uri)
  return response.blob()
}

export const storageService = createStorageService()
