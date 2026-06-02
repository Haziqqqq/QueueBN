import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

/// Lightweight record of a ticket the user has joined, persisted locally so the
/// app can offer "your tickets" after a restart without a network call.
class SavedTicket {
  const SavedTicket({
    required this.id,
    required this.ticketNumber,
    required this.departmentName,
    required this.savedAt,
  });

  final String id;
  final String ticketNumber;
  final String departmentName;
  final DateTime savedAt;

  Map<String, dynamic> toJson() => {
    'id': id,
    'ticket_number': ticketNumber,
    'department_name': departmentName,
    'saved_at': savedAt.toIso8601String(),
  };

  factory SavedTicket.fromJson(Map<String, dynamic> json) => SavedTicket(
    id: json['id'].toString(),
    ticketNumber: (json['ticket_number'] ?? '').toString(),
    departmentName: (json['department_name'] ?? '').toString(),
    savedAt:
        DateTime.tryParse(json['saved_at']?.toString() ?? '') ?? DateTime.now(),
  );
}

/// Persists the list of saved tickets in SharedPreferences.
class TicketStore {
  TicketStore(this._prefs);

  static const _key = 'saved_tickets';
  final SharedPreferences _prefs;

  List<SavedTicket> getAll() {
    final raw = _prefs.getString(_key);
    if (raw == null || raw.isEmpty) return [];
    try {
      final list = (jsonDecode(raw) as List)
          .map((e) => SavedTicket.fromJson(e as Map<String, dynamic>))
          .toList();
      list.sort((a, b) => b.savedAt.compareTo(a.savedAt));
      return list;
    } catch (_) {
      return [];
    }
  }

  Future<void> _save(List<SavedTicket> tickets) async {
    await _prefs.setString(
      _key,
      jsonEncode(tickets.map((e) => e.toJson()).toList()),
    );
  }

  Future<List<SavedTicket>> add(SavedTicket ticket) async {
    final tickets = getAll()..removeWhere((t) => t.id == ticket.id);
    tickets.insert(0, ticket);
    await _save(tickets);
    return tickets;
  }

  Future<List<SavedTicket>> remove(String id) async {
    final tickets = getAll()..removeWhere((t) => t.id == id);
    await _save(tickets);
    return tickets;
  }
}
