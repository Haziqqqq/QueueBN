import '../models/department.dart';
import '../models/ticket.dart';
import 'api_client.dart';

/// Typed wrapper over the QueueBN REST endpoints used by the user-facing app.
class QueueApi {
  QueueApi(this._client);

  final ApiClient _client;

  /// GET /departments — all queues with live waiting/called counts.
  Future<List<Department>> getDepartments() async {
    final res = await _client.get<List<dynamic>>('/departments');
    final data = res.data ?? const [];
    return data
        .map((e) => Department.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// GET /departments/:id — a single queue with its current tickets.
  Future<DepartmentDetail> getDepartment(String id) async {
    final res = await _client.get<Map<String, dynamic>>('/departments/$id');
    return DepartmentDetail.fromJson(res.data ?? const {});
  }

  /// POST /tickets — join a queue.
  Future<Ticket> joinQueue({
    required String departmentId,
    required String mobileNumber,
    String? icNumber,
  }) async {
    final res = await _client.post<Map<String, dynamic>>(
      '/tickets',
      data: {
        'department_id': departmentId,
        'mobile_number': mobileNumber,
        if (icNumber != null && icNumber.isNotEmpty) 'ic_number': icNumber,
      },
    );
    return Ticket.fromJson(res.data ?? const {});
  }

  /// GET /tickets/:id — current status of a ticket.
  Future<Ticket> getTicket(String id) async {
    final res = await _client.get<Map<String, dynamic>>('/tickets/$id');
    return Ticket.fromJson(res.data ?? const {});
  }

  /// DELETE /tickets/:id — cancel a ticket.
  Future<void> cancelTicket(String id) async {
    await _client.delete<Map<String, dynamic>>('/tickets/$id');
  }

  /// POST /tickets/:id/rating — submit a 1–5 rating after being served.
  Future<void> rateTicket(String id, int rating) async {
    await _client.post<Map<String, dynamic>>(
      '/tickets/$id/rating',
      data: {'rating': rating},
    );
  }
}
