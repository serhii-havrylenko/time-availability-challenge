import {
  addDays,
  addMinutes,
  differenceInMilliseconds,
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

  const weekDayToOpeningTimeMap: Record<number, OpeningTimes> = {};

  // calculate TODAY
  if (space.openingTimes[currentDay]) {
    // FIXME: open time is optional
    // FIXME: handle situations when (open || current)+noticeTime < close
    const openDateWithTZOffset = zonedTimeToUtc(
      setMinutes(
        setHours(now, space.openingTimes[currentDay].open?.hour || 0),
        space.openingTimes[currentDay].open?.minute || 0,
      ),
      space.timeZone,
    );
    const biggerDate =
      differenceInMilliseconds(openDateWithTZOffset, now) > 0
        ? openDateWithTZOffset
        : now;

    const nearestOpenTime = addMinutes(biggerDate, space.minimumNotice);

    const nearestOpenTimeRounded = addMinutes(
      nearestOpenTime,
      ROUND_TO_MINUTES -
        (nearestOpenTime.getMinutes() % ROUND_TO_MINUTES || 15),
    );

    const nearestOpenTimeInTZ = utcToZonedTime(
      nearestOpenTimeRounded,
      space.timeZone,
    );

    const closeDateWithTZOffset = zonedTimeToUtc(
      setMinutes(
        setHours(now, space.openingTimes[currentDay].close?.hour || 0),
        space.openingTimes[currentDay].close?.minute || 0,
      ),
      space.timeZone,
    );

    if (
      differenceInMilliseconds(nearestOpenTimeRounded, closeDateWithTZOffset) >=
      0
    ) {
      // if the nearest open time is bigger than close time then do not set it as available
      weekDayToOpeningTimeMap[0] = {};
    } else {
      weekDayToOpeningTimeMap[0] = {
        open: {
          hour: nearestOpenTimeInTZ.getHours(),
          minute: nearestOpenTimeInTZ.getMinutes(),
        },
        close: space.openingTimes[currentDay].close,
      };
    }
  } else {
    weekDayToOpeningTimeMap[0] = {};
  }

  // FIXME: avoid extra variables
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

  const result: AvailabilityCalendar = {
    [format(now, 'yyyy-MM-dd')]: weekDayToOpeningTimeMap[0],
  };
  for (let i = 1; i < numberOfDays; i++) {
    const availabilityDate = addDays(now, i);
    const formattedDate = format(availabilityDate, 'yyyy-MM-dd');
    const dayOfTheWeek = getDayOfWeek(availabilityDate);

    result[formattedDate] = weekDayToOpeningTimeMap[dayOfTheWeek];
  }

  return result;
};
