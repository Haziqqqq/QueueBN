import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../config/app_config.dart';
import '../models/department.dart';
import '../models/ticket.dart';
import 'providers.dart';

/// All queues with live waiting/called counts.
final departmentsProvider = FutureProvider.autoDispose<List<Department>>((
  ref,
) async {
  return ref.watch(queueApiProvider).getDepartments();
});

/// A single queue plus its current tickets.
final departmentDetailProvider = FutureProvider.autoDispose
    .family<DepartmentDetail, String>((ref, id) async {
      return ref.watch(queueApiProvider).getDepartment(id);
    });

/// Live ticket status, polled every [AppConfig.ticketPollInterval].
///
/// The first fetch surfaces errors so the user sees connection problems.
/// After we have a value, transient errors are swallowed so a brief network
/// blip doesn't stop the live updates.
final ticketProvider = StreamProvider.autoDispose.family<Ticket, String>((
  ref,
  id,
) async* {
  final api = ref.watch(queueApiProvider);
  Ticket? last;

  while (true) {
    try {
      last = await api.getTicket(id);
      yield last;
    } catch (e) {
      if (last == null) rethrow;
    }
    await Future<void>.delayed(AppConfig.ticketPollInterval);
  }
});
