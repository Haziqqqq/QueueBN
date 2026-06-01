import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../config/app_config.dart';
import '../../config/dept_style.dart';
import '../../models/department.dart';
import '../../providers/queue_providers.dart';
import '../../providers/saved_tickets_provider.dart';
import '../../services/ticket_store.dart';
import '../../widgets/async_view.dart';
import '../../widgets/interval_refresher.dart';
import '../../widgets/responsive.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  DateTime _lastUpdated = DateTime.now();

  @override
  Widget build(BuildContext context) {
    // Track when fresh department data arrives, for the "Updated HH:mm" label.
    ref.listen<AsyncValue<List<Department>>>(departmentsProvider, (_, next) {
      if (next.hasValue) {
        setState(() => _lastUpdated = DateTime.now());
      }
    });

    final departments = ref.watch(departmentsProvider);

    return Scaffold(
      body: IntervalRefresher(
        interval: AppConfig.listPollInterval,
        onTick: () => ref.invalidate(departmentsProvider),
        child: RefreshIndicator(
          onRefresh: () async => ref.refresh(departmentsProvider.future),
          child: CenteredContainer(
            child: AsyncView<List<Department>>(
              value: departments,
              onRetry: () => ref.invalidate(departmentsProvider),
              data: (list) => _Dashboard(
                departments: list,
                lastUpdated: _lastUpdated,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _Dashboard extends ConsumerWidget {
  const _Dashboard({required this.departments, required this.lastUpdated});

  final List<Department> departments;
  final DateTime lastUpdated;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final saved = ref.watch(savedTicketsProvider);
    final totalWaiting = departments.fold<int>(
      0,
      (sum, d) => sum + d.waitingCount,
    );
    final openCount = departments.where((d) => d.isOpen).length;

    return ListView(
      padding: EdgeInsets.zero,
      children: [
        _HeroHeader(totalWaiting: totalWaiting, openCount: openCount),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 20, 16, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (saved.isNotEmpty) ...[
                const _SectionHeader(title: 'Your tickets'),
                const SizedBox(height: 12),
                for (final t in saved) ...[
                  _SavedTicketCard(ticket: t),
                  const SizedBox(height: 10),
                ],
                const SizedBox(height: 16),
              ],
              Row(
                children: [
                  const Expanded(
                    child: _SectionHeader(title: 'Select a queue'),
                  ),
                  _UpdatedLabel(
                    time: lastUpdated,
                    onTap: () => ref.invalidate(departmentsProvider),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              if (departments.isEmpty)
                const _EmptyQueues()
              else
                ...departments.map(
                  (d) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: _DepartmentCard(department: d),
                  ),
                ),
              const SizedBox(height: 12),
              const _HowItWorks(),
            ],
          ),
        ),
      ],
    );
  }
}

class _HeroHeader extends StatelessWidget {
  const _HeroHeader({required this.totalWaiting, required this.openCount});

  final int totalWaiting;
  final int openCount;

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).colorScheme.primary;

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [primary, const Color(0xFF1D4ED8)],
        ),
      ),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(
                      Icons.confirmation_number_outlined,
                      color: Colors.white,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'QueueBN',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 17,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      Text(
                        'Virtual Queue',
                        style: TextStyle(
                          color: Color(0xFFBFDBFE),
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 28),
              const Text(
                'Skip the line.\nJoin from anywhere.',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 26,
                  fontWeight: FontWeight.w800,
                  height: 1.2,
                ),
              ),
              const SizedBox(height: 12),
              const Text(
                'Pick a queue, join it on your phone, and get a notification '
                'when your turn is approaching.',
                style: TextStyle(
                  color: Color(0xFFDBEAFE),
                  fontSize: 14,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 22),
              Row(
                children: [
                  _HeroStat(value: '$totalWaiting', label: 'currently waiting'),
                  const SizedBox(width: 12),
                  _HeroStat(value: '$openCount', label: 'queues open'),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _HeroStat extends StatelessWidget {
  const _HeroStat({required this.value, required this.label});

  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 24,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: const TextStyle(color: Color(0xFFBFDBFE), fontSize: 12),
          ),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w700,
        color: Color(0xFF1E293B),
      ),
    );
  }
}

class _UpdatedLabel extends StatelessWidget {
  const _UpdatedLabel({required this.time, required this.onTap});

  final DateTime time;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.refresh, size: 13, color: Colors.grey.shade500),
            const SizedBox(width: 4),
            Text(
              'Updated ${DateFormat('HH:mm').format(time)}',
              style: TextStyle(fontSize: 12, color: Colors.grey.shade500),
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyQueues extends StatelessWidget {
  const _EmptyQueues();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: const Column(
        children: [
          Icon(Icons.inbox_outlined, size: 40, color: Color(0xFF94A3B8)),
          SizedBox(height: 12),
          Text(
            'No queues available right now.\nPull down to refresh.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Color(0xFF64748B)),
          ),
        ],
      ),
    );
  }
}

class _SavedTicketCard extends ConsumerWidget {
  const _SavedTicketCard({required this.ticket});

  final SavedTicket ticket;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final scheme = Theme.of(context).colorScheme;
    return Card(
      color: scheme.primaryContainer.withValues(alpha: 0.35),
      child: InkWell(
        onTap: () => context.push('/ticket/${ticket.id}'),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Icon(Icons.confirmation_number_outlined, color: scheme.primary),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      ticket.ticketNumber,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    Text(
                      ticket.departmentName,
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey.shade600,
                      ),
                    ),
                  ],
                ),
              ),
              Text(
                'View',
                style: TextStyle(
                  color: scheme.primary,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(width: 4),
              Icon(Icons.chevron_right, color: scheme.primary),
            ],
          ),
        ),
      ),
    );
  }
}

