/**
 * Calculate the number of working days between two dates (excluding weekends)
 * @param startDate - Start date of leave
 * @param endDate - End date of leave
 * @returns Number of working days
 */
export function calculateWorkingDays(startDate: string | Date, endDate: string | Date): number {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  let workingDays = 0;
  const currentDate = new Date(start);

  // Include both start and end dates
  while (currentDate <= end) {
    const dayOfWeek = currentDate.getDay();
    // 0 = Sunday, 6 = Saturday
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDays++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return workingDays;
}

/**
 * Validate leave request dates
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Error message if invalid, null if valid
 */
export function validateLeaveDates(startDate: string | Date, endDate: string | Date): string | null {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  if (start > end) {
    return 'End date must be after start date';
  }

  if (start < new Date()) {
    return 'Leave start date cannot be in the past';
  }

  return null;
}
