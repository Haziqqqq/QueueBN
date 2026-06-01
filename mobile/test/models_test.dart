import 'package:flutter_test/flutter_test.dart';
import 'package:queuebn/models/department.dart';
import 'package:queuebn/models/ticket.dart';

void main() {
  group('Department.fromJson', () {
    test('parses string counts and bool from /departments', () {
      final d = Department.fromJson({
        'id': '275fbb8f-9c2e-488f-99e2-544affe033ab',
        'facility': 'RIPAS Hospital',
        'name': 'Emergency Triage',
        'code': 'EMG',
        'is_open': true,
        'avg_service_time_mins': 5,
        'waiting_count': '3', // pg COUNT comes back as a string
        'called_count': '1',
      });

      expect(d.name, 'Emergency Triage');
      expect(d.isOpen, true);
      expect(d.waitingCount, 3);
      expect(d.calledCount, 1);
      expect(d.estimatedWaitMins, 15);
    });
  });

  group('DepartmentDetail.fromJson', () {
    test('parses an empty queue', () {
      final detail = DepartmentDetail.fromJson({
        'id': 'abc',
        'name': 'OPD General',
        'code': 'OPD',
        'is_open': true,
        'avg_service_time_mins': 5,
        'queue': [],
      });

      expect(detail.department.code, 'OPD');
      expect(detail.queue, isEmpty);
    });
  });

  group('Ticket.fromJson', () {
    test('parses POST /tickets response with nested department', () {
      final t = Ticket.fromJson({
        'id': '17c636a1-4997-41d7-b4d1-41aa58c30ef9',
        'department_id': 'ed64bf75-3ddc-44ae-b671-3db82c361334',
        'ticket_number': 'OPD-001',
        'mobile_number': '+6737000111',
        'ic_number': '01-234567',
        'position': 1,
        'status': 'waiting',
        'joined_at': '2026-06-01T02:00:07.542Z',
        'called_at': null,
        'wait_mins': null,
        'rating': null,
        'people_ahead': 0,
        'estimated_wait_mins': 0,
        'department': {'name': 'OPD General', 'code': 'OPD', 'avg_service_time_mins': 5},
      });

      expect(t.ticketNumber, 'OPD-001');
      expect(t.status, TicketStatus.waiting);
      expect(t.status.isActive, true);
      expect(t.peopleAhead, 0);
      expect(t.departmentName, 'OPD General');
      expect(t.departmentCode, 'OPD');
      expect(t.joinedAt, isNotNull);
    });

    test('maps no_show status', () {
      final t = Ticket.fromJson({
        'id': 'x',
        'department_id': 'y',
        'ticket_number': 'LAB-009',
        'mobile_number': '+6737',
        'position': 9,
        'status': 'no_show',
      });

      expect(t.status, TicketStatus.noShow);
      expect(t.status.isClosed, true);
    });
  });
}
