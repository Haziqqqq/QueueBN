import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../models/ticket.dart';
import '../../providers/providers.dart';
import '../../providers/queue_providers.dart';
import '../../providers/saved_tickets_provider.dart';
import '../../services/api_client.dart';
import '../../widgets/async_view.dart';
import '../../widgets/responsive.dart';

/// Visual config per status, mirroring the web ticket page.
class _StatusUi {
  const _StatusUi({
    required this.label,
    required this.color,
    required this.bg,
    required this.icon,
    required this.message,
  });

  final String label;
  final Color color;
  final Color bg;
  final IconData icon;
  final String message;

  static _StatusUi of(TicketStatus s) {
    switch (s) {
      case TicketStatus.waiting:
        return const _StatusUi(
          label: 'Waiting',
          color: Color(0xFF1D4ED8),
          bg: Color(0xFFEFF6FF),
          icon: Icons.schedule,
          message:
              'Your ticket is in the queue. We will notify you on WhatsApp '
              'when your turn is approaching.',
        );
      case TicketStatus.called:
        return const _StatusUi(
          label: 'You are next',
          color: Color(0xFFD97706),
          bg: Color(0xFFFFFBEB),
          icon: Icons.error_outline,
          message:
              'Please proceed to the counter now. You have 10 minutes before '
              'your ticket expires.',
        );
      case TicketStatus.done:
        return const _StatusUi(
          label: 'Completed',
          color: Color(0xFF15803D),
          bg: Color(0xFFF0FDF4),
          icon: Icons.check_circle_outline,
          message: 'Your visit is complete. Thank you for using QueueBN.',
        );
      case TicketStatus.noShow:
        return const _StatusUi(
          label: 'Ticket Expired',
          color: Color(0xFFDC2626),
          bg: Color(0xFFFEF2F2),
          icon: Icons.cancel_outlined,
          message:
              'Your ticket expired because you did not arrive within 10 '
              'minutes of being called.',
        );
      case TicketStatus.cancelled:
        return const _StatusUi(
          label: 'Cancelled',
          color: Color(0xFF6B7280),
          bg: Color(0xFFF9FAFB),
          icon: Icons.cancel_outlined,
          message: 'You have left the queue.',
        );
      case TicketStatus.unknown:
        return const _StatusUi(
          label: 'Unknown',
          color: Color(0xFF6B7280),
          bg: Color(0xFFF9FAFB),
          icon: Icons.help_outline,
          message: 'Checking your ticket status…',
        );
    }
  }
}

class TicketScreen extends ConsumerWidget {
  const TicketScreen({super.key, required this.ticketId});

  final String ticketId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ticket = ref.watch(ticketProvider(ticketId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('QueueBN'),
        leading: IconButton(
          icon: const Icon(Icons.home_outlined),
          onPressed: () => context.go('/'),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.invalidate(ticketProvider(ticketId)),
          ),
        ],
      ),
      body: CenteredContainer(
        child: AsyncView<Ticket>(
          value: ticket,
          onRetry: () => ref.invalidate(ticketProvider(ticketId)),
          data: (t) => _TicketBody(ticketId: ticketId, ticket: t),
        ),
      ),
    );
  }
}

class _TicketBody extends StatelessWidget {
  const _TicketBody({required this.ticketId, required this.ticket});

  final String ticketId;
  final Ticket ticket;

  @override
  Widget build(BuildContext context) {
    final ui = _StatusUi.of(ticket.status);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _NumberCard(ticket: ticket, ui: ui),
        const SizedBox(height: 12),
        _MessageBox(ui: ui),
        if (ticket.status == TicketStatus.waiting) ...[
          const SizedBox(height: 12),
          _PositionCard(ticket: ticket),
        ],
        if (ticket.status == TicketStatus.called) ...[
          const SizedBox(height: 12),
          _CalledBox(departmentName: ticket.departmentName ?? 'the'),
        ],
        const SizedBox(height: 12),
        _DetailsList(ticket: ticket),
        if (ticket.status == TicketStatus.done) ...[
          const SizedBox(height: 12),
          _RatingCard(ticketId: ticketId, alreadyRated: ticket.rating != null),
        ],
        const SizedBox(height: 16),
        if (ticket.status.isActive) _CancelButton(ticketId: ticketId),
        if (ticket.status.isClosed) _HomeButton(ticketId: ticketId),
        const SizedBox(height: 10),
        Center(
          child: Text(
            'Updates automatically',
            style: TextStyle(fontSize: 12, color: Colors.grey.shade400),
          ),
        ),
        const SizedBox(height: 16),
      ],
    );
  }
}

