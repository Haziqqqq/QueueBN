import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../config/app_config.dart';
import '../../models/department.dart';
import '../../providers/providers.dart';
import '../../providers/queue_providers.dart';
import '../../providers/saved_tickets_provider.dart';
import '../../services/api_client.dart';
import '../../services/ticket_store.dart';
import '../../widgets/async_view.dart';
import '../../widgets/interval_refresher.dart';
import '../../widgets/responsive.dart';

/// Combined queue detail + join form, mirroring the web's /queue/[id] page
/// (live stats card on top, join form below).
class QueueDetailScreen extends ConsumerStatefulWidget {
  const QueueDetailScreen({super.key, required this.departmentId});

  final String departmentId;

  @override
  ConsumerState<QueueDetailScreen> createState() => _QueueDetailScreenState();
}

class _QueueDetailScreenState extends ConsumerState<QueueDetailScreen> {
  final _formKey = GlobalKey<FormState>();
  final _mobile = TextEditingController(text: '+673');
  final _ic = TextEditingController();
  bool _submitting = false;
  String? _error;

  @override
  void dispose() {
    _mobile.dispose();
    _ic.dispose();
    super.dispose();
  }

  Future<void> _join(Department dept) async {
    if (!_formKey.currentState!.validate()) return;
    FocusScope.of(context).unfocus();
    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      final ticket = await ref.read(queueApiProvider).joinQueue(
            departmentId: widget.departmentId,
            mobileNumber: _mobile.text.trim(),
            icNumber: _ic.text.trim(),
          );
      await ref.read(savedTicketsProvider.notifier).add(
            SavedTicket(
              id: ticket.id,
              ticketNumber: ticket.ticketNumber,
              departmentName: ticket.departmentName ?? dept.name,
              savedAt: DateTime.now(),
            ),
          );
      if (!mounted) return;
      context.go('/ticket/${ticket.id}');
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _submitting = false;
        _error = e.message;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _submitting = false;
        _error = 'Something went wrong. Please try again.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final detail = ref.watch(departmentDetailProvider(widget.departmentId));

    return Scaffold(
      appBar: AppBar(title: const Text('QueueBN')),
      body: IntervalRefresher(
        interval: AppConfig.listPollInterval,
        onTick: () =>
            ref.invalidate(departmentDetailProvider(widget.departmentId)),
        child: CenteredContainer(
          child: AsyncView<DepartmentDetail>(
            value: detail,
            onRetry: () =>
                ref.invalidate(departmentDetailProvider(widget.departmentId)),
            data: (d) => _body(d),
          ),
        ),
      ),
    );
  }

  Widget _body(DepartmentDetail detail) {
    final dept = detail.department;
    final waiting = detail.queue.where((t) => t.status.isActive).isNotEmpty
        ? detail.queue.where((t) => t.status.isActive).length
        : dept.waitingCount;
    final estWait = waiting * dept.avgServiceTimeMins;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _StatsCard(
          facility: dept.facility,
          name: dept.name,
          waiting: waiting,
          estWait: estWait,
        ),
        const SizedBox(height: 16),
        if (!dept.isOpen)
          _ClosedNotice(name: dept.name)
        else
          _JoinForm(
            formKey: _formKey,
            mobile: _mobile,
            ic: _ic,
            submitting: _submitting,
            error: _error,
            onSubmit: () => _join(dept),
          ),
      ],
    );
  }
}

class _StatsCard extends StatelessWidget {
  const _StatsCard({
    required this.facility,
    required this.name,
    required this.waiting,
    required this.estWait,
  });

  final String facility;
  final String name;
  final int waiting;
  final int estWait;

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
          if (facility.isNotEmpty) ...[
            Text(
              facility.toUpperCase(),
              style: TextStyle(
                fontSize: 11,
                letterSpacing: 1.5,
                color: Colors.grey.shade400,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 4),
          ],
          Text(
            name,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w800,
              color: Color(0xFF1E293B),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _StatBox(
                  bg: const Color(0xFFEFF6FF),
                  iconColor: const Color(0xFF2563EB),
                  valueColor: const Color(0xFF1D4ED8),
                  icon: Icons.people_alt_outlined,
                  label: 'Waiting',
                  value: '$waiting',
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _StatBox(
                  bg: const Color(0xFFF8FAFC),
                  iconColor: const Color(0xFF64748B),
                  valueColor: const Color(0xFF334155),
                  icon: Icons.schedule,
                  label: 'Est. Wait',
                  value: waiting == 0 ? '—' : '~${estWait}m',
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _StatBox extends StatelessWidget {
  const _StatBox({
    required this.bg,
    required this.iconColor,
    required this.valueColor,
    required this.icon,
    required this.label,
    required this.value,
  });

  final Color bg;
  final Color iconColor;
  final Color valueColor;
  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 14, color: iconColor),
              const SizedBox(width: 6),
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: iconColor,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w800,
              color: valueColor,
            ),
          ),
        ],
      ),
    );
  }
}

