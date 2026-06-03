/**
 * 日历事件集成模块
 * 支持生成 ICS 文件（可用于导入 Google Calendar、Outlook、Apple Calendar 等）
 */

import { logger } from './logger';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startTime: Date;
  endTime: Date;
  organizer?: {
    name: string;
    email: string;
  };
  attendees?: Array<{
    name: string;
    email: string;
  }>;
  reminder?: number; // 提前提醒分钟数
}

/**
 * 生成 ICS 格式的日历事件
 */
function generateICSContent(event: CalendarEvent): string {
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const escapeICS = (str: string) => {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  };

  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TennisLink//Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.id}@tennislink.com`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${formatDate(event.startTime)}`,
    `DTEND:${formatDate(event.endTime)}`,
    `SUMMARY:${escapeICS(event.title)}`,
  ];

  if (event.description) {
    icsContent.push(`DESCRIPTION:${escapeICS(event.description)}`);
  }

  if (event.location) {
    icsContent.push(`LOCATION:${escapeICS(event.location)}`);
  }

  if (event.organizer) {
    icsContent.push(`ORGANIZER;CN=${escapeICS(event.organizer.name)}:mailto:${event.organizer.email}`);
  }

  if (event.attendees && event.attendees.length > 0) {
    event.attendees.forEach(attendee => {
      icsContent.push(`ATTENDEE;CN=${escapeICS(attendee.name)}:mailto:${attendee.email}`);
    });
  }

  if (event.reminder) {
    icsContent.push('BEGIN:VALARM');
    icsContent.push('ACTION:DISPLAY');
    icsContent.push('DESCRIPTION:Reminder');
    icsContent.push(`TRIGGER:-PT${event.reminder}M`);
    icsContent.push('END:VALARM');
  }

  icsContent.push('END:VEVENT');
  icsContent.push('END:VCALENDAR');

  return icsContent.join('\r\n');
}

/**
 * 生成 Google Calendar 链接
 */
function generateGoogleCalendarLink(event: CalendarEvent): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${event.startTime.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${event.endTime.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
  });

  if (event.description) {
    params.append('details', event.description);
  }

  if (event.location) {
    params.append('location', event.location);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * 生成 Outlook Calendar 链接
 */
function generateOutlookCalendarLink(event: CalendarEvent): string {
  const params = new URLSearchParams({
    subject: event.title,
    startdt: event.startTime.toISOString(),
    enddt: event.endTime.toISOString(),
  });

  if (event.description) {
    params.append('body', event.description);
  }

  if (event.location) {
    params.append('location', event.location);
  }

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/**
 * 日历事件管理器
 */
export class CalendarManager {
  /**
   * 创建预订日历事件
   */
  static createBookingEvent(params: {
    bookingId: string;
    userName: string;
    userEmail: string;
    coachName: string;
    venueName: string;
    venueAddress?: string;
    startTime: Date;
    endTime: Date;
    notes?: string;
  }): CalendarEvent {
    return {
      id: `booking-${params.bookingId}`,
      title: `网球课程 - ${params.coachName}`,
      description: [
        `教练: ${params.coachName}`,
        `学员: ${params.userName}`,
        params.notes ? `备注: ${params.notes}` : '',
        '',
        '---',
        'TennisLink 网球教学平台',
      ].filter(Boolean).join('\n'),
      location: params.venueAddress || params.venueName,
      startTime: params.startTime,
      endTime: params.endTime,
      organizer: {
        name: 'TennisLink',
        email: 'noreply@tennislink.com',
      },
      attendees: [
        {
          name: params.userName,
          email: params.userEmail,
        },
      ],
      reminder: 60, // 提前1小时提醒
    };
  }

  /**
   * 创建约球日历事件
   */
  static createMatchupEvent(params: {
    matchupId: string;
    creatorName: string;
    creatorEmail: string;
    venueName: string;
    venueAddress?: string;
    startTime: Date;
    endTime: Date;
    type: string;
    description?: string;
  }): CalendarEvent {
    return {
      id: `matchup-${params.matchupId}`,
      title: `约球 - ${params.venueName} (${params.type})`,
      description: [
        `发起人: ${params.creatorName}`,
        `类型: ${params.type}`,
        params.description ? `说明: ${params.description}` : '',
        '',
        '---',
        'TennisLink 网球教学平台',
      ].filter(Boolean).join('\n'),
      location: params.venueAddress || params.venueName,
      startTime: params.startTime,
      endTime: params.endTime,
      organizer: {
        name: params.creatorName,
        email: params.creatorEmail,
      },
      reminder: 30, // 提前30分钟提醒
    };
  }

  /**
   * 导出为 ICS 文件
   */
  static exportToICS(event: CalendarEvent): { content: string; filename: string } {
    const icsContent = generateICSContent(event);
    const filename = `event-${event.id}.ics`;

    logger.info('生成ICS文件', { eventId: event.id, filename });

    return { content: icsContent, filename };
  }

  /**
   * 导出多个事件为 ICS 文件
   */
  static exportMultipleToICS(events: CalendarEvent[]): { content: string; filename: string } {
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const escapeICS = (str: string) => {
      return str
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n');
    };

    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//TennisLink//Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
    ];

    events.forEach(event => {
      icsContent.push('BEGIN:VEVENT');
      icsContent.push(`UID:${event.id}@tennislink.com`);
      icsContent.push(`DTSTAMP:${formatDate(new Date())}`);
      icsContent.push(`DTSTART:${formatDate(event.startTime)}`);
      icsContent.push(`DTEND:${formatDate(event.endTime)}`);
      icsContent.push(`SUMMARY:${escapeICS(event.title)}`);

      if (event.description) {
        icsContent.push(`DESCRIPTION:${escapeICS(event.description)}`);
      }

      if (event.location) {
        icsContent.push(`LOCATION:${escapeICS(event.location)}`);
      }

      if (event.reminder) {
        icsContent.push('BEGIN:VALARM');
        icsContent.push('ACTION:DISPLAY');
        icsContent.push('DESCRIPTION:Reminder');
        icsContent.push(`TRIGGER:-PT${event.reminder}M`);
        icsContent.push('END:VALARM');
      }

      icsContent.push('END:VEVENT');
    });

    icsContent.push('END:VCALENDAR');

    const filename = `events-${new Date().toISOString().split('T')[0]}.ics`;

    logger.info('生成多个ICS文件', { eventCount: events.length, filename });

    return { content: icsContent.join('\r\n'), filename };
  }

  /**
   * 获取日历链接
   */
  static getCalendarLinks(event: CalendarEvent): {
    google: string;
    outlook: string;
    ics: string;
  } {
    return {
      google: generateGoogleCalendarLink(event),
      outlook: generateOutlookCalendarLink(event),
      ics: `data:text/calendar;charset=utf8,${encodeURIComponent(generateICSContent(event))}`,
    };
  }
}

// 便捷导出
export type { CalendarEvent };
