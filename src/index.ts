import {
  addDays,
  addMinutes,
  differenceInDays,
  differenceInMinutes,
  format,
  setHours,
  setMinutes,
} from 'date-fns';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';

import { AvailabilityCalendar, OpeningTimes, Space } from './types';

// According to "Must return available times in increments of 15 minutes."
// the open hours for Today are rounded to 15 minutes interval
const ROUND_TO_MINUTES = 15;

// get day of week starting from Monday
const getDayOfWeek = (date: Date): number => date.getDay() || 7;

const formatDateIndex = (date: Date): string => format(date, 'yyyy-MM-dd');

/**
 * Calculate OpeningTimes for the current time including notice and specific date
 *
 * @param space The space to fetch the availability for
 * @param nowWithNotice The time now with the notice offset added
 * @param dayToCheck The date for which availability is calculated
 */
const calculateAvailabilityForDay = (
  space: Space,
  nowWithNotice: Date,
  dayToCheck: Date,
): OpeningTimes => {
  const differenceInDaysFromNowWithNotice = differenceInDays(
    nowWithNotice,
    dayToCheck,
  );
  if (differenceInDaysFromNowWithNotice > 0) {
    // Now with the notice time is in the future related to dayToCheck
    return {};
  }

  const weekday = getDayOfWeek(dayToCheck);
  if (
    !space.openingTimes[weekday]?.open ||
    !space.openingTimes[weekday]?.close
  ) {
    return {};
  }

  if (differenceInDaysFromNowWithNotice < 0) {
    return {
      open: space.openingTimes[weekday].open,
      close: space.openingTimes[weekday].close,
    };
  }

  // @typescript-eslint/no-non-null-assertion doesn't know about the check at line 44 and 45
  // eventually, space.openingTimes[weekday].open cannot be undefined
  /* eslint-disable @typescript-eslint/no-non-null-assertion */
  const openDateWithTZOffset = zonedTimeToUtc(
    setMinutes(
      setHours(dayToCheck, space.openingTimes[weekday].open!.hour),
      space.openingTimes[weekday].open!.minute,
    ),
    space.timeZone,
  );

  const closeDateWithTZOffset = zonedTimeToUtc(
    setMinutes(
      setHours(dayToCheck, space.openingTimes[weekday].close!.hour),
      space.openingTimes[weekday].close!.minute,
    ),
    space.timeZone,
  );
  /* eslint-enable @typescript-eslint/no-non-null-assertion */

  const nearestOpenTimeRounded =
    differenceInMinutes(openDateWithTZOffset, nowWithNotice) > 0
      ? openDateWithTZOffset
      : addMinutes(
          nowWithNotice,
          ROUND_TO_MINUTES -
            (nowWithNotice.getMinutes() % ROUND_TO_MINUTES || 15),
        );

  if (differenceInMinutes(nearestOpenTimeRounded, closeDateWithTZOffset) >= 0) {
    // if the nearest open time is bigger than close time then do not set it as available
    return {};
  }

  const nearestOpenDateInUTC = utcToZonedTime(
    nearestOpenTimeRounded,
    space.timeZone,
  );

  return {
    open: {
      hour: nearestOpenDateInUTC.getHours(),
      minute: nearestOpenDateInUTC.getMinutes(),
    },
    close: space.openingTimes[weekday].close,
  };
};

/**
 * Fetches upcoming availability for a space
 * @param space The space to fetch the availability for
 * @param numberOfDays The number of days from `now` to fetch availability for
 * @param now The time now
 */
export const fetchAvailability = (
  space: Space,
  numberOfDays: number,
  now: Date,
): AvailabilityCalendar => {
  if (numberOfDays < 1) {
    return {};
  }

  const nowWithNotice = addMinutes(now, space.minimumNotice);

  const result: AvailabilityCalendar = {};
  for (let i = 0; i < numberOfDays; i++) {
    const availabilityDate = addDays(now, i);

    result[formatDateIndex(availabilityDate)] = calculateAvailabilityForDay(
      space,
      nowWithNotice,
      availabilityDate,
    );
  }

  return result;
};
