import 'dart:io' show Platform;

import 'package:flutter/foundation.dart';

/// Central app configuration.
///
/// The backend base URL differs per platform during local development:
///  - Android emulator reaches the host machine via 10.0.2.2
///  - iOS simulator can use localhost directly
///  - Physical devices need the host's LAN IP or a deployed URL
///
/// Override at build/run time with:
///   flutter run --dart-define=QUEUEBN_API_URL=https://your-backend.example.com
class AppConfig {
  AppConfig._();

  static const int _backendPort = 4000;

  /// Optional compile-time override. Empty when not provided.
  static const String _override = String.fromEnvironment('QUEUEBN_API_URL');

  /// Base URL of the QueueBN Express API.
  static String get apiBaseUrl {
    if (_override.isNotEmpty) return _override;

    // Web/desktop dev: assume backend on same machine.
    if (kIsWeb) return 'http://localhost:$_backendPort';

    if (Platform.isAndroid) {
      // Android emulator special-cases the host loopback as 10.0.2.2.
      return 'http://10.0.2.2:$_backendPort';
    }

    // iOS simulator (and fallback) can use localhost.
    return 'http://localhost:$_backendPort';
  }

  /// How often the ticket status screen polls the backend.
  static const Duration ticketPollInterval = Duration(seconds: 5);

  /// How often the queue lists refresh.
  static const Duration listPollInterval = Duration(seconds: 10);

  /// Network timeout for API requests.
  static const Duration requestTimeout = Duration(seconds: 15);
}
