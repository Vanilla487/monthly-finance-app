export function parse(fileContent) {
  const lines = fileContent.trim().split('\n')
  return lines.map((line) => {
    const [date, rawDescription, amountStr, direction] = line.split(',')
    return {
      date,
      rawDescription,
      amount: Math.abs(parseFloat(amountStr)),
      isOutflow: direction === 'out'
    }
  })
}