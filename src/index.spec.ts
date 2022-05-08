import * as expect from 'expect';
import { fetchAvailability } from './index';
import { Space } from './types';

describe('src/index', () => {
  describe('a space with no advance notice', () => {
    let space: Space;
    before(async () => {
      space = await import('../fixtures/space-with-no-advance-notice.json');
    });

    it('should return empty list if numberOfDays is 0', () => {
      const availability = fetchAvailability(
        space,
        0,
        new Date(Date.UTC(2020, 8, 7, 15, 22)),
      );

      expect(availability).toStrictEqual({});
    });

    it('should fetch availability for a space after the space has already opened', () => {
      const availability = fetchAvailability(
        space,
        1,
        new Date(Date.UTC(2020, 8, 7, 15, 22)),
      );

      expect(availability).toStrictEqual({
        '2020-09-07': {
          open: {
            hour: 11,
            minute: 30,
          },
          close: {
            hour: 17,
            minute: 0,
          },
        },
      });
    });

    it('should fetch availability for a space after the space has already opened and rounds to next hour', () => {
      const availability = fetchAvailability(
        space,
        1,
        new Date(Date.UTC(2020, 8, 7, 15, 48)),
      );

      expect(availability).toStrictEqual({
        '2020-09-07': {
          open: {
            hour: 12,
            minute: 0,
          },
          close: {
            hour: 17,
            minute: 0,
          },
        },
      });
    });

    it('should not return today if the nearest opening hours are behind closing hours', () => {
      const availability = fetchAvailability(
        space,
        1,
        new Date(Date.UTC(2020, 8, 7, 20, 48)),
      );

      expect(availability).toStrictEqual({
        '2020-09-07': {},
      });
    });

    it('should return unavailable if open and close time is not set for today', () => {
      const availability = fetchAvailability(
        space,
        1,
        new Date(Date.UTC(2020, 8, 6, 15, 48)),
      );

      expect(availability).toStrictEqual({
        '2020-09-06': {},
      });
    });

    it('should fetch availability for a space after the space has already opened for next 8 days', () => {
      const availability = fetchAvailability(
        space,
        8,
        new Date(Date.UTC(2022, 4, 2, 15, 22)),
      );

      expect(availability).toStrictEqual({
        '2022-05-02': {
          open: {
            hour: 11,
            minute: 30,
          },
          close: {
            hour: 17,
            minute: 0,
          },
        },
        '2022-05-03': {
          close: {
            hour: 17,
            minute: 0,
          },
          open: {
            hour: 9,
            minute: 0,
          },
        },
        '2022-05-04': {
          close: {
            hour: 17,
            minute: 0,
          },
          open: {
            hour: 9,
            minute: 0,
          },
        },
        '2022-05-05': {
          close: {
            hour: 17,
            minute: 0,
          },
          open: {
            hour: 9,
            minute: 0,
          },
        },
        '2022-05-06': {
          close: {
            hour: 17,
            minute: 0,
          },
          open: {
            hour: 9,
            minute: 0,
          },
        },
        '2022-05-07': {},
        '2022-05-08': {},
        '2022-05-09': {
          close: {
            hour: 17,
            minute: 0,
          },
          open: {
            hour: 9,
            minute: 0,
          },
        },
      });
    });
  });

  describe('a space with advance notice in 30 minutes', () => {
    let space: Space;
    before(async () => {
      space = await import(
        '../fixtures/space-with-30-minutes-advance-notice.json'
      );
    });

    it('should fetch availability for a space after the space has not opened yet', () => {
      const availability = fetchAvailability(
        space,
        1,
        new Date(Date.UTC(2022, 4, 10, 10, 28)),
      );

      expect(availability).toStrictEqual({
        '2022-05-10': {
          open: {
            hour: 9,
            minute: 0,
          },
          close: {
            hour: 17,
            minute: 0,
          },
        },
      });
    });

    it('should fetch availability for a space when the space will open in less then notice time', () => {
      const availability = fetchAvailability(
        space,
        1,
        new Date(Date.UTC(2022, 4, 10, 12, 33)),
      );

      expect(availability).toStrictEqual({
        '2022-05-10': {
          open: {
            hour: 9,
            minute: 15,
          },
          close: {
            hour: 17,
            minute: 0,
          },
        },
      });
    });

    it('should fetch availability for a space after the space has already opened and round correctly', () => {
      const availability = fetchAvailability(
        space,
        1,
        new Date(Date.UTC(2022, 4, 10, 15, 33)),
      );

      expect(availability).toStrictEqual({
        '2022-05-10': {
          open: {
            hour: 12,
            minute: 15,
          },
          close: {
            hour: 17,
            minute: 0,
          },
        },
      });
    });

    it('should fetch availability a space for next 3 days when current date is set on weekend', () => {
      const availability = fetchAvailability(
        space,
        3,
        new Date(Date.UTC(2022, 4, 8, 15, 22)),
      );

      expect(availability).toStrictEqual({
        '2022-05-08': {},
        '2022-05-09': {
          open: {
            hour: 9,
            minute: 0,
          },
          close: {
            hour: 17,
            minute: 0,
          },
        },
        '2022-05-10': {
          open: {
            hour: 9,
            minute: 0,
          },
          close: {
            hour: 17,
            minute: 0,
          },
        },
      });
    });
  });

  describe('a space with notice period in 2 days', () => {
    let space: Space;
    before(async () => {
      space = await import('../fixtures/space-with-2-days-advance-notice.json');
    });

    it('should not show the space availability for today if notice is more than one day', () => {
      const availability = fetchAvailability(
        space,
        1,
        new Date(Date.UTC(2022, 4, 10, 10, 22)),
      );

      expect(availability).toStrictEqual({
        '2022-05-10': {},
      });
    });

    it('should fetch the space availability for the third day', () => {
      const availability = fetchAvailability(
        space,
        3,
        new Date(Date.UTC(2022, 4, 10, 5, 1)),
      );

      expect(availability).toStrictEqual({
        '2022-05-10': {},
        '2022-05-11': {},
        '2022-05-12': {
          open: {
            hour: 7,
            minute: 20,
          },
          close: {
            hour: 18,
            minute: 0,
          },
        },
      });
    });

    it('should fetch the space availability for four days when the space has already opened', () => {
      const availability = fetchAvailability(
        space,
        4,
        new Date(Date.UTC(2022, 4, 10, 8, 22)),
      );

      expect(availability).toStrictEqual({
        '2022-05-10': {},
        '2022-05-11': {},
        '2022-05-12': {
          open: {
            hour: 10,
            minute: 30,
          },
          close: {
            hour: 18,
            minute: 0,
          },
        },
        '2022-05-13': {
          open: {
            hour: 9,
            minute: 48,
          },
          close: {
            hour: 17,
            minute: 15,
          },
        },
      });
    });
  });
});
