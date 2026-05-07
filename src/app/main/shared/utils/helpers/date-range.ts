export class DateRange {
  constructor(
    public readonly start: Date,
    public readonly end: Date
  ) {
    if (end < start) throw new Error("End date cannot be earlier than start date");
  }

  contains(date: Date): boolean {
    return date >= this.start && date <= this.end;
  }

  isActive(now: Date = new Date()): boolean {
    return now >= this.start && now <= this.end;
  }
}
