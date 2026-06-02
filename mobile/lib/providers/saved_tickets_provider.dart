import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../services/ticket_store.dart';
import 'providers.dart';

/// Holds the user's saved tickets and keeps the local store in sync.
class SavedTicketsNotifier extends Notifier<List<SavedTicket>> {
  TicketStore get _store => ref.read(ticketStoreProvider);

  @override
  List<SavedTicket> build() => _store.getAll();

  Future<void> add(SavedTicket ticket) async {
    state = await _store.add(ticket);
  }

  Future<void> remove(String id) async {
    state = await _store.remove(id);
  }
}

final savedTicketsProvider =
    NotifierProvider<SavedTicketsNotifier, List<SavedTicket>>(
      SavedTicketsNotifier.new,
    );
