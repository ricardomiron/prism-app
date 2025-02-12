import { binaryFind, generateDateItemsRange, StartEndDate } from './date-utils';

describe('Test buildDateItemsFromStartEndDates', () => {
  test('should return empty', () => {
    // Act
    expect(generateDateItemsRange([])).toEqual([]);
  });

  test('should return an array of DateItems for a 5-day range', () => {
    // Arrange
    const startDate0 = new Date('2018-02-01').getTime();
    const endDate0 = new Date('2018-02-05').getTime();
    const dateRanges: StartEndDate[] = [
      {
        startDate: startDate0,
        endDate: endDate0,
      },
    ];

    // Act
    expect(generateDateItemsRange(dateRanges)).toEqual([
      {
        displayDate: new Date('2018-02-01').getTime(),
        queryDate: startDate0,
        isStartDate: true,
      },
      {
        displayDate: new Date('2018-02-02').getTime(),
        queryDate: startDate0,
      },
      {
        displayDate: new Date('2018-02-03').getTime(),
        queryDate: startDate0,
      },
      {
        displayDate: new Date('2018-02-04').getTime(),
        queryDate: startDate0,
      },
      {
        displayDate: new Date('2018-02-05').getTime(),
        queryDate: startDate0,
        isEndDate: true,
      },
    ]);
  });
});

describe('Binary search in ordered arrays of timestamps', () => {
  test('should return the index of found element', () => {
    const arr = [
      1701160000000,
      1702160000000,
      1703160000000,
      1703460000000,
      1705160000000,
      1705395000000,
      1706160000000,
      1715160000000,
      1725160000000,
      1735160000000,
    ];
    arr.forEach((elem, i) => {
      const idx = binaryFind<number>(arr, elem, x => x);
      expect(idx).toEqual(i);
    });
    // look for missing value
    expect(binaryFind<number>(arr, 42, x => x)).toEqual(-1);
  });
});
