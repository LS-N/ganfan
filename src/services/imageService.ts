import { manipulateAsync, SaveFormat } from "expo-image-manipulator"

export async function prepareMealImage(uri: string, size?: { width?: number; height?: number }) {
  if (uri.startsWith("mock://")) return uri
  const resize = getResizeAction(size)
  const result = await manipulateAsync(uri, [], {
    compress: 0.65,
    format: SaveFormat.JPEG
  })
  if (!resize) return result.uri
  const resized = await manipulateAsync(result.uri, [resize], {
    compress: 0.65,
    format: SaveFormat.JPEG
  })
  return resized.uri
}

function getResizeAction(size?: { width?: number; height?: number }) {
  const width = size?.width ?? 0
  const height = size?.height ?? 0
  if (!width || !height) return undefined
  if (Math.max(width, height) <= 480) return undefined
  return width >= height ? { resize: { width: 480 } } : { resize: { height: 480 } }
}
