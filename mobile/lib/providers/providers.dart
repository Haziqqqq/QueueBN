import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../services/api_client.dart';
import '../services/queue_api.dart';
import '../services/ticket_store.dart';

/// Single shared HTTP client.
final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());

/// Typed QueueBN API, built on the shared client.
final queueApiProvider = Provider<QueueApi>(
  (ref) => QueueApi(ref.watch(apiClientProvider)),
);

/// Provides the SharedPreferences instance. Overridden in main() with the
/// resolved instance so the rest of the app can read it synchronously.
final sharedPreferencesProvider = Provider<SharedPreferences>(
  (ref) => throw UnimplementedError('sharedPreferencesProvider not overridden'),
);

/// Local persistence for saved tickets.
final ticketStoreProvider = Provider<TicketStore>(
  (ref) => TicketStore(ref.watch(sharedPreferencesProvider)),
);
