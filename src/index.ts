import {
  addDays,
  addMinutes,
  differenceInMilliseconds,
  differenceInMinutes,
  format,
  setHours,
  setMinutes,
} from 'date-fns';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';

import { AvailabilityCalendar, OpeningTimes, Space } from './types';

// get day of week starting from Monday
const getDayOfWeek = (date: Date): number => date.getDay() || 7;

// According to "Must return available times in increments of 15 minutes."
// the open hours for Today are rounded to 15 minutes interval
const ROUND_TO_MINUTES = 15;

// If an Hour or Minute property is not set in the availability object, assume that:
// - open: hour and minutes is 00:00
// - close: hour and minutes is 23:59
const calculateToday = (space: Space, now: Date): OpeningTimes => {
  const currentDay = getDayOfWeek(now);

  if (
    !space.openingTimes[currentDay]?.open ||
    !space.openingTimes[currentDay]?.close
  ) {
    return {};
  }

  const openDateWithTZOffset = zonedTimeToUtc(
    setMinutes(
      setHours(now, space.openingTimes[currentDay].open?.hour ?? 0),
      space.openingTimes[currentDay].open?.minute ?? 0,
    ),
    space.timeZone,
  );
  const closeDateWithTZOffset = zonedTimeToUtc(
    setMinutes(
      setHours(now, space.openingTimes[currentDay].close?.hour ?? 23),
      space.openingTimes[currentDay].close?.minute ?? 59,
    ),
    space.timeZone,
  );

  const nowWithNotice = addMinutes(now, space.minimumNotice);
  const diffInNowAndOpen = differenceInMinutes(
    openDateWithTZOffset,
    nowWithNotice,
  );

  let nearestOpenTimeRounded: Date = openDateWithTZOffset;
  if (diffInNowAndOpen > 0) {
    nearestOpenTimeRounded = openDateWithTZOffset;
  } else {
    nearestOpenTimeRounded = addMinutes(
      nowWithNotice,
      ROUND_TO_MINUTES - (nowWithNotice.getMinutes() % ROUND_TO_MINUTES || 15),
    );
  }

  if (differenceInMinutes(nearestOpenTimeRounded, closeDateWithTZOffset) >= 0) {
    // if the nearest open time is bigger than close time then do not set it as available
    return {};
  }

  const nearestOpenTimeInTZ = utcToZonedTime(
    nearestOpenTimeRounded,
    space.timeZone,
  );

  return {
    open: {
      hour: nearestOpenTimeInTZ.getHours(),
      minute: nearestOpenTimeInTZ.getMinutes(),
    },
    close: space.openingTimes[currentDay].close,
  };
};

const formatDateIndex = (date: Date): string => format(date, 'yyyy-MM-dd');

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

  const currentDay = getDayOfWeek(now);

  const weekDayToOpeningTimeMap: Record<number, OpeningTimes> = {
    0: calculateToday(space, now),
  };

  const calculateDates =
    numberOfDays >= 7 ? currentDay + 7 : currentDay + numberOfDays;

  for (let i = currentDay + 1; i <= calculateDates; i++) {
    const weekday = i % 7 || 7;

    if (
      space.openingTimes[weekday]?.open &&
      space.openingTimes[weekday]?.close
    ) {
      weekDayToOpeningTimeMap[weekday] = {
        open: space.openingTimes[weekday].open,
        close: space.openingTimes[weekday].close,
      };
    } else {
      weekDayToOpeningTimeMap[weekday] = {};
    }
  }

  const nowWithNotice = addMinutes(now, space.minimumNotice);

  const result: AvailabilityCalendar = {
    [formatDateIndex(now)]: weekDayToOpeningTimeMap[0],
  };
  for (let i = 1; i < numberOfDays; i++) {
    const availabilityDate = addDays(now, i);
    const dayOfTheWeek = getDayOfWeek(availabilityDate);

    result[formatDateIndex(availabilityDate)] =
      weekDayToOpeningTimeMap[dayOfTheWeek];
  }

  return result;
};