class _NumberCard extends StatelessWidget {
  const _NumberCard({required this.ticket, required this.ui});

  final Ticket ticket;
  final _StatusUi ui;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        children: [
          Text(
            (ticket.departmentName ?? 'QUEUE').toUpperCase(),
            style: TextStyle(
              fontSize: 11,
              letterSpacing: 1.5,
              color: Colors.grey.shade400,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Your Ticket Number',
            style: TextStyle(fontSize: 12, color: Colors.grey.shade400),
          ),
          const SizedBox(height: 10),
          Text(
            ticket.ticketNumber,
            style: const TextStyle(
              fontSize: 46,
              fontWeight: FontWeight.w900,
              color: Color(0xFF1E293B),
              letterSpacing: 1,
            ),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: ui.bg,
              borderRadius: BorderRadius.circular(999),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(ui.icon, size: 18, color: ui.color),
                const SizedBox(width: 8),
                Text(
                  ui.label,
                  style: TextStyle(
                    color: ui.color,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _MessageBox extends StatelessWidget {
  const _MessageBox({required this.ui});

  final _StatusUi ui;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: ui.bg,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: ui.color.withValues(alpha: 0.13)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(ui.icon, color: ui.color, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              ui.message,
              style: TextStyle(color: ui.color, height: 1.5, fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }
}

class _PositionCard extends StatelessWidget {
  const _PositionCard({required this.ticket});

  final Ticket ticket;

  @override
  Widget build(BuildContext context) {
    final ahead = ticket.peopleAhead ?? 0;
    final est = ticket.estimatedWaitMins ?? 0;
    final progress = ahead == 0 ? 1.0 : (1 - (ahead * 0.1)).clamp(0.05, 1.0);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: _BigStat(
                  icon: Icons.people_alt_outlined,
                  label: 'People Ahead',
                  value: '$ahead',
                ),
              ),
              Expanded(
                child: _BigStat(
                  icon: Icons.schedule,
                  label: 'Est. Wait',
                  value: est == 0 ? '—' : '${est}m',
                ),
              ),
            ],
          ),
          const SizedBox(height: 22),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Queue Progress',
                style: TextStyle(fontSize: 12, color: Colors.grey.shade400),
              ),
              Text(
                'Position #${ticket.position}',
                style: TextStyle(fontSize: 12, color: Colors.grey.shade400),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 8,
              backgroundColor: const Color(0xFFF1F5F9),
              valueColor: const AlwaysStoppedAnimation(Color(0xFF2563EB)),
            ),
          ),
        ],
      ),
    );
  }
}

class _BigStat extends StatelessWidget {
  const _BigStat({required this.icon, required this.label, required this.value});

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 12, color: Colors.grey.shade400),
            const SizedBox(width: 4),
            Text(
              label,
              style: TextStyle(fontSize: 12, color: Colors.grey.shade400),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Text(
          value,
          style: const TextStyle(
            fontSize: 36,
            fontWeight: FontWeight.w900,
            color: Color(0xFF1E293B),
          ),
        ),
      ],
    );
  }
}

class _CalledBox extends StatelessWidget {
  const _CalledBox({required this.departmentName});

  final String departmentName;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFBEB),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFFDE68A)),
      ),
      child: Column(
        children: [
          const Icon(Icons.error_outline, size: 32, color: Color(0xFFF59E0B)),
          const SizedBox(height: 10),
          const Text(
            'It is your turn!',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w800,
              color: Color(0xFF92400E),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Please proceed to the $departmentName counter now.',
            textAlign: TextAlign.center,
            style: const TextStyle(color: Color(0xFFB45309)),
          ),
        ],
      ),
    );
  }
}

class _DetailsList extends StatelessWidget {
  const _DetailsList({required this.ticket});

  final Ticket ticket;

