import 'package:flutter/material.dart';

import '../models/ticket.dart';

/// A small colored pill that reflects a [TicketStatus].
class StatusBadge extends StatelessWidget {
  const StatusBadge({super.key, required this.status});

  final TicketStatus status;

  ({Color bg, Color fg}) get _colors {
    switch (status) {
      case TicketStatus.waiting:
        return (bg: const Color(0xFFEFF6FF), fg: const Color(0xFF1D4ED8));
      case TicketStatus.called:
        return (bg: const Color(0xFFECFDF5), fg: const Color(0xFF047857));
      case TicketStatus.done:
        return (bg: const Color(0xFFF1F5F9), fg: const Color(0xFF475569));
      case TicketStatus.noShow:
        return (bg: const Color(0xFFFEF2F2), fg: const Color(0xFFB91C1C));
      case TicketStatus.cancelled:
        return (bg: const Color(0xFFF1F5F9), fg: const Color(0xFF64748B));
      case TicketStatus.unknown:
        return (bg: const Color(0xFFF1F5F9), fg: const Color(0xFF64748B));
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = _colors;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: c.bg,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        status.label.toUpperCase(),
        style: TextStyle(
          color: c.fg,
          fontSize: 12,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}
