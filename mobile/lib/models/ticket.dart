import '../utils/json_parse.dart';

/// Lifecycle states a ticket can be in (mirrors the backend `status` column).
enum TicketStatus {
  waiting,
  called,
  done,
  noShow,
  cancelled,
  unknown;

  static TicketStatus fromApi(dynamic value) {
    switch (value?.toString()) {
      case 'waiting':
        return TicketStatus.waiting;
      case 'called':
        return TicketStatus.called;
      case 'done':
        return TicketStatus.done;
      case 'no_show':
        return TicketStatus.noShow;
      case 'cancelled':
        return TicketStatus.cancelled;
      default:
        return TicketStatus.unknown;
    }
  }

  String get label {
    switch (this) {
      case TicketStatus.waiting:
        return 'Waiting';
      case TicketStatus.called:
        return 'Your turn';
      case TicketStatus.done:
        return 'Served';
      case TicketStatus.noShow:
        return 'No-show';
      case TicketStatus.cancelled:
        return 'Cancelled';
      case TicketStatus.unknown:
        return 'Unknown';
    }
  }

  /// True while the ticket is still active in the queue.
  bool get isActive =>
      this == TicketStatus.waiting || this == TicketStatus.called;

  /// True once the ticket is finished (no further queue activity).
  bool get isClosed =>
      this == TicketStatus.done ||
      this == TicketStatus.noShow ||
      this == TicketStatus.cancelled;
}

/// A user's place in a queue.
class Ticket {
  const Ticket({
    required this.id,
    required this.departmentId,
    required this.ticketNumber,
    required this.mobileNumber,
    this.icNumber,
    required this.position,
    required this.status,
    this.joinedAt,
    this.calledAt,
    this.doneAt,
    this.waitMins,
    this.rating,
    this.peopleAhead,
    this.estimatedWaitMins,
    this.departmentName,
    this.departmentCode,
    this.avgServiceTimeMins,
  });

  final String id;
  final String departmentId;
  final String ticketNumber;
  final String mobileNumber;
  final String? icNumber;
  final int position;
  final TicketStatus status;
  final DateTime? joinedAt;
  final DateTime? calledAt;
  final DateTime? doneAt;
  final double? waitMins;
  final int? rating;

  // Derived/joined fields the API includes on some responses.
  final int? peopleAhead;
  final int? estimatedWaitMins;
  final String? departmentName;
  final String? departmentCode;
  final int? avgServiceTimeMins;

  factory Ticket.fromJson(Map<String, dynamic> json) {
    final dept = json['department'];
    final nestedDept = dept is Map<String, dynamic> ? dept : null;

    return Ticket(
      id: json['id'].toString(),
      departmentId: json['department_id'].toString(),
      ticketNumber: (json['ticket_number'] ?? '').toString(),
      mobileNumber: (json['mobile_number'] ?? '').toString(),
      icNumber: json['ic_number']?.toString(),
      position: parseInt(json['position']),
      status: TicketStatus.fromApi(json['status']),
      joinedAt: parseDateOrNull(json['joined_at']),
      calledAt: parseDateOrNull(json['called_at']),
      doneAt: parseDateOrNull(json['done_at']),
      waitMins: parseDoubleOrNull(json['wait_mins']),
      rating: parseIntOrNull(json['rating']),
      peopleAhead: parseIntOrNull(json['people_ahead']),
      estimatedWaitMins: parseIntOrNull(json['estimated_wait_mins']),
      departmentName:
          json['department_name']?.toString() ?? nestedDept?['name']?.toString(),
      departmentCode:
          json['code']?.toString() ?? nestedDept?['code']?.toString(),
      avgServiceTimeMins: parseIntOrNull(
        json['avg_service_time_mins'] ?? nestedDept?['avg_service_time_mins'],
      ),
    );
  }
}
