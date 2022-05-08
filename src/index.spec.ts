import * as expect from 'expect';
import { fetchAvailability } from './index';
import { Space } from './types';

describe('src/index', () => {
  describe('a space with no advance notice', () => {
    let space: Space;
    before(async () => {
      space = await import('../fixtures/space-with-no-advance-notice.json');
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

  describe('a space with advance notice and different opening time', () => {
    let space: Space;
    before(async () => {
      space = await import(
        '../fixtures/space-with-15-minutes-advance-notice.json'
      );
    });

    it('fetches availability for a space after the space has already opened', () => {
      const availability = fetchAvailability(
        space,
        1,
        new Date(Date.UTC(2022, 4, 10, 10, 22)),
      );

      expect(availability).toStrictEqual({
        '2022-05-10': {
          open: {
            hour: 12,
            minute: 45,
          },
          close: {
            hour: 15,
            minute: 0,
          },
        },
      });
    });

    it('fetches availability a space for next 3 days when current date is set on weekend', () => {
      const availability = fetchAvailability(
        space,
        3,
        new Date(Date.UTC(2022, 4, 8, 15, 22)),
      );

      expect(availability).toStrictEqual({
        '2022-05-08': {},
        '2022-05-09': {},
        '2022-05-10': {
          open: {
            hour: 7,
            minute: 0,
          },
          close: {
            hour: 15,
            minute: 0,
          },
        },
      });
    });
  });
});
