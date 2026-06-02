import '../utils/json_parse.dart';
import 'ticket.dart';

/// A queue/service that users can join (the backend calls these "departments").
class Department {
  const Department({
    required this.id,
    required this.facility,
    required this.name,
    required this.code,
    required this.isOpen,
    required this.avgServiceTimeMins,
    this.waitingCount = 0,
    this.calledCount = 0,
  });

  final String id;
  final String facility;
  final String name;
  final String code;
  final bool isOpen;
  final int avgServiceTimeMins;
  final int waitingCount;
  final int calledCount;

  /// Rough wait estimate (minutes) for someone joining now.
  int get estimatedWaitMins => waitingCount * avgServiceTimeMins;

  factory Department.fromJson(Map<String, dynamic> json) {
    return Department(
      id: json['id'].toString(),
      facility: (json['facility'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      code: (json['code'] ?? '').toString(),
      isOpen: parseBool(json['is_open'], fallback: true),
      avgServiceTimeMins: parseInt(json['avg_service_time_mins'], fallback: 5),
      waitingCount: parseInt(json['waiting_count']),
      calledCount: parseInt(json['called_count']),
    );
  }
}

/// A department together with its current queue (from GET /departments/:id).
class DepartmentDetail {
  const DepartmentDetail({required this.department, required this.queue});

  final Department department;
  final List<Ticket> queue;

  factory DepartmentDetail.fromJson(Map<String, dynamic> json) {
    final rawQueue = (json['queue'] as List?) ?? const [];
    return DepartmentDetail(
      department: Department.fromJson(json),
      queue: rawQueue
          .map((e) => Ticket.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}
