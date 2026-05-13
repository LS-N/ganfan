import { manipulateAsync, SaveFormat } from "expo-image-manipulator"

export async function prepareMealImage(uri: string) {
  if (uri.startsWith("mock://")) return uri
  const result = await manipulateAsync(uri, [], {
    compress: 0.72,
    format: SaveFormat.JPEG
  })
  return result.uri
}
