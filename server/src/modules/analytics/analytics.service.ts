import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Main dashboard KPIs - called on dashboard load
   */
  async getDashboardKPIs(tenantId: string) {
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);
    const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const [
      todayRevenue, lastWeekRevenue,
      todayAppointments, lastWeekAppointments,
      todayMessages, lastWeekMessages,
      totalPatients, newPatientsThisMonth,
      automationTriggered, automationConverted,
      todayNoShows,
    ] = await Promise.all([
      // Revenue
      this.prisma.payment.aggregate({
        where: { tenantId, status: 'SUCCESS', paidAt: { gte: todayStart, lte: todayEnd } },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: { tenantId, status: 'SUCCESS', paidAt: { gte: weekAgo, lte: new Date(todayStart.getTime() - 1) } },
        _sum: { amount: true },
      }),
      // Appointments
      this.prisma.appointment.count({
        where: { tenantId, scheduledAt: { gte: todayStart, lte: todayEnd } },
      }),
      this.prisma.appointment.count({
        where: { tenantId, scheduledAt: { gte: weekAgo, lte: new Date(todayStart.getTime() - 1) } },
      }),
      // WhatsApp messages
      this.prisma.message.count({
        where: { conversation: { tenantId }, createdAt: { gte: todayStart } },
      }),
      this.prisma.message.count({
        where: { conversation: { tenantId }, createdAt: { gte: weekAgo, lte: new Date(todayStart.getTime() - 1) } },
      }),
      // Patients
      this.prisma.patient.count({ where: { tenantId, deletedAt: null } }),
      this.prisma.patient.count({ where: { tenantId, deletedAt: null, createdAt: { gte: monthStart } } }),
      // Automation
      this.prisma.automationRule.aggregate({
        where: { tenantId }, _sum: { triggeredCount: true },
      }),
      this.prisma.automationRule.aggregate({
        where: { tenantId }, _sum: { convertedCount: true },
      }),
      // No-shows
      this.prisma.appointment.count({
        where: { tenantId, scheduledAt: { gte: todayStart, lte: todayEnd }, status: 'NO_SHOW' },
      }),
    ]);

    const todayRev = todayRevenue._sum.amount || 0;
    const weekAvgRev = Math.round((lastWeekRevenue._sum.amount || 0) / 7);
    const triggered = automationTriggered._sum.triggeredCount || 0;
    const converted = automationConverted._sum.convertedCount || 0;

    return {
      revenue: {
        today: todayRev,
        changePercent: weekAvgRev > 0 ? Math.round(((todayRev - weekAvgRev) / weekAvgRev) * 100) : 0,
      },
      appointments: {
        today: todayAppointments,
        changeVsLastWeek: todayAppointments - Math.round(lastWeekAppointments / 7),
        noShows: todayNoShows,
      },
      whatsapp: {
        messagesToday: todayMessages,
        changeVsLastWeek: todayMessages - Math.round(lastWeekMessages / 7),
      },
      patients: {
        total: totalPatients,
        newThisMonth: newPatientsThisMonth,
      },
      revenueEngine: {
        totalTriggered: triggered,
        totalConverted: converted,
        conversionRate: triggered > 0 ? Math.round((converted / triggered) * 100) : 0,
      },
    };
  }

  /**
   * Revenue trend - daily revenue for last N days
   */
  async getRevenueTrend(tenantId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const payments = await this.prisma.payment.findMany({
      where: { tenantId, status: 'SUCCESS', paidAt: { gte: startDate } },
      select: { amount: true, paidAt: true },
      orderBy: { paidAt: 'asc' },
    });

    // Group by date
    const daily: Record<string, number> = {};
    const current = new Date(startDate);
    while (current <= new Date()) {
      daily[current.toISOString().split('T')[0]] = 0;
      current.setDate(current.getDate() + 1);
    }

    payments.forEach(p => {
      if (p.paidAt) {
        const key = p.paidAt.toISOString().split('T')[0];
        daily[key] = (daily[key] || 0) + p.amount;
      }
    });

    return Object.entries(daily).map(([date, amount]) => ({ date, amount }));
  }

  /**
   * Appointment analytics - completion rate, no-show rate, type breakdown
   */
  async getAppointmentAnalytics(tenantId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const appointments = await this.prisma.appointment.groupBy({
      by: ['status'],
      where: { tenantId, scheduledAt: { gte: startDate } },
      _count: true,
    });

    const total = appointments.reduce((sum, a) => sum + a._count, 0);
    const statusMap = Object.fromEntries(appointments.map(a => [a.status, a._count]));

    // Type breakdown
    const typeBreakdown = await this.prisma.appointment.groupBy({
      by: ['type'],
      where: { tenantId, scheduledAt: { gte: startDate } },
      _count: true,
    });

    // Department breakdown
    const deptBreakdown = await this.prisma.appointment.findMany({
      where: { tenantId, scheduledAt: { gte: startDate } },
      select: { department: { select: { name: true } } },
    });

    const deptCounts: Record<string, number> = {};
    deptBreakdown.forEach(a => {
      const name = a.department?.name || 'General';
      deptCounts[name] = (deptCounts[name] || 0) + 1;
    });

    return {
      total,
      completed: statusMap['COMPLETED'] || 0,
      cancelled: statusMap['CANCELLED'] || 0,
      noShow: statusMap['NO_SHOW'] || 0,
      completionRate: total > 0 ? Math.round(((statusMap['COMPLETED'] || 0) / total) * 100) : 0,
      noShowRate: total > 0 ? Math.round(((statusMap['NO_SHOW'] || 0) / total) * 100) : 0,
      byType: typeBreakdown.map(t => ({ type: t.type, count: t._count })),
      byDepartment: Object.entries(deptCounts)
        .map(([name, count]) => ({ department: name, count }))
        .sort((a, b) => b.count - a.count),
    };
  }

  /**
   * Top doctors by revenue and patient volume
   */
  async getTopDoctors(tenantId: string, limit: number = 10) {
    const doctors = await this.prisma.doctor.findMany({
      where: { tenantId },
      include: {
        user: { select: { firstName: true, lastName: true } },
        department: { select: { name: true } },
        _count: { select: { appointments: true } },
      },
    });

    // Get completed appointments per doctor this month
    const monthStart = new Date();
    monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);

    const doctorStats = await Promise.all(
      doctors.map(async (doc) => {
        const completedThisMonth = await this.prisma.appointment.count({
          where: { tenantId, doctorId: doc.id, status: 'COMPLETED', completedAt: { gte: monthStart } },
        });
        return {
          id: doc.id,
          name: `Dr. ${doc.user.firstName} ${doc.user.lastName || ''}`.trim(),
          department: doc.department?.name || 'General',
          specialties: doc.specialties,
          totalAppointments: doc._count.appointments,
          completedThisMonth,
          estimatedRevenue: completedThisMonth * (doc.consultationFee || 0),
        };
      }),
    );

    return doctorStats
      .sort((a, b) => b.completedThisMonth - a.completedThisMonth)
      .slice(0, limit);
  }

  /**
   * Patient demographics breakdown
   */
  async getPatientDemographics(tenantId: string) {
    const [genderBreakdown, ageGroups, cityBreakdown] = await Promise.all([
      this.prisma.patient.groupBy({
        by: ['gender'],
        where: { tenantId, deletedAt: null },
        _count: true,
      }),
      this.prisma.patient.findMany({
        where: { tenantId, deletedAt: null, dateOfBirth: { not: null } },
        select: { dateOfBirth: true },
      }),
      this.prisma.patient.groupBy({
        by: ['city'],
        where: { tenantId, deletedAt: null, city: { not: null } },
        _count: true,
        orderBy: { _count: { city: 'desc' } },
        take: 10,
      }),
    ]);

    // Calculate age groups
    const now = new Date();
    const groups: Record<string, number> = { '0-18': 0, '19-30': 0, '31-45': 0, '46-60': 0, '60+': 0 };
    ageGroups.forEach(p => {
      if (!p.dateOfBirth) return;
      const age = Math.floor((now.getTime() - p.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      if (age <= 18) groups['0-18']++;
      else if (age <= 30) groups['19-30']++;
      else if (age <= 45) groups['31-45']++;
      else if (age <= 60) groups['46-60']++;
      else groups['60+']++;
    });

    return {
      gender: genderBreakdown.map(g => ({ gender: g.gender || 'Unknown', count: g._count })),
      ageGroups: Object.entries(groups).map(([range, count]) => ({ range, count })),
      topCities: cityBreakdown.map(c => ({ city: c.city || 'Unknown', count: c._count })),
    };
  }

  /**
   * WhatsApp engagement analytics
   */
  async getWhatsAppAnalytics(tenantId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [totalConversations, activeConversations, totalMessages, inbound, outbound, unread] = await Promise.all([
      this.prisma.conversation.count({ where: { tenantId } }),
      this.prisma.conversation.count({ where: { tenantId, lastMessageAt: { gte: startDate } } }),
      this.prisma.message.count({ where: { conversation: { tenantId }, createdAt: { gte: startDate } } }),
      this.prisma.message.count({ where: { conversation: { tenantId }, createdAt: { gte: startDate }, direction: 'INBOUND' } }),
      this.prisma.message.count({ where: { conversation: { tenantId }, createdAt: { gte: startDate }, direction: 'OUTBOUND' } }),
      this.prisma.conversation.aggregate({ where: { tenantId }, _sum: { unreadCount: true } }),
    ]);

    return {
      totalConversations,
      activeConversations,
      totalMessages,
      inbound,
      outbound,
      unreadTotal: unread._sum.unreadCount || 0,
      avgMessagesPerConversation: activeConversations > 0 ? Math.round(totalMessages / activeConversations) : 0,
    };
  }
}

  // ── Actionable notifications ─────────────────────────────────────────────────

  async getNotifications(tenantId: string): Promise<any[]> {
    const now = new Date();
    const today = new Date(now); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    const in90 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const notifications: any[] = [];

    const [
      overdueInvoices,
      pendingAppointments,
      lowStockDrugs,
      expiringDrugs,
      unreadConvos,
      pendingLabOrders,
    ] = await Promise.all([
      // Overdue invoices
      this.prisma.invoice.count({ where: { tenantId, status: 'OVERDUE' } }),
      // Today's unconfirmed appointments
      this.prisma.appointment.count({
        where: { tenantId, status: 'PENDING', scheduledAt: { gte: today, lt: tomorrow } },
      }),
      // Low stock drugs
      this.prisma.pharmacyProduct.count({
        where: { tenantId, isActive: true, currentStock: { gt: 0 }, minimumStock: { gt: 0 } },
      }).catch(() => 0),
      // Expiring drugs in 90 days
      this.prisma.pharmacyBatch.count({
        where: { tenantId, expiryDate: { lte: in90 }, remainingQuantity: { gt: 0 } },
      }).catch(() => 0),
      // Unread WhatsApp convos
      this.prisma.conversation.count({
        where: { tenantId, unreadCount: { gt: 0 } },
      }).catch(() => 0),
      // Pending lab orders
      this.prisma.labOrder.count({
        where: { tenantId, status: { in: ['ORDERED', 'SAMPLE_COLLECTED'] } },
      }).catch(() => 0),
    ]);

    if (overdueInvoices > 0) notifications.push({
      id: 'overdue-invoices', type: 'warning', icon: 'CreditCard',
      title: `${overdueInvoices} overdue invoice${overdueInvoices > 1 ? 's' : ''}`,
      subtitle: 'Collect outstanding payments',
      href: '/clinical/billing?status=OVERDUE',
    });

    if (pendingAppointments > 0) notifications.push({
      id: 'pending-appointments', type: 'info', icon: 'Calendar',
      title: `${pendingAppointments} appointment${pendingAppointments > 1 ? 's' : ''} pending confirmation`,
      subtitle: "Today's appointments awaiting confirmation",
      href: '/clinical/appointments',
    });

    if (unreadConvos > 0) notifications.push({
      id: 'unread-whatsapp', type: 'whatsapp', icon: 'MessageSquare',
      title: `${unreadConvos} unread WhatsApp conversation${unreadConvos > 1 ? 's' : ''}`,
      subtitle: 'Patients waiting for response',
      href: '/clinical/whatsapp',
    });

    if (pendingLabOrders > 0) notifications.push({
      id: 'pending-lab', type: 'lab', icon: 'FlaskConical',
      title: `${pendingLabOrders} lab order${pendingLabOrders > 1 ? 's' : ''} in progress`,
      subtitle: 'Pending sample collection or processing',
      href: '/diagnostic/lab-orders',
    });

    if (lowStockDrugs > 0) notifications.push({
      id: 'low-stock', type: 'warning', icon: 'Package',
      title: `${lowStockDrugs} drug${lowStockDrugs > 1 ? 's' : ''} running low`,
      subtitle: 'Check pharmacy inventory',
      href: '/pharmacy/inventory',
    });

    if (expiringDrugs > 0) notifications.push({
      id: 'expiring-drugs', type: 'danger', icon: 'AlertTriangle',
      title: `${expiringDrugs} batch${expiringDrugs > 1 ? 'es' : ''} expiring within 90 days`,
      subtitle: 'Check pharmacy batches',
      href: '/pharmacy/inventory',
    });

    if (notifications.length === 0) {
      notifications.push({
        id: 'all-clear', type: 'success', icon: 'CheckCircle2',
        title: 'All clear!',
        subtitle: 'No action items right now',
        href: null,
      });
    }

    return notifications;
  }
