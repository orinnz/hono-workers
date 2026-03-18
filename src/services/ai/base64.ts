export function arrayBufferToBase64(arrayBuffer: ArrayBuffer): string {
  let binary = ''
  const bytes = new Uint8Array(arrayBuffer)

  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary)
}
