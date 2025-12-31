export type Month = "Jan" | "Feb" | "Mar" | "Apr" | "May" | "Jun" | "Jul" | "Aug" | "Sep" | "Oct" | "Nov" | "Dec"

export type Date = { day: number, month: Month, year: number }

export const months: Month[] = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
]

export const MonthDays: Record<Month, number> = {
  "Jan": 31,
  "Feb": 28, // 29 on leap years
  "Mar": 31,
  "Apr": 30,
  "May": 31,
  "Jun": 30,
  "Jul": 31,
  "Aug": 31,
  "Sep": 30,
  "Oct": 31,
  "Nov": 30,
  "Dec": 31
}

export const nextDay = (date: Date): Date => {
  let { day, month, year } = date

  day += 1
  if (day > MonthDays[month]) {
    day = 1
    const monthIndex = months.indexOf(month)
    if (monthIndex === 11) {
      month = "Jan"
      year += 1
    } else {
      month = months[monthIndex + 1]
    }
  }

  return { day, month, year }
}
