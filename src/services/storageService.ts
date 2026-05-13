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

      const { data } = client.storage.from(mealPhotoBucket).getPublicUrl(path)
      return { path, url: data.publicUrl }
    }
  }
}

async function uriToBlob(uri: string): Promise<Blob> {
  const response = await fetch(uri)
  return response.blob()
}

export const storageService = createStorageService()