  @override
  Widget build(BuildContext context) {
    final joined = ticket.joinedAt != null
        ? DateFormat('HH:mm').format(ticket.joinedAt!)
        : '—';

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        children: [
          _DetailRow(
            icon: Icons.tag,
            label: 'Ticket Number',
            value: ticket.ticketNumber,
            mono: true,
          ),
          const Divider(height: 1),
          _DetailRow(
            icon: Icons.confirmation_number_outlined,
            label: 'Queue',
            value: ticket.departmentName ?? '—',
          ),
          const Divider(height: 1),
          _DetailRow(
            icon: Icons.phone_outlined,
            label: 'Notify To',
            value: ticket.mobileNumber,
            mono: true,
          ),
          const Divider(height: 1),
          _DetailRow(
            icon: Icons.schedule,
            label: 'Joined At',
            value: joined,
            mono: true,
          ),
        ],
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  const _DetailRow({
    required this.icon,
    required this.label,
    required this.value,
    this.mono = false,
  });

  final IconData icon;
  final String label;
  final String value;
  final bool mono;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
      child: Row(
        children: [
          Icon(icon, size: 14, color: Colors.grey.shade500),
          const SizedBox(width: 8),
          Text(
            label,
            style: TextStyle(fontSize: 12, color: Colors.grey.shade500),
          ),
          const Spacer(),
          Text(
            value,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: const Color(0xFF1E293B),
              fontFeatures: mono ? const [] : null,
            ),
          ),
        ],
      ),
    );
  }
}

class _CancelButton extends ConsumerStatefulWidget {
  const _CancelButton({required this.ticketId});

  final String ticketId;

  @override
  ConsumerState<_CancelButton> createState() => _CancelButtonState();
}

class _CancelButtonState extends ConsumerState<_CancelButton> {
  bool _busy = false;

  Future<void> _cancel() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Leave the queue?'),
        content: const Text(
          'You will lose your place in the queue. This cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Stay'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Leave queue'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    setState(() => _busy = true);
    try {
      await ref.read(queueApiProvider).cancelTicket(widget.ticketId);
      await ref.read(savedTicketsProvider.notifier).remove(widget.ticketId);
      if (!mounted) return;
      context.go('/');
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _busy = false);
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  @override
  Widget build(BuildContext context) {
    return OutlinedButton(
      onPressed: _busy ? null : _cancel,
      style: OutlinedButton.styleFrom(
        minimumSize: const Size.fromHeight(50),
        foregroundColor: const Color(0xFFDC2626),
        side: const BorderSide(color: Color(0xFFFECACA)),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
      child: _busy
          ? const SizedBox(
              width: 18,
              height: 18,
              child: CircularProgressIndicator(strokeWidth: 2),
            )
          : const Text('Leave Queue'),
    );
  }
}

class _HomeButton extends ConsumerWidget {
  const _HomeButton({required this.ticketId});

  final String ticketId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return FilledButton(
      onPressed: () async {
        await ref.read(savedTicketsProvider.notifier).remove(ticketId);
        if (context.mounted) context.go('/');
      },
      child: const Text('Back to Home'),
    );
  }
}

class _RatingCard extends ConsumerStatefulWidget {
  const _RatingCard({required this.ticketId, required this.alreadyRated});

  final String ticketId;
  final bool alreadyRated;

  @override
  ConsumerState<_RatingCard> createState() => _RatingCardState();
}

class _RatingCardState extends ConsumerState<_RatingCard> {
  int _rating = 0;
  bool _busy = false;
  late bool _rated = widget.alreadyRated;

  Future<void> _submit(int stars) async {
    setState(() {
      _rating = stars;
      _busy = true;
    });
    try {
      await ref.read(queueApiProvider).rateTicket(widget.ticketId, stars);
      if (!mounted) return;
      setState(() {
        _busy = false;
        _rated = true;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _busy = false);
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_rated) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFFF0FDF4),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: const Color(0xFFBBF7D0)),
        ),
        child: const Column(
          children: [
            Icon(Icons.check_circle_outline, color: Color(0xFF16A34A)),
            SizedBox(height: 6),
            Text(
              'Thank you for your feedback!',
              style: TextStyle(
                color: Color(0xFF15803D),
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        children: [
          const Text(
            'How was your experience?',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 4),
          Text(
            'Rate your visit to help us improve',
            style: TextStyle(fontSize: 12, color: Colors.grey.shade400),
          ),
          const SizedBox(height: 14),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(5, (i) {
              final filled = i < _rating;
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4),
                child: IconButton(
                  onPressed: _busy ? null : () => _submit(i + 1),
                  icon: Icon(
                    filled ? Icons.star_rounded : Icons.star_outline_rounded,
                    size: 38,
                    color: filled
                        ? const Color(0xFFF59E0B)
                        : Colors.grey.shade400,
                  ),
                ),
              );
            }),
          ),
        ],
      ),
    );
  }
}