class _ClosedNotice extends StatelessWidget {
  const _ClosedNotice({required this.name});

  final String name;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFEF2F2),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFFECACA)),
      ),
      child: Row(
        children: [
          const Icon(Icons.info_outline, color: Color(0xFFB91C1C)),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              '$name is currently closed and not accepting new tickets.',
              style: const TextStyle(color: Color(0xFFB91C1C)),
            ),
          ),
        ],
      ),
    );
  }
}

class _JoinForm extends StatelessWidget {
  const _JoinForm({
    required this.formKey,
    required this.mobile,
    required this.ic,
    required this.submitting,
    required this.error,
    required this.onSubmit,
  });

  final GlobalKey<FormState> formKey;
  final TextEditingController mobile;
  final TextEditingController ic;
  final bool submitting;
  final String? error;
  final VoidCallback onSubmit;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Form(
        key: formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Join the queue',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: Color(0xFF1E293B),
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'Enter your mobile number to receive a WhatsApp notification '
              'when your turn is approaching.',
              style: TextStyle(
                fontSize: 13,
                height: 1.5,
                color: Colors.grey.shade600,
              ),
            ),
            const SizedBox(height: 20),
            _Label(icon: Icons.phone_outlined, text: 'Mobile Number (WhatsApp)', required: true),
            const SizedBox(height: 8),
            TextFormField(
              controller: mobile,
              keyboardType: TextInputType.phone,
              inputFormatters: [
                FilteringTextInputFormatter.allow(RegExp(r'[0-9+ ]')),
              ],
              decoration: const InputDecoration(hintText: '+6731234567'),
              validator: (v) {
                final t = (v ?? '').trim();
                if (t.isEmpty) return 'Please enter a valid mobile number';
                final digits = t.replaceAll(RegExp(r'[^0-9]'), '');
                if (digits.length < 7) {
                  return 'Please enter a valid mobile number';
                }
                return null;
              },
            ),
            const SizedBox(height: 6),
            Text(
              'Include country code. e.g. +673 for Brunei',
              style: TextStyle(fontSize: 12, color: Colors.grey.shade400),
            ),
            const SizedBox(height: 18),
            _Label(icon: Icons.badge_outlined, text: 'IC Number', optional: true),
            const SizedBox(height: 8),
            TextFormField(
              controller: ic,
              decoration: const InputDecoration(hintText: 'e.g. 01-123456'),
            ),
            if (error != null) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF2F2),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFFECACA)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.error_outline,
                        color: Color(0xFFB91C1C), size: 20),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        error!,
                        style: const TextStyle(color: Color(0xFFB91C1C)),
                      ),
                    ),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 20),
            FilledButton(
              onPressed: submitting ? null : onSubmit,
              child: submitting
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.5,
                        color: Colors.white,
                      ),
                    )
                  : const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text('Join Queue'),
                        SizedBox(width: 6),
                        Icon(Icons.arrow_forward, size: 18),
                      ],
                    ),
            ),
            const SizedBox(height: 18),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFECFDF5),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFA7F3D0)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.chat_bubble_outline,
                      color: Color(0xFF047857), size: 18),
                  const SizedBox(width: 10),
                  Expanded(
                    child: RichText(
                      text: const TextSpan(
                        style: TextStyle(
                          fontSize: 12,
                          height: 1.5,
                          color: Color(0xFF047857),
                        ),
                        children: [
                          TextSpan(
                            text:
                                'You will receive a WhatsApp message when 3 people '
                                'are ahead of you, and again when you are next. '
                                'You have ',
                          ),
                          TextSpan(
                            text: '10 minutes',
                            style: TextStyle(fontWeight: FontWeight.w800),
                          ),
                          TextSpan(
                            text:
                                ' to arrive at the counter before your ticket '
                                'expires.',
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Label extends StatelessWidget {
  const _Label({
    required this.icon,
    required this.text,
    this.required = false,
    this.optional = false,
  });

  final IconData icon;
  final String text;
  final bool required;
  final bool optional;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 13, color: Colors.grey.shade600),
        const SizedBox(width: 6),
        Text(
          text.toUpperCase(),
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.5,
            color: Colors.grey.shade600,
          ),
        ),
        if (required)
          const Text(' *', style: TextStyle(color: Color(0xFFDC2626))),
        if (optional)
          Text(
            ' (optional)',
            style: TextStyle(fontSize: 11, color: Colors.grey.shade400),
          ),
      ],
    );
  }
}
