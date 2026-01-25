import { addMonths, format, parseISO, differenceInCalendarMonths } from 'date-fns';

export const getFutureDate = (baseDateStr, monthsToAdd) => {
    const date = parseISO(baseDateStr);
    const futureDate = addMonths(date, monthsToAdd);
    return format(futureDate, 'yyyy-MM-dd');
};

export const getMonthDifference = (date1, date2) => {
    return differenceInCalendarMonths(parseISO(date1), parseISO(date2));
};