class _DepartmentCard extends StatelessWidget {
  const _DepartmentCard({required this.department});

  final Department department;

  @override
  Widget build(BuildContext context) {
    final open = department.isOpen;
    final style = DeptStyle.of(department.code);
    final waiting = department.waitingCount;
    final estWait = department.estimatedWaitMins;

    return Opacity(
      opacity: open ? 1 : 0.6,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: style.border),
        ),
        clipBehavior: Clip.antiAlias,
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: open
                ? () => context.push('/queue/${department.id}')
                : null,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(height: 4, color: style.color),
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 44,
                            height: 44,
                            decoration: BoxDecoration(
                              color: style.bg,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Icon(style.icon, color: style.color),
                          ),
                          const Spacer(),
                          _StatusPill(open: open),
                        ],
                      ),
                      const SizedBox(height: 14),
                      Text(
                        department.name,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF1E293B),
                        ),
                      ),
                      if (department.facility.isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.only(top: 2),
                          child: Text(
                            department.facility,
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey.shade500,
                            ),
                          ),
                        ),
                      const SizedBox(height: 14),
                      Row(
                        children: [
                          Expanded(
                            child: _MetricBox(
                              bg: style.bg,
                              valueColor: style.color,
                              value: '$waiting',
                              icon: Icons.people_alt_outlined,
                              label: 'waiting',
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: _MetricBox(
                              bg: const Color(0xFFF8FAFC),
                              valueColor: const Color(0xFF334155),
                              value: waiting == 0 ? '—' : '${estWait}m',
                              icon: Icons.schedule,
                              label: 'est. wait',
                            ),
                          ),
                        ],
                      ),
                      if (open) ...[
                        const SizedBox(height: 14),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(vertical: 11),
                          decoration: BoxDecoration(
                            color: style.bg,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                'Join Queue',
                                style: TextStyle(
                                  color: style.color,
                                  fontWeight: FontWeight.w700,
                                  fontSize: 14,
                                ),
                              ),
                              const SizedBox(width: 6),
                              Icon(
                                Icons.arrow_forward,
                                size: 16,
                                color: style.color,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _StatusPill extends StatelessWidget {
  const _StatusPill({required this.open});

  final bool open;

  @override
  Widget build(BuildContext context) {
    final bg = open ? const Color(0xFFDCFCE7) : const Color(0xFFFEE2E2);
    final fg = open ? const Color(0xFF15803D) : const Color(0xFFDC2626);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(color: fg, shape: BoxShape.circle),
          ),
          const SizedBox(width: 6),
          Text(
            open ? 'Open' : 'Closed',
            style: TextStyle(
              color: fg,
              fontSize: 12,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class _MetricBox extends StatelessWidget {
  const _MetricBox({
    required this.bg,
    required this.valueColor,
    required this.value,
    required this.icon,
    required this.label,
  });

  final Color bg;
  final Color valueColor;
  final String value;
  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            value,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w800,
              color: valueColor,
            ),
          ),
          const SizedBox(height: 2),
          Row(
            children: [
              Icon(icon, size: 11, color: Colors.grey.shade500),
              const SizedBox(width: 4),
              Text(
                label,
                style: TextStyle(fontSize: 11, color: Colors.grey.shade500),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _HowItWorks extends StatelessWidget {
  const _HowItWorks();

  static const _steps = [
    (
      icon: Icons.smartphone,
      title: 'Join from anywhere',
      desc:
          'Pick a queue and join from wherever you are — no need to be there in person.',
    ),
    (
      icon: Icons.notifications_active_outlined,
      title: 'Get notified',
      desc:
          'Receive a WhatsApp message when your turn is approaching and when you are next.',
    ),
    (
      icon: Icons.access_time,
      title: 'Arrive on time',
      desc:
          'Show up only when your turn is near. No more time wasted waiting around.',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'How QueueBN works',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: Color(0xFF1E293B),
            ),
          ),
          const SizedBox(height: 16),
          for (final s in _steps) ...[
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 34,
                  height: 34,
                  decoration: BoxDecoration(
                    color: const Color(0xFFEFF6FF),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(
                    s.icon,
                    size: 18,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        s.title,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF1E293B),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        s.desc,
                        style: TextStyle(
                          fontSize: 12,
                          height: 1.5,
                          color: Colors.grey.shade600,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            if (s != _steps.last) const SizedBox(height: 16),
          ],
        ],
      ),
    );
  }
}
