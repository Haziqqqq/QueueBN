/// Helpers for parsing values from the backend JSON.
///
/// The QueueBN API (Postgres via node-pg) serializes some numeric columns as
/// strings (e.g. COUNT(...) and NUMERIC), so these helpers accept either form.
library;

int parseInt(dynamic value, {int fallback = 0}) {
  if (value == null) return fallback;
  if (value is int) return value;
  if (value is num) return value.toInt();
  return int.tryParse(value.toString()) ?? fallback;
}

int? parseIntOrNull(dynamic value) {
  if (value == null) return null;
  if (value is int) return value;
  if (value is num) return value.toInt();
  return int.tryParse(value.toString());
}

double? parseDoubleOrNull(dynamic value) {
  if (value == null) return null;
  if (value is num) return value.toDouble();
  return double.tryParse(value.toString());
}

bool parseBool(dynamic value, {bool fallback = false}) {
  if (value == null) return fallback;
  if (value is bool) return value;
  final s = value.toString().toLowerCase();
  return s == 'true' || s == 't' || s == '1';
}

DateTime? parseDateOrNull(dynamic value) {
  if (value == null) return null;
  return DateTime.tryParse(value.toString())?.toLocal();
}
