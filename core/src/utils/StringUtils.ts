export const wrapText = (text: string, maxChars: number): string => {
  const words = text.split(" ")
  const lines: string[] = []
  let line = ""

  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (next.length > maxChars) {
      lines.push(line || word)
      line = line ? word : ""
    } else {
      line = next
    }
  }

  if (line.length) {
    lines.push(line)
  }

  return lines.join("\n")
}
