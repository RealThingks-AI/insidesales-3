
export interface TimezoneOption {
  value: string;
  label: string;
  offset: string;
}

export const MAJOR_TIMEZONES: TimezoneOption[] = [
  { value: 'Pacific/Midway', label: '(-11:00 hours) Samoa Standard Time', offset: '-11:00' },
  { value: 'Pacific/Honolulu', label: '(-10:00 hours) Hawaii Standard Time', offset: '-10:00' },
  { value: 'America/Adak', label: '(-10:00 hours) Hawaii-Aleutian Standard Time', offset: '-10:00' },
  { value: 'America/Anchorage', label: '(-09:00 hours) Alaska Standard Time', offset: '-09:00' },
  { value: 'America/Los_Angeles', label: '(-08:00 hours) Pacific Standard Time', offset: '-08:00' },
  { value: 'America/Phoenix', label: '(-07:00 hours) Mountain Standard Time', offset: '-07:00' },
  { value: 'America/Denver', label: '(-07:00 hours) Mountain Standard Time', offset: '-07:00' },
  { value: 'America/Chicago', label: '(-06:00 hours) Central Standard Time', offset: '-06:00' },
  { value: 'America/Mexico_City', label: '(-06:00 hours) Central Standard Time', offset: '-06:00' },
  { value: 'America/New_York', label: '(-05:00 hours) Eastern Standard Time', offset: '-05:00' },
  { value: 'America/Toronto', label: '(-05:00 hours) Eastern Standard Time', offset: '-05:00' },
  { value: 'America/Caracas', label: '(-04:00 hours) Venezuela Time', offset: '-04:00' },
  { value: 'America/Halifax', label: '(-04:00 hours) Atlantic Standard Time', offset: '-04:00' },
  { value: 'America/Sao_Paulo', label: '(-03:00 hours) Brasilia Time', offset: '-03:00' },
  { value: 'America/Buenos_Aires', label: '(-03:00 hours) Argentina Time', offset: '-03:00' },
  { value: 'America/St_Johns', label: '(-03:30 hours) Newfoundland Standard Time', offset: '-03:30' },
  { value: 'Atlantic/South_Georgia', label: '(-02:00 hours) South Georgia Time', offset: '-02:00' },
  { value: 'Atlantic/Azores', label: '(-01:00 hours) Azores Time', offset: '-01:00' },
  { value: 'UTC', label: '(+00:00 hours) Coordinated Universal Time', offset: '+00:00' },
  { value: 'Europe/London', label: '(+00:00 hours) Greenwich Mean Time', offset: '+00:00' },
  { value: 'Africa/Casablanca', label: '(+01:00 hours) Western European Time', offset: '+01:00' },
  { value: 'Europe/Berlin', label: '(+01:00 hours) Central European Time', offset: '+01:00' },
  { value: 'Europe/Paris', label: '(+01:00 hours) Central European Time', offset: '+01:00' },
  { value: 'Europe/Rome', label: '(+01:00 hours) Central European Time', offset: '+01:00' },
  { value: 'Europe/Athens', label: '(+02:00 hours) Eastern European Time', offset: '+02:00' },
  { value: 'Africa/Cairo', label: '(+02:00 hours) Egypt Standard Time', offset: '+02:00' },
  { value: 'Africa/Johannesburg', label: '(+02:00 hours) South Africa Standard Time', offset: '+02:00' },
  { value: 'Europe/Moscow', label: '(+03:00 hours) Moscow Standard Time', offset: '+03:00' },
  { value: 'Asia/Riyadh', label: '(+03:00 hours) Arabia Standard Time', offset: '+03:00' },
  { value: 'Asia/Tehran', label: '(+03:30 hours) Iran Standard Time', offset: '+03:30' },
  { value: 'Asia/Dubai', label: '(+04:00 hours) Gulf Standard Time', offset: '+04:00' },
  { value: 'Asia/Kabul', label: '(+04:30 hours) Afghanistan Time', offset: '+04:30' },
  { value: 'Asia/Karachi', label: '(+05:00 hours) Pakistan Standard Time', offset: '+05:00' },
  { value: 'Asia/Kolkata', label: '(+05:30 hours) India Standard Time', offset: '+05:30' },
  { value: 'Asia/Kathmandu', label: '(+05:45 hours) Nepal Time', offset: '+05:45' },
  { value: 'Asia/Dhaka', label: '(+06:00 hours) Bangladesh Standard Time', offset: '+06:00' },
  { value: 'Asia/Bangkok', label: '(+07:00 hours) Indochina Time', offset: '+07:00' },
  { value: 'Asia/Shanghai', label: '(+08:00 hours) China Standard Time', offset: '+08:00' },
  { value: 'Asia/Tokyo', label: '(+09:00 hours) Japan Standard Time', offset: '+09:00' },
  { value: 'Asia/Seoul', label: '(+09:00 hours) Korea Standard Time', offset: '+09:00' },
  { value: 'Australia/Adelaide', label: '(+09:30 hours) Australian Central Standard Time', offset: '+09:30' },
  { value: 'Australia/Sydney', label: '(+10:00 hours) Australian Eastern Standard Time', offset: '+10:00' },
  { value: 'Australia/Brisbane', label: '(+10:00 hours) Australian Eastern Standard Time', offset: '+10:00' },
  { value: 'Pacific/Guam', label: '(+10:00 hours) Chamorro Standard Time', offset: '+10:00' },
  { value: 'Pacific/Norfolk', label: '(+11:00 hours) Norfolk Time', offset: '+11:00' },
  { value: 'Pacific/Auckland', label: '(+12:00 hours) New Zealand Standard Time', offset: '+12:00' },
  { value: 'Pacific/Fiji', label: '(+12:00 hours) Fiji Time', offset: '+12:00' },
  { value: 'Pacific/Tongatapu', label: '(+13:00 hours) Tonga Time', offset: '+13:00' },
];

export const getUserTimezone = (): string => {
  try {
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    console.log('Detected user timezone:', userTimezone);
    
    // Check if user's timezone matches any of our major timezones
    const matchingTimezone = MAJOR_TIMEZONES.find(tz => tz.value === userTimezone);
    
    if (matchingTimezone) {
      console.log('Found exact match:', matchingTimezone);
      return userTimezone;
    }
    
    // If no exact match, try to find a similar one based on offset and location
    const now = new Date();
    const userOffset = -now.getTimezoneOffset() / 60;
    console.log('User offset in hours:', userOffset);
    
    // For India, specifically look for IST if offset matches
    if (userOffset === 5.5) {
      const istTimezone = MAJOR_TIMEZONES.find(tz => tz.value === 'Asia/Kolkata');
      if (istTimezone) {
        console.log('Setting timezone to IST for +5:30 offset');
        return istTimezone.value;
      }
    }
    
    // Find timezone with closest offset
    const closestTimezone = MAJOR_TIMEZONES.reduce((closest, tz) => {
      const tzOffset = parseFloat(tz.offset.replace(':', '.').replace('+', ''));
      const currentOffset = parseFloat(closest.offset.replace(':', '.').replace('+', ''));
      
      return Math.abs(tzOffset - userOffset) < Math.abs(currentOffset - userOffset) ? tz : closest;
    });
    
    console.log('Selected closest timezone:', closestTimezone);
    return closestTimezone.value;
  } catch (error) {
    console.error('Error detecting user timezone:', error);
    // Default to UTC if detection fails
    return 'UTC';
  }
};
